const { ipcMain } = require('electron');
const { app, BrowserWindow } = require('electron/main')
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
    zapretVersion: '0'
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
  ipcMain.on('zapret:setSettings', (data) => {
    JSON.parse(data)
    fs.writeFileSync(settingsPath, data)
  })
  ipcMain.handle('zapret:getData', () => zapret.getData())
  // await zapretTest(zapret)

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
    zapret.write('0\n')
  }
})

/**
 * 
 * @param {Zapret} zapret 
 * @param {number} iterations
 */
async function zapretTest(zapret, iterations = 20) {
  for (let i = 0; i < iterations; i++) {
    l(`======================= {Iteration: ${i}} =======================`)
    let n = getRandomInt(2)
    if (n == 0) await zapret.getAllStrategies()
    if (n == 1) await zapret.checkStatus()
  }
  l('======================= {Test Passed} =======================')
}
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}