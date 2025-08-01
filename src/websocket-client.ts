import type { WebSocketClient, WebSocketMessage } from './types'
import * as p from '@clack/prompts'
import c from 'ansis'
import WebSocket from 'ws'

export class TerminalWebSocketClient implements WebSocketClient {
  private ws: WebSocket | null = null
  private messageCallbacks: ((message: WebSocketMessage) => void)[] = []
  private errorCallbacks: ((error: Error) => void)[] = []
  private closeCallbacks: (() => void)[] = []
  private url: string

  constructor(port: number = 3000) {
    this.url = `ws://localhost:${port}/ws`
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.on('open', () => {
          p.log.success(`Connected to ${c.cyan`Go WebSocket server`} on ${c.yellow`${this.url}`}`)
          resolve()
        })

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message: WebSocketMessage = JSON.parse(data.toString())
            this.messageCallbacks.forEach(callback => callback(message))
          }
          catch (error) {
            p.log.error(`Failed to parse ${c.cyan`WebSocket message`}: ${c.red`${error}`}`)
          }
        })

        this.ws.on('error', (error: Error) => {
          p.log.error(`WebSocket error: ${c.red`${error.message}`}`)
          this.errorCallbacks.forEach(callback => callback(error))
          reject(error)
        })

        this.ws.on('close', () => {
          p.log.warn(`${c.cyan`WebSocket connection`} closed`)
          this.closeCallbacks.forEach(callback => callback())
        })
      }
      catch (error) {
        reject(error)
      }
    })
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
    else {
      throw new Error('WebSocket is not connected')
    }
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.messageCallbacks.push(callback)
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback)
  }

  onClose(callback: () => void): void {
    this.closeCallbacks.push(callback)
  }

  close(): void {
    if (this.ws) {
      this.ws.close()
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}
