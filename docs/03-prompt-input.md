<!-- markdownlint-disable MD036 -->

# 03 · Prompt Input & Model Selector

**Level:** Basic → Intermediate — the input bar is the heart of a chat app.
This chapter covers `PromptInput` (with textarea, attachments, submit states)
and `ModelSelector` (searchable model picker).

---

## Recipe 3.1 — Minimal `PromptInput` with submit handling

**Problem**

You need a functional message box that emits the submitted text.

**Solution**

`PromptInput` manages state via `PromptInputProvider`, and the `@submit` event
delivers a `PromptInputMessage` shaped like `{ text: string; files: FileUIPart[] }`.

```vue
<script setup lang="ts">
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'

function handleSubmit(message: PromptInputMessage) {
  const text = message.text.trim()
  const hasAttachments = message.files.length > 0
  if (!text && !hasAttachments) return
  console.log('Sending:', text)
}
</script>

<template>
  <PromptInputProvider @submit="handleSubmit">
    <PromptInput class="w-full">
      <PromptInputBody>
        <PromptInputTextarea />
      </PromptInputBody>

      <PromptInputFooter>
        <PromptInputSubmit />
      </PromptInputFooter>
    </PromptInput>
  </PromptInputProvider>
</template>
```

**Notes**

- `PromptInputProvider` wires up shared input/attachment state for everything
  inside it. It is required to make `PromptInput` functional.
- `PromptInputTextarea` auto-resizes and handles Enter-to-submit / Shift+Enter
  for newlines.

---

## Recipe 3.2 — Submit with loading states (submitted / streaming / ready)

**Problem**

You want the submit button to reflect the request lifecycle — disabled while
streaming, showing a spinner, then back to ready.

**Solution**

Drive the `:status` prop of `PromptInputSubmit` from your app state.

```vue
<script setup lang="ts">
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import { ref } from 'vue'

const SUBMITTING_TIMEOUT = 200
const STREAMING_TIMEOUT = 2000
const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>('ready')

function handleSubmit(message: PromptInputMessage) {
  if (!message.text.trim() && !message.files?.length) return

  status.value = 'submitted'
  // …actually call your API here…

  setTimeout(() => (status.value = 'streaming'), SUBMITTING_TIMEOUT)
  setTimeout(() => (status.value = 'ready'), STREAMING_TIMEOUT)
}
</script>

<template>
  <PromptInputProvider @submit="handleSubmit">
    <PromptInput class="w-full">
      <PromptInputBody>
        <PromptInputTextarea />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputSubmit :disabled="status === 'streaming'" :status="status" />
      </PromptInputFooter>
    </PromptInput>
  </PromptInputProvider>
</template>
```

**Notes**

- `status` values: `'submitted'` (request in flight), `'streaming'` (tokens
  arriving), `'ready'`, `'error'`.
- The submit button shows the appropriate icon/state for each phase automatically.

---

## Recipe 3.3 — Attachments & action menu

**Problem**

You want a paperclip-style action menu that lets users attach files, plus a
custom "Search" toggle button.

**Solution**

Compose the action menu sub-components and custom `PromptInputButton`s. Enable
multi-file upload with the `multiple` prop and drag-and-drop with `global-drop`.

```vue
<script setup lang="ts">
import { GlobeIcon } from '@lucide/vue'
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
import { ref } from 'vue'

const useWebSearch = ref(false)
</script>

<template>
  <PromptInputProvider @submit="() => {}">
    <PromptInput multiple global-drop class="w-full">
      <PromptInputBody>
        <PromptInputTextarea />
      </PromptInputBody>

      <PromptInputFooter>
        <PromptInputTools>
          <!-- Attachment menu -->
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <!-- Custom tool button -->
          <PromptInputButton
            :variant="useWebSearch ? 'default' : 'ghost'"
            @click="useWebSearch = !useWebSearch"
          >
            <GlobeIcon :size="16" />
            <span>Search</span>
          </PromptInputButton>
        </PromptInputTools>

        <PromptInputSubmit />
      </PromptInputFooter>
    </PromptInput>
  </PromptInputProvider>
</template>
```

