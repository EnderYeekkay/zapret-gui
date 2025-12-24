import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const batPath = path.join(app.getPath('userData'), 'guboril.bat');
const exePath = app.getPath('exe')

export function init_cli() {
    writeBat()
}

function writeBat() {
    if (fs.existsSync(batPath)) return false

    fs.writeFileSync(
    batPath,
    `"${exePath}" %*`
    );
    return true
}
