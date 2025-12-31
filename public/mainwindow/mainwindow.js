/** @typedef {import("choices.js").default} Choices */
/**
    @typedef {{
        gameFilter: boolean
        autoLoad: boolean
        autoUpdate: boolean
        zapretVersion: string
        selectedStrategyNum: number
        notifications: boolean
    }} Settings
*/
/**
    @typedef {{
        gf: "enabled" | "disabled",
        v: string
    }} zapretData
*/


// Лог
const origLog = console.log.bind(console)
console.log = (...args) => {
    logger.log('renderer-log', ...args)
    origLog(...args)
}

// Предупреждение
const origWarn = console.warn.bind(console)
console.warn = (...args) => {
    logger.warn('renderer-log', ...args)
    origWarn(...args)
}

// Ошибка
const origError = console.error.bind(console)
console.error = (...args) => {
    logger.error('renderer-log', ...args)
    origError(...args)
}
const l = console.log

const dc_loader = /* html */`
    <div class="dc_loader">
        <span></span>
        <span></span>
        <span></span>
    </div>
`

document.addEventListener('DOMContentLoaded', async () => {
    const NotifyType = {
        Error: 0,
        Warn: 1,
        Message: 2
    }

    const NotifyPosition = {
        Center: 0,
        RightBottom: 1
    }
    let notifyCount = 0

    /**
     * 
     * @param {{
     *  title: string,
     *  content: string,
     *  type: number,
     *  position: number,
     * }} options 
     */
    function sendNotify(options = {
        title: '',
        content: '',
        type: NotifyType.Message,
        position: NotifyPosition.RightBottom
    }) {
        if (!options.title) options.title = ''
        notifyCount++
        const img = $(/* html */`<img class="header_btn_ico notify_close" src="../images/close.png" alt="">`)
        const notifyEncounter = $(/* html */`<div class="notify_encounter">(${notifyCount})</div>`)
        const el = $(/* html */`
            <div class="container notify_container">
                <div class="notify_title">${options.title}</div>
                <div class="notify_content">${options.content}</div>
            </div>
        `)
        $('#content').append(el)
        $(el).prepend(notifyEncounter)
        $(el).prepend(img)

        if (options.type == NotifyType.Error) $(el).children('.notify_title').css('color', 'red')
        img.on('click', function() {
            $(this).parent().remove()
            if (notifyCount > 0) notifyCount--;
            updateNotifyEncounter()
        })
        updateNotifyEncounter()
        return el
    }
    function updateNotifyEncounter() {
        let encs = $('.notify_encounter')
        l(notifyCount)
        encs.map(function () {
            let enc = $(this)
            enc.text(`(${notifyCount})`)
            if (notifyCount == 1) {
                enc.attr('hidden', 'hidden')
            } else {
                enc.removeAttr('hidden')
            }
        })
    }
    window.addEventListener('error', (event) => {
        sendNotify({
            title: 'Error',
            content: event.message,
            type: NotifyType.Error,
            position: NotifyPosition.RightBottom
        })
    })

    window.addEventListener('unhandledrejection', (event) => {
        sendNotify({
            title: 'Promise Error',
            content: event.reason?.message || String(event.reason),
            type: NotifyType.Error,
            position: NotifyPosition.RightBottom
        })
    })

    /**
     * @type {string[]}
     */
    const strategies = await zapret.getAllStrategies()
    l(strategies)

    /**
     * @type {[boolean, string | null]}
     */
    let [status, currentStrategy] = await zapret.checkStatus()
    
    /**
     * @type {Settings}
     */
    const settings = await zapret.getSettings()
    /**
     * @type {zapretData}
     */
    let zapretData = await zapret.getData()
    $('#cb_game_filter').prop('checked', zapretData.gf == 'enabled' ? true : false)

    //////////////////////////////////////////////////////////////////////////
    // Вычисление номера текущей стратегии и установка значений после старта//
    //////////////////////////////////////////////////////////////////////////
    let selectedStrategyNum = (settings).selectedStrategyNum || 6

    strategies.find((strategy, idx) => {
        l(`${idx + 1}. ${strategy}`, strategy.includes(currentStrategy))
        if (strategy.includes(currentStrategy)) {
            selectedStrategyNum = idx
            zapret.setSettings({selectedStrategyNum: idx})
            return true
        }
    })
    l('Номер выбранной стратегии:', selectedStrategyNum)
    if (status) {
        $('#btn_service').removeClass('btn_success')
        $('#btn_service').addClass('btn_danger')
        $('#service_status').text('Работает')
        $('#btn_service_text').text('Остановить')
    } else {
        $('#btn_service').removeClass('btn_danger')
        $('#btn_service').addClass('btn_success')
        $('#service_status').text('Остановлен')
        $('#btn_service_text').text('Запустить')
    }

    ////////////////////////////////////////
    // Вычисление номера текущей стратегии//
    //     (ПРИ ИЗМЕНЕНИИ SELECT MENU)    //
    ////////////////////////////////////////
    $('#strategy').on('change', async function() {
        let btn = $('#btn_service')
        l('Номер выбранной стратегии:', selectedStrategyNum)
        selectedStrategyNum = $(this).val() - 1

        disableToStop(btn.children())
        btn.append(dc_loader)
        await zapret.install(selectedStrategyNum + 1)
        changeServiceStyle('active')
        zapret.setSettings({selectedStrategyNum: selectedStrategyNum})
        rollbackToStop(btn.children())
        btn.children('.dc_loader').remove()
    })

    //////////////////////
    // Настройки header //
    //////////////////////
    $('#core_block_version_number').text(zapretData.v)
    $('head > title').text(`Губорыл v${mw.version}`)
    $('#maintext').html(`Губорыл v${mw.version}`)
    $('#close').on('click', () => {
        mw.closeWindow()
    })
    $('#minimize').on('click', () => {
        mw.minimize()
    })

    /////////////////////////////////
    // Отображение вкл/выкл сервиса//
    /////////////////////////////////
    /**
     * Не устанавливает dc_loader!
     * @param {'active' | 'inactive' | 'uninstalled'} state 
     */
    function changeServiceStyle(state) {
        const btn = $('#btn_service')
        const status = $('#service_status')
        const btn_text = $('#btn_service_text')

        switch (state) {
            case 'active':
                // Если уже изменён статус
                if (btn.hasClass('btn_danger')) return false
                btn
                .removeClass('btn_success')
                .addClass('btn_danger')
                .removeAttr('disabled')

                status.text('Работает')
                btn_text.text('Остановить')
                $('#strategy').removeAttr('disabled')
                break

            case 'inactive':
                // Если уже изменён статус
                if (btn.hasClass('btn_success')) return false
                btn
                .removeClass('btn_danger')
                .addClass('btn_success')

                status.text('Остановлен')
                btn_text.text('Запустить')
                $('#strategy').removeAttr('disabled')
                break
            case 'uninstalled':
                // Если уже изменён статус
                if (btn.is(':disabled')) return false

                btn.attr('disabled', 'disabled')
                btn.removeClass('btn_success')
                btn.addClass('btn_danger')
                
                status.text('Не установлен')
                btn_text.text('Запустить')
                $('#strategy').attr('disabled', 'disabled')
                break
            default:
                throw new Error(`Unable to change styles of services state, wrong argument state: ${state}`)
                break
        }
        return true
    }

    ////////////////////////////
    // Логика вкл/выкл сервиса//
    ////////////////////////////
    $('#btn_service').on('click', async function () {
        let btn = $(this)
        if (btn.hasClass('btn_success') && btn.hasClass('btn_danger')) throw new Error('Btn can\'t have classes btn_success and btn_danger at one time!')

        disableToStop(btn.children())

        ////////////////
        // Отключение //
        ////////////////
        if (btn.hasClass('btn_danger')) {
            l('Отключаем...')
            btn.append(dc_loader)
            l(await zapret.remove())
            changeServiceStyle('inactive')

        ///////////////
        // включение //
        ///////////////
        } else if (btn.hasClass('btn_success')) {
            l('Включаем стратегию: ')
            btn.append(dc_loader)
            l(await zapret.install(selectedStrategyNum + 1))
            changeServiceStyle('active')

        } else throw new Error('Btn doesn\'t have any compatible classes :C')

        ////////////////////////////////////
        // Возвращение исходных состояний //
        ////////////////////////////////////
        btn.children('.dc_loader').remove()
        rollbackToStop(btn.children())
    })

    //////////////////////////////////
    // Генерация strategySelectMenu //
    //////////////////////////////////
    let strategySelectMenu = $('#strategy')
    let strategySelectMenuContent = ''

    for (let i = 0; i <= strategies.length; i++) {
        strategySelectMenuContent += /* html */`<option value="${i+1}" ${ selectedStrategyNum == i ? 'selected' : ''}>${i+1}. ${strategies[i]}</option>`
    }

    strategySelectMenu.html(strategySelectMenuContent)

    /**
     * @type {Choices}
     */
    const choices = new Choices(strategySelectMenu[0], {
        searchEnabled: true,
        itemSelectText: '',
        position: "bottom",
        searchPlaceholderValue: "Введите название",
    })
    $(choices.containerOuter.element).addClass('to_stop')

    /////////////
    // To Stop //
    /////////////
    function disableToStop(children) {
        tray_event.sendDisableToStop()
        $('.to_stop').attr('disabled', 'disabled')
        $('body').css('cursor', 'progress')
        if (children) children.css('opacity', 0)
        choices.disable()
    }
    function rollbackToStop(children) {
        tray_event.sendRollbackToStop()
        $('.to_stop').each((_, el) => $(el).removeAttr('disabled'))
        $('body').css('cursor', 'default')
        if (children) children.css('opacity', '')
        choices.enable()
    }
    tray_event.onDisableToStop(disableToStop)
    tray_event.onRollbackToStop((_, data) => {
        if (data) {
            changeServiceStyle('active')
        } else {
            changeServiceStyle('inactive')
        }
        rollbackToStop()
    })
    ////////////////
    // GameFilter //
    ////////////////
    $('#cb_game_filter').on('change', async function() {
        const el = $(this)
        disableToStop()
        await zapret.switchGameFilter()
        rollbackToStop()
        
    })

    ////////////////
    // AutoUpdate //
    ////////////////
    // Изменение настроек автообновления
    $('#cb_auto_update').on('change', function() { zapret.setSettings({autoUpdate: $(this).is(':checked')})})

    if (settings.autoUpdate) {
        const latestVersion = (await zapret.getLatestVersion()).tag
        if (zapretData.v != latestVersion) {
            sendNotify({
                title: /* html */`
                    <div id="subcontainer_auto_update">
                        <div id="text_auto_update">ДОСТУПНА НОВАЯ ВЕРСИЯ</div>
                        <div id="text_new_version">${latestVersion}</div>
                    </div>
                `,
                content: /* html */`
                    <div class="btn btn_primary to_stop" id="1">Обновить</div>
                `
            })
        }

        // Обновление ядра
        $('#btn_auto_update').on('click', async function() {
            let btn = $(this)

            changeServiceStyle('inactive')
            disableToStop(btn.children())
            btn.append(dc_loader)
            await zapret.remove()
            await zapret.updateZapret()

            rollbackToStop(btn.children())
            btn.children('.dc_loader').remove()
        })
    }
    $('#cb_auto_update').prop('checked', settings.autoUpdate)

    ///////////////////
    // Update Button //
    ///////////////////
    $('#btn_update_core_static').on('click', async function() {
        const btn = $(this)
        disableToStop(btn.children())
        btn.append(dc_loader)
        l('Обновление ядра запущено...')
        /**
         * @type {0 | 1}
         */
        let res
        res = await zapret.updateZapret()
        let zapretVersion = (await zapret.getSettings()).zapretVersion
        if (res == 0) {
            l(`Установлена версия: `, zapretVersion)
            sendNotify({title: 'Обновление завершено', content: `Установлена новая версия ядра (v${zapretVersion})`})
        } else {
            l(`Уже установлена самая новая версия ядра (v${zapretVersion})`)
            sendNotify({title: 'Поздравляем <3', content: `Уже установлена самая новая версия ядра (v${zapretVersion})`})
        }
        btn.children('.dc_loader').remove()
        rollbackToStop(btn.children())
    })

    /**
     * 
     * @param {'installed' | 'uninstalled'} state 
     */
    function changeCoreVersionStyles(state) {
        switch (state) {
            case 'installed':
                changeServiceStyle('inactive')
                $('#btn_update_core_static').css('display', '')
                $('#btn_delete_core').css('display', '')
                $('#btn_install_core').css('display', 'none')
                $('#btn_install_core').attr('disabled', 'disabled')
                break
            case 'uninstalled':
                changeServiceStyle('uninstalled')
                $('#btn_update_core_static').css('display', 'none')
                $('#btn_delete_core').css('display', 'none')
                $('#btn_install_core').css('display', '')
                $('#btn_install_core').removeAttr('disabled')
                break

            default:
                throw new Error(`Unable to change styles of core version state, wrong argument state: ${state}`)
                break
        }
    }

    ///////////////////////////
    // Uninstall Core Button //
    ///////////////////////////
    $('#btn_delete_core').on('click', async function() {
        const btn = $(this)
        const children = btn.children()
        disableToStop(children)
        btn.append(dc_loader)

        l('Остонавливаем сервис...')
        await zapret.remove()
        l('Удаление ядра запущено...')
        let res = await zapret.uninstallCore()
        zapret.setSettings({gameFilter: false})
        $('#cb_game_filter').prop('checked', false)
        rollbackToStop(children)
        changeCoreVersionStyles('uninstalled')
        btn.children('.dc_loader').remove()

        if (res) sendNotify({title: 'Ядро успешно удалено!', content: ''})
    })

    ////////////////////////
    // Install Core Button//
    ////////////////////////
    $('#btn_install_core').on('click', async function() {
        const btn = $(this)
        const children = btn.children()
        disableToStop(children)
        btn.append(dc_loader)

        l('Установка ядра запущена...')
        const res = await zapret.updateZapret()

        rollbackToStop(children)
        changeCoreVersionStyles('installed')
        btn.children('.dc_loader').remove()

        if (res) sendNotify({title: 'Ядро успешно установлено!', content: ''})
    })

    //////////////////////
    // Open Core Folder //
    //////////////////////
    $('#btn_open_folder').on('click', () => {
        l('Открытие папки ядра')
        zapret.openCoreFolder()
    })

    ///////////////////////
    // Auto Start Button //
    ///////////////////////
    $('#cb_auto_start').prop('checked', await scheduler_api.checkTask())
    $('#cb_auto_start').on('change', async function () {
        const btn = $(this)
        let res
        if (btn.is(':checked')) {
            res = await scheduler_api.createTask()
            if (!res) btn.prop('checked', false)
        } else {
            res = await scheduler_api.deleteTask()
            if (!res) btn.prop('checked', true)
        }
        
    }) 

    //////////////////////////
    // Notifications Button //
    //////////////////////////
    $('#cb_notifications').prop('checked', settings.notifications)
    $('#cb_notifications').on('change', function() { zapret.setSettings({notifications: $(this).is(':checked')})})

    ////////////////////////
    // Open GitHub button //
    ////////////////////////
    $('#btn_open_github').on('click', () => mw.open_github())
    ///////////////
    // Save Logs //
    ///////////////
    $('#btn_save_logs').on('click', () => mw.save_logs())
    l('Uwu!')
    mw.uwu()
})

