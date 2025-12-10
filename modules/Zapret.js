
const { spawn, ChildProcess } = require('child_process');

const fs = require('fs');
const path = require('path');
const { app } = require('electron/main')
const { shell } = require('electron');
const { EventEmitter } = require('events')
const axios = require('axios');
const l = console.log

const destDir = path.join(app.getPath('userData'), 'core');
const originalBat = path.join(destDir, 'service.bat');
const coreDir = path.join(app.getPath('userData'), 'core');
const settingsPath = path.join(app.getPath('userData'), 'settings.json')

module.exports = class Zapret extends EventEmitter{

    /**
     * @type {ChildProcess}
     */
    child 

    _isBusy = false
    get isBusy() {
        return this._isBusy
    }
    set isBusy(value) {
        this._isBusy = value
        if (!value) this.emit('not_busy')
    }
    /**
     * Вывод **stdout**
     * @type {string}
     */
    output = ''

    _patchedBat
    /**
     * 
     * @param {string} destDir 
     */
    constructor() {
        super()
        if (Zapret.isInstalled())
        {
            this._patchedBat = path.join(destDir, 'service_patched.bat');

            // читаем оригинал
            let code = fs.readFileSync(originalBat, 'utf8');

            // ########### ПАТЧ .bat ###########
            // заменяем ВСЕ вызовы start (...) на call (...)
            code = code.replace(
                /^\s*start\s+(.*)$/gmi,
                'call $1'
            );
            const menuBlockRegex = new RegExp(
            [
                '^echo =========\\s+v!LOCAL_VERSION!\\s+=========$',
                '^echo 1\\. Install Service$',
                '^echo 2\\. Remove Services$',
                '^echo 3\\. Check Status$',
                '^echo 4\\. Run Diagnostics$',
                '^echo 5\\. Check Updates$',
                '^echo 6\\. Switch Game Filter.*$',
                '^echo 7\\. Switch ipset.*$',
                '^echo 8\\. Update ipset list$',
                '^echo 0\\. Exit$'
            ].join('\\r?\\n'), 
            'mi'
            );
            code = code.replace(menuBlockRegex, 'echo {{"gf": "%GameFilterStatus%", "v": "%LOCAL_VERSION%"}}');

            // удаляем первый блок if "%1"=="admin" (...) else (...)
            const adminBlockRegex =
                /if\s+"%1"=="admin"\s*\([\s\S]*?\)\s*else\s*\([\s\S]*?\)/i;
            code = code.replace(adminBlockRegex, '');
            fs.writeFileSync(this._patchedBat, code);
        } else {
            l('Warning! No core has been detected!')
        }
        this.child = this.spawnChild()
        
    }
    /**
    * 
    * @returns { Settings }
    */
    static getSettings() {
        return JSON.parse(fs.readFileSync(settingsPath))
    }

    /**
    * 
    * @param { Settings } data 
    */
    static setSettings(data) {
        let old_settings = Zapret.getSettings()
        let new_settings = {...old_settings, ...data}
        fs.writeFileSync(settingsPath, JSON.stringify(new_settings))
    }

    static isInstalled() {
        const serviceBat = path.join(coreDir, 'service.bat');

        try {
            return fs.existsSync(serviceBat);
        } catch {
            return false;
        }
    }
    spawnChild () {
        l('\x1b[32mspawnChild()\x1b[0m')
        this.output = ''
        let child = spawn(
                'cmd.exe',
            ['/c', this._patchedBat],
            {
                windowsHide: true,
                stdio: ['pipe', 'pipe', 'pipe']
            }
        )
        child.stdout.on('data', (chunk) => {
            chunk = chunk.toString()
            if (chunk.includes('Press any key')) {
                child.stdin.write('\r')
            }
            this.output += chunk
            this.emit('out', this.output)
        })
        child.stderr.on('data', (chunk) => {
            chunk = chunk.toString()
            if (chunk.includes('Press any key')) {
                child.stdin.write('\r')
            }
            this.output += chunk
            this.emit('out', this.output)
        })
        child.on('exit', (msg) => {
            console.log('Child exited with msg: ' + msg)
        })
        this.child = child
        return child
    }
    killChild () {
        l('\x1b[31mkillChild()\x1b[0m')
        this.child.kill()
    }
    static async initialize() {
        let res = new this()
        return res
    }
    write(value) {
        // if(!this.child.stdin.writable) throw new ZapretError('Stdin is unwritable: ' + this.output)
        this.output = ''
        this.isBusy = true
        this.child.stdin.write(`${value.toString()}\n`)
    }

    /**
     * 
     * @returns {Promise<object>}
     */
    async getData() {
        this.isBusy = true
        this.spawnChild()
        l('\x1b[1;35mgetData()\x1b[0m')
        const handler = (chunk) => {
            if (this.output.includes('Enter')) {
                l(this.output)
                this.killChild()
                this.emit('complete')
            }
        }

        this.on('out', handler)
        await EventEmitter.once(this, 'complete')
        this.off('out', handler)

        let data = this.output.match(/\{[^{}]*\}/g)[0]
        if (!data) throw new ZapretError('Empty data')
        this.isBusy = false
        return JSON.parse(data)
    }

    async switchGameFilter() {
        this.isBusy = true
        this.spawnChild()
        l('\x1b[1;35mswitchGameFilter()\x1b[0m')
        this.write(6)
        const handler = (chunk) => {
            if (this.output.includes('Restart')) {
                l(this.output)
                this.killChild()
                this.emit('complete')
            }
        }

        this.on('out', handler)
        await EventEmitter.once(this, 'complete')
        this.off('out', handler)

        this.isBusy = false
        return true
    }

    async getLatestVersion() {
        const repo = 'Flowseal/zapret-discord-youtube';
        l('\x1b[1;35mgetLatestVersion()\x1b[0m')
        const { data: latest } = await axios.get(`https://api.github.com/repos/${repo}/releases/latest`);

        const latestTag = latest.tag_name || latest.name;
        const latestUrl = latest.assets.find(a => a.name.endsWith('.rar'))?.browser_download_url;

        if (!latestUrl) throw new Error('RAR-файл не найден в релизах.');

        return { tag: latestTag, url: latestUrl };
    }

    openCoreFolder() {
        shell.showItemInFolder(originalBat);
    }

    async checkStatus() {
        l('\x1b[1;35mcheckStatus()\x1b[0m')
        this.child = this.spawnChild()
        if (this.isBusy) throw new ZapretError('Queue error')
        const handler = (output) => {
            if (output.includes('ACTIVE')) {
                this.emit('complete', true, (output.match(/Service strategy installed from "([^"]+)"/) || [])[1] || null)
                this.killChild()
            }
            if (output.includes('NOT FOUND')) {
                this.emit('complete', false, (output.match(/Service strategy installed from "([^"]+)"/) || [])[1] || null)
                this.killChild()
            }
        }
        this.on('out', handler)
        this.write(3)
        
        let res = await EventEmitter.once(this, 'complete')
        this.off('out', handler)
        this.isBusy = false
        return res
    }
    /**
     * 
     * @param {Number} strategyNum 
     */
    async install(strategyNum) {
        l(`\x1b[1;35minstall(${strategyNum})\x1b[0m`)
        if (this.isBusy) throw new ZapretError('Queue error')
        strategyNum = Number(strategyNum)
        this.spawnChild()
        if (isNaN(strategyNum)) throw new ZapretError(`strategyNum must be number, but it is: ${strategyNum}`)

        this.write(1)
        const handler = (output) => {
            if (output.includes('Input')) this.emit('complete', true)
        }
        this.on('out', handler)
        await EventEmitter.once(this, 'complete')
        this.off('out', handler)
        const resHandler = (output) => {
            if (output.includes('successfully')) this.emit('complete', true)
            if (output.includes('denied') || output.includes('Invalid')) this.emit('complete', false)
        }

        this.write(strategyNum)
        this.on('out', resHandler)
        const res = await EventEmitter.once(this, 'complete')
        this.off('out', resHandler)
        this.killChild()
        this.isBusy = false
        l(res)
        return res
    }
    async remove() {
        l(`\x1b[1;35mremove()\x1b[0m`)
        if (this.isBusy) throw new ZapretError('Queue error')

        this.spawnChild()
        this.write(2)
        const handler = (output) => {
            if (output.includes('Press any')) this.emit('complete', true)
        }
        this.on('out', handler)
        let res = await EventEmitter.once(this, 'complete')
        this.off('out', handler)
        this.killChild()
        this.isBusy = false
    }
    async getAllStrategies() {
        l('\x1b[1;35mgetAllStrategies()\x1b[0m')
        this.spawnChild()
        if (this.isBusy) throw new ZapretError('Queue error');
        const handler = async (output) => {
            if (output.includes('Input')) {
                const matches = [...output.matchAll(/(general(?: \([^)]+\))?\.bat)/gi)];
                const strategies = matches.map(m => m[1].trim());
                this.emit('complete', strategies)
            }
        };
        this.on('out', handler);
        this.write(1)
        let res = await EventEmitter.once(this, 'complete');
        this.off('out', handler);
        l(res[0])
        this.isBusy = false;
        this.killChild()
        return res[0];
    }

    /**
     * Удалить ядро из статической памяти
     * @returns {string | boolean}
     */
    uninstallCore() {
        try {
            fs.rmSync(destDir, {
                recursive: true,
                force: true,
                maxRetries: 10,
                retryDelay: 300
            })
        } catch (e) {
            return e
        }
        Zapret.setSettings({zapretVersion: '0'})
        return true
    }
    async queue(callback, ...args) {
        callback = callback.bind(this)
        if (!this.isBusy) {
            return await callback(...args)
        } else {
            await EventEmitter.once(this, 'not_busy')
            return await callback(...args)
        }
    }
}

class ZapretError extends Error {
    constructor(message) {
        super(message);          // Передаём сообщение в базовый Error
        this.name = this.constructor.name; // Имя класса как имя ошибки
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor); // Корректный стек
        }
    }

}