<!-- markdownlint-disable MD036 -->

# 08 · Artifacts, Terminal & FileTree

**Level:** Advanced — "vibe-coding" surfaces: a full-screen code/document
`Artifact`, an `Image` display, a `Terminal`, a `FileTree`, and `Loader` states.

---

## Recipe 8.1 — Full-screen `Artifact`

**Problem**

You want a ChatGPT-style artifact panel: a header with title + actions, and a
body that shows generated code or documents.

**Solution**

`Artifact` is a collapsible overlay. Compose `ArtifactHeader` (title +
description + `ArtifactActions`) and `ArtifactContent`. Add an `ArtifactClose`
button.

```vue
<script setup lang="ts">
import { Copy, Download, Play, RefreshCw, Share } from '@lucide/vue'
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactClose,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from '@/components/ai-elements/artifact'

const code = `function add(a, b) { return a + b }`
</script>

<template>
  <Artifact default-open class="h-[600px]">
    <ArtifactHeader>
      <ArtifactTitle>calculator.ts</ArtifactTitle>
      <ArtifactDescription>A generated utility module.</ArtifactDescription>

      <ArtifactActions>
        <ArtifactAction label="Run" @click="() => {}"><Play class="size-4" /></ArtifactAction>
        <ArtifactAction label="Copy" @click="() => {}"><Copy class="size-4" /></ArtifactAction>
        <ArtifactAction label="Download" @click="() => {}"
          ><Download class="size-4"
        /></ArtifactAction>
        <ArtifactAction label="Share" @click="() => {}"><Share class="size-4" /></ArtifactAction>
      </ArtifactActions>

      <ArtifactClose />
    </ArtifactHeader>

    <ArtifactContent>
      <pre class="overflow-auto p-4 text-sm"><code>{{ code }}</code></pre>
    </ArtifactContent>
  </Artifact>
</template>
```

**Notes**

- `ArtifactAction` mirrors `MessageAction` (label + tooltip + slot icon).
- `ArtifactClose` collapses the panel; `default-open` shows it immediately.
- For real code display inside the body, pair it with `CodeBlock` from
  [Chapter 05](./05-tools-confirmation-context.md#recipe-55--codeblock-standalone-with-copy--language-switcher).

---

## Recipe 8.2 — AI-generated `Image`

**Problem**

You generated an image with an AI model and want to render it with metadata.

**Solution**

`Image` accepts an `Experimental_GeneratedImage`-compatible object.

```vue
<script setup lang="ts">
import { Image } from '@/components/ai-elements/image'

const exampleImage = {
  // base64 is auto-converted into a data URL; you can also pass `url`
  base64: '...your-base64-here...',
  mediaType: 'image/jpeg',
}
</script>

<template>
  <Image v-bind="exampleImage" class="rounded-lg border" />
</template>
```

**Notes**

- Props extend the AI SDK `Experimental_GeneratedImage` type (`base64`,
  `mediaType`, or `url`).
- Add `alt`/`class` freely — it's a normal image under the hood.

---

## Recipe 8.3 — `Terminal` with streaming output

**Problem**

You want to render command output (including ANSI colors) like a real terminal,
with a copy button.

**Solution**

`Terminal` takes an `output` string (ANSI sequences supported) and optional
`is-streaming`/`auto-scroll`. Add `TerminalHeader`, `TerminalContent`,
`TerminalActions` and `TerminalCopyButton`.

```vue
<script setup lang="ts">
import {
  Terminal,
  TerminalActions,
  TerminalClearButton,
  TerminalContent,
  TerminalCopyButton,
  TerminalHeader,
  TerminalStatus,
} from '@/components/ai-elements/terminal'
import { ref } from 'vue'

const output = ref(`\x1B[36m$\x1B[0m npm run build
Building project...
\x1B[32m✓\x1B[0m Compiled successfully
`)

function clear() {
  output.value = ''
}
</script>

<template>
  <Terminal :output="output" :is-streaming="false" :auto-scroll="true" class="w-full">
    <TerminalHeader>
      <span>Terminal</span>
      <TerminalStatus />
    </TerminalHeader>

    <TerminalContent />

    <TerminalActions>
      <TerminalCopyButton @copy="() => {}" @error="() => {}" />
      <TerminalClearButton @click="clear" />
    </TerminalActions>
  </Terminal>
</template>
```

**Notes**

- `TerminalContent` renders the `output` with ANSI color parsing.
- `TerminalClearButton` emits `@click` so you control state.
- Super simple variant: `<Terminal output="npm install complete" />` works too.

---

## Recipe 8.4 — `FileTree`

**Problem**

You want to show a generated project's file structure with expandable folders.

**Solution**

Compose `FileTree`, `FileTreeFolder` (title + children), and `FileTreeFile`
(name + path).

```vue
<script setup lang="ts">
import { FileTree, FileTreeFile, FileTreeFolder } from '@/components/ai-elements/file-tree'
</script>

<template>
  <FileTree>
    <FileTreeFolder title="src">
      <FileTreeFile name="main.ts" path="src/main.ts" />
      <FileTreeFolder title="components">
        <FileTreeFile name="Chat.vue" path="src/components/Chat.vue" />
        <FileTreeFile name="MessageBubble.vue" path="src/components/MessageBubble.vue" />
      </FileTreeFolder>
    </FileTreeFolder>
    <FileTreeFile name="package.json" path="package.json" />
    <FileTreeFile name="README.md" path="README.md" />
  </FileTree>
</template>
```

**Notes**

- Folders toggle expand/collapse; selection is tracked via the shared
  `FileTree` context (`selectedPath`).
- `FileTreeActions` can hold extra controls (e.g. "Open in editor").

---

## Recipe 8.5 — Loading states with `Loader`

**Problem**

You need a spinner sized to the context (button, page, avatar).

**Solution**

`Loader` is a simple SVG spinner with a `size` prop (defaults to a comfortable
icon size).

```vue
<script setup lang="ts">
import { Loader } from '@/components/ai-elements/loader'
import { LoaderIcon } from '@/components/ai-elements/loader'
</script>

<template>
  <div class="flex items-center gap-8 p-8">
    <Loader :size="16" />
    <Loader :size="32" />
    <Loader :size="48" />

    <!-- Inline in a button -->
    <button
      class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white"
      disabled
    >
      <LoaderIcon class="size-4 animate-spin" />
      Working…
    </button>
  </div>
</template>
```

**Notes**

- `Loader` = container + `LoaderIcon`; `LoaderIcon` alone is handy inside
  buttons so you can add your own `animate-spin`.
