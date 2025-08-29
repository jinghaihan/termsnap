import type { TerminalInteraction, TypedOptions } from '../types'
import { DEFAULT_TYPED_OPTIONS } from '../constants'

export function generateTypedInteractions(command: string, startTimestamp: number = 0, options: TypedOptions = {}): TerminalInteraction[] {
  const {
    speed = DEFAULT_TYPED_OPTIONS.speed,
    initialDelay = DEFAULT_TYPED_OPTIONS.initialDelay,
    pauseAfter = DEFAULT_TYPED_OPTIONS.pauseAfter,
  } = options

  const interactions: TerminalInteraction[] = []
  let timestamp = startTimestamp + initialDelay

  interactions.push({
    type: 'output',
    data: `\x1B[32m➜\x1B[0m `,
    timestamp,
  })

  for (let i = 0; i < command.length; i++) {
    const char = command[i]
    timestamp += speed

    interactions.push({
      type: 'output',
      data: char,
      timestamp,
    })
  }

  if (pauseAfter > 0) {
    timestamp += pauseAfter
    interactions.push({
      type: 'output',
      data: '\r\n',
      timestamp,
    })
  }

  return interactions
}

export function prependTypedEffect(interactions: TerminalInteraction[], command: string, options: TypedOptions = {}): TerminalInteraction[] {
  if (interactions.length === 0) {
    return generateTypedInteractions(command, 0, options)
  }

  const typedInteractions = generateTypedInteractions(command, 0, options)

  const lastTimestamp = typedInteractions[typedInteractions.length - 1]?.timestamp || 0
  const offsetTime = lastTimestamp + (options.pauseAfter || 500)

  const adjustedInteractions = interactions.map(interaction => ({
    ...interaction,
    timestamp: interaction.timestamp + offsetTime,
  }))

  return [...typedInteractions, ...adjustedInteractions]
}
