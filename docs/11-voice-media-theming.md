<!-- markdownlint-disable MD036 -->

# 11 · Voice, Media & Theming

**Level:** Advanced — multimodal and polish: audio players, speech/voice
pickups, transcription, `WebPreview`, and how to theme/customize everything.

---

## Recipe 11.1 — `AudioPlayer`

**Problem**

The assistant produced an audio file (TTS) and you want a player with play/
mute/seek controls.

**Solution**

`AudioPlayer` wraps an `<audio>` element. Provide `AudioPlayerControlBar`,
`AudioPlayerPlayButton`, `AudioPlayerMuteButton`, seek buttons, and
`AudioPlayerDurationDisplay`.

```vue
<script setup lang="ts">
import type { Experimental_SpeechResult as SpeechResult } from 'ai'
import {
  AudioPlayer,
  AudioPlayerControlBar,
  AudioPlayerDurationDisplay,
  AudioPlayerElement,
  AudioPlayerMuteButton,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
} from '@/components/ai-elements/audio-player'

const speech: SpeechResult = {
  value: 'data:audio/mp3;base64,AAAA...',
  mimeType: 'audio/mp3',
}
</script>

<template>
  <AudioPlayer :src="speech.value" :mime-type="speech.mimeType" class="w-full">
    <AudioPlayerElement />
    <AudioPlayerControlBar>
      <AudioPlayerSeekBackwardButton />
      <AudioPlayerPlayButton />
      <AudioPlayerSeekForwardButton />
      <AudioPlayerMuteButton />
      <AudioPlayerDurationDisplay />
    </AudioPlayerControlBar>
  </AudioPlayer>
</template>
```

**Notes**

- `src` can be a data URL (base64) or a remote URL.
- `AudioPlayerElement` renders the underlying `<audio>` tag; the bar exposes
  transport controls.

---

## Recipe 11.2 — `SpeechInput` (record → transcript)

**Problem**

You want a voice-input button that captures speech and emits a live transcript.

**Solution**

`SpeechInput` is a ready-to-use mic button: use `v-model` or the
`transcription-change` event to receive text.

```vue
<script setup lang="ts">
import { SpeechInput } from '@/components/ai-elements/speech-input'
import { ref } from 'vue'

const transcript = ref('')

function handleTranscriptionChange(text: string) {
  transcript.value = text
}
</script>

<template>
  <div class="space-y-2">
    <SpeechInput @transcription-change="handleTranscriptionChange" />

    <p v-if="transcript" class="text-sm text-muted-foreground">Heard: {{ transcript }}</p>
  </div>
</template>
```

---

## Recipe 11.3 — `MicSelector` & `VoiceSelector`

**Problem**

You want to let users pick their input microphone (with a searchable list) and
their output voice.

**Solution**

`MicSelector` lists `MediaDeviceInfo` devices; `VoiceSelector` presents
voice attributes (accent, age, attributes).

```vue
<script setup lang="ts">
import {
  MicSelector,
  MicSelectorContent,
  MicSelectorEmpty,
  MicSelectorInput,
  MicSelectorItem,
  MicSelectorLabel,
  MicSelectorList,
  MicSelectorTrigger,
} from '@/components/ai-elements/mic-selector'

import {
  VoiceSelector,
  VoiceSelectorAccent,
  VoiceSelectorAge,
  VoiceSelectorAttributes,
  VoiceSelectorBullet,
  VoiceSelectorContent,
  VoiceSelectorTrigger,
} from '@/components/ai-elements/voice-selector'
</script>

<template>
  <div class="flex gap-4">
    <MicSelector>
      <MicSelectorTrigger>Microphone</MicSelectorTrigger>
      <MicSelectorContent>
        <MicSelectorInput placeholder="Search devices..." />
        <MicSelectorList>
          <MicSelectorEmpty>No devices found</MicSelectorEmpty>
          <MicSelectorItem value="default">
            <MicSelectorLabel>Default — Microphone (Realtek)</MicSelectorLabel>
          </MicSelectorItem>
        </MicSelectorList>
      </MicSelectorContent>
    </MicSelector>

    <VoiceSelector>
      <VoiceSelectorTrigger>Voice</VoiceSelectorTrigger>
      <VoiceSelectorContent>
        <VoiceSelectorAccent>American</VoiceSelectorAccent>
        <VoiceSelectorAge>Adult</VoiceSelectorAge>
        <VoiceSelectorAttributes>
          <VoiceSelectorBullet>Warm</VoiceSelectorBullet>
          <VoiceSelectorBullet>Clear</VoiceSelectorBullet>
        </VoiceSelectorAttributes>
      </VoiceSelectorContent>
    </VoiceSelector>
  </div>
</template>
```

