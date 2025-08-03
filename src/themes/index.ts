import type { BuiltInTheme, CommandOptions, StyleOptions, TerminalConfig, ThemeConfig, VscodeTerminalConfig } from '../types'
import { access, constants, mkdir, readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import c from 'ansis'
import { dirname, join } from 'pathe'
import { THEME_CHOICES } from '../constants'

// Dynamic theme loading function
async function loadTheme(themeName: string): Promise<ThemeConfig> {
  // Check if it's a built-in theme first
  if (THEME_CHOICES.includes(themeName as BuiltInTheme)) {
    return await loadBuiltInTheme(themeName)
  }

  // Try to load remote theme
  return await loadRemoteTheme(themeName)
}

/**
 * Load built-in theme
 */
async function loadBuiltInTheme(themeName: string): Promise<ThemeConfig> {
  // Dynamic imports based on theme name
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
    case 'dracula': {
      const { DRACULA_THEME } = await import('./dracula')
      return DRACULA_THEME
    }
    default:
      throw new Error(`Built-in theme "${themeName}" not found`)
  }
}

/**
 * Get remote theme cache directory
 */
function getThemeCacheDir(): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const packageRoot = join(__dirname, '../../')
  return join(packageRoot, '.theme-cache')
}

/**
 * Convert VSCode theme format to TerminalConfig
 */
function convertVSCodeToTerminalConfig(vscodeTheme: VscodeTerminalConfig): TerminalConfig {
  const workbench = vscodeTheme['workbench.colorCustomizations'] || {}

  return {
    foreground: workbench['terminal.foreground'],
    background: workbench['terminal.background'],
    cursor: workbench['terminalCursor.foreground'],
    cursorAccent: workbench['terminalCursor.background'],
    selectionBackground: workbench['terminal.selectionBackground'],
    black: workbench['terminal.ansiBlack'],
    red: workbench['terminal.ansiRed'],
    green: workbench['terminal.ansiGreen'],
    yellow: workbench['terminal.ansiYellow'],
    blue: workbench['terminal.ansiBlue'],
    magenta: workbench['terminal.ansiMagenta'],
    cyan: workbench['terminal.ansiCyan'],
    white: workbench['terminal.ansiWhite'],
    brightBlack: workbench['terminal.ansiBrightBlack'],
    brightRed: workbench['terminal.ansiBrightRed'],
    brightGreen: workbench['terminal.ansiBrightGreen'],
    brightYellow: workbench['terminal.ansiBrightYellow'],
    brightBlue: workbench['terminal.ansiBrightBlue'],
    brightMagenta: workbench['terminal.ansiBrightMagenta'],
    brightCyan: workbench['terminal.ansiBrightCyan'],
    brightWhite: workbench['terminal.ansiBrightWhite'],
  }
}

/**
 * Download remote theme with loading indicator
 */
