import axios from "axios";
import pkg from '../package.json' with { type: "json" }; 

import { log } from 'console'
//@ts-ignore
import Zapret from "./Zapret.ts";
import { spawn } from "child_process";
import path from "path";
import { app, ipcMain } from "electron";
import fs from 'fs'


const UpdateResponse = { Newest: 0, LinkFetchFailed: 1}
export default async function execute(zapret: Zapret): Promise<number | 0 | 1> {
    if (!(zapret instanceof Zapret)) throw new Error('Parameter must be an instance of the Zapret class!')
    const res = await axios.get('https://api.github.com/repos/EnderYeekkay/Guboril/releases/latest')
    const latestVersion: string = res.data.tag_name
    const installerUrl = res.data?.assets[0]?.browser_download_url
    const installerPath = path.resolve(app.getPath('temp'), 'TempInstaller.exe')

    if (!installerUrl) return UpdateResponse.LinkFetchFailed
    if (latestVersion.substring(latestVersion.indexOf('-v') + 2) == pkg.version) return UpdateResponse.Newest

    await downloadInstaller(installerUrl, installerPath)
    await zapret.remove()
    spawn(installerPath)
}
async function downloadInstaller(installerUrl: string, installerPath: string) {
    const stream = await axios({
        method: 'get',
        url: installerUrl,
        responseType: 'stream'
    })

    const size = Number(stream.headers["Content-Length"])
    let current = 0

    const writer = fs.createWriteStream(installerPath)

    stream.data.on('data', (chunk: Buffer) => {
        current += chunk.length
        ipcMain.emit('downloadInstallerProgress', current / size)
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