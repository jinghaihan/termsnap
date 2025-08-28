import { SerializeAddon } from '@xterm/addon-serialize'
import xterm from '@xterm/headless'

export async function getTerminalOutput(ansi: string): Promise<string> {
  return new Promise((resolve) => {
    const terminal = new xterm.Terminal({
      allowProposedApi: true,
    })

    const serializeAddon = new SerializeAddon()
    terminal.loadAddon(serializeAddon)

    terminal.write(ansi, () => {
      const ansi = serializeAddon.serialize()
      terminal.dispose()
      resolve(ansi)
    })
  })
}
