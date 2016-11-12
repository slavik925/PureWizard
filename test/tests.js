var expect = chai.expect;

describe('Wizard Test', function () {

    'use strict';

    var wizardSimple = new PureWizard({
        wizardNodeId: 'wizardSimple',
        stepsSplitCssQuery: 'div'
    });

    wizardSimple.onSubmit(function (e) {
        document.forms['wizardSimple'].reset();
        document.getElementById('wizardSimple').style.display = 'none';
        document.getElementById('smallWizardOnComplete').style.display = 'block';
    });

    describe('Step1', function () {
        it('Step1: Form splitted correctly', function () {
            expect(wizardSimple.getCurrentPageNumber()).to.equal(0);
            expect(wizardSimple.pages.length).to.equal(3);
        });

        it('Step1: Previous button shoud be disabled/hidden', function () {
            expect(document.getElementById('prevButton').style.display).to.equal('none');
        });

        it('Step1: Next button shoud be enabled/visible', function () {
            expect(document.getElementById('nextButton').style.display).to.equal('inline');
        });

        it('Step1: Only first step visible', function () {
            expect(document.getElementById('step1').style.display).to.equal('inline');

            expect(document.getElementById('step2').style.display).to.equal('none');
            expect(document.getElementById('step3').style.display).to.equal('none');
        });
    });
    describe('Step2', function () {

        it('Step2: Move to second step', function () {
            wizardSimple.next();

            expect(document.getElementById('step1').style.display).to.equal('none');
            expect(document.getElementById('step2').style.display).to.equal('inline');
            expect(wizardSimple.getCurrentPageNumber()).to.equal(1);

        });

        it('Step2: Do not move next until not valid', function () {
            wizardSimple.next();
            expect(wizardSimple.getCurrentPageNumber()).to.equal(1);
        });

        it('Step2: Navigate next if valid', function () {
            document.getElementById('sexf').checked = true;
            wizardSimple.next();
            expect(wizardSimple.getCurrentPageNumber()).to.equal(2);
        });
    });

    describe('Step3 - Submit', function () {

        it('Step3: Not possible to submit until invalid', function () {
            document.getElementById('submitButton').click();
            expect(wizardSimple.getCurrentPageNumber()).to.equal(2);
        });

        it('Step3: Make valid and submit', function () {
            document.getElementById('agree').checked = true;
            document.getElementById('submitButton').click();

            expect(wizardSimple.getCurrentPageNumber()).to.equal(0);
        })
    });

});