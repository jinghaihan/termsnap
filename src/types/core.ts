import type { BUILTIN_THEME_CHOICES, IMAGE_FORMAT_CHOICES } from '../constants'
import type { BorderConfig, ColorTheme, FontConfig, ThemeConfig } from './theme'

export type ImageFormat = (typeof IMAGE_FORMAT_CHOICES)[number]
export type BuiltinTheme = (typeof BUILTIN_THEME_CHOICES)[number]

export interface CommandOptions extends CommonOptions, AppearanceOptions {}

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
   * Generate HTML template and save to file
   */
  html?: string
  /**
   * Open the browser after generating the HTML template
   */
  open?: boolean
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
   * Draw window decorations (minimize, maximize, and close button)
   */
  decoration?: boolean
}

export interface Options extends CommonOptions, ThemeConfig, Pick<AppearanceOptions, 'height' | 'width' | 'decoration'> {

}

export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>
    }
  : T

export type ConfigOptions = DeepRequired<Omit<Options, 'height' | 'width'>> & {
  command: string
  screenshot: boolean
  height?: number
  width?: number
}
