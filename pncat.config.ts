import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  depFields: {
    optionalDependencies: true,
  },
  catalogRules: mergeCatalogRules([
    {
      name: 'browser',
      match: [/puppeteer/],
      priority: 0,
    },
    {
      name: 'terminal',
      match: [/@xterm/],
      priority: 0,
    },
    {
      name: 'ffmpeg',
      match: [/@ffmpeg-installer/],
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
        /restore-cursor/,
        /string-width/,
        /ansi_up/,
        /strip-ansi/,
        /html-format/,
      ],
    },
  ]),
})
