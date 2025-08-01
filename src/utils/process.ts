import type { ResultPromise } from 'execa'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'

/**
 * Generic function to kill processes by pattern
 */
async function killProcessesByPattern(pattern: string, processName: string, excludeCurrentPid = true) {
  try {
    const result = await execa('pgrep', ['-f', pattern], { reject: false })
    if (result.stdout) {
      const pids = result.stdout.trim().split('\n')
      for (const pid of pids) {
        if (pid && (!excludeCurrentPid || pid !== process.pid.toString())) {
          try {
            await execa('kill', ['-9', pid], { reject: false })
            p.log.info(`Killed lingering ${c.cyan`${processName}`} ${c.yellow`${pid}`}`)
          }
          catch {
            // Ignore errors
          }
        }
      }
    }
  }
  catch {
    // Ignore errors
  }
}

/**
 * Generic function to kill processes by port
 */
async function killProcessesByPort(port: number) {
  try {
    // Kill any process using the port
    await execa('lsof', ['-ti', `:${port}`], { reject: false }).then(async (result) => {
      if (result.stdout) {
        const pids = result.stdout.trim().split('\n')
        for (const pid of pids) {
          if (pid) {
            try {
              await execa('kill', ['-9', pid], { reject: false })
              p.log.info(`Killed process ${c.cyan`${pid}`} using port ${c.yellow`${port}`}`)
            }
            catch {
              // Ignore errors
            }
          }
        }
      }
    })

    // Wait a bit for processes to be killed
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  catch {
    // Ignore errors
  }
}

/**
 * Kill any existing processes on the specified port
 */
export async function killExistingProcesses(port: number) {
  await killProcessesByPort(port)
}

/**
 * Ensure port is released and Go process is properly terminated
 */
export async function ensurePortReleased(port: number, goProcess: ResultPromise | null) {
  // First, try to gracefully terminate the Go process
  if (goProcess && !goProcess.killed) {
    try {
      goProcess.kill('SIGTERM')
      // Wait for graceful termination
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Force kill if still running
      if (!goProcess.killed) {
        goProcess.kill('SIGKILL')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    catch {
      // Ignore errors
    }
  }

  await killExistingProcesses(port)
  await killProcessesByPattern('termsnap', 'termsnap process')
  await killProcessesByPattern('main', 'Go process')
}

/**
 * Check if port is actually free after cleanup
 */
export async function checkPortStatus(port: number): Promise<boolean> {
  try {
    const result = await execa('lsof', ['-ti', `:${port}`], { reject: false })
    if (result.stdout) {
      p.log.warn(`Warning: Port ${c.yellow`${port}`} is still in use after cleanup`)
      return false
    }
    return true
  }
  catch {
    // Port is free
    return true
  }
}
