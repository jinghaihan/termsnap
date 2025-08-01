import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  catalogRules: mergeCatalogRules([
    {
      name: 'network',
      match: [/ws/],
      priority: 0,
    },
    {
      name: 'utils',
      match: [/ansi-parser/],
      priority: 0,
    },
  ]),
})
