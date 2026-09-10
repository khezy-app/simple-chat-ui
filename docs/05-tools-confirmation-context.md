<!-- markdownlint-disable MD036 -->

# 05 · Tools, Confirmation & Context

**Level:** Intermediate — visualize tool calls, let users approve risky
executions, and show token usage. Also covers `CodeBlock` for rendering
tool input/output.

---

## Recipe 5.1 — Render a tool call (`Tool` + `ToolInput` + `ToolOutput`)

**Problem**

Your agent called a tool and you want to show its input and (markdown) output
in the chat, collapsing to a header when not relevant.

**Solution**

`Tool` is a collapsible wrapper. `ToolHeader` shows the state + title; `ToolInput`
renders the arguments; `ToolOutput` renders the result (optionally as a table).

```vue
<script setup lang="ts">
import type { ToolUIPart } from 'ai'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'

const toolCall: ToolUIPart = {
  type: 'tool-database_query',
  toolCallId: 'call_1',
  state: 'output-available',
  input: {
    query: 'SELECT COUNT(*) FROM users WHERE created_at >= ?',
    params: ['2024-01-01'],
    database: 'analytics',
  },
  output: `| User ID | Name | Created At |
|---------|------|------------|
| 1 | John Doe | 2024-01-15 |
| 2 | Jane Smith | 2024-01-20 |`,
}
</script>

<template>
  <Tool default-open>
    <ToolHeader :state="toolCall.state" title="database_query" :type="toolCall.type" />
    <ToolContent>
      <ToolInput :input="toolCall.input" />
      <ToolOutput v-if="toolCall.state === 'output-available'" :output="toolCall.output" />
    </ToolContent>
  </Tool>
</template>
```

**Notes**

- `ToolHeader` accepts `state` (a `ToolUIPart['state']`) — e.g.
  `'input-streaming'`, `'input-available'`, `'output-available'`,
  `'output-error'`, `'output-denied'`.
- `ToolInput` renders JSON-ish input; `ToolOutput` renders markdown/tables.
- The `type` prop can be any string like `tool-database_query` — it only affects
  the icon/colors.

---

## Recipe 5.2 — Tool error states

**Problem**

You want to show a failed tool call with the error message.

**Solution**

Use `state="output-error"` and pass `error-text`.

```vue
<script setup lang="ts">
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
</script>

<template>
  <Tool>
    <ToolHeader state="output-error" title="database_query" type="tool-database_query" />
    <ToolContent>
      <ToolInput :input="{ query: 'SELECT * FROM users', database: 'analytics' }" />
      <ToolOutput
        :output="undefined"
        error-text="Connection timeout: Unable to reach database server"
      />
    </ToolContent>
  </Tool>
</template>
```

---

## Recipe 5.3 — Approval workflow with `Confirmation`

**Problem**

A tool wants to run something risky (e.g. delete a file). You must show
Accept / Reject buttons and reflect the outcome.

**Solution**

Pair `Tool` with `Confirmation`. The `state` prop controls which part of the
title renders: the `ConfirmationRequest` (question), `ConfirmationAccepted`
(success), or `ConfirmationRejected` (denied).

```vue
<script setup lang="ts">
import type { ToolUIPart } from 'ai'
import { CheckIcon, XIcon } from '@lucide/vue'
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from '@/components/ai-elements/confirmation'
import { Tool, ToolContent, ToolHeader, ToolInput } from '@/components/ai-elements/tool'
import { nanoid } from 'nanoid'
import { ref } from 'vue'

const approval = ref({ id: nanoid() })
const state = ref<ToolUIPart['state']>('approval-requested')

function handleReject() {
  // In production: await respondToConfirmationRequest({ approved: false })
  state.value = 'output-denied'
  approval.value = { id: nanoid(), approved: false, reason: 'User rejected' }
}

function handleApprove() {
  // In production: await respondToConfirmationRequest({ approved: true })
  state.value = 'output-available'
  approval.value = { id: nanoid(), approved: true }
}
</script>

<template>
  <Tool>
    <ToolHeader state="approval-requested" title="delete_file" type="tool-delete_file" />
    <ToolContent>
      <ToolInput :input="{ path: '/tmp/example.txt' }" />

      <Confirmation :approval="approval" :state="state">
        <ConfirmationTitle>
          <ConfirmationRequest>
            This tool wants to delete
            <code class="rounded bg-muted px-1.5 py-0.5 text-sm">/tmp/example.txt</code>. Do you
            approve?
          </ConfirmationRequest>

          <ConfirmationAccepted>
            <CheckIcon class="size-4 text-green-600 dark:text-green-400" />
            <span>You approved this tool execution</span>
          </ConfirmationAccepted>

          <ConfirmationRejected>
            <XIcon class="size-4 text-destructive" />
            <span>You rejected this tool execution</span>
          </ConfirmationRejected>
        </ConfirmationTitle>

        <ConfirmationActions>
          <ConfirmationAction variant="outline" @click="handleReject">Reject</ConfirmationAction>
          <ConfirmationAction variant="default" @click="handleApprove">Approve</ConfirmationAction>
        </ConfirmationActions>
      </Confirmation>
    </ToolContent>
  </Tool>
</template>
```

