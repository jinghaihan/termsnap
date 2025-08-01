import type { ThemeConfig } from '../../types'
import { BASE_THEME_OPTIONS_LIGHT } from '../base'

// https://github.com/antfu/vscode-theme-vitesse/blob/main/themes/vitesse-light.json
export const VITESSE_LIGHT_THEME: ThemeConfig = {
  ...BASE_THEME_OPTIONS_LIGHT,
  theme: {
    background: '#ffffff',
    foreground: '#393a34',
    selectionBackground: '#22222218',
    brightBlack: '#aaaaaa',
    brightBlue: '#296aa3',
    brightCyan: '#2993a3',
    brightGreen: '#1e754f',
    brightMagenta: '#a13865',
    brightRed: '#ab5959',
    brightWhite: '#dddddd',
    brightYellow: '#bda437',
    black: '#121212',
    blue: '#296aa3',
    cyan: '#2993a3',
    green: '#1e754f',
    magenta: '#a13865',
    red: '#ab5959',
    white: '#dbd7ca',
    yellow: '#bda437',
  },
}
