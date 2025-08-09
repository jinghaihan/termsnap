export interface TerminalOutput {
  type: 'output' | 'error' | 'exit'
  data: string
  timestamp: number
}

export interface WebSocketMessage {
  type: 'command' | 'output' | 'error' | 'exit' | 'input'
  data: string
  timestamp: number
}
