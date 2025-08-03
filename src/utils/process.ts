import type { ResultPromise } from 'execa'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { execa } from 'execa'

/**
 * Generic function to kill processes by pattern with more precise matching
 */
async function killProcessesByPattern(pattern: string, processName: string, excludeCurrentPid = true) {
  try {
    const result = await execa('pgrep', ['-f', pattern], { reject: false })
    if (result.stdout) {
      const pids = result.stdout.trim().split('\n')
      for (const pid of pids) {
        if (pid && (!excludeCurrentPid || pid !== process.pid.toString())) {
          try {
            // Check if this process is actually related to termsnap before killing
            const processInfoResult = await execa('ps', ['-p', pid, '-o', 'args='], { reject: false })
            const processArgs = processInfoResult.stdout?.trim() || ''

            // Only kill if it's definitely a termsnap-related process
            if (processArgs.includes('termsnap')
              || (processArgs.includes('main.go') && processArgs.includes('--port'))
              || (processArgs.includes('main') && processArgs.includes('--port'))) {
              await execa('kill', ['-9', pid], { reject: false })
              p.log.info(`Killed lingering ${c.cyan`${processName}`} ${c.yellow`${pid}`}`)
            }
          }
          catch {
            // Ignore errors - process might have already exited
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
 * Generic function to kill processes by port with better validation
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
              // Verify this is actually using our port before killing
              const portCheckResult = await execa('lsof', ['-p', pid, '-a', '-i', `:${port}`], { reject: false })
              if (portCheckResult.stdout) {
                await execa('kill', ['-9', pid], { reject: false })
                p.log.info(`Killed process ${c.cyan`${pid}`} using port ${c.yellow`${port}`}`)
              }
            }
            catch {
              // Ignore errors - process might have already exited
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
 * More conservative approach to avoid killing unrelated processes
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

  // Only clean up processes related to the specific port
  await killExistingProcesses(port)

  // More conservative pattern matching - only kill termsnap processes with port argument
  await killProcessesByPattern(`termsnap.*--port.*${port}`, 'termsnap process')

  // Only kill main processes that have the specific port argument
  await killProcessesByPattern(`main.*--port.*${port}`, 'Go process')
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
