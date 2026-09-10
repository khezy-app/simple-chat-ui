/**
 * Wire types for the KHEZY `ai-elements` Spring AI backend
 * (see /mnt/data/khezylib/khezy-boot/ai/ai-elements/ai-elements-model).
 *
 * Request:  `ChatRequest { id, messages: [{ id, role, content, parts }], trigger, messageId }`
 * Response: Vercel UI-message-stream over SSE — events `start`, `start-step`,
 *           `text-*`, `reasoning-*`, `source-url`, `tool-*`, `finish-step`,
 *           `finish`, `error`, and the `[DONE]` sentinel.
 */

export type MessageRole = 'user' | 'assistant' | 'system'

export type ChatTrigger = 'submit-message' | 'regenerate-message' | 'resume-stream'

/** Mirrors `ToolUIPart['state']` for the tool parts we render. */
export type ToolState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error'

export interface ReasoningPart {
  type: 'reasoning'
  reasoning: string
  duration?: number
}

export interface TextPart {
  type: 'text'
  text: string
}

export interface ToolPart {
  type: 'tool'
  toolCallId: string
  toolName: string
  state: ToolState
  /** Parsed tool input (JSON decoded). */
  input?: unknown
  /** Parsed tool output (JSON decoded). */
  output?: unknown
}

export interface SourcePart {
  type: 'source'
  sourceId: string
  url: string
  title?: string
}

export type ChatPart = ReasoningPart | TextPart | ToolPart | SourcePart

export interface ChatMessage {
  id: string
  role: MessageRole
  /** Plain-text concatenation of the text parts (what we send back to the API). */
  content: string
  parts: ChatPart[]
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface ChatRequestMessage {
  id: string
  role: MessageRole
  content: string
  parts?: ChatPart[]
}

/** Exact shape of `POST /api/chat` (matches the Java `ChatRequest` record). */
export interface ChatRequest {
  id: string
  messages: ChatRequestMessage[]
  trigger: ChatTrigger
  messageId: string | null
  /**
   * Optional model id. Currently UI-level (the Spring AI backend uses its own
   * configured model, e.g. `deepseek-v4-flash`); Spring Boot ignores unknown
   * JSON fields by default, so this is safe to send and ready for a backend
   * that accepts it.
   */
  model?: string
}

/** Reflects the request lifecycle; drives the `PromptInputSubmit` status. */
export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

// ---------------------------------------------------------------------------
// Cancel message — POST /api/chat/cancel
// ---------------------------------------------------------------------------

/** Body of `POST /api/chat/cancel`. Identifies the in-flight generation. */
export interface CancelRequest {
  /** Conversation the stream belongs to (matches `ChatRequest.id`). */
  conversationId: string
  /** Assistant message being generated (matches `ChatRequest.messageId`). */
  messageId: string
}

/** Outcome of a cancel request. */
export type CancelStatus = 'cancelled' | 'already-finished'

/** Response of `POST /api/chat/cancel`. */
export interface CancelResponse {
  conversationId: string
  messageId: string
  status: CancelStatus
  /** Epoch ms when the backend stopped the stream. */
  cancelledAt: number
}

// ---------------------------------------------------------------------------
// Message history — GET /api/chat/history
// ---------------------------------------------------------------------------

/** Query params of `GET /api/chat/history`. */
export interface ChatHistoryQuery {
  conversationId: string
  /** Max messages to return (backend clamps to 500). Default 100. */
  limit?: number
  /** Epoch ms cursor — return messages created strictly before this. */
  before?: number
}

/**
 * Response of `GET /api/chat/history`. `messages` are oldest-first and reuse
 * the UI's `ChatMessage` shape so the transcript renders them directly.
 */
export interface ChatHistoryResponse {
  conversationId: string
  /** Conversation title for the sidebar (absent for untitled chats). */
  title?: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  /** True when older messages exist before the returned window. */
  hasMore: boolean
}

/** Static user for testing — no auth. */
export const STATIC_USER = {
  name: 'Tester',
  email: 'tester@local.dev',
  initials: 'TS',
} as const

export interface ModelOption {
  id: string
  label: string
}

/** Models offered by the header selector (matches the backend's DeepSeek setup). */
export const CHAT_MODELS: ModelOption[] = [
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat' },
  { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
]
