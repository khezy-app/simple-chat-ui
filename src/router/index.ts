import { defineComponent, h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

// Single-page chat app — App.vue renders the layout directly. This catch-all
// keeps the router happy and leaves room for future routes (e.g. /c/:id).
const EmptyRoute = defineComponent({
  render: () => h('div'),
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/:pathMatch(.*)*', component: EmptyRoute }],
})

export default router
