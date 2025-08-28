import type { TerminalOutput } from '../types'
import { FancyAnsi, stripAnsi } from 'fancy-ansi'

const fancyAnsi = new FancyAnsi()

// Remove spinner characters
function cleanSpinner(text: string): string {
  return text.replace(/[⠙⠹⠸⠼⠴⠦⠧⠇⠏⠋]/g, '')
}

function cleanOutput(text: string): string {
  return cleanSpinner(text)
}

function ansiToHTML(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      if (!line || line === '\r')
        return `<div class="terminal-line">&#8203;</div>`
      return `<div class="terminal-line">${fancyAnsi.toHtml(line)}</div>`
    })
    .join('')
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

  return {
    html: ansiToHTML(combinedOutput),
    lineCount,
    maxLineLength,
  }
}
