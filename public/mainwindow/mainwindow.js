const l = console.log
document.addEventListener('DOMContentLoaded', () => {
    $('#maintext').html(`Губорыл v${mw.version}`)
    $('#close').on('click', () => {
        mw.closeWindow()
    })
    $('#minimize').on('click', () => {
        mw.minimize()
    })
})