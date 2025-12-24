import { execSync, exec } from 'child_process'
export function warpFix() {
    try {
        if (execSync('warp-cli tunnel host list').includes('api.github.com')) {
            console.log('WarpFix is already installed')
        } else {
            execSync(`warp-cli tunnel host add "api.github.com"`)
            execSync('sc stop "CloudflareWARP"')
            setTimeout(() => exec('sc start "CloudflareWARP"'), 2000)
            console.log('WarpFix has been installed.')
        }
    } catch (e) {
        console.log('Cloudflare WARP not detected.')
    }
}