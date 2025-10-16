import type { BinaryInfo } from '../types'
import { statSync } from 'node:fs'
import { access, chmod, constants, mkdir } from 'node:fs/promises'
import { arch, platform } from 'node:os'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { join } from 'pathe'
import { version } from '../../package.json'
import { BINARY_STORAGE_DIR, DEV_MODE } from '../constants'

export async function getGoServerCommand(port: number): Promise<{ command: string, args: string[] }> {
  if (DEV_MODE) {
    return {
      command: 'go',
      args: ['run', 'main.go', '--port', port.toString()],
    }
  }
  else {
    const binaryPath = await getBinaryPath()
    return {
      command: binaryPath,
      args: ['--port', port.toString()],
    }
  }
}

async function getBinaryPath(): Promise<string> {
  const binaryInfo = getBinaryInfo()
  const { path, name } = binaryInfo

  // Check if binary already exists and is executable
  if (await checkBinary(path)) {
    p.log.info(`Using existing binary: ${c.yellow`${name}`}`)
    return path
  }

  // Download binary
  await downloadBinary(binaryInfo)
  return path
}

function getBinaryInfo(): BinaryInfo {
  const name = getBinaryName()
  const path = join(BINARY_STORAGE_DIR, name)
  const url = `https://github.com/jinghaihan/termsnap/releases/download/v${version}/${name}`

  return { name, url, path }
}

function getBinaryName(): string {
  const platformName = platform()
  const archName = arch()

  if (platformName === 'darwin')
    return archName === 'arm64' ? `termsnap-v${version}-darwin-arm64` : `termsnap-v${version}-darwin-x64`
  if (platformName === 'linux')
    return archName === 'arm64' ? `termsnap-v${version}-linux-arm64` : `termsnap-v${version}-linux-x64`
  if (platformName === 'win32')
    return `termsnap-v${version}-win32-x64.exe`

  p.outro(c.red`Unsupported platform: ${platformName}`)
  process.exit(1)
}

async function checkBinary(binaryPath: string): Promise<boolean> {
  try {
    await access(binaryPath, constants.X_OK)
    return true
  }
  catch {
    return false
  }
}

async function downloadBinary(binaryInfo: BinaryInfo): Promise<void> {
  const { url, path, name } = binaryInfo
  await mkdir(BINARY_STORAGE_DIR, { recursive: true })

  const spinner = p.spinner()
  spinner.start(`Downloading ${c.yellow`${name}`} from GitHub Release...`)

  try {
    const curlArgs = [
      '-L', // Follow redirects
      '-o',
      path, // Output file
      '--progress-bar', // Show progress bar
      '--max-time',
      '300', // Maximum 5 minutes timeout
      '--connect-timeout',
      '30', // Connection timeout 30 seconds
      '--retry',
      '3', // Retry 3 times on failure
      '--retry-delay',
      '2', // Wait 2 seconds between retries
      '--retry-max-time',
      '600', // Maximum total retry time 10 minutes
      '--fail', // Fail on HTTP errors
      url,
    ]

    const curlProcess = execa('curl', curlArgs, {
      reject: false,
      stderr: 'pipe',
    })

    // 10 minutes total timeout
    const timeoutId = setTimeout(
      () => {
        spinner.stop('Download timed out')
        curlProcess.kill('SIGTERM')
      },
      10 * 60 * 1000,
    )

    const { exitCode, stderr } = await curlProcess
    clearTimeout(timeoutId)

    if (exitCode !== 0) {
      spinner.stop()
      p.outro(c.red`curl failed with exit code ${exitCode}: ${stderr || 'Unknown error'}`)
      process.exit(1)
    }

    spinner.stop(c.green`Download completed`)

    await access(path, constants.F_OK)
    const stats = statSync(path)
    if (stats.size === 0) {
      p.outro(c.red`Downloaded file is empty`)
      process.exit(1)
    }

    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    p.log.info(`Downloaded ${c.yellow`${name}`} (${sizeMB} MB)`)

    // Make binary executable
    await chmod(path, 0o755)
  }
  catch (error) {
    p.outro(c.red(error instanceof Error ? error.message : String(error)))
    process.exit(1)
  }
}
