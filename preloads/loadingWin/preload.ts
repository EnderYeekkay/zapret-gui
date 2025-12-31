import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { contextBridge, ipcRenderer } from 'electron';
import { log } from 'console';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

contextBridge.exposeInMainWorld('lw', {
    installationStart: (cb) => ipcRenderer.once('installationStart', cb),
    downloadInstallerProgress: (cb) => ipcRenderer.on('downloadInstallerProgress', (_, current, size) => cb(current, size)),
    installationFinish: (cb) => ipcRenderer.once('installationFinish', cb),
    uwu: () => ipcRenderer.send('lwuwu')
})