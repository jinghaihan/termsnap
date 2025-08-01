import type { ThemeConfig } from '../../types'
import { BASE_THEME_OPTIONS } from '../base'

// https://github.com/antfu/vscode-theme-vitesse/blob/main/themes/vitesse-black.json
export const VITESSE_BLACK_THEME: ThemeConfig = {
  ...BASE_THEME_OPTIONS,
  theme: {
    background: '#000',
    foreground: '#dbd7caee',
    selectionBackground: '#eeeeee18',
    brightBlack: '#777777',
    brightBlue: '#6394bf',
    brightCyan: '#5eaab5',
    brightGreen: '#4d9375',
    brightMagenta: '#d9739f',
    brightRed: '#cb7676',
    brightWhite: '#ffffff',
    brightYellow: '#e6cc77',
    black: '#393a34',
    blue: '#6394bf',
    cyan: '#5eaab5',
    green: '#4d9375',
    magenta: '#d9739f',
    red: '#cb7676',
    white: '#dbd7ca',
    yellow: '#e6cc77',
  },
}
