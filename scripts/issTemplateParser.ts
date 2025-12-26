import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { log } from 'console'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJSONPath = path.resolve(__dirname, '../package.json')
const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath).toString())
const version: string = packageJSON.version

const rawPath = path.resolve(__dirname, '../modules/MakeInstallerRaw.iss')
const parsedPath = path.resolve(__dirname, '../modules/MakeInstaller.iss')

const raw: string = fs.readFileSync(rawPath).toString()
let parsed: string

parsed = raw
parsed = parsed.replace('%version%', `"${version}"`)
parsed = parsed.replace('%compression:prod%', `Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
LZMANumBlockThreads=32`)
parsed = parsed.replace('%compression:dev%', `Compression=none
SolidCompression=no`)
fs.writeFileSync(parsedPath, parsed)