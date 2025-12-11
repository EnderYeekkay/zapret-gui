const {initMainLogger, initRendererLogger}= require('./modules/logger')
initMainLogger()
initRendererLogger()

const { ipcMain, webFrameMain, Tray, Menu, shell, Notification, nativeImage } = require('electron');
const { app, dialog, BrowserWindow, webFrame} = require('electron/main')
const path = require('node:path')
const fs = require('fs');
const updateZapret = require('./modules/updateZapret');
const { execSync, exec } = require('child_process')
const { version } = require(path.join(__dirname, 'package.json'))
const { createTask, deleteTask, checkTask } = require('./modules/scheduler.ts')
const { saveLogsArchive } = require('./modules/saveLogs.ts')
const myNotifcations = require('./modules/myNotifcations.ts')
const { setSettings, getSettings } = require('./modules/settings.ts')
const { debug, run_only_tray } = require('./modules/argsParser')
const { zapretTest } = require('./tests/zapretTest.ts')
const { initializeTray } = require('./modules/tray.ts')
const { warpFix }= require('./modules/warpFix.ts')
warpFix()

if (!app.requestSingleInstanceLock()) {
  app.once('ready', () => {
    dialog.showErrorBox('Ошибка удвоения', 'Нельзя запустить более одного Губорыла!')
    app.quit()
  })
}

if (process.platform !== 'win32') {
  throw new Error(`Это приложение работает только на Windows. Обнаружено: ${process.platform}`);
}

const l = console.log


const Zapret = require('./modules/Zapret');
const { EventEmitter } = require('node:stream');

if (debug) app.disableHardwareAcceleration() // Да ну нахуй эти VIDEO_SCHEDULER_INTERNAL_ERROR
app.whenReady().then(async () => {
  process.on('uncaughtException', (err) => {
    err.cause
    l(err.stack)
    myNotifcations.sendUENotify(err)
    if (!err.stack.includes('#CONTINUE_WORKING')) app.exit(1)
  })
  process.on('unhandledRejection', (err) => {
    l(err.stack)
    myNotifcations.sendURNotify(err)
  })

  ////////////////
  // LoadingWin //
  ////////////////
  const loadingWin = new BrowserWindow({
    width: 300,
    height: 350,
    frame: false,
    darkTheme: true,
    movable: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      devTools: false
    }
  })
  loadingWin.loadFile('./public/loadingWin/loadingWin.html')
  if (run_only_tray) loadingWin.hide()
  if (debug) {
    loadingWin.webContents.openDevTools({ mode: 'detach' }); // отдельное окно
  }
  //////////////
  // Core API //
  //////////////
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

  ipcMain.handle('zapret:install', async (_, strategy) => {
    const res = await zapret.install(strategy)
    if (!win.isVisible()) myNotifcations.sendServiceOnNotify()
    if (!res[0]) {
      myNotifcations.sendUENotify({stack: zapret.output})
      l(`Service installation went wrong: ${zapret.output}`)
    }
    return res
  })

  ipcMain.handle('zapret:remove', () => {
    return zapret.remove().then(() => {
      if (!win.isVisible()) myNotifcations.sendServiceOffNotify()
    })
  })
  ipcMain.handle('zapret:switchGameFilter', () => zapret.switchGameFilter())

  ipcMain.handle('zapret:uninstallCore', () => zapret.uninstallCore())
  ipcMain.handle('zapret:updateZapret', async () => {
    await updateZapret()
    zapret = new Zapret()
  })
  ipcMain.on('zapret:openCoreFolder', () => zapret.openCoreFolder())

  ipcMain.handle('scheduler:createTask', () => createTask())
  ipcMain.handle('scheduler:deleteTask', () => deleteTask())
  ipcMain.handle('scheduler:checkTask', () => checkTask())

  ipcMain.on('open_github', () => shell.openExternal('https://github.com/EnderYeekkay/Guboril'))
  // await zapretTest(zapret, 40)
  console.log(app.getPath('userData'))

  ////////////////
  // Mainwindow //
  ////////////////
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
        preload: path.join(__dirname, 'preload.js'),
        devTools: false,
    }
  })
  ipcMain.on('save_logs', () => saveLogsArchive(win))
  win.hide()

  ipcMain.once('uwu', async () => {
    l('Uwu!')
    initializeTray(win, zapret, path.resolve(__dirname, 'public'))
    if (!run_only_tray) {
      // setTimeout(() => win.show(), 5000) // Start at any cost!!!!1
      loadingWin.close()
      win.show()
    }
  })
  win.loadFile('./public/mainwindow/mainwindow.html')
  if (debug) {
    win.webContents.openDevTools({ mode: 'detach' }); // отдельное окно
  }

  app.on('activate', () => {
    
  })
  ipcMain.on('close-window', () => {
    win.hide()
  })
  ipcMain.on('minimize', () => {
    win.minimize()
  })

  if (run_only_tray) loadingWin.close()
})
