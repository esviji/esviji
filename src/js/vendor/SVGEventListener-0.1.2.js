// SVGEventListener.js
// Version - 0.1.2
//
// by MAD - @madsgraphics - ecrire[at]madsgraphics.com
//
// https://github.com/madsgraphics/SVGEventListener/
//
// Tri-license - WTFPL | MIT | BSD
//
// Please minify before use.

( function ( window, doc, el ) {

  'use strict';

  var addEventListenerLegacy = el.prototype.addEventListener,
      svgns                  = 'http://www.w3.org/2000/svg',
      // helper functions
      isString               = function ( s ) {
        return typeof s == "string";
      },
      isArray                = Array.isArray || function ( obj ) {
        return toString.call( obj ) == "[object Array]";
      },
      isUndefined            = function ( obj ) {
        return obj === undefined;
      },
      // Inspired by:
      // http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
      supportedEvents        = {},
      isEventSupported       = function ( eventName ) {
        // early return if the event is in cache
        if ( typeof supportedEvents[eventName] !== 'undefined' )
          return supportedEvents[eventName];

        // initiliaze the support at false for detection
        supportedEvents[eventName] = false;
        // create svg (and childs) nodes
        var svg     = doc.createElementNS( svgns, 'svg' ),
            element = doc.createElementNS(svgns, 'rect'),
            animate = doc.createElementNS( svgns, 'animate' );

        // set duration to 1ms to detect endEvent
        animate.setAttributeNS(null, "dur", "1ms");
        // append elements
        element.appendChild(animate);
        svg.appendChild(element);

        // attach a listener to the event that update the events cache
        addEventListenerLegacy.call(animate, eventName + 'Event', function() {
          supportedEvents[eventName] = true;
        }, false);

        // attach svg to the DOM (else it doesn't detect anything) but cache it
        svg.setAttributeNS(null, "style", "display:none");
        doc.body.appendChild(svg);
        // Set a timeout to remove the dummy SVG element
        // It is setted to 50 to leave the DOM breath and get the SVG event
        // result before removing it :)
        setTimeout(function() { doc.body.removeChild(svg); }, 50);

        // Return the current event support status
        return supportedEvents[eventName];
      };

  // Clocker.js
  // Convert a legal clock string value (in SMIL definition) to milliseconds
  //
  // Originaly released here: https://github.com/madsgraphics/clocker.js
  function clocker( timestr ) {
    var time,
        times = timestr.split( ':' );

    // Timecount-value
    // = Formats without ':'
    if ( times.length == 1 ) {
      time = times[0];
      // Time already given in milliseconds (250ms)
      if ( time.lastIndexOf('ms') != -1 ) {
        return parseInt(time);
      }
      // Othermetrics
      else {
        // minutes
        if( time.lastIndexOf('min') != -1 ) {
          time = parseFloat(time) * 60;
        }
        // hours
        else if( time.lastIndexOf('h') != -1 ) {
          time = parseFloat(time) * 3600;
        }
        // Time is now in seconds.
        // If time is without metric, then assume in seconds,
        // maybe float (2.05 == 2050ms)
        // So convert in ms…
        return parseFloat(time) * 1000;
      }
    }
    // Full-clock-value || Partial-clock-value
    else {
      // Reverse order to iterate from seconds to hours
      times.reverse();
      // Init time
      time = 0;
      for ( var t in times ) {
        // Value * 60^t (hours / minutes to seconds) * 1000 (s to ms)
        time += times[t]*Math.pow(60, t)*1000;
      }

      return time;
    }
  }

  /***
   * Event Listener
   ***/

  // Custom Event listener
  // Implements Observer pattern
  //
  // inspired by: http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/

  // Create custom listener object with private property to store listeners
  function EventListener( parent ) {
    // listeners stack
    this._listeners = {};
    // autoFire flag for register launching
    this.autoFire   = {
      begin: false,
      end: false
    };
    // store parent obj
    this.parent = parent;
  }

  // Extends it to add and fire events
  EventListener.prototype = {
    constructor: EventListener,
    // add new event to listeners
    add: function addListener( type, listener ) {
      // if there is no triggers already defined for this events,
      // init an a-empty array
      if ( isUndefined( this._listeners[type] ) ) {
        this._listeners[type] = [];
      }
      // add trigger to the event
      this._listeners[type].push( listener );
    },
    // fire the event
    fire: function fireListeners( event ) {
      // if called only by event name (useful), build a correct object
      if ( isString( event ) ) {
        event = {type: event};
      }
      // set target if unavailable
      if ( !event.target || !event.currentTarget ) {
        event.target = event.currentTarget = this.parent;
      }
      // if there is no event given, throw an error
      if ( !event.type ) {
        throw new Error( "Event object missing 'type' property." );
      }
      // If the type has associated triggers, then launch them
      if ( isArray( this._listeners[event.type] ) ) {
        var listeners = this._listeners[event.type];
        for ( var l in listeners ) {
          console.log(this.parent.id, event.type);
          listeners[l].call( this, event );
        }
      }
    }
  };

  // Overwrite Element.addEventListener method for transparency fallback
  //
  // Inpired by: http://stackoverflow.com/questions/7220515/extending-node-addeventlistener-method-with-the-same-name#7220628
  el.prototype.addEventListener = function ( type, listener, useCapture ) {
    var index,
        begin    = this.getAttribute('begin'),
        duration = this.getAttribute('dur'),
        that     = this;
    // ***
    // Attach a new event listeners stack if it doesn't exists
    if( isUndefined( this.listeners ) )
    {
      this.listeners = new EventListener( this );
    }
    // ***
    // check event name and support for endEvent
    if ( type == 'endEvent' && !isEventSupported( 'end' ) ) {
      // Add listener to the endEvent stack
      this.listeners.add( type, listener );
      // check if autofire is already enabled
      if ( !this.listeners.autoFire.end ) {
        // if not, add an autofired at the end of animation (=dur)
        this.addEventListener ( 'beginEvent' , function () {
          window.setTimeout( function () {
            // Check again is the support is true or not.
            // Early return if true (don't trigger the custom event stack)
            if( !!isEventSupported( 'end' ) ) return;
            that.listeners.fire( 'endEvent' );
          }, clocker( duration ) )
        });
        // and set the autofire flag at true to prevent multiple endfire
        // launch
        this.listeners.autoFire.end = true;
      }
    }
    // ***
    // check event name and suport for beginEvent
    if ( type == 'beginEvent' && !isEventSupported( 'begin' ) ) {
      // Add listener to the endEvent stack
      this.listeners.add( type, listener );
      // Check if begin is set to a duration
      if ( begin != 'indefinite' && begin.indexOf( '.end' ) == -1 ) {
        // true, so check the autofire begin event
        if ( !this.listeners.autoFire.begin ) {
          // not already activated, so activate it
          window.setTimeout( function () {
            // Check again is the support is true or not.
            // Early return if true (don't trigger the custom event stack)
            if( !!isEventSupported( 'begin' ) ) return;
            that.listeners.fire( 'beginEvent' );
          }, clocker( begin ) );
          // set autofire to true to prevent multiple launch
          this.listeners.autoFire.begin = true;
        }
      }
      // if the lanch depends of the end of another animation
      else if ( (index = begin.indexOf( '.end' )) != -1 ) {
        var previousAnimate = doc.getElementById( begin.substr(0, index) );
        // Add an endEvent that launch the next animation
        previousAnimate.addEventListener( 'endEvent', function () {
          that.listeners.fire( 'beginEvent' );
        });
      }
      // if the launch depends of a manual action (=indefinite)
      else if ( begin == 'indefinite') {
        this.beginElement = function() {
          this.listeners.fire( 'beginEvent' );
          // ***
          // call the original method for fallback
          return this.__proto__.beginElement.call( this );
        }
      }
    }
    // ***
    // call the original method for fallback
    return addEventListenerLegacy.call( this, type, listener, useCapture );
  };

})( this, document, Element );
