<script setup lang="ts">
import ChatSidebar from './ChatSidebar.vue'
import ChatView from './ChatView.vue'
</script>

<template>
  <!-- Standard two-pane chat layout: history on the left, chat UI on the right -->
  <div class="flex h-dvh w-full overflow-hidden bg-background">
    <ChatSidebar class="shrink-0" />
    <main class="flex min-w-0 flex-1 flex-col">
      <ChatView />
    </main>
  </div>
</template>
