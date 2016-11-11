var expect = chai.expect;

describe('Wizard Test', function () {

    'use strict';

    var wizardSimple = new PureWizard({
        wizardNodeId: 'wizardSimple',
        hideNextPrevButtons: true,
        stepsSplitCssQuery: 'div'
    });

    it('Form splitted correctly', function () {
        expect(wizardSimple.getCurrentPageNumber()).to.equal(0);
        expect(wizardSimple.pages.length).to.equal(3);
    });

    it('Only first step visible', function () {
        expect(document.getElementById('step1').style.display).to.equal('inline');

        expect(document.getElementById('step2').style.display).to.equal('none');
        expect(document.getElementById('step3').style.display).to.equal('none');
    });

    it('Move to second step', function () {
        wizardSimple.next();

        expect(document.getElementById('step1').style.display).to.equal('none');
        expect(document.getElementById('step2').style.display).to.equal('inline');
        expect(wizardSimple.getCurrentPageNumber()).to.equal(1);

    });

});