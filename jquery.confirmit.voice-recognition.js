/**
 * Created by IvanP on 5/19/2016.
 * Voice Recognition module
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery.speechRecognition'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.fn.speechRecognition = function(options){
        var defaults = {
            continuous:true, // set to true to enable
            accent: 'en-US', // [column: Number, direction: 'asc|desc']
            interimResults:true //[[index, direction(asc|desc)]]
        };
        options = $.extend(true, {}, defaults, options);

        /* -- Lifecycle ------------------------------------------------- */

        var mainframe={
            /* -- Private Methods ------------------------------------------- */
            
            /* -- Public Methods -------------------------------------------- */
            init:function(){
                var SpeechRecognition= window.SpeechRecognition ||
                                        window.webkitSpeechRecognition ||
                                        window.mozSpeechRecognition ||
                                        window.msSpeechRecognition ||
                                        window.oSpeechRecognition;

                if (SpeechRecognition !== undefined) {
                    this.recognition = new SpeechRecognition();
                    this.recognition.continuous = options.continuous;
                    this.recognition.interimResults = options.interimResults;
                    this.recognition.lang = options.accent;
                } else {
                    console.warn('Your browser does not support the Web Speech API');
                }
            },
            _propagateEvent:function(eventName) {
            console.log(this);
                $(this.recognition).on(eventName, function(e) {
                    console.log(e);
                    console.log(eventName);
                    $(this).trigger('recognition-'+eventName, e.originalEvent);
                })
            },
            _bindResult:function() {
                var el = this;
                //console.log(el);

                $(this.recognition).on('result', function(e) {
                    //console.log(e.originalEvent);
                    var event = e.originalEvent;
                    el.text='';
                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        el.text += event.results[i][0].transcript;
                        event.result = el.text;
                        if(event.results[i].isFinal){ // if not interim - fire result
                            $(this).trigger('recognition-result', event); break;
                        } else { // fire interim results
                            $(this).trigger('recognition-interim', event);
                        }
                    }
                });
            },
            start: function() {
                this.recognition.start();
            },
            stop: function() {
                this.recognition.stop();
            },
            abort: function() {
                this.recognition.abort();
            }
        };

        $(this).each(function(){
            $.extend(true, this, mainframe);
            this.init();
            if(!this.recognition) return; // exit if recognition not supported
            
            // Initialize event listeners
            var events = ['start', 'end', 'error'];
            events.forEach(this._propagateEvent.bind(this));
            this._bindResult.apply(this);
        });

       

    }}));

/* Speech synthesis*/
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery.speechSynthesis'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.fn.speechSynthesis = function(options){
        $(this).each(function(){
            Confirmit({
                context: this,
                options:options,
                properties:{
                    autoplay: {
                        type: Boolean,
                        value:false
                    }, // set to true to enable
                    accent: {
                        type: String,
                        value:'en-US'
                    }, // [column: Number, direction: 'asc|desc']
                    text: {
                        type: String,
                        value:''
                    } //text to synthesize
                },
                listeners:[
                    {'accent-changed':'_accentChanged'},
                    {'text-changed':'_textChanged'}
                ],
                init:function(){
                    if ('speechSynthesis' in window) {
                        this.speech = new SpeechSynthesisUtterance();
                        this.voices = window.speechSynthesis;
                    }
                    else {
                        console.warn('Your browser does not support the Web Speech API');
                    }
                },

                /* -- Private Methods ------------------------------------------- */
                _accentChanged: function() {this.speech.lang = this.accent;},
                _textChanged: function() {this.speech.text = this.text;},
                _propagateEvent: function (eventName) {
                    var el = this;
                    $(this.speech).on(eventName, function(e) {
                        $(el).trigger(eventName, e.originalEvent);
                    }.bind(this));
                },

                /* -- Public Methods -------------------------------------------- */
                speak: function() {
                    if(!this.speech.voice || this.speech.voice && this.speech.voice.lang!==this.speech.lang){
                        /*var voices = window.speechSynthesis.getVoices();
                         this.speech.voice = voices.filter(function(voice){return voice.lang===this.accent}.bind(this))[0];*/
                        this.speech.voice = window.speechSynthesis.getVoices().filter(function(voice){return voice.lang===this.accent}.bind(this))[0];
                    }
                    window.speechSynthesis.speak(this.speech);
                },
                cancel: function() {window.speechSynthesis.cancel();},
                pause: function() {window.speechSynthesis.pause();},
                resume: function() {window.speechSynthesis.resume();}
            })
        });

    }
}));

/* Speech mic button*/
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery.speechMic'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.fn.speechMic = function(options){
        var defaults = {

            // options for voiceRecognition
            continuous:true, // set to true to enable
            accent: 'en-US', // [column: Number, direction: 'asc|desc']
            interimResults:true, //[[index, direction(asc|desc)]]

            // options for speechMic
            icons:{ // used in different states of the button
                'mic': '<path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>',
                'mic-none':'<path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.2-9.1c0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2l-.01 6.2c0 .66-.53 1.2-1.19 1.2-.66 0-1.2-.54-1.2-1.2V4.9zm6.5 6.1c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>',
                'mic-off':'<path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>',
                'volume-up':'<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>',
                'volume-down':'<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>',
                'volume-mute':'<path d="M7 9v6h4l5 5V4l-5 5H7z"/>',
                'volume-off':'<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>',
            }
        };
        var properties = $.extend(true, {}, defaults, options);


        var mainframe={
            /*generates icon*/
            generateMicIcon:function(icon){
                return ['<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" class="micButtonIcon">',properties.icons[icon],'</svg>'].join(' ');
            },
            generateMicButton:function(icon){
                $(this).append('<div class="VoRe"><div class="micIconWrapper">'+this.generateMicIcon(icon)+'</div></div>')
            },
            swapMicIcon:function(icon){
                $(this).find('.VoRe>.micIconWrapper').html(this.generateMicIcon(icon));
            },
            init:function(){
                $(this).speechRecognition({continuous: properties.continuous, accent: properties.accent, interimResults: properties.interimResults});
                $(this).speechSynthesis();
                if(!this.recognition) return;
                
                this.generateMicButton('mic');
                $(this).find('.VoRe:not([listening])').on('click', this.start);
                $(this).find('.VoRe[listening]').on('click', this.stop);
            }
        };

        $(this).each(function(){
            console.log(this);

            $.extend(true, this, properties);
            $.extend(true, this, mainframe );
            this.init();
            //Confirmit.set.call(this,'icons.mic-off','value');
            
        });



    }}));