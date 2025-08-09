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
import { generateHTML } from './html'
import { generateScreenshot } from './screenshot'

try {
  const cli: CAC = cac('termsnap')

  cli
    .command('<command>', 'Run a command and capture its output (incl. interactive)')
    .option('-p, --port <port>', 'Server port', { default: 3000 })
    .option('--theme <theme>', 'Terminal theme', { default: 'vitesse-dark' })
    .option('--decoration', 'Draw window decorations (minimize, maximize, and close button).', { default: false })
    .option('--width <width>', 'Terminal width')
    .option('--height <height>', 'Terminal height')
    .option('--font-family <font-family>', 'Terminal font family')
    .option('--font-size <font-size>', 'Terminal font size')
    .option('--font-weight <font-weight>', 'Terminal font weight')
    .option('--line-height <line-height>', 'Terminal line height')
    .option('--border-radius <border-radius>', 'Terminal border radius')
    .option('--border-width <border-width>', 'Terminal border width')
    .option('--border-color <border-color>', 'Terminal border color')
    .option('--box-shadow <box-shadow>', 'Terminal box shadow')
    .option('--padding <padding>', 'Terminal padding')
    .option('--margin <margin>', 'Terminal margin')
    .option('--screenshot [screenshot]', 'Generate a screenshot and save to file')
    .option('--dpi <dpi>', 'Device pixel ratio for screenshot', { default: 2 })
    .option('--html [html]', 'Generate HTML template and save to file')
    .option('--open', 'Open the browser after generating the HTML template', { default: false })
    .option('--cdn <provider>', 'CDN provider for xterm.js', { default: 'jsdelivr' })
    .action(async (command: string, options: CommandOptions) => {
      p.intro(`${c.yellow`${name} `}${c.dim`v${version}`}`)

      const config = await resolveConfig(command, options)
      const outputHTML = !!config.html
      const outputScreenshot = !!config.screenshot
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

        if (outputHTML) {
          await generateHTML(result.outputs, config, true)
        }

        if (outputScreenshot) {
          await generateScreenshot(result.outputs, config)
        }

        if (openBrowser) {
          await openInBroz(result.outputs, config)
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
