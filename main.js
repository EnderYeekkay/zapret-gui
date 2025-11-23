const { ipcMain, webFrameMain } = require('electron');
const { app, BrowserWindow, webFrame} = require('electron/main')
const path = require('node:path')
const fs = require('fs');
const { spawn } = require('child_process')
const l = console.log
const updateZapret = require('./modules/updateZapret');
const { ChildProcess } = require('node:child_process');
const Zapret = require('./modules/Zapret');

const settingsPath = path.join(app.getPath('userData'), 'settings.json')
let settings = {}
if (!fs.existsSync(settingsPath)) {
  let defaultSettings = {
    gameFilter: false,
    autoLoad: false,
    autoUpdate: false,
    zapretVersion: '0',
    selectedStrategyNum: 0
  }
  fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings))
}
settings = JSON.parse(fs.readFileSync(settingsPath))

app.whenReady().then(async () => {
  if (!Zapret.isInstalled()) await updateZapret()
  const zapret = new Zapret()
  ipcMain.handle('zapret:checkStatus', () => zapret.checkStatus())
  ipcMain.handle('zapret:getAllStrategies', () => zapret.getAllStrategies())
  ipcMain.handle('zapret:getSettings', () => JSON.parse(fs.readFileSync(settingsPath)))
  ipcMain.handle('zapret:remove', () => zapret.remove())
  ipcMain.handle('zapret:install', (event, strategy) => zapret.install(strategy))
  ipcMain.on('zapret:setSettings', (event, data) => {
    let old_settings = JSON.parse(fs.readFileSync(settingsPath))
    let new_settings = {...old_settings, ...data}
    fs.writeFileSync(settingsPath, JSON.stringify(new_settings))
  })
  ipcMain.handle('zapret:getData', () => zapret.getData())
  // await zapretTest(zapret, 40)

  console.log(app.getPath('userData'))
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
    let n = getRandomInt(5)
    if (n == 0) await zapret.getAllStrategies()
    if (n == 1) await zapret.checkStatus()
    if (n == 2) await zapret.getData()
    if (n == 3) await zapret.install(7)
    if (n == 4) await zapret.remove()
  }
  l(`======================= {Test Passed (${Math.round((Date.now() - startTime)/1000)}s)} =======================`)
}
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}