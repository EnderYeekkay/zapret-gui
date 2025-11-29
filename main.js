const { ipcMain, webFrameMain } = require('electron');
const { app, BrowserWindow, webFrame} = require('electron/main')
const path = require('node:path')
const fs = require('fs');
const updateZapret = require('./modules/updateZapret');
const {execSync, exec} = require('child_process')
/////////////////////////////
// Убрать мусор из консоли //
/////////////////////////////
process.stderr.write = (function(write) {
  return function(string, encoding, fd) {
    if (string.includes('Request Autofill')) return
    write.apply(process.stderr, arguments)
  }
})(process.stderr.write)

//////////////////////////////////
// Сохранение логов main в файл //
//////////////////////////////////
// Основная папка для логов
const logDir = path.join(app.getPath('userData'), 'logs')
// Подпапка для main
const mainLogDir = path.join(logDir, 'main')

if (!fs.existsSync(mainLogDir)) fs.mkdirSync(mainLogDir, { recursive: true })

// Имя файла по дате
const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
const mainLogFile = path.join(mainLogDir, `main-${today}.log`)

// Удаляем старые логи старше N дней
const DAYS_TO_KEEP = 7
fs.readdirSync(mainLogDir).forEach(file => {
  const filePath = path.join(mainLogDir, file)
  const stat = fs.statSync(filePath)
  const ageDays = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24)
  if (ageDays > DAYS_TO_KEEP) fs.unlinkSync(filePath)
})

// Обёртка для console
function wrapConsoleMethod(methodName, filePath) {
  const orig = console[methodName].bind(console)
  console[methodName] = (...args) => {
    try {
      const line = args.map(a => {
        if (typeof a === 'string') return a
        try {
          return JSON.stringify(a, null, 2)
        } catch {
          return String(a)
        }
      }).join(' ')
      fs.appendFileSync(filePath, `[${new Date().toISOString()}] [${methodName}] ${line}\n`)
    } catch (e) {}
    orig(...args)
  }
}

wrapConsoleMethod('log', mainLogFile)
wrapConsoleMethod('warn', mainLogFile)
wrapConsoleMethod('error', mainLogFile)

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
  ipcMain.once('uwu', () => win.show())
  win.loadFile('./public/mainwindow/mainwindow.html')
  win.webContents.openDevTools({ mode: 'detach' }); // отдельное окно
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