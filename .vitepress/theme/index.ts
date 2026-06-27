import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { createVuetify } from 'vuetify'
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
