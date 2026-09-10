<!-- markdownlint-disable MD036 -->

# 06 · Queue, Task & Plan

**Level:** Intermediate — visualize the work an agent is doing: queued messages
with attachments (`Queue`), a checklist of subtasks (`Task`), and a structured
multi-step `Plan`.

---

## Recipe 6.1 — Message & todo queue with attachments

**Problem**

While the agent works, you want to show the outgoing queue of messages plus a
list of todo items (with attachment chips).

**Solution**

`Queue` renders items via `QueueItem`, each with `QueueItemContent`,
`QueueItemDescription`, optional attachments, and action buttons.

```vue
<script setup lang="ts">
import { ArrowUp, Trash2 } from '@lucide/vue'
import {
  Queue,
  QueueItem,
  QueueItemAction,
  QueueItemActions,
  QueueItemAttachment,
  QueueItemContent,
  QueueItemDescription,
  QueueItemTitle,
} from '@/components/ai-elements/queue'

interface QueueTodo {
  id: string
  title: string
  description?: string
  status: 'completed' | 'pending'
  attachment?: { id: string; name: string }
}

const todos: QueueTodo[] = [
  {
    id: 'todo-1',
    title: 'Write project documentation',
    description: 'Complete the README and API docs',
    status: 'completed',
  },
  { id: 'todo-2', title: 'Implement authentication', status: 'pending' },
  {
    id: 'todo-3',
    title: 'Fix bug #42',
    description: 'Resolve crash on settings page',
    status: 'pending',
  },
]

function removeTodo(id: string) {
  /* remove from state */
}
</script>

<template>
  <Queue>
    <QueueItem v-for="todo in todos" :key="todo.id" :title="todo.title" :status="todo.status">
      <QueueItemContent>
        <QueueItemTitle>{{ todo.title }}</QueueItemTitle>
        <QueueItemDescription v-if="todo.description">
          {{ todo.description }}
        </QueueItemDescription>

        <QueueItemAttachment
          v-if="todo.attachment"
          :id="todo.attachment.id"
          :name="todo.attachment.name"
        />

        <QueueItemActions>
          <QueueItemAction label="Remove" @click="removeTodo(todo.id)">
            <Trash2 class="size-4" />
          </QueueItemAction>
          <QueueItemAction label="Submit" @click="() => {}">
            <ArrowUp class="size-4" />
          </QueueItemAction>
        </QueueItemActions>
      </QueueItemContent>
    </QueueItem>
  </Queue>
</template>
```

**Notes**

- `QueueItem` accepts `title` and `status` (`'completed' | 'pending'`) — the
  status drives a checkbox/tick icon.
- This is a **visual** component: keep your own todos in reactive state and map
  them like above.

---

## Recipe 6.2 — Collapsible `Task` checklist

**Problem**

You want a ChatGPT-style collapsible "Tasks" section that streams in checklist
items one by one.

**Solution**

`Task` is a `Collapsible`-based wrapper. Use `TaskTrigger` as the header and
`TaskItem` for each row; `TaskItemFile` shows a related file.

```vue
<script setup lang="ts">
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from '@/components/ai-elements/task'
import { nanoid } from 'nanoid'
import { ref } from 'vue'

interface TaskEntry {
  key: string
  title: string
  status: 'pending' | 'completed' | 'in-progress'
}

const tasks = ref<TaskEntry[]>([
  { key: nanoid(), title: 'Scaffold the project', status: 'completed' },
  { key: nanoid(), title: 'Set up auth', status: 'in-progress' },
  { key: nanoid(), title: 'Write unit tests', status: 'pending' },
])
</script>

<template>
  <Task default-open>
    <TaskTrigger>
      <span>Tasks</span>
    </TaskTrigger>

    <TaskContent>
      <TaskItem v-for="task in tasks" :key="task.key" :title="task.title" :status="task.status">
        <TaskItemFile name="main.ts" path="src/main.ts" />
      </TaskItem>
    </TaskContent>
  </Task>
</template>
```

**Notes**

- `TaskTrigger` collapses/expands the list; `default-open` shows it initially.
- `TaskItem` accepts `title` + `status`; `TaskItemFile` adds a small file chip.

---

## Recipe 6.3 — Structured `Plan` card

**Problem**

You want to present an agent's execution plan as a card with a title,
description, and step actions.

**Solution**

`Plan` is a `Card`-based wrapper. Compose `PlanHeader` (`PlanTitle` +
`PlanDescription`), `PlanContent` for the steps, and `PlanAction`/`PlanFooter`
for controls.

```vue
<script setup lang="ts">
import { FileText } from '@lucide/vue'
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanFooter,
  PlanHeader,
  PlanTitle,
} from '@/components/ai-elements/plan'

const steps = [
  'Fetch the repository',
  'Install dependencies',
  'Run the test suite',
  'Open a pull request',
]
</script>

<template>
  <Plan class="w-full max-w-lg">
    <PlanHeader>
      <PlanTitle class="flex items-center gap-2">
        <FileText class="size-4" />
        Implementation plan
      </PlanTitle>
      <PlanDescription>4 steps to deliver the feature.</PlanDescription>
    </PlanHeader>

    <PlanContent>
      <ol class="list-decimal space-y-1 pl-5">
        <li v-for="step in steps" :key="step">{{ step }}</li>
      </ol>
    </PlanContent>

    <PlanFooter>
      <PlanAction @click="() => {}">Start plan</PlanAction>
    </PlanFooter>
  </Plan>
</template>
```

**Notes**

- `PlanHeader`/`PlanTitle`/`PlanDescription` are typed against `Card` slots, so
  you can pass `class` to style them.
- `Plan` respects an internal streaming context — `PlanTitle` renders a
  `Shimmer` while `is-streaming` is true, so you can pair it with live plan
  generation.
