import type { ThemeConfig } from '../types'

export const BASE_THEME_OPTIONS: ThemeConfig = {
  font: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 400,
    lineHeight: 1.3,
  },
  border: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#424242',
  },
  boxShadow: '0 22px 70px 4px rgba(0,0,0,0.56)',
  padding: '16px',
  margin: '36px 52px 64px 52px',
}

export const BASE_THEME_OPTIONS_LIGHT: ThemeConfig = {
  ...BASE_THEME_OPTIONS,
  border: {
    ...BASE_THEME_OPTIONS.border,
    borderColor: '#AFAFAF',
  },
}
