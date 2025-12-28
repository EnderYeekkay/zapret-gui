import { execSync, exec } from 'child_process';
import { initMainLogger, initRendererLogger } from './modules/logger.js';
initMainLogger()
initRendererLogger()
import update, { fetchLatestGuborilVersion } from './modules/updateGuboril.ts'
import { ipcMain, nativeImage, shell } from 'electron';
import { app, dialog, BrowserWindow } from 'electron/main';
import { join, resolve, dirname } from 'node:path';
import fs from 'fs';
import updateZapret from './modules/updateZapret.js';
import pkg from './package.json' with { type: 'json' };
const { version } = pkg;
import { createTask, deleteTask, checkTask } from './modules/scheduler.ts';
import { saveLogsArchive } from './modules/saveLogs.ts';
import { sendUENotify, sendURNotify, sendServiceOnNotify, sendServiceOffNotify } from './modules/myNotifcations.ts';
import { setSettings, getSettings } from './modules/settings.ts';
import { debug, run_only_tray } from './modules/argsParser.js';
// const { zapretTest } = require('./tests/zapretTest.ts')
import { initializeTray } from './modules/tray.ts';
import { warpFix } from './modules/warpFix.ts';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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


import Zapret from './modules/Zapret.ts';
import { EventEmitter } from 'events'
if (debug) app.disableHardwareAcceleration() // Да ну нахуй эти VIDEO_SCHEDULER_INTERNAL_ERROR
app.whenReady().then(async () => {
  process.on('uncaughtException', (err) => {
    err.cause
    l(err.stack)
    sendUENotify(err)
    if (!err.stack.includes('#CONTINUE_WORKING')) app.exit(1)
  })
  process.on('unhandledRejection', (err) => {
    l(err.stack)
    sendURNotify(err)
  })
  if (!Zapret.isInstalled()) await updateZapret()
  let zapret = new Zapret()

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
      sandbox: false,
      preload: resolve('preloads/preload_loadingWin.ts')
    }
  })
  loadingWin.loadFile('./public/loadingWin/loadingWin.html')
  await new Promise((resolve, _) => ipcMain.on('lwuwu', resolve()))
  if (debug) {
    loadingWin.webContents.openDevTools({ mode: 'detach' }); // отдельное окно
  }
  if (getSettings().autoUpdate) {
    const { latestVersion, installerUrl } = await fetchLatestGuborilVersion()
    if (latestVersion != version) {
      const res = dialog.showMessageBoxSync(loadingWin, {
        title: `Доступна новая версия ${latestVersion}`,
        detail: `Текущая версия: ${version}. Вы хотите обновить приложение Guboril?`,
        buttons: ['Обновить', 'Не обновлять'],
        icon: nativeImage.createFromPath(resolve(__dirname, 'public/icon.ico')),
        defaultId: 0,
        cancelId: 1
      })
      if (res == 0) {
        try {
          if ((await update(zapret, loadingWin)) == 4) {
            app.quit()
          }
        } catch (e) {
          sendURNotify(e)
        }
      }
    }
  }

  if (run_only_tray) loadingWin.hide()

  //////////////
  // Core API //
  //////////////
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
    if (!win.isVisible()) sendServiceOnNotify()
    if (!res[0]) {
      sendUENotify({stack: zapret.output})
      l(`Service installation went wrong: ${zapret.output}`)
    }
    return res
  })

  ipcMain.handle('zapret:remove', () => {
    return zapret.remove().then(() => {
      if (!win.isVisible()) sendServiceOffNotify()
    })
  })
  ipcMain.handle('zapret:switchGameFilter', () => zapret.switchGameFilter())

  ipcMain.handle('zapret:uninstallCore', () => zapret.uninstallCore())
  ipcMain.handle('zapret:updateZapret', async () => {
    await zapret.remove()
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
    
    icon: join(__dirname, 'public', 'icon.ico'),
    webPreferences: {
        sandbox: false,
        contextIsolation: true,
        preload: join(__dirname, 'preloads/preload.ts')
    }
  })
  ipcMain.on('save_logs', () => saveLogsArchive(win))
  win.hide()

  ipcMain.once('uwu', async () => {
    l('Uwu!')
    initializeTray(win, zapret, resolve(__dirname, 'public'))
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