**Notes**

- `MicSelector`/`VoiceSelector` share the same combobox pattern as
  `ModelSelector` (search input, list, items).
- Read the picked values via their `v-model`/`value` props to feed your speech
  engine.

---

## Recipe 11.4 — `Transcription` segments

**Problem**

You want to render a full audio transcription with segmented timestamps.

**Solution**

`Transcription` maps AI SDK `Experimental_TranscriptionResult` segments to
`TranscriptionSegment` rows.

```vue
<script setup lang="ts">
import type { Experimental_TranscriptionResult as TranscriptionResult } from 'ai'
import { Transcription, TranscriptionSegment } from '@/components/ai-elements/transcription'
import { ref } from 'vue'

const result = ref<TranscriptionResult>({
  text: 'Hello world, this is a test.',
  segments: [
    { start: 0, end: 1.2, text: 'Hello world,' },
    { start: 1.2, end: 2.5, text: 'this is a test.' },
  ],
})
</script>

<template>
  <Transcription :result="result" class="w-full">
    <TranscriptionSegment v-for="(seg, i) in result.segments" :key="i" :segment="seg" />
  </Transcription>
</template>
```

---

## Recipe 11.5 — `WebPreview`

**Problem**

You want to embed a live web page preview (e.g. of a generated site) with a URL
bar and console toggle.

**Solution**

`WebPreview` provides a navigation context. Compose `WebPreviewNavigation`,
`WebPreviewUrl`, navigation buttons, `WebPreviewBody`, and `WebPreviewConsole`.

```vue
<script setup lang="ts">
import { ArrowLeftIcon, ArrowRightIcon, ExternalLinkIcon } from '@lucide/vue'
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from '@/components/ai-elements/web-preview'
import { ref } from 'vue'

const url = ref('https://example.com')
</script>

<template>
  <WebPreview class="h-[500px] w-full" :initial-url="url">
    <WebPreviewNavigation>
      <WebPreviewNavigationButton><ArrowLeftIcon class="size-4" /></WebPreviewNavigationButton>
      <WebPreviewNavigationButton><ArrowRightIcon class="size-4" /></WebPreviewNavigationButton>
      <WebPreviewUrl v-model="url" />
      <WebPreviewNavigationButton><ExternalLinkIcon class="size-4" /></WebPreviewNavigationButton>
    </WebPreviewNavigation>

    <WebPreviewBody />
    <WebPreviewConsole />
  </WebPreview>
</template>
```

**Notes**

- `WebPreviewBody` renders the iframe; `WebPreviewConsole` toggles a devtools
  console panel.
- `v-model` on `WebPreviewUrl` keeps the address bar in sync.

---

## Recipe 11.6 — Theming & customization

**Problem**

The default look doesn't match your brand, or you need dark mode.

**Solution**

Because every component is copied into your `components/` directory, you have
three levers:

1. **Tailwind classes** — every component accepts a `class` prop (it's a
   shadcn-vue convention), so override spacing, colors, and layout inline.

2. **Design tokens** — components use shadcn CSS variables
   (`--background`, `--foreground`, `--muted`, `--primary`, `--destructive`, …).
   Change them once in your CSS to re-theme the whole library:

```css
@import 'tailwindcss';

@theme inline {
  --color-primary: oklch(0.59 0.22 277.5); /* your brand purple */
  --color-muted: oklch(0.97 0 0);
}
```

1. **Edit the source** — components live under
   `src/components/ai-elements/*`. Open any `.vue` file and change markup, add
   props, or swap icons.

**Dark mode**

```ts
// main.ts — toggle a `dark` class on <html>
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
document.documentElement.classList.toggle('dark', prefersDark.matches)
prefersDark.addEventListener('change', (e) =>
  document.documentElement.classList.toggle('dark', e.matches),
)
```

**Notes**

- Keep the AI SDK types (`ToolUIPart`, `LanguageModelUsage`,
  `Experimental_GeneratedImage`, …) in sync with the versions the components
  were built against.
- For a production app, consider the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
  and add `AI_GATEWAY_API_KEY` to `.env.local` for observability and rate
  limiting.
