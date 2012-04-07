/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */
/*global PubSub:false, PrefixFree:false, ich:false */

var vp = (function ($win, $doc, $ps, $pf, $ich) {
  'use strict';

  var extendObject,
      dom,
      keyNames,
      toFixed1,
      arrayInsert,
      arrayAfter,
      arrayBefore,
      protos,
      vp;

  /**
   * HELPERS
   */

  /**
   * Helper to extend object using Object.create but without having to specify
   * all the properties like value, writable, enumerable, configurable...
   */
  extendObject = function (aProto, aExtensionObject) {
    var newObject = Object.create(aProto),
        property;

    for (property in aExtensionObject) {
      if (aExtensionObject.hasOwnProperty(property)) {
        newObject[property] = aExtensionObject[property];
      }
    }

    return newObject;
  };

  /**
   * Helper for DOM with 'cache' using CSS selector
   * document.querySelector('div') => dom('div')
   */
  dom = (function () {
    var cache = {};

    return function (aQuery, aForce) {
      if (!cache.hasOwnProperty(aQuery) || aForce === true) {
        cache[aQuery] = $doc.querySelector(aQuery);
      }

      return cache[aQuery];
    };
  })();

  /**
   * Helper to translate keyCode into a human readable keyName
   */
  keyNames = (function () {
    var specialKeyCodes = {
      '38': 'up',
      '40': 'down',
      '39': 'right',
      '37': 'left',
      '33': 'pageup',
      '34': 'pagedown'
    };

    return function (aEvent) {
      var key = null;

      if (specialKeyCodes.hasOwnProperty(aEvent.keyCode)) {
        key = specialKeyCodes[aEvent.keyCode];
      } else {
        key = String.fromCharCode(aEvent.keyCode);
      }

      key += aEvent.shiftKey ? '+shift' : '';
      key += aEvent.ctrlKey ? '+ctrl' : '';

      return key;
    };
  })();

  /**
   * Helper to format a number to only one digit after decimal point
   */
  toFixed1 = function (aValue) {
    return Number(Number(aValue).toFixed(1));
  };

  /**
   * Helper to insert values into an array only once
   */
  arrayInsert = function (aArray, aValue) {
    if (aArray.indexOf(aValue) === -1) {
      aArray.push(aValue);
    }
  };

  /**
   * Return the closest value after the current one
   */
  arrayAfter = function (aArray, aValue) {
    if (aArray.length === 2) {
      return aArray[1];
    }

    var middle = Math.floor(aArray.length / 2);

    if (aValue < aArray[middle]) {
      return arrayAfter(aArray.slice(0, middle + 1), aValue);
    } else {
      return arrayAfter(aArray.slice(middle, aArray.length), aValue);
    }
  };

  /**
   * Return the closest value before the current one
   */
  arrayBefore = function (aArray, aValue) {
    if (aArray.length === 2) {
      return aArray[0];
    }

    var middle = Math.floor(aArray.length / 2);

    if (aValue <= aArray[middle]) {
      return arrayBefore(aArray.slice(0, middle + 1), aValue);
    } else {
      return arrayBefore(aArray.slice(middle, aArray.length), aValue);
    }
  };

  /**
   * Shim for transition events
   */
  (function () {
    var prefixedEvents,
        triggerTransitionEnd,
        prefixedEvent;

    prefixedEvents = {
      'webkitTransitionEnd': {
        proto: 'WebKitTransitionEvent',
        init: 'initWebKitTransitionEvent'
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
   * CORE PROTOTYPES
   */

  protos = {};

  /**
   * prototype to save and safely manipulate a string value using a pattern
   */
  protos.value = {
    name: 'unknown',
    defaultValue: '',
    pattern: /^(.*)$/,
    converter: String,

    set value(aValue) {
      aValue = this.parse(aValue);

      if (aValue !== null && aValue !== this._value) {
        this._value = aValue;
        $ps.publish(this.name + '.change', aValue, true);
      }
    },

    get value() {
      return this._value;
    },

    init: function () {
      if (this.value === undefined) {
        this.value = this.defaultValue;
      }
    },

    parse: function (aValue) {
      var groups = this.pattern.exec(aValue);

      if (groups !== null && groups[1] !== undefined) {
        aValue = this.converter(groups[1]);
        return aValue;
      } else {
        $ps.publish(this.name + '.parseerror', aValue, true);
        return null;
      }
    }
  };

  /**
   * prototype to save and safely manipulate a number value using min and max
   */
  protos.numericValue = extendObject(protos.value, {
    defaultValue: 0,
    pattern: /^([0-9]+)$/,
    converter: Number,
    min: -Infinity,
    max: +Infinity,

    parse: function (aValue) {
      aValue = protos.value.parse.call(this, aValue);

      if (!isNaN(aValue) && this.min <= aValue && aValue <= this.max) {
        return aValue;
      } else {
        return null;
      }
    },

    alter: function (aMount) {
      this.value += aMount;
    }
  });

  /**
   * prototype to save and safely manipulate a dual value
   * ex: value can only be "sherlock" or "watson"
   */
  protos.dualValue = extendObject(protos.value, {
    pattern: null,
    defaultValue: '0',
    a: '0',
    b: '1',

    parse: function (aValue) {
      if (this.pattern === null) {
        this.pattern = new RegExp('^(' + this.a + '|' + this.b + ')$');
      }

      return protos.value.parse.call(this, aValue);
    },

    toggle: function () {
      this.value = (this.value === this.a) ? this.b : this.a;
    }
  });

  /**
   * specific prototype for dimension values in pixels
   */
  protos.dimensionValue = extendObject(protos.numericValue, {
    pattern: /^([0-9]+)(?:px)?$/,
    converter: parseInt,
    min: 120,
    max: 2560
  });





  /**
   * CORE
   */

  vp = {
    getRootUrl: function () {
      return $win.location.protocol + '//' + $win.location.host + $win.location.pathname;
    }
  };





  /**
   * MEMORY
   */

  vp.memory = {
    url: extendObject(protos.value, {
      name: 'url',
      pattern: /^(https?:\/\/(.*?)(?::[0-9]{1,5})?(?:\/.*)?)?$/,
      defaultValue: vp.getRootUrl() + 'help/'
    }),

    scale: extendObject(protos.numericValue, {
      name: 'scale',
      defaultValue: 100,
      pattern: /^(([0-9]{1,3})(.([0-9]))?)%?$/,
      converter: toFixed1,
      min: 10,
      max: 100
    }),

    height: extendObject(protos.dimensionValue, {
      name: 'height',
      defaultValue: 480
    }),

    width: extendObject(protos.dimensionValue, {
      name: 'width',
      defaultValue: 320
    }),

    panel: extendObject(protos.dualValue, {
      name: 'panel',
      defaultValue: '1'
    }),

    controls: extendObject(protos.dualValue, {
      name: 'controls',
      defaultValue: '1'
    }),

    autoscale: extendObject(protos.dualValue, {
      name: 'autoscale',
      defaultValue: '1'
    }),

    filter: extendObject(protos.dualValue, {
      name: 'filter',
      defaultValue: 'favourites',
      a: 'all',
      b: 'favourites'
    }),

    hold: extendObject(protos.dualValue, {
      name: 'hold',
      defaultValue: '0'
    })
  };

  $win.addEventListener('load', function (aEvent) {
    var values = ['url', 'scale', 'height', 'width', 'panel', 'controls', 'autoscale', 'filter', 'hold'],
        i;

    for (i = 0; i < values.length; i++) {
      vp.memory[values[i]].init();
    }
  }, false);




  /**
   * SPECIAL ORIENTATION BEHAVIOURS
   */

  (function () {
    vp.memory.orientation = {
      name: 'orientation',
      a: 'portrait',
      b: 'landscape',

      set value(aValue) {
        if (this.value === this.a && aValue === this.b ||
            this.value === this.b && aValue === this.a) {
          this.toggle();
        }
      },

      get value() {
        return vp.memory.height.value > vp.memory.width.value ? this.a : this.b;
      },

      toggle: function () {
        var height = vp.memory.height.value,
            width = vp.memory.width.value;

        vp.memory.height.value = width;
        vp.memory.width.value = height;
      }
    };

    var updateOrientation = function (aMsg, aData) {
      $ps.publish('orientation.change', vp.memory.orientation.value);
    };

    $ps.subscribe('height.change', updateOrientation);
    $ps.subscribe('width.change', updateOrientation);
  })();





  /**
   * LIST
   */

  (function () {
    var selectViewport,
        i;


    $win.addEventListener('load', function (aEvent) {
      dom('#list').innerHTML = $ich.listTemplate(vp);
      vp.list.sizes = [];
      for (i = 0; i < vp.list.items.length; i++) {
        arrayInsert(vp.list.sizes, +vp.list.items[i].size.min);
        arrayInsert(vp.list.sizes, +vp.list.items[i].size.max);
      }
      vp.list.sizes.sort(function (a, b) {
        return a - b;
      });
    }, false);

    dom('#list').addEventListener('click', function (aEvent) {
      var min,
          max,
          orientation;

      if (aEvent.target.classList.contains('orientation')) {
        min = Number(aEvent.target.dataset.sizeMin);
        max = Number(aEvent.target.dataset.sizeMax);
        orientation = aEvent.target.dataset.orientation;

        if (orientation === 'portrait') {
          vp.memory.height.value = max;
          vp.memory.width.value = min;
        }
        if (orientation === 'landscape') {
          vp.memory.height.value = min;
          vp.memory.width.value = max;
        }
      }
    }, false);

    selectViewport = function (aMsg, aData) {
      var min = Math.min(vp.memory.height.value, vp.memory.width.value),
          max = Math.max(vp.memory.height.value, vp.memory.width.value),
          currentSelection,
          newSelection;

      currentSelection = dom('.viewport[data-selected="1"]', true);
      if (currentSelection !== null) {
        currentSelection.dataset.selected = '0';
      }

      newSelection = dom('.viewport[data-size-min="' + min + '"][data-size-max="' + max + '"]');
      if (newSelection !== null) {
        newSelection.dataset.selected = '1';
      }
    };

    $ps.subscribe('height.change', selectViewport);
    $ps.subscribe('width.change', selectViewport);
  })();





  /**
   * VIEWPORT
   */

  (function () {
    $ps.subscribe('url.change', function (aMsg, aData) {
      dom('#viewport').src = aData;
    });

    $ps.subscribe('scale.change', function (aMsg, aData) {
      aData = (aData / 100).toFixed(3);
      dom('#viewport-wrapper').style.setProperty($pf.prefix + 'transform', 'scale(' + aData + ')', '');
    });

    $ps.subscribe('height.change', function (aMsg, aData) {
      dom('#viewport').style.setProperty('height', aData + 'px', '');
      aData = Math.round(aData / 2);
      dom('#viewport').style.setProperty('margin-top', '-' + aData + 'px', '');
    });

    $ps.subscribe('width.change', function (aMsg, aData) {
      dom('#viewport').style.setProperty('width', aData + 'px', '');
      aData = Math.round(aData / 2);
      dom('#viewport').style.setProperty('margin-left', '-' + aData + 'px', '');
    });
  })();





  /**
   * INPUTS
   */

  (function () {
    var inputs,
        setInputValue,
        addSubscribers,
        addDomListeners,
        inputName;

    inputs = {
      url: {
        suffix: ''
      },
      scale: {
        suffix: '%',
        toFixed: 1
      },
      height: {
        suffix: 'px'
      },
      width: {
        suffix: 'px'
      }
    };

    setInputValue = function (aInputName, aInput, aValue) {
      dom('#' + aInputName + ' input').value = aValue + aInput.suffix;
    };

    addSubscribers = function (aInputName, aInput) {
      $ps.subscribe(aInputName + '.change', function (aMsg, aData) {
        if (!isNaN(aInput.toFixed)) {
          aData = aData.toFixed(aInput.toFixed);
        }
        setInputValue(aInputName, aInput, aData);
        dom('#' + aInputName + ' input').blur();
      });

      $ps.subscribe(aInputName + '.parseerror', function (aMsg, aData) {
        setInputValue(aInputName, aInput, vp.memory[aInputName].value);
      });
    };

    addDomListeners = function (aInputName, aInput) {
      dom('#' + aInputName + ' input').addEventListener('change', function (aEvent) {
        vp.memory[aInputName].value = aEvent.target.value;
      }, false);

      dom('#' + aInputName + ' input').addEventListener('focus', function (aEvent) {
        dom('#' + aInputName).classList.add('focused');
      }, false);

      dom('#' + aInputName + ' input').addEventListener('blur', function (aEvent) {
        dom('#' + aInputName).classList.remove('focused');
      }, false);
    };

    for (inputName in inputs) {
      if (inputs.hasOwnProperty(inputName)) {
        addSubscribers(inputName, inputs[inputName]);
        addDomListeners(inputName, inputs[inputName]);
      }
    }
  })();





  /**
   * CURSORS
   */

  (function () {
    var cursors,
        cursorName,
        handleTitle = null,
        addSubscriber,
        firstAltEvent = null,
        horizontalHandlePadding;

    cursors = {
      scale: {
        area: dom('#scale'),
        cssProperty: 'bottom'
      },
      height: {
        area: dom('#height'),
        cssProperty: 'bottom'
      },
      width: {
        area: dom('#width'),
        cssProperty: 'left'
      }
    };

    addSubscriber = function (aCursorName, aCursor) {
      $ps.subscribe(aCursorName + '.change', function (aMsg, aData) {
        aData = (aData - vp.memory[aCursorName].min) * 100 / (vp.memory[aCursorName].max - vp.memory[aCursorName].min);
        dom('#' + aCursorName + ' .cursor').style.setProperty(aCursor.cssProperty, aData + '%', '');
      });
    };

    for (cursorName in cursors) {
      if (cursors.hasOwnProperty(cursorName)) {
        addSubscriber(cursorName, cursors[cursorName]);
      }
    }

    cursors.scale.computeValue = cursors.height.computeValue = function (aX, aY, aMemory) {
      var coeff = (aMemory.max - aMemory.min) / this.area.clientHeight;

      if (firstAltEvent !== null) {
        aY = firstAltEvent.clientY + ((aY - firstAltEvent.clientY) / (coeff * 3));
      }

      return aMemory.max - ((aY - this.area.offsetTop) * coeff);
    };

    horizontalHandlePadding = dom('#width .cursor').clientWidth - dom('#width input').clientWidth - 5;

    cursors.width.computeValue = function (aX, aY, aMemory) {
      var paddingLeft = Boolean(Number(vp.memory.panel.value)) ? dom('#panel').clientWidth : 0,
          coeff = (aMemory.max - aMemory.min) / this.area.clientWidth;

      if (firstAltEvent !== null) {
        aX = firstAltEvent.clientX + ((aX - firstAltEvent.clientX) / (coeff * 3));
      }

      return (aX - this.area.offsetLeft - paddingLeft - horizontalHandlePadding) * coeff + aMemory.min;
    };

    $win.addEventListener('mousedown', function (aEvent) {
      if (aEvent.target.classList.contains('handle')) {
        aEvent.preventDefault();
        handleTitle = aEvent.target.title;
        vp.memory.hold.value = '1';
        dom('#mask').classList.add(handleTitle + '-resize');
      }
    }, false);

    $win.addEventListener('mouseup', function (aEvent) {
      dom('#mask').classList.remove(handleTitle + '-resize');
      vp.memory.hold.value = '0';
      handleTitle = null;
    }, false);

    $win.addEventListener('mousemove', function (aEvent) {
      var min,
          max,
          val,
          before,
          after;

      if (firstAltEvent === null && aEvent.altKey) {
        firstAltEvent = aEvent;
      }

      if (firstAltEvent !== null && !aEvent.altKey) {
        firstAltEvent = null;
      }

      if (handleTitle !== null) {
        min = vp.memory[handleTitle].min;
        max = vp.memory[handleTitle].max;
        val = cursors[handleTitle].computeValue(aEvent.clientX, aEvent.clientY, vp.memory[handleTitle]);
        val = Math.max(min, val);
        val = Math.min(val, max);
        val = vp.memory[handleTitle].converter(val);

        if (aEvent.ctrlKey) {
          before = arrayBefore(vp.list.sizes, val);
          after = arrayAfter(vp.list.sizes, val);
          if (after - val > val - before) {
            vp.memory[handleTitle].value = before;
          } else {
            vp.memory[handleTitle].value = after;
          }
        } else {
          vp.memory[handleTitle].value = val;
        }
      }
    }, false);
  })();





  /**
   * HASH
   */

  (function () {
    var lastHash = $win.location.hash,
        pattern = /^#[^=&]=[^=&]*(&[^=&]=[^=&]*)*$/,
        shortToLong,
        shortName,
        parse,
        processUpdates = true,
        update;

    shortToLong = {
      u: 'url',
      s: 'scale',
      h: 'height',
      w: 'width',
      p: 'panel',
      c: 'controls',
      a: 'autoscale',
      f: 'filter'
    };

    parse = function (aForce) {
      var arrayParams,
          keyValue,
          parsedParams = {},
          i;

      if (lastHash !== $win.location.hash || aForce === true) {
        arrayParams = $win.location.hash.slice(1).split('&');

        if (pattern.test($win.location.hash)) {
          for (i = 0; i < arrayParams.length; i += 1) {
            keyValue = arrayParams[i].split('=');
            parsedParams[keyValue[0]] = decodeURIComponent(keyValue[1]);
            vp.memory[shortToLong[keyValue[0]]].value = parsedParams[keyValue[0]];
          }
          if (arrayParams.length !== Object.keys(shortToLong).length) {
            update();
          }
        }
      }
    };

    $win.addEventListener('hashchange', parse, false);

    update = function () {
      var newHash,
          shortName;

      if (processUpdates) {
        newHash = [];
        for (shortName in shortToLong) {
          if (shortToLong.hasOwnProperty(shortName)) {
            newHash.push(shortName + '=' + encodeURIComponent(vp.memory[shortToLong[shortName]].value));
          }
        }

        newHash = '#' + newHash.join('&');
        if (newHash !== $win.location.hash) {
          lastHash = $win.location.hash = newHash;
        }
      }
    };

    for (shortName in shortToLong) {
      if (shortToLong.hasOwnProperty(shortName)) {
        $ps.subscribe(shortToLong[shortName] + '.change', update);
        $ps.subscribe(shortToLong[shortName] + '.parseerror', update);
      }
    }

    $ps.subscribe('hold.change', function (aMsg, aData) {
      processUpdates = !Boolean(Number(aData));
      if (processUpdates) {
        update();
      }
    });

    $win.addEventListener('load', function (aEvent) {
      parse(true);
    }, false);
  })();





  /**
   * TITLE
   */

  (function () {
    var values = ['url', 'height', 'width'],
        processUpdates = true,
        update;

    update = function () {
      if (processUpdates) {
        var width = vp.memory.width.value,
            height = vp.memory.height.value,
            url = vp.memory.url.pattern.exec(vp.memory.url.value)[2];

        $doc.title = width + '\u2a09' + height + ' - ' + url + ' - Viewports';
      }
    };

    for (var i = 0; i < values.length; i++) {
      $ps.subscribe(values[i] + '.change', update);
    }

    $ps.subscribe('hold.change', function (aMsg, aData) {
      processUpdates = !Boolean(Number(aData));
      if (processUpdates) {
        update(true);
      }
    });

    $win.addEventListener('load', function (aEvent) {
      update();
    }, false);
  })();





  /**
   * KEYBOARD
   */

  (function () {
    var listeners = {
      'pageup': function () {
        vp.memory.scale.alter(1);
      },
      'pageup+shift': function () {
        vp.memory.scale.alter(10);
      },
      'pagedown': function () {
        vp.memory.scale.alter(-1);
      },
      'pagedown+shift': function () {
        vp.memory.scale.alter(-10);
      },

      'up': function () {
        vp.memory.height.alter(1);
      },
      'up+ctrl': function () {
        vp.memory.height.value = arrayAfter(vp.list.sizes, vp.memory.height.value);
      },
      'up+shift': function () {
        vp.memory.height.alter(10);
      },
      'down': function () {
        vp.memory.height.alter(-1);
      },
      'down+ctrl': function () {
        vp.memory.height.value = arrayBefore(vp.list.sizes, vp.memory.height.value);
      },
      'down+shift': function () {
        vp.memory.height.alter(-10);
      },

      'right': function () {
        vp.memory.width.alter(1);
      },
      'right+ctrl': function () {
        vp.memory.width.value = arrayAfter(vp.list.sizes, vp.memory.width.value);
      },
      'right+shift': function () {
        vp.memory.width.alter(10);
      },
      'left': function () {
        vp.memory.width.alter(-1);
      },
      'left+ctrl': function () {
        vp.memory.width.value = arrayBefore(vp.list.sizes, vp.memory.width.value);
      },
      'left+shift': function () {
        vp.memory.width.alter(-10);
      },

      'O': function () {
        vp.memory.hold.value = '0';
        vp.memory.orientation.toggle();
      },

      'P': function () {
        vp.memory.hold.value = '0';
        vp.memory.panel.toggle();
      },

      'C': function () {
        vp.memory.hold.value = '0';
        vp.memory.controls.toggle();
      },

      'A': function () {
        vp.memory.hold.value = '0';
        vp.memory.autoscale.toggle();
      },

      'F': function () {
        vp.memory.hold.value = '0';
        vp.memory.filter.toggle();
      }
    };

    $win.addEventListener('keydown', function (aEvent) {
      if (aEvent.target.nodeName === 'INPUT') {
        return;
      }

      vp.memory.hold.value = '1';

      var keyCombination = keyNames(aEvent);

      if (listeners[keyCombination] !== undefined) {
        listeners[keyCombination]();
        aEvent.preventDefault();
      }
    }, false);

    $win.addEventListener('keyup', function (aEvent) {
      var keyCombination = keyNames(aEvent);

      if (listeners[keyCombination] !== undefined) {
        vp.memory.hold.value = '0';
      }
    }, false);
  })();





  /**
   * DISPLAY
   */

  (function () {
    var displayElements,
        addSubscribers,
        addDomListeners,
        elementName;

    displayElements = {
      orientation: 'both',
      panel: 'toggle',
      controls: 'toggle',
      autoscale: 'toggle',
      filter: 'both',
      hold: 'nobutton'
    };

    addSubscribers = function (aElementName) {
      $ps.subscribe(aElementName + '.change', function (aMsg, aData) {
        dom('body').dataset[aElementName] = aData;
      });
    };

    addDomListeners = function (aElementName) {
      if (displayElements[aElementName] === 'both') {
        dom('#' + aElementName + '-' + vp.memory[aElementName].a).addEventListener('click', function (aEvent) {
          vp.memory[aElementName].value = vp.memory[aElementName].a;
        }, false);

        dom('#' + aElementName + '-' + vp.memory[aElementName].b).addEventListener('click', function (aEvent) {
          vp.memory[aElementName].value = vp.memory[aElementName].b;
        }, false);
      }

      if (displayElements[aElementName] === 'toggle') {
        dom('#' + aElementName + '-switch').addEventListener('click', function (aEvent) {
          vp.memory[aElementName].toggle();
        }, false);
      }
    };

    for (elementName in displayElements) {
      if (displayElements.hasOwnProperty(elementName)) {
        addSubscribers(elementName);
        addDomListeners(elementName);
      }
    }
  })();





  /**
   * BOOKMARKLETS
   */

  (function () {
    $win.addEventListener('click', function (aEvent) {
      if (aEvent.target.dataset !== null && aEvent.target.dataset.bookmarklet === 'only') {
        aEvent.preventDefault();
      }
    }, false);

    $win.addEventListener('load', function (aEvent) {
      dom('h1 a').href = 'javascript:location.href="' + vp.getRootUrl() + '#u="+encodeURIComponent(location.href)';
    }, false);
  })();





  /**
   * RESIZE
   */

  (function () {
    var values = ['height', 'width', 'panel', 'controls'],
        scale;

    scale = function (aEvent) {
      var clientH,
          clientW,
          height,
          width,
          newScale;

      if (Boolean(Number(vp.memory.autoscale.value))) {
        clientH = dom('#viewport-wrapper').clientHeight;
        clientW = dom('#viewport-wrapper').clientWidth;
        height = vp.memory.height.value;
        width = vp.memory.width.value;
        newScale = vp.memory.scale.value;

        if (height > clientH || width > clientW) {
          if ((height - clientH) / height > (width - clientW) / width) {
            newScale = clientH / height * 100;
          } else {
            newScale = clientW / width * 100;
          }
        } else {
          newScale = 100;
        }

        newScale = vp.memory.scale.converter(newScale);
        vp.memory.scale.value = newScale;
      }
    };

    for (var i = 0; i < values.length; i++) {
      $ps.subscribe(values[i] + '.change', scale);
    }

    $win.addEventListener('resize', scale, false);
    $win.addEventListener('transitionend', scale, false);
  })();

  return vp;
})(window, document, PubSub, PrefixFree, ich);
