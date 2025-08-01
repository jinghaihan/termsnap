import type { ThemeConfig } from '../types'
import { BASE_THEME_OPTIONS } from './base'

// https://github.com/dracula/visual-studio-code/blob/main/src/dracula.yml
export const DRACULA_THEME: ThemeConfig = {
  ...BASE_THEME_OPTIONS,
  theme: {
    background: '#282A36',
    foreground: '#F8F8F2',
    selectionBackground: '#44475A',
    brightBlack: '#6272A4',
    brightBlue: '#8BE9FD',
    brightCyan: '#8BE9FD',
    brightGreen: '#50FA7B',
    brightMagenta: '#FF79C6',
    brightRed: '#FF5555',
    brightWhite: '#FFFFFF',
    brightYellow: '#FFFFA5',
    black: '#393a34',
    blue: '#8BE9FD',
    cyan: '#8BE9FD',
    green: '#50FA7B',
    magenta: '#FF79C6',
    red: '#FF5555',
    white: '#F8F8F2',
    yellow: '#FFFFA5',
  },
}
