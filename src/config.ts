import type { CommandOptions } from './types'
import process from 'node:process'
import { createConfigLoader } from 'unconfig'
import { DEFAULT_COMMAND_OPTIONS } from './constants'

function normalizeConfig(options: Partial<CommandOptions>) {
  // interop
  if ('default' in options)
    options = options.default as Partial<CommandOptions>

  return options
}

export async function resolveConfig(options: Partial<CommandOptions>): Promise<CommandOptions> {
  const defaults = { ...DEFAULT_COMMAND_OPTIONS }
  options = normalizeConfig(options)

  // cac performs implicit type conversion, so need to handle the case where theme is a number
  if (typeof options.theme === 'number') {
    const args = process.argv.slice(2)
    const themeIndex = args.indexOf('--theme')
    if (themeIndex !== -1) {
      options.theme = args[themeIndex + 1]
    }
  }

  const loader = createConfigLoader<CommandOptions>({
    sources: [
      {
        files: [
          'termsnap.config',
        ],
      },
      {
        files: [
          '.termsnaprc',
        ],
        extensions: ['json', ''],
      },
    ],
    cwd: process.cwd(),
    merge: false,
  })

  const config = await loader.load()
  if (!config.sources.length)
    return { ...defaults, ...options }

  const configOptions = normalizeConfig(config.config)

  return { ...configOptions, ...options }
}
