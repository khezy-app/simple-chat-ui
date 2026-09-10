import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type {
  ChatMessage,
  ChatPart,
  ChatStatus,
  ChatTrigger,
  Conversation,
  TextPart,
  ToolPart,
} from '@/types/chat'
import { CHAT_MODELS, STATIC_USER } from '@/types/chat'
import { cancelMessage, getMessageHistory, streamChat } from '@/services/chatApi'

const STORAGE_KEY = 'simple-chat-ui.conversations'

function loadConversations(): Conversation[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Conversation[]) : []
  } catch {
    return []
  }
}

/**
 * Chat state: history (conversations), the active conversation and the
 * streaming lifecycle. Conversations are persisted to localStorage so the
 * history list survives reloads — no auth, user is a static constant.
 */
export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>(loadConversations())
  const activeId = ref<string | null>(conversations.value[0]?.id ?? null)
  const status = ref<ChatStatus>('ready')
  const errorMessage = ref<string | null>(null)
  const selectedModel = ref<string>(CHAT_MODELS[0]!.id)

  let controller: AbortController | null = null

  const activeConversation = computed<Conversation | null>(
    () => conversations.value.find((c) => c.id === activeId.value) ?? null,
  )
  const activeMessages = computed<ChatMessage[]>(() => activeConversation.value?.messages ?? [])

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.value))
  }

  function newConversation(): Conversation {
    const conv: Conversation = {
      id: nanoid(),
      title: 'New chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    conversations.value.unshift(conv)
    activeId.value = conv.id
    status.value = 'ready'
    errorMessage.value = null
    persist()
    return conv
  }

  function selectConversation(id: string) {
    if (controller && id === activeId.value) stop()
    activeId.value = id
    status.value = 'ready'
    errorMessage.value = null
  }

  function deleteConversation(id: string) {
    if (controller && id === activeId.value) stop()
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (activeId.value === id) {
      activeId.value = conversations.value[0]?.id ?? null
    }
    persist()
  }

  // ------------------------------------------------------------------
  // Streaming
  // ------------------------------------------------------------------

  function updateAssistantMessage(assistantId: string, updater: (msg: ChatMessage) => void) {
    const msg = activeConversation.value?.messages.find((m) => m.id === assistantId)
    if (msg) updater(msg)
  }

  function createAssistantMessage(): ChatMessage {
    return {
      id: `assistant-${nanoid()}`,
      role: 'assistant',
      content: '',
      parts: [{ type: 'text', text: '' }],
      createdAt: Date.now(),
    }
  }

  /**
   * POST the current conversation and stream the response into the given
   * assistant placeholder. Shared by new messages and regenerations.
   */
  async function runStream(
    conv: Conversation,
    assistantMessage: ChatMessage,
    trigger: ChatTrigger,
  ) {
    status.value = 'submitted'
    errorMessage.value = null
    controller = new AbortController()

    const request = {
      id: conv.id,
      // Send plain-text `content` with empty `parts`: the backend's `MessagePart`
      // is polymorphic (ids: text, reasoning, file, source-url, step-start,
      // step-finish, tool-invocation) and its converter falls back to `content`
      // when `parts` is empty — sending our UI part shapes (tool/source) here
      // would fail Jackson deserialization with a 400.
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        parts: [],
      })),
      trigger,
      messageId: assistantMessage.id,
      model: selectedModel.value,
    } as const

    try {
      await streamChat(
        request,
        {
          onStart: () => {
            status.value = 'streaming'
          },
          onTextDelta: (_id, delta) => {
            status.value = 'streaming'
            updateAssistantMessage(assistantMessage.id, (msg) => {
              const last = msg.parts[msg.parts.length - 1]
              if (last?.type === 'text') {
                last.text += delta
              } else {
                msg.parts.push({ type: 'text', text: delta })
              }
              msg.content = msg.parts
                .filter((p): p is TextPart => p.type === 'text')
                .map((p) => p.text)
                .join('')
            })
          },
          onReasoningDelta: (_id, delta) => {
            status.value = 'streaming'
            updateAssistantMessage(assistantMessage.id, (msg) => {
              const existing = msg.parts.find((p) => p.type === 'reasoning')
              if (existing) {
                existing.reasoning += delta
              } else {
                msg.parts.push({ type: 'reasoning', reasoning: delta })
              }
            })
          },
          onToolInputStart: (toolCallId, toolName) => {
            status.value = 'streaming'
            updateAssistantMessage(assistantMessage.id, (msg) => {
              const existing = msg.parts.find(
                (p): p is ToolPart => p.type === 'tool' && p.toolCallId === toolCallId,
              )
              if (existing) {
                existing.toolName = toolName
                existing.state = 'input-streaming'
              } else {
                msg.parts.push({ type: 'tool', toolCallId, toolName, state: 'input-streaming' })
              }
            })
          },
          onToolInputAvailable: (toolCallId, _toolName, input) => {
            updateAssistantMessage(assistantMessage.id, (msg) => {
              const tool = msg.parts.find(
                (p): p is ToolPart => p.type === 'tool' && p.toolCallId === toolCallId,
              )
              if (tool) {
                tool.input = input
                tool.state = 'input-available'
              }
            })
          },
          onToolOutputAvailable: (toolCallId, output) => {
            updateAssistantMessage(assistantMessage.id, (msg) => {
              const tool = msg.parts.find(
                (p): p is ToolPart => p.type === 'tool' && p.toolCallId === toolCallId,
              )
              if (tool) {
                tool.output = output
                tool.state = 'output-available'
              }
            })
          },
          onSource: (source) => {
            updateAssistantMessage(assistantMessage.id, (msg) => {
              const exists = msg.parts.some(
                (p) => p.type === 'source' && p.sourceId === source.sourceId,
              )
              if (!exists) msg.parts.push({ type: 'source', ...source })
            })
          },
          onFinish: () => {
            status.value = 'ready'
            conv.updatedAt = Date.now()
            persist()
          },
          onError: (errorText) => {
            status.value = 'error'
            errorMessage.value = errorText
            updateAssistantMessage(assistantMessage.id, (msg) => {
              if (!msg.content) msg.content = `⚠️ ${errorText}`
            })
            persist()
          },
        },
        { signal: controller.signal },
      )
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        status.value = 'ready'
      } else {
        status.value = 'error'
        errorMessage.value = (err as Error).message
      }
    } finally {
      controller = null
      // Safety net: if the stream ended without a `finish` event.
      if (status.value !== 'ready' && status.value !== 'error') {
        status.value = 'ready'
      }
      conv.updatedAt = Date.now()
      persist()
    }
  }

  async function sendMessage(rawText: string, trigger: ChatTrigger = 'submit-message') {
    const text = rawText.trim()
    if (!text) return

    // 1. Ensure a conversation exists.
    let conv = activeConversation.value
    if (!conv) conv = newConversation()

    // 2. Append the user message.
    const userMessage: ChatMessage = {
      id: `user-${nanoid()}`,
      role: 'user',
      content: text,
      parts: [{ type: 'text', text }],
      createdAt: Date.now(),
    }
    conv.messages.push(userMessage)
    if (conv.title === 'New chat') {
      conv.title = text.length > 42 ? `${text.slice(0, 42)}…` : text
    }
    conv.updatedAt = Date.now()
    persist()

    // 3. Append the (initially empty) assistant message that the stream fills.
    const assistantMessage = createAssistantMessage()
    conv.messages.push(assistantMessage)
    conv.updatedAt = Date.now()
    persist()

    await runStream(conv, assistantMessage, trigger)
  }

  /**
   * Stop generating: abort the local SSE stream and, best-effort, tell the
   * backend to cancel the in-flight generation server-side. The cancel call is
   * fire-and-forget — the local abort already stops the UI, so failures are
   * swallowed (the backend may not implement `/api/chat/cancel` yet).
   */
  function stop() {
    const conv = activeConversation.value
    const assistantId = conv?.messages.find((m) => m.role === 'assistant')?.id
    controller?.abort()
    if (conv && assistantId) {
      void cancelMessage({ conversationId: conv.id, messageId: assistantId }).catch(() => {
        /* best-effort — local abort already stopped the UI */
      })
    }
  }

  /**
   * Hydrate a conversation's transcript from the backend
   * (`GET /api/chat/history`). Falls back to the local `localStorage` copy
   * when the backend is unreachable or the endpoint isn't implemented yet.
   */
  async function loadHistory(conversationId: string): Promise<void> {
    try {
      const history = await getMessageHistory({ conversationId })
      const existing = conversations.value.find((c) => c.id === conversationId)
      if (existing) {
        existing.title = history.title ?? existing.title
        existing.messages = history.messages
        existing.createdAt = history.createdAt
        existing.updatedAt = history.updatedAt
      } else {
        conversations.value.unshift({
          id: history.conversationId,
          title: history.title ?? 'New chat',
          messages: history.messages,
          createdAt: history.createdAt,
          updatedAt: history.updatedAt,
        })
      }
      persist()
    } catch {
      // Backend unavailable — keep whatever is in localStorage.
    }
  }

  function setModel(value: unknown) {
    selectedModel.value = typeof value === 'string' && value.length > 0 ? value : CHAT_MODELS[0]!.id
  }

  /**
   * Regenerate an assistant message: drop it (and anything after it) and
   * re-ask the last user prompt with trigger `regenerate-message`. The user
   * prompt is kept (not re-pushed) so it is never duplicated.
   */
  function regenerate(assistantMessageId: string) {
    if (controller) return // never regenerate while a stream is active
    const conv = activeConversation.value
    if (!conv) return
    const idx = conv.messages.findIndex((m) => m.id === assistantMessageId)
    if (idx === -1) return

    // Find the last user message at or before the target assistant message.
    let userIdx = -1
    for (let i = idx - 1; i >= 0; i--) {
      if (conv.messages[i]?.role === 'user') {
        userIdx = i
        break
      }
    }
    if (userIdx === -1) return

    // Drop the assistant response(s) that follow the user message.
    conv.messages = conv.messages.slice(0, userIdx + 1)
    conv.updatedAt = Date.now()

    // New placeholder for the regenerated response.
    const assistantMessage = createAssistantMessage()
    conv.messages.push(assistantMessage)
    conv.updatedAt = Date.now()
    persist()

    void runStream(conv, assistantMessage, 'regenerate-message')
  }

  function resetError() {
    errorMessage.value = null
  }

  return {
    // state
    conversations,
    activeId,
    status,
    errorMessage,
    selectedModel,
    // derived
    activeConversation,
    activeMessages,
    user: STATIC_USER,
    // actions
    newConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    regenerate,
    stop,
    loadHistory,
    setModel,
    resetError,
  }
})

export type ChatStore = ReturnType<typeof useChatStore>
