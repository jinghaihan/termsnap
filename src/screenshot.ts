import type { Browser, Page, PuppeteerNode } from 'puppeteer'
import type { ConfigOptions, ImageFormat, TerminalOutput } from './types'
import { writeFile } from 'node:fs/promises'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { extname, join } from 'pathe'
import { IMAGE_FORMAT_CHOICES } from './constants'
import { generateHTML } from './html'
import { calculateContainerDimensions } from './utils/dimensions'
import { parseSpacing } from './utils/parse'

let chromeInstallAttempted = false

export async function generateScreenshot(outputs: TerminalOutput[], options: ConfigOptions) {
  const html = await generateHTML(outputs, options)
  const format = await getImageFormat(options.screenshot)
  const path = normalizePath(options.screenshot, format)

  const { width, height } = calculateContainerDimensions(outputs, options)
  const margin = parseSpacing(options.margin)
  const viewportWidth = width + margin.horizontal
  const viewportHeight = height + margin.vertical

  p.log.info(`Launching ${c.cyan`Puppeteer`} with size: ${c.yellow`${width}x${height}`}`)
  const puppeteer = (await (import('puppeteer'))).default
  const browser = await launchBrowser(puppeteer)
  const page = await browser.newPage()

  await page.setViewport({
    width: viewportWidth,
    height: viewportHeight,
    deviceScaleFactor: options.dpi,
  })
  await page.setContent(html, {
    waitUntil: 'networkidle0',
  })
  await waitForTerminalReady(page)

  // Make body background transparent
  await page.evaluate(() => {
    document.body.style.backgroundColor = 'transparent'
  })

  const bodyElement = await page.$('body')
  if (!bodyElement) {
    p.outro(c.red('Failed to find body element'))
    process.exit(1)
  }

  const screenshot = await bodyElement.screenshot({
    type: format,
    omitBackground: format === 'png', // omitBackground is not supported for webp, jpeg
  })

  await writeFile(join(options.cwd, path), screenshot)
  p.log.success(c.green`Screenshot saved to: ${c.yellow`${path}`}`)
  await browser.close()
}

async function launchBrowser(puppeteer: PuppeteerNode): Promise<Browser> {
  const launch = async () => {
    return await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  try {
    return await launch()
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Could not find Chrome') || errorMessage.includes('Chrome not found')) {
      await installChrome()
      return await launch()
    }
    p.outro(c.red(`Failed to launch ${c.cyan`Puppeteer`}: ${errorMessage}`))
    process.exit(1)
  }
}

async function installChrome() {
  if (chromeInstallAttempted)
    return

  const spinner = p.spinner()
  spinner.start(c.blue`Installing Chrome...`)
  chromeInstallAttempted = true

  try {
    await execa('npx', ['puppeteer', 'browsers', 'install', 'chrome'], {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    spinner.stop(c.green('Chrome installed successfully'))
  }
  catch (error) {
    spinner.stop()
    p.outro(c.red(`Chrome installation failed: ${error}`))
    process.exit(1)
  }
}

async function getImageFormat(path: string): Promise<ImageFormat> {
  const ext = extname(path).toLowerCase().slice(1) as ImageFormat
  if (IMAGE_FORMAT_CHOICES.includes(ext)) {
    return ext
  }
  return await selectImageFormat()
}

async function selectImageFormat(): Promise<ImageFormat> {
  const result = await p.select({
    message: 'Select screenshot format:',
    options: IMAGE_FORMAT_CHOICES.map(format => ({
      value: format,
      label: format,
    })),
  })

  if (p.isCancel(result)) {
    p.outro(c.red('aborting'))
    process.exit(1)
  }

  return result as ImageFormat
}

function normalizePath(path: string, format: ImageFormat): string {
  const ext = extname(path).toLowerCase()
  const expectedExt = `.${format}`

  if (ext === expectedExt)
    return path

  if (ext === '') {
    return `${path}.${format}`
  }

  return `${path.slice(0, -ext.length)}.${format}`
}

async function waitForTerminalReady(page: Page) {
  const maxAttempts = 10
  const attemptDelay = 500

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.waitForFunction(() => {
        const terminal = document.querySelector('#terminal')
        if (!terminal)
          return false

        const xtermElements = terminal.querySelectorAll('.xterm')
        if (xtermElements.length === 0)
          return false

        const lines = terminal.querySelectorAll('.xterm-rows')
        return lines.length > 0
      }, { timeout: 2000, polling: 100 })

      return
    }
    catch {
      if (attempt === maxAttempts) {
        p.outro(c.red(`Terminal failed to render after ${maxAttempts} attempts`))
        process.exit(1)
      }

      p.log.info(`Terminal not ready yet (attempt ${c.dim`${attempt}`}/${c.yellow`${maxAttempts}`}), retrying...`)
      await new Promise(resolve => setTimeout(resolve, attemptDelay))
    }
  }
}
