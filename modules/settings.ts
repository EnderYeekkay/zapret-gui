import { app } from 'electron/main';
import path from 'path'
import fs from 'fs'
type Settings = {
    gameFilter: boolean
    autoUpdate: boolean
    zapretVersion: string
    selectedStrategyNum: number
    GH_TOKEN: null | string
    notifications: boolean
}
const settingsPath = path.join(app.getPath('userData'), 'settings.json')
let settings = {}
if (!fs.existsSync(settingsPath)) {
  let defaultSettings: Settings = {
    gameFilter: false,
    autoUpdate: false,
    zapretVersion: '0',
    selectedStrategyNum: 8,
    notifications: true,
    GH_TOKEN: null
  }
  fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings))
}
settings = JSON.parse(fs.readFileSync(settingsPath).toString())

export function getSettings(): Settings {
  return JSON.parse(fs.readFileSync(settingsPath).toString())
}

export function setSettings(data: Settings) {
    let old_settings = getSettings()
    let new_settings = {...old_settings, ...data}
    fs.writeFileSync(settingsPath, JSON.stringify(new_settings))
}