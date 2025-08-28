import type { Browser, ElementHandle, PuppeteerNode } from 'puppeteer'
import type { ConfigOptions, ImageFormat, TerminalOutput } from './types'
import { writeFile } from 'node:fs/promises'
import { extname } from 'node:path'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { join } from 'pathe'
import { IMAGE_FORMAT_CHOICES } from './constants'
import { generateHTML } from './html'
import { calculateContainerDimensions } from './utils/dimensions'
import { parseSpacing } from './utils/parse'

async function installChrome() {
  try {
    p.log.info(c.blue`Installing Chrome...`)
    await execa('npx', ['puppeteer', 'browsers', 'install', 'chrome'], {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
  }
  catch (error) {
    p.outro(c.red(`Chrome installation failed: ${error}`))
    process.exit(1)
  }
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
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('Could not find Chrome') || msg.includes('Chrome not found')) {
      await installChrome()
      return await launch()
    }
    p.outro(c.red(`Failed to launch ${c.cyan`Puppeteer`}: ${msg}`))
    process.exit(1)
  }
}

async function screenshot(cwd: string, path: string, body: ElementHandle<HTMLBodyElement>) {
  const type = extname(path).replace('.', '') as ImageFormat
  if (!IMAGE_FORMAT_CHOICES.includes(type)) {
    return
  }

  const screenshot = await body.screenshot({
    type,
    omitBackground: true, // omitBackground is not supported for jpeg
  })

  await writeFile(join(cwd, path), screenshot)
  p.log.success(c.green`Screenshot saved to: ${c.yellow`${path}`}`)
}

export async function generateScreenshot(outputs: TerminalOutput[], options: ConfigOptions) {
  const html = await generateHTML(outputs, options)

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

  const body = await page.$('body')
  if (!body) {
    p.outro(c.red('Failed to find body element'))
    process.exit(1)
  }

  // Make body background transparent
  await page.evaluate(() => {
    document.body.style.backgroundColor = 'transparent'
  })

  if (options.png) {
    await screenshot(options.cwd, options.png, body)
  }
  if (options.jpeg) {
    await screenshot(options.cwd, options.jpeg, body)
  }
  if (options.webp) {
    await screenshot(options.cwd, options.webp, body)
  }

  await browser.close()
}
