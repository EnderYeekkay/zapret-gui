require('dotenv').config()
const { ipcMain, webFrameMain } = require('electron');
const { app, BrowserWindow, webFrame} = require('electron/main')
const path = require('node:path')
const fs = require('fs');
const updateZapret = require('./modules/updateZapret');
const {execSync, exec} = require('child_process')
const { version } = require(path.join(__dirname, 'package.json'))

// Парсинг аргументов
console.log('ARGV: ' + process.argv)
let debug = process.argv.includes('--inspect') || process.argv.includes('-i')
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(`Version: v${version}`)
  app.quit()
}
if (process.argv.includes('--tray') || process.argv.includes('-t'))
{

}
if (process.platform !== 'win32') {
  throw new Error(`Это приложение работает только на Windows. Обнаружено: ${process.platform}`);
}

/////////////////////////////
// Убрать мусор из консоли //
/////////////////////////////
// process.stderr.write = (function(write) {
//   return function(string, encoding, fd) {
//     if (string.includes('Request Autofill')) return
//     write.apply(process.stderr, arguments)
//   }
// })(process.stderr.write)
//////////////////////////////////
// Сохранение логов main в файл //
//////////////////////////////////
const {initMainLogger, initRendererLogger}= require('./modules/logger')
initMainLogger()
initRendererLogger()
const l = console.log


const Zapret = require('./modules/Zapret');

/**
    @typedef {{
        gameFilter: boolean,
        autoLoad: boolean,
        autoUpdate: boolean,
        zapretVersion: string,
        selectedStrategyNum: number
    }} Settings
*/
const settingsPath = path.join(app.getPath('userData'), 'settings.json')
let settings = {}
if (!fs.existsSync(settingsPath)) {
  let defaultSettings = {
    gameFilter: false,
    autoLoad: false,
    autoUpdate: false,
    zapretVersion: '0',
    selectedStrategyNum: 0,
    GH_TOKEN: null
  }
  fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings))
}
settings = JSON.parse(fs.readFileSync(settingsPath))

/**
 * 
 * @returns { Settings }
 */
function getSettings() {
  return JSON.parse(fs.readFileSync(settingsPath))
}
/**
 * 
 * @param { Settings } data 
 */
function setSettings(data) {
    let old_settings = getSettings()
    let new_settings = {...old_settings, ...data}
    fs.writeFileSync(settingsPath, JSON.stringify(new_settings))
}


app.whenReady().then(async () => {
  const loadingWin = new BrowserWindow({
    width: 300,
    height: 350,
    frame: false,
    darkTheme: true,
    movable: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
  })
  loadingWin.loadFile('./public/loadingWin/loadingWin.html')
  if (debug == 1) {
    loadingWin.webContents.openDevTools({ mode: 'detach' }); // отдельное окно
  }
  // if (warpFix.checkWarp()) warpFix.addToExcludedHostsList()
  const warpPath = "C:\\Program Files\\Cloudflare\\Cloudflare WARP\\warp-cli.exe"
  if (fs.existsSync(warpPath)) {
    if (`"${warpPath}" tunnel host add "api.github.com"`) {
      l('WarpFix is already installed')
    } else {
      execSync(`"${warpPath}" tunnel host add "api.github.com"`)
      execSync('sc stop "CloudflareWARP"')
      setTimeout(() => exec('sc start "CloudflareWARP"'), 2000)
      l('WarpFix has been installed.')
    }
  }
  
  if (!Zapret.isInstalled()) await updateZapret()
  let zapret = new Zapret()
  const latestVersion = await zapret.getLatestVersion()
  ipcMain.handle('zapret:checkStatus', () => zapret.checkStatus())
  ipcMain.handle('zapret:getAllStrategies', () => zapret.getAllStrategies())
  ipcMain.handle('zapret:getData', () => zapret.getData())

  ipcMain.handle('zapret:getLatestVersion', () => latestVersion)
  ipcMain.handle('zapret:fetchLatestVersion', async () => {
    let lv = '0'
    if (getSettings().autoUpdate) lv = await zapret.getLatestVersion()
    return latestVersion = lv
  })

  ipcMain.handle('zapret:getSettings', () => getSettings())
  ipcMain.on('zapret:setSettings', (_, data) => setSettings(data))
  ipcMain.handle('zapret:rendererLog', () => {})

  ipcMain.handle('zapret:install', (_, strategy) => zapret.install(strategy))
  ipcMain.handle('zapret:remove', () => zapret.remove())
  ipcMain.handle('zapret:switchGameFilter', () => zapret.switchGameFilter())

  ipcMain.handle('zapret:uninstallCore', () => zapret.uninstallCore())
  ipcMain.handle('zapret:updateZapret', async () => {
    await updateZapret()
    zapret = new Zapret()
  })
  ipcMain.on('zapret:openCoreFolder', () => zapret.openCoreFolder())

  // await zapretTest(zapret, 40)
  console.log(app.getPath('userData'))
  if (zapret.getS) {

  }
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    darkTheme: true,
    movable: true,
    resizable: false,
    title: 'Губорыл',
    
    icon: path.join(__dirname, 'public', 'icon.ico'),
    webPreferences: {
        sandbox: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
    }
  })

  win.hide()
  setTimeout(() => win.show(), 5000) // Start at any cost!!!!1
  ipcMain.once('uwu', () => {
    loadingWin.close()
    win.show()
  })
  win.loadFile('./public/mainwindow/mainwindow.html')
  if (debug == 1) {
    win.webContents.openDevTools({ mode: 'detach' }); // отдельное окно
  }
  app.on('activate', () => {
    
  })
  ipcMain.on('close-window', () => {
    app.quit()
  })
  ipcMain.on('minimize', () => {
    win.minimize()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * 
 * @param {Zapret} zapret 
 * @param {number} iterations
 */
async function zapretTest(zapret, iterations = 20) {
  let startTime = Date.now()
  for (let i = 0; i < iterations; i++) {
    l(`======================= {Iteration: ${i+1}} =======================`)
    let n = getRandomInt(6)
    if (n == 0) await zapret.getAllStrategies()
    if (n == 1) await zapret.checkStatus()
    if (n == 2) await zapret.getData()
    if (n == 3) await zapret.install(7)
    if (n == 4) await zapret.remove()
    if (n == 5) await zapret.switchGameFilter()
  }
  l(`======================= {Test Passed (${Math.round((Date.now() - startTime)/1000)}s)} =======================`)
}
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}