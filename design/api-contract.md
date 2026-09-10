# Chat API Contract — Cancel Message & Message History

> **Status:** Draft — backend endpoints not implemented yet.
> This document is the contract the **Spring AI backend** must implement. The
> frontend service (`src/services/chatApi.ts`) and DTOs (`src/types/chat.ts`)
> are already written against it, so the shapes below are authoritative.

---

## 1. Overview

Two new endpoints complement the existing `POST /api/chat` SSE stream:

| Endpoint            | Method | Purpose                                                                                      |
| ------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `/api/chat/cancel`  | POST   | Stop an in-flight generation **server-side** (the client has already aborted its SSE fetch). |
| `/api/chat/history` | GET    | Fetch a conversation's messages (oldest-first) to render the transcript.                     |

Both are plain JSON (no SSE). They share the `/api/chat` prefix and the
`ChatRequest` identifiers (`id` = conversation id, `messageId` = assistant
message id) already used by `POST /api/chat`.

---

## 2. Conventions

- **Base URL:** same origin `/api` (Vite dev proxy → Spring AI backend on
  `:8080`), or `VITE_API_BASE` when pointing at a remote backend.
- **Content-Type:** `application/json` for request and response.
- **Timestamps:** epoch **milliseconds** (`number`), matching the UI's
  `createdAt`/`updatedAt` fields.
- **Errors:** non-2xx responses carry a JSON body
  `{ "error": "<human message>", "status": <http-status> }`. The frontend
  throws on non-OK and surfaces `error` when present.
- **Idempotency:** cancel is idempotent — cancelling a stream that already
  finished returns `200` with `status: "already-finished"`.

---

## 3. Cancel Message

### 3.1 Purpose

When the user clicks **Stop generating**, the UI:

1. Aborts its local SSE `fetch` (stops receiving tokens), **and**
2. Calls `POST /api/chat/cancel` so the backend stops the model generation
   server-side (otherwise the backend keeps burning tokens until it finishes).

The backend should locate the in-flight generation for
`conversationId` + `messageId` and interrupt it (e.g. cancel the reactive
stream / `Flux` backing that request).

### 3.2 Endpoint

```
POST /api/chat/cancel
```

### 3.3 Request body — `CancelRequest`

```json
{
  "conversationId": "conv-abc123",
  "messageId": "assistant-xyz789"
}
```

| Field            | Type   | Required | Description                                                          |
| ---------------- | ------ | -------- | -------------------------------------------------------------------- |
| `conversationId` | string | yes      | Conversation the stream belongs to (matches `ChatRequest.id`).       |
| `messageId`      | string | yes      | Assistant message being generated (matches `ChatRequest.messageId`). |

### 3.4 Response `200 OK` — `CancelResponse`

```json
{
  "conversationId": "conv-abc123",
  "messageId": "assistant-xyz789",
  "status": "cancelled",
  "cancelledAt": 1756742400000
}
```

| Field            | Type   | Description                                                                                                              |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `conversationId` | string | Echo of the request.                                                                                                     |
| `messageId`      | string | Echo of the request.                                                                                                     |
| `status`         | string | `"cancelled"` — generation was interrupted. `"already-finished"` — the stream had already completed (idempotent repeat). |
| `cancelledAt`    | number | Epoch ms when the backend stopped the stream.                                                                            |

### 3.5 Error responses

| Status | Body `error`                                  | When                                                                                |
| ------ | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `400`  | `"conversationId and messageId are required"` | Missing/invalid fields.                                                             |
| `404`  | `"No active stream for message <id>"`         | No in-flight generation matches the ids (e.g. never started, or already cancelled). |
| `500`  | `"Failed to cancel message"`                  | Backend failure.                                                                    |

### 3.6 Sample

```bash
curl -i -X POST http://localhost:8080/api/chat/cancel \
  -H 'Content-Type: application/json' \
  -d '{"conversationId":"conv-abc123","messageId":"assistant-xyz789"}'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"conversationId":"conv-abc123","messageId":"assistant-xyz789","status":"cancelled","cancelledAt":1756742400000}
```

