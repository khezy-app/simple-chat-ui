<!-- markdownlint-disable MD036 -->

# 04 · Reasoning & Thinking

**Level:** Basic → Intermediate — surface the model's "inner thoughts" and
streaming indicators. Covers `Reasoning`, `ChainOfThought`, and `Shimmer`.

---

## Recipe 4.1 — Collapsible `Reasoning` panel

**Problem**

Your model streams reasoning tokens before the final answer, and you want a
collapsible "Thought process" panel that opens while streaming and closes when
done.

**Solution**

`Reasoning` is a stateful wrapper: give it `:is-streaming`, add a
`ReasoningTrigger` (the toggle header) and a `ReasoningContent` that receives
the streamed text.

```vue
<script setup lang="ts">
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { onMounted, ref } from 'vue'

const content = ref('')
const isStreaming = ref(false)

const steps = [
  'Let me think about this problem step by step.',
  '\n\nFirst, I need to understand what the user is asking for.',
  '\n\nThey want a reasoning component that opens automatically when streaming begins.',
].join('')

let index = 0
function tick() {
  if (index >= steps.length) {
    isStreaming.value = false
    return
  }
  content.value += steps[index]
  index += 1
  setTimeout(tick, 40)
}

function startSimulation() {
  content.value = ''
  index = 0
  isStreaming.value = true
  tick()
}

onMounted(startSimulation)
</script>

<template>
  <Reasoning class="w-full" :is-streaming="isStreaming">
    <ReasoningTrigger />
    <ReasoningContent :content="content" />
  </Reasoning>
</template>
```

**Notes**

- `is-streaming` drives the auto open/close and the animated state of the
  trigger.
- In a real app, bind `content` to your AI SDK reasoning stream and
  `is-streaming` to whether the model is still generating.

---

## Recipe 4.2 — Reasoning inside a chat message

**Problem**

You want the reasoning panel to appear **above the answer** inside an assistant
`Message`, along with a duration badge.

**Solution**

Nest `Reasoning` inside `Message`, directly above `MessageContent`.

```vue
<script setup lang="ts">
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'

const reasoningText = 'First I parse the request. Then I look up the docs…'
const answer = 'You can use `ref()` for primitives and `reactive()` for objects.'
</script>

<template>
  <Message from="assistant">
    <Reasoning :duration="10" :is-streaming="false">
      <ReasoningTrigger />
      <ReasoningContent :content="reasoningText" />
    </Reasoning>

    <MessageContent>
      <MessageResponse :content="answer" :shiki-options="{ langs: ['ts'] }" />
    </MessageContent>
  </Message>
</template>
```

**Notes**

- `:duration` shows how long the model "thought" (in seconds) next to the
  trigger.

---

## Recipe 4.3 — `ChainOfThought` with steps and search results

**Problem**

You want a more elaborate "chain of thought" trace with discrete steps,
including inline images and search-result blocks (like a web-search agent).

**Solution**

Use `ChainOfThought` with a `ChainOfThoughtHeader`, `ChainOfThoughtContent`,
`ChainOfThoughtStep`s, and optional `ChainOfThoughtSearchResults`.

```vue
<script setup lang="ts">
import { DotIcon, ImageIcon, SearchIcon } from '@lucide/vue'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'

const isStreaming = ref(false)
</script>

<template>
  <ChainOfThought :is-streaming="isStreaming">
    <ChainOfThoughtHeader>
      <span class="flex items-center gap-2 text-sm">
        <DotIcon class="size-4" />
        Thinking…
      </span>
    </ChainOfThoughtHeader>

    <ChainOfThoughtContent>
      <ChainOfThoughtStep>
        <SearchIcon class="size-4" />
        <span>Searching the web for "Vue 3 reactivity"</span>
      </ChainOfThoughtStep>

      <ChainOfThoughtSearchResults>
        <ChainOfThoughtSearchResult
          title="Reactivity Fundamentals — Vue.js"
          url="https://vuejs.org/guide/essentials/reactivity-fundamentals.html"
        />
        <ChainOfThoughtSearchResult
          title="Composition API — Vue.js"
          url="https://vuejs.org/guide/extras/composition-api-faq.html"
        />
      </ChainOfThoughtSearchResults>

      <ChainOfThoughtStep>
        <ImageIcon class="size-4" />
        <span>Analyzing a screenshot the user attached</span>
      </ChainOfThoughtStep>

      <ChainOfThoughtImage src="https://example.com/screenshot.png" alt="User screenshot" />
    </ChainOfThoughtContent>
  </ChainOfThought>
</template>
```

**Notes**

- `ChainOfThought` and `Reasoning` serve similar purposes — pick
  `ChainOfThought` when you have discrete, structured steps (search, tools,
  images), and `Reasoning` for free-text thought streams.

---

## Recipe 4.4 — `Shimmer` loading text

**Problem**

While waiting for the first token, you want a subtle shimmering placeholder
instead of a spinner.

**Solution**

The `Shimmer` component animates its text/slot content.

```vue
<script setup lang="ts">
import { Shimmer } from '@/components/ai-elements/shimmer'
</script>

<template>
  <div class="flex items-center justify-center p-8">
    <Shimmer class="text-lg font-medium" />
    <!-- or pass content via the default slot -->
  </div>
</template>
```

**Notes**

- `Shimmer` accepts a `class` and renders animated gradient text; it's great in
  empty-stream states and skeleton text.
