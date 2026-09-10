# simple-chat-ui

A standard two-pane **chat UI** built with Vue 3 + Vite + Pinia and
[**AI Elements Vue**](https://github.com/vuepont/ai-elements-vue), wired to a
**Spring AI** backend (the KHEZY `ai-elements` SSE stream) for end-to-end testing.

## Layout

```
┌──────────────────────────┬───────────────────────────────────────────┐
│  ChatSidebar (history)   │  ChatView                                 │
│  • + New chat            │  Header (title · Spring AI · SSE status)  │
│  • conversation 1        │  Conversation (ai-elements)               │
│  • conversation 2        │    Message / Reasoning / Tool / Sources   │
│  • …                     │  PromptInput (ai-elements)                │
│  ──────────────────      │                                           │
│  User card (static)      │                                           │
└──────────────────────────┴───────────────────────────────────────────┘
```

- **Left**: `ChatSidebar.vue` — history list (persisted to `localStorage`) + static user (no auth).
- **Right**: `ChatView.vue` — header with **model selector** + **stop** button, `Conversation` + `Message`/`MessageResponse` transcript, `PromptInput`.
- **Per message**: reasoning, tool calls, sources and markdown text are rendered via the ai-elements `Reasoning`, `Tool`, `Sources`, `MessageResponse` components; assistant messages have a **regenerate** action.
- Streaming: `src/services/chatApi.ts` POSTs the Java `ChatRequest` shape to `/api/chat` and parses the Vercel UI-message-stream SSE events into the transcript (`src/stores/chat.ts`).

## Run (E2E)

### 1. Backend — KHEZY `ai-elements` Spring AI sample

**Mock mode** (no API key, canned reasoning/tool/text stream — port 8080):

```sh
/mnt/data/khezylib/khezy-boot/gradlew \
  -p /mnt/data/khezylib/khezy-boot/ai/ai-elements/samples/ai-elements-sample bootRun
```

**Live DeepSeek mode** (real model stream with reasoning/tools/sources — set your key):

```sh
DEEPSEEK_API_KEY=sk-... /mnt/data/khezylib/khezy-boot/gradlew \
  -p /mnt/data/khezylib/khezy-boot/ai/ai-elements/samples/ai-elements-sample \
  bootRun --args='--spring.profiles.active=deepseek'
```

> The backend decides which model to use (`deepseek-v4-flash`). The UI's model
> selector is UI-level for now — the selected model is passed through in the
> request body (Spring Boot ignores unknown fields) so it's ready when the
> backend accepts it.

### 2. Frontend (port 5173, proxies `/api` → `localhost:8080`)

```sh
npm install
npm run dev
```

Pointing at a remote/live backend without the proxy: set `VITE_API_BASE` (e.g.
`VITE_API_BASE=http://localhost:8080 npm run dev`).

3. Open the printed URL, click **New chat**, type a message, hit Enter.

## Scripts

```sh
npm run dev          # dev server (proxies /api → localhost:8080)
npm run build        # type-check + production build
npm run test:unit    # vitest
npm run lint         # oxlint + eslint
```

## Project Setup

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
