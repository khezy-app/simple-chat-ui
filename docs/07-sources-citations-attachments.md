<!-- markdownlint-disable MD036 -->

# 07 · Sources, Citations & Attachments

**Level:** Intermediate — make your answers trustworthy and interactive:
`Sources`, `InlineCitation`, `Attachments`, and quick-reply `Suggestion`s.

---

## Recipe 7.1 — Source attribution with `Sources`

**Problem**

The assistant cited web pages. You want a compact "N sources" trigger that opens
a list of links.

**Solution**

`Sources` manages the trigger/content pairing. `SourcesTrigger` takes a `count`,
and `SourcesContent` holds one `Source` per link (`href` + `title`).

```vue
<script setup lang="ts">
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'

const sources = [
  { href: 'https://stripe.com/docs/api', title: 'Stripe API Documentation' },
  { href: 'https://docs.github.com/en/rest', title: 'GitHub REST API' },
  { href: 'https://developer.mozilla.org/en-US/docs/Web/API', title: 'MDN Web APIs' },
]
</script>

<template>
  <Sources>
    <SourcesTrigger :count="sources.length" />
    <SourcesContent>
      <Source v-for="s in sources" :key="s.href" :href="s.href" :title="s.title" />
    </SourcesContent>
  </Sources>
</template>
```

**Notes**

- Place `Sources` **above** the assistant answer (see Recipe 7.4 for the message
  layout).
- `Source` renders an external-link card; it opens in a new tab.

---

## Recipe 7.2 — Inline citations in flowing text

**Problem**

You want citations embedded **inside** the answer text as numbered chips.

**Solution**

`InlineCitation` is an inline popover trigger. Give it an `id` and an
`InlineCitationCard` containing a `CardTrigger`/`CardBody`.

```vue
<script setup lang="ts">
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
} from '@/components/ai-elements/inline-citation'

const citation = {
  id: '1',
  title: 'Vue 3 Reactivity Fundamentals',
  url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html',
}
</script>

<template>
  <p>
    Vue 3 uses a proxy-based reactivity system
    <InlineCitation :id="citation.id" :index="1">
      <InlineCitationCard>
        <InlineCitationCardTrigger>
          <a :href="citation.url" target="_blank" rel="noopener">{{ citation.title }}</a>
        </InlineCitationCardTrigger>
        <InlineCitationCardBody>
          <p>Key concept: `ref()` and `reactive()` track reads and trigger writes.</p>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
    when you call a composable inside `setup()`.
  </p>
</template>
```

**Notes**

- `:index` controls the superscript number shown.
- For multiple citations, wrap them in `InlineCitationCarousel` + `CarouselContent`
  for a swipeable citation strip.
- When streaming markdown, render citations separately from the markdown body
  (the assistant message can emit structured citation data).

---

## Recipe 7.3 — Message attachments (files & images)

**Problem**

A user message includes an image or PDF and you want a grid of attachment
thumbnails with remove buttons.

**Solution**

Use `Attachments` (`variant="grid"`), `Attachment` (`data`), `AttachmentPreview`,
and `AttachmentRemove`.

```vue
<script setup lang="ts">
import type { AttachmentData } from '@/components/ai-elements/attachments'
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from '@/components/ai-elements/attachments'

const attachments: AttachmentData[] = [
  {
    id: '1',
    type: 'file',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    mediaType: 'image/jpeg',
    filename: 'palace-of-fine-arts.jpg',
  },
  {
    id: '2',
    type: 'file',
    url: '',
    mediaType: 'application/pdf',
    filename: 'vue-compositions-guide.pdf',
  },
]

function remove(id: string) {
  /* filter from state */
}
</script>

<template>
  <Attachments variant="grid" class="mb-2">
    <Attachment v-for="a in attachments" :key="a.id" :data="a">
      <AttachmentPreview />
      <AttachmentRemove @click="remove(a.id)" />
    </Attachment>
  </Attachments>
</template>
```

**Notes**

- `AttachmentData` is `FileUIPart | SourceDocumentUIPart` plus an `id`.
- `AttachmentPreview` renders an image thumbnail or a file icon based on
  `mediaType`.
- `Attachments` accepts a `variant` (`'grid'` | `'list'`) to switch layouts.

---

## Recipe 7.4 — Assistant message with sources + citations

**Problem**

You want the full "answer with provenance" layout: sources on top, markdown
answer, inline citation chips.

**Solution**

Combine `Sources`, `Reasoning`, `MessageContent`/`MessageResponse` inside one
`Message`.

```vue
<script setup lang="ts">
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'

const answer =
  'Vue 3 reactivity is proxy-based. Use `ref()` for primitives and `reactive()` for objects.'
</script>

<template>
  <Message from="assistant">
    <Sources>
      <SourcesTrigger :count="2" />
      <SourcesContent>
        <Source
          href="https://vuejs.org/guide/essentials/reactivity-fundamentals.html"
          title="Reactivity Fundamentals"
        />
        <Source href="https://vuejs.org/api/reactivity-core.html" title="Reactivity Core API" />
      </SourcesContent>
    </Sources>

    <Reasoning :duration="8" :is-streaming="false">
      <ReasoningTrigger />
      <ReasoningContent
        :content="'The user asked about reactivity. I recall the docs list two primitives…'"
      />
    </Reasoning>

    <MessageContent>
      <MessageResponse :content="answer" :shiki-options="{ langs: ['ts'] }" />
    </MessageContent>
  </Message>
</template>
```

---

## Recipe 7.5 — Quick reply `Suggestion`s

**Problem**

You want clickable prompt chips above the input bar to guide the user.

**Solution**

`Suggestions` is the row; `Suggestion` is each chip with a `suggestion` prop;
listen to `@click`.

```vue
<script setup lang="ts">
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'

const suggestions = [
  'What are the latest trends in AI?',
  'How does machine learning work?',
  'Explain quantum computing',
]

function handleClick(suggestion: string) {
  /* send it through PromptInput / directly to the API */
  console.log(suggestion)
}
</script>

<template>
  <Suggestions class="px-4">
    <Suggestion v-for="s in suggestions" :key="s" :suggestion="s" @click="handleClick" />
  </Suggestions>
</template>
```

**Notes**

- The `@click` payload is the suggestion string — pass it straight into your
  chat handler.