---

## 4. Get Message History

### 4.1 Purpose

Hydrate the transcript (and sidebar title) for a conversation from the backend
instead of relying on `localStorage`. The UI calls this when opening a
conversation, and can page backwards through long histories with `before`.

### 4.2 Endpoint

```
GET /api/chat/history?conversationId={id}&limit={n}&before={ts}
```

### 4.3 Query parameters

| Param            | Type   | Required | Default | Description                                                                                |
| ---------------- | ------ | -------- | ------- | ------------------------------------------------------------------------------------------ |
| `conversationId` | string | yes      | —       | Conversation to load.                                                                      |
| `limit`          | number | no       | `100`   | Max messages to return (clamped to `500`).                                                 |
| `before`         | number | no       | —       | Epoch ms cursor — return messages created **strictly before** this (backwards pagination). |

### 4.4 Response `200 OK` — `ChatHistoryResponse`

```json
{
  "conversationId": "conv-abc123",
  "title": "Explain Vue 3 Composition API",
  "messages": [
    {
      "id": "user-1",
      "role": "user",
      "content": "Explain Vue 3 Composition API",
      "parts": [{ "type": "text", "text": "Explain Vue 3 Composition API" }],
      "createdAt": 1756742400000
    },
    {
      "id": "assistant-2",
      "role": "assistant",
      "content": "## Composition API\n\nUse `ref()` for primitives and `reactive()` for objects.",
      "parts": [
        {
          "type": "reasoning",
          "reasoning": "The user wants a Vue 3 explanation. I'll cover ref() vs reactive().",
          "duration": 1250
        },
        {
          "type": "text",
          "text": "## Composition API\n\nUse `ref()` for primitives and `reactive()` for objects."
        },
        {
          "type": "tool",
          "toolCallId": "call_01",
          "toolName": "search",
          "state": "output-available",
          "input": { "query": "Vue 3 Composition API" },
          "output": { "results": [{ "title": "Reactivity Fundamentals" }] }
        },
        {
          "type": "source",
          "sourceId": "src_01",
          "url": "https://vuejs.org/guide/introduction.html",
          "title": "Vue 3 Docs"
        }
      ],
      "createdAt": 1756742405000
    }
  ],
  "createdAt": 1756742400000,
  "updatedAt": 1756742405000,
  "hasMore": false
}
```

| Field            | Type    | Description                                                                                   |
| ---------------- | ------- | --------------------------------------------------------------------------------------------- |
| `conversationId` | string  | Echo of the query.                                                                            |
| `title`          | string? | Conversation title for the sidebar (may be absent for untitled chats).                        |
| `messages`       | array   | **Oldest-first**, ready to render in the transcript. Each item is a `ChatMessageDto` (below). |
| `createdAt`      | number  | Epoch ms of the first message.                                                                |
| `updatedAt`      | number  | Epoch ms of the last activity.                                                                |
| `hasMore`        | boolean | `true` when older messages exist before the returned window (i.e. paginate with `before`).    |

### 4.5 `ChatMessageDto`

Mirrors the UI's `ChatMessage` exactly so the transcript can render it without
mapping:

```json
{
  "id": "assistant-2",
  "role": "user | assistant | system",
  "content": "plain-text concatenation of text parts",
  "parts": ["<ChatPartDto>", "..."],
  "createdAt": 1756742405000
}
```

### 4.6 `ChatPartDto` (discriminated union on `type`)

| `type`      | Extra fields                                           | Notes                           |
| ----------- | ------------------------------------------------------ | ------------------------------- |
| `text`      | `text: string`                                         | Rendered via `MessageResponse`. |
| `reasoning` | `reasoning: string`, `duration?: number`               | Rendered via `Reasoning`.       |
| `tool`      | `toolCallId`, `toolName`, `state`, `input?`, `output?` | Rendered via `Tool`.            |
| `source`    | `sourceId`, `url`, `title?`                            | Rendered via `Sources`.         |

