import type { ConfigOptions } from '../types'
import { DECORATION_BAR_HEIGHT } from '../constants'
import { parseSpacing } from './parse'

export function calculateContainerDimensions(rows: number, cols: number, options: ConfigOptions) {
  if (options.width && options.height) {
    return {
      width: normalizeSize(options.width),
      height: normalizeSize(options.height),
    }
  }

  const { fontSize, lineHeight } = options.font
  // Calculate character width (approximate for monospace fonts)
  const charWidth = fontSize * 0.60
  const lineHeightPx = fontSize * lineHeight

  const padding = parseSpacing(options.padding)
  let width = normalizeSize(cols * charWidth + padding.horizontal)
  let height = normalizeSize(rows * lineHeightPx + padding.vertical)

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
