import os from 'node:os'
import { join } from 'pathe'

export const BINARY_STORAGE_DIR = join(os.tmpdir(), 'termsnap', './binaries')

export const THEME_CACHE_DIR = join(os.tmpdir(), 'termsnap', 'theme')
