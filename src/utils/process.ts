import type { ConfigOptions, TerminalInteraction, TerminalSnapshot } from '../types'
import { FancyAnsi, stripAnsi } from 'fancy-ansi'
import stringWidth from 'string-width'
import { calculateContainerDimensions } from './dimensions'
import { getTerminalOutput } from './pty'

const fancyAnsi = new FancyAnsi()

function splitToLines(text: string): string[] {
  return text.split(/\r?\n/)
}

function ansiToHTML(ansi: string, options: ConfigOptions): string {
  const html = splitToLines(ansi)
    .map((line) => {
      if (!line)
        return `<div class="terminal-line">&#8203;</div>`
      return `<div class="terminal-line">${fancyAnsi.toHtml(line)}</div>`
    })
    .join('')

  return options.cmd
    ? `<div class="terminal-line"><span style="color:var(--ansi-green, #4e9a06);">➜</span> ${options.command}</div>${html}`
    : html
}

function cleanAnsi(raw: string, terminal: string) {
  const strippedRaw = stripAnsi(raw)
  const strippedTerminal = stripAnsi(terminal)

  const rawLines = splitToLines(raw)
  const strippedRawLines = splitToLines(strippedRaw)
  const strippedTerminalLines = splitToLines(strippedTerminal)

  // Find lines that exist in raw but not in terminal output
  const linesToKeep: number[] = []
  let index = 0

  for (let rawIndex = 0; rawIndex < strippedRawLines.length; rawIndex++) {
    const rawLine = strippedRawLines[rawIndex]

    // Check if this line exists in terminal output
    if (index < strippedTerminalLines.length
      && rawLine === strippedTerminalLines[index]) {
      linesToKeep.push(rawIndex)
      index++
    }
  }

  // Reconstruct the cleaned ANSI string with only the lines that match terminal output
  const cleanedLines = linesToKeep.map(index => rawLines[index])
  return cleanedLines.join('\n')
}

async function getTerminalDimensions(ansi: string, options: ConfigOptions) {
  const terminalAnsi = await getTerminalOutput(ansi)
  const cleanedAnsi = cleanAnsi(ansi, terminalAnsi)

  const rawText = stripAnsi(cleanedAnsi)
  const raw = splitToLines(rawText)
  if (options.cmd) {
    raw.push(options.command)
  }

  const rows = raw.length
  const cols = Math.max(...raw.map((line: string) => stringWidth(line)), 0)
  const { width, height } = calculateContainerDimensions(rows, cols, options)

  return {
    html: ansiToHTML(cleanedAnsi, options),
    rows,
    cols,
    width,
    height,
  }
}

export async function processTerminalOutputs(interactions: TerminalInteraction[], options: ConfigOptions): Promise<TerminalSnapshot> {
  const ansi = interactions
    .filter(i => i.type === 'output')
    .map(i => i.data)
    .join('')
    .trim()

  return await getTerminalDimensions(ansi, options)
}

export async function processAnimationFrames(interactions: TerminalInteraction[], options: ConfigOptions) {
  const outputData = interactions.filter(i => i.type === 'output')
  if (outputData.length === 0)
    return []

  const startTimestamp = outputData[0].timestamp
  const snapshots: TerminalSnapshot[] = []

  let accumulatedAnsi: string = ''
  for (const output of outputData) {
    accumulatedAnsi += output.data

    const { html, rows, cols, width, height } = await getTerminalDimensions(accumulatedAnsi, options)

    snapshots.push({
      timestamp: output.timestamp - startTimestamp,
      html,
      rows,
      cols,
      width,
      height,
    })
  }

  return snapshots
}
