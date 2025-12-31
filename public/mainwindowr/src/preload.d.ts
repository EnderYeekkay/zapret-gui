// preload.d.ts

// import type { IpcRendererEvent } from 'electron' // Можно удалить или использовать инлайн

declare global {
  // Убрали "declare" перед const, теперь это корректно
  const mw: { 
    version: string
    closeWindow: () => void
    minimize: () => void
    uwu: () => void
    open_github: () => void
    save_logs: () => void
  }

  const zapret: {
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
  
  const tray_event: {
    // Используем инлайн-импорт типа
    onDisableToStop: (cb: (event: import('electron').IpcRendererEvent) => void) => void
    onRollbackToStop: (cb: (event: import('electron').IpcRendererEvent) => void) => void
    sendDisableToStop: () => void
    sendRollbackToStop: () => void
  }

  const logger: {
    log: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
  }

  const scheduler_api: {
    createTask: () => Promise<any>
    deleteTask: () => Promise<any>
    checkTask: () => Promise<boolean>
  }
}

// Эта строка делает файл модулем, что позволяет declare global работать
export {}; 
