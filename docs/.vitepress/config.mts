import { defineConfig } from 'vitepress'

// Site config for the AI Elements Vue cookbook.
// Run `npm run docs:dev` / `npm run docs:build` from the project root.

export default defineConfig({
  title: 'AI Elements Vue Cookbook',
  description:
    'Recipe-style guide for building AI-native Vue applications with AI Elements Vue — from basic components to full chat & workflow apps.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#41b883' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Cookbook', link: '/01-getting-started', activeMatch: '^/0[1-9]|^/1[01]' },
      { text: 'Glossary', link: '/glossary', activeMatch: '^/glossary' },
      {
        text: 'GitHub',
        link: 'https://github.com/vuepont/ai-elements-vue',
      },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Getting Started', link: '/01-getting-started' },
        ],
      },
      {
        text: 'Basic',
        collapsed: false,
        items: [
          { text: 'Message & Conversation', link: '/02-message-and-conversation' },
          { text: 'Prompt Input', link: '/03-prompt-input' },
        ],
      },
      {
        text: 'Intermediate',
        collapsed: false,
        items: [
          { text: 'Reasoning & Thinking', link: '/04-reasoning-and-thinking' },
          { text: 'Tools, Confirmation & Context', link: '/05-tools-confirmation-context' },
          { text: 'Queue, Task & Plan', link: '/06-queue-task-plan' },
          { text: 'Sources, Citations & Attachments', link: '/07-sources-citations-attachments' },
        ],
      },
      {
        text: 'Advanced',
        collapsed: false,
        items: [
          { text: 'Artifacts, Terminal & FileTree', link: '/08-artifacts-terminal-filetree' },
          { text: 'Full Chat Application', link: '/09-full-chat-application' },
          { text: 'Workflow Canvas', link: '/10-workflow-canvas' },
          { text: 'Voice, Media & Theming', link: '/11-voice-media-theming' },
        ],
      },
      {
        text: 'Reference',
        items: [{ text: 'Glossary', link: '/glossary' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/vuepont/ai-elements-vue' }],

    outline: { level: [2, 3], label: 'On this page' },

    footer: {
      message: 'Built on AI Elements Vue · shadcn-vue · AI SDK',
      copyright: 'MIT Licensed',
    },
  },
})
