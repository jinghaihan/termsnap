import type { TerminalOutput } from '../types'
import AnsiParser from 'ansi-parser'

/**
 * Clean ANSI escape sequences from text for accurate line counting
 * Using ansi-parser for more reliable ANSI handling
 */
export function cleanAnsiSequences(text: string): string {
  return AnsiParser.removeAnsi(text)
}

/**
 * Fix emoji spacing issues for better xterm.js rendering
 * Many emojis consume more visual space than expected in terminals,
 * causing spacing issues with following characters. This function detects emoji characters
 * and adds a space after each emoji.
 */
export function fixEmojiSpacing(text: string): string {
  // Unicode ranges for emoji characters including:
  // - Basic emoticons (U+1F600-U+1F64F)
  // - Symbols & pictographs (U+1F300-U+1F5FF)
  // - Transport & map symbols (U+1F680-U+1F6FF)
  // - Other emoji ranges

  // Simply add a space after every emoji, no matter what follows
  return text.replace(/([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/gu, '$1 ')
}

/**
 * Process terminal outputs and return combined output with dimensions
 * This function combines all outputs and calculates dimensions using ansi-parser
 */
export function processTerminalOutputs(outputs: TerminalOutput[]): {
  combinedOutput: string
  lineCount: number
  maxLineLength: number
} {
  // Combine all outputs into a single string
  const combinedOutput = outputs
    .filter(output => output.type === 'output')
    .map(output => output.data)
    .join('')
    .trim()

  // Apply emoji spacing fix before final processing
  const fixedText = fixEmojiSpacing(combinedOutput)

  // Use ansi-parser to remove all ANSI sequences and get clean text for dimension calculation
  const cleanText = cleanAnsiSequences(fixedText)

  // Split into lines and calculate dimensions
  const lines = cleanText.split('\n')
  const lineCount = lines.length
  const maxLineLength = Math.max(...lines.map((line: string) => line.length), 0)

  return { combinedOutput: fixedText, lineCount, maxLineLength }
}

/**
 * Parse CSS spacing value (padding or margin) and return horizontal and vertical spacing
 * Supports formats: "16px", "16px 32px", "16px 0 32px 32px", etc.
 */
export function parseSpacing(spacingStr: string): { horizontal: number, vertical: number } {
  if (!spacingStr || spacingStr === '0') {
    return { horizontal: 0, vertical: 0 }
  }

  // Remove 'px' and split by spaces
  const values = spacingStr.replace(/px/g, '').trim().split(/\s+/)

  if (values.length === 1) {
    // Single value: "16px" -> all sides
    const value = Number.parseInt(values[0]) || 0
    return { horizontal: value * 2, vertical: value * 2 }
  }
  else if (values.length === 2) {
    // Two values: "16px 32px" -> vertical horizontal
    const vertical = Number.parseInt(values[0]) || 0
    const horizontal = Number.parseInt(values[1]) || 0
    return { horizontal: horizontal * 2, vertical: vertical * 2 }
  }
  else if (values.length === 4) {
    // Four values: "16px 0 32px 32px" -> top right bottom left
    const top = Number.parseInt(values[0]) || 0
    const right = Number.parseInt(values[1]) || 0
    const bottom = Number.parseInt(values[2]) || 0
    const left = Number.parseInt(values[3]) || 0
    return { horizontal: left + right, vertical: top + bottom }
  }
  else {
    // Fallback to 0
    return { horizontal: 0, vertical: 0 }
  }
}
