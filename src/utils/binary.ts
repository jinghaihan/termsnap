import { arch, platform } from 'node:os'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Get the appropriate binary path for the current platform
 */
export function getBinaryPath(): string {
  const platformName = platform()
  const archName = arch()

  let binaryName: string

  if (platformName === 'darwin') {
    binaryName = archName === 'arm64' ? 'termsnap-darwin-arm64' : 'termsnap-darwin-x64'
  }
  else if (platformName === 'linux') {
    binaryName = archName === 'arm64' ? 'termsnap-linux-arm64' : 'termsnap-linux-x64'
  }
  else if (platformName === 'win32') {
    binaryName = 'termsnap-win32-x64.exe'
  }
  else {
    throw new Error(`Unsupported platform: ${platformName}`)
  }

  // Path to the binary relative to the package root
  // When running from dist/, need to go up one more level
  const isRunningFromDist = __dirname.includes('dist')
  const relativePath = isRunningFromDist ? ['..', 'binaries', binaryName] : ['binaries', binaryName]
  const binaryPath = join(__dirname, ...relativePath)

  return binaryPath
}

/**
 * Check if running in development mode
 */
export function isDevelopmentMode(): boolean {
  // Check if running from source (not from installed package)
  const isRunningFromSource = __dirname.includes('src')
  // Check if NODE_ENV is development
  const isDevEnv = process.env.NODE_ENV === 'development'
  // Check if in a development context (e.g., running with tsx)
  const isDevContext = process.argv.some(arg => arg.includes('tsx') || arg.includes('ts-node'))

  return isRunningFromSource || isDevEnv || isDevContext
}

/**
 * Get the appropriate command and args for running the Go server
 */
export function getGoServerCommand(port: number): { command: string, args: string[] } {
  if (isDevelopmentMode()) {
    // In development, use go run
    return {
      command: 'go',
      args: ['run', 'main.go', '--port', port.toString()],
    }
  }
  else {
    // In production, use pre-compiled binary
    const binaryPath = getBinaryPath()
    return {
      command: binaryPath,
      args: ['--port', port.toString()],
    }
  }
}
