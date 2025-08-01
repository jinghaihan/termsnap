import type { CommandOptions } from './types'

export * from './types'

export function defineConfig(config: Partial<CommandOptions>) {
  return config
}
