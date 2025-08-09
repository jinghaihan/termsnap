export const XTERM_VERSION = '5.5.0'
export const XTERM_FIT_VERSION = '0.10.0'

export const XTERM_CDN_URLS = {
  jsdelivr: {
    js: `https://cdn.jsdelivr.net/npm/@xterm/xterm@${XTERM_VERSION}/lib/xterm.min.js`,
    css: `https://cdn.jsdelivr.net/npm/@xterm/xterm@${XTERM_VERSION}/css/xterm.min.css`,
    fit: `https://cdn.jsdelivr.net/npm/@xterm/addon-fit@${XTERM_FIT_VERSION}/lib/addon-fit.min.js`,
  },
  unpkg: {
    js: `https://unpkg.com/@xterm/xterm@${XTERM_VERSION}/lib/xterm.min.js`,
    css: `https://unpkg.com/@xterm/xterm@${XTERM_VERSION}/css/xterm.min.css`,
    fit: `https://unpkg.com/@xterm/addon-fit@${XTERM_FIT_VERSION}/lib/addon-fit.min.js`,
  },
} as const
