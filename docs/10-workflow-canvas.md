<!-- markdownlint-disable MD036 -->

# 10 · Workflow Canvas

**Level:** Advanced — build node-based agent/workflow UIs with Vue Flow.
Covers `Canvas`, `Node`, `Edge` (`Animated`/`Temporary`), `Controls`, `Panel`,
and `Toolbar`.

---

## Recipe 10.1 — Minimal `Canvas`

**Problem**

You want an interactive graph canvas (pan/zoom/minimap) wired to your own nodes
and edges.

**Solution**

`Canvas` wraps Vue Flow. Pass `nodes`/`edges` and register your node/edge
renderers via `nodeTypes`/`edgeTypes`.

```vue
<script setup lang="ts">
import type { EdgeTypesObject, NodeTypesObject } from '@vue-flow/core'
import { Canvas } from '@/components/ai-elements/canvas'
import { ref } from 'vue'
import CustomNode from './CustomNode.vue'

const nodes = ref([
  { id: '1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Start' } },
  { id: '2', type: 'custom', position: { x: 300, y: 0 }, data: { label: 'Generate' } },
])
const edges = ref([{ id: 'e1-2', source: '1', target: '2', animated: true }])

const nodeTypes: NodeTypesObject = { custom: CustomNode }
</script>

<template>
  <div class="h-[600px] w-full">
    <Canvas v-model:nodes="nodes" v-model:edges="edges" :node-types="nodeTypes" fit-view-on-init />
  </div>
</template>
```

**Notes**

- `Canvas` re-exports Vue Flow's props/emits/slots — everything you can do with
  `<VueFlow>` works here.
- It automatically loads Vue Flow's core styles.

---

## Recipe 10.2 — A custom `Node`

**Problem**

You want branded graph nodes (header, title, description, footer) instead of
plain rectangles.

**Solution**

Create a node component built from `Node` + `NodeHeader`/`NodeTitle`/
`NodeContent`/`NodeFooter`/`NodeDescription`. The `Node` wrapper wires up Vue
Flow's `Handle`s for connections.

```vue
<!-- CustomNode.vue -->
<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import {
  Node,
  NodeContent,
  NodeDescription,
  NodeFooter,
  NodeHeader,
  NodeTitle,
} from '@/components/ai-elements/node'

const props = defineProps<NodeProps>()
</script>

<template>
  <Node class="w-64">
    <NodeHeader>
      <NodeTitle>{{ (props.data as any).label }}</NodeTitle>
    </NodeHeader>

    <NodeContent>
      <NodeDescription>Handles connections automatically.</NodeDescription>
    </NodeContent>

    <NodeFooter>
      <span class="text-xs text-muted-foreground">id: {{ props.id }}</span>
    </NodeFooter>
  </Node>
</template>
```

**Notes**

- `Node` is built on a `Card` and registers Vue Flow source/target `Handle`s, so
  edges snap to it.
- `NodeTitle`/`NodeHeader`/etc. accept a `class` for sizing.

---

## Recipe 10.3 — Custom `Edge`s (Animated & Temporary)

**Problem**

You want animated connection lines, plus a "ghost" edge while dragging between
nodes.

**Solution**

Register the built-in `Animated` and `Temporary` edges.

```vue
<script setup lang="ts">
import type { EdgeTypesObject } from '@vue-flow/core'
import { Animated, Temporary } from '@/components/ai-elements/edge'

const edgeTypes: EdgeTypesObject = {
  animated: Animated,
  temporary: Temporary,
}
</script>

<template>
  <div class="h-[600px] w-full">
    <Canvas
      :edge-types="edgeTypes"
      :default-edges="[{ id: 'e1', source: '1', target: '2', type: 'animated' }]"
    />
  </div>
</template>
```

**Notes**

- `Animated` draws a bezier path with a moving dash; `Temporary` is a
  simpler path used for in-progress drag connections.
- You can also write your own edge by extending `EdgeProps`.

---

## Recipe 10.4 — `Controls`, `Panel` & `Toolbar`

**Problem**

You want the standard zoom/fit controls, floating overlays, and a toolbar of
actions (e.g. add node / delete / run).

