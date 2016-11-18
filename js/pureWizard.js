(function( root, factory ) {

    'use strict';

    if( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define( [], factory );
    } else if( typeof exports === 'object' ) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.PureWizard = factory();
    }
}( this, function() {

    'use strict';

    var defaultConfig = {
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
     * @param    {Object}  config                                - The defaults values for wizard config
     * @property {String}  config.wizardNodeId                   - Id of main section that contains wizard
     * @property {String}  [config.errorClass='has-error']       - Class name that would apply on field error
     * @property {String}  [config.stepsSplitCssQuery='fieldset'] - Specify the css query that will be apply to wizard container and split into steps
     * @property {Boolean} [config.hideNextPrevButtons='true']  - If true when hide buttons if no steps back/forward and if false disables them
     * @property {Object}  [config.statusContainerCfg='{}']      - Allo to configure a status panel
     * @property {Number}  [config.startPage='0']               - Open form on the particular page number, starts from 0
     *
     * The wizard uses main three buttons to operate that should be with following css classes:
     *   next button          - 'pwNext'
     *   previouse button     - 'pwPrev'
     *   final/submit button   - 'pwFinish'
     *
     */
    function PureWizard( config ) {

        if( !config || !config.wizardNodeId ) {
            throw new Error( 'PureWizard init error - wizardNodeId should be defined' );
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
        this.form = document.getElementById( this.config.wizardNodeId );
        this.statusSectionId = this.config.statusContainerCfg.containerId;

        this.buttons = {
            next: this.form.querySelector( '.pwNext' ),
            prev: this.form.querySelector( '.pwPrev' ),
            finish: this.form.querySelector( '.pwFinish' )
        };

        this.buttonsInitialDisplay = {
            next: this.buttons.next.style.display,
            prev: this.buttons.prev.style.display,
            finish: this.buttons.finish.style.display
        };

        if( !this.buttons.next ) {
            throw new Error( 'PureWizard init error - next button not found, create one with class \'pwNext\'' );
        }

        if( !this.buttons.prev ) {
            throw new Error( 'PureWizard init error - previouse button not found, create one with class \'pwPrev\'' );
        }

        var
            self = this,
            fieldsets = this.form.querySelectorAll( '#' + this.config.wizardNodeId + '>' + (this.config.stepsSplitCssQuery) ),
            i,
            node;

        if( fieldsets.length === 0 ) {
            throw new Error( 'Can\'t find the sections to divide wizard, please check the stepsSplitCssQuery option.' );
        }

        divideIntoPages();

        if( this.statusSectionId && document.getElementById( this.statusSectionId ) ) {
            initStatusSection();
        }

        // Hide all pages at start
        this.pages.forEach( function( p ) {
            p.hide();
        } );

        self.goToPage( this.config.startPage, true );

        this.buttons.next.addEventListener( 'click', function( e ) {
            PureWizard.prototype.next.call( self );
        } );

        this.buttons.prev.addEventListener( 'click', function( e ) {
            PureWizard.prototype.prev.call( self );
        } );

        if( this.buttons.finish ) {
            this.buttons.finish.addEventListener( 'click', function( e ) {
                if( !self.current.toggleErrors() ) {
                    if( self.onSubmitCallback ) {
                        self.onSubmitCallback( e, {} );
                    } else {
                        self.form.submit();
                    }
                } else {
                    e.preventDefault();
                    return false;
                }
            } );
        }

        this.form.addEventListener( 'reset', function( e ) {
            self.goToPage( 0 );
        } );

        function divideIntoPages() {
            for( i = 0; i < fieldsets.length; i++ ) {
                node = fieldsets[i];
                if( self.pages.length === 0 ) {
                    self.pages.push( new PureWizardPage( self.config, node ) );
                    self.current = self.pages[0];
                } else {
                    var prev = self.pages[self.pages.length - 1];
                    var newPage = new PureWizardPage( self.config, node, prev );
                    self.pages.push( newPage );
                    prev.next = newPage;
                }
            }
        }

        function initStatusSection() {
            var statusSectionContainer = document.getElementById( self.statusSectionId );
            self.statusSection = new WizardSteps( self.pages, statusSectionContainer, self.config.statusContainerCfg );

            statusSectionContainer.addEventListener( 'click', function( e ) {
                var link = e.target;
                if( link.tagName.toLocaleLowerCase() === 'a' ) {
                    var pageNumber = Number( link.attributes['data-step'].value );
                    if ( !self.goToPage( pageNumber ) ) {
		    	        self.current.toggleErrors();	
		            }
                }
            } );
        }
    }

    /**
     * Move to next page if present
     * @function
     */
    PureWizard.prototype.next = function PureWizard_next() {
        if( this.current.getNext() ) {
            if( !this.goToPage( this.currentIndex + 1 ) ) {
                this.current.toggleErrors();
            }
        }
    };

    /**
     *  @function
     *  Move to previouse page if present
     */
    PureWizard.prototype.prev = function pureWizard_prev() {
        if( this.current.getPrev() ) {
            if( !this.goToPage( this.currentIndex - 1 ) ) {
                this.current.toggleErrors();
            }
        }
    };

    /**
     * Get current page
     * @function
     *
     * @return {PureWizadPage}
     */
    PureWizard.prototype.getCurrentPage = function() {
        return this.current;
    };

    /**
     * Get current page index, starts from 0
     * @function
     *
     * @return {Number}
     */
    PureWizard.prototype.getCurrentPageNumber = function() {
        return this.currentIndex;
    };

    /**
     * Subscription to an event when the page is changed
     * @function
     * @param {Function} callback
     *
     */
    PureWizard.prototype.onPageChanged = function pureWizardOnPageChanged( callback ) {
        this.form.addEventListener( 'onPWPageChanged', function( e ) {
            callback( e );
        } );
    };

    /**
     *  When the form is submit
     *  @function
     *
     * @param {Function} callback
     */
    PureWizard.prototype.onSubmit = function PureWizard_onSubmit( callback ) {
        this.onSubmitCallback = callback;
    };

    /**
     * Go to page
     * @function
     * @param {PureWizardPage} page
     * @param {Number} page              - page number youwhant want to navigate, starts from 0
     * @param {Boolean} [skipValidation] - skip validation when switching the page
     *
     * @return {Boolean}
     *
     * @fires PureWizard#onPWPageChanged
     */
    PureWizard.prototype.goToPage = function PureWizard_goToPage( pageNumber, skipValidation ) {

        if( pageNumber >= this.pages.length ) {
            pageNumber = this.pages.length - 1;
        }
        if( pageNumber < 0 ) {
            pageNumber = 0;
        }

        var page = this.pages[pageNumber];

        // Validate page if we go forward
        if( this.current.isValid() || this.currentIndex > pageNumber || skipValidation ) {
            if( !skipValidation ) {
                // If goes for example from page 1 to 3 and page 2 is invalid
                // validate through page 2, but page 3 can be invalid
                if( this.currentIndex < pageNumber && this.currentIndex + 1 !== pageNumber ) {
                    if( this.pages.filter( function( p, i, arr ) {
                            return !p.isValid() && (i !== pageNumber);
                        } ).length > 0 ) {
                        return false;
                    }
                }
            }

            var indexBefore = this.currentIndex;

            this.current.hide();
            this.current = page;
            this.current.show();
            this.currentIndex = pageNumber;

            // Update the status section
            if( this.statusSection ) {
                this.statusSection.setStep( pageNumber );
            }

            this.toggleButtons();

            /**
             * @event PureWizard#onPWPageChanged
             *
             * @type {Object}
             * @property {Object} pwDetails
             * @property {Number} previousePage
             * @property {Number} currentPage
             */
            var event = new CustomEvent( 'onPWPageChanged', {
                detail: {
                    'previousPage': this.currentIndex,
                    'currentPage': (this.currentIndex + 1)
                }
            } );
            this.form.dispatchEvent( event );

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

        function setNextPrevVisibility( button, initialDisplay, value ) {
            if( self.config.hideNextPrevButtons ) {
                button.style.display = value ? initialDisplay : 'none';
            } else {
                button.disabled = !value;
            }
        }

        self.buttons.finish.style.display = 'none';
        if( !this.current.getPrev() ) {
            setNextPrevVisibility( self.buttons.prev, self.buttonsInitialDisplay.prev, false );
        } else {
            setNextPrevVisibility( self.buttons.prev, self.buttonsInitialDisplay.prev, true );
        }
        if( !this.current.getNext() ) {
            setNextPrevVisibility( self.buttons.next, self.buttonsInitialDisplay.next, false );
            self.buttons.finish.style.display = self.buttonsInitialDisplay.finish;
        } else {
            setNextPrevVisibility( self.buttons.next, self.buttonsInitialDisplay.next, true );
        }
    };

    /**
     * Represents a single page
     * @class
     * @constructor
     *
     * @param {Object} config
     * @property {Sting} [config.hideClass='']   - Css class used to hide wizard pages
     * @property {String} [config.errorClass=''] - Css class to Highlight field with errors, if no
     * @param {Node} container
     * @param {PureWizardPage} [prev]
     * @param {PureWizardPage} [next]
     */
    function PureWizardPage( config, container, prev, next ) {
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
        return this.el.querySelectorAll( ':invalid' );
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
     * Toogle the validation messages and error class
     * @functionf
     *
     * @return {Boolean}
     */
    PureWizardPage.prototype.toggleErrors = function PureWizardPage_toggleErrors() {
        var
            invalidInputs = this.getInvalidElements(),
            containsErrors = false,
            i, invalidInputLabel, errorMsg, errorMsgContainer;

        for( i = 0; i < invalidInputs.length; i++ ) {
            invalidInputLabel = this.el.querySelector( 'label[for="' + invalidInputs[i].id + '"]' );

            if( invalidInputs[i].className.indexOf( this.config.errorClass ) === -1 ) {

                invalidInputs[i].className += ' ' + this.config.errorClass;
                if( invalidInputLabel && invalidInputLabel.className.indexOf( this.config.errorClass ) === -1 ) {
                    invalidInputLabel.className += ' ' + this.config.errorClass;
                }
                // If error message and error container exists display error
                errorMsg = invalidInputs[i].getAttribute( 'data-error-msg' );
                errorMsgContainer = document.getElementById( invalidInputs[i].id + 'Error' );
                if( errorMsg && errorMsgContainer ) {
                    errorMsgContainer.innerHTML = errorMsg;
                }
            }
            containsErrors = true;
        }

        // Clean the errors from valid elements
        var cssClass = this.config.errorClass ? '.' + this.config.errorClass : '';
        var validElements = this.el.querySelectorAll( cssClass + ':valid' );
        for( i = 0; i < validElements.length; i++ ) {
            validElements[i].className = validElements[i].className.replace( this.config.errorClass, '' );

            invalidInputLabel = this.el.querySelector( 'label[for="' + validElements[i].id + '"]' );
            errorMsgContainer = document.getElementById( validElements[i].id + 'Error' );

            if( invalidInputLabel ) {
                invalidInputLabel.className = invalidInputLabel.className.replace( this.config.errorClass, '' );
            }
            if( errorMsgContainer ) {
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
        var legend = this.el.querySelector( '.pwStepTitle' );
        if( !legend ) {
            throw new Error( 'PureWizard error - no title for page, please add with \'.pwStepTitle\' class.' );
        }
        return legend.innerHTML;
    };

    /**
     * Return the next page
     * @function
     *
     * @return {PureWizardPage}
     */
    PureWizardPage.prototype.getNext = function() {
        return this.next;
    };

    /**
     * Return the previouse page
     * @function
     *
     * @return {PureWizardPage}
     */
    PureWizardPage.prototype.getPrev = function() {
        return this.prev;
    };

    /**
     * Show the page
     * @function
     */
    PureWizardPage.prototype.show = function() {
        if( this.config.hideClass ) {
            this.el.className = this.el.className.replace( this.config.hideClass, '' );
        } else {
            this.el.style.display = '';
        }
    };

    /**
     * Hide the page
     * @function
     */
    PureWizardPage.prototype.hide = function() {
        if( this.config.hideClass ) {
            this.el.className += ' ' + this.config.hideClass;
        } else {
            this.el.style.display = 'none';
        }
    };

    /**
     * Section with steps, constructs from list, list item and link.
     * @class
     * @constructor
     *
     * @param {PureWizardPage} pages         - The list with all pages
     * @param {HTMLElement} container        - Container where the steps are located
     * @param {Object} config                 - Additional config object
     * @property {String} config.ulClass      - Add custom ul class
     * @property {String} config.liClass      - Add custom li class
     * @property {String} config.aClass       - Add custom a class
     * @property {String} config.aActiveClass -
     */
    function WizardSteps( pages, container, config ) {

        this.config = config;

        var ulClass = config.ulClass || '',
            liClass = config.liClass || '',
            aClass = config.aClass || '',
            self = this,
            li, a;

        this.el = document.createElement( 'ul' );
        this.el.className += ' ' + ulClass;

        // Populate status sections items
        pages.forEach( function( e, i ) {
            li = document.createElement( 'li' );
            a = document.createElement( 'a' );
            li.className += ' ' + liClass;
            a.setAttribute( 'href', '#' );
            a.setAttribute( 'data-step', i.toString() );
            a.appendChild( document.createTextNode( e.getTitle() ) );
            a.className += ' ' + aClass;
            li.appendChild( a );
            self.el.appendChild( li );
        } );
        container.appendChild( self.el );
    }

    /**
     * Highlight current step with class
     * @function
     * @param {Number} stepNumber Make the step active, starts from 0
     */
    WizardSteps.prototype.setStep = function( stepNumber ) {
        var currentActive = this.el.querySelector( '.' + this.config.aActiveClass );
        if( currentActive ) {
            currentActive.className = currentActive.className.replace( this.config.aActiveClass, '' );
        }
        this.el.children[stepNumber].className += ' ' + this.config.aActiveClass;
    };

    return PureWizard;
} ));
