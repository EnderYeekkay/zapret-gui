import { app } from 'electron'
import pkg from '../package.json' with { type: 'json' }

const { version } = pkg

console.log('ARGV: ' + process.argv)

// --inspect
export const debug = process.argv.includes('--inspect') || process.argv.includes('-i')
if (debug) console.log('App is running in debug mod')

// --version
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(`Version: v${version}`)
  app.quit()
}
// --tray
export const run_only_tray = process.argv.includes('--tray') || process.argv.includes('-t')


