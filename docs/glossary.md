# Glossary

A quick-reference dictionary for every term used throughout the cookbook —
components, AI SDK concepts, and the libraries they build on.

---

## Core concepts

- **AI Elements Vue** — A shadcn-vue–based Vue component library for building
  AI-native applications (chat, agent UIs, workflow canvases, vibe-coding
  surfaces). Source: <https://github.com/vuepont/ai-elements-vue>.
- **shadcn-vue** — A component distribution model for Vue where components are
  **copied into your project** as editable source rather than published as a
  dependency. AI Elements Vue is built on top of it.
- **CLI** — `npx ai-elements-vue@latest [add <component>]` installs components
  from the AI Elements registry into your project and adds their dependencies.
- **Component registry** — The JSON registry at
  `https://registry.ai-elements-vue.com/all.json` (or `<component>.json`) that
  the CLI/shadcn-vue CLI reads to know what files to install.
- **Components directory** — Where installed components live, configured by
  `components.json` (typically `src/components/ai-elements/`, aliased as
  `@/components/ai-elements/`).
- **CSS Variables mode** — shadcn-vue theming mode in which colors are stored as
  CSS custom properties (`--background`, `--primary`, …). Required by AI
  Elements Vue.
- **Design tokens** — Named values (colors, spacing) that components reference;
  change the CSS variables to re-theme the whole library.
- **AI SDK** — The `ai` npm package that provides model-agnostic streaming,
  tool calls, and the TypeScript types (`ToolUIPart`, `LanguageModelUsage`, …)
  the components are typed against.

---

## Chat UI

- **Conversation** — Scrollable chat container; manages the viewport and
  auto-scroll.
- **ConversationContent** — The scrollable list that holds `Message`s.
- **ConversationEmptyState** — Placeholder shown when there are no messages
  (accepts `title`, `description`, and an `#icon` slot).
- **ConversationScrollButton** — Floating "jump to latest" button that appears
  when scrolled up.
- **Message** — A single chat bubble; the `from` prop
  (`'user' | 'assistant'`) drives alignment/avatar/color.
- **MessageContent** — Wrapper for a message body.
- **MessageResponse** — Renders markdown with Shiki syntax highlighting
  (`content` + `shiki-options`); supports streaming updates.
- **MessageBranch** — Groups multiple versions of a reply with
  `default-branch` and `@branch-change`.
- **MessageBranchSelector / Previous / Page / Next** — Controls to switch
  between message versions.
- **MessageToolbar** — Dock for `MessageBranchSelector` + `MessageActions`.
- **MessageActions** — Row of `MessageAction` buttons (retry / like / dislike /
  copy).
- **MessageAction** — Icon button with `label` + `tooltip` and an icon slot.

---

## Input & selection

- **PromptInput** — The message-composer container. Props like `multiple`
  (multi-file) and `global-drop` (drag files anywhere).
- **PromptInputProvider** — Provides shared input/attachment state for
  everything inside; receives the `@submit` event with a `PromptInputMessage`
  (`{ text, files }`).
- **PromptInputTextarea** — Auto-resizing textarea (Enter submits,
  Shift+Enter newline).
- **PromptInputSubmit** — Submit button with `:status`
  (`'submitted' | 'streaming' | 'ready' | 'error'`) and `:disabled`.
- **PromptInputTools** — Toolbar row inside the footer.
- **PromptInputButton** — Styled button (variant `'default' | 'ghost'`) for
  custom tools.
- **PromptInputActionMenu / Trigger / Content / AddAttachments** — Popover menu
  with a file-attachment action.
- **ModelSelector** — Searchable model picker (combobox) with trigger, content,
  input, list, groups, and items.
- **ModelSelectorLogo / LogoGroup** — Renders provider logos (`openai`,
  `anthropic`, …).
- **Suggestion / Suggestions** — Clickable quick-reply chips above the input
  bar.

---

## Thinking & provenance

- **Reasoning** — Collapsible panel for streamed "thought process" text; takes
  `is-streaming` and `duration`.
- **ReasoningTrigger** — Toggle header for the reasoning panel.
- **ReasoningContent** — Body that receives the streamed reasoning `content`.
- **ChainOfThought** — Structured thinking trace with discrete steps, images,
  and search results (web-search agent style).
- **Shimmer** — Animated gradient text used as a streaming/loading placeholder.
- **Sources** — Collapsible "N sources" block above an answer.
- **Source** — A single source link (`href` + `title`).
- **InlineCitation** — Superscript citation chip embedded in flowing text with
  a popover card.
- **Context** — Hover card showing token usage (`usedTokens`, `maxTokens`,
  `modelId`, `usage`).
- **ContextInputUsage / OutputUsage / ReasoningUsage / CacheUsage** — Usage rows
  rendered inside the context card.

---

## Agent execution

- **Tool** — Collapsible card for a tool invocation.
- **ToolHeader** — Header with the tool `title`, `type`, and `state` badge.
- **ToolInput** — Renders the tool's input/arguments.
- **ToolOutput** — Renders the tool's result (markdown/table) or an
  `error-text`.
