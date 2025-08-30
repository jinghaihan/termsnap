import type { BUILTIN_THEME_CHOICES, IMAGE_FORMAT_CHOICES, VIDEO_FORMAT_CHOICES } from '../constants'
import type { BorderConfig, ColorTheme, FontConfig, ThemeConfig } from './theme'

export type ImageFormat = (typeof IMAGE_FORMAT_CHOICES)[number]

export type VideoFormat = (typeof VIDEO_FORMAT_CHOICES)[number]

export type BuiltinTheme = (typeof BUILTIN_THEME_CHOICES)[number]

export interface CommandOptions extends CommonOptions, AppearanceOptions {
  typedOptions?: TypedOptions
}

export interface CommonOptions {
  cwd?: string
  /**
   * Server port
   */
  port?: number
  /**
   * Device pixel ratio for screenshot
   */
  dpi?: number
  /**
   * Generate a png and save to file
   */
  png?: string
  /**
   * Generate a jpeg and save to file
   */
  jpeg?: string
  /**
   * Generate a webp and save to file
   */
  webp?: string
  /**
   * Frames per second for mp4
   */
  fps?: number
  /**
   * Generate a mp4 and save to file
   */
  mp4?: string
  /**
   * Generate a avi and save to file
   */
  avi?: string
  /**
   * Generate a mov and save to file
   */
  mov?: string
  /**
   * Generate a webm and save to file
   */
  webm?: string
  /**
   * Generate HTML template and save to file
   */
  html?: string
  /**
   * Generate animated HTML template and save to file
   */
  replay?: string
  /**
   * Loop the animation for a given number of milliseconds
   */
  loop?: number
  /**
   * Open the browser after generating the HTML template
   */
  open?: boolean
  /**
   * Open the browser after generating the animated HTML template
   */
  openReplay?: boolean
  /**
   * Force to download the theme from remote, even if it's already cached
   */
  force?: boolean
}

export interface AppearanceOptions extends FontConfig, BorderConfig, Pick<ThemeConfig, 'boxShadow' | 'padding' | 'margin'> {
  /**
   * Terminal theme
   */
  theme?: string
  /**
   * Terminal theme configuration
   */
  colors?: ColorTheme
  /**
   * Terminal height
   */
  height?: number
  /**
   * Terminal width
   */
  width?: number
  /**
   * Show command in the terminal
   */
  cmd?: boolean
  /**
   * Typed command in the terminal
   */
  typed?: boolean
  /**
   * Draw window decorations (minimize, maximize, and close button)
   */
  decoration?: boolean
}

export interface TypedOptions {
  /**
   * Typing speed in milliseconds per character
   */
  speed?: number
  /**
   * Initial delay before starting to type
   */
  initialDelay?: number
  /**
   * Pause after typing completes
   */
  pauseAfter?: number
}

export interface Options extends CommonOptions, ThemeConfig, Pick<AppearanceOptions, 'height' | 'width' | 'decoration' | 'cmd' | 'typed'> {
  typedOptions?: TypedOptions
}

export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>
    }
  : T

export type ConfigOptions = DeepRequired<Omit<Options, 'height' | 'width'>> & {
  command: string
  screenshot: boolean
  video: boolean
  height?: number
  width?: number
}

export interface TerminalSnapshot {
  html: string
  rows: number
  cols: number
  width: number
  height: number
  timestamp?: number
}