async function downloadRemoteTheme(url: string, cachePath: string): Promise<VscodeTerminalConfig> {
  const spinner = p.spinner()
  spinner.start(`Downloading theme from ${c.yellow(url)}...`)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const themeData = await response.json()

    // Create cache directory
    const cacheDir = dirname(cachePath)
    await mkdir(cacheDir, { recursive: true })

    // Cache the downloaded theme
    await writeFile(cachePath, JSON.stringify(themeData, null, 2), 'utf-8')

    spinner.stop('Theme downloaded successfully')
    return themeData
  }
  catch (error: unknown) {
    spinner.stop(c.red('Failed to download theme'))
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to download remote theme: ${errorMessage}`)
  }
}

/**
 * Load remote theme from iTerm2 Color Schemes repository
 */
async function loadRemoteTheme(themeName: string): Promise<ThemeConfig> {
  const baseUrl = 'https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/vscode'
  const url = `${baseUrl}/${themeName}.json`
  const cacheDir = getThemeCacheDir()
  const cachePath = join(cacheDir, `${themeName}.json`)

  let themeData: VscodeTerminalConfig

  // Try to load from cache first
  try {
    await access(cachePath, constants.F_OK)
    const cachedData = await readFile(cachePath, 'utf-8')
    themeData = JSON.parse(cachedData)
    // p.log.info(`Using cached theme: ${c.yellow(themeName)}`)
  }
  catch {
    // Cache miss, download from remote
    themeData = await downloadRemoteTheme(url, cachePath)
  }

  // Convert VSCode format to our TerminalConfig
  const terminalConfig = convertVSCodeToTerminalConfig(themeData)

  // Import base theme to get default styling
  const { BASE_THEME_OPTIONS } = await import('./base')

  return {
    ...BASE_THEME_OPTIONS,
    theme: terminalConfig,
  }
}

/**
 * Interactive theme selection function
 */
async function selectTheme(): Promise<string> {
  const themeChoice = await p.select({
    message: 'Select a theme:',
    options: THEME_CHOICES.map(theme => ({
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

/**
 * Get theme with interactive selection if not found
 */
export async function getThemeWithSelection(themeName: string = 'vitesse-dark', config?: CommandOptions): Promise<{ theme: ThemeConfig, selectedTheme: string }> {
  let theme
  let selectedTheme = themeName

  try {
    theme = await loadTheme(themeName)
  }
  catch {
    p.log.warn(`Theme "${c.yellow(themeName)}" not found`)
    selectedTheme = await selectTheme()

    theme = await loadTheme(selectedTheme)
  }

  // Update config if provided
  if (config) {
    config.theme = selectedTheme
  }

  return {
    theme,
    selectedTheme,
  }
}

export async function getTheme(themeName: string = 'vitesse-dark'): Promise<ThemeConfig> {
  try {
    return await loadTheme(themeName)
  }
  catch (error) {
    p.log.warn(`Theme "${c.yellow(themeName)}" not found, falling back to vitesse-dark theme`)
    try {
      return await loadTheme('vitesse-dark')
    }
    catch {
      // If even vitesse-dark fails, throw the original error
      throw error
    }
  }
}

/**
 * Merge config options with theme configuration
 */
export async function mergeConfigWithTheme(themeName: string = 'vitesse-dark', config?: StyleOptions): Promise<ThemeConfig> {
  const theme = await getTheme(themeName)

  if (!config) {
    return theme
  }

  const mergedTheme: ThemeConfig = { ...theme }

  // Merge font configuration
  if (config.fontFamily || config.fontSize || config.fontWeight || config.lineHeight) {
    mergedTheme.font = {
      ...mergedTheme.font,
      ...(config.fontFamily && { fontFamily: config.fontFamily }),
      ...(config.fontSize && { fontSize: Number.parseInt(config.fontSize) }),
      ...(config.fontWeight && { fontWeight: Number.parseInt(config.fontWeight) }),
      ...(config.lineHeight && { lineHeight: Number.parseFloat(config.lineHeight) }),
    }
  }

  // Merge border configuration
  if (config.borderRadius || config.borderWidth || config.borderColor) {
    mergedTheme.border = {
      ...mergedTheme.border,
      ...(config.borderRadius && { borderRadius: Number.parseInt(config.borderRadius) }),
      ...(config.borderWidth && { borderWidth: Number.parseInt(config.borderWidth) }),
      ...(config.borderColor && { borderColor: config.borderColor }),
    }
  }

  // Merge other style properties
  if (config.boxShadow) {
    mergedTheme.boxShadow = config.boxShadow
  }
  if (config.padding) {
    mergedTheme.padding = config.padding
  }
  if (config.margin) {
    mergedTheme.margin = config.margin
  }

  // Merge terminal theme configuration
  if (config.colors) {
    mergedTheme.theme = { ...mergedTheme.theme, ...config.colors }
  }

  return mergedTheme
}