- **Confirmation** — Approval widget for risky tool executions; state mirrors
  `ToolUIPart` (`approval-requested`, `approval-responded`, …).
- **ConfirmationRequest / Accepted / Rejected** — Alternate title content based
  on the approval state.
- **ConfirmationActions / Action** — Accept/Reject buttons.
- **Queue** — Collapsible list of queued messages/todos with attachments and
  actions.
- **Task** — ChatGPT-style collapsible checklist.
- **TaskItem / TaskItemFile** — A checklist row and its related file chip.
- **Plan** — Card-based plan display with header, content, footer, and actions.
- **Checkpoint** — Conversation checkpoint/resume affordance.

---

## Vibe-coding & utilities

- **Artifact** — Full-screen collapsible panel for generated code/documents,
  with actions (run/copy/download/share) and close.
- **Terminal** — Terminal-style output renderer with ANSI color support,
  streaming flag, auto-scroll, copy and clear actions.
- **FileTree** — Expandable project file-tree.
- **CodeBlock** — Standalone Shiki code block with filename header, copy
  button, and optional language selector.
- **Image** — Display for AI-generated images (accepts
  `Experimental_GeneratedImage` data).
- **Loader / LoaderIcon** — Spinners sized for buttons/pages.
- **WebPreview** — Embedded web page preview with a URL bar and console toggle.
- **OpenIn** — "Open in ChatGPT/Claude/Cursor…" share button for a message.
- **Agent / Persona / Sandbox / Snippet / SchemaDisplay / PackageInfo / Commit /
  StackTrace** — Additional agent-authoring and code-tooling components
  available in the library.

---

## Workflow canvas

- **Canvas** — Vue Flow wrapper (`<VueFlow>`); accepts nodes, edges, node/edge
  types, and slots for overlays.
- **Node** — Card-based graph node with `NodeHeader`, `NodeTitle`,
  `NodeContent`, `NodeDescription`, `NodeFooter`; registers connection handles.
- **Edge** — Custom edge renderer; built-ins are `Animated` (animated bezier)
  and `Temporary` (drag-ghost edge).
- **Connection** — Custom rendering for connections between nodes.
- **Controls** — Zoom-in/out, fit-view, and lock controls.
- **Panel** — Positioned overlay (`top-left`, `bottom-right`, …).
- **Toolbar** — Action strip for node/workflow operations.
- **Vue Flow** — The underlying graph library (`@vue-flow/core`).

---

## Voice & media

- **AudioPlayer** — Audio playback with play/mute/seek controls; accepts data
  URLs or remote `src`.
- **SpeechInput** — Mic button that captures speech and emits a live
  `transcription-change`.
- **MicSelector** — Searchable microphone picker (combobox over
  `MediaDeviceInfo`).
- **VoiceSelector** — Voice picker with accent, age, and attribute bullets.
- **Transcription** — Renders segmented transcription rows from an
  `Experimental_TranscriptionResult`.

---

## AI SDK concepts

- **UIMessage** — The AI SDK's UI-friendly message shape.
- **ToolUIPart** — A UI part describing a tool call (input, output, state) or an
  approval request; the base type for `Tool`, `Confirmation`, etc.
- **Tool call state** — Lifecycle states used by `ToolHeader`/`Confirmation`:
  `input-streaming`, `input-available`, `approval-requested`,
  `approval-responded`, `output-available`, `output-error`, `output-denied`.
- **respondToConfirmationRequest()** — AI SDK function to approve/reject a
  pending tool request.
- **LanguageModelUsage** — Token accounting (`inputTokens`, `outputTokens`,
  `totalTokens`, caching details) used by `Context`.
- **ChatStatus** — Status union (`'ready' | 'submitted' | 'streaming'`) used to
  drive `PromptInputSubmit`.
- **FileUIPart / SourceDocumentUIPart** — Attachment part types that
  `AttachmentData` extends.
- **Experimental_GeneratedImage** — Type for AI-generated images (base64 +
  mediaType or url).
- **Experimental_SpeechResult** — Type for TTS results (audio value + mime).
- **Experimental_TranscriptionResult** — Type for transcription results
  (text + segments).
- **Streaming** — Incrementally delivering model output; components like
  `MessageResponse`, `ReasoningContent`, and `Terminal` render streamed text.

---

## Libraries & tooling

- **Shiki** — Syntax highlighter used by `CodeBlock` and `MessageResponse`
  (`BundledLanguage`, `BundledTheme`).
- **@lucide/vue** — Icon library used throughout the examples (`@lucide/vue`).
- **nanoid** — Tiny ID generator used for stable message/version keys.
- **Tailwind CSS** — Utility CSS framework; components use `class` props and
  shadcn CSS-variable tokens.
- **reka-ui** — Headless component primitives that shadcn-vue (and these
  components) are built on.
