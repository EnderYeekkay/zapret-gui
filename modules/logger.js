const fs = require('fs')
const path = require('path')
const { app, ipcMain } = require('electron')

const logDir = path.join(app.getPath('userData'), 'logs')
function initMainLogger({ keep = 5 } = {}) {
  const mainLogDir = path.join(logDir, 'main')

  if (!fs.existsSync(mainLogDir)) fs.mkdirSync(mainLogDir, { recursive: true })

  const mainLogFile = path.join(mainLogDir, `main-${Date.now()}.log`)

  // Чистим старые файлы
  try {
    const files = fs.readdirSync(mainLogDir)
      .map(name => {
        const p = path.join(mainLogDir, name)
        let stat
        try { stat = fs.statSync(p) } catch { return null }
        return { name, path: p, mtime: stat.mtimeMs }
      })
      .filter(Boolean)
      .filter(f => /^main-\d+\.log$/.test(f.name))
      .sort((a, b) => b.mtime - a.mtime)

    if (files.length >= keep) {
      files.slice(keep - 1).forEach(f => {
        try { fs.unlinkSync(f.path) } catch {}
      })
    }
  } catch {}

  // Перехватываем console
  ;['log', 'warn', 'error'].forEach(methodName => {
    const orig = console[methodName].bind(console)
    console[methodName] = (...args) => {
      try {
        const line = args.map(a => {
          if (typeof a === 'string') return a
          try { return JSON.stringify(a, null, 2) } catch { return String(a) }
        }).join(' ')
        fs.appendFileSync(mainLogFile, `[${new Date().toISOString()}] [${methodName}] ${line}\n`)
      } catch {}
      orig(...args) // обычный вывод в консоль
    }
  })
}
function initRendererLogger({ keep = 5 } = {}) {
  const logDir = path.join(app.getPath('userData'), 'logs', 'renderer')
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

  const logFile = path.join(logDir, `renderer-${Date.now()}.log`)

  // Очистка старых файлов, оставляем только keep последних
  try {
    const files = fs.readdirSync(logDir)
      .map(name => ({ name, path: path.join(logDir, name), mtime: fs.statSync(path.join(logDir, name)).mtimeMs }))
      .filter(f => /^renderer-\d+\.log$/.test(f.name))
      .sort((a, b) => b.mtime - a.mtime)

    if (files.length >= keep) {
      files.slice(keep - 1).forEach(f => {
        try { fs.unlinkSync(f.path) } catch {}
      })
    }
  } catch {}

  // Хэндлер для логов из renderer
  ipcMain.on('renderer-log', (event, level, ...args) => {
    try {
      const line = args.map(a => typeof a === 'string' ? a : JSON.stringify(a, null, 2)).join(' ')
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] [${level}] ${line}\n`)
    } catch {}
    // console[level](...args) // дублируем в main консоль
  })
}


module.exports = { initMainLogger, initRendererLogger }
