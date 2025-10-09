import type { CAC } from 'cac'
import type { CommandOptions } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { name, version } from '../package.json'
import { openInBroz } from './browser'
import { resolveConfig } from './config'
import { GoSession } from './go-session'
import { generateAnimatedHTML, generateHTML } from './html'
import { generateGIF, generateVideo } from './recorder'
import { generateScreenshot } from './screenshot'
import { processTerminalOutputs } from './utils/process'

try {
  const cli: CAC = cac('termsnap')

  cli
    .command('<command>', 'Run a command and capture its output (incl. interactive)')
    .option('-p, --port <port>', 'Server port', { default: 3000 })
    .option('--theme <theme>', 'Terminal theme', { default: 'vitesse-dark' })
    .option('--cmd', 'Show command in the terminal', { default: true })
    .option('--typed', 'Typed command in the terminal', { default: true })
    .option('--decoration', 'Draw window decorations (minimize, maximize, and close button).', { default: false })
    .option('--width <width>', 'Terminal width')
    .option('--height <height>', 'Terminal height')
    .option('--font-family <font-family>', 'Terminal font family', { default: 'monospace' })
    .option('--font-size <font-size>', 'Terminal font size', { default: 14 })
    .option('--font-weight <font-weight>', 'Terminal font weight', { default: 400 })
    .option('--line-height <line-height>', 'Terminal line height', { default: 1.3 })
    .option('--border-radius <border-radius>', 'Terminal border radius', { default: 8 })
    .option('--border-width <border-width>', 'Terminal border width', { default: 1 })
    .option('--border-color <border-color>', 'Terminal border color', { default: '#424242' })
    .option('--box-shadow <box-shadow>', 'Terminal box shadow', { default: '0 22px 70px 4px rgba(0,0,0,0.56)' })
    .option('--padding <padding>', 'Terminal padding', { default: '16px' })
    .option('--margin <margin>', 'Terminal margin', { default: '36px 52px 64px 52px' })
    .option('--dpi <dpi>', 'Device pixel ratio for screenshot', { default: 2 })
    .option('--png [png]', 'Generate a png and save to file')
    .option('--jpeg [jpeg]', 'Generate a jpeg and save to file')
    .option('--webp [webp]', 'Generate a webp and save to file')
    .option('--gif-fps <gif-fps>', 'Frames per second for gif', { default: 20 })
    .option('--gif-scale <gif-scale>', 'Scale for gif', { default: 720 })
    .option('--gif [gif]', 'Generate a gif and save to file')
    .option('--fps <fps>', 'Frames per second for mp4', { default: 60 })
    .option('--mp4 [mp4]', 'Generate a mp4 and save to file')
    .option('--avi [avi]', 'Generate a avi and save to file')
    .option('--mov [mov]', 'Generate a mov and save to file')
    .option('--webm [webm]', 'Generate a webm and save to file')
    .option('--html [html]', 'Generate HTML template and save to file')
    .option('--replay [replay]', 'Generate animated HTML template and save to file')
    .option('--loop <loop>', 'Loop the animation for a given number of milliseconds')
    .option('--open', 'Open the browser after generating the HTML template', { default: false })
    .option('--open-replay', 'Open the browser after generating the animated HTML template', { default: false })
    .option('--force', 'Force to download the theme from remote', { default: false })
    .option('--ffmpeg <ffmpeg>', 'FFmpeg path')
    .action(async (command: string, options: CommandOptions) => {
      p.intro(`${c.yellow`${name} `}${c.dim`v${version}`}`)

      const config = await resolveConfig(command, options)
      const outputHTML = !!config.html
      const outputReplayHTML = !!config.replay
      const outputScreenshot = !!config.screenshot
      const outputVideo = !!config.video
      const outputGIF = !!config.gif
      const openBrowser = config.open

      const session = new GoSession({
        port: config.port,
        command,
      })
      const handleExit = async (code: number) => {
        await session.stop(0)
        process.exit(code)
      }
      process.on('SIGINT', async () => {
        await handleExit(0)
      })
      process.on('SIGTERM', async () => {
        await handleExit(0)
      })

      try {
        const result = await session.start()
        if (result.exitCode !== 0)
          process.exit(result.exitCode)

        const processed = await processTerminalOutputs(result.interactions, config)
        if (outputHTML) {
          await generateHTML(processed, config, true)
        }

        if (outputReplayHTML) {
          await generateAnimatedHTML(result.interactions, config, true)
        }

        if (outputScreenshot) {
          await generateScreenshot(processed, config)
        }

        if (outputVideo) {
          await generateVideo(result.interactions, processed, config)
        }

        if (outputGIF) {
          await generateGIF(result.interactions, processed, config)
        }

        if (openBrowser) {
          await openInBroz(result.interactions, processed, config)
        }

        p.outro(c.green`Done!`)
        process.exit(0)
      }
      catch (error) {
        p.outro(c.red(error instanceof Error ? error.message : String(error)))
        await handleExit(1)
      }
    })

  cli.help()
  cli.version(version)
  cli.parse()
}
catch (error) {
  console.error(error)
  process.exit(1)
}
