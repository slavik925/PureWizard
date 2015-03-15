function Wizard(config) {

    var self = this;

    this.config = config;
    this.statusSectionId = this.config.statusContainerCfg ? this.config.statusContainerCfg.containerId : null;
    this.pages = [];
    this.current = null;
    this.currentIndex = 0;
    this.form = document.getElementById(this.config.containerId);

    var fieldsets = this.form.children,
        i, node;

    for (i = 0; i < fieldsets.length; i++) {
        node = fieldsets[i];
        if (node.tagName.toLowerCase() === 'fieldset') {
            if (this.pages.length === 0) {
                this.pages.push(new Page(node.id));
                this.current = this.pages[0];
            } else {
                var prev = this.pages[this.pages.length - 1];
                var newPage = new Page(node.id, prev);
                this.pages.push(newPage);
                prev.next = newPage;
            }
        }
    }

    if (this.statusSectionId && document.getElementById(this.statusSectionId)) {
        var statusSectionContainer = document.getElementById(this.statusSectionId);
        this.statusSection = new WizardSteps(this.pages, statusSectionContainer, this.config.statusContainerCfg);
        statusSectionContainer.addEventListener('click', function (e) {
            var link = e.target;
            if (link.tagName.toLocaleLowerCase() === 'a') {
                var pageNumber = Number(link.attributes['data-step'].value);
                self.goToPage(self.pages[pageNumber], pageNumber);
            }
        });
    }

    this.pages.forEach(function (p) {
        p.hide();
    });

    if (this.pages.length > 0) {
        this.current = this.pages[0];
        this.current.show();
        if (this.statusSection) {
            this.statusSection.setStep(0);
        }
        this.toggleButtons();
    }

    document.getElementById('next').addEventListener('click', function (e) {
        e.preventDefault();
        Wizard.prototype.next.call(self);
    });
    document.getElementById('prev').addEventListener('click', function (e) {
        e.preventDefault();
        Wizard.prototype.prev.call(self);
    });

    document.getElementById('finish').addEventListener('click', function (e) {
        e.preventDefault();
        if (!self.current.isContainsError()) {
            self.form.submit();
        }
    });
}
Wizard.prototype.next = function () {
    if (this.current.getNext()) {
        this.goToPage(this.current.getNext(), this.currentIndex + 1);
    }
};

Wizard.prototype.prev = function () {
    if (this.current.getPrev()) {
        this.goToPage(this.current.getPrev(), this.currentIndex - 1);
    }
};

Wizard.prototype.onPageChange = function (callback) {
    this.form.addEventListener('onPageChanged', function (e) {
        callback(e);
    });
};

Wizard.prototype.goToPage = function (page, step) {
    if (!this.current.isContainsError() || this.currentIndex > step) {

        var indexBefore = this.currentIndex;

        this.current.hide();
        this.current = page;
        this.current.show();
        this.currentIndex = step;
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
    }
};

Wizard.prototype.toggleButtons = function () {
    var prev = document.getElementById('prev'),
        next = document.getElementById('next'),
        finish = document.getElementById('finish'),
        self = this;

    finish.style.display = 'none';

    if (!this.current.getPrev()) {
        setNextPrevVisibility(prev, false);
    } else {
        setNextPrevVisibility(prev, true);
    }
    if (!this.current.getNext()) {
        setNextPrevVisibility(next, false);
        finish.style.display = 'inline';
    } else {
        setNextPrevVisibility(next, true);
    }

    function setNextPrevVisibility(button, value) {
        if (self.config.hideNextPrevButtons) {
            button.style.display = value ? 'inline' : 'none';
        } else {
            button.disabled = !value;
        }
    }
};

function Page(formId, prev, next) {
    this.containerId = formId;
    this.prev = prev || null;
    this.next = next || null;
    this.el = document.getElementById(this.containerId);
}

Page.prototype.isContainsError = function () {
    var invalidInputs = this.el.querySelectorAll(':invalid'),
        containsErrors = false,
        i, invalidInputLabel, errorMsg, errorMsgContainer;

    for (i = 0; i < invalidInputs.length; i++) {
        invalidInputLabel = this.el.querySelector('label[for="' + invalidInputs[i].id + '"]');

        if (invalidInputs[i].className.indexOf('has-error') === -1) {

            invalidInputs[i].className += ' has-error';
            if (invalidInputLabel && invalidInputLabel.className.indexOf('has-error') === -1) {
                invalidInputLabel.className += ' has-error';
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
    var validElements = this.el.querySelectorAll('.has-error:valid');
    for (i = 0; i < validElements.length; i++) {
        validElements[i].className = validElements[i].className.replace('has-error', '');

        invalidInputLabel = this.el.querySelector('label[for="' + validElements[i].id + '"]');
        errorMsgContainer = document.getElementById(validElements[i].id + 'Error');

        if (invalidInputLabel) {
            invalidInputLabel.className = invalidInputLabel.className.replace('has-error', '');
        }
        if (errorMsgContainer) {
            errorMsgContainer.innerHTML = '';
        }
    }
    return containsErrors;
};

Page.prototype.getTitle = function () {
    return this.el.querySelector('legend').innerHTML;
};

Page.prototype.getNext = function () {
    return this.next;
};
Page.prototype.getPrev = function () {
    return this.prev;
};

Page.prototype.show = function () {
    this.el.style.display = 'inline';
};

Page.prototype.hide = function () {
    this.el.style.display = 'none';
};

function WizardSteps(pages, container, config) {

    var ulClass = config.ulClass || '';
    var liClass = config.liClass || '';
    var aClass = config.aClass || '';

    this.el = document.createElement('ul');
    this.el.className += ' ' + ulClass;
    var self = this, li, a;

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

WizardSteps.prototype.setStep = function (stepNumber) {
    for (var i = 0; i < this.el.children.length; i++) {
        this.el.children[i].style.fontWeight = 'normal';
    }
    this.el.children[stepNumber].style.fontWeight = 'bold';
};
