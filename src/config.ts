import type { CommandOptions, CommonOptions } from './types'
import process from 'node:process'
import { createConfigLoader } from 'unconfig'
import { DEFAULT_COMMAND_OPTIONS } from './constants'

function normalizeConfig(options: Partial<CommandOptions>) {
  // interop
  if ('default' in options)
    options = options.default as Partial<CommandOptions>

  return options
}

export async function resolveConfig(options: Partial<CommonOptions>): Promise<CommandOptions> {
  const defaults = { ...DEFAULT_COMMAND_OPTIONS }
  options = normalizeConfig(options)

  const loader = createConfigLoader<CommonOptions>({
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
  const merged = { ...configOptions, ...options }
  if (!merged.screenshot && !merged.html && !merged.open) {
    merged.open = true
  }

  return merged
}
