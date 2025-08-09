export interface ThemeConfig {
  /**
   * The font config of the terminal.
   */
  font?: FontConfig
  /**
   * The color theme of the terminal.
   */
  theme?: XtermTheme
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

/**
 * Contains colors to theme the terminal with.
 */
export interface XtermTheme {
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

/**
 * Terminal font configuration
 */
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

/**
 * Terminal border configuration
 */
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
 * VSCode terminal color configuration format
 * https://github.com/mbadolato/iTerm2-Color-Schemes
 */
export interface VscodeTerminalConfig {
  'workbench.colorCustomizations'?: VscodeWorkbenchColors
}

export interface VscodeWorkbenchColors {
  'terminal.foreground'?: string
  'terminal.background'?: string
  'terminal.ansiBlack'?: string
  'terminal.ansiBlue'?: string
  'terminal.ansiCyan'?: string
  'terminal.ansiGreen'?: string
  'terminal.ansiMagenta'?: string
  'terminal.ansiRed'?: string
  'terminal.ansiWhite'?: string
  'terminal.ansiYellow'?: string
  'terminal.ansiBrightBlack'?: string
  'terminal.ansiBrightBlue'?: string
  'terminal.ansiBrightCyan'?: string
  'terminal.ansiBrightGreen'?: string
  'terminal.ansiBrightMagenta'?: string
  'terminal.ansiBrightRed'?: string
  'terminal.ansiBrightWhite'?: string
  'terminal.ansiBrightYellow'?: string
  'terminal.selectionBackground'?: string
  'terminalCursor.background'?: string
  'terminalCursor.foreground'?: string
}
