import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
import pkgJson from '../../package.json'

export const DEV_MODE = process.env.NODE_ENV === 'development'

export const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../')

export const NAME = pkgJson.name

export const VERSION = pkgJson.version
