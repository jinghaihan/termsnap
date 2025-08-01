import type { StyleOptions, TerminalOutput } from '../types'
import { mergeConfigWithTheme } from '../themes'
import { parseSpacing, processTerminalOutputs } from './text'

/**
 * Calculate terminal container dimensions based on output content and theme
 */
export async function calculateContainerDimensions(
  outputs: TerminalOutput[],
  themeName: string = 'vitesse-dark',
  config?: StyleOptions,
): Promise<{ width: number, height: number }> {
  const mergedTheme = await mergeConfigWithTheme(themeName, config)

  // Check if user provided explicit width and height
  if (config?.width && config?.height) {
    return {
      width: Math.ceil(Number.parseFloat(config.width)),
      height: Math.ceil(Number.parseFloat(config.height)),
    }
  }

  const fontSize = mergedTheme.font?.fontSize || 14
  const lineHeight = mergedTheme.font?.lineHeight || 1.5

  // Calculate character width (approximate for monospace fonts)
  const charWidth = fontSize * 0.65 // Approximate width of a character in pixels

  // Calculate line height
  const lineHeightPx = fontSize * lineHeight

  // Use the processTerminalOutputs function that returns combined output and dimensions
  const { lineCount, maxLineLength } = processTerminalOutputs(outputs)

  // Parse padding from theme
  const padding = parseSpacing(mergedTheme.padding || '0')

  // Calculate minimum dimensions with proper padding
  let width = maxLineLength * charWidth + padding.horizontal
  let height = lineCount * lineHeightPx + padding.vertical

  // If user provided only width, use it and calculate height
  if (config?.width) {
    width = Number.parseFloat(config.width)
  }

  // If user provided only height, use it and calculate width
  if (config?.height) {
    height = Number.parseFloat(config.height)
  }

  if (config?.decoration) {
    height += 32 // Decoration bar height
  }

  return { width: Math.ceil(width), height: Math.ceil(height) }
}
