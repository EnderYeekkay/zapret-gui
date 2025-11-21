
const { spawn, ChildProcess } = require('child_process');
const fs = require('fs');
const path = require('path');
const { app } = require('electron/main')
const { EventEmitter } = require('events')
const l = console.log
module.exports = class Zapret extends EventEmitter{

    /**
     * @type {ChildProcess}
     */
    child 

    isBusy = false

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
        const destDir = path.join(app.getPath('userData'), 'core');
        const originalBat = path.join(destDir, 'service.bat');
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
        this.child = this.spawnChild()
        
    }
   
    static isInstalled() {
        const coreDir = path.join(app.getPath('userData'), 'core');
        const serviceBat = path.join(coreDir, 'service.bat');

        try {
            return fs.existsSync(serviceBat);
        } catch {
            return false;
        }
    }
    spawnChild () {
        l('\x1b[32mspawnChild()\x1b[0m')
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
        return child
    }
    async getData() {
        this.isBusy = true
        this.killChild()
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
        this.child = this.spawnChild()
        this.off('out', handler)
        let data = this.output.match(/\{[^{}]*\}/g)[0]
        if (!data) throw new ZapretError('Empty data')
        this.isBusy = false
        return JSON.parse(data)
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
    async getLatestVersion(repo) {
        l('\x1b[1;35mgetLatestVersion()\x1b[0m')
        const { data: latest } = await axios.get(`https://api.github.com/repos/${repo}/releases/latest`);

        const latestTag = latest.tag_name || latest.name;
        const latestUrl = latest.assets.find(a => a.name.endsWith('.rar'))?.browser_download_url;

        if (!latestUrl) throw new Error('RAR-файл не найден в релизах.');

        return { tag: latestTag, url: latestUrl };
    }

    async checkStatus() {
        l('\x1b[1;35mcheckStatus()\x1b[0m')
        if (this.isBusy) throw new ZapretError('Queue error')
        const handler = (output) => {
            if (output.includes('ACTIVE')) {
                this.emit('complete', true, (output.match(/Service strategy installed from ".*\(([^)]+)\)"/) || [])[1] || null)
                this.killChild()
            }
            if (output.includes('NOT FOUND')) {
                this.emit('complete', false, (output.match(/Service strategy installed from ".*\(([^)]+)\)"/) || [])[1] || null)
                this.killChild()
            }
        }
        this.on('out', handler)
        this.write(3)
        
        let res = await EventEmitter.once(this, 'complete')
        this.child = this.spawnChild()
        this.off('out', handler)
        this.isBusy = false
        return res
    }
    async install() {

    }
    async remove() {
        if (this.isBusy) throw new ZapretError('Queue error')

        this.write(2)
        const handler = (output) => {
            if (output.includes('Press any')) this.emit('complete', true)
        }
        this.on('out', handler)
        let res = await EventEmitter.once(this, 'complete')
        this.off('out', handler)
        this.isBusy = false
    }
    async getAllStrategies() {
        l('\x1b[1;35mgetAllStrategies()\x1b[0m')
        if (this.isBusy) throw new ZapretError('Queue error');
        const handler = async (output) => {
            if (output.includes('Input')) {
                l(output)
                const matches = [...output.matchAll(/(general(?: \([^)]+\))?\.bat)/gi)];
                const strategies = matches.map(m => m[1].trim());
                this.killChild()
                this.emit('complete', strategies)
            }
            // l(this.output)
        };
        this.on('out', handler);
        this.write(1)
        let res = await EventEmitter.once(this, 'complete');

        this.off('out', handler);
        this.child = this.spawnChild()
        this.isBusy = false;
        return res[0];
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