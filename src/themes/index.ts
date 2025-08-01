import type { StyleOptions, ThemeConfig } from '../types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { THEME_CHOICES } from '../constants'

// Dynamic theme loading function
async function loadTheme(themeName: string): Promise<ThemeConfig> {
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
      throw new Error(`Theme "${themeName}" not found`)
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
export async function getThemeWithSelection(themeName: string = 'vitesse-dark', config?: { theme?: string }): Promise<{ theme: ThemeConfig, selectedTheme: string }> {
  try {
    const theme = await loadTheme(themeName)

    // Update config if provided
    if (config && config.theme !== undefined) {
      config.theme = themeName
    }

    return {
      theme,
      selectedTheme: themeName,
    }
  }
  catch {
    p.log.warn(`Theme "${c.yellow(themeName)}" not found`)
    const selectedTheme = await selectTheme()

    // Update config if provided
    if (config && config.theme !== undefined) {
      config.theme = selectedTheme
    }

    const theme = await loadTheme(selectedTheme)
    return {
      theme,
      selectedTheme,
    }
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
