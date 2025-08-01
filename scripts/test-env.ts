#!/usr/bin/env tsx

// Test script to verify environment detection
import { arch, platform } from 'node:os'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import c from 'ansis'
import { dirname, join } from 'pathe'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Function to check if running in development mode
function isDevelopmentMode(): boolean {
  // Check if running from source (not from installed package)
  const isRunningFromSource = __dirname.includes('src')
  // Check if NODE_ENV is development
  const isDevEnv = process.env.NODE_ENV === 'development'
  // Check if in a development context (e.g., running with tsx)
  const isDevContext = process.argv.some(arg => arg.includes('tsx') || arg.includes('ts-node'))

  return isRunningFromSource || isDevEnv || isDevContext
}

// Function to get the appropriate binary path for the current platform
function getBinaryPath(): string {
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
  const binaryPath = join(__dirname, '..', 'binaries', binaryName)

  return binaryPath
}

// Function to get the appropriate command and args for running the Go server
function getGoServerCommand(port: number): { command: string, args: string[] } {
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

p.log.info(`${c.cyan`Environment Detection Test`}`)
p.log.info(`${c.dim`========================`}`)
p.log.info(`Platform: ${c.yellow`${platform()}`}`)
p.log.info(`Architecture: ${c.yellow`${arch()}`}`)
p.log.info(`NODE_ENV: ${c.yellow`${process.env.NODE_ENV || 'production'}`}`)
p.log.info(`Running from source: ${c.yellow`${__dirname.includes('src')}`}`)
p.log.info(`Development context: ${c.yellow`${process.argv.some(arg => arg.includes('tsx') || arg.includes('ts-node'))}`}`)
p.log.info(`Is development mode: ${c.yellow`${isDevelopmentMode()}`}`)
p.log.info(`Binary path: ${c.yellow`${getBinaryPath()}`}`)

const { command, args } = getGoServerCommand(3000)
p.log.info(`Go server command: ${c.cyan`${command}`}`)
p.log.info(`Go server args: ${c.cyan`${args.join(' ')}`}`)
p.log.info(`${c.dim`========================`}`)
