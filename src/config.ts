import type { CommandOptions, ConfigOptions, DeepRequired, ThemeConfig } from './types'
import process from 'node:process'
import getPort, { portNumbers } from 'get-port'
import { createConfigLoader } from 'unconfig'
import { DEFAULT_TYPED_OPTIONS, PACKAGE_ROOT } from './constants'
import { loadTheme } from './themes'

function normalizeConfig(options: Partial<CommandOptions>) {
  // interop
  if ('default' in options)
    options = options.default as Partial<CommandOptions>

  return options
}

function normalizeFileExt(ext: string, name?: string) {
  if (typeof name === 'boolean')
    name = `termsnap.${ext}`
  else if (name)
    name = name.endsWith(`.${ext}`) ? name : `${name}.${ext}`
  return name
}

async function getFFmpegPath(options: Partial<CommandOptions>) {
  if (options.ffmpeg)
    return options.ffmpeg

  try {
    const { installPackage } = await import('@antfu/install-pkg')
    await installPackage('@ffmpeg-installer/ffmpeg', {
      cwd: PACKAGE_ROOT,
      silent: true,
      preferOffline: true,
    })

    const { default: ffmpeg } = await import('@ffmpeg-installer/ffmpeg')
    return ffmpeg.path
  }
  catch {
    return 'ffmpeg'
  }
}

export async function resolveConfig(command: string, options: Partial<CommandOptions>): Promise<ConfigOptions> {
  options = normalizeConfig(options)

  // in some case cac will perform implicit type conversion
  if (typeof options.theme === 'number') {
    const args = process.argv.slice(2)
    const themeIndex = args.indexOf('--theme')
    if (themeIndex !== -1) {
      options.theme = args[themeIndex + 1]
    }
  }

  const html = !!options.html || !!options.animate
  const screenshot = !!options.png || !!options.jpeg || !!options.webp
  const video = !!options.mp4 || !!options.avi || !!options.mov || !!options.webm

  options.cwd = options.cwd || process.cwd()
  options.open = options.open || (!html && !video && !screenshot && !options.gif)

  // html
  options.html = normalizeFileExt('html', options.html)
  options.animate = normalizeFileExt('html', options.animate)

  // image
  options.png = normalizeFileExt('png', options.png)
  options.jpeg = normalizeFileExt('jpeg', options.jpeg)
  options.webp = normalizeFileExt('webp', options.webp)

  // gif
  options.gif = normalizeFileExt('gif', options.gif)
  options.gifFps = options.gifFps || 20
  options.gifScale = options.gifScale || 720

  // video
  options.mp4 = normalizeFileExt('mp4', options.mp4)
  options.avi = normalizeFileExt('avi', options.avi)
  options.mov = normalizeFileExt('mov', options.mov)
  options.webm = normalizeFileExt('webm', options.webm)

  options.port = options.port ? Number(options.port) : 3000
  options.theme = options.theme || 'vitesse-dark'
  options.decoration = options.decoration || false
  options.force = options.force || false
  options.dpi = options.dpi || 2
  options.fps = options.fps || 60
  options.loop = options.loop || 0

  const loader = createConfigLoader<CommandOptions>({
    sources: [
      {
        files: [
          'termsnap.config',
        ],
      },
    ],
    cwd: options.cwd,
    merge: false,
  })

  const config = await loader.load()
  const configOptions = config.sources.length ? normalizeConfig(config.config) : {}
  const merged = { ...configOptions, ...options }
  const themeConfig = await loadTheme(merged.theme, options.force) as DeepRequired<ThemeConfig>

  merged.port = await getPort({ port: portNumbers(options.port, options.port + 100) })

  // merge flat typed options
  merged.typedOptions = { ...DEFAULT_TYPED_OPTIONS, ...merged.typedOptions }
  if (merged.typedSpeed)
    merged.typedOptions.speed = merged.typedSpeed
  if (merged.typedInitialDelay)
    merged.typedOptions.initialDelay = merged.typedInitialDelay
  if (merged.typedPauseAfter)
    merged.typedOptions.pauseAfter = merged.typedPauseAfter

  // character width (approximate for monospace fonts)
  merged.fontAspectRatio = merged.fontAspectRatio ? Number(merged.fontAspectRatio) : 0.6

  // font config
  themeConfig.font.fontFamily = merged.fontFamily || themeConfig.font.fontFamily
  themeConfig.font.fontSize = merged.fontSize || themeConfig.font.fontSize
  themeConfig.font.fontWeight = merged.fontWeight || themeConfig.font.fontWeight
  themeConfig.font.lineHeight = merged.lineHeight || themeConfig.font.lineHeight

  // border config
  themeConfig.border.borderColor = merged.borderColor || themeConfig.border.borderColor
  themeConfig.border.borderRadius = merged.borderRadius || themeConfig.border.borderRadius
  themeConfig.border.borderWidth = merged.borderWidth || themeConfig.border.borderWidth

  themeConfig.theme = { ...themeConfig.theme, ...merged.colors }
  themeConfig.boxShadow = merged.boxShadow || themeConfig.boxShadow
  themeConfig.padding = merged.padding || themeConfig.padding
  themeConfig.margin = merged.margin || themeConfig.margin

  return {
    command,
    screenshot,
    video,
    ffmpeg: await getFFmpegPath(merged),
    ...merged,
    ...themeConfig,
  } as ConfigOptions
}
