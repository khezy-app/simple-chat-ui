<!-- markdownlint-disable MD036 -->

# 01 · Getting Started

**Level:** Basic — everything you need to add AI Elements Vue to a project and
render your first component.

---

## Recipe 1.1 — Install the prerequisites

**Problem**

You have a fresh Vue/Nuxt app and want to use AI Elements Vue, but the library
builds on top of shadcn-vue and the AI SDK.

**Solution**

Make sure your project meets the prerequisites, then initialize shadcn-vue and
Tailwind.

```bash
# 1. Node.js 18+ (check your version)
node -v

# 2. If you don't have an AI SDK powered Vue/Nuxt project yet, create one
npm create vue@latest
cd my-ai-app

# 3. Install the AI SDK (components rely on its types like ToolUIPart, LanguageModelUsage)
npm install ai

# 4. Initialize shadcn-vue (CSS Variables mode)
npx shadcn-vue@latest init

# 5. Make sure Tailwind CSS is configured (CSS Variables mode)
```

**Notes**

- Tailwind **CSS Variables** mode is required — AI Elements Vue themes rely on
  the `--background`, `--foreground`, `--muted`, etc. design tokens.
- TypeScript is recommended for the best developer experience (most components
  ship typed props, e.g. `ToolUIPart`, `LanguageModelUsage`).

---

## Recipe 1.2 — Install AI Elements Vue

**Problem**

You want the AI Elements Vue components in your project.

**Solution**

Use the CLI (it detects your package manager automatically and wires up
shadcn-vue under the hood).

```bash
# Install ALL components at once (recommended)
npx ai-elements-vue@latest

# Install a single component
npx ai-elements-vue@latest add message

# Install several at once
npx ai-elements-vue@latest add message conversation

# Alternative — use the shadcn-vue CLI against the AI Elements registry
npx shadcn-vue@latest add https://registry.ai-elements-vue.com/all.json
# or a single component
npx shadcn-vue@latest add https://registry.ai-elements-vue.com/message.json
```

**Notes**

- Components are copied **into your codebase** (usually
  `src/components/ai-elements/`) — you own and can customize every file.
- The install location follows your existing `components.json` config.

---

## Recipe 1.3 — Render your first component

**Problem**

You installed components and want to see one on screen immediately.

**Solution**

Import the component from the installed location (its `index.ts` re-exports all
sub-components) and drop it into a template.

```vue
<script setup lang="ts">
import { Loader } from '@/components/ai-elements/loader'
</script>

<template>
  <div class="flex items-center justify-center p-8">
    <Loader />
  </div>
</template>
```

`Loader` accepts a `size` prop — perfect for button spinners:

```vue
<script setup lang="ts">
import { Loader } from '@/components/ai-elements/loader'
</script>

<template>
  <div class="flex items-center gap-8 p-8">
    <!-- small / medium / large -->
    <Loader :size="16" />
    <Loader :size="32" />
    <Loader :size="48" />
  </div>
</template>
```

**Notes**

- Import paths in this cookbook use `@/components/ai-elements/*`. Adjust to your
  own `components.json` output directory if it differs.
- The component's own imports (like `CodeBlock` internally using `shiki`) are
  added automatically by the CLI as dependencies.
