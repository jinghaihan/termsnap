import type { ResultPromise } from 'execa'
import type { TerminalInteraction } from './types'
import type { WebSocketClientOptions } from './websocket-client'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import killPort from 'kill-port'
import { getGoServerCommand } from './utils/binary'
import { waitPort } from './utils/port'
import { WebSocketClient } from './websocket-client'

export interface GoSessionOptions extends Pick<WebSocketClientOptions, 'port' | 'command'> {}

export interface GoSessionResult {
  exitCode: number
  interactions: TerminalInteraction[]
}

export class GoSession {
  private port: number
  private command: string
  private interactions: TerminalInteraction[] = []
  private goProcess: ResultPromise | null = null
  private wsClient: WebSocketClient | null = null
  private exitCode = 0

  constructor(options: GoSessionOptions) {
    this.port = options.port
    this.command = options.command
  }

  async start() {
    const { command, args } = await getGoServerCommand(this.port)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    this.goProcess = execa(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: this.port.toString() },
      cleanup: true,
      reject: false,
    })

    const ready = await waitPort(this.port, { open: true })
    if (!ready) {
      p.outro(c.red('Failed to start the Go server'))
      await this.stop(1)
      return { exitCode: 1, interactions: [] }
    }

    return await new Promise<GoSessionResult>((resolve) => {
      this.wsClient = new WebSocketClient({
        port: this.port,
        command: this.command,
        onError: async (code) => {
          this.exitCode = code
          await this.stop(code)
          if (code !== 0)
            process.exit(code)
        },
        onFinished: async (interactions) => {
          this.interactions = interactions
          await this.stop(this.exitCode)
          resolve({ exitCode: this.exitCode || 0, interactions: this.interactions })
        },
      })
      this.wsClient.connect()
    })
  }

  async stop(_exitCode: number = 0) {
    if (this.wsClient) {
      this.wsClient.close()
      this.wsClient = null
    }

    if (this.goProcess) {
      this.goProcess.kill('SIGTERM')
      const closed = await waitPort(this.port, { open: false })
      if (!closed) {
        await killPort(this.port)
      }
      this.goProcess = null
    }

    process.stdin.setRawMode(false)
    process.stdin.pause()
    process.stdin.setEncoding('utf8')
    process.stdout.write('\x1B[?25h') // Show cursor
    process.stdout.write('\x1B[0m') // Reset colors
  }
}
