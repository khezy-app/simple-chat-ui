<script setup lang="ts">
import { computed } from 'vue'
import { MessageSquare, Square } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import { Loader } from '@/components/ai-elements/loader'
import ChatMessageItem from './ChatMessageItem.vue'
import { useChatStore } from '@/stores/chat'
import { CHAT_MODELS } from '@/types/chat'

const store = useChatStore()

const messages = computed(() => store.activeMessages)
const busy = computed(() => store.status === 'submitted' || store.status === 'streaming')

function handleSubmit(message: PromptInputMessage) {
  const text = message.text.trim()
  if (!text && message.files.length === 0) return
  void store.sendMessage(text || 'Sent with attachments')
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Header -->
    <header class="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
      <div class="flex min-w-0 items-center gap-3">
        <h1 class="min-w-0 truncate text-sm font-semibold">
          {{ store.activeConversation?.title ?? 'New chat' }}
        </h1>

        <!-- Model selector (UI-level; the backend uses its configured model) -->
        <Select :model-value="store.selectedModel" @update:model-value="store.setModel">
          <SelectTrigger
            size="sm"
            class="h-8 gap-1 border-transparent bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
          >
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="m in CHAT_MODELS" :key="m.id" :value="m.id">
              {{ m.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <!-- Stop generating -->
        <Button
          v-if="busy"
          size="icon-sm"
          variant="ghost"
          title="Stop generating"
          aria-label="Stop generating"
          @click="store.stop()"
        >
          <Square class="size-3.5 fill-current" />
        </Button>

        <span v-if="store.status === 'streaming'" class="inline-flex items-center gap-1.5">
          <Loader :size="12" />
          Streaming…
        </span>
        <span v-else-if="store.status === 'submitted'" class="inline-flex items-center gap-1.5">
          <Loader :size="12" />
          Thinking…
        </span>
        <span v-else class="inline-flex items-center gap-1.5">
          <span class="size-1.5 rounded-full bg-green-500" />
          Spring AI · SSE
        </span>
      </div>
    </header>

    <!-- Transcript -->
    <div class="min-h-0 flex-1">
      <!-- `overflow-x-hidden` guarantees the conversation never scrolls
           horizontally; `max-w-3xl` keeps the reading column comfortable. -->
      <Conversation class="relative size-full overflow-x-hidden">
        <ConversationContent class="mx-auto w-full max-w-3xl">
          <ConversationEmptyState
            v-if="messages.length === 0"
            title="Start a conversation"
            description="Type a message below to talk to the Spring AI backend."
          >
            <template #icon>
              <MessageSquare class="size-6" />
            </template>
          </ConversationEmptyState>

          <ChatMessageItem
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
            :is-streaming="busy"
          />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>

    <!-- Prompt input -->
    <div class="shrink-0 p-4 pt-2">
      <PromptInputProvider @submit="handleSubmit">
        <PromptInput class="w-full rounded-xl border bg-background shadow-sm">
          <PromptInputBody>
            <PromptInputTextarea :disabled="busy" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit :status="store.status" :disabled="busy" />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
      <p class="mt-2 text-center text-xs text-muted-foreground">
        Testing <span class="font-mono">khezy-boot/ai/ai-elements</span> — POST
        <span class="font-mono">/api/chat</span> (SSE)
      </p>
    </div>
  </div>
</template>
