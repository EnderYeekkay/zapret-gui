const path = require('path');
const { version } = require(path.join(__dirname, 'package.json'))
const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('mw', {
  version: version,
  closeWindow: () => ipcRenderer.send('close-window'),
  minimize: () => ipcRenderer.send('minimize')
})