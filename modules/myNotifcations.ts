import { app, Notification } from 'electron/main';
import path from 'path'
import { getSettings } from '../modules/settings.ts'
function isNotificationsAllowed() {
    return getSettings().notifications
}
export function sendServiceOnNotify(strategy_num: number) {
    if (!isNotificationsAllowed()) return
    new Notification({ title: `Сервис (${strategy_num}) включён!`, silent: true}).show()
}
export function sendServiceOffNotify() {
    if (!isNotificationsAllowed()) return
    new Notification({ title: 'Сервис отключён!', silent: true}).show()
}

export function sendUENotify(err: Error) {
    if (!isNotificationsAllowed()) return
    new Notification({title: 'Uncaught Exception', silent: false, body: err.stack}).show()
}

export function sendURNotify(err: Error) {
    if (!isNotificationsAllowed()) return
    new Notification({title: 'Unhandled Rejection', silent: false, body: err.stack}).show()
}