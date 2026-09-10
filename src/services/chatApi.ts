import type {
  CancelRequest,
  CancelResponse,
  ChatHistoryQuery,
  ChatHistoryResponse,
  ChatRequest,
} from '@/types/chat'

/**
 * Base URL for the chat API. Defaults to the same origin (`/api`) which the
 * Vite dev server proxies to the Spring AI backend. Override with
 * `VITE_API_BASE` to point at a remote/live backend (e.g. with the DeepSeek
 * profile) without the proxy.
 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

export interface ChatUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  reasoningTokens?: number
  cachedInputTokens?: number
}

export interface ChatSource {
  sourceId: string
  url: string
  title?: string
}

/**
 * Callbacks fired as the SSE stream is consumed. Each maps 1:1 to the
 * `SseEvent` variants emitted by the KHEZY `ai-elements-spring-ai` module.
 */
export interface ChatStreamHandlers {
  onStart?: (messageId?: string) => void
  onStartStep?: () => void
  onTextStart?: (id: string) => void
  onTextDelta?: (id: string, delta: string) => void
  onTextEnd?: (id: string) => void
  onReasoningStart?: (id: string) => void
  onReasoningDelta?: (id: string, delta: string) => void
  onReasoningEnd?: (id: string) => void
  onSource?: (source: ChatSource) => void
  onToolInputStart?: (toolCallId: string, toolName: string) => void
  onToolInputAvailable?: (toolCallId: string, toolName: string, input: unknown) => void
  onToolOutputAvailable?: (toolCallId: string, output: unknown) => void
  onFinishStep?: () => void
  onFinish?: (finishReason: string, usage?: ChatUsage) => void
  onError?: (errorText: string) => void
  onDone?: () => void
}

/**
 * POST a `ChatRequest` and consume the Vercel UI-message-stream over SSE.
 *
 * The body stream is read incrementally; complete `data:` frames are split on
 * the blank line (`\n\n`) that terminates every SSE event.
 */
export async function streamChat(
  request: ChatRequest,
  handlers: ChatStreamHandlers,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(request),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} ${response.statusText}`)
  }
  if (!response.body) {
    throw new Error('Chat response has no body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const processBlock = (block: string) => {
    for (const line of block.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') {
        handlers.onDone?.()
        continue
      }
      let event: Record<string, unknown>
      try {
        event = JSON.parse(payload) as Record<string, unknown>
      } catch {
        continue // skip malformed frames
      }
      dispatch(event, handlers)
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let boundary: number
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      processBlock(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
    }
  }
  if (buffer.trim()) processBlock(buffer)
}

function dispatch(event: Record<string, unknown>, handlers: ChatStreamHandlers) {
  const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
  switch (event.type) {
    case 'start':
      handlers.onStart?.(str(event.messageId))
      break
    case 'start-step':
      handlers.onStartStep?.()
      break
    case 'text-start':
      handlers.onTextStart?.(str(event.id) ?? '')
      break
    case 'text-delta':
      handlers.onTextDelta?.(str(event.id) ?? '', str(event.delta) ?? '')
      break
    case 'text-end':
      handlers.onTextEnd?.(str(event.id) ?? '')
      break
    case 'reasoning-start':
      handlers.onReasoningStart?.(str(event.id) ?? '')
      break
    case 'reasoning-delta':
      handlers.onReasoningDelta?.(str(event.id) ?? '', str(event.delta) ?? '')
      break
    case 'reasoning-end':
      handlers.onReasoningEnd?.(str(event.id) ?? '')
      break
    case 'source-url':
      handlers.onSource?.({
        sourceId: str(event.sourceId) ?? '',
        url: str(event.url) ?? '',
        title: str(event.title),
      })
      break
    case 'tool-input-start':
      handlers.onToolInputStart?.(str(event.toolCallId) ?? '', str(event.toolName) ?? '')
      break
    case 'tool-input-available':
      handlers.onToolInputAvailable?.(
        str(event.toolCallId) ?? '',
        str(event.toolName) ?? '',
        parseJson(event.inputJson ?? event.input),
      )
      break
    case 'tool-output-available':
      handlers.onToolOutputAvailable?.(str(event.toolCallId) ?? '', parseJson(event.output))
      break
    case 'finish-step':
      handlers.onFinishStep?.()
      break
    case 'finish':
      handlers.onFinish?.(
        str(event.finishReason) ?? 'unknown',
        event.usage as ChatUsage | undefined,
      )
      break
    case 'error':
      handlers.onError?.(str(event.errorText) ?? str(event.error) ?? 'Unknown error')
      break
    default:
      break
  }
}

/** `inputJson`/`output` arrive as raw JSON — decode them when possible. */
function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

/**
 * POST `/api/chat/cancel` to stop an in-flight generation server-side.
 *
 * The UI already aborts its local SSE `fetch` when the user hits Stop; this
 * tells the backend to interrupt the model stream too (otherwise it keeps
 * burning tokens until it finishes). Best-effort: callers may swallow errors
 * since the local abort already stops the UI.
 */
export async function cancelMessage(request: CancelRequest): Promise<CancelResponse> {
  const response = await fetch(`${API_BASE}/api/chat/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Cancel request failed'))
  }
  return (await response.json()) as CancelResponse
}

/**
 * GET `/api/chat/history` to hydrate a conversation's transcript
 * (oldest-first) from the backend.
 */
export async function getMessageHistory(query: ChatHistoryQuery): Promise<ChatHistoryResponse> {
  const params = new URLSearchParams({ conversationId: query.conversationId })
  if (query.limit !== undefined) params.set('limit', String(query.limit))
  if (query.before !== undefined) params.set('before', String(query.before))

  const response = await fetch(`${API_BASE}/api/chat/history?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(await errorMessage(response, 'History request failed'))
  }
  return (await response.json()) as ChatHistoryResponse
}

/**
 * Extract a human-readable message from a non-OK response. Prefers the
 * backend's `{ error }` body, falls back to a generic status line.
 */
async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'error' in body) {
      const err = (body as { error?: unknown }).error
      if (typeof err === 'string' && err.length > 0) return err
    }
  } catch {
    // non-JSON body — fall through
  }
  return `${fallback}: ${response.status} ${response.statusText}`
}
