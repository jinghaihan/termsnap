import type { CdnProvider, HTMLTemplateOptions, StyleOptions, TerminalOutput } from './types'
import { writeFileSync } from 'node:fs'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { join } from 'pathe'
import { XTERM_CDN_URLS } from './constants'
import { mergeConfigWithTheme } from './themes'
import { calculateContainerDimensions, processTerminalOutputs } from './utils'

export class HTMLTemplateGenerator {
  private static getCDNUrl(cdn: CdnProvider = 'jsdelivr'): string {
    return XTERM_CDN_URLS[cdn].js
  }

  private static getCSSUrl(cdn: CdnProvider = 'jsdelivr'): string {
    return XTERM_CDN_URLS[cdn].css
  }

  private static getFitUrl(cdn: CdnProvider = 'jsdelivr'): string {
    return XTERM_CDN_URLS[cdn].fit
  }

  private static async generateXTermConfig(themeName: string = 'vitesse-dark', config?: StyleOptions): Promise<string> {
    const mergedTheme = await mergeConfigWithTheme(themeName, config)
    const xtermTheme = mergedTheme.theme || {}
    return JSON.stringify(xtermTheme)
  }

  private static async generateContainerStyles(themeName: string = 'vitesse-dark', outputs: TerminalOutput[] = [], config?: StyleOptions): Promise<string> {
    const mergedTheme = await mergeConfigWithTheme(themeName, config)
    const { width, height } = await calculateContainerDimensions(outputs, themeName, config)
    const showDecoration = config?.decoration || false

    return `
        body {
            margin: 0;
            padding: 0;
            background-color: ${mergedTheme.theme?.background || '#1e1e1e'};
            font-family: "${mergedTheme.font?.fontFamily || 'monospace'}";
            font-size: ${mergedTheme.font?.fontSize || 14}px;
            font-weight: ${mergedTheme.font?.fontWeight || 400};
            line-height: ${mergedTheme.font?.lineHeight || 1.5};
            min-height: 100vh;
            width: 100vw;
            overflow: auto;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .terminal-container {
            width: ${width}px;
            height: ${height}px;
            background-color: ${mergedTheme.theme?.background || '#1e1e1e'};
            border-radius: ${mergedTheme.border?.borderRadius || 0}px;
            border: ${mergedTheme.border?.borderWidth || 0}px solid ${mergedTheme.border?.borderColor || 'transparent'};
            overflow: hidden;
            box-shadow: ${mergedTheme.boxShadow || 'none'};
            padding: ${mergedTheme.padding || '0'};
            margin: ${mergedTheme.margin || '0'};
            position: relative;
        }
        ${showDecoration
          ? `
        .window-decoration {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 32px;
            display: flex;
            align-items: center;
            padding: 0 12px;
            z-index: 10;
        }
        .window-buttons {
            display: flex;
            gap: 8px;
        }
        .window-button {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: none;
        }
        .window-button.close {
            background: #ff5f56;
        }
        .window-button.minimize {
            background: #ffbd2e;
        }
        .window-button.maximize {
            background: #27c93f;
        }
        .terminal-content {
            height: 100%;
            padding-top: ${showDecoration ? '32px' : '0'};
        }
        `
          : `
        .terminal-content {
            height: 100%;
        }
        `}
        #terminal {
            width: 100%;
            height: 100%;
        }
    `
  }

  static async generateHTML(options: HTMLTemplateOptions): Promise<string> {
    const {
      command: _command,
      outputs,
      theme = 'vitesse-dark',
      cdn = 'jsdelivr',
      title = 'Terminal Output',
      config,
    } = options

    const mergedTheme = await mergeConfigWithTheme(theme, config)
    const xtermConfig = await this.generateXTermConfig(theme, config)
    const containerStyles = await this.generateContainerStyles(theme, outputs, config)
    const jsUrl = this.getCDNUrl(cdn)
    const cssUrl = this.getCSSUrl(cdn)
    const fitUrl = this.getFitUrl(cdn)

    // Process outputs to get combined output and dimensions
    const { combinedOutput, maxLineLength } = processTerminalOutputs(outputs)

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="${cssUrl}">
    <style>
        ${containerStyles}
    </style>
</head>
<body>
    <div class="terminal-container">
        ${config?.decoration
          ? `
        <div class="window-decoration">
            <div class="window-buttons">
                <button class="window-button close" title="Close"></button>
                <button class="window-button minimize" title="Minimize"></button>
                <button class="window-button maximize" title="Maximize"></button>
            </div>
        </div>
        `
          : ''}
        <div class="terminal-content">
            <div id="terminal"></div>
        </div>
    </div>

    <script src="${jsUrl}"></script>
    <script src="${fitUrl}"></script>
    <script>
        // Wait for xterm.js to load
        window.addEventListener('load', function() {
            // Check if Terminal is available
            if (typeof Terminal === 'undefined') {
                console.error('Terminal is not defined. Please check if xterm.js loaded correctly.');
                return;
            }
            
            // Check if FitAddon is available
            if (typeof FitAddon === 'undefined') {
                console.error('FitAddon is not defined. Please check if @xterm/addon-fit loaded correctly.');
                return;
            }
            
            // Initialize xterm.js with theme-based configuration
            const themeConfig = ${JSON.stringify(mergedTheme)};
            const term = new Terminal({
                convertEol: true,
                cursorBlink: true,
                cursorStyle: 'block',
                fontSize: themeConfig.font?.fontSize || 14,
                fontFamily: themeConfig.font?.fontFamily || 'monospace',
                fontWeight: themeConfig.font?.fontWeight || 400,
                lineHeight: themeConfig.font?.lineHeight || 1.5,
                theme: ${xtermConfig},
                allowTransparency: true,
                cols: ${maxLineLength},
                rows: ${combinedOutput.split('\n').length}
            });
            
            // Initialize fit addon
            const fitAddon = new FitAddon.FitAddon();
            term.loadAddon(fitAddon);
            
            term.open(document.getElementById('terminal'));
            
            // Fit terminal to container
            fitAddon.fit();
            
            // Resize on window resize
            window.addEventListener('resize', () => {
                fitAddon.fit();
            });
            
            // Write the combined output directly to terminal
            const combinedOutput = ${JSON.stringify(combinedOutput)};
            
            try {
                term.write(combinedOutput);
            } catch (e) {
                console.warn('Failed to write output:', e);
                // Try to write as UTF-8 if there are encoding issues
                const decoder = new TextDecoder('utf-8', { fatal: false });
                const encoder = new TextEncoder();
                const bytes = encoder.encode(combinedOutput);
                const decoded = decoder.decode(bytes);
                term.write(decoded);
            }
            
            // Ensure cursor is at the end
            term.focus();

            // Hide cursor
            term.write('\x1B[?25l');
            
            // Auto-scroll to bottom
            // term.scrollToBottom();
        });
    </script>
</body>
</html>`
  }

  static async saveToFile(options: HTMLTemplateOptions, outputPath: string = 'index.html'): Promise<string> {
    const fullPath = join(process.cwd(), outputPath)
    p.log.info(`Generating ${c.cyan`HTML template`} to ${c.yellow`${outputPath}`}...`)
    const html = await this.generateHTML(options)
    writeFileSync(fullPath, html, 'utf8')
    p.log.success(`HTML template saved to: ${c.yellow`${fullPath}`}`)
    return html
  }
}
