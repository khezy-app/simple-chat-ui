<!-- markdownlint-disable MD036 -->

# 09 · Full Chat Application

**Level:** Advanced — everything wired together: a complete, working chat UI
with `Conversation`, `Message` (branches, sources, reasoning, tools),
`PromptInput` (attachments, model selector, search toggle), and streaming
simulation. This is the "chatbot" reference recipe.

---

## Recipe 9.1 — The message data model

**Problem**

You need a data shape that can represent everything a message can contain:
multiple versions, sources, reasoning, and tool calls.

**Solution**

Model each message as a discriminated union keyed on `from`, with optional
`versions`, `sources`, `reasoning`, and `tools`. Use `nanoid` for stable keys.

```ts
// types.ts
import type { ToolUIPart } from 'ai'

export interface MessageVersion {
  id: string
  content: string
}

export interface MessageSource {
  href: string
  title: string
}

export interface MessageReasoning {
  content: string
  duration: number
}

export interface MessageTool {
  name: string
  description: string
  status: ToolUIPart['state']
  parameters: Record<string, unknown>
  result?: string
  error?: string
}

export interface MessageType {
  key: string
  from: 'user' | 'assistant'
  sources?: MessageSource[]
  versions: MessageVersion[]
  reasoning?: MessageReasoning
  tools?: MessageTool[]
}
```

**Notes**

- `versions` holds each alternative answer; `key` is used by `v-for` in
  `MessageBranch`.
- This mirrors the AI SDK's UI parts — in production, map `UIMessage`/`ToolUIPart`
  straight into this shape.

---

## Recipe 9.2 — Chat state & streaming helper

**Problem**

You want a small store of messages plus a function that "streams" an answer in
word by word so the UI feels live.

**Solution**

A `ref` of messages, plus `cloneMessages` (to keep reactivity when mutating
nested arrays) and a `streamResponse` timer. Swap the timer for the AI SDK's
stream in production.

```ts
// useChat.ts
import type {
  MessageType,
  MessageTool,
  MessageReasoning,
  MessageSource,
  MessageVersion,
} from './types'
import { nanoid } from 'nanoid'
import { ref } from 'vue'

export const status = ref<'ready' | 'streaming' | 'submitted'>('ready')

export const messages = ref<MessageType[]>(initialMessages())

function initialMessages(): MessageType[] {
  return [
    {
      key: nanoid(),
      from: 'user',
      versions: [{ id: nanoid(), content: 'Can you explain the Vue 3 Composition API?' }],
    },
    {
      key: nanoid(),
      from: 'assistant',
      sources: [{ href: 'https://vuejs.org/guide/introduction.html', title: 'Vue 3 Docs' }],
      tools: [
        {
          name: 'mcp',
          description: 'Searching Vue 3 documentation',
          status: 'output-available',
          parameters: { query: 'Composition API', source: 'vuejs.org' },
          result: `{ "results": [{ "title": "Reactivity Fundamentals" }] }`,
        },
      ],
      versions: [
        {
          id: nanoid(),
          content: '## Composition API\n\nUse `ref()` for primitives and `reactive()` for objects.',
        },
      ],
    },
  ]
}

export function cloneMessages(data: MessageType[]): MessageType[] {
  return data.map((m) => ({
    ...m,
    versions: m.versions.map((v) => ({ ...v })),
    sources: m.sources?.map((s) => ({ ...s })),
    reasoning: m.reasoning ? { ...m.reasoning } : undefined,
    tools: m.tools?.map((t) => ({ ...t, parameters: { ...t.parameters } })),
  }))
}

function updateStreamingContent(versionId: string, content: string) {
  const target = messages.value.find((m) => m.versions.some((v) => v.id === versionId))
  const version = target?.versions.find((v) => v.id === versionId)
  if (!version) return
  version.content = content
  messages.value = [...messages.value]
}

async function streamResponse(versionId: string, content: string) {
  status.value = 'streaming'
  const words = content.split(' ')
  let current = ''
  for (let i = 0; i < words.length; i++) {
    current += (i > 0 ? ' ' : '') + words[i]
    updateStreamingContent(versionId, current)
    await new Promise((r) => setTimeout(r, Math.random() * 100 + 50))
  }
  status.value = 'ready'
}

export function addUserMessage(content: string) {
  const userMessage: MessageType = {
    key: `user-${Date.now()}`,
    from: 'user',
    versions: [{ id: `user-${Date.now()}`, content }],
  }
  messages.value = [...messages.value, userMessage]

  setTimeout(() => {
    const id = `assistant-${Date.now()}`
    messages.value = [
      ...messages.value,
      { key: id, from: 'assistant', versions: [{ id, content: '' }] },
    ]
    void streamResponse(id, 'Here is a streaming answer for you…')
  }, 500)
}

export function handleSubmit(input: { text: string; files: unknown[] }) {
  const text = input.text.trim()
  const hasAttachments = input.files.length > 0
  if (!text && !hasAttachments) return
  status.value = 'submitted'
  addUserMessage(text || 'Sent with attachments')
}
```

