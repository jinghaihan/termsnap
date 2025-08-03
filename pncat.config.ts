import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  catalogRules: mergeCatalogRules([
    {
      name: 'network',
      match: [/ws/],
    },
    {
      name: 'utils',
      match: [/ansi-parser/],
    },
  ]),
})
