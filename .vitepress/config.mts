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
          { text: '首页', link: '/' },
          { text: '指南', link: '/guide/getting-started' },
          { text: 'API', link: '/guide/api' },
          {
            text: 'Demo',
            items: [
              { text: '云资源采购单',         link: '/demos/order-form'      },
              { text: 'Entangle 双向纠缠',   link: '/demos/entangle'        },
              { text: '人寿保险投保申请',     link: '/demos/insurance'       },
              { text: '企业团险组合定价',     link: '/demos/group-insurance' },
              { text: '养老年金双向规划',     link: '/demos/pension'         },
              { text: '工程报价单（DAG + 纠缠）', link: '/demos/engineering-quote' },
            ],
          },
        ],
        sidebar: [
          {
            text: '快速上手',
            items: [
              { text: '快速开始', link: '/guide/getting-started' },
              { text: '为什么选择 meshform-vue', link: '/guide/why' },
            ],
          },
          {
            text: '核心概念',
            items: [
              { text: '架构设计', link: '/guide/architecture' },
              { text: 'Schema', link: '/guide/schema' },
              { text: '联动 API', link: '/guide/linkage' },
              { text: 'MeshForm 组件', link: '/guide/mesh-form' },
              { text: '自定义渲染器', link: '/guide/custom-renderer' },
            ],
          },
          {
            text: 'API 参考',
            items: [
              { text: '完整 API', link: '/guide/api' },
            ],
          },
          {
            text: 'Demos',
            items: [
              { text: '云资源采购单',            link: '/demos/order-form'      },
              { text: 'Entangle: DAG + 双向纠缠', link: '/demos/entangle'        },
              { text: '人寿保险投保申请',        link: '/demos/insurance'       },
              { text: '企业团险组合定价',        link: '/demos/group-insurance' },
              { text: '养老年金双向规划',        link: '/demos/pension'         },
              { text: '工程报价单（DAG + 纠缠）', link: '/demos/engineering-quote' },
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
