import type { Browser, Page, PuppeteerNode } from 'puppeteer'
import type { HTMLTemplateOptions, ImageFormat } from './types'
import { writeFileSync } from 'node:fs'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { extname, join } from 'pathe'
import { IMAGE_FORMAT_CHOICES } from './constants'
import { HTMLTemplateGenerator } from './template-generator'
import { calculateContainerDimensions, parseSpacing } from './utils'

export class ScreenshotManager {
  private static chromeInstallAttempted = false

  /**
   * Install Chrome browser for Puppeteer
   */
  private static async installChrome(): Promise<void> {
    if (this.chromeInstallAttempted) {
      throw new Error('Chrome installation already attempted. Please install Chrome manually: npx puppeteer browsers install chrome')
    }

    this.chromeInstallAttempted = true
    p.log.info('Chrome browser not found. Installing Chrome for Puppeteer...')

    try {
      await execa('npx', ['puppeteer', 'browsers', 'install', 'chrome'], {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      p.log.success('Chrome browser installed successfully')
    }
    catch {
      p.log.error('Failed to install Chrome browser automatically')
      throw new Error(`Please install Chrome manually: ${c.yellow`npx puppeteer browsers install chrome`}`)
    }
  }

  /**
   * Launch browser with Chrome installation fallback
   */
  private static async launchBrowser(puppeteer: PuppeteerNode): Promise<Browser> {
    try {
      return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorMessage.includes('Could not find Chrome') || errorMessage.includes('Chrome not found')) {
        await this.installChrome()
        // Retry launching browser after Chrome installation
        return await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
      }

      throw error
    }
  }

  /**
   * Get screenshot format from file extension
   */
  private static async getScreenshotFormat(outputPath: string): Promise<ImageFormat> {
    const ext = extname(outputPath).toLowerCase().slice(1) // Remove the dot
    const format = ext as ImageFormat

    if (IMAGE_FORMAT_CHOICES.includes(format)) {
      return format
    }

    p.log.warn(`Unsupported file extension ${c.yellow`.${ext}`}`)
    return await this.selectFormat()
  }

  /**
   * Ensure output path has correct extension
   */
  private static normalizeOutputPath(outputPath: string, format: ImageFormat): string {
    const ext = extname(outputPath).toLowerCase()
    const expectedExt = `.${format}`

    if (ext !== expectedExt) {
      // Handle case where there's no extension (empty string)
      let newPath: string
      if (ext === '') {
        // No extension found, append the expected extension
        newPath = `${outputPath}${expectedExt}`
      }
      else {
        // Extension exists but doesn't match, replace it
        newPath = outputPath.replace(ext, expectedExt)
      }
      p.log.warn(`File extension mismatch. Expected ${c.yellow`${expectedExt}`}, got ${c.yellow`${ext}`}. Using ${c.yellow`${newPath}`}`)
      return newPath
    }

    return outputPath
  }

  /**
   * Select screenshot format interactively
   */
  private static async selectFormat(): Promise<ImageFormat> {
    const formatChoice = await p.select({
      message: 'Select screenshot format:',
      options: IMAGE_FORMAT_CHOICES.map(format => ({
        value: format,
        label: format,
      })),
    })

    if (p.isCancel(formatChoice)) {
      p.outro(c.red('aborting'))
      process.exit(1)
    }

    return formatChoice as ImageFormat
  }

  /**
   * Generate a screenshot of the terminal output
   */
  static async generateScreenshot(options: HTMLTemplateOptions, outputPath: string = 'screenshot.png'): Promise<string> {
    try {
      p.log.info(`Starting screenshot generation...`)

      // Dynamically import Puppeteer to avoid loading it for all users
      const puppeteer = await this.importPuppeteer()

      // Generate HTML content normally
      p.log.info(`Generating HTML template...`)
      const htmlContent = await HTMLTemplateGenerator.generateHTML(options)

      // Calculate dimensions including margin
      const { width, height } = await calculateContainerDimensions(
        options.outputs,
        options.theme,
        options.config,
      )

      // Parse margin to add to viewport height
      const margin = parseSpacing(options.config?.margin || '0')
      const viewportWidth = width + margin.horizontal
      const viewportHeight = height + margin.vertical

      p.log.info(`Calculated viewport size: ${c.yellow`${viewportWidth}x${viewportHeight}`}`)

      // Determine screenshot format
      const format = await this.getScreenshotFormat(outputPath)
      const normalizedPath = this.normalizeOutputPath(outputPath, format)

      p.log.info(`Launching ${c.cyan`Puppeteer`}...`)
      // Launch browser
      const browser = await this.launchBrowser(puppeteer)

      try {
        p.log.info(`Creating new page...`)
        const page = await browser.newPage()

        // Set viewport size
        p.log.info(`Setting viewport size...`)
        await page.setViewport({
          width: viewportWidth,
          height: viewportHeight,
          deviceScaleFactor: 2, // Higher DPI for better quality
        })

        // Set content and wait for it to load
        p.log.info(`Loading HTML content...`)
        await page.setContent(htmlContent, {
          waitUntil: 'networkidle0',
        })

        // Wait for xterm.js to render with better reliability
        p.log.info(`Waiting for terminal to render...`)
        await this.waitForTerminalReady(page)

        // Modify the page for screenshot mode using Puppeteer
        p.log.info(`Applying screenshot styling...`)
        await page.evaluate(() => {
          // Make body background transparent
          document.body.style.backgroundColor = 'transparent'
        })

        // Take screenshot of the body element
        p.log.info(`Taking screenshot...`)
        const bodyElement = await page.$('body')
        if (!bodyElement) {
          throw new Error('Body element not found')
        }

        const screenshot = await bodyElement.screenshot({
          type: format,
          omitBackground: format === 'png', // omitBackground is not supported for webp, jpeg
        })

        // Save to file
        const fullPath = join(process.cwd(), normalizedPath)
        writeFileSync(fullPath, screenshot)

        p.log.success(`Screenshot saved to: ${c.yellow`${fullPath}`}`)
        return fullPath
      }
      finally {
        p.log.info(`Closing browser...`)
        await browser.close()
      }
    }
    catch (error) {
      if (error instanceof Error && error.message.includes('Cannot find module')) {
        p.log.error(`${c.cyan`Puppeteer`} is not installed. Please install it first: ${c.yellow`npm install puppeteer`}`)
      }
      throw error
    }
  }

  /**
   * Wait for terminal to be ready with better reliability
   */
  private static async waitForTerminalReady(page: Page): Promise<void> {
    const maxAttempts = 10
    const attemptDelay = 500 // 500ms between attempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check DOM state and log debug info
        const domState = await page.evaluate(() => {
          const terminal = document.querySelector('#terminal')
          const xtermElements = terminal?.querySelectorAll('.xterm') || []
          const lines = terminal?.querySelectorAll('.xterm-rows') || []

          return {
            hasTerminal: !!terminal,
            xtermCount: xtermElements.length,
            lineCount: lines.length,
            terminalHTML: terminal?.outerHTML || 'Not found',
          }
        })

        p.log.info(`DOM State: Terminal=${c.yellow`${domState.hasTerminal}`}, Xterm=${c.yellow`${domState.xtermCount}`}, Lines=${c.yellow`${domState.lineCount}`}`)

        // Wait for terminal element to exist and have content
        await page.waitForFunction(() => {
          const terminal = document.querySelector('#terminal')
          if (!terminal) {
            return false
          }

          // Check if xterm.js has rendered content
          const xtermElements = terminal.querySelectorAll('.xterm')
          if (xtermElements.length === 0) {
            return false
          }

          // Check if there's actual content rendered
          const lines = terminal.querySelectorAll('.xterm-rows')
          return lines.length > 0
        }, {
          timeout: 2000, // Shorter timeout per attempt
          polling: 100, // Check every 100ms
        })

        p.log.success(`Terminal ready after ${attempt} attempts`)
        return
      }
      catch (error) {
        if (attempt === maxAttempts) {
          p.log.error(`Terminal failed to render after ${maxAttempts} attempts`)
          p.log.error(`Last error: ${error instanceof Error ? error.message : String(error)}`)
          throw new Error(`Terminal failed to render after ${maxAttempts} attempts`)
        }

        p.log.info(`Terminal not ready yet (attempt ${c.dim`${attempt}`}/${c.yellow`${maxAttempts}`}), retrying...`)
        await new Promise(resolve => setTimeout(resolve, attemptDelay))
      }
    }
  }

  /**
   * Safely import Puppeteer
   */
  private static async importPuppeteer(): Promise<PuppeteerNode> {
    try {
      return (await (import('puppeteer'))).default
    }
    catch {
      throw new Error('Cannot find module \'puppeteer\'')
    }
  }
}
