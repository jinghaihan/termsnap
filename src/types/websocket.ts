export interface WebSocketMessage {
  type: 'command' | 'output' | 'error' | 'exit' | 'input'
  data: string
  timestamp: number
}

export type TerminalInteraction = WebSocketMessage
