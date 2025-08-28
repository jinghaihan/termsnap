#!/usr/bin/env tsx

import { mkdir } from 'node:fs/promises'
import process from 'node:process'
import c from 'ansis'
import { execa } from 'execa'
import { join } from 'pathe'

const builds = [
  { os: 'darwin', arch: 'amd64', output: 'termsnap-darwin-x64' },
  { os: 'darwin', arch: 'arm64', output: 'termsnap-darwin-arm64' },
  { os: 'linux', arch: 'amd64', output: 'termsnap-linux-x64' },
  { os: 'linux', arch: 'arm64', output: 'termsnap-linux-arm64' },
  { os: 'windows', arch: 'amd64', output: 'termsnap-win32-x64.exe' },
]

async function buildGo() {
  console.log(`${c.cyan`Building Go binaries for all platforms...`}`)
  await mkdir('binaries', { recursive: true })

  for (const build of builds) {
    console.log(`${c.blue`Building for ${c.cyan`${build.os}`} (${c.yellow`${build.arch}`})...`}`)

    try {
      await execa(
        'go',
        [
          'build',
          '-o',
          join('binaries', build.output),
          'main.go',
        ],
        {
          env: {
            ...process.env,
            GOOS: build.os,
            GOARCH: build.arch,
          },
          stdio: 'inherit',
        },
      )
    }
    catch (error) {
      console.log(`${c.red`Failed to build ${c.yellow`${build.output}`}`}`)
      throw error
    }
  }

  console.log(`${c.green`Build completed`}`)
}

buildGo().catch((error) => {
  console.error(`${c.red`Build failed: ${error instanceof Error ? error.message : String(error)}`}`)
  process.exit(1)
})
