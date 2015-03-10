function Wizard(formId, statusSectionId) {
    var self = this;

    this.formId = formId;
    this.statusSectionId = statusSectionId || null;
    this.pages = [];
    this.current = null;

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

    var ul, li;

    if (this.statusSectionId) {
        this.statusSection = document.getElementById(this.statusSectionId);
        ul = document.createElement('ul');
    }

    this.pages.forEach(function (p, i) {
        p.hide();
        li = document.createElement('li');
        li.appendChild(document.createTextNode('Step ' + (i + 1)));
        ul.appendChild(li);
    });

    if (this.statusSection) {
        this.statusSection.appendChild(ul);
    }

    if (this.pages.length > 0) {
        this.current = this.pages[0];
        this.current.show();
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
        this.toggleButtons();
    }
};

Wizard.prototype.prev = function () {
    if (this.current.getPrev()) {
        this.current.hide();
        this.current = this.current.getPrev();
        this.current.show();
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