**Solution**

`Controls` provides zoom & fit buttons. `Panel` positions overlay content
(`position="top-left"` etc.). `Toolbar` gives an action strip. Combine them
inside the `Canvas` default slot.

```vue
<script setup lang="ts">
import { Canvas } from '@/components/ai-elements/canvas'
import { Controls } from '@/components/ai-elements/controls'
import { Panel } from '@/components/ai-elements/panel'
import { Toolbar } from '@/components/ai-elements/toolbar'
import { useVueFlow } from '@vue-flow/core'

const { addNodes, removeSelectedNodes } = useVueFlow()

function addNode() {
  addNodes({ id: `n-${Date.now()}`, position: { x: 100, y: 100 }, data: { label: 'New' } })
}
</script>

<template>
  <div class="h-[600px] w-full">
    <Canvas fit-view-on-init>
      <template #default>
        <!-- Zoom / fit controls -->
        <Controls />

        <!-- Floating overlay (top-left) -->
        <Panel position="top-left" class="flex gap-2">
          <span class="rounded bg-background/80 p-2 text-xs text-muted-foreground backdrop-blur">
            3 nodes · 2 edges
          </span>
        </Panel>

        <!-- Toolbar -->
        <Toolbar class="flex gap-2">
          <button class="rounded border px-2 py-1 text-xs" @click="addNode">Add node</button>
          <button class="rounded border px-2 py-1 text-xs" @click="removeSelectedNodes()">
            Delete
          </button>
        </Toolbar>
      </template>
    </Canvas>
  </div>
</template>
```

**Notes**

- `Panel` is Vue Flow's `Panel` with shadcn styling; `position` is one of
  `'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'`.
- Use `useVueFlow()` (from the `@vue-flow/core` that `Canvas` installs) for
  imperative actions.
- `Connection` (custom edge rendering for connections) can be registered the
  same way as `Edge`.

---

## Recipe 10.5 — Full workflow example

**Problem**

You want a ready-to-run agent graph: an entry node, an "LLM" node, and a tool
node connected by animated edges, with controls and a toolbar.

**Solution**

Combine everything above into one file.

```vue
<script setup lang="ts">
import type { EdgeTypesObject, NodeTypesObject } from '@vue-flow/core'
import { Canvas } from '@/components/ai-elements/canvas'
import { Controls } from '@/components/ai-elements/controls'
import { Animated, Temporary } from '@/components/ai-elements/edge'
import { Panel } from '@/components/ai-elements/panel'
import { Toolbar } from '@/components/ai-elements/toolbar'
import { useVueFlow } from '@vue-flow/core'
import CustomNode from './CustomNode.vue'

const nodes = [
  { id: 'in', type: 'custom', position: { x: 0, y: 120 }, data: { label: 'Input' } },
  { id: 'llm', type: 'custom', position: { x: 320, y: 120 }, data: { label: 'LLM' } },
  { id: 'tool', type: 'custom', position: { x: 640, y: 120 }, data: { label: 'Search tool' } },
]
const edges = [
  { id: 'in-llm', source: 'in', target: 'llm', type: 'animated' },
  { id: 'llm-tool', source: 'llm', target: 'tool', type: 'animated', animated: true },
]

const nodeTypes: NodeTypesObject = { custom: CustomNode }
const edgeTypes: EdgeTypesObject = { animated: Animated, temporary: Temporary }
const { addNodes } = useVueFlow()
</script>

<template>
  <div class="h-[600px] w-full">
    <Canvas
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      fit-view-on-init
    >
      <template #default>
        <Controls />
        <Panel position="bottom-left">
          <span class="text-xs text-muted-foreground">Agent workflow</span>
        </Panel>
        <Toolbar class="flex gap-2">
          <button
            class="rounded border px-2 py-1 text-xs"
            @click="
              addNodes([
                { id: `n-${Date.now()}`, position: { x: 100, y: 300 }, data: { label: 'Node' } },
              ])
            "
          >
            + Node
          </button>
        </Toolbar>
      </template>
    </Canvas>
  </div>
</template>
```
