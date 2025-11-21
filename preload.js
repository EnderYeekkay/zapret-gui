const path = require('path');
const { version } = require(path.join(__dirname, 'package.json'))
const {contextBridge, ipcRenderer} = require('electron')
contextBridge.exposeInMainWorld('mw', {
  version: version,
  closeWindow: () => ipcRenderer.send('close-window'),
  minimize: () => ipcRenderer.send('minimize'),
})

contextBridge.exposeInMainWorld('zapret', {
  checkStatus: () => ipcRenderer.invoke('zapret:checkStatus'),
  remove: () => ipcRenderer.send('zapret:remove'),
  getAllStrategies: () => ipcRenderer.invoke('zapret:getAllStrategies'),
  getSettings: () => ipcRenderer.invoke('zapret:getSettings'),
  setSettings: () => ipcRenderer.send('zapret:setSettings'),
  getData: () => ipcRenderer.invoke('zapret:getData')
})