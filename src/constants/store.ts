import { join } from 'pathe'
import { PACKAGE_ROOT } from './env'

export const BINARY_STORAGE_DIR = join(PACKAGE_ROOT, './binaries')

export const THEME_CACHE_DIR = join(PACKAGE_ROOT, './.theme-cache')
