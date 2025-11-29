const fs = require('fs')
const path = 'C:/ProgramData/Cloudflare/settings.json'
const l = console.log
module.exports = {
    checkWarp: () => {
        let res = fs.existsSync(path)
        if (res) {
            l('Warp has been detected.')
        } else {
            l('Warp is not detected')
        }
        return res
    },
    addToExcludedHostsList: () => {
        l('Applying warp fix...')
        if (!fs.existsSync(path)) throw new WarpFixError('Warp settings is not detected')
        const settings = JSON.parse(fs.readFileSync(path))
        if (!settings.excluded_hosts) settings.excluded_hosts = []
        if (!settings.excluded_ips) settings.excluded_ips = []
        if (settings.excluded_hosts.find(el => el[0] == "api.github.com")){
            l('warpFix property is already exists!')
            return 1
        }

        settings.excluded_hosts.push(["api.github.com", "Guboril was here!"])
        fs.writeFileSync(path, JSON.stringify(settings, null, 2))
    },
    removeFromExcludedHostsList: () => {
        l('Removing warp fix...')
        if (!fs.existsSync(path)) throw new WarpFixError('Warp settings is not detected')
        const settings = JSON.parse(fs.readFileSync(path))

        if (!settings.excluded_hosts) return 1
        settings.excluded_hosts = settings.excluded_hosts.filter(el => el[0] !== "api.github.com")
        fs.writeFileSync(path, JSON.stringify(settings, null, 2))
    },
}

class WarpFixError extends Error {
    constructor(message) {
        super(message);          // Передаём сообщение в базовый Error
        this.name = this.constructor.name; // Имя класса как имя ошибки
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor); // Корректный стек
        }
    }
}