import { app } from 'electron'
import pkg from '../package.json' with { type: 'json' }
const { version } = pkg
import afterInstall from '../scripts/afterInstall.ts'
import beforeUninstall from '../scripts/beforeUninstall.ts'

// --help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
\x1b[30;42m  Guboril v${version}  \x1b[0m
GUI для Service.bat
    -i,  --insect               Включить DevTools хрома для основного окна
    -v,  --version              Увидеть текущую версию Guboril
    -t,  --tray                 Запуск Guboril только в трее
    -ai, --after_installation   Инициализация CLI в регистре и другие действия, выполняемые при первом запуске
    -bu, --before_uninstall     Удаление записи из регистра и другие действия, выполняемые при удалении
\x1b[38;5;215mIs the text looking weird? Use chcp 65001 to fix Cyrillic display.\x1b[0m
  `)
  process.exit(0)
}

// --version
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(`Version: v${version}`)
  process.exit(0)
}

// --inspect
export const debug = process.argv.includes('--inspect') || process.argv.includes('-i')
if (debug) console.log('App is running in debug mod')

// --tray
export const run_only_tray = process.argv.includes('--tray') || process.argv.includes('-t')

// --after_installation
if (process.argv.includes('-ai') || process.argv.includes('--after_installation')) {
  afterInstall()
  process.exit(0)
}

// --before_uninstall
if (process.argv.includes('-bu') || process.argv.includes('--before_uninstall')) {
  beforeUninstall()
  process.exit(0)
}

console.log('ARGV: ' + process.argv.slice(1))
