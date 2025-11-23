
const l = console.log
// const Choices = require('../../node_modules/choices.js/public/assets/scripts/choices.js');
const dc_loader = /* html */`
    <div class="dc_loader">
        <span></span>
        <span></span>
        <span></span>
    </div>
`
document.addEventListener('DOMContentLoaded', async () => {
    /**
     * @type {string[]}
     */
    const strategies = await zapret.getAllStrategies()
    l(strategies)
    /**
     * @type {[boolean, string | null]}
     */
    let [status, currentStrategy] = await zapret.checkStatus()

    //////////////////////////////////////////////////////////////////////////
    // Вычисление номера текущей стратегии и установка значений после старта//
    //////////////////////////////////////////////////////////////////////////
    let selectedStrategyNum = (await zapret.getSettings()).selectedStrategyNum || 6

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
    $('#strategy').on('change', function() {
        selectedStrategyNum = $(this).val() - 1
        zapret.setSettings({selectedStrategyNum: selectedStrategyNum})
        l('Номер выбранной стратегии:', selectedStrategyNum)
    })

    //////////////////////
    // Настройки header //
    //////////////////////
    $('#maintext').html(`Губорыл v${mw.version}`)
    $('#close').on('click', () => {
        mw.closeWindow()
    })
    $('#minimize').on('click', () => {
        mw.minimize()
    })

    ////////////////////////////
    // Логика вкл/выкл сервиса//
    ////////////////////////////
    $('.btn').on('click', async function () {
        let btn = $(this)
        if (btn.hasClass('btn_success') && btn.hasClass('btn_danger')) throw new Error('Btn can\'t have classes btn_success and btn_danger at one time!')

        btn.children().map((idx, child) => $(child).css('opacity', 0))
        btn.attr('disabled', 'disabled')
        btn.append(dc_loader)
        disableToStop()

        ////////////////
        // Отключение //
        ////////////////
        if (btn.hasClass('btn_danger')) {
            try {
                l('Отключаем...')
                l(await zapret.remove())
            } catch (e) {
                l(e.stack)
                return
            }
            btn
            .removeClass('btn_danger')
            .addClass('btn_success')
            .removeAttr('disabled')
            btn.children('.dc_loader').remove()

            $('#service_status').text('Остановлен')
            $('#btn_service_text').text('Запустить')

        //////////////
        // включение//
        //////////////
        } else if (btn.hasClass('btn_success')) {
            try {
                l('Включаем стратегию: ')
                l(await zapret.install(selectedStrategyNum + 1))
            } catch (e) {
                l(e.stack)
                return
            }
            btn
            .removeClass('btn_success')
            .addClass('btn_danger')
            .removeAttr('disabled')
            .remove('dc_loader')
            btn.children('.dc_loader').remove()

            $('#service_status').text('Работает')
            $('#btn_service_text').text('Остановить')

        } else throw new Error('Btn doesn\'t have any compatible classes :C')

        ////////////////////////////////////
        // Возвращение исходных состояний //
        ////////////////////////////////////
        btn.children().map((idx, child) => $(child).css('opacity', ''))
        rollbackToStop()
    })
    let strategySelectMenu = $('#strategy')
    let strategySelectMenuContent = ''

    for (let i = 0; i <= strategies.length; i++) {
        strategySelectMenuContent += /* html */`<option value="${i+1}" ${ selectedStrategyNum == i ? 'selected' : ''}>${i+1}. ${strategies[i]}</option>`
    }

    strategySelectMenu.html(strategySelectMenuContent)
    const choices = new Choices(strategySelectMenu[0], {
        searchEnabled: true,
        itemSelectText: '',
        position: "bottom",
        searchPlaceholderValue: "Введите название",
    })
    $(choices.containerOuter.element).addClass('to_stop')
    function disableToStop() {
        $('.to_stop').each((idx, el) => $(el).attr('disabled', 'disabled'))
    }
    function rollbackToStop() {
        $('.to_stop').each((idx, el) => $(el).removeAttr('disabled'))
    }
    mw.uwu()
})
