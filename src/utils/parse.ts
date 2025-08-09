export function parseSpacing(spacingStr: string): {
  horizontal: number
  vertical: number
  top: number
  right: number
  bottom: number
  left: number
} {
  if (!spacingStr || spacingStr === '0') {
    return { horizontal: 0, vertical: 0, top: 0, right: 0, bottom: 0, left: 0 }
  }

  // Remove 'px' and split by spaces
  const values = spacingStr.replace(/px/g, '').trim().split(/\s+/)

  if (values.length === 1) {
    // Single value: "16px" -> all sides
    const value = Number.parseInt(values[0]) || 0
    return {
      horizontal: value * 2,
      vertical: value * 2,
      top: value,
      right: value,
      bottom: value,
      left: value,
    }
  }
  else if (values.length === 2) {
    // Two values: "16px 32px" -> vertical horizontal
    const vertical = Number.parseInt(values[0]) || 0
    const horizontal = Number.parseInt(values[1]) || 0
    return {
      horizontal: horizontal * 2,
      vertical: vertical * 2,
      top: vertical,
      right: horizontal,
      bottom: vertical,
      left: horizontal,
    }
  }
  else if (values.length === 4) {
    // Four values: "16px 0 32px 16px" -> top right bottom left
    const top = Number.parseInt(values[0]) || 0
    const right = Number.parseInt(values[1]) || 0
    const bottom = Number.parseInt(values[2]) || 0
    const left = Number.parseInt(values[3]) || 0
    return {
      horizontal: left + right,
      vertical: top + bottom,
      top,
      right,
      bottom,
      left,
    }
  }
  else {
    // Fallback to 0
    return {
      horizontal: 0,
      vertical: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }
  }
}
