import { arch, platform } from 'node:os'

/**
 * Get binary name for current platform
 */
export function getBinaryName(): string {
  const platformName = platform()
  const archName = arch()

  if (platformName === 'darwin') {
    return archName === 'arm64' ? 'termsnap-darwin-arm64' : 'termsnap-darwin-x64'
  }
  else if (platformName === 'linux') {
    return archName === 'arm64' ? 'termsnap-linux-arm64' : 'termsnap-linux-x64'
  }
  else if (platformName === 'win32') {
    return 'termsnap-win32-x64.exe'
  }
  else {
    throw new Error(`Unsupported platform: ${platformName}`)
  }
}
