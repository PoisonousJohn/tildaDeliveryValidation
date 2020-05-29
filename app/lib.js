"use strict";
exports.__esModule = true;
exports.DeliveryValidation = exports.Config = void 0;
var jQuery = require("jquery");
var moment = require("moment");
var Errors = (function () {
    function Errors() {
    }
    return Errors;
}());
var Config = (function () {
    function Config() {
    }
    return Config;
}());
exports.Config = Config;
var DeliveryValidation = (function () {
    function DeliveryValidation() {
        this.config = new Config();
        this.errors = new Errors();
    }
    DeliveryValidation.prototype.clearErrors = function () {
        this.errors = new Errors();
    };
    DeliveryValidation.prototype.isTimeValid = function () {
        var val = this.getTimeInput().val();
        if (!val || val.toString().includes('_'))
            return true;
        return moment(val, 'HH:mm').isValid();
    };
    DeliveryValidation.prototype.isDateValid = function () {
        var val = this.getDateInput().val();
        if (!val || val.toString().includes('_'))
            return true;
        return moment(val, 'DD-MM-YYYY').isValid();
    };
    DeliveryValidation.prototype.showErrors = function () {
        this.showInputError(this.getTimeInput(), this.errors.time);
        this.showInputError(this.getDateInput(), this.errors.date);
    };
    DeliveryValidation.prototype.validateFormat = function () {
        this.errors.date = !this.isDateValid() ? this.config.incorrectDateError : null;
        this.errors.time = !this.isTimeValid() ? this.config.incorrectTimeError : null;
    };
    DeliveryValidation.prototype.isDateEmpty = function () {
        var val = this.getDateInput().val();
        return !val || val.toString().includes('_');
    };
    DeliveryValidation.prototype.isTimeEmpty = function () {
        var val = this.getTimeInput().val();
        return !val || val.toString().includes('_');
    };
    DeliveryValidation.prototype.hasErrors = function () {
        return this.errors.date || this.errors.time;
    };
    DeliveryValidation.prototype.validateRequiredFields = function () {
        if (this.isTimeEmpty())
            this.errors.time = 'Обязательное поле';
        if (this.isDateEmpty())
            this.errors.date = 'Обязательное поле';
        this.showErrors();
    };
    DeliveryValidation.prototype.validateForm = function () {
        this.clearErrors();
        this.showErrors();
        if (this.isTimeValidationRequired())
            this.validateTimeRange();
        return this.hasErrors();
    };
    DeliveryValidation.prototype.validateTimeRange = function () {
        this.validateFormat();
        if (!this.isTimeEmpty() && !this.isDateEmpty() && !this.hasErrors()) {
            var currentTime = moment();
            var parsedTime = moment(this.getDateInput().val() + ' ' + this.getTimeInput().val(), 'DD-MM-YYYY HH:mm');
            if (!parsedTime.isValid())
                return null;
            var startTime = moment(this.config.orderStartTime, 'HH:mm');
            var endTime = moment(this.config.orderEndTime, 'HH:mm');
            var parsedTimeOnly = moment(parsedTime.format('HH:mm'), 'HH:mm');
            var isInRange = parsedTimeOnly.isBetween(startTime, endTime) || parsedTimeOnly.isSame(startTime) || parsedTimeOnly.isSame(endTime);
            var minTime = currentTime.add(this.config.minOrderPreparationTimeMinutes, 'minutes');
            console.log(JSON.stringify({
                parsedTime: parsedTime, startTime: startTime, endTime: endTime, parsedTimeOnly: parsedTimeOnly, minTime: minTime
            }));
            var isPreparationTimeSatisfied = parsedTime.isAfter(minTime);
            this.errors.time = !isInRange ? this.config.orderStartEndTimeError : null;
            if (!this.errors.time) {
                this.errors.time = !isPreparationTimeSatisfied ? this.config.minTimeError : null;
            }
        }
        this.showErrors();
    };
    DeliveryValidation.prototype.isTimeValidationRequired = function () {
        return this.getVisibilityToggle().filter(':checked').val() == this.config.timeDeliveryVisibleValue;
    };
    DeliveryValidation.prototype.updateFieldsVisibility = function () {
        var visible = this.isTimeValidationRequired();
        if (visible) {
            this.getTimeInput().parents('.t-input-group').show();
            this.getDateInput().parents('.t-input-group').show();
        }
        else {
            this.getTimeInput().parents('.t-input-group').hide();
            this.getDateInput().parents('.t-input-group').hide();
        }
    };
    DeliveryValidation.prototype.onChangeDistinct = function (el, callback) {
        this.getDateInput();
        el.keyup(function (event) {
            var input = jQuery(this);
            var val = input.val();
            if (input.data("lastval") != val) {
                input.data("lastval", val);
                callback(el, val.toString());
            }
        });
    };
    DeliveryValidation.prototype.showInputError = function (el, error) {
        var errorControl = jQuery(el).parents('.t-input-group');
        if (error)
            errorControl.addClass('js-error-control-box');
        else
            errorControl.removeClass('js-error-control-box');
        el.next().text(error);
    };
    DeliveryValidation.prototype.getVisibilityToggle = function () {
        return jQuery('[name="' + this.config.timeDeliveryToggleName + '"]');
    };
    DeliveryValidation.prototype.getTimeInput = function () {
        return jQuery('input[name="' + this.config.timeInputName + '"]');
    };
    DeliveryValidation.prototype.getDateInput = function () {
        return jQuery('input[name="' + this.config.dateInputName + '"]');
    };
    DeliveryValidation.prototype.onReady = function () {
        var _this = this;
        var timeInput = this.getTimeInput();
        this.onChangeDistinct(timeInput, this.validateForm);
        var dateInput = this.getDateInput();
        var callback = this.validateForm;
        dateInput.blur(function () { return setTimeout(callback, 100); });
        this.onChangeDistinct(dateInput, this.validateForm);
        jQuery('.t-submit').click(function (event) {
            _this.validateForm();
            _this.validateRequiredFields();
            if (_this.hasErrors()) {
                event.stopPropagation();
                _this.getTimeInput().focus();
                return false;
            }
        });
        var updateFieldsVisibility = this.updateFieldsVisibility;
        this.getVisibilityToggle().each(function () {
            jQuery(this).on('change', updateFieldsVisibility);
        });
        this.updateFieldsVisibility();
        this.validateForm();
        this.getDateInput().attr('data-mindate', moment().format('YYYY-MM-DD'));
    };
    return DeliveryValidation;
}());
exports.DeliveryValidation = DeliveryValidation;
//# sourceMappingURL=app.js.map