import type { ThemeConfig } from '../../types'
import { CATPPUCCIN_FRAPPE_THEME } from './catppuccin-frappe'
import { CATPPUCCIN_LATTE_THEME } from './catppuccin-latte'
import { CATPPUCCIN_MACCHIATO_THEME } from './catppuccin-macchiato'
import { CATPPUCCIN_MOCHA_THEME } from './catppuccin-mocha'

// https://github.com/catppuccin/vscode
export const CATPPUCCIN_THEMES: Record<string, ThemeConfig> = {
  'catppuccin-frappe': CATPPUCCIN_FRAPPE_THEME,
  'catppuccin-latte': CATPPUCCIN_LATTE_THEME,
  'catppuccin-macchiato': CATPPUCCIN_MACCHIATO_THEME,
  'catppuccin-mocha': CATPPUCCIN_MOCHA_THEME,
}
