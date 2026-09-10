import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import ChatLayout from '@/components/chat/ChatLayout.vue'

describe('ChatLayout', () => {
  it('renders the standard chat layout with a history sidebar', () => {
    const wrapper = mount(ChatLayout, {
      global: {
        plugins: [createPinia()],
        // The chat view pulls in heavier ai-elements components; the layout
        // contract is covered by the sidebar here.
        stubs: {
          ChatView: true,
        },
      },
    })

    expect(wrapper.text()).toContain('AI Elements Chat')
    expect(wrapper.text()).toContain('New chat')
    expect(wrapper.text()).toContain('Tester')
  })
})
