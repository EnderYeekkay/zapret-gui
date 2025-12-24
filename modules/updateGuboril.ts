import axios from "axios";
import pkg from '../package.json' with { type: "json" }; 
// import fs from 'fs'
// import { app } from 'electron'
import { log } from 'console'

async function execute() {
    const res = await axios.get('https://api.github.com/repos/EnderYeekkay/Guboril/releases/latest')
    const latestVersion: string = res.data.tag_name
    log(latestVersion.substring(latestVersion.indexOf('-v') + 2))
    log(pkg.version)
    if (latestVersion != pkg.version) {

    }
    // const url = res.data?.assets?.browser_download_url
    // if (!url) throw new Error('Failed to fetch download URL!')
}
execute()