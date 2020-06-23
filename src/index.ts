import * as jQuery from "jquery"
import * as moment from 'moment'

declare function t868_showPopup(recId: string, customCodeHTML: string): void
class Errors {
    time: string
    date: string
}

export class Config {
    timeDeliveryToggleName = "Хотите получить заказ как можно скорее или к определенному времени"
    timeDeliveryVisibleValue = "К определенному времени"
    timeInputName = "Время доставки ТОЛЬКО С 12:00"
    dateInputName = "Дата доставки "
    orderStartTime = "11:30"
    orderEndTime = "22:30"
    orderStartEndTimeError = "Мы принимаем заказы"
    minOrderPreparationTimeMinutes = 30
    minTimeError = "Для приготовления заказа нужно минимум"
    incorrectDateError = "Пожалуйста введите дату в формате ДД-ММ-ГГГГ"
    incorrectTimeError = "Пожалуйста введите время в формате ЧЧ:ММ"
    fromString = "с"
    untilString = "до"
    minutesString = "минут"
    ASAPDeliveryError = 'Вы заказываете в не рабочее время, доставка осуществляется'
    errorPopupId = ""
}

export class DeliveryValidation {
    config = new Config()
    errors = new Errors()

    clearErrors() {
        this.errors = new Errors()
    }

    /**
     * Error text when the user chooses time earlier than order can be prepared and delivered
     */
    getMinTimeError() {
        return `${this.config.minTimeError} ${this.config.minOrderPreparationTimeMinutes} ${this.config.minutesString}`
    }

    /**
     * Error text when the user chooses ASAP delivery, but outside of working hours
     */
    getASAPDeliveryError() {
        return `<p style="padding: 2em;">${this.config.ASAPDeliveryError} ${this.getWorkingHoursString()}</p>`
    }

    getWorkingHoursString() {
        let c = this.config
        return `${c.fromString} ${c.orderStartTime} ${c.untilString} ${c.orderEndTime}`
    }

    /**
     * Error text when the order custom delivery time is not in the valid range
     */
    getOrderTimeError() {
        return `${this.config.orderStartEndTimeError} ${this.getWorkingHoursString()}`
    }

    isTimeValid() {
        let val = this.getTimeInput().val()
        if (!val || val.toString().includes('_')) return true
        return moment(val, 'HH:mm').isValid()
    }

    isDateValid() {
        let val = this.getDateInput().val()
        if (!val || val.toString().includes('_')) return true
        return moment(val, 'DD-MM-YYYY').isValid()
    }

    showErrors() {
        this.showInputError(this.getTimeInput(), this.errors.time)
        this.showInputError(this.getDateInput(), this.errors.date)
    }

    validateFormat() {
        this.errors.date = !this.isDateValid() ? this.config.incorrectDateError : null
        this.errors.time = !this.isTimeValid() ? this.config.incorrectTimeError : null
    }

    isDateEmpty() {
        let val = this.getDateInput().val()
        return !val || val.toString().includes('_')
    }

    isTimeEmpty() {
        let val = this.getTimeInput().val()
        return !val || val.toString().includes('_')
    }

    hasErrors() {
        return this.errors.date || this.errors.time
    }

    validateRequiredFields() {
        if (this.isTimeEmpty())
            this.errors.time = 'Обязательное поле'
        if (this.isDateEmpty())
            this.errors.date = 'Обязательное поле'
        this.showErrors()
    }

    validateForm() {
        this.clearErrors()
        this.showErrors()
        if (this.isTimeValidationRequired())
            this.validateTimeRange()
        return this.hasErrors()
    }

    isInRange(time: moment.Moment, start: moment.Moment, end: moment.Moment): Boolean {
        return time.isBetween(start, end, null, "[]")
    }

    parseTime(time: string): moment.Moment {
        return moment(time, 'HH:mm')
    }

    /**
     * When we start accepting orders
     */
    getOrderStartTime(): moment.Moment {
        return this.parseTime(this.config.orderStartTime)
    }

    /**
     * When we end accepting orders
     */
    getOrderEndTime(): moment.Moment {
        return this.parseTime(this.config.orderEndTime)
    }

    /**
     * Minimum time when an order can be delivered on, considering min preparation time
     * @param date date for which we're calculating a min time in format of DD-MM-YYYY
     */
    getMinCustomDeliveryTime(date: string): moment.Moment {
        let now = moment()
        let parsedDate = moment(`${date} ${this.config.orderStartTime}`, 'DD-MM-YYYY HH:mm')
        var minTimeForTheDate = parsedDate.add(this.config.minOrderPreparationTimeMinutes, 'minutes')
        let isToday = parsedDate.isSame(now, 'date')
        if (isToday && now.isSameOrAfter(minTimeForTheDate)) {
            return now.add(this.config.minOrderPreparationTimeMinutes, 'minutes')
        }
        return minTimeForTheDate
    }

