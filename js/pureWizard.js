(function (root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.PureWizard = factory();
    }
}(this, function () {

    'use strict';

    var defaultConfig = {
        enableHistory: false,
        errorClass: 'has-error',
        statusContainerCfg: {},
        stepsSplitCssQuery: 'fieldset',
        hideNextPrevButtons: true,
        startPage: 0
    };

    /**
     * Creates a wizard instance
     * @class
     * @constructor
     * 
     * @property {Object}  config                        - The defaults values for wizard config
     * @property {String}  config.wizardNodeId           - Id of main section that contains wizard
     * @property {Boolean} [config.enableHistory]        - Enable html5 history navigation
     * @property {String}  [config.errorClass]           - Class name that would apply on field error
     * @property {String}  [config.stepsSplitCssQuery]   - Specify the css query that will be apply to wizard container and split into steps 
     * @property {Boolean} [config.hideNextPrevButtons]  - If true when hide buttons if no steps back/forward and if false disables them
     * @property {Object}  [config.statusContainerCfg]   - Allo to configure a status panel
     * @property {Number}  [config.startPage]            - Open form on the particular page number, starts from 0
     * 
     */
    function PureWizard(config) {

        if (!config || !config.wizardNodeId) {
            throw new Error('PureWizard initialization error - wizardNodeId should be defined');
        }

        // External config
        this.config = {};

        this.config.wizardNodeId = config.wizardNodeId;
        this.config.enableHistory = config.enableHistory || defaultConfig.enableHistory;
        this.config.errorClass = config.errorClass || defaultConfig.errorClass;
        this.config.stepsSplitCssQuery = config.stepsSplitCssQuery || defaultConfig.stepsSplitCssQuery;
        this.config.hideNextPrevButtons = config.hideNextPrevButtons || defaultConfig.hideNextPrevButtons;
        this.config.startPage = config.startPage || defaultConfig.startPage;
        this.config.statusContainerCfg = config.statusContainerCfg || defaultConfig.statusContainerCfg;

        // Internal config
        this.pages = [];
        this.current = null;
        this.currentIndex = 0;
        this.form = document.getElementById(this.config.wizardNodeId);
        this.statusSectionId = this.config.statusContainerCfg.containerId;

        this.buttons = {
            next: this.form.querySelector('.pwNext'),
            prev: this.form.querySelector('.pwPrev'),
            finish: this.form.querySelector('.pwFinish')
        };

        var
            self = this,
            fieldsets = this.form.querySelectorAll('#' + this.config.wizardNodeId + '>' + (this.config.stepsSplitCssQuery)),
            i,
            node;

        if (fieldsets.length === 0) {
            throw new Error('Can\'t find the sections to divide wizard, please check the stepsSplitCssQuery option.');
        }

        divideIntoPages();

        if (this.statusSectionId && document.getElementById(this.statusSectionId)) {
            initStatusSection();
        }

        // Hide all pages at start
        this.pages.forEach(function (p) {
            p.hide();
        });

        self.goToPageNumber(this.config.startPage, true);

        // TODO: disable for now
        if (this.config.enableHistory) {
            window.addEventListener('popstate', function (e) {
                if (e.state) {
                    self.goToPageNumber(e.state - 1);
                }
            });
            history.pushState(1, null, null);
        }

        this.buttons.next.addEventListener('click', function (e) {
            e.preventDefault();
            PureWizard.prototype.next.call(self);
        });

        this.buttons.prev.addEventListener('click', function (e) {
            e.preventDefault();
            PureWizard.prototype.prev.call(self);
        });

        this.buttons.finish.addEventListener('click', function (e) {
            e.preventDefault();
            if (!self.current.isContainsError()) {
                if (self.onSubmitCallback) {
                    self.onSubmitCallback(e, {});
                } else {
                    self.form.submit();
                }
            }
        });

        this.form.addEventListener('reset', function (e) {
            self.goToPageNumber(0);
        });

        function divideIntoPages() {
            for (i = 0; i < fieldsets.length; i++) {
                node = fieldsets[i];
                if (self.pages.length === 0) {
                    self.pages.push(new PureWizardPage(self.config, node));
                    self.current = self.pages[0];
                } else {
                    var prev = self.pages[self.pages.length - 1];
                    var newPage = new PureWizardPage(self.config, node, prev);
                    self.pages.push(newPage);
                    prev.next = newPage;
                }
            }
        }

        function initStatusSection() {
            var statusSectionContainer = document.getElementById(self.statusSectionId);
            self.statusSection = new WizardSteps(self.pages, statusSectionContainer, self.config.statusContainerCfg);

            statusSectionContainer.addEventListener('click', function (e) {
                e.preventDefault();
                var link = e.target;
                if (link.tagName.toLocaleLowerCase() === 'a') {
                    var pageNumber = Number(link.attributes['data-step'].value);
                    self.goToPage(self.pages[pageNumber], pageNumber);
                }
            });
        }
    }

    /**
     * Move to next page if present
     * @function
     */
    PureWizard.prototype.next = function PureWizard_next() {
        if (this.current.getNext()) {
            if (this.goToPage(this.current.getNext(), this.currentIndex + 1)) {
                if (this.config.enableHistory) {
                    history.pushState(this.currentIndex + 1, null, null);
                }
            }
        }
    };

    /**
     * Get current page
     * @function
     * 
     * @return {PureWizadPage}
     */
    PureWizard.prototype.getCurrentPage = function () {
        return this.current;
    };


    /**
     * Get current page index, starts from 0
     * @function
     * 
     * @return {Number}
     */
    PureWizard.prototype.getCurrentPageNumber = function () {
        return this.currentIndex;
    };

    /**
     *  @function
     *  Move to previouse page if present
     */
    PureWizard.prototype.prev = function pureWizard_prev() {
        if (this.current.getPrev()) {
            if (this.goToPage(this.current.getPrev(), this.currentIndex - 1)) {
                if (this.config.enableHistory) {
                    history.pushState(this.currentIndex, null, null);
                }
            }
        }
    };

    //TODO: maybe remove these? dupblicate onPageChanged event 
    /**
     * Subscription to an event when the page is changed
     * @function 
     * @param {Function} callback 
     */
    PureWizard.prototype.onPageChanged = function pureWizardOnPageChanged(callback) {
        this.form.addEventListener('onPageChanged', function (e) {
            callback(e);
        });
    };

    /**
     *  When the form is submit 
     *  @function
     * 
     * @param {Function} callback
     */
    PureWizard.prototype.onSubmit = function PureWizard_onSubmit(callback) {
        this.onSubmitCallback = callback;
    };

    /**
     * Go to page by number
     * @function 
     * @param {Number} pageNumber        - number of the page you whant to navigate, starts from 0
     * @param {Boolean} [skipValidation] - skip validation when switching the page 
     */
    PureWizard.prototype.goToPageNumber = function PureWizard_goToPageNumber(pageNumber, skipValidation) {
        if (pageNumber >= this.pages.length) {
            pageNumber = this.pages.length - 1;
        }
        if (pageNumber < 0) {
            pageNumber = 0;
        }
        this.goToPage(this.pages[pageNumber], pageNumber, skipValidation);
    };

    /**
     * Go to page
     * @function 
     * @param {PureWizardPage} page
     * @param {Number} page              - page number youwhant want to navigate, starts from 0
     * @param {Boolean} [skipValidation] - skip validation when switching the page 
     * 
     * @return {Boolean}
     */
    PureWizard.prototype.goToPage = function PureWizard_goToPage(page, step, skipValidation) {
        // Validate page if we go forward
        if (!this.current.isContainsError() || this.currentIndex > step || skipValidation) {
            if (!skipValidation) {
                // If goes for example from page 1 to 3 and page 2 is invalid
                // validate through page 2, but page 3 can be invalid
                if (this.currentIndex < step && this.currentIndex + 1 !== step) {
                    if (this.pages.filter(function (p, i, arr) {
                            return !p.isValid() && (i !== step);
                        }).length > 0) {
                        return;
                    }
                }
            }

            var indexBefore = this.currentIndex;

            this.current.hide();
            this.current = page;
            this.current.show();
            this.currentIndex = step;

            // Update the status section
            if (this.statusSection) {
                this.statusSection.setStep(step);
            }

            this.toggleButtons();

            var event = new CustomEvent('onPageChanged', {
                detail: {
                    'pageBefore': indexBefore + 1,
                    'pageAfter': this.currentIndex + 1
                }
            });
            this.form.dispatchEvent(event);

            return true;
        }

        return false;
    };

    /**
     * Toggle next, prev, submit buttons state depending the current wizard states
     * @function 
     */
    PureWizard.prototype.toggleButtons = function PureWizard_toggleButtons() {
        var self = this;

        self.buttons.finish.style.display = 'none';

        if (!this.current.getPrev()) {
            setNextPrevVisibility(self.buttons.prev, false);
        } else {
            setNextPrevVisibility(self.buttons.prev, true);
        }
        if (!this.current.getNext()) {
            setNextPrevVisibility(self.buttons.next, false);
            self.buttons.finish.style.display = 'inline';
        } else {
            setNextPrevVisibility(self.buttons.next, true);
        }

        function setNextPrevVisibility(button, value) {
            if (self.config.hideNextPrevButtons) {
                button.style.display = value ? 'inline' : 'none';
            } else {
                button.disabled = !value;
            }
        }
    };


    /**
     * Represents a single page
     * @class
     * @constructor
     * 
     * @param {object} config
     * @param {any} container
     * @param {any} prev
     * @param {any} next
     */
    function PureWizardPage(config, container, prev, next) {
        this.el = container;
        this.prev = prev || null;
        this.next = next || null;
        this.config = config;
    }

    /**
     * Return invalid elements from the page
     * @function
     * 
     * @return {NodeList}
     */
    PureWizardPage.prototype.getInvalidElements = function PureWizardPage_getInvalidElements() {
        return this.el.querySelectorAll(':invalid');
    };

    /**
     * Check if the page is valid
     * @function
     * 
     * @return {Boolean}
     */
    PureWizardPage.prototype.isValid = function PureWizardPage_isValid() {
        return this.getInvalidElements().length === 0;
    };

    /**
     * Check if the page has errors
     * @function
     * 
     * @return {Boolean}
     */
    PureWizardPage.prototype.isContainsError = function PureWizardPage_isContainsError() {
        var invalidInputs = this.getInvalidElements(),
            containsErrors = false,
            i, invalidInputLabel, errorMsg, errorMsgContainer;

        for (i = 0; i < invalidInputs.length; i++) {
            invalidInputLabel = this.el.querySelector('label[for="' + invalidInputs[i].id + '"]');

            if (invalidInputs[i].className.indexOf(this.config.errorClass) === -1) {

                invalidInputs[i].className += ' ' + this.config.errorClass;
                if (invalidInputLabel && invalidInputLabel.className.indexOf(this.config.errorClass) === -1) {
                    invalidInputLabel.className += ' ' + this.config.errorClass;
                }
                // If error message and error container exists display error
                errorMsg = invalidInputs[i].getAttribute('data-error-msg');
                errorMsgContainer = document.getElementById(invalidInputs[i].id + 'Error');
                if (errorMsg && errorMsgContainer) {
                    errorMsgContainer.innerHTML = errorMsg;
                }
            }
            containsErrors = true;
        }

        // Clean the errors from valid elements
        var cssClass = this.config.errorClass ? '.' + this.config.errorClass : '';
        var validElements = this.el.querySelectorAll(cssClass + ':valid');
        for (i = 0; i < validElements.length; i++) {
            validElements[i].className = validElements[i].className.replace(this.config.errorClass, '');

            invalidInputLabel = this.el.querySelector('label[for="' + validElements[i].id + '"]');
            errorMsgContainer = document.getElementById(validElements[i].id + 'Error');

            if (invalidInputLabel) {
                invalidInputLabel.className = invalidInputLabel.className.replace(this.config.errorClass, '');
            }
            if (errorMsgContainer) {
                errorMsgContainer.innerHTML = '';
            }
        }
        return containsErrors;
    };

    /**
     * Get page title
     * @function 
     */
    PureWizardPage.prototype.getTitle = function PureWizardPage_getTitle() {
        return this.el.querySelector('legend').innerHTML;
    };

    /**
     * Return the next page
     * @function 
     * 
     * @return {PureWizardPage}
     */
    PureWizardPage.prototype.getNext = function () {
        return this.next;
    };

    /**
     * Return the previouse page
     * @function
     * 
     * @return {PureWizardPage}
     */
    PureWizardPage.prototype.getPrev = function () {
        return this.prev;
    };

    /**
     * Show the page
     * @function
     */
    PureWizardPage.prototype.show = function () {
        if (this.config.hideClass) {
            this.el.className = this.el.className.replace(this.config.hideClass, '');
        } else {
            this.el.style.display = 'inline';
        }
    };

    /**
     * Hide the page
     * @function
     */
    PureWizardPage.prototype.hide = function () {
        if (this.config.hideClass) {
            this.el.className += ' ' + this.config.hideClass;
        } else {
            this.el.style.display = 'none';
        }
    };


    /**
     * Section with steps
     * @class
     * @constructor
     * 
     * @param {PureWizardPage} pages    - The list with all pages
     * @param {HTMLElement} container   - Container where the steps are located
     * @param {Object} config           - Additional config object
     * @param {String} config.ulClass   - Add custom ul class
     * @param {String} config.liClass   - Add custom li class
     * @param {String} config.aClass    - Add custom a class
     */
    function WizardSteps(pages, container, config) {

        this.config = config;

        var ulClass = config.ulClass || '';
        var liClass = config.liClass || '';
        var aClass = config.aClass || '';

        this.el = document.createElement('ul');
        this.el.className += ' ' + ulClass;
        var self = this,
            li, a;

        // Populate status sections items
        pages.forEach(function (e, i) {
            li = document.createElement('li');
            a = document.createElement('a');
            li.className += ' ' + liClass;
            a.setAttribute('href', '#');
            a.setAttribute('data-step', i.toString());
            a.appendChild(document.createTextNode(e.getTitle()));
            a.className += ' ' + aClass;
            li.appendChild(a);
            self.el.appendChild(li);
        });
        container.appendChild(self.el);
    }

    /**
     * Highlight current step with class
     * @function
     * @param {Number} stepNumber Make the step active, starts from 0
     */
    WizardSteps.prototype.setStep = function (stepNumber) {
        var currentActive = this.el.querySelector('.' + this.config.aActiveClass);
        if (currentActive) {
            currentActive.className = currentActive.className.replace(this.config.aActiveClass, '');
        }
        this.el.children[stepNumber].className += ' ' + this.config.aActiveClass;
    };

    return PureWizard;
}));