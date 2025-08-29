import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  catalogRules: mergeCatalogRules([
    {
      name: 'screeshot',
      match: [/puppeteer/],
      priority: 0,
    },
    {
      name: 'terminal',
      match: [/@xterm/],
      priority: 0,
    },
    {
      name: 'network',
      match: [/ws/],
    },
    {
      name: 'utils',
      match: [
        /get-port/,
        /kill-port/,
        /string-width/,
        /fancy-ansi/,
        /html-format/,
      ],
    },
  ]),
})