    validateTimeRange(): void {
        this.validateFormat()
        if (!this.isTimeEmpty() && !this.isDateEmpty() && !this.hasErrors()) {
            let currentTime = moment()
            let parsedDateTime = moment(this.getDateInput().val() + ' ' + this.getTimeInput().val(), 'DD-MM-YYYY HH:mm')
            if (!parsedDateTime.isValid()) return null
            let startTime = this.getOrderStartTime()
            let endTime = this.getOrderEndTime()
            let parsedTime = moment(parsedDateTime.format('HH:mm'), 'HH:mm')
            let isInRange = this.isInRange(parsedTime, startTime, endTime)
            let minTime = this.getMinCustomDeliveryTime(parsedDateTime.format('DD-MM-YYYY'))
            let isPreparationTimeSatisfied = parsedDateTime.isSameOrAfter(minTime)
            this.errors.time = !isInRange ? this.getOrderTimeError() : null
            if (!this.errors.time) {
                this.errors.time = !isPreparationTimeSatisfied ? this.getMinTimeError() : null
            }
        }
        this.showErrors()
    }

    isTimeValidationRequired() {
        return this.getVisibilityToggle().filter(':checked').val() == this.config.timeDeliveryVisibleValue
    }

    updateFieldsVisibility() {
        let visible = this.isTimeValidationRequired()
        if (visible) {
            this.getTimeInput().parents('.t-input-group').show()
            this.getDateInput().parents('.t-input-group').show()
        }
        else {
            this.getTimeInput().parents('.t-input-group').hide()
            this.getDateInput().parents('.t-input-group').hide()
        }
    }

    checkIfASAPDeliveryPossible() {
        if (this.isTimeValidationRequired() || this.config.errorPopupId === "") return
        if (!this.isInRange(moment(), this.getOrderStartTime(), this.getOrderEndTime()))
            t868_showPopup(this.config.errorPopupId, this.getASAPDeliveryError())
    }

    onChangeDistinct(el: JQuery<any>, callback: (el: JQuery<any>, val: string) => void) {
        el.keyup(() => {
            let val = el.val()

            if (el.data("lastval") != val) {
                el.data("lastval", val)
                callback(el, val.toString())
            }
        })
    }

    showInputError(el: JQuery<any>, error: string) {
        let errorControl = jQuery(el).parents('.t-input-group')
        if (error)
            errorControl.addClass('js-error-control-box')
        else
            errorControl.removeClass('js-error-control-box')
        el.next().text(error)
    }

    getVisibilityToggle() {
        return jQuery('[name="' + this.config.timeDeliveryToggleName + '"]')
    }

    getTimeInput() {
        return jQuery('input[name="' + this.config.timeInputName + '"]')
    }

    getDateInput() {
        return jQuery('input[name="' + this.config.dateInputName + '"]')
    }

    onFormSubmit() {

    }

    onReady() {
        let timeInput = this.getTimeInput()
        this.onChangeDistinct(timeInput, () => { this.validateForm() })
        let dateInput = this.getDateInput()
        let callback = () => { this.validateForm() }
        dateInput.blur(() => setTimeout(callback, 100))
        this.onChangeDistinct(dateInput, () => { this.validateForm() })

        jQuery('.t-submit').click((event) => {
            if (!this.isTimeValidationRequired()) {
                this.getDateInput().val('')
                this.getTimeInput().val('')
                return
            }
            this.validateForm()
            this.validateRequiredFields()
            if (this.hasErrors()) {
                console.log('stop propagation')
                event.stopPropagation()
                this.getTimeInput().focus()
                return
            }
            console.log('no errors')
        })
        let updateFieldsVisibility = () => this.updateFieldsVisibility()
        let checkASAPDelivery = () => this.checkIfASAPDeliveryPossible()
        this.getVisibilityToggle().each(function () {
            jQuery(this).on('change', () => {
                updateFieldsVisibility()
                checkASAPDelivery()
            })
        })
        this.updateFieldsVisibility()
        this.validateForm()
        this.getDateInput().attr('data-mindate', moment().format('YYYY-MM-DD'))
    }

    setup(config: Config) {
        if (config) this.config = config
        jQuery(document).ready(() => {
            this.onReady()
        })
    }
}