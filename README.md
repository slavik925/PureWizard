PureWizard
==========
#### What is this for?

It's a javascript plugin that can transform any kind of form into the wizard.

Here is the list of the main features:

* No side libraries required, written in pure javascript.
* Fully customizable. Form complexity depends only on layout.
* Supports AMD and common js
* Native browser validation and custom validation messages.
* Documented and tested code.

### Demo and Documentation

[PureCSS version](https://slavik925.github.io/PureWizard/html/wizard)

[Bootstrap version](https://slavik925.github.io/PureWizard/html/wizard_bootstrap)

[Documentation](https://slavik925.github.io/PureWizard/)

### How to use

* Create a form with wizard inside and divide it with the fieldset or any other element.

```html
<form id="wizardForm">
    <!-- 
    By default it will automatically split the form by the fielsets
    into the pages but you are free to use any elements.
    -->    
    <fieldset id="step1">
        <!--
             Optional: if you are using status container then titles 
             will be generated from this place 
        -->    
        <legend class="pwStepTitle">Step 1: First Step</legend>

        ...
        
        <!-- By default the errors will be printed in the label with the "has-error" class -->
        <label for="modelNumber">Model Number <sup>*</sup> <sup
                                            class="has-error has-error-label" id="modelNumberError"></sup></label>
        <!-- All the validations are done only through HTML, but you could add some custom validation messages. -->
        <input name="modelNumber" required data-error-msg="Should be between 0 and 100" type="number" max="100" min="0" />
        ...
    </fieldset>

    <fieldset id="step1">
        <legend class="pwStepTitle">Step 2: Second Step</legend>
        ...
    </fieldset>

    <!--
        Then you need buttons with the pw classes to control the wizard:
    -->
    <footer>
        <button class="pwPrev">Prev</button>
        <button class="pwNext">Next</button>
        <button class="pwFinish">Finish</button>
    </footer>
</form>

<!-- 
    Optional: you could add auto generated status section to show all steps, current step, step title.
    Also this allow to do additional navigation between steps.
-->
<div>
    <span>Wizard Steps</span>

     <!-- 
     No strict structure here.
     Navigation  will be generated automatically in 'wizardStatusContainer' container
     as menu with ul -> li -> a structure
    -->
    <section id="wizardStatusContainer">
    </section>
</div>
```  

* Add and configure the plugin:

```javascript

    // Optional, could be configured without status container
    var WizardStatusContainerConfig = {
        containerId: 'wizardStatusContainer',
        ulClass: '',
        liClass: '',
        aClass: '',
        aActiveClass: 'pwNavActive'
    };

    var wizardConf = {
        wizardNodeId: 'submitWizard',
        statusContainerCfg: WizardStatusContainerConfig,
        errorClass: 'has-error'
    };

    var wizard = new PureWizard( wizardConf );

    //onPageChanged callback
    wizard.onPageChanged( function( e ) {
        console.log( 'Changed page from ' + e.detail.previousPage + ' to ' + e.detail.currentPage );
    } );

    //onSubmit callback
    wizardSimple.onSubmit( function( e ) {
        //....
    });
```
#### Tests
To run the tests just launch test/index.html

#### Browser support:

* Chrome
* Firefox
* Opera 11.50
* Safari 6.0
* IE 10