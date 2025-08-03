#!/usr/bin/env tsx

import { mkdir } from 'node:fs/promises'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'
import { join } from 'pathe'

async function buildGo() {
  p.log.info(`${c.cyan`Building Go binaries for all platforms...`}`)

  // Check if Go is available
  try {
    await execa('go', ['version'], { stdio: 'pipe' })
    p.log.success(`${c.green`Go is available`}`)
  }
  catch {
    p.log.error(`${c.red`Go is not installed or not in PATH`}`)
    p.log.error(`${c.red`Please install Go from https://golang.org/dl/`}`)
    process.exit(1)
  }

  // Create binaries directory
  try {
    await mkdir('binaries', { recursive: true })
  }
  catch {
    // Directory might already exist
  }

  const builds = [
    { os: 'darwin', arch: 'amd64', output: 'termsnap-darwin-x64' },
    { os: 'darwin', arch: 'arm64', output: 'termsnap-darwin-arm64' },
    { os: 'linux', arch: 'amd64', output: 'termsnap-linux-x64' },
    { os: 'linux', arch: 'arm64', output: 'termsnap-linux-arm64' },
    { os: 'windows', arch: 'amd64', output: 'termsnap-win32-x64.exe' },
  ]

  for (const build of builds) {
    p.log.info(`${c.blue`Building for ${c.yellow`${build.os}`} (${c.yellow`${build.arch}`})...`}`)

    try {
      await execa('go', ['build', '-o', join('binaries', build.output), 'main.go'], {
        env: {
          ...process.env,
          GOOS: build.os,
          GOARCH: build.arch,
        },
        stdio: 'inherit',
      })
      p.log.success(`${c.green`Built ${c.yellow`${build.output}`}`}`)
    }
    catch (error) {
      p.log.error(`${c.red`Failed to build ${c.yellow`${build.output}`}: ${error instanceof Error ? error.message : String(error)}`}`)
      process.exit(1)
    }
  }

  p.log.success(`${c.green`Build completed successfully!`}`)
}

buildGo().catch((error) => {
  p.log.error(`${c.red`Build failed: ${error instanceof Error ? error.message : String(error)}`}`)
  process.exit(1)
})
