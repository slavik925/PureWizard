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

    if (this.statusSectionId) {
        this.statusSection = new WizardSteps(this.pages, document.getElementById(this.statusSectionId));
    }

    this.pages.forEach(function (p) {
        p.hide();
    });

    if (this.pages.length > 0) {
        this.current = this.pages[0];
        this.current.show();
        this.statusSection.setStep(0);
        this.toggleButtons();
    }

    document.getElementById('next').addEventListener('click', function () {
        Wizard.prototype.next.call(self);
    });
    document.getElementById('prev').addEventListener('click', function () {
        Wizard.prototype.prev.call(self);
    });
}
Wizard.prototype.next = function () {
    if (this.current.getNext) {
        this.current.hide();
        this.current = this.current.getNext();
        this.current.show();
        this.statusSection.setStep(++this.currentIndex);
        this.toggleButtons();
    }
};

Wizard.prototype.prev = function () {
    if (this.current.getPrev()) {
        this.current.hide();
        this.current = this.current.getPrev();
        this.current.show();
        this.statusSection.setStep(--this.currentIndex);
        this.toggleButtons();
    }
};

Wizard.prototype.toggleButtons = function () {
    var prev = document.getElementById('prev'),
        next = document.getElementById('next');
    if (!this.current.getPrev()) {
        prev.style.display = 'none';
    } else {
        prev.style.display = 'inline';
    }
    if (!this.current.getNext()) {
        next.style.display = 'none';
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

function WizardSteps(pages, container) {

    this.el = document.createElement('ul');
    var self = this, li;

    pages.forEach(function (e, i) {
        li = document.createElement('li');
        li.appendChild(document.createTextNode('Step ' + (i + 1)));
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
