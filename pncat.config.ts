import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  depFields: {
    optionalDependencies: true,
  },
  catalogRules: mergeCatalogRules([
    {
      name: 'puppeteer',
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
        '@antfu/install-pkg',
        /port/,
        /restore-cursor/,
        /string-width/,
        /ansi/,
        /html-format/,
      ],
    },
  ]),
  postRun: 'eslint --fix .',
})
