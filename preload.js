const path = require('path');
const { version } = require(path.join(__dirname, 'package.json'))
const {contextBridge, ipcRenderer} = require('electron')
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
  getAllStrategies: () => ipcRenderer.invoke('zapret:getAllStrategies'),
  getSettings: () => ipcRenderer.invoke('zapret:getSettings'),
  setSettings: (settings) => ipcRenderer.send('zapret:setSettings', settings),
  getData: () => ipcRenderer.invoke('zapret:getData')
})