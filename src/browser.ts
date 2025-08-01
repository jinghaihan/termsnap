import type { HTMLTemplateOptions } from './types'
import { createServer } from 'node:http'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { HTMLTemplateGenerator } from './template-generator'
import { calculateContainerDimensions } from './utils'

export class BrowserManager {
  /**
   * Open HTML content in broz browser
   */
  static async openInBroz(options: HTMLTemplateOptions, goServerPort: number): Promise<void> {
    try {
      // Generate HTML content
      p.log.info(`Generating HTML template...`)
      const htmlContent = await HTMLTemplateGenerator.generateHTML({
        ...options,
        config: {
          ...options.config,
          borderRadius: '0',
          borderWidth: '0',
          borderColor: 'transparent',
          boxShadow: 'none',
          margin: '0',
        },
      })

      // Calculate container dimensions using the shared utility function
      const { width, height } = await calculateContainerDimensions(
        options.outputs,
        options.theme,
        options.config,
      )

      // Create a simple HTTP server to serve the HTML content
      const server = createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(htmlContent)
      })

      // Find an available port
      const port = await this.findAvailablePort(goServerPort + 1, goServerPort + 10)
      p.log.info(`Using port ${c.yellow`${port}`} for local server`)

      // Start the server
      await new Promise<void>((resolve, reject) => {
        server.listen(port, () => {
          resolve()
        })
        server.on('error', reject)
      })

      p.log.info(`Opening ${c.cyan`broz`} browser with calculated content size ${c.yellow`${width}x${height}`}...`)

      // Launch broz with the local server URL
      await execa(
        'npx',
        [
          'broz',
          `http://localhost:${port}`,
          '--width',
          `${width}`,
          '--height',
          `${height}`,
        ],
        {
          stdio: 'inherit',
        },
      )

      // Also clean up on process exit
      process.on('exit', () => {
        server.close()
      })
    }
    catch (error) {
      p.log.error(`Failed to open broz browser: ${c.red`${error}`}`)
      throw error
    }
  }

  /**
   * Find an available port in the given range
   */
  private static async findAvailablePort(startPort: number, endPort: number): Promise<number> {
    const { createServer } = await import('node:http')

    for (let port = startPort; port <= endPort; port++) {
      try {
        const server = createServer()
        await new Promise<void>((resolve, reject) => {
          server.listen(port, () => {
            server.close()
            resolve()
          })
          server.on('error', reject)
        })
        return port
      }
      catch {
        // Port is in use, try next one
        continue
      }
    }

    throw new Error(`No available ports found in range ${startPort}-${endPort}`)
  }
}
