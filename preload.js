const path = require('path');
const { version } = require(path.join(__dirname, 'package.json'))
const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('mw', {
  version: version,
  closeWindow: () => ipcRenderer.send('close-window'),
  minimize: () => ipcRenderer.send('minimize'),
  uwu: () => ipcRenderer.send('uwu')
})

contextBridge.exposeInMainWorld('zapret', {
  checkStatus: () => ipcRenderer.invoke('zapret:checkStatus'),
  remove: () => ipcRenderer.invoke('zapret:remove'),
  install: (strategy) => ipcRenderer.invoke('zapret:install', strategy),
  switchGameFilter: () => ipcRenderer.invoke('zapret:switchGameFilter'),
  getData: () => ipcRenderer.invoke('zapret:getData'),
  getAllStrategies: () => ipcRenderer.invoke('zapret:getAllStrategies'),

  getLatestVersion: () => ipcRenderer.invoke('zapret:getLatestVersion'),
  fetchLatestVersion: () => ipcRenderer.invoke('zapret:fetchLatestVersion'),
  updateZapret: () => ipcRenderer.invoke('zapret:updateZapret'),
  uninstallCore: () => ipcRenderer.invoke('zapret:uninstallCore'),

  getSettings: () => ipcRenderer.invoke('zapret:getSettings'),
  setSettings: (settings) => ipcRenderer.send('zapret:setSettings', settings),
  openCoreFolder: () => ipcRenderer.send('zapret:openCoreFolder')
  
})

contextBridge.exposeInMainWorld('logger', {
  log: (...args) => ipcRenderer.send('renderer-log', 'log', ...args),
  warn: (...args) => ipcRenderer.send('renderer-log', 'warn', ...args),
  error: (...args) => ipcRenderer.send('renderer-log', 'error', ...args)
})
