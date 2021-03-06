/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : helpers
 */

(function () {
  'use strict';

  var $win = window,
      $doc = $win.document;

  /**
   * Helper to Object.create but without having to specify
   * all the properties like value, writable, enumerable, configurable...
   */
  Object.prototype.createSimple = function (aExtensionObject) {
    var newObject = Object.create(this),
        property;

    for (property in aExtensionObject) {
      if (aExtensionObject.hasOwnProperty(property)) {
        newObject[property] = aExtensionObject[property];
      }
    }

    return newObject;
  };

  /**
   * GLOBAL!!
   * Helper for document query selector with 'cache'
   */
  $win.dqs = (function () {
    var cache = {};

    return function (aQuery, aForce) {
      if (!cache.hasOwnProperty(aQuery) || aForce === true) {
        cache[aQuery] = $doc.querySelector(aQuery);
      }

      return cache[aQuery];
    };
  })();

  /**
   * Helper to translate a KeyboardEvent keyCode into a human readable keyName
   */
  $win.KeyboardEvent.prototype.keyName = (function () {
    var specialKeyCodes = {
      '38': 'up',
      '40': 'down',
      '39': 'right',
      '37': 'left',
      '33': 'pageup',
      '34': 'pagedown'
    };

    return function () {
      var key = null;

      if (specialKeyCodes.hasOwnProperty(this.keyCode)) {
        key = specialKeyCodes[this.keyCode];
      } else {
        key = String.fromCharCode(this.keyCode);
      }

      key += this.shiftKey ? '+shift' : '';
      key += this.ctrlKey ? '+ctrl' : '';

      return key;
    };
  })();

  /**
   * Helper to push a value into an array only if it wasn't already in it
   */
  Array.prototype.pushOnce = function (aValue) {
    if (this.indexOf(aValue) === -1) {
      this.push(aValue);
    }
  };

  /**
   * Helper to sort numeric values
   */
  Array.prototype.sortNumeric = (function () {
    var sortNumeric = function (a, b) {
      return a - b;
    };

    return function () {
      this.sort(sortNumeric);
    };
  })();

  /**
   * If the value is in the array and aIncludeValue equals true, return the value
   * If not return the closest value after the one provided
   */
  Array.prototype.closestAfter = function (aValue, aIncludeValue) {
    if (aIncludeValue === true && this.indexOf(aValue) !== -1) {
      return aValue;
    }

    if (this.length === 2) {
      return this[1];
    }

    var middle = Math.floor(this.length / 2);

    if (aValue < this[middle]) {
      return this.slice(0, middle + 1).closestAfter(aValue);
    } else {
      return this.slice(middle, this.length).closestAfter(aValue);
    }
  };

  /**
   * If the value is in the array and aIncludeValue equals true, return the value
   * If not return the closest value before the one provided
   */
  Array.prototype.closestBefore = function (aValue, aIncludeValue) {
    if (aIncludeValue === true && this.indexOf(aValue) !== -1) {
      return aValue;
    }

    if (this.length === 2) {
      return this[0];
    }

    var middle = Math.floor(this.length / 2);

    if (aValue <= this[middle]) {
      return this.slice(0, middle + 1).closestBefore(aValue);
    } else {
      return this.slice(middle, this.length).closestBefore(aValue);
    }
  };

  /**
   * Complete a string to reach a specific length with  another string
   */
  String.prototype.completeBefore = function (aCompleteString, aLength) {
    if (this.length >= aLength) {
      return this;
    } else {
      return (aCompleteString + this).completeBefore(aCompleteString, aLength);
    }
  };

  /**
   * Shim for transitionend event
   */
  (function () {
    var prefixedEvents,
        triggerTransitionEnd,
        prefixedEvent;

    prefixedEvents = {
      'webkitTransitionEnd': {
        proto: 'WebKitTransitionEvent',
        init: 'initEvent'
      },
      'oTransitionEnd': {
        proto: 'OTransitionEvent',
        init: 'initTransitionEvent'
      }
    };

    triggerTransitionEnd = function (aEvent) {
      var proto = prefixedEvents[aEvent.type].proto,
          initFunction = prefixedEvents[aEvent.type].init,
          evt = $doc.createEvent(proto);

      evt[initFunction]('transitionend', true, true, aEvent.propertyName, aEvent.elapsedTime);
      $win.dispatchEvent(evt);
    };

    for (prefixedEvent in prefixedEvents) {
      if (prefixedEvents.hasOwnProperty(prefixedEvent)) {
        $win.addEventListener(prefixedEvent, triggerTransitionEnd, false);
      }
    }
  })();

  /**
   * scrollIntoViewIfNeeded 4 everyone!!!
   * https://gist.github.com/2581101
   */
  if (!$win.Element.prototype.scrollIntoViewIfNeeded) {
    $win.Element.prototype.scrollIntoViewIfNeeded = function (centerIfNeeded) {
      centerIfNeeded = arguments.length === 0 ? true : !!centerIfNeeded;

      var parent = this.parentNode,
          aboveScrollView = this.offsetTop - parent.offsetTop < parent.scrollTop,
          belowScrollView = (this.offsetTop - parent.offsetTop + this.clientHeight) > (parent.scrollTop + parent.clientHeight),
          alignWithTop = aboveScrollView && !belowScrollView;

      if (aboveScrollView || belowScrollView) {
        if (centerIfNeeded) {
          parent.scrollTop = this.offsetTop - parent.offsetTop - parent.clientHeight / 2 + this.clientHeight / 2;
        } else {
          this.scrollIntoView(alignWithTop);
        }
      }
    };
  }

  /**
   * refresh an iframe
   */
  if (!$win.HTMLIFrameElement.prototype.refresh) {
    $win.HTMLIFrameElement.prototype.refresh = function () {
      var that = this,
          src = this.src,
          onload = function () {
            that.src = src;
            that.onload = null;
          };

      this.onload = onload;
      this.src = '';
    };
  }

})();