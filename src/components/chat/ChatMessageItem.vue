<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCcw } from '@lucide/vue'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { Loader } from '@/components/ai-elements/loader'
import { useChatStore } from '@/stores/chat'
import type { ChatMessage, ReasoningPart, SourcePart, TextPart, ToolPart } from '@/types/chat'

const props = defineProps<{
  message: ChatMessage
  isStreaming?: boolean
}>()

const store = useChatStore()

const isAssistant = computed(() => props.message.role === 'assistant')

const text = computed(() =>
  props.message.parts
    .filter((p): p is TextPart => p.type === 'text')
    .map((p) => p.text)
    .join(''),
)

const reasoningText = computed(() =>
  props.message.parts
    .filter((p): p is ReasoningPart => p.type === 'reasoning')
    .map((p) => p.reasoning)
    .join(''),
)

const tools = computed(() => props.message.parts.filter((p): p is ToolPart => p.type === 'tool'))

const sources = computed(() =>
  props.message.parts.filter((p): p is SourcePart => p.type === 'source'),
)

const showLoader = computed(
  () => isAssistant.value && (props.isStreaming ?? false) && text.value === '',
)
</script>

<template>
  <Message :from="isAssistant ? 'assistant' : 'user'">
    <template v-if="isAssistant">
      <!--
        `Message` is a flex row; wrap the assistant's reasoning / tools /
        sources / text in a column so they stack vertically instead of
        sitting side by side.
      -->
      <div class="flex w-full min-w-0 flex-col">
        <!-- Chain of thought -->
        <Reasoning
          v-if="reasoningText.length > 0"
          :is-streaming="isStreaming"
          :default-open="isStreaming"
        >
          <ReasoningTrigger />
          <ReasoningContent :content="reasoningText" />
        </Reasoning>

        <!-- Tool calls -->
        <Tool v-for="tool in tools" :key="tool.toolCallId">
          <!-- AI SDK v7 encodes the tool name in the part type: `tool-<name>` -->
          <ToolHeader :type="`tool-${tool.toolName}`" :state="tool.state" :title="tool.toolName" />
          <ToolContent>
            <ToolInput v-if="tool.input !== undefined" :input="tool.input" />
            <ToolOutput
              v-if="tool.output !== undefined"
              :output="tool.output"
              :error-text="tool.state === 'output-error' ? String(tool.output) : ''"
            />
          </ToolContent>
        </Tool>

        <!-- Sources -->
        <Sources v-if="sources.length > 0">
          <SourcesTrigger :count="sources.length" />
          <SourcesContent>
            <Source
              v-for="s in sources"
              :key="s.sourceId"
              :href="s.url"
              :title="s.title ?? s.url"
            />
          </SourcesContent>
        </Sources>

        <MessageContent class="w-full min-w-0 break-words">
          <Loader v-if="showLoader" :size="16" />
          <MessageResponse v-else-if="text.length > 0" :content="text" />
          <span v-else class="text-muted-foreground">…</span>
        </MessageContent>

        <!-- Actions: regenerate the response -->
        <MessageActions v-if="!isStreaming" class="mt-1">
          <MessageAction
            label="Regenerate"
            tooltip="Regenerate response"
            @click="store.regenerate(message.id)"
          >
            <RefreshCcw class="size-3.5" />
          </MessageAction>
        </MessageActions>
      </div>
    </template>

    <MessageContent v-else class="max-w-full break-words">
      <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
    </MessageContent>
  </Message>
</template>
