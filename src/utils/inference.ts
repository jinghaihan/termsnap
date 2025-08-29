import type { ConfigOptions } from '../types'

export function isAnimatedMode(options: ConfigOptions) {
  return options.openReplay || options.replay
}
