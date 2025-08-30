import type { ConfigOptions, TerminalInteraction, TerminalSnapshot, VideoFormat } from './types'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { extname, join } from 'pathe'
import { rimraf } from 'rimraf'
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
    ffmpeg_Path: options.ffmpeg,
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
      p.log.info(`Stopping to record video...`)
      await recorder.stop()
      await browser.close()
      resolve()
    })
  })

  p.log.info(`Starting to record video...`)
  await recorder.start(join(options.cwd, path))
  // @ts-expect-error - trigger animation
  await page.evaluate(() => window.onAnimationStart())
  await done
  p.log.success(c.green`Video saved to: ${c.yellow`${path}`}`)
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

async function getVideoPath(interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  const videoPath = options.mp4 || options.avi || options.mov || options.webm
  if (videoPath) {
    return { path: join(options.cwd, videoPath) }
  }
  else {
    const tempVideo = `${options.gif}.mp4`
    await generateMP4(interactions, snapshot, { ...options, mp4: tempVideo })
    return { path: join(options.cwd, tempVideo), isTemp: true }
  }
}

export async function generateGIF(interactions: TerminalInteraction[], snapshot: TerminalSnapshot, options: ConfigOptions) {
  const { path: videoPath, isTemp } = await getVideoPath(interactions, snapshot, options)

  await rimraf(options.gif)
  const spinner = p.spinner()
  spinner.start(`Generating GIF palette...`)

  const palettePath = `${options.gif}.palette.png`
  await execa(options.ffmpeg, [
    '-i',
    videoPath,
    '-vf',
    `fps=${options.gifFps},scale=${options.gifScale}:-1:flags=lanczos,palettegen`,
    palettePath,
  ])

  spinner.message(`Generating GIF...`)
  await execa(options.ffmpeg, [
    '-i',
    videoPath,
    '-i',
    palettePath,
    '-filter_complex',
    `fps=${options.gifFps},scale=${options.gifScale}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
    options.gif,
  ])
  spinner.stop(c.green`GIF saved to: ${c.yellow`${options.gif}`}`)

  // cleanup temporary files
  await rimraf(palettePath)
  if (isTemp) {
    await rimraf(videoPath)
  }
}
