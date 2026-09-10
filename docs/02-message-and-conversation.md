<!-- markdownlint-disable MD036 -->

# 02 · Message & Conversation

**Level:** Basic → Intermediate — render a chat transcript with `Conversation`
and `Message`, then level up with message versions, branch selectors, actions,
and streaming.

---

## Recipe 2.1 — A simple transcript with `Conversation`

**Problem**

You need a scrollable chat container that shows a conversation history with
auto-scroll behavior.

**Solution**

Use `Conversation` as the scroll container, `ConversationContent` for the list,
`ConversationEmptyState` for the placeholder, and `ConversationScrollButton` for
the "jump to bottom" button.

```vue
<script setup lang="ts">
import { MessageSquare } from '@lucide/vue'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { nanoid } from 'nanoid'

const messages = [
  { key: nanoid(), value: 'Hello, how are you?', from: 'user' },
  { key: nanoid(), value: "I'm good, thank you! How can I assist?", from: 'assistant' },
] as const
</script>

<template>
  <div class="h-[500px]">
    <Conversation class="relative size-full">
      <ConversationContent>
        <ConversationEmptyState
          v-if="messages.length === 0"
          title="Start a conversation"
          description="Messages will appear here as the conversation progresses."
        >
          <template #icon>
            <MessageSquare class="size-6" />
          </template>
        </ConversationEmptyState>

        <Message v-for="msg in messages" :key="msg.key" :from="msg.from">
          <MessageContent>
            {{ msg.value }}
          </MessageContent>
        </Message>
      </ConversationContent>

      <ConversationScrollButton />
    </Conversation>
  </div>
</template>
```

**Notes**

- `Message` takes a required `from` prop: `'user' | 'assistant'` — it controls
  alignment, bubble color, and avatar.
- `Conversation` provides the scroll viewport; `ConversationScrollButton`
  appears when you scroll away from the bottom.

---

## Recipe 2.2 — Rich assistant responses with `MessageResponse`

**Problem**

You want assistant messages to render **Markdown** with syntax-highlighted code
blocks (powered by Shiki).

**Solution**

Drop a `MessageResponse` inside `MessageContent` and pass the markdown string
plus your `shiki-options`.

```vue
<script setup lang="ts">
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'

const markdown = `## Vue 3 Composition API

Use \`ref()\` for primitives:

\`\`\`ts
const count = ref(0)
count.value++
\`\`\`
`
</script>

<template>
  <Message from="assistant">
    <MessageContent>
      <MessageResponse :content="markdown" :shiki-options="{ langs: ['ts', 'vue'] }" />
    </MessageContent>
  </Message>
</template>
```

**Notes**

- `MessageResponse` handles streaming content gracefully — pass updated content
  while tokens arrive (see Recipe 2.4).
- `shiki-options` lets you declare which languages to bundle (e.g. `ts`, `vue`).

---

## Recipe 2.3 — Message versions with a branch selector

**Problem**

Your AI can produce multiple versions of a reply (or you want to show the user
an "edited" variant). You need a branch selector to switch between them.

**Solution**

Wrap the versions in `MessageBranch`, render each version inside
`MessageBranchContent`, and add the selector controls.

```vue
<script setup lang="ts">
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from '@/components/ai-elements/message'

const versions = [
  { id: 'v1', content: 'First, concise answer…' },
  { id: 'v2', content: 'A more detailed answer with examples…' },
  { id: 'v3', content: 'A third, friendlier variant…' },
]

function handleBranchChange(index: number) {
  console.log('Branch changed to', index)
}
</script>

<template>
  <Message from="assistant">
    <MessageBranch :default-branch="0" @branch-change="handleBranchChange">
      <MessageBranchContent>
        <MessageContent v-for="v in versions" :key="v.id">
          <MessageResponse :content="v.content" :shiki-options="{ langs: ['ts'] }" />
        </MessageContent>
      </MessageBranchContent>

      <MessageToolbar>
        <MessageBranchSelector :from="'assistant'">
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
      </MessageToolbar>
    </MessageBranch>
  </Message>
