import type { ThemeConfig } from '../types'

export const DARK_BORDER_COLOR = '#515151'
export const LIGHT_BORDER_COLOR = '#e0e0e0'

export const DARK_BOX_SHADOW = '0 0 10px 0 rgba(0, 0, 0, 0.5)'
export const LIGHT_BOX_SHADOW = '0 0 10px 0 rgba(0, 0, 0, 0.1)'

export const BASE_THEME_OPTIONS: ThemeConfig = {
  font: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 400,
    lineHeight: 1,
  },
  border: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DARK_BORDER_COLOR,
  },
  boxShadow: DARK_BOX_SHADOW,
  padding: '16px 0 16px 16px',
  margin: '0',
}

export const BASE_THEME_OPTIONS_LIGHT: ThemeConfig = {
  ...BASE_THEME_OPTIONS,
  border: {
    ...BASE_THEME_OPTIONS.border,
    borderColor: LIGHT_BORDER_COLOR,
  },
  boxShadow: LIGHT_BOX_SHADOW,
}
