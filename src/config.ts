import type { CommandOptions, ConfigOptions, DeepRequired, ThemeConfig } from './types'
import process from 'node:process'
import getPort, { portNumbers } from 'get-port'
import { createConfigLoader } from 'unconfig'
import { loadTheme } from './themes'

function normalizeConfig(options: Partial<CommandOptions>) {
  // interop
  if ('default' in options)
    options = options.default as Partial<CommandOptions>

  return options
}

export async function resolveConfig(command: string, options: Partial<CommandOptions>): Promise<ConfigOptions> {
  options = normalizeConfig(options)

  // in some case cac will perform implicit type conversion
  if (typeof options.theme === 'number') {
    const args = process.argv.slice(2)
    const themeIndex = args.indexOf('--theme')
    if (themeIndex !== -1) {
      options.theme = args[themeIndex + 1]
    }
  }

  options.cwd = options.cwd || process.cwd()
  options.open = options.open || (!options.html && !options.screenshot)

  if (typeof options.html === 'boolean')
    options.html = 'termsnap.html'
  else if (options.html)
    options.html = options.html.endsWith('.html') ? options.html : `${options.html}.html`

  if (typeof options.screenshot === 'boolean')
    options.screenshot = 'termsnap.png'

  options.port = options.port ? Number(options.port) : 3000
  options.theme = options.theme || 'vitesse-dark'
  options.decoration = options.decoration || false
  options.force = options.force || false
  options.dpi = options.dpi || 2

  const loader = createConfigLoader<CommandOptions>({
    sources: [
      {
        files: [
          'termsnap.config',
        ],
      },
    ],
    cwd: options.cwd,
    merge: false,
  })

  const config = await loader.load()
  const configOptions = config.sources.length ? normalizeConfig(config.config) : {}
  const merged = { ...configOptions, ...options }

  options.port = await getPort({ port: portNumbers(options.port, options.port + 100) })
  const themeConfig = await loadTheme(options.theme, options.force) as DeepRequired<ThemeConfig>

  // font config
  themeConfig.font.fontFamily = merged.fontFamily || themeConfig.font.fontFamily
  themeConfig.font.fontSize = merged.fontSize || themeConfig.font.fontSize
  themeConfig.font.fontWeight = merged.fontWeight || themeConfig.font.fontWeight
  themeConfig.font.lineHeight = merged.lineHeight || themeConfig.font.lineHeight

  // border config
  themeConfig.border.borderColor = merged.borderColor || themeConfig.border.borderColor
  themeConfig.border.borderRadius = merged.borderRadius || themeConfig.border.borderRadius
  themeConfig.border.borderWidth = merged.borderWidth || themeConfig.border.borderWidth

  themeConfig.theme = { ...themeConfig.theme, ...merged.colors }
  themeConfig.boxShadow = merged.boxShadow || themeConfig.boxShadow
  themeConfig.padding = merged.padding || themeConfig.padding
  themeConfig.margin = merged.margin || themeConfig.margin

  return { command, ...merged, ...themeConfig } as ConfigOptions
}
