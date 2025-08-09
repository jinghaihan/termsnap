import type { ConfigOptions, TerminalOutput } from './types'
import { writeFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import c from 'ansis'
import { join } from 'pathe'
import { DECORATION_BAR_HEIGHT, XTERM_CDN_URLS } from './constants'
import { calculateContainerDimensions } from './utils/dimensions'
import { processTerminalOutputs } from './utils/text'

export async function generateHTML(
  outputs: TerminalOutput[],
  options: ConfigOptions,
  save: boolean = false,
): Promise<string> {
  const cdn = XTERM_CDN_URLS[options.cdn]
  const { combinedOutput, maxLineLength, lineCount } = processTerminalOutputs(outputs)
  const { width, height } = calculateContainerDimensions(outputs, options)

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.command}</title>
      <link rel="stylesheet" href="${cdn.css}">
      <style>
        body {
            margin: 0;
            padding: 0;
            background-color: ${options.theme.background};
            font-family: "${options.font.fontFamily}";
            font-size: ${options.font.fontSize}px;
            font-weight: ${options.font.fontWeight};
            line-height: ${options.font.lineHeight};
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
            background-color: ${options.theme.background};
            border-radius: ${options.border.borderRadius}px;
            border: ${options.border.borderWidth}px solid ${options.border.borderColor};
            overflow: hidden;
            box-shadow: ${options.boxShadow || 'none'};
            padding: ${options.padding || '0'};
            margin: ${options.margin || '0'};
            position: relative;
        }
        ${options.decoration
          ? `
        .window-decoration {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: ${DECORATION_BAR_HEIGHT}px;
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
            padding-top: ${options.decoration ? DECORATION_BAR_HEIGHT : '0'}px;
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
      </style>
  </head>
  <body>
      <div class="terminal-container">
          ${options.decoration
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

      <script src="${cdn.js}"></script>
      <script src="${cdn.fit}"></script>
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
              const themeConfig = ${JSON.stringify(options)};
              const term = new Terminal({
                  convertEol: true,
                  cursorBlink: true,
                  cursorStyle: 'block',
                  allowTransparency: true,
                  fontSize: themeConfig.font.fontSize,
                  fontFamily: themeConfig.font.fontFamily,
                  fontWeight: themeConfig.font.fontWeight,
                  lineHeight: themeConfig.font.lineHeight,
                  theme: ${JSON.stringify(options.theme)},
                  cols: ${maxLineLength},
                  rows: ${lineCount},
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
  </html>
  `

  if (save) {
    const path = join(options.cwd, options.html)
    await writeFile(path, html)
    p.log.success(c.green`HTML saved to ${options.html}`)
  }

  return html
}