</template>
```

**Notes**

- `:default-branch="0"` selects the first version on mount.
- The `@branch-change` event gives you the active branch index for analytics or
  state syncing.
- `MessageBranchSelector` can also render `:from="'user'"` for user-edited
  versions.

---

## Recipe 2.4 — Action buttons (retry / like / copy)

**Problem**

You want the classic toolbar on assistant messages: _Retry_, _Like_, _Dislike_,
_Copy_.

**Solution**

Use `MessageActions` + `MessageAction` with a `label` and `tooltip`; put your own
icon inside the slot.

```vue
<script setup lang="ts">
import { CopyIcon, RefreshCcwIcon, ThumbsDownIcon, ThumbsUpIcon } from '@lucide/vue'
import {
  Message,
  MessageActions,
  MessageAction,
  MessageContent,
} from '@/components/ai-elements/message'

const liked = ref(false)
const disliked = ref(false)

function handleCopy(content: string) {
  navigator.clipboard.writeText(content)
}
function handleRetry() {
  /* regenerate the assistant message */
}
</script>

<template>
  <Message from="assistant">
    <MessageContent>Answer text here</MessageContent>

    <MessageActions>
      <MessageAction label="Retry" tooltip="Regenerate response" @click="handleRetry">
        <RefreshCcwIcon class="size-4" />
      </MessageAction>

      <MessageAction label="Like" tooltip="Like this response" @click="liked = !liked">
        <ThumbsUpIcon class="size-4" :fill="liked ? 'currentColor' : 'none'" />
      </MessageAction>

      <MessageAction label="Dislike" tooltip="Dislike this response" @click="disliked = !disliked">
        <ThumbsDownIcon class="size-4" :fill="disliked ? 'currentColor' : 'none'" />
      </MessageAction>

      <MessageAction label="Copy" tooltip="Copy to clipboard" @click="handleCopy('answer text')">
        <CopyIcon class="size-4" />
      </MessageAction>
    </MessageActions>
  </Message>
</template>
```

**Notes**

- `MessageAction` renders an icon button; `label`/`tooltip` power accessibility
  and the hover tooltip.
- Put the `MessageActions` inside a `MessageToolbar` to dock it with the branch
  selector (see Recipe 2.3).

---

## Recipe 2.5 — Simulated streaming updates

**Problem**

You're prototyping a chat and want to show tokens "streaming" in while the
assistant types.

**Solution**

Keep message content in reactive state and push updated strings into
`MessageResponse` over time. This mirrors what you'll do with real AI SDK
streaming later.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'

const streamingContent = ref('')
const status = ref<'ready' | 'streaming'>('ready')

async function streamResponse(text: string) {
  status.value = 'streaming'
  streamingContent.value = ''
  const words = text.split(' ')
  for (let i = 0; i < words.length; i++) {
    streamingContent.value += (i > 0 ? ' ' : '') + words[i]
    await new Promise((r) => setTimeout(r, 60))
  }
  status.value = 'ready'
}
</script>

<template>
  <div class="h-[400px]">
    <Conversation>
      <ConversationContent>
        <Message from="assistant">
          <MessageContent>
            <MessageResponse :content="streamingContent" />
          </MessageContent>
        </Message>
      </ConversationContent>
    </Conversation>

    <button
      class="mt-4 rounded-md bg-primary px-4 py-2 text-white"
      @click="streamResponse('Hello! I am streaming this reply word by word.')"
    >
      Simulate streaming
    </button>
  </div>
</template>
```

**Notes**

- In production, replace the timer with the AI SDK's `streamText`/`useChat`
  text stream and feed `delta`s into the same reactive string.
- `MessageResponse` re-renders markdown + Shiki highlighting on each update.
