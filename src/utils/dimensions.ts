import type { ConfigOptions, TerminalOutput } from '../types'
import { DECORATION_BAR_HEIGHT } from '../constants'
import { parseSpacing } from './parse'
import { processTerminalOutputs } from './text'

export function calculateContainerDimensions(outputs: TerminalOutput[], options: ConfigOptions) {
  if (options.width && options.height) {
    return {
      width: normalizeSize(options.width),
      height: normalizeSize(options.height),
    }
  }

  const { lineCount, maxLineLength } = processTerminalOutputs(outputs)
  const { fontSize, lineHeight } = options.font
  // Calculate character width (approximate for monospace fonts)
  const charWidth = fontSize * 0.60
  const lineHeightPx = fontSize * lineHeight

  const padding = parseSpacing(options.padding)
  let width = normalizeSize(maxLineLength * charWidth + padding.horizontal)
  let height = normalizeSize(lineCount * lineHeightPx + padding.vertical)

  if (options.width)
    width = normalizeSize(options.width)

  if (options.height)
    height = normalizeSize(options.height)

  // Decoration bar height
  if (options.decoration) {
    height += DECORATION_BAR_HEIGHT
  }

  return { width, height }
}

function normalizeSize(size: number | string) {
  return Math.ceil(Number.parseFloat(String(size)))
}
