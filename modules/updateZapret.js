import { createExtractorFromData } from 'node-unrar-js'
import axios from 'axios'
import path from 'node:path'
import { app } from 'electron/main'
import fs from 'node:fs'
import { log } from 'node:console'

const repo = 'Flowseal/zapret-discord-youtube'
const userData = app.getPath('userData')
const destDir = path.join(userData, 'core')
const rarPath = path.join(destDir, 'zapret.rar')
const settingsPath = path.join(userData, 'settings.json')

export default async function updateZapret() {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    console.log('🔍 Checking zapret updates...')

    // Load settings.json
    let settings = {};
    if (fs.existsSync(settingsPath)) {
        try {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        } catch {
            console.log('⚠️ Failed to read settings.json, resetting...');
            settings = {};
        }
    }

    const currentVersion = settings.zapretVersion || null;

    // 1. Fetch latest release info
    const { data: latest } = await axios.get(`https://api.github.com/repos/${repo}/releases/latest`);
    const latestTag = latest.tag_name || latest.name;
    const latestUrl = latest.assets.find(a => a.name.endsWith('.rar'))?.browser_download_url;

    if (!latestUrl) {
        throw new Error('RAR file not found in latest release.');
    }

    // 2. Compare with local version
    if (currentVersion === latestTag) {
        console.log(`✅ You already have the latest zapret version: ${currentVersion}`);
        return 1;
    }

    console.log(`⬇️ Downloading new zapret version: ${latestTag}`);

    // 3. Download RAR
    const response = await ghRequest(latestUrl, { responseType: 'arraybuffer' });
    const rarData = new Uint8Array(response.data);
    fs.writeFileSync(rarPath, rarData);

    // 4. Extract into core/
    console.log('📦 Extracting...');
    const extractor = await createExtractorFromData({ data: rarData });
    const extracted = extractor.extract();

    for (const file of extracted.files) {
        if (file.extraction) {
            const filePath = path.join(destDir, file.fileHeader.name);
            const folder = path.dirname(filePath);

            if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
            fs.writeFileSync(filePath, file.extraction);
        }
    }

    // 5. Update settings.json version
    settings.zapretVersion = latestTag;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    // 6. Remove RAR
    fs.unlinkSync(rarPath);

    console.log(`✅ zapret updated to ${latestTag}`);

    return 0;
    async function ghRequest(url, options = {}) {
        const token = JSON.parse(fs.readFileSync(settingsPath))?.GH_TOKEN
        const headers = options.headers || {}

        if (typeof token == 'string') {
            log('PAT detected')
            headers['Authorization'] = `token ${token}`
            headers['User-Agent'] = 'Guboril'
        }

        const res = await axios.get(url, { ...options, headers })
        return res
    }
};
