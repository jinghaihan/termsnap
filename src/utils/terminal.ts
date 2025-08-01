import process from 'node:process'

/**
 * Set up terminal for raw input
 */
export function setupTerminal() {
  // Save current terminal state
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')

  // Ensure cursor is visible on exit
  process.on('exit', () => {
    process.stdout.write('\x1B[?25h') // Show cursor
    process.stdout.write('\x1B[0m') // Reset colors
  })

  process.on('SIGINT', () => {
    process.stdout.write('\x1B[?25h') // Show cursor
    process.stdout.write('\x1B[0m') // Reset colors
  })

  process.on('SIGTERM', () => {
    process.stdout.write('\x1B[?25h') // Show cursor
    process.stdout.write('\x1B[0m') // Reset colors
  })
}

/**
 * Restore terminal state
 */
export function restoreTerminal() {
  process.stdout.write('\x1B[?25h') // Show cursor
  process.stdout.write('\x1B[0m') // Reset colors
}
