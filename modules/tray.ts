import { ipcMain, nativeImage, BrowserWindow, Tray, Menu, app } from 'electron'
import type { MenuItemConstructorOptions } from 'electron/main'
import path from 'path'
const pr = path.resolve
import Zapret from './Zapret.ts'
import { sendServiceOffNotify, sendServiceOnNotify } from './myNotifcations.ts'
export async function initializeTray(win: BrowserWindow, zapret: Zapret, publicPath: string) {
    const icon_resize_option = { width: 16, height: 16 }
    const image_path = path.resolve(publicPath, 'images')
    const guboril_img = nativeImage.createFromPath(pr(publicPath, 'icon.ico')).resize(icon_resize_option)
    const maximize_img = nativeImage.createFromPath(pr(image_path,'maximize.png')).resize(icon_resize_option)
    const exit_img = nativeImage.createFromPath(pr(image_path,'exit.png')).resize(icon_resize_option)
    const launch_img = nativeImage.createFromPath(pr(image_path,'power.png')).resize(icon_resize_option)
    let zapretStatus: boolean = (await zapret.checkStatus())[0]
    const power_off_text = 'Остановить ядро'
    const power_on_text = 'Запустить ядро'

    const tray = new Tray(guboril_img)
    tray.on('double-click', (event, bounds) => {
        console.log('double-click on tray')
        win.show()
    })

    const power_btn_menuItem: MenuItemConstructorOptions = {
        label: zapretStatus ? power_off_text : power_on_text,
        icon: launch_img,
        enabled: !zapret.isBusy,
        click: async function (menuItem) {
            win.webContents.send('disableToStop')
            zapretStatus = (await zapret.checkStatus())[0]
            menuItem.enabled = false

            if (zapretStatus) {
                await zapret.remove()
                zapretStatus = false
                power_btn_menuItem.label = power_on_text
                if(!win.isVisible()) sendServiceOffNotify()
            } else {
                let selectedStrategyNum = Zapret.getSettings().selectedStrategyNum + 1
                await zapret.install(selectedStrategyNum)
                zapretStatus = true
                power_btn_menuItem.label = power_off_text
                if(!win.isVisible()) sendServiceOnNotify(selectedStrategyNum)
                
            }

            menuItem.enabled = true
            tray.closeContextMenu()
            tray.setContextMenu(buildTrayMenu())
            win.webContents.send('rollbackToStop', zapretStatus)
        }
    }
    function buildTrayMenu() {
        return Menu.buildFromTemplate([
        { label: `Guboril`, icon: guboril_img, enabled: false},
        { type: 'separator' },
        { label: 'Развернуть', icon: maximize_img, click: () => win.show() },
        power_btn_menuItem,
        { type: 'separator' },
        { label: 'Выход из Guboril', click: () => app.quit(), icon: exit_img}
        ])
    }


    ipcMain.on('sendDisableToStop', () => {
        power_btn_menuItem.enabled = false
    })
    ipcMain.on('sendRollbackToStop', () => {
        power_btn_menuItem.enabled = true
        tray.closeContextMenu()
        tray.setContextMenu(buildTrayMenu())
    })

    tray.setContextMenu(buildTrayMenu())
}