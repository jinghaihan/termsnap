import type { ConfigOptions, TerminalOutput } from '../types'
import { FancyAnsi, stripAnsi } from 'fancy-ansi'
import stringWidth from 'string-width'
import { calculateContainerDimensions } from './dimensions'
import { getTerminalOutput } from './pty'

const fancyAnsi = new FancyAnsi()

function ansiToHTML(ansi: string): string {
  return ansi
    .split('\n')
    .map((line) => {
      if (!line || line === '\r')
        return `<div class="terminal-line">&#8203;</div>`
      return `<div class="terminal-line">${fancyAnsi.toHtml(line)}</div>`
    })
    .join('')
}

function cleanAnsi(raw: string, terminal: string) {
  const strippedRaw = stripAnsi(raw)
  const strippedTerminal = stripAnsi(terminal)

  const rawLines = raw.split('\n')
  const strippedRawLines = strippedRaw.split('\n')
  const strippedTerminalLines = strippedTerminal.split('\n')

  // Find lines that exist in raw but not in terminal output
  const linesToKeep: number[] = []
  let terminalIndex = 0

  for (let rawIndex = 0; rawIndex < strippedRawLines.length; rawIndex++) {
    const rawLine = strippedRawLines[rawIndex]

    // Check if this line exists in terminal output
    if (terminalIndex < strippedTerminalLines.length
      && rawLine === strippedTerminalLines[terminalIndex]) {
      linesToKeep.push(rawIndex)
      terminalIndex++
    }
  }

  // Reconstruct the cleaned ANSI string with only the lines that match terminal output
  const cleanedLines = linesToKeep.map(index => rawLines[index])
  return cleanedLines.join('\n')
}

export async function processTerminalOutputs(outputs: TerminalOutput[], options: ConfigOptions) {
  const combinedAnsi = outputs
    .filter(output => output.type === 'output')
    .map(output => output.data)
    .join('')
    .trim()

  const terminalAnsi = await getTerminalOutput(combinedAnsi)
  const cleanedAnsi = cleanAnsi(combinedAnsi, terminalAnsi)

  const rawText = stripAnsi(cleanedAnsi)
  const raw = rawText.split('\n')

  const rows = raw.length
  const cols = Math.max(...raw.map((line: string) => stringWidth(line)), 0)
  const { width, height } = calculateContainerDimensions(rows, cols, options)

  return {
    html: ansiToHTML(cleanedAnsi),
    rows,
    cols,
    width,
    height,
  }
}
