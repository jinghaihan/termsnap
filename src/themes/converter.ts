import type { ColorTheme, VscodeTerminalConfig } from '../types'

export function convertToColorTheme(vscodeTheme: VscodeTerminalConfig): ColorTheme {
  const workbench = vscodeTheme['workbench.colorCustomizations'] || {}

  return {
    foreground: workbench['terminal.foreground'],
    background: workbench['terminal.background'],
    black: workbench['terminal.ansiBlack'],
    red: workbench['terminal.ansiRed'],
    green: workbench['terminal.ansiGreen'],
    yellow: workbench['terminal.ansiYellow'],
    blue: workbench['terminal.ansiBlue'],
    magenta: workbench['terminal.ansiMagenta'],
    cyan: workbench['terminal.ansiCyan'],
    white: workbench['terminal.ansiWhite'],
    brightBlack: workbench['terminal.ansiBrightBlack'],
    brightRed: workbench['terminal.ansiBrightRed'],
    brightGreen: workbench['terminal.ansiBrightGreen'],
    brightYellow: workbench['terminal.ansiBrightYellow'],
    brightBlue: workbench['terminal.ansiBrightBlue'],
    brightMagenta: workbench['terminal.ansiBrightMagenta'],
    brightCyan: workbench['terminal.ansiBrightCyan'],
    brightWhite: workbench['terminal.ansiBrightWhite'],
  }
}
