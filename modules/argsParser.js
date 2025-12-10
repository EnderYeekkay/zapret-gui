const {app} = require('electron')

const {version} = require('../package.json')
console.log('ARGV: ' + process.argv)

// --inspect
const debug = process.argv.includes('--inspect') || process.argv.includes('-i')
if (debug) console.log('App is running in debug mod')

// --version
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(`Version: v${version}`)
  app.quit()
}
// --tray
const run_only_tray = process.argv.includes('--tray') || process.argv.includes('-t')

module.exports = { debug, run_only_tray }
