/**
 * Created by IvanP on 5/20/2016.
 */
window.Confirmit = {
    /*
    * Specify array of objects of events and functions to execute on event trigger
    * if an event name has a dot (.) in it , the first part is considered as an ID of a child element
    * (in relation to a host element) to listen on (use it if you don't want to listen on the host)
    * Example: `harry.potter-event` == `potter-event` on `#harry`
    *
    * @param {[{event-name: functionName}]} arr - array of objects where event-name is a String and functionName is a function to execute when event fires
    * */
};

(function() {
    'use strict';
    
var confMethods = window.Confirmit;
window.Confirmit= function(prototype){
    // if there is no prototype, use a default empty object
    if (!prototype) {
        prototype = {};
    }
    var factory = desugar(prototype);
    if(factory.properties){
        Confirmit.Base.mixin(factory, factory.properties);
        factory._properties = factory.properties;
        delete factory.properties;
    }
    if(factory.options){
        for(var o in factory.options){
            factory.set(o, factory.options[o]);
        }
    }
    if(factory.listeners){
        if(Array.isArray(factory.listeners) && factory.listeners.length>0){
            var host = factory.context;
            console.log(host);
            factory.listeners.forEach(function(listener){
                if(typeof listener === 'object'){
                    var node, name, eventName;
                    for(eventName in listener){
                        if (eventName.indexOf('.') < 0) {
                            node = host;
                            name = eventName;
                        } else {
                            name = eventName.split('.');
                            node = host.querySelector('#'+name[0]);
                            name = name[1];
                        }
                        console.log(host[listener[eventName]]);
                        $(node).on(name, host[listener[eventName]]);
                    }
                }
            });
        }
        delete factory.listeners;
    }
    console.log(factory);
    if(factory.init){factory.init()};
    return factory;
};
    var desugar = function(prototype) {
        // Note: need to chain user prototype with the correct type-extended
        // version of Confirmit.Base; this is especially important when you can't
        // prototype swizzle (e.g. IE10), since CustomElements uses getPrototypeOf
        prototype = Confirmit.Base.mixin(prototype.context,prototype);
        prototype = Confirmit.Base.mixin(prototype.context,Confirmit.Base);
        return prototype;
    };
    if (confMethods) {
        for (var i in confMethods) {
            Confirmit[i] = confMethods[i];
        }
    }


})();


(function() {
    'use strict';
    Confirmit.Base = {

        set:function(obj,value){
            var o=this, first, _prev;
            if(obj.indexOf('.')>0){ // it's a deep property
                var deep = obj.split('.');
                first=deep[0];
                console.log(first);

                for(var i=0; i<deep.length; i++){
                    if(i===0){
                        o=o[deep[i]].value;
                        _prev = JSON.parse(JSON.stringify(o));
                    } else if(o[deep[i]]){
                        if(i<deep.length -1){o=o[deep[i]]} else {
                            o[deep[i]] = value;
                        }
                    } else {console.error('sub-property '+ deep[i] +' doesn\'t exist'); return}
                }
            } else {
                o = o[obj];
                _prev=o.value;
                first = obj;
                o.value = value;
            }
            if(_prev!==this[first].value){
                $(this).trigger(first+'-changed');
            }
        },

        // Used for `isInstance` type checking; cannot use `instanceof` because
        // there is no common Confirmit.Base in the prototype chain between type
        // extensions and normal custom elements
        // pluggable features
        // `this` context is a prototype, not an instance
        registerCallback: function() {
            // TODO(sjmiles): perhaps this method should be called from polymer-bootstrap?
            this._desugarBehaviors(); // abstract
            this._doBehavior('beforeRegister'); // abstract
            this._registerFeatures();  // abstract
            if (!settings.lazyRegister) {
                this.ensureRegisterFinished();
            }
        },
        createdCallback: function() {
            if (!this.__hasRegisterFinished) {
                this._ensureRegisterFinished(this.__proto__);
            }
            this.root = this;
            this._doBehavior('created'); // abstract
            this._initFeatures(); // abstract
        },
        // reserved for canonical behavior
        /*attachedCallback: function() {
            // NOTE: workaround for:
            // https://code.google.com/p/chromium/issues/detail?id=516550
            // To allow querying style/layout data in attached, we defer it
            // until we are sure rendering is ready.
            var self = this;
            Confirmit.RenderStatus.whenReady(function() {
                self.isAttached = true;
                self._doBehavior('attached'); // abstract
            });
        },
        // reserved for canonical behavior
        detachedCallback: function() {
            // NOTE: duplicate attachedCallback behavior
            var self = this;
            Confirmit.RenderStatus.whenReady(function() {
                self.isAttached = false;
                self._doBehavior('detached'); // abstract
            });
        },*/
        // reserved for canonical behavior
        attributeChangedCallback: function(name, oldValue, newValue) {
            // TODO(sorvell): consider filtering out changes to host attributes
            // note: this was barely measurable with 3 host attributes.
            //this._attributeChangedImpl(name); // abstract
            //this._doBehavior('attributeChanged', [name, oldValue, newValue]); // abstract
        },
        /*_attributeChangedImpl: function(name) {
            this._setAttributeToProperty(this, name);
        },*/
        /**
         * Copies props from a source object to a target object.
         *
         * Note, this method uses a simple `for...in` strategy for enumerating
         * properties.  To ensure only `ownProperties` are copied from source
         * to target and that accessor implementations are copied, use `extend`.
         *
         * @method mixin
         * @param {Object} target Target object to copy properties to.
         * @param {Object} source Source object to copy properties from.
         * @return {Object} Target object that was passed as first argument.
         */
        mixin: function(target, source) {
            for (var i in source) {
                target[i] = source[i];
            }
            return target;
        },
        _logger: function(level, args) {
            // accept ['foo', 'bar'] and [['foo', 'bar']]
            if (args.length === 1 && Array.isArray(args[0])) {
                args = args[0];
            }
            // only accept logging functions
            switch(level) {
                case 'log':
                case 'warn':
                case 'error':
                    console[level].apply(console, args);
                    break;
            }
        },
        _log: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            this._logger('log', args);
        },
        _warn: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            this._logger('warn', args);
        },
        _error: function() {
            var args = Array.prototype.slice.call(arguments, 0);
            this._logger('error', args);
        },
        _logf: function(/* args*/) {
            return this._logPrefix.concat(this.is).concat(Array.prototype.slice.call(arguments, 0));
        }
    };
    Confirmit.Base._logPrefix = (function(){
        // only Firefox, Chrome, and Safari support colors in console logging
        var color = (window.chrome && !(/edge/i.test(navigator.userAgent))) || (/firefox/i.test(navigator.userAgent));
        return color ? ['%c[%s::%s]:', 'font-weight: bold; background-color:#EEEE00;'] : ['[%s::%s]:'];
    })();
})();
