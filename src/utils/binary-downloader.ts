import { access, chmod, constants, mkdir, rm } from 'node:fs/promises'
import process from 'node:process'
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
 * Download binary from GitHub Release
 */
async function downloadBinary(binaryInfo: BinaryInfo): Promise<void> {
  const { url, path, name } = binaryInfo

  // Create binaries directory
  const binariesDir = dirname(path)
  await mkdir(binariesDir, { recursive: true })

  p.log.info(`Downloading ${c.yellow`${name}`} from GitHub Release...`)

  try {
    // Use curl to download the binary
    const { stderr } = await execa('curl', ['-L', '-o', path, url], {
      reject: false,
      stderr: 'pipe',
    })

    // Check if download was successful
    try {
      await access(path, constants.F_OK)
      const stats = await import('node:fs').then(fs => fs.statSync(path))
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty')
      }
    }
    catch {
      throw new Error(`Failed to download: ${stderr || 'Unknown error'}`)
    }

    // Set execute permissions
    await chmod(path, 0o755)

    p.log.success(`Successfully downloaded and installed ${c.yellow`${name}`}`)
  }
  catch (error) {
    p.log.error(`Failed to download ${c.yellow`${name}`} from ${c.yellow`${url}`}`)
    p.log.error(`This might be because:`)
    p.log.error(`1. GitHub Release v${version} doesn't exist yet`)
    p.log.error(`2. Binary file ${name} is not available in the release`)
    p.log.error(`3. Network connectivity issues`)
    p.log.error(``)
    p.log.error(`Please ensure that:`)
    p.log.error(`1. A GitHub Release with tag v${version} exists`)
    p.log.error(`2. The release contains the binary file: ${name}`)
    p.log.error(`3. You have internet connectivity`)
    throw new Error(`Download failed: ${error}`)
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

/**
 * Get version from package.json
 */
export function getPackageVersion(): string {
  // In development, use a default version
  if (process.env.NODE_ENV === 'development') {
    return '0.1.0'
  }

  // In production, use version from package.json
  return version
}
