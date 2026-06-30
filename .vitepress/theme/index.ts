import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { markRaw } from 'vue'
import { meshRenderers } from '@meshflow/form-vue'
import { createVuetify } from 'vuetify'

// @jsonforms/vue 内部把 renderers 放进 reactive() store，
// 导致 Vue 深度代理组件对象，产生大量 "Component made reactive" warning。
// 在此对 meshflow 内置渲染器做一次性 markRaw patch：
// meshRenderers 是模块级引用，MeshForm 内部的 M 与之共享同一数组，
// 提前打标记后 JSONForms 拿到的就已经是 raw 版本，不再触发警告。
meshRenderers.forEach(r => { r.renderer = markRaw(r.renderer as object) })
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    const vuetify = createVuetify({
      components,
      directives,
      icons: {
        defaultSet: 'mdi',
        aliases,
        sets: { mdi },
      },
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            dark: true,
            colors: {
              primary:  '#6366f1',
              success:  '#4caf50',
              info:     '#42a5f5',
              warning:  '#f59e0b',
              error:    '#ef4444',
              surface:  '#1e1e2e',
              background: '#0f0f1a',
            },
          },
        },
      },
    })
    app.use(vuetify)
  },
} satisfies Theme
