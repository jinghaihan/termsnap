import type { ConfigOptions, TerminalOutput } from './types'
import { createServer } from 'node:http'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { generateHTML } from './html'
import { calculateContainerDimensions } from './utils/dimensions'

export async function openInBroz(outputs: TerminalOutput[], options: ConfigOptions) {
  const generateOptions: ConfigOptions = {
    ...options,
    border: {
      borderRadius: 0,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    boxShadow: 'none',
    margin: '0',
  }

  const html = await generateHTML(outputs, generateOptions)

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

  const { width, height } = await calculateContainerDimensions(outputs, generateOptions)
  p.log.info(`Opening ${c.cyan`Broz`} browser with size ${c.yellow`${width}x${height}`}...`)

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
