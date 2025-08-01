import type { CommandOptions } from './types'

export const CDN_CHOICES = ['jsdelivr', 'unpkg'] as const
export const IMAGE_FORMAT_CHOICES = ['png', 'jpeg', 'webp'] as const

export const THEME_CHOICES = [
  'vitesse-dark',
  'vitesse-light',
  'vitesse-dark-soft',
  'vitesse-light-soft',
  'vitesse-black',
  'catppuccin-frappe',
  'catppuccin-latte',
  'catppuccin-macchiato',
  'catppuccin-mocha',
  'dracula',
] as const

export const XTERM_VERSION = '5.5.0'
export const XTERM_FIT_VERSION = '0.10.0'

export const XTERM_CDN_URLS = {
  jsdelivr: {
    js: `https://cdn.jsdelivr.net/npm/@xterm/xterm@${XTERM_VERSION}/lib/xterm.min.js`,
    css: `https://cdn.jsdelivr.net/npm/@xterm/xterm@${XTERM_VERSION}/css/xterm.min.css`,
    fit: `https://cdn.jsdelivr.net/npm/@xterm/addon-fit@${XTERM_FIT_VERSION}/lib/addon-fit.min.js`,
  },
  unpkg: {
    js: `https://unpkg.com/@xterm/xterm@${XTERM_VERSION}/lib/xterm.min.js`,
    css: `https://unpkg.com/@xterm/xterm@${XTERM_VERSION}/css/xterm.min.css`,
    fit: `https://unpkg.com/@xterm/addon-fit@${XTERM_FIT_VERSION}/lib/addon-fit.min.js`,
  },
} as const

export const DEFAULT_COMMAND_OPTIONS: CommandOptions = {
  port: '3000',
  cdn: 'jsdelivr',
  open: false,
}
