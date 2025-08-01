import type { CDN_CHOICES, IMAGE_FORMAT_CHOICES } from './constants'

export type CdnProvider = (typeof CDN_CHOICES)[number]

export type ImageFormat = (typeof IMAGE_FORMAT_CHOICES)[number]

export interface CommandOptions extends CommonOptions, StyleOptions {}

export interface CommonOptions {
  /**
   * Server port
   */
  port?: string
  /**
   * CDN provider for xterm.js
   */
  cdn?: CdnProvider
  /**
   * Generate a screenshot and save to file
   */
  screenshot?: string
  /**
   * Generate HTML template and save to file
   */
  html?: string
  /**
   * Open the browser after generating the HTML template
   */
  open?: boolean
}

export interface StyleOptions {
  /**
   * Terminal theme
   */
  theme?: string
  /**
   * Terminal theme configuration
   */
  colors?: TerminalConfig
  /**
   * Terminal height
   */
  height?: string
  /**
   * Terminal width
   */
  width?: string
  /**
   * Terminal font family
   */
  fontFamily?: string
  /**
   * Terminal font size
   */
  fontSize?: string
  /**
   * Terminal font weight
   */
  fontWeight?: string
  /**
   * Terminal line height
   */
  lineHeight?: string
  /**
   * Terminal border radius
   */
  borderRadius?: string
  /**
   * Terminal border width
   */
  borderWidth?: string
  /**
   * Terminal border color
   */
  borderColor?: string
  /**
   * Terminal box shadow
   */
  boxShadow?: string
  /**
   * Terminal padding
   */
  padding?: string
  /**
   * Terminal margin
   */
  margin?: string
  /**
   * Draw window decorations (minimize, maximize, and close button)
   */
  decoration?: boolean
}

export interface TerminalOutput {
  type: 'output' | 'error' | 'exit'
  data: string
  timestamp: number
}

export interface WebSocketMessage {
  type: 'command' | 'output' | 'error' | 'exit' | 'input'
  data: string
  timestamp: number
}

export interface WebSocketClient {
  connect: () => Promise<void>
  send: (message: WebSocketMessage) => void
  onMessage: (callback: (message: WebSocketMessage) => void) => void
  onError: (callback: (error: Error) => void) => void
  onClose: (callback: () => void) => void
  close: () => void
}

export interface CommandExecutionResult {
  command: string
  outputs: TerminalOutput[]
  startTime: number
  endTime: number
  exitCode: number
}

export interface HTMLTemplateOptions {
  title?: string
  command: string
  outputs: TerminalOutput[]
  theme?: string
  cdn?: CdnProvider
  config?: StyleOptions
}

export interface ThemeConfig {
  /**
   * The font config of the terminal.
   */
  font?: FontConfig
  /**
   * The color theme of the terminal.
   */
  theme?: TerminalConfig
  /**
   * The border config of the terminal.
   */
  border?: BorderConfig
  /**
   * The box shadow of the terminal.
   */
  boxShadow?: string
  /**
   * The padding of the terminal.
   */
  padding?: string
  /**
   * The margin of the terminal.
   */
  margin?: string
}

export interface FontConfig {
  /**
   * The font size used to render text.
   */
  fontSize?: number
  /**
   * The font family used to render text.
   */
  fontFamily?: string
  /**
   * The font weight used to render non-bold text.
   */
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | number
  /**
   * The line height used to render text.
   */
  lineHeight?: number
}

export interface BorderConfig {
  /**
   * The border radius of the terminal.
   */
  borderRadius?: number
  /**
   * The border width of the terminal.
   */
  borderWidth?: number
  /**
   * The border color of the terminal.
   */
  borderColor?: string
}

/**
 * Contains colors to theme the terminal with.
 */
export interface TerminalConfig {
  /** The default foreground color */
  foreground?: string
  /** The default background color */
  background?: string
  /** The cursor color */
  cursor?: string
  /** The accent color of the cursor (fg color for a block cursor) */
  cursorAccent?: string
  /** The selection background color (can be transparent) */
  selectionBackground?: string
  /** The selection foreground color */
  selectionForeground?: string
  /**
   * The selection background color when the terminal does not have focus (can
   * be transparent)
   */
  selectionInactiveBackground?: string
  /** ANSI black (eg. `\x1b[30m`) */
  black?: string
  /** ANSI red (eg. `\x1b[31m`) */
  red?: string
  /** ANSI green (eg. `\x1b[32m`) */
  green?: string
  /** ANSI yellow (eg. `\x1b[33m`) */
  yellow?: string
  /** ANSI blue (eg. `\x1b[34m`) */
  blue?: string
  /** ANSI magenta (eg. `\x1b[35m`) */
  magenta?: string
  /** ANSI cyan (eg. `\x1b[36m`) */
  cyan?: string
  /** ANSI white (eg. `\x1b[37m`) */
  white?: string
  /** ANSI bright black (eg. `\x1b[1;30m`) */
  brightBlack?: string
  /** ANSI bright red (eg. `\x1b[1;31m`) */
  brightRed?: string
  /** ANSI bright green (eg. `\x1b[1;32m`) */
  brightGreen?: string
  /** ANSI bright yellow (eg. `\x1b[1;33m`) */
  brightYellow?: string
  /** ANSI bright blue (eg. `\x1b[1;34m`) */
  brightBlue?: string
  /** ANSI bright magenta (eg. `\x1b[1;35m`) */
  brightMagenta?: string
  /** ANSI bright cyan (eg. `\x1b[1;36m`) */
  brightCyan?: string
  /** ANSI bright white (eg. `\x1b[1;37m`) */
  brightWhite?: string
  /** ANSI extended colors (16-255) */
  extendedAnsi?: string[]
}
