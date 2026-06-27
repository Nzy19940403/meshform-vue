// .vitepress/config.mts
import { defineConfig } from "file:///sessions/eloquent-gallant-brahmagupta/mnt/meshform-doc/node_modules/vitepress/dist/node/index.js";
var config_default = defineConfig({
  title: "@meshflow/form-vue",
  description: "JSON Schema-driven Vue 3 form engine with meshflow linkage",
  vite: {
    ssr: {
      noExternal: ["@vue-flow/core"]
    }
  },
  head: [
    ["link", { rel: "icon", href: "/logo.svg" }],
    ["meta", { name: "theme-color", content: "#0a0a0f" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    ["link", { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" }]
  ],
  locales: {
    root: {
      label: "Chinese",
      lang: "zh-CN",
      themeConfig: {
        nav: [
          { text: "Home", link: "/" },
          { text: "Guide", link: "/guide/getting-started" },
          { text: "API", link: "/guide/api" },
          { text: "Demo", link: "/demos/insurance" }
        ],
        sidebar: [
          {
            text: "Getting Started",
            items: [
              { text: "Quick Start", link: "/guide/getting-started" },
              { text: "Why meshform-vue", link: "/guide/why" }
            ]
          },
          {
            text: "Core Concepts",
            items: [
              { text: "Schema", link: "/guide/schema" },
              { text: "Linkage API", link: "/guide/linkage" },
              { text: "MeshForm Component", link: "/guide/mesh-form" },
              { text: "Custom Renderer", link: "/guide/custom-renderer" }
            ]
          },
          {
            text: "API Reference",
            items: [
              { text: "Full API", link: "/guide/api" }
            ]
          },
          {
            text: "Demos",
            items: [
              { text: "Insurance Application", link: "/demos/insurance" },
              { text: "Cloud Order Form", link: "/demos/order-form" }
            ]
          }
        ]
      }
    }
  },
  themeConfig: {
    socialLinks: [
      { icon: "github", link: "https://github.com/Nzy19940403/meshflow" },
      { icon: "npm", link: "https://www.npmjs.com/package/@meshflow/form-vue" }
    ],
    footer: {
      message: "MeshForm - JSON Schema driven Vue 3 form engine",
      copyright: "AGPL-3.0-or-later"
    }
  }
});
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLnZpdGVwcmVzcy9jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3Nlc3Npb25zL2Vsb3F1ZW50LWdhbGxhbnQtYnJhaG1hZ3VwdGEvbW50L21lc2hmb3JtLWRvYy8udml0ZXByZXNzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvZWxvcXVlbnQtZ2FsbGFudC1icmFobWFndXB0YS9tbnQvbWVzaGZvcm0tZG9jLy52aXRlcHJlc3MvY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vc2Vzc2lvbnMvZWxvcXVlbnQtZ2FsbGFudC1icmFobWFndXB0YS9tbnQvbWVzaGZvcm0tZG9jLy52aXRlcHJlc3MvY29uZmlnLm10c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGVwcmVzcydcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGl0bGU6IFwiQG1lc2hmbG93L2Zvcm0tdnVlXCIsXG4gIGRlc2NyaXB0aW9uOiBcIkpTT04gU2NoZW1hLWRyaXZlbiBWdWUgMyBmb3JtIGVuZ2luZSB3aXRoIG1lc2hmbG93IGxpbmthZ2VcIixcbiAgdml0ZToge1xuICAgIHNzcjoge1xuICAgICAgbm9FeHRlcm5hbDogWydAdnVlLWZsb3cvY29yZSddLFxuICAgIH0sXG4gIH0sXG4gIGhlYWQ6IFtcbiAgICBbJ2xpbmsnLCB7IHJlbDogJ2ljb24nLCBocmVmOiAnL2xvZ28uc3ZnJyB9XSxcbiAgICBbJ21ldGEnLCB7IG5hbWU6ICd0aGVtZS1jb2xvcicsIGNvbnRlbnQ6ICcjMGEwYTBmJyB9XSxcbiAgICBbJ2xpbmsnLCB7IHJlbDogJ3ByZWNvbm5lY3QnLCBocmVmOiAnaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbScgfV0sXG4gICAgWydsaW5rJywgeyByZWw6ICdwcmVjb25uZWN0JywgaHJlZjogJ2h0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb20nLCBjcm9zc29yaWdpbjogJycgfV0sXG4gICAgWydsaW5rJywgeyByZWw6ICdzdHlsZXNoZWV0JywgaHJlZjogJ2h0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9SmV0QnJhaW5zK01vbm86d2dodEA0MDA7NTAwOzYwMDs3MDA7ODAwJmRpc3BsYXk9c3dhcCcgfV0sXG4gIF0sXG4gIGxvY2FsZXM6IHtcbiAgICByb290OiB7XG4gICAgICBsYWJlbDogJ0NoaW5lc2UnLFxuICAgICAgbGFuZzogJ3poLUNOJyxcbiAgICAgIHRoZW1lQ29uZmlnOiB7XG4gICAgICAgIG5hdjogW1xuICAgICAgICAgIHsgdGV4dDogJ0hvbWUnLCBsaW5rOiAnLycgfSxcbiAgICAgICAgICB7IHRleHQ6ICdHdWlkZScsIGxpbms6ICcvZ3VpZGUvZ2V0dGluZy1zdGFydGVkJyB9LFxuICAgICAgICAgIHsgdGV4dDogJ0FQSScsIGxpbms6ICcvZ3VpZGUvYXBpJyB9LFxuICAgICAgICAgIHsgdGV4dDogJ0RlbW8nLCBsaW5rOiAnL2RlbW9zL2luc3VyYW5jZScgfSxcbiAgICAgICAgXSxcbiAgICAgICAgc2lkZWJhcjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6ICdHZXR0aW5nIFN0YXJ0ZWQnLFxuICAgICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgICAgeyB0ZXh0OiAnUXVpY2sgU3RhcnQnLCBsaW5rOiAnL2d1aWRlL2dldHRpbmctc3RhcnRlZCcgfSxcbiAgICAgICAgICAgICAgeyB0ZXh0OiAnV2h5IG1lc2hmb3JtLXZ1ZScsIGxpbms6ICcvZ3VpZGUvd2h5JyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6ICdDb3JlIENvbmNlcHRzJyxcbiAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgIHsgdGV4dDogJ1NjaGVtYScsIGxpbms6ICcvZ3VpZGUvc2NoZW1hJyB9LFxuICAgICAgICAgICAgICB7IHRleHQ6ICdMaW5rYWdlIEFQSScsIGxpbms6ICcvZ3VpZGUvbGlua2FnZScgfSxcbiAgICAgICAgICAgICAgeyB0ZXh0OiAnTWVzaEZvcm0gQ29tcG9uZW50JywgbGluazogJy9ndWlkZS9tZXNoLWZvcm0nIH0sXG4gICAgICAgICAgICAgIHsgdGV4dDogJ0N1c3RvbSBSZW5kZXJlcicsIGxpbms6ICcvZ3VpZGUvY3VzdG9tLXJlbmRlcmVyJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6ICdBUEkgUmVmZXJlbmNlJyxcbiAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgIHsgdGV4dDogJ0Z1bGwgQVBJJywgbGluazogJy9ndWlkZS9hcGknIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogJ0RlbW9zJyxcbiAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgIHsgdGV4dDogJ0luc3VyYW5jZSBBcHBsaWNhdGlvbicsIGxpbms6ICcvZGVtb3MvaW5zdXJhbmNlJyB9LFxuICAgICAgICAgICAgICB7IHRleHQ6ICdDbG91ZCBPcmRlciBGb3JtJywgbGluazogJy9kZW1vcy9vcmRlci1mb3JtJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB0aGVtZUNvbmZpZzoge1xuICAgIHNvY2lhbExpbmtzOiBbXG4gICAgICB7IGljb246ICdnaXRodWInLCBsaW5rOiAnaHR0cHM6Ly9naXRodWIuY29tL056eTE5OTQwNDAzL21lc2hmbG93JyB9LFxuICAgICAgeyBpY29uOiAnbnBtJywgbGluazogJ2h0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL0BtZXNoZmxvdy9mb3JtLXZ1ZScgfSxcbiAgICBdLFxuICAgIGZvb3Rlcjoge1xuICAgICAgbWVzc2FnZTogJ01lc2hGb3JtIC0gSlNPTiBTY2hlbWEgZHJpdmVuIFZ1ZSAzIGZvcm0gZW5naW5lJyxcbiAgICAgIGNvcHlyaWdodDogJ0FHUEwtMy4wLW9yLWxhdGVyJyxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1gsU0FBUyxvQkFBb0I7QUFFN1ksSUFBTyxpQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLEVBQ1AsYUFBYTtBQUFBLEVBQ2IsTUFBTTtBQUFBLElBQ0osS0FBSztBQUFBLE1BQ0gsWUFBWSxDQUFDLGdCQUFnQjtBQUFBLElBQy9CO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osQ0FBQyxRQUFRLEVBQUUsS0FBSyxRQUFRLE1BQU0sWUFBWSxDQUFDO0FBQUEsSUFDM0MsQ0FBQyxRQUFRLEVBQUUsTUFBTSxlQUFlLFNBQVMsVUFBVSxDQUFDO0FBQUEsSUFDcEQsQ0FBQyxRQUFRLEVBQUUsS0FBSyxjQUFjLE1BQU0sK0JBQStCLENBQUM7QUFBQSxJQUNwRSxDQUFDLFFBQVEsRUFBRSxLQUFLLGNBQWMsTUFBTSw2QkFBNkIsYUFBYSxHQUFHLENBQUM7QUFBQSxJQUNsRixDQUFDLFFBQVEsRUFBRSxLQUFLLGNBQWMsTUFBTSxnR0FBZ0csQ0FBQztBQUFBLEVBQ3ZJO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsTUFDSixPQUFPO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixhQUFhO0FBQUEsUUFDWCxLQUFLO0FBQUEsVUFDSCxFQUFFLE1BQU0sUUFBUSxNQUFNLElBQUk7QUFBQSxVQUMxQixFQUFFLE1BQU0sU0FBUyxNQUFNLHlCQUF5QjtBQUFBLFVBQ2hELEVBQUUsTUFBTSxPQUFPLE1BQU0sYUFBYTtBQUFBLFVBQ2xDLEVBQUUsTUFBTSxRQUFRLE1BQU0sbUJBQW1CO0FBQUEsUUFDM0M7QUFBQSxRQUNBLFNBQVM7QUFBQSxVQUNQO0FBQUEsWUFDRSxNQUFNO0FBQUEsWUFDTixPQUFPO0FBQUEsY0FDTCxFQUFFLE1BQU0sZUFBZSxNQUFNLHlCQUF5QjtBQUFBLGNBQ3RELEVBQUUsTUFBTSxvQkFBb0IsTUFBTSxhQUFhO0FBQUEsWUFDakQ7QUFBQSxVQUNGO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sT0FBTztBQUFBLGNBQ0wsRUFBRSxNQUFNLFVBQVUsTUFBTSxnQkFBZ0I7QUFBQSxjQUN4QyxFQUFFLE1BQU0sZUFBZSxNQUFNLGlCQUFpQjtBQUFBLGNBQzlDLEVBQUUsTUFBTSxzQkFBc0IsTUFBTSxtQkFBbUI7QUFBQSxjQUN2RCxFQUFFLE1BQU0sbUJBQW1CLE1BQU0seUJBQXlCO0FBQUEsWUFDNUQ7QUFBQSxVQUNGO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sT0FBTztBQUFBLGNBQ0wsRUFBRSxNQUFNLFlBQVksTUFBTSxhQUFhO0FBQUEsWUFDekM7QUFBQSxVQUNGO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sT0FBTztBQUFBLGNBQ0wsRUFBRSxNQUFNLHlCQUF5QixNQUFNLG1CQUFtQjtBQUFBLGNBQzFELEVBQUUsTUFBTSxvQkFBb0IsTUFBTSxvQkFBb0I7QUFBQSxZQUN4RDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxhQUFhO0FBQUEsSUFDWCxhQUFhO0FBQUEsTUFDWCxFQUFFLE1BQU0sVUFBVSxNQUFNLDBDQUEwQztBQUFBLE1BQ2xFLEVBQUUsTUFBTSxPQUFPLE1BQU0sbURBQW1EO0FBQUEsSUFDMUU7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLFNBQVM7QUFBQSxNQUNULFdBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