**Notes**

- `multiple` allows several files; `global-drop` lets users drop files anywhere
  on the page.
- `PromptInputActionAddAttachments` inserts a file picker action into the menu.

---

## Recipe 3.4 — Model selector (searchable picker)

**Problem**

You want a dropdown where the user can search and pick an AI model, grouped by
provider (OpenAI / Anthropic / Google).

**Solution**

Use `ModelSelector` with a trigger inside a `PromptInputButton`, then a content
popover containing a search `ModelSelectorInput`, grouped `ModelSelectorGroup`s,
and selectable `ModelSelectorItem`s.

```vue
<script setup lang="ts">
import { CheckIcon } from '@lucide/vue'
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
import { PromptInputButton } from '@/components/ai-elements/prompt-input'
import { computed, ref } from 'vue'

const models = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai', 'azure'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
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
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
  },
]

const modelId = ref(models[0].id)
const modelSelectorOpen = ref(false)
const selected = computed(() => models.find((m) => m.id === modelId.value))

function handleSelect(id: string) {
  modelId.value = id
  modelSelectorOpen.value = false
}
</script>

<template>
  <ModelSelector v-model:open="modelSelectorOpen">
    <ModelSelectorTrigger as-child>
      <PromptInputButton>
        <ModelSelectorLogo v-if="selected?.chefSlug" :provider="selected.chefSlug" />
        <ModelSelectorName v-if="selected">{{ selected.name }}</ModelSelectorName>
      </PromptInputButton>
    </ModelSelectorTrigger>

    <ModelSelectorContent>
      <ModelSelectorInput placeholder="Search models..." />
      <ModelSelectorList>
        <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>

        <ModelSelectorGroup
          v-for="chef in ['OpenAI', 'Anthropic', 'Google']"
          :key="chef"
          :heading="chef"
        >
          <ModelSelectorItem
            v-for="m in models.filter((x) => x.chef === chef)"
            :key="m.id"
            :value="m.id"
            @select="() => handleSelect(m.id)"
          >
            <ModelSelectorLogo :provider="m.chefSlug" />
            <ModelSelectorName>{{ m.name }}</ModelSelectorName>

            <ModelSelectorLogoGroup>
              <ModelSelectorLogo
                v-for="provider in m.providers"
                :key="provider"
                :provider="provider"
              />
            </ModelSelectorLogoGroup>

            <CheckIcon v-if="modelId === m.id" class="ml-auto size-4" />
            <div v-else class="ml-auto size-4" />
          </ModelSelectorItem>
        </ModelSelectorGroup>
      </ModelSelectorList>
    </ModelSelectorContent>
  </ModelSelector>
</template>
```

**Notes**

- `ModelSelectorTrigger as-child` lets the trigger _be_ your `PromptInputButton`
  (the shadcn/reka pattern).
- `:provider="'openai'"` etc. renders a built-in provider logo; unknown values
  fall back gracefully.
- `@select` on each `ModelSelectorItem` fires when that item is chosen.

---

## Recipe 3.5 — Putting it together (input bar)

**Problem**

You want a single, production-ready input bar combining everything above:
attachments, a custom search toggle, model selector, and status-aware submit.

**Solution**

Compose the recipes together inside one `PromptInputProvider`.

```vue
<script setup lang="ts">
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
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
import { ref } from 'vue'

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

const modelId = ref(models[0].id)
const modelSelectorOpen = ref(false)
const useWebSearch = ref(false)
const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>('ready')

function handleSubmit(message: PromptInputMessage) {
  if (!message.text.trim() && !message.files?.length) return
  console.log('submit', { text: message.text, model: modelId.value, webSearch: useWebSearch.value })
  status.value = 'submitted'
  setTimeout(() => (status.value = 'ready'), 1500)
}
</script>

<template>
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
                <ModelSelectorName>{{
                  models.find((m) => m.id === modelId)?.name
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
                    <ModelSelectorName>{{ m.name }}</ModelSelectorName>
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
</template>
```
