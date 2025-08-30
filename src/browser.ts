import type { ConfigOptions, TerminalInteraction, TerminalSnapshot } from './types'
import { createServer } from 'node:http'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { generateAnimatedHTML, generateHTML, getPureTerminalOptions } from './html'
import { isAnimatedMode } from './utils/inference'

export async function openInBroz(interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  const { width, height } = snapshot
  const generateOptions = getPureTerminalOptions(options)
  const html = isAnimatedMode(options)
    ? await generateAnimatedHTML(interactions, generateOptions)
    : await generateHTML(snapshot, generateOptions)

  // Create a simple HTTP server to serve the HTML content
  p.log.info(`Local server running on port ${c.yellow`${options.port}`}`)
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  })
  await new Promise<void>((resolve, reject) => {
    server.listen(options.port, () => {
      resolve()
    })
    server.on('error', reject)
  })

  p.log.info(`Opening ${c.cyan`Broz`} with size ${c.yellow`${width}x${height}`}...`)

  // Launch broz with the local server URL
  await execa(
    'npx',
    [
      'broz',
      `http://localhost:${options.port}`,
      '--width',
      `${width}`,
      '--height',
      `${height}`,
    ],
    {
      stdio: 'inherit',
    },
  )

  process.on('exit', () => {
    server.close()
  })
}
