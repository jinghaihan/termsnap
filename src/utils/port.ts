export async function waitPort(
  port: number,
  options: { timeoutMs?: number, open?: boolean } = {},
) {
  const open = options.open ?? true
  const timeoutMs = options.timeoutMs ?? (open ? 2000 : 3000)
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(`http://localhost:${port}`)
      if (open)
        return true
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    catch {
      if (!open)
        return true
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return false
}
