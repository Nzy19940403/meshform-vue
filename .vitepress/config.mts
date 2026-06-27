import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "@meshflow/form-vue",
  description: "JSON Schema-driven Vue 3 form engine with meshflow linkage",
  vite: {
    ssr: {
      noExternal: ['@vue-flow/core', 'vuetify', '@meshflow/form-vue', '@meshflow/form', '@meshflow/core'],
    },
  },
  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#0a0a0f' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap' }],
  ],
  locales: {
    root: {
      label: 'Chinese',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'API', link: '/guide/api' },
          {
            text: 'Demo',
            items: [
              { text: 'Entangle 双向纠缠', link: '/demos/entangle' },
              { text: '人寿保险投保申请', link: '/demos/insurance' },
              { text: '云资源采购单',      link: '/demos/order-form' },
            ],
          },
        ],
        sidebar: [
          {
            text: 'Getting Started',
            items: [
              { text: 'Quick Start', link: '/guide/getting-started' },
              { text: 'Why meshform-vue', link: '/guide/why' },
            ],
          },
          {
            text: 'Core Concepts',
            items: [
              { text: 'Schema', link: '/guide/schema' },
              { text: 'Linkage API', link: '/guide/linkage' },
              { text: 'MeshForm Component', link: '/guide/mesh-form' },
              { text: 'Custom Renderer', link: '/guide/custom-renderer' },
            ],
          },
          {
            text: 'API Reference',
            items: [
              { text: 'Full API', link: '/guide/api' },
            ],
          },
          {
            text: 'Demos',
            items: [
              { text: 'Entangle: DAG + 双向纠缠', link: '/demos/entangle' },
              { text: 'Insurance Application', link: '/demos/insurance' },
              { text: 'Cloud Order Form', link: '/demos/order-form' },
            ],
          },
        ],
      },
    },
  },
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Nzy19940403/meshflow' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@meshflow/form-vue' },
    ],
    footer: {
      message: 'MeshForm - JSON Schema driven Vue 3 form engine',
      copyright: 'AGPL-3.0-or-later',
    },
  },
})
