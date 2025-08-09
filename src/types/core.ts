import type { BUILTIN_THEME_CHOICES, CDN_PROVIDER_CHOICES, IMAGE_FORMAT_CHOICES } from '../constants'
import type { BorderConfig, FontConfig, ThemeConfig, XtermTheme } from './theme'

export type CdnProvider = (typeof CDN_PROVIDER_CHOICES)[number]
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
   * CDN provider for xterm.js
   */
  cdn?: CdnProvider
  /**
   * Generate a screenshot and save to file
   */
  screenshot?: string
  /**
   * Device pixel ratio for screenshot
   */
  dpi?: number
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
  colors?: XtermTheme
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
  height?: number
  width?: number
}
