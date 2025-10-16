import type { BuiltinTheme, ThemeConfig, VscodeTerminalConfig } from '../types'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { basename, join } from 'pathe'
import { BUILTIN_THEME_CHOICES, THEME_CACHE_DIR } from '../constants'
import { convertToColorTheme } from './converter'

export async function loadTheme(themeName: string = 'vitesse-dark', force: boolean = false): Promise<ThemeConfig> {
  if (BUILTIN_THEME_CHOICES.includes(themeName as BuiltinTheme)) {
    return await loadBuiltInTheme(themeName)
  }
  return await loadRemoteTheme(themeName, force)
}

async function loadBuiltInTheme(themeName: string): Promise<ThemeConfig> {
  switch (themeName) {
    case 'vitesse-dark':
    case 'vitesse-light':
    case 'vitesse-dark-soft':
    case 'vitesse-light-soft':
    case 'vitesse-black': {
      const { VITESSE_THEMES } = await import('./vitesse')
      return VITESSE_THEMES[themeName]
    }
    case 'catppuccin-latte':
    case 'catppuccin-frappe':
    case 'catppuccin-macchiato':
    case 'catppuccin-mocha': {
      const { CATPPUCCIN_THEMES } = await import('./catppuccin')
      return CATPPUCCIN_THEMES[themeName]
    }
    default: {
      p.outro(c.red(`Built-in theme "${themeName}" not found`))
      process.exit(1)
    }
  }
}

async function loadRemoteTheme(themeName: string, force: boolean): Promise<ThemeConfig> {
  const baseUrl = 'https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/vscode'
  const url = `${baseUrl}/${themeName}.json`
  const cachePath = join(THEME_CACHE_DIR, `${themeName}.json`)

  let themeData: VscodeTerminalConfig
  try {
    if (existsSync(cachePath) && !force) {
      const cachedData = await readFile(cachePath, 'utf-8')
      themeData = JSON.parse(cachedData)
    }
    else {
      themeData = await downloadRemoteTheme(url, cachePath)
    }

    const colorTheme = convertToColorTheme(themeData)
    const { BASE_THEME_OPTIONS } = await import('./base')

    return {
      ...BASE_THEME_OPTIONS,
      theme: colorTheme,
    }
  }
  catch {
    const themeName = await selectBuiltInTheme()
    return await loadBuiltInTheme(themeName)
  }
}

async function downloadRemoteTheme(url: string, cachePath: string): Promise<VscodeTerminalConfig> {
  const spinner = p.spinner()
  const themeName = basename(cachePath)
  spinner.start(`Downloading theme ${c.yellow(themeName)}`)

  const response = await fetch(url)
  if (!response.ok) {
    spinner.stop(c.red(`Failed to download theme ${c.yellow(themeName)}`))
    throw new Error(String(response))
  }

  const data = await response.json()

  await mkdir(THEME_CACHE_DIR, { recursive: true })
  await writeFile(cachePath, JSON.stringify(data, null, 2))

  spinner.stop(`Theme ${c.yellow(themeName)} downloaded successfully`)
  return data
}

async function selectBuiltInTheme(): Promise<string> {
  const themeChoice = await p.select({
    message: 'Select a theme:',
    options: BUILTIN_THEME_CHOICES.map(theme => ({
      value: theme,
      label: theme,
    })),
  })

  if (p.isCancel(themeChoice)) {
    p.outro(c.red('aborting'))
    process.exit(1)
  }

  return themeChoice as string
}