`tool.state` is one of `"input-streaming" | "input-available" | "output-available" | "output-error"`.
For persisted history the backend should emit `"output-available"` (or
`"output-error"` when the tool failed).

### 4.7 Error responses

| Status | Body `error`                    | When                          |
| ------ | ------------------------------- | ----------------------------- |
| `400`  | `"conversationId is required"`  | Missing query param.          |
| `404`  | `"Conversation <id> not found"` | No conversation with that id. |
| `500`  | `"Failed to load history"`      | Backend failure.              |

### 4.8 Sample

```bash
curl -i 'http://localhost:8080/api/chat/history?conversationId=conv-abc123&limit=50'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"conversationId":"conv-abc123","title":"Explain Vue 3 Composition API","messages":[...],"createdAt":1756742400000,"updatedAt":1756742405000,"hasMore":false}
```

---

## 5. DTO Reference (TypeScript)

The frontend types live in `src/types/chat.ts`:

```ts
// Cancel
export interface CancelRequest {
  conversationId: string
  messageId: string
}
export type CancelStatus = 'cancelled' | 'already-finished'
export interface CancelResponse {
  conversationId: string
  messageId: string
  status: CancelStatus
  cancelledAt: number
}

// History
export interface ChatHistoryQuery {
  conversationId: string
  limit?: number
  before?: number
}
export interface ChatHistoryResponse {
  conversationId: string
  title?: string
  messages: ChatMessage[] // reuses the existing UI message type
  createdAt: number
  updatedAt: number
  hasMore: boolean
}
```

---

## 6. Backend Mapping Notes (important)

The backend's internal `MessagePart` is **polymorphic** with type ids
`text, reasoning, file, source-url, step-start, step-finish, tool-invocation`
(Jackson `@JsonTypeInfo`). The history DTO uses the **UI's** part types
(`text, reasoning, tool, source`). When building `ChatHistoryResponse`, map:

| Backend part                          | DTO part                                                         |
| ------------------------------------- | ---------------------------------------------------------------- |
| `text`                                | `{ type: "text", text }`                                         |
| `reasoning`                           | `{ type: "reasoning", reasoning, duration? }`                    |
| `tool-invocation`                     | `{ type: "tool", toolCallId, toolName, state, input?, output? }` |
| `source-url`                          | `{ type: "source", sourceId, url, title? }`                      |
| `file` / `step-start` / `step-finish` | **skip** — not rendered by this UI.                              |

> Do **not** serialize the backend's native part ids into `parts` — the UI
> would not render them (and the reverse direction already fails with a 400,
> see repo notes).

---

## 7. Frontend Usage

```ts
import { cancelMessage, getMessageHistory } from '@/services/chatApi'

// Stop generating (client already aborted the SSE fetch)
await cancelMessage({ conversationId: conv.id, messageId: assistantId })

// Load a conversation's transcript
const history = await getMessageHistory({ conversationId: conv.id, limit: 100 })
```

The Pinia store wires these in:

- `store.stop()` → aborts the local stream **and** fires `cancelMessage`
  best-effort (failures are swallowed — the local abort already stops the UI).
- `store.loadHistory(conversationId)` → hydrates a conversation from the
  backend, falling back to the `localStorage` copy when the backend is
  unreachable.

---

## 8. Open Questions / Future

- **Auth:** no auth today (static user). When auth lands, both endpoints will
  need the user id (path/header) to scope history and cancel.
- **Pagination:** `before` + `hasMore` support backwards paging; a
  `GET /api/chat/conversations` list endpoint (for the sidebar) is a natural
  follow-up.
- **Cancel semantics:** if the backend cannot interrupt a stream mid-flight,
  `cancel` may instead mark the message `cancelled` and let the stream finish
  silently — the UI only needs the `200` to reconcile state.
