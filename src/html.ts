import type { ConfigOptions, TerminalInteraction, TerminalSnapshot } from './types'
import { writeFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import c from 'ansis'
import { join } from 'pathe'
import { DECORATION_BAR_HEIGHT } from './constants'
import { processAnimationFrames } from './utils/process'

interface GenerateHTMLDocOptions {
  content?: string
  script?: string
  height?: number
  width?: number
}

function generateHTMLDoc(options: ConfigOptions, props: GenerateHTMLDocOptions) {
  const { content = '', script, height, width } = props

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.command}</title>
      <style>
        .ansi-black-fg {
          color: ${options.theme.black};
        }
        .ansi-red-fg {
          color: ${options.theme.red};
        }
        .ansi-green-fg {
          color: ${options.theme.green};
        }
        .ansi-yellow-fg {
          color: ${options.theme.yellow};
        }
        .ansi-blue-fg {
          color: ${options.theme.blue};
        }
        .ansi-magenta-fg {
          color: ${options.theme.magenta};
        }
        .ansi-cyan-fg {
          color: ${options.theme.cyan};
        }
        .ansi-white-fg {
          color: ${options.theme.white};
        }
        .ansi-bright-black-fg {
          color: ${options.theme.brightBlack};
        }
        .ansi-bright-red-fg {
          color: ${options.theme.brightRed};
        }
        .ansi-bright-green-fg {
          color: ${options.theme.brightGreen};
        }
        .ansi-bright-yellow-fg {
          color: ${options.theme.brightYellow};
        }
        .ansi-bright-blue-fg {
          color: ${options.theme.brightBlue};
        }
        .ansi-bright-magenta-fg {
          color: ${options.theme.brightMagenta};
        }
        .ansi-bright-cyan-fg {
          color: ${options.theme.brightCyan};
        }
        .ansi-bright-white-fg {
          color: ${options.theme.brightWhite};
        }
        .ansi-black-bg {
          background-color: ${options.theme.black};
        }
        .ansi-red-bg {
          background-color: ${options.theme.red};
        }
        .ansi-green-bg {
          background-color: ${options.theme.green};
        }
        .ansi-yellow-bg {
          background-color: ${options.theme.yellow};
        }
        .ansi-blue-bg {
          background-color: ${options.theme.blue};
        }
        .ansi-magenta-bg {
          background-color: ${options.theme.magenta};
        }
        .ansi-cyan-bg {
          background-color: ${options.theme.cyan};
        }
        .ansi-white-bg {
          background-color: ${options.theme.white};
        }
        .ansi-bright-black-bg {
          background-color: ${options.theme.brightBlack};
        }
        .ansi-bright-red-bg {
          background-color: ${options.theme.brightRed};
        }
        .ansi-bright-green-bg {
          background-color: ${options.theme.brightGreen};
        }
        .ansi-bright-yellow-bg {
          background-color: ${options.theme.brightYellow};
        }
        .ansi-bright-blue-bg {
          background-color: ${options.theme.brightBlue};
        }
        .ansi-bright-magenta-bg {
          background-color: ${options.theme.brightMagenta};
        }
        .ansi-bright-cyan-bg {
          background-color: ${options.theme.brightCyan};
        }
        .ansi-bright-white-bg {
          background-color: ${options.theme.brightWhite};
        }
        body {
          margin: 0;
          padding: 0;
          color: ${options.theme.foreground};
          background-color: ${options.theme.background};
          font-family: "${options.font.fontFamily}";
          font-size: ${options.font.fontSize}px;
          font-weight: ${options.font.fontWeight};
          line-height: ${options.font.lineHeight};
          min-height: 100vh;
          width: 100vw;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: auto;
        }
        .terminal-container {
          width: ${width ? `${width}px` : 'auto'};
          height: ${height ? `${height}px` : 'auto'};
          font-family: ${options.font.fontFamily};
          font-size: ${options.font.fontSize}px;
          font-weight: ${options.font.fontWeight};
          line-height: ${options.font.lineHeight};
          background-color: ${options.theme.background};
          border-radius: ${options.border.borderRadius}px;
          border: ${options.border.borderWidth}px solid ${options.border.borderColor};
          box-shadow: ${options.boxShadow || 'none'};
          padding: ${options.padding || '0'};
          margin: ${options.margin || '0'};
          box-sizing: border-box;
          position: relative;
        }
        .terminal-line {
          font-size: ${options.font.fontSize}px;
          line-height: ${options.font.lineHeight};
          white-space: pre;
        }
        ${options.decoration
          ? `.window-decoration {
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
          padding-top: ${options.decoration ? DECORATION_BAR_HEIGHT : '0'}px;
        }`
          : ``}
      </style>
      ${script ? `<script>${script}</script>` : ''}
  </head>
  <body>
    <div class="terminal-container">
      ${options.decoration
        ? `<div class="window-decoration">
        <div class="window-buttons">
          <button class="window-button close" title="Close"></button>
          <button class="window-button minimize" title="Minimize"></button>
          <button class="window-button maximize" title="Maximize"></button>
        </div>
      </div>`
        : ''}
      <div id="terminal-content" class="terminal-content">
        ${content}
      </div>
    </div>
  </body>
  </html>
  `
}

async function saveHTML(html: string, options: ConfigOptions) {
  const path = join(options.cwd, options.html)
  await writeFile(path, html)
  p.log.success(c.green`HTML saved to ${options.html}`)
}

export async function generateHTML(snapshot: TerminalSnapshot, options: ConfigOptions, save: boolean = false): Promise<string> {
  const html = generateHTMLDoc(options, {
    content: snapshot.html,
    height: options.height,
    width: options.width,
  })
  if (save) {
    await saveHTML(html, options)
  }
  return html
}

export async function generateAnimatedHTML(interactions: TerminalInteraction[], options: ConfigOptions, save: boolean = false, wait: boolean = false) {
  const snapshots = await processAnimationFrames(interactions, options)
  const script = `
    document.addEventListener('DOMContentLoaded', function() {
      const loop = ${options.loop}
      const dom = document.getElementById('terminal-content')
      const snapshots = ${JSON.stringify(snapshots)}

      let index = 0

      function updateTerminalContent() {
        if (index < snapshots.length) {
          const snapshot = snapshots[index]
          dom.innerHTML = snapshot.html
          index++

          // Schedule next update based on timestamp difference
          if (index < snapshots.length) {
            const next = snapshots[index]
            const delay = next.timestamp - snapshot.timestamp
            setTimeout(updateTerminalContent, delay)
          } else {
            if (window.onAnimationDone) {
              window.onAnimationDone()
            }
            if (loop) {
              index = 0
              setTimeout(updateTerminalContent, loop)
            }
          }
        }
      }

      function onAnimationStart() {
        if (snapshots.length > 0) {
          dom.innerHTML = snapshots[0].html
          index = 1

          if (snapshots.length > 1) {
            const delay = snapshots[1].timestamp - snapshots[0].timestamp
            setTimeout(updateTerminalContent, delay)
          }
        }
      }
      window.onAnimationStart = onAnimationStart
      ${wait ? '' : 'onAnimationStart()'}
    })
  `

  const lastSnapshot = snapshots[snapshots.length - 1]
  const html = generateHTMLDoc(options, {
    script,
    height: options.height || lastSnapshot.height,
    width: options.width || lastSnapshot.width,
  })
  if (save) {
    await saveHTML(html, {
      ...options,
      html: options.replay,
    })
  }
  return html
}

export function getPureTerminalOptions(options: ConfigOptions): ConfigOptions {
  return {
    ...options,
    border: {
      borderRadius: 0,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    boxShadow: 'none',
    margin: '0',
  }
}
