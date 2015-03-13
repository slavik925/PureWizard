function Wizard(formId, statusSectionId) {

    var self = this;

    this.formId = formId;
    this.statusSectionId = statusSectionId || null;
    this.pages = [];
    this.current = null;
    this.currentIndex = 0;

    var fieldsets = document.getElementById(this.formId).children,
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
        this.statusSection = new WizardSteps(this.pages, statusSectionContainer);
        statusSectionContainer.addEventListener('click', function (e) {
            var link = e.target;
            if (link.tagName.toLocaleLowerCase() === 'a') {
                var pageNumber = Number(link.attributes['data-step'].value);
                console.log('Status section click go to page ' + pageNumber);
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

Wizard.prototype.goToPage = function (page, step) {
    if (!this.current.isContainsError()) {
        this.current.hide();
        this.current = page;
        this.current.show();
        this.currentIndex = step;
        if (this.statusSection) {
            this.statusSection.setStep(step);
        }
        this.toggleButtons();
    }
};

Wizard.prototype.toggleButtons = function () {
    var prev = document.getElementById('prev'),
        next = document.getElementById('next'),
        finish = document.getElementById('finish');

    finish.style.display = 'none';

    if (!this.current.getPrev()) {
        prev.style.display = 'none';
    } else {
        prev.style.display = 'inline';
    }
    if (!this.current.getNext()) {
        next.style.display = 'none';
        finish.style.display = 'inline';
    } else {
        next.style.display = 'inline';
    }
};

function Page(formId, prev, next) {
    this.containerId = formId;
    this.prev = prev || null;
    this.next = next || null;
    this.el = document.getElementById(this.containerId);
}

Page.prototype.isContainsError = function () {
    var requiredInputs = this.el.querySelectorAll(':required'),
        containsErrors = false;

    for (var i = 0; i < requiredInputs.length; i++) {
        if (!requiredInputs[i].checkValidity()) {
            requiredInputs[i].parentNode.className += ' has-error';
            containsErrors = true;
        }
    }

    return containsErrors;
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

function WizardSteps(pages, container, wizard) {

    this.el = document.createElement('ul');
    this.el.className += ' list-group';
    var self = this, li, a;

    pages.forEach(function (e, i) {
        li = document.createElement('li');
        a = document.createElement('a');
        li.className += ' list-group-item';
        a.setAttribute('href', '#');
        a.setAttribute('data-step', i.toString());
        a.appendChild(document.createTextNode('Step ' + (i + 1)));
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
