import type { ThemeConfig } from '../../types'
import { VITESSE_BLACK_THEME } from './vitesse-black'
import { VITESSE_DARK_THEME } from './vitesse-dark'
import { VITESSE_DARK_SOFT_THEME } from './vitesse-dark-soft'
import { VITESSE_LIGHT_THEME } from './vitesse-light'
import { VITESSE_LIGHT_SOFT_THEME } from './vitesse-light-soft'

export const VITESSE_THEMES: Record<string, ThemeConfig> = {
  'vitesse-dark': VITESSE_DARK_THEME,
  'vitesse-light': VITESSE_LIGHT_THEME,
  'vitesse-dark-soft': VITESSE_DARK_SOFT_THEME,
  'vitesse-light-soft': VITESSE_LIGHT_SOFT_THEME,
  'vitesse-black': VITESSE_BLACK_THEME,
}
