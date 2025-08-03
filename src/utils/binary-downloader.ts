import { access, chmod, constants, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { dirname, join } from 'pathe'
import { version } from '../../package.json'
import { getBinaryName } from './platform'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface BinaryInfo {
  name: string
  url: string
  path: string
}

/**
 * Get binary storage directory
 */
function getBinaryStorageDir(): string {
  // Store binaries in the npm package installation directory
  // This keeps them with the package and out of user's sight
  const packageRoot = join(__dirname, '../../')
  return join(packageRoot, 'binaries')
}

/**
 * Get binary information for current platform
 */
function getBinaryInfo(version: string): BinaryInfo {
  const binaryName = getBinaryName()
  const storageDir = getBinaryStorageDir()
  const binaryPath = join(storageDir, binaryName)

  // GitHub Release URL
  const url = `https://github.com/jinghaihan/termsnap/releases/download/v${version}/${binaryName}`

  return {
    name: binaryName,
    url,
    path: binaryPath,
  }
}

/**
 * Download binary from GitHub Release with progress and timeout handling
 */
async function downloadBinary(binaryInfo: BinaryInfo): Promise<void> {
  const { url, path, name } = binaryInfo

  // Create binaries directory
  const binariesDir = dirname(path)
  await mkdir(binariesDir, { recursive: true })

  p.log.info(`Downloading ${c.yellow`${name}`} from GitHub Release...`)

  // Create a spinner for progress indication
  const spinner = p.spinner()
  spinner.start('Downloading binary...')

  try {
    // Use curl with progress bar and timeout settings
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

    // Set up timeout handling
    const timeoutId = setTimeout(() => {
      spinner.stop('Download timed out')
      curlProcess.kill('SIGTERM')
    }, 10 * 60 * 1000) // 10 minutes total timeout

    const { exitCode, stderr } = await curlProcess
    clearTimeout(timeoutId)

    if (exitCode !== 0) {
      spinner.stop('Download failed')
      throw new Error(`curl failed with exit code ${exitCode}: ${stderr || 'Unknown error'}`)
    }

    spinner.stop('Download completed')

    // Check if download was successful
    try {
      await access(path, constants.F_OK)
      const stats = await import('node:fs').then(fs => fs.statSync(path))
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      p.log.info(`Downloaded ${c.yellow`${name}`} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
    }
    catch (error: unknown) {
      throw new Error(`Failed to verify download: ${error}`)
    }

    // Set execute permissions
    await chmod(path, 0o755)

    p.log.success(`Successfully downloaded and installed ${c.yellow`${name}`}`)
  }
  catch (error: unknown) {
    // Clean up partial download
    try {
      await access(path, constants.F_OK)
      await rm(path, { force: true })
    }
    catch {
      // Ignore cleanup errors
    }

    p.log.error(`Failed to download ${c.yellow`${name}`} from ${c.yellow`${url}`}`)

    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: string[] = []

    if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
      errorDetails.push('Download timed out. This might be due to:')
      errorDetails.push('1. Slow network connection')
      errorDetails.push('2. Large binary file size')
      errorDetails.push('3. Network connectivity issues')
      errorDetails.push('')
      errorDetails.push('Please try running the command again with a better network connection.')
    }
    else if (errorMessage.includes('curl failed')) {
      errorDetails.push('Network download failed. This might be because:')
      errorDetails.push(`1. GitHub Release v${version} doesn't exist yet`)
      errorDetails.push(`2. Binary file ${name} is not available in the release`)
      errorDetails.push('3. Network connectivity issues')
      errorDetails.push('4. GitHub servers are temporarily unavailable')
    }
    else {
      errorDetails.push('This might be because:')
      errorDetails.push(`1. GitHub Release v${version} doesn't exist yet`)
      errorDetails.push(`2. Binary file ${name} is not available in the release`)
      errorDetails.push('3. Network connectivity issues')
    }

    errorDetails.push('')
    errorDetails.push('Please ensure that:')
    errorDetails.push(`1. A GitHub Release with tag v${version} exists`)
    errorDetails.push(`2. The release contains the binary file: ${name}`)
    errorDetails.push('3. You have internet connectivity')
    errorDetails.push('')
    errorDetails.push('If the problem persists, please try running the command again.')

    p.log.error(errorDetails.join('\n'))

    throw new Error(`Download failed: ${errorMessage}`)
  }
}

/**
 * Check if binary exists and has execute permissions
 */
async function checkBinary(binaryPath: string): Promise<boolean> {
  try {
    await access(binaryPath, constants.X_OK)
    return true
  }
  catch {
    return false
  }
}

/**
 * Get or download binary for current platform
 */
export async function getBinaryPath(version: string): Promise<string> {
  const binaryInfo = getBinaryInfo(version)
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

/**
 * Clean up downloaded binaries
 */
export async function cleanupBinaries(): Promise<void> {
  const storageDir = getBinaryStorageDir()

  try {
    await rm(storageDir, { recursive: true, force: true })
    p.log.success(`Cleaned up binaries in ${c.yellow`${storageDir}`}`)
  }
  catch (error) {
    p.log.error(`Failed to clean up binaries: ${error}`)
  }
}
