(function (root, factory) {
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
    
    /**
     * Creates a wizard instance
     * @class
     * 
     * @constructor
     * 
     * @property {object}  config                - The defaults values for wizard config
     * @property {boolean} config.enableHistory  - Enable html5 history navigation
     * @property {string}  config.errorClass     - Class name that would apply on field error
     * @property {string}  config.wizardNodeId    - Id of main section that contains wizard
     * @property {boolean} config.hideNextPrevButtons - If true when hide buttons if no steps back/forward and if false disables them
     * @property {object} WizardStatusContainerConfig - Optional config allows to configure more deelply.
     * 
     */
    function PureWizard(config) {

        var self = this;

        this.config = config || {};
        this.config.enableHistory = this.config.enableHistory || false;
        this.config.errorClass = this.config.errorClass || 'has-error';

        this.statusSectionId = this.config.statusContainerCfg ? this.config.statusContainerCfg.containerId : null;
        this.pages = [];
        this.current = null;
        this.currentIndex = 0;
        this.form = document.getElementById(this.config.wizardNodeId);

        this.buttons = {
            next: this.form.querySelector('footer > .pwNext'),
            prev: this.form.querySelector('footer > .pwPrev'),
            finish: this.form.querySelector('footer > .pwFinish')
        };

        var fieldsets = this.form.children,
            i, node;

        // Divide form on pages by the fieldsets
        for (i = 0; i < fieldsets.length; i++) {
            node = fieldsets[i];
            if (node.tagName.toLowerCase() === 'fieldset') {
                // Set the first page as current
                if (this.pages.length === 0) {
                    this.pages.push(new PureWizardPage(this.config, node));
                    this.current = this.pages[0];
                } else {
                    var prev = this.pages[this.pages.length - 1];
                    var newPage = new PureWizardPage(this.config, node, prev);
                    this.pages.push(newPage);
                    prev.next = newPage;
                }
            }
        }

        //Initialize status section if property is given
        if (this.statusSectionId && document.getElementById(this.statusSectionId)) {

            var statusSectionContainer = document.getElementById(this.statusSectionId);
            this.statusSection = new WizardSteps(this.pages, statusSectionContainer, this.config.statusContainerCfg);

            statusSectionContainer.addEventListener('click', function (e) {
                e.preventDefault();
                var link = e.target;
                if (link.tagName.toLocaleLowerCase() === 'a') {
                    var pageNumber = Number(link.attributes['data-step'].value);
                    self.goToPage(self.pages[pageNumber], pageNumber);
                }
            });
        }

        // Hide all pages at start
        this.pages.forEach(function (p) {
            p.hide();
        });

        // Then show first page
        if (this.pages.length > 0) {
            this.current.show();
            if (this.statusSection) {
                this.statusSection.setStep(0);
            }
            this.toggleButtons();
        }

        if (this.config.enableHistory) {
            window.addEventListener('popstate', function (e) {
                if (e.state) {
                    self.goToPageByNumber(e.state - 1);
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
            self.goToPageByNumber(0);
        });
    }

    PureWizard.prototype.next = function () {
        if (this.current.getNext()) {
            if (this.goToPage(this.current.getNext(), this.currentIndex + 1)) {
                if (this.config.enableHistory) {
                    history.pushState(this.currentIndex + 1, null, null);
                }
            }
        }
    };

    PureWizard.prototype.prev = function () {
        if (this.current.getPrev()) {
            if (this.goToPage(this.current.getPrev(), this.currentIndex - 1)) {
                if (this.config.enableHistory) {
                    history.pushState(this.currentIndex, null, null);
                }
            }
        }
    };

    PureWizard.prototype.onPageChanged = function (callback) {
        this.form.addEventListener('onPageChanged', function (e) {
            callback(e);
        });
    };

    PureWizard.prototype.onSubmit = function (callback) {
        this.onSubmitCallback = callback;
    };

    PureWizard.prototype.goToPageByNumber = function (pageNumber) {
        this.goToPage(this.pages[pageNumber], pageNumber);
    };

    PureWizard.prototype.goToPage = function (page, step) {
        // Validate page if we go forward
        if (!this.current.isContainsError() || this.currentIndex > step) {

            // If goes for example from page 1 to 3 and page 2 is invalid
            // validate through page 2, but page 3 can be invalid
            if (this.currentIndex < step && this.currentIndex + 1 !== step) {
                if (this.pages.filter(function (p, i, arr) {
                        return !p.isValid() && (i !== step);
                    }).length > 0) {
                    return;
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

    PureWizard.prototype.toggleButtons = function () {
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

    function PureWizardPage(config, container, prev, next) {
        this.el = container;
        this.prev = prev || null;
        this.next = next || null;
        this.config = config;
    }

    PureWizardPage.prototype.getInvalidElements = function () {
        return this.el.querySelectorAll(':invalid');
    };

    PureWizardPage.prototype.isValid = function () {
        return this.getInvalidElements().length === 0;
    };
    
    PureWizardPage.prototype.isContainsError = function () {
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

    PureWizardPage.prototype.getTitle = function () {
        return this.el.querySelector('legend').innerHTML;
    };

    PureWizardPage.prototype.getNext = function () {
        return this.next;
    };
    PureWizardPage.prototype.getPrev = function () {
        return this.prev;
    };

    PureWizardPage.prototype.show = function () {
        if (this.config.hideClass) {
            this.el.className = this.el.className.replace(this.config.hideClass, '');
        } else {
            this.el.style.display = 'inline';
        }
    };

    PureWizardPage.prototype.hide = function () {
        if (this.config.hideClass) {
            this.el.className += ' ' + this.config.hideClass;
        } else {
            this.el.style.display = 'none';
        }
    };

    function WizardSteps(pages, container, config) {

        this.config = config;

        var ulClass = config.ulClass || '';
        var liClass = config.liClass || '';
        var aClass = config.aClass || '';

        this.el = document.createElement('ul');
        this.el.className += ' ' + ulClass;
        var self = this, li, a;

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

    // Highlight current step with class
    WizardSteps.prototype.setStep = function (stepNumber) {
        var currentActive = this.el.querySelector('.' + this.config.aActiveClass);
        if (currentActive) {
            currentActive.className = currentActive.className.replace(this.config.aActiveClass, '');
        }
        this.el.children[stepNumber].className += ' ' + this.config.aActiveClass;
    };

    return PureWizard;
}));
