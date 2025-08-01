import type { ThemeConfig } from '../types'
import { BASE_THEME_OPTIONS } from './base'

// https://github.com/mbadolato/iTerm2-Color-Schemes/blob/master/vscode/Arthur.json
export const ARTHUR_THEME: ThemeConfig = {
  ...BASE_THEME_OPTIONS,
  theme: {
    background: '#1c1c1c',
    foreground: '#ddeedd',
    selectionBackground: '#4d4d4d',
    brightBlack: '#554444',
    brightBlue: '#87ceeb',
    brightCyan: '#b0c4de',
    brightGreen: '#88aa22',
    brightMagenta: '#deb887',
    brightRed: '#cd5c5c',
    brightWhite: '#bbaa99',
    brightYellow: '#e8ae5b',
    black: '#3d352a',
    blue: '#6495ed',
    cyan: '#b0c4de',
    green: '#86af80',
    magenta: '#deb887',
    red: '#cc5533',
    white: '#bbaa99',
    yellow: '#ffa75d',
  },
}
