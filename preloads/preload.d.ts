// preload.d.ts

import type { IpcRendererEvent } from 'electron'

declare let mw: {
  version: string
  closeWindow: () => void
  minimize: () => void
  uwu: () => void
  open_github: () => void
  save_logs: () => void
}

declare let zapret: {
  checkStatus: () => Promise<any>
  remove: () => Promise<any>
  install: (strategy: string) => Promise<any>
  switchGameFilter: () => Promise<any>
  getData: () => Promise<any>
  getAllStrategies: () => Promise<string[]>

  getLatestVersion: () => Promise<string>
  fetchLatestVersion: () => Promise<string>
  updateZapret: () => Promise<any>
  uninstallCore: () => Promise<any>

  getSettings: () => Promise<any>
  setSettings: (settings: any) => void
  openCoreFolder: () => void
}

declare let tray_event: {
  onDisableToStop: (cb: (event: IpcRendererEvent) => void) => void
  onRollbackToStop: (cb: (event: IpcRendererEvent) => void) => void

  sendDisableToStop: () => void
  sendRollbackToStop: () => void
}

declare let logger: {
  log: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

declare let scheduler_api: {
  createTask: () => Promise<any>
  deleteTask: () => Promise<any>
  checkTask: () => Promise<boolean>
}