**Notes**

- Reassigning `messages.value = [...]` after a nested mutation is what keeps the
  list reactive for `v-for`.
- Replace `streamResponse` with the AI SDK's `textStream`/`UIMessage` deltas to
  get real streaming.

---

## Recipe 9.3 — The template (part 1): transcript

**Problem**

You need the scrollable transcript with all per-message affordances.

**Solution**

Inside `Conversation`, iterate messages with `MessageBranch`. For each version
render `Sources`, `Reasoning`, tools, and `MessageResponse`. Show the branch
selector when there are multiple versions.

```vue
<!-- ChatTranscript.vue -->
<script setup lang="ts">
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
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
} from '@/components/ai-elements/message'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { messages } from './useChat'
</script>

<template>
  <Conversation class="relative size-full">
    <ConversationContent>
      <MessageBranch v-for="message in messages" :key="message.key" :default-branch="0">
        <MessageBranchContent>
          <Message
            v-for="version in message.versions"
            :key="`${message.key}-${version.id}`"
            :from="message.from"
          >
            <div>
              <!-- Sources above the answer -->
              <Sources v-if="message.sources?.length">
                <SourcesTrigger :count="message.sources.length" />
                <SourcesContent>
                  <Source
                    v-for="s in message.sources"
                    :key="s.href"
                    :href="s.href"
                    :title="s.title"
                  />
                </SourcesContent>
              </Sources>

              <!-- Reasoning above the answer -->
              <Reasoning
                v-if="message.reasoning"
                :duration="message.reasoning.duration"
                :is-streaming="false"
              >
                <ReasoningTrigger />
                <ReasoningContent :content="message.reasoning.content" />
              </Reasoning>

              <!-- Tool calls -->
              <Tool v-for="tool in message.tools" :key="tool.name" default-open>
                <ToolHeader :state="tool.status" :title="tool.name" :type="`tool-${tool.name}`" />
                <ToolContent>
                  <ToolInput :input="tool.parameters" />
                  <ToolOutput
                    v-if="tool.status === 'output-available'"
                    :output="tool.result"
                    :error-text="tool.error"
                  />
                </ToolContent>
              </Tool>

              <!-- The answer -->
              <MessageContent>
                <MessageResponse
                  :content="version.content"
                  :shiki-options="{ langs: ['ts', 'vue'] }"
                />
              </MessageContent>
            </div>
          </Message>
        </MessageBranchContent>

        <!-- Version switcher -->
        <MessageBranchSelector v-if="message.versions.length > 1" :from="message.from">
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
      </MessageBranch>
    </ConversationContent>

    <ConversationScrollButton />
  </Conversation>
</template>
```

**Notes**

- The `Message` is rendered once **per version** so each branch renders its own
  `MessageResponse`.
- `Tool` renders only when the assistant message carries tool data.

---

## Recipe 9.4 — The template (part 2): suggestions + input bar

**Problem**

You need the bottom section: quick suggestions and the full input bar wired to
`handleSubmit`.

**Solution**

Place `Suggestions` above a `PromptInputProvider`-wrapped `PromptInput` that
includes the model selector, search toggle, attachments menu, and a
status-aware submit button.

```vue
<!-- ChatComposer.vue -->
<script setup lang="ts">
import { CheckIcon, GlobeIcon } from '@lucide/vue'
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { computed, ref } from 'vue'
import { handleSubmit, status } from './useChat'

const models = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai', 'azure'],
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic', 'google'],
  },
]
const suggestions = [
  'Explain the Vue 3 Composition API with examples.',
  'What is the difference between ref() and reactive()?',
  'How does Vue reactivity work under the hood?',
]

const modelId = ref(models[0].id)
const modelSelectorOpen = ref(false)
const useWebSearch = ref(false)
const selectedModel = computed(() => models.find((m) => m.id === modelId.value))
</script>

<template>
  <div class="grid shrink-0 gap-4 pt-4">
    <Suggestions class="px-4">
      <Suggestion
        v-for="s in suggestions"
        :key="s"
        :suggestion="s"
        @click="(value: string) => handleSubmit({ text: value, files: [] })"
      />
    </Suggestions>

    <div class="w-full px-4 pb-4">
      <PromptInputProvider @submit="handleSubmit">
        <PromptInput multiple global-drop class="w-full">
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <PromptInputButton
                :variant="useWebSearch ? 'default' : 'ghost'"
                @click="useWebSearch = !useWebSearch"
              >
                <GlobeIcon :size="16" />
                <span>Search</span>
              </PromptInputButton>

              <ModelSelector v-model:open="modelSelectorOpen">
                <ModelSelectorTrigger as-child>
                  <PromptInputButton>
                    <ModelSelectorLogo
                      v-if="selectedModel?.chefSlug"
                      :provider="selectedModel.chefSlug"
                    />
                    <ModelSelectorName v-if="selectedModel">{{
                      selectedModel.name
                    }}</ModelSelectorName>
                  </PromptInputButton>
                </ModelSelectorTrigger>

                <ModelSelectorContent>
                  <ModelSelectorInput placeholder="Search models..." />
                  <ModelSelectorList>
                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                    <ModelSelectorGroup
                      v-for="chef in ['OpenAI', 'Anthropic']"
                      :key="chef"
                      :heading="chef"
                    >
                      <ModelSelectorItem
                        v-for="m in models.filter((x) => x.chef === chef)"
                        :key="m.id"
                        :value="m.id"
                        @select="
                          modelId = m.id
                          modelSelectorOpen = false
                        "
                      >
                        <ModelSelectorLogo :provider="m.chefSlug" />
                        <ModelSelectorName>{{ m.name }}</ModelSelectorName>
                        <ModelSelectorLogoGroup>
                          <ModelSelectorLogo v-for="p in m.providers" :key="p" :provider="p" />
                        </ModelSelectorLogoGroup>
                        <CheckIcon v-if="modelId === m.id" class="ml-auto size-4" />
                        <div v-else class="ml-auto size-4" />
                      </ModelSelectorItem>
                    </ModelSelectorGroup>
                  </ModelSelectorList>
                </ModelSelectorContent>
              </ModelSelector>
            </PromptInputTools>

            <PromptInputSubmit :disabled="status === 'streaming'" :status="status" />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  </div>
</template>
```

---

## Recipe 9.5 — Assembling the app shell

**Problem**

You want the final two-pane layout: transcript on top, composer on bottom.

**Solution**

A single `ChatApp.vue` with a flex column: `ChatTranscript` (flex-1) and
`ChatComposer` (shrink-0), separated by a divider.

```vue
<!-- ChatApp.vue -->
<script setup lang="ts">
import ChatComposer from './ChatComposer.vue'
import ChatTranscript from './ChatTranscript.vue'
</script>

<template>
  <div class="relative flex size-full flex-col divide-y overflow-hidden">
    <main class="min-h-0 flex-1">
      <ChatTranscript />
    </main>

    <footer class="shrink-0">
      <ChatComposer />
    </footer>
  </div>
</template>
```

**Notes**

- Give the root a fixed height (e.g. `h-screen` or `h-[600px]`) so
  `Conversation` can scroll internally.
- This mirrors the layout of the library's own `chatbot.vue` example.
