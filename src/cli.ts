import type { CAC } from 'cac'
import type { ResultPromise } from 'execa'
import type { Buffer } from 'node:buffer'
import type { CommandOptions, HTMLTemplateOptions, TerminalOutput, WebSocketMessage } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { execa } from 'execa'
import { version } from '../package.json'
import { BrowserManager } from './browser'
import { resolveConfig } from './config'
import { ScreenshotManager } from './screenshot'
import { HTMLTemplateGenerator } from './template-generator'
import { getThemeWithSelection } from './themes'
import { getGoServerCommand, isDevelopmentMode } from './utils/binary'
import { isNormalCloseError, isNormalCloseMessage, processOutput } from './utils/output'
import { checkPortStatus, ensurePortReleased, killExistingProcesses } from './utils/process'
import { restoreTerminal, setupTerminal } from './utils/terminal'
import { TerminalWebSocketClient } from './websocket-client'

// Function to handle user input
function handleUserInput(wsClient: TerminalWebSocketClient) {
  process.stdin.on('data', (data: Buffer) => {
    const input = data.toString()

    // Send input to Go server
    const inputMessage: WebSocketMessage = {
      type: 'input',
      data: input,
      timestamp: Date.now(),
    }
    wsClient.send(inputMessage)
  })
}

try {
  const cli: CAC = cac('termsnap')

  cli
    .command('<command>', 'Run a command and capture its output (incl. interactive)')
    .option('-p, --port <port>', 'Server port', { default: 3000 })
    .option('--theme <theme>', 'Terminal theme', { default: 'vitesse-dark' })
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
    .option('--decoration', 'Draw window decorations (minimize, maximize, and close button).', { default: false })
    .option('--screenshot <screenshot>', 'Generate a screenshot and save to file')
    .option('--html <html>', 'Generate HTML template and save to file')
    .option('--open', 'Open the browser after generating the HTML template', { default: false })
    .option('--cdn <provider>', 'CDN provider for xterm.js', { default: 'jsdelivr' })
    .allowUnknownOptions()
    .action(async (command: string, options: CommandOptions) => {
      p.intro(`${c.yellow`termsnap `}${c.dim`v${version}`}`)

      const config = await resolveConfig(options)

      const port = Number.parseInt(config.port || '3000', 10)
      // Check if need to output HTML
      const outputHTML = !!config.html
      const outputScreenshot = !!config.screenshot
      const openBrowser = config.open || (!outputHTML && !outputScreenshot)

      let goProcess: ResultPromise | null = null
      let wsClient: TerminalWebSocketClient | null = null

      // Set up terminal for raw input in both interactive and HTML modes
      setupTerminal()

      // Kill any existing processes on the port
      await killExistingProcesses(port)

      // Cleanup function to ensure Go process is killed and port is released
      let cleanupCalled = false
      const cleanup = async () => {
        if (cleanupCalled)
          return
        cleanupCalled = true

        // Restore terminal state
        restoreTerminal()

        if (wsClient) {
          wsClient.close()
        }

        // Ensure port is properly released
        await ensurePortReleased(port, goProcess)

        // Final check: ensure port is actually free
        await checkPortStatus(port)

        // Additional cleanup: force kill any remaining processes on the port
        await killExistingProcesses(port)
      }

      // Ensure cleanup on process exit
      process.on('exit', () => {
        // Note: process.on('exit') handlers are synchronous, so async cleanup cannot be used here
        // The cleanup will be handled by the other event handlers
      })
      process.on('SIGINT', async () => {
        await cleanup()
        process.exit(0)
      })
      process.on('SIGTERM', async () => {
        await cleanup()
        process.exit(0)
      })

      try {
        // Start Go server process using pre-compiled binary
        p.log.info(`Starting ${c.cyan`Go WebSocket server`} on port ${c.yellow`${port}`}...`)
        const { command: goCommand, args: goArgs } = await getGoServerCommand(port)

        // Re-setup terminal after potential binary download (which may have used spinner)
        setupTerminal()
        goProcess = execa(goCommand, goArgs, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, PORT: port.toString() },
        })

        // Wait a bit for the server to start
        await new Promise(resolve => setTimeout(resolve, 2000))

        wsClient = new TerminalWebSocketClient(port)

        // Connect to Go WebSocket server
        p.log.info(`Connecting to ${c.cyan`WebSocket server`}...`)
        await wsClient.connect()
        p.log.success(`Successfully connected to ${c.cyan`WebSocket server`}`)

        // Set up user input handling in both interactive and HTML modes
        handleUserInput(wsClient)

        // Send command to Go server
        const commandMessage: WebSocketMessage = {
          type: 'command',
          data: command,
          timestamp: Date.now(),
        }
        wsClient.send(commandMessage)
        p.log.info(`Executing command: ${c.cyan`${command}`}`)

        // Collect outputs for HTML generation
        const outputs: TerminalOutput[] = []
        let _exitCode = 0
        let htmlGenerated = false

        // Function to generate HTML if needed
        const generateHTML = async () => {
          if (htmlGenerated) {
            return
          }
          htmlGenerated = true

          // Use interactive theme selection if theme is not found
          const { selectedTheme: themeName } = await getThemeWithSelection(config.theme, config)

          const generateOptions: HTMLTemplateOptions = {
            command,
            outputs,
            theme: themeName,
            cdn: config.cdn,
            title: `Terminal Output: ${command}`,
            config,
          }

          if (outputHTML) {
            p.log.info(`Generating ${c.cyan`HTML template`} to ${c.yellow`${config.html}`}...`)
            HTMLTemplateGenerator.saveToFile(generateOptions, config.html)
            p.log.success(`HTML template saved to ${c.yellow`${config.html}`}`)
          }
          else {
            HTMLTemplateGenerator.generateHTML(generateOptions)
          }

          // Generate screenshot if requested
          if (outputScreenshot) {
            await ScreenshotManager.generateScreenshot(generateOptions, config.screenshot)
          }

          // Open in broz if --open is true
          if (openBrowser) {
            await BrowserManager.openInBroz(generateOptions, port)
          }
        }

        // Handle incoming messages from Go server
        wsClient.onMessage(async (message: WebSocketMessage) => {
          // Collect all outputs for HTML generation
          if (message.type === 'output' || message.type === 'error') {
            outputs.push({
              type: message.type,
              data: message.data,
              timestamp: message.timestamp,
            })
          }

          // In HTML mode, display outputs and collect them for HTML generation
          switch (message.type) {
            case 'output': {
              const processedOutput = processOutput(message.data)
              process.stdout.write(processedOutput)
              break
            }
            case 'error': {
              const processedError = processOutput(message.data)
              process.stderr.write(processedError)
              break
            }
            case 'exit': {
              _exitCode = Number.parseInt(message.data) || 0
              p.log.info(`Command exited with code: ${c.yellow`${_exitCode}`}`)

              // Generate HTML and open browser if needed (regardless of outputHTML)
              await generateHTML()

              await cleanup()
              if (_exitCode === 0) {
                p.outro(`${c.green`✓`} Command execution completed successfully!`)
                process.exit(0)
              }
              else {
                p.outro(`${c.red`✗`} Command execution failed with exit code ${_exitCode}`)
                process.exit(_exitCode)
              }
              break
            }
            default: {
              p.log.warn(`Unknown message type: ${c.yellow`${message.type}`}`)
            }
          }
        })

        // Handle WebSocket errors
        wsClient.onError(async (error: Error) => {
          // Only log if it's not a normal connection close
          if (!isNormalCloseError(error)) {
            p.log.error(`WebSocket error: ${c.red`${error.message}`}`)
          }
          await cleanup()
          p.outro(`${c.red`✗`} WebSocket connection failed`)
          process.exit(1)
        })

        // Handle WebSocket close
        wsClient.onClose(async () => {
          // Only log if it's not a normal close
          p.log.warn(`WebSocket connection closed`)

          // Generate HTML and open browser if needed (regardless of outputHTML)
          await generateHTML()

          await cleanup()
          p.outro(`${c.green`✓`} WebSocket connection closed normally`)
          process.exit(0)
        })

        // Handle Go process output for debugging
        goProcess.stdout?.on('data', (data: Buffer) => {
          // Only log in development mode to reduce noise
          if (isDevelopmentMode()) {
            p.log.info(`[${c.cyan`Go Server`}] ${data.toString()}`)
          }
        })

        goProcess.stderr?.on('data', (data: Buffer) => {
          // Only log actual errors, not normal EOF messages
          const message = data.toString()
          if (!isNormalCloseMessage(message)) {
            p.log.error(`[${c.cyan`Go Server Error`}] ${c.red`${message}`}`)
          }
        })

        // Handle Go process exit
        goProcess.on('exit', async (code: number | null) => {
          // Only log if it's not a normal exit
          if (code !== null && code !== 0) {
            p.log.warn(`Go process exited with code: ${c.yellow`${code}`}`)
          }
          await cleanup()
          process.exit(code || 0)
        })

        // Handle unexpected process termination
        process.on('uncaughtException', async (error) => {
          p.log.error(`Uncaught exception: ${c.red`${error.message}`}`)
          await cleanup()
          p.outro(`${c.red`✗`} Unexpected error occurred`)
          process.exit(1)
        })

        process.on('unhandledRejection', async (reason) => {
          p.log.error(`Unhandled rejection: ${c.red`${reason}`}`)
          await cleanup()
          p.outro(`${c.red`✗`} Unhandled promise rejection`)
          process.exit(1)
        })
      }
      catch (error) {
        p.log.error(`Failed to connect to Go WebSocket server: ${c.red`${error}`}`)
        await cleanup()
        p.outro(`${c.red`✗`} Failed to start server`)
        process.exit(1)
      }
    })

  cli.help()
  cli.version(version)
  cli.parse()
}
catch (error) {
  p.log.error(`CLI error: ${c.red`${error}`}`)
  process.exit(1)
}