**Notes**

- `Confirmation` mirrors the AI SDK's `ToolUIPart` approval flow
  (`approval-requested` → `approval-responded`/`output-*`). Wire the buttons to
  `respondToConfirmationRequest()` from the AI SDK.
- Pass `approved: false` + a `reason` to the `approval` object to render the
  rejection reason.

---

## Recipe 5.4 — Token usage with `Context`

**Problem**

You want to display how much context (input/output/cache/reasoning tokens) a
response consumed.

**Solution**

`Context` is a hover-card. Give it `usedTokens`, `maxTokens`, `modelId` and the
AI SDK `LanguageModelUsage`, then compose the usage rows.

```vue
<script setup lang="ts">
import type { LanguageModelUsage } from 'ai'
import {
  Context,
  ContextCacheUsage,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextTrigger,
} from '@/components/ai-elements/context'

const usageData: LanguageModelUsage = {
  inputTokens: 32000,
  inputTokenDetails: { noCacheTokens: 32000, cacheReadTokens: 0, cacheWriteTokens: 0 },
  outputTokens: 8000,
  outputTokenDetails: { textTokens: 8000, reasoningTokens: 0 },
  totalTokens: 40000,
  cachedInputTokens: 0,
  reasoningTokens: 0,
}

const contextProps = {
  usedTokens: 40000,
  maxTokens: 128000,
  modelId: 'openai:gpt-5',
  usage: usageData,
}
</script>

<template>
  <div class="flex items-center justify-center p-8">
    <Context v-bind="contextProps">
      <ContextTrigger />

      <ContextContent>
        <ContextContentHeader />
        <ContextContentBody>
          <ContextInputUsage />
          <ContextOutputUsage />
          <ContextReasoningUsage />
          <ContextCacheUsage />
        </ContextContentBody>
        <ContextContentFooter />
      </ContextContent>
    </Context>
  </div>
</template>
```

**Notes**

- `ContextTrigger` renders the compact "tokens used / max" badge.
- Each `*Usage` row reads from the `usage` prop you pass to `Context`.
- Drop it in the header/footer of an assistant message for a ChatGPT-style
  token readout.

---

## Recipe 5.5 — `CodeBlock` (standalone, with copy & language switcher)

**Problem**

You want to display code anywhere (not just inside messages) with a filename
header, a copy button, and a language selector.

**Solution**

Use `CodeBlock` with `CodeBlockHeader`, `CodeBlockTitle`/`CodeBlockFilename`,
`CodeBlockActions`, and a `CodeBlockLanguageSelector`.

```vue
<script setup lang="ts">
import type { BundledLanguage } from 'shiki'
import { FileIcon } from '@lucide/vue'
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockLanguageSelector,
  CodeBlockLanguageSelectorContent,
  CodeBlockLanguageSelectorItem,
  CodeBlockLanguageSelectorTrigger,
  CodeBlockLanguageSelectorValue,
  CodeBlockTitle,
} from '@/components/ai-elements/code-block'
import { computed, ref } from 'vue'

const codeExamples = {
  typescript: {
    filename: 'greet.ts',
    code: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
console.log(greet("World"));`,
  },
  python: {
    filename: 'greet.py',
    code: `def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))`,
  },
} as const

type Language = keyof typeof codeExamples
const language = ref<Language>('typescript')
const current = computed(() => codeExamples[language.value])

function handleCopy() {
  console.log('Copied!')
}
function handleError() {
  console.error('Copy failed')
}
</script>

<template>
  <CodeBlock :code="current.code" :language="language as BundledLanguage">
    <CodeBlockHeader>
      <CodeBlockTitle>
        <FileIcon :size="14" />
        <CodeBlockFilename>{{ current.filename }}</CodeBlockFilename>
      </CodeBlockTitle>

      <CodeBlockActions>
        <CodeBlockLanguageSelector v-model="language">
          <CodeBlockLanguageSelectorTrigger>
            <CodeBlockLanguageSelectorValue />
          </CodeBlockLanguageSelectorTrigger>
          <CodeBlockLanguageSelectorContent>
            <CodeBlockLanguageSelectorItem
              v-for="lang in Object.keys(codeExamples) as Language[]"
              :key="lang"
              :value="lang"
            >
              {{ lang }}
            </CodeBlockLanguageSelectorItem>
          </CodeBlockLanguageSelectorContent>
        </CodeBlockLanguageSelector>

        <CodeBlockCopyButton @copy="handleCopy" @error="handleError" />
      </CodeBlockActions>
    </CodeBlockHeader>
  </CodeBlock>
</template>
```

**Notes**

- `:language` is a Shiki `BundledLanguage` — the highlighter runs client-side.
- `CodeBlockCopyButton` emits `@copy` on success and `@error` on failure so you
  can show a toast.
