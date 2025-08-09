import type { TerminalOutput } from '../types'
import emojiRegex from 'emoji-regex'
import stripAnsi from 'strip-ansi'

const EMOJI_REGEX = emojiRegex()

// Add a space after every emoji
function fixEmojiSpacing(text: string): string {
  return text.replace(EMOJI_REGEX, '$& ')
}

// Remove spinner characters
function cleanSpinner(text: string): string {
  return text.replace(/[⠙⠹⠸⠼⠴⠦⠧⠇⠏⠋]/g, '')
}

function cleanOutput(text: string): string {
  return cleanSpinner(fixEmojiSpacing(text))
}

export function processTerminalOutputs(outputs: TerminalOutput[]) {
  // Combine all outputs into a single string
  const combinedOutput = cleanOutput(
    outputs
      .filter(output => output.type === 'output')
      .map(output => output.data)
      .join('')
      .trim(),
  )
  const rawText = stripAnsi(combinedOutput)

  const lines = rawText.split('\n')
  const lineCount = lines.length
  const maxLineLength = Math.max(...lines.map((line: string) => line.length), 0)

  return { combinedOutput, lineCount, maxLineLength }
}
