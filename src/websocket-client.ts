import type { Buffer } from 'node:buffer'
import type { TerminalInteraction, WebSocketMessage } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import WebSocket from 'ws'

export interface WebSocketClientOptions {
  port: number
  command: string
  onError: (exitCode: number) => Promise<void>
  onFinished: (interactions: TerminalInteraction[]) => Promise<void>
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private command: string
  private interactions: TerminalInteraction[] = []
  private onError: (exitCode: number) => Promise<void>
  private onFinished: (interactions: TerminalInteraction[]) => Promise<void>

  constructor(options: WebSocketClientOptions) {
    this.url = `ws://localhost:${options.port}/ws`
    this.command = options.command
    this.onError = options.onError
    this.onFinished = options.onFinished
  }

  connect() {
    this.ws = new WebSocket(this.url)

    this.ws.on('open', () => {
      p.log.success(`Connected to ${c.cyan`Go WebSocket server`} on ${c.yellow`${this.url}`}`)
      this.handleUserInput()
      this.sendCommand()
    })

    this.ws.on('message', (data) => {
      const message: WebSocketMessage = JSON.parse(data.toString())
      this.onMessage(message)
    })

    this.ws.on('error', async () => {
      p.outro(c.red('Failed to connect to the WebSocket server'))
      await this.onError(1)
    })

    this.ws.on('close', async () => {
      await this.onFinished(this.interactions)
    })
  }

  close() {
    if (this.ws)
      this.ws.close()
  }

  async send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private async onMessage(message: WebSocketMessage) {
    if (message.type === 'output' || message.type === 'error') {
      this.interactions.push({
        type: message.type,
        data: message.data,
        timestamp: message.timestamp,
      })
    }

    switch (message.type) {
      case 'output': {
        process.stdout.write(this.processOutput(message.data))
        break
      }
      case 'error': {
        process.stderr.write(this.processOutput(message.data))
        break
      }
      case 'exit': {
        const exitCode = Number.parseInt(message.data) || 0
        const exitMsg = `Command exited with code: ${c.yellow`${exitCode}`}`

        if (exitCode === 0) {
          p.log.info(exitMsg)
          this.close()
        }
        else {
          p.outro(c.red(exitMsg))
          await this.onError(exitCode)
        }
      }
    }
  }

  private handleUserInput() {
    process.stdin.on('data', (data: Buffer) => {
      // Send input to Go server
      const inputMessage: WebSocketMessage = {
        type: 'input',
        data: data.toString(),
        timestamp: Date.now(),
      }
      this.interactions.push(inputMessage)
      this.send(inputMessage)
    })
  }

  private sendCommand() {
    p.log.info(`Executing command: ${c.cyan`${this.command}`}`)
    const commandMessage: WebSocketMessage = {
      type: 'command',
      data: this.command,
      timestamp: Date.now(),
    }
    this.interactions.push(commandMessage)
    this.send(commandMessage)
  }

  private processOutput(data: string): string {
    // Remove any null bytes that might interfere with display
    let processed = data.replace(/\0/g, '')

    // Ensure proper line endings
    processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    return processed
  }
}
