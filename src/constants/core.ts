import type { TypedOptions } from '../types'

export const IMAGE_FORMAT_CHOICES = ['png', 'jpeg', 'webp'] as const

export const BUILTIN_THEME_CHOICES = [
  'vitesse-dark',
  'vitesse-light',
  'vitesse-dark-soft',
  'vitesse-light-soft',
  'vitesse-black',
  'catppuccin-frappe',
  'catppuccin-latte',
  'catppuccin-macchiato',
  'catppuccin-mocha',
] as const

export const DECORATION_BAR_HEIGHT = 32

export const DEFAULT_TYPED_OPTIONS: Required<TypedOptions> = {
  speed: 100,
  initialDelay: 0,
  pauseAfter: 150,
}
