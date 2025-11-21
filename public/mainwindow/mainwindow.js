const l = console.log
document.addEventListener('DOMContentLoaded', async () => {
    l(zapret)
    l(await zapret.getData())
    /**
     * @type {string[]}
     */
    const strategies = await zapret.getAllStrategies()
    /**
     * @type {[boolean, string | null]}
     */
    const [status, currentStrategy] = await zapret.checkStatus()
    $('#maintext').html(`Губорыл v${mw.version}`)
    $('#close').on('click', () => {
        mw.closeWindow()
    })
    $('#minimize').on('click', () => {
        mw.minimize()
    })
    createStrategySelectMenu(strategies)
    /**
     * 
     * @param {string[]} strategies 
     */
    function createStrategySelectMenu(strategies) {
        let el = $('#strategy')
        let content = ''
        let currentStrategyNum

        strategies.find((v, i) => {
            if (v.includes(currentStrategy)) {
                currentStrategyNum = i + 1
                return true
            } else {
                return false
            }
        })
        for (let i = 1; i <= strategies.length; i++) {
            content += /* html */`<option value="${i}" ${ currentStrategyNum == i ? 'selected' : ''}>${i}. ${strategies[i-1]}</option>`
        }

        el.html(content)
    }
})
