<script setup lang="ts">
import { computed } from 'vue'
import { MessageSquare, Plus, SquarePen, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat'

const store = useChatStore()

const sortedConversations = computed(() =>
  [...store.conversations].sort((a, b) => b.updatedAt - a.updatedAt),
)

function formatTime(ts: number) {
  const date = new Date(ts)
  const sameDay = date.toDateString() === new Date().toDateString()
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
</script>

<template>
  <aside class="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 pt-3 pb-2">
      <span class="text-sm font-semibold tracking-tight">AI Elements Chat</span>
      <Button
        size="icon-sm"
        variant="ghost"
        title="New chat"
        aria-label="New chat"
        @click="store.newConversation()"
      >
        <SquarePen class="size-4" />
      </Button>
    </div>

    <!-- New chat -->
    <div class="px-3 pb-2">
      <Button class="w-full justify-start gap-2" variant="outline" @click="store.newConversation()">
        <Plus class="size-4" />
        New chat
      </Button>
    </div>

    <!-- History list -->
    <nav class="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2">
      <p
        v-if="store.conversations.length === 0"
        class="px-2 py-8 text-center text-xs text-muted-foreground"
      >
        No conversations yet.
      </p>

      <button
        v-for="conv in sortedConversations"
        :key="conv.id"
        type="button"
        class="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        :class="
          cn(conv.id === store.activeId && 'bg-sidebar-accent text-sidebar-accent-foreground')
        "
        @click="store.selectConversation(conv.id)"
      >
        <MessageSquare class="size-3.5 shrink-0 text-muted-foreground" />
        <span class="min-w-0 flex-1 truncate">{{ conv.title }}</span>
        <span class="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {{ formatTime(conv.updatedAt) }}
        </span>
        <span
          class="hidden shrink-0 cursor-pointer rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:inline-flex"
          role="button"
          title="Delete conversation"
          aria-label="Delete conversation"
          @click.stop="store.deleteConversation(conv.id)"
        >
          <Trash2 class="size-3" />
        </span>
      </button>
    </nav>

    <!-- Static user card (no auth — fixed tester) -->
    <div class="border-t p-3">
      <div class="flex items-center gap-2.5">
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          {{ store.user.initials }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ store.user.name }}</p>
          <p class="truncate text-xs text-muted-foreground">{{ store.user.email }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
