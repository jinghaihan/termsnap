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
        :root {
          --ansi-dim-opacity: 1;
          --ansi-black: ${options.theme.black};
          --ansi-red: ${options.theme.red};
          --ansi-green: ${options.theme.green};
          --ansi-yellow: ${options.theme.yellow};
          --ansi-blue: ${options.theme.blue};
          --ansi-magenta: ${options.theme.magenta};
          --ansi-cyan: ${options.theme.cyan};
          --ansi-white: ${options.theme.white};
          --ansi-bright-black: ${options.theme.brightBlack};
          --ansi-bright-red: ${options.theme.brightRed};
          --ansi-bright-green: ${options.theme.brightGreen};
          --ansi-bright-yellow: ${options.theme.brightYellow};
          --ansi-bright-blue: ${options.theme.brightBlue};
          --ansi-bright-magenta: ${options.theme.brightMagenta};
          --ansi-bright-cyan: ${options.theme.brightCyan};
          --ansi-bright-white: ${options.theme.brightWhite};
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

export async function generateAnimatedHTML(interactions: TerminalInteraction[], options: ConfigOptions, save: boolean = false) {
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
            if (loop) {
              index = 0
              setTimeout(updateTerminalContent, loop)
            }
          }
        }
      }

      if (snapshots.length > 0) {
        dom.innerHTML = snapshots[0].html
        index = 1

        if (snapshots.length > 1) {
          const delay = snapshots[1].timestamp - snapshots[0].timestamp
          setTimeout(updateTerminalContent, delay)
        }
      }
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
