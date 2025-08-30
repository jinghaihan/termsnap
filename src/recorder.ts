import type { ConfigOptions, TerminalInteraction, TerminalSnapshot, VideoFormat } from './types'
import { extname, join } from 'pathe'
import { VIDEO_FORMAT_CHOICES } from './constants'
import { generateAnimatedHTML, getPureTerminalOptions } from './html'
import { initPage } from './screenshot'

async function initRecorder(interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  const { width, height } = snapshot

  const generateOptions = getPureTerminalOptions(options)
  const html = await generateAnimatedHTML(interactions, generateOptions, false, true)
  const { page, browser, body } = await initPage(html, width, height, generateOptions)

  const { PuppeteerScreenRecorder } = await import('puppeteer-screen-recorder')
  // @ts-expect-error - puppeteer-screen-recorder types are broken
  const recorder = new PuppeteerScreenRecorder(page, {
    fps: options.fps,
    videoFrame: {
      width,
      height,
    },
    aspectRatio: `${width}:${height}`,
    followNewTab: false,
  })

  return { recorder, page, browser, body }
}

async function saveVideo(path: string, interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  const type = extname(path).replace('.', '') as VideoFormat
  if (!VIDEO_FORMAT_CHOICES.includes(type)) {
    return
  }

  const { recorder, browser, page } = await initRecorder(interactions, snapshot, options)

  const done = new Promise<void>((resolve) => {
    page.exposeFunction('onAnimationDone', async () => {
      await recorder.stop()
      await browser.close()
      resolve()
    })
  })

  await recorder.start(join(options.cwd, path))
  // @ts-expect-error - trigger animation
  await page.evaluate(() => window.onAnimationStart())

  await done
}

async function generateMP4(interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  await saveVideo(options.mp4, interactions, snapshot, options)
}

async function generateAVI(interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  await saveVideo(options.avi, interactions, snapshot, options)
}

async function generateMOV(interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  await saveVideo(options.mov, interactions, snapshot, options)
}

async function generateWEBM(interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  await saveVideo(options.webm, interactions, snapshot, options)
}

export async function generateVideo(interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  if (options.mp4) {
    await generateMP4(interactions, snapshot, options)
  }
  if (options.avi) {
    await generateAVI(interactions, snapshot, options)
  }
  if (options.mov) {
    await generateMOV(interactions, snapshot, options)
  }
  if (options.webm) {
    await generateWEBM(interactions, snapshot, options)
  }
}
