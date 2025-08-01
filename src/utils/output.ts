/**
 * Process and format output for better display
 */
export function processOutput(data: string): string {
  // Remove any null bytes that might interfere with display
  let processed = data.replace(/\0/g, '')

  // Ensure proper line endings
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  return processed
}

/**
 * Check if an error message indicates a normal connection close
 */
export function isNormalCloseError(error: Error): boolean {
  return error.message.includes('ECONNRESET')
    || error.message.includes('websocket: close')
}

/**
 * Check if a message is a normal EOF or close message
 */
export function isNormalCloseMessage(message: string): boolean {
  return message.includes('pty read error: EOF')
    || message.includes('WebSocket read error: websocket: close')
}
