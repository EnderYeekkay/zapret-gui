type Callback = () => void
type ProgressCallback = (current: number, size: number) => void
declare let lw: {
    installationStart: (cb: Callback) => void
    downloadInstallerProgress: (cb: ProgressCallback) => void
    installationFinish: (cb: Callback) => void
    uwu: () => void
}
