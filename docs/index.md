---
layout: home

hero:
  name: AI Elements Vue
  text: Cookbook for AI-native Vue apps
  tagline: Recipe-style guide for AI Elements Vue — from basic components to full chat & workflow applications.
  image:
    src: /logo.svg
    alt: AI Elements Vue
  actions:
    - theme: brand
      text: Get Started
      link: /01-getting-started
    - theme: alt
      text: Glossary
      link: /glossary
    - theme: alt
      text: GitHub
      link: https://github.com/vuepont/ai-elements-vue

features:
  - title: ⚡ Basic
    details: Install the CLI, render your first Message & Conversation, wire up a PromptInput with model selection.
    link: /01-getting-started
  - title: 🧠 Intermediate
    details: Reasoning & thinking, tool calls, confirmations, token usage, queues, sources & citations.
    link: /04-reasoning-and-thinking
  - title: 🚀 Advanced
    details: A complete chat application, workflow canvases, artifacts, terminal & theming.
    link: /09-full-chat-application
  - title: 📖 Reference
    details: Glossary of every component and AI SDK term used across the cookbook.
    link: /glossary
---

<!-- markdownlint-disable MD041 -->

## Chapters at a glance

Every entry is a self-contained **Problem → Solution → Code → Notes** recipe you
can copy straight into your Vue.js or Nuxt.js project.

| Level            | Chapter                                                                | Covers                                                   |
| ---------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| **Basic**        | [Getting Started](./01-getting-started)                                | Install, prerequisites, add your first component         |
| **Basic**        | [Message & Conversation](./02-message-and-conversation)                | `Message`, `Conversation`, branches, actions, streaming  |
| **Basic**        | [Prompt Input](./03-prompt-input)                                      | `PromptInput`, `ModelSelector`, attachments, submit flow |
| **Intermediate** | [Reasoning & Thinking](./04-reasoning-and-thinking)                    | `Reasoning`, `ChainOfThought`, `Shimmer`                 |
| **Intermediate** | [Tools, Confirmation & Context](./05-tools-confirmation-context)       | `Tool`, `Confirmation`, `Context`, `CodeBlock`           |
| **Intermediate** | [Queue, Task & Plan](./06-queue-task-plan)                             | `Queue`, `Task`, `Plan`                                  |
| **Intermediate** | [Sources, Citations & Attachments](./07-sources-citations-attachments) | `Sources`, `InlineCitation`, `Attachments`, `Suggestion` |
| **Advanced**     | [Artifacts, Terminal & FileTree](./08-artifacts-terminal-filetree)     | `Artifact`, `Terminal`, `FileTree`, `Loader`             |
| **Advanced**     | [Full Chat Application](./09-full-chat-application)                    | Complete working chat UI (the "chatbot" recipe)          |
| **Advanced**     | [Workflow Canvas](./10-workflow-canvas)                                | `Canvas`, `Node`, `Edge`, `Controls`, `Panel`, `Toolbar` |
| **Advanced**     | [Voice, Media & Theming](./11-voice-media-theming)                     | Audio/speech components, `Image`, `WebPreview`, theming  |
| **Reference**    | [Glossary](./glossary)                                                 | Terms, components, and AI SDK concepts                   |

## Local development

```bash
npm run docs:dev       # start the docs dev server
npm run docs:build     # build the static site
npm run docs:preview   # preview the production build
```

> **Prerequisites:** Node.js 18+, a Vue/Nuxt project with the AI SDK,
> shadcn-vue initialized, and Tailwind CSS in CSS Variables mode. See
> [Getting Started](./01-getting-started) for details.
