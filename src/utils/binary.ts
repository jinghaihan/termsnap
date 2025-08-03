import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { dirname } from 'pathe'
import { version } from '../../package.json'
import { getBinaryPath as downloadBinaryPath } from './binary-downloader'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Get the appropriate binary path for the current platform
 */
export async function getBinaryPath(): Promise<string> {
  // This function is only used in production mode
  // In development mode, use 'go run main.go' directly

  // Download from GitHub Release
  return await downloadBinaryPath(version)
}

/**
 * Check if running in development mode
 */
export function isDevelopmentMode(): boolean {
  // Check if running from source (not from installed package)
  // const isRunningFromSource = __dirname.includes('src')
  // Check if NODE_ENV is development
  const isDevEnv = process.env.NODE_ENV === 'development'
  // Check if in a development context (e.g., running with tsx)
  // const isDevContext = process.argv.some(arg => arg.includes('tsx') || arg.includes('ts-node'))

  // return isRunningFromSource || isDevEnv || isDevContext
  return isDevEnv
}

/**
 * Get the appropriate command and args for running the Go server
 */
export async function getGoServerCommand(port: number): Promise<{ command: string, args: string[] }> {
  if (isDevelopmentMode()) {
    // In development, use go run
    return {
      command: 'go',
      args: ['run', 'main.go', '--port', port.toString()],
    }
  }
  else {
    // In production, use pre-compiled binary
    const binaryPath = await getBinaryPath()
    return {
      command: binaryPath,
      args: ['--port', port.toString()],
    }
  }
}
