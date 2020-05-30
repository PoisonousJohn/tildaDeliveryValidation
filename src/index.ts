import * as jQuery from "jquery";
import * as moment from 'moment';

class Errors {
    time: string
    date: string
}

export class Config {
    timeDeliveryToggleName = "Хотите получить заказ как можно скорее или к определенному времени"
    timeDeliveryVisibleValue = "К определенному времени"
    timeInputName = "Время доставки ТОЛЬКО С 12:00"
    dateInputName = "Дата доставки "
    orderStartTime = "12:00"
    orderEndTime = "22:30"
    orderStartEndTimeError = "Мы принимаем заказы с 12:00 до 22:30"
    minOrderPreparationTimeMinutes = 60
    minTimeError = "Для приготовления заказа нужно минимум 60 минут."
    incorrectDateError = "Пожалуйста введите дату в формате ДД-ММ-ГГГГ"
    incorrectTimeError = "Пожалуйста введите время в формате ЧЧ:ММ"
}

export class DeliveryValidation {
    config = new Config()
    errors = new Errors()

    clearErrors() {
        this.errors = new Errors()
    }

    isTimeValid() {
        let val = this.getTimeInput().val();
        if (!val || val.toString().includes('_')) return true;
        return moment(val, 'HH:mm').isValid();
    }

    isDateValid() {
        let val = this.getDateInput().val();
        if (!val || val.toString().includes('_')) return true;
        return moment(val, 'DD-MM-YYYY').isValid();
    }

    showErrors() {
        this.showInputError(this.getTimeInput(), this.errors.time);
        this.showInputError(this.getDateInput(), this.errors.date);
    }

    validateFormat() {
        this.errors.date = !this.isDateValid() ? this.config.incorrectDateError : null;
        this.errors.time = !this.isTimeValid() ? this.config.incorrectTimeError : null;
    }

    isDateEmpty() {
        let val = this.getDateInput().val();
        return !val || val.toString().includes('_');
    }

    isTimeEmpty() {
        let val = this.getTimeInput().val();
        return !val || val.toString().includes('_');
    }

    hasErrors() {
        return this.errors.date || this.errors.time;
    }

    validateRequiredFields() {
        if (this.isTimeEmpty())
            this.errors.time = 'Обязательное поле';
        if (this.isDateEmpty())
            this.errors.date = 'Обязательное поле';
        this.showErrors();
    }

    validateForm() {
        this.clearErrors();
        this.showErrors();
        if (this.isTimeValidationRequired())
            this.validateTimeRange();
        return this.hasErrors();
    }

    validateTimeRange(): void {
        this.validateFormat();
        if (!this.isTimeEmpty() && !this.isDateEmpty() && !this.hasErrors()) {
            let currentTime = moment();
            let parsedTime = moment(this.getDateInput().val() + ' ' + this.getTimeInput().val(), 'DD-MM-YYYY HH:mm');
            if (!parsedTime.isValid()) return null;
            let startTime = moment(this.config.orderStartTime, 'HH:mm');
            let endTime = moment(this.config.orderEndTime, 'HH:mm');
            let parsedTimeOnly = moment(parsedTime.format('HH:mm'), 'HH:mm');
            let isInRange = parsedTimeOnly.isBetween(startTime, endTime) || parsedTimeOnly.isSame(startTime) || parsedTimeOnly.isSame(endTime);
            let minTime = currentTime.add(this.config.minOrderPreparationTimeMinutes, 'minutes');
            let isPreparationTimeSatisfied = parsedTime.isAfter(minTime);
            this.errors.time = !isInRange ? this.config.orderStartEndTimeError : null;
            if (!this.errors.time) {
                this.errors.time = !isPreparationTimeSatisfied ? this.config.minTimeError : null;
            }
        }
        this.showErrors();
    }

    isTimeValidationRequired() {
        return this.getVisibilityToggle().filter(':checked').val() == this.config.timeDeliveryVisibleValue;
    }

    updateFieldsVisibility() {
        let visible = this.isTimeValidationRequired();
        if (visible) {
            this.getTimeInput().parents('.t-input-group').show();
            this.getDateInput().parents('.t-input-group').show();
        }
        else {
            this.getTimeInput().parents('.t-input-group').hide();
            this.getDateInput().parents('.t-input-group').hide();
        }
    }

    onChangeDistinct(el: JQuery<any>, callback: (el: JQuery<any>, val: string) => void) {
        el.keyup(() => {
            let val = el.val();

            if (el.data("lastval") != val) {
                el.data("lastval", val);
                callback(el, val.toString());
            }
        });
    }

    showInputError(el: JQuery<any>, error: string) {
        let errorControl = jQuery(el).parents('.t-input-group');
        if (error)
            errorControl.addClass('js-error-control-box');
        else
            errorControl.removeClass('js-error-control-box');
        el.next().text(error);
    }

    getVisibilityToggle() {
        return jQuery('[name="' + this.config.timeDeliveryToggleName + '"]');
    }

    getTimeInput() {
        return jQuery('input[name="' + this.config.timeInputName + '"]');
    }

    getDateInput() {
        return jQuery('input[name="' + this.config.dateInputName + '"]');
    }

    onFormSubmit() {

    }

    onReady() {
        let timeInput = this.getTimeInput();
        this.onChangeDistinct(timeInput, () => { this.validateForm(); });
        let dateInput = this.getDateInput();
        let callback = () => { this.validateForm(); }
        dateInput.blur(() => setTimeout(callback, 100));
        this.onChangeDistinct(dateInput, () => { this.validateForm(); })

        jQuery('.t-submit').click((event) => {
            if (!this.isTimeValidationRequired()) {
                this.getDateInput().val('');
                this.getTimeInput().val('');
                return;
            }
            this.validateForm();
            this.validateRequiredFields();
            if (this.hasErrors()) {
                console.log('stop propagation');
                event.stopPropagation();
                this.getTimeInput().focus();
                return;
            }
            console.log('no errors');
        });
        let updateFieldsVisibility = () => this.updateFieldsVisibility();
        this.getVisibilityToggle().each(function () { jQuery(this).on('change', () => updateFieldsVisibility()); });
        this.updateFieldsVisibility();
        this.validateForm();
        this.getDateInput().attr('data-mindate', moment().format('YYYY-MM-DD'));
    }

    setup(config: Config) {
        if (config) this.config = config;
        jQuery(document).ready(() => {
            this.onReady();
        });
    }
}