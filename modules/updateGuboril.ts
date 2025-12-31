import axios from "axios";
import pkg from '../package.json' with { type: "json" }; 
import { sendURNotify } from './myNotifcations.ts'
import { log } from 'console'
//@ts-ignore
import Zapret from "./Zapret.ts";
import { spawn } from "child_process";
import path from "path";
import { app, BrowserWindow, ipcMain } from "electron";
import fs from 'fs'
import { getSettings } from "./settings.ts";


const UpdateResponse = {
    Newest: 0,
    LinkFetchFailed: 1,
    DownloadFailed: 2,
    InstallerFailed: 3,
    Success: 4,
    NoConnection: 5
} as const
export type UpdateResponseType = typeof UpdateResponse[keyof typeof UpdateResponse]

export default async function execute(zapret: Zapret, loadingWin: BrowserWindow): Promise<UpdateResponseType> {
    if (!(await checkConnection())) return UpdateResponse.NoConnection
    if (!(zapret instanceof Zapret)) throw new Error('Parameter must be an instance of the Zapret class!')
    
    const installerPath = path.resolve(app.getPath('temp'), 'TempInstaller.exe')
    try {
        var { latestVersion, installerUrl } = await fetchLatestGuborilVersion()
    } catch (e) { sendURNotify(e); return UpdateResponse.LinkFetchFailed }
    
    if (!installerUrl) return UpdateResponse.LinkFetchFailed
    if (latestVersion == pkg.version) return UpdateResponse.Newest

    loadingWin.webContents.send('installationStart')
    try {
        await downloadInstaller(installerUrl, installerPath, loadingWin)
    } catch (e) { sendURNotify(e); return UpdateResponse.DownloadFailed }
    loadingWin.webContents.send('installationFinish')

    await zapret.remove()

    try {
        await new Promise((resolve, reject) => {
            spawn(installerPath, {
                detached: true
            })
            .once('spawn', () => resolve(true))
            .once('error', (err) => reject(err))
        })
    } catch (e) { sendURNotify(e); return UpdateResponse.InstallerFailed}
    return UpdateResponse.Success
}
export async function fetchLatestGuborilVersion() {
    const res = await axios.get('https://api.github.com/repos/EnderYeekkay/Guboril/releases/latest')
    let latestVersion: string = res.data.tag_name
    latestVersion = latestVersion.substring(latestVersion.indexOf('-v') + 2)
    const installerUrl: string = res.data?.assets[0]?.browser_download_url

    return { latestVersion, installerUrl }
}
async function downloadInstaller(installerUrl: string, installerPath: string, loadingWin: BrowserWindow) {
    const writer = fs.createWriteStream(installerPath)
    const headers = {}
    const token = getSettings()?.GH_TOKEN
    if (token) headers['Authorization'] = `token ${token}`

    const stream = await axios({
        method: 'get',
        url: installerUrl,
        responseType: 'stream',
        headers 
    })
    const size = Number(stream.headers["content-length"])
    let current = 0
    let lastTime = Date.now()
    const eventInterval = 300
    stream.data.on('data', (chunk: Buffer) => {
        let currentTime = Date.now()
        current += chunk.length
        if (currentTime - lastTime >= eventInterval || current == size) {
            console.log(current, ' from ', size)
            loadingWin.webContents.send('downloadInstallerProgress', current, size)
            lastTime = currentTime
        }
    })
    stream.data.pipe(writer)

    const res = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject('Time is out'), 2*60*1000)
        writer.on('error', () => {
            reject()
            clearTimeout(timeout)
        })
        writer.on('finish', () => {
            resolve(true)
            clearTimeout(timeout)
        })
    })
    return res
}

async function checkConnection(): Promise<boolean> {
  try {
    await axios.head('https://api.github.com', {
      timeout: 3000
    })
    return true
  } catch {
    return false
  }
}