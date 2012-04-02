var vp = (function(vp) {
  'use strict';

  /**
   * HELPERS
   */

  /**
   * Helper to extend object using Object.create but without having to specify 
   * all the properties like value, writable, enumerable, configurable...
   */
  var extendObject = function(aProto, aExtensionObject) {
    var newObject = Object.create(aProto);
    for(var key in aExtensionObject) {
      if(aExtensionObject.hasOwnProperty(key)) {
        newObject[key] = aExtensionObject[key];
      }
    }
    return newObject;
  };

  /**
   * Helper for DOM with 'cache' using CSS selector
   * document.querySelector('div') => $('div')
   */
  var $ = (function() {
    var cache = {};
    
    return function(aQuery, force) {
      if (!(aQuery in cache) || force === true) {
        cache[aQuery] = document.querySelector(aQuery);
      }
      return cache[aQuery];
    }
  })();

  /**
   * Helper to translate keyCode into a human readable keyName
   */
  var keyNames = (function() {
    var specials = {
      '38': 'up',
      '40': 'down',
      '39': 'right',
      '37': 'left',
      '33': 'pageup',
      '34': 'pagedown'
    };
  
    return function(e) {
      var key = null;
      
      if (e.keyCode in specials) {
        key = specials[e.keyCode];
      } else {
        key = String.fromCharCode(e.keyCode);
      }
      
      key += e.shiftKey ? '+shift' : '';
      
      return key;
    }
  })();

  /**
   * Helper to format a number to only one digit after decimal point
   */
  var toFixed1 = function(aValue) {
    return Number(Number(aValue).toFixed(1));
  };

  /**
   * Shim for transition events
   */
  (function() {
    var events = {
      'webkitTransitionEnd': {
        proto: 'WebKitTransitionEvent',
        init: 'initWebKitTransitionEvent'
      },
      'oTransitionEnd': {
        proto: 'OTransitionEvent',
        init: 'initTransitionEvent'
      }
    }
    
    var triggerTransitionEnd = function(e) {
      var evt = document.createEvent(events[e.type].proto);
      evt[events[e.type].init]('transitionend', true, true, e.propertyName, e.elapsedTime);
      dispatchEvent(evt);
    };
    
    for (var event in events) {
      addEventListener(event, triggerTransitionEnd, false);
    }
  })();





  /**
   * CORE PROTOTYPES
   */

  var protos = {};

  /**
   * prototype to save and safely manipulate a string value using a pattern
   */
  protos.value = {
    name: "unknown",
    value: "",
    pattern: /^(.*)$/,
    converter: String,

    set: function(aValue) {
      aValue = this.parse(aValue);
      if (aValue!== null && aValue !== this.value) {
        this.value = aValue;
        PubSub.publish(this.name + '.change', aValue, true);
      }
    },

    get: function() {
      return this.value;
    },

    parse: function(aValue) {
      var groups = this.pattern.exec(aValue);
      
      if (groups && groups[1]) {
        aValue = this.converter(groups[1]);
        return aValue;
      } else {
        PubSub.publish(this.name + '.parseerror', aValue, true);
        return null;
      }
    }
  };

  /**
   * prototype to save and safely manipulate a number value using min and max
   */
  protos.numericValue = extendObject(protos.value, {
    value: 0,
    pattern: /^([0-9]+)$/,
    converter: Number,
    min: -Infinity,
    max: +Infinity,

    parse: function(aValue) {
      aValue = protos.value.parse.call(this, aValue);
    
      if (!isNaN(aValue) && aValue >= this.min && aValue <= this.max) {
        return aValue;
      } else {
        return null;
      }
    },

    alter: function(aMount) {
      this.set(this.get() + aMount);
    }
  });

  /**
   * prototype to save and safely manipulate a dual value
   * ex: value can only be "sherlock" or "watson"
   */
  protos.dualValue = extendObject(protos.value, {
    pattern: null,
    a: '0',
    b: '1',
    
    parse: function(aValue) {
      if (!this.pattern) {
        this.pattern = new RegExp('^(' + this.a + '|' + this.b + ')$');
      }
      return protos.value.parse.call(this, aValue);
    },

    toggle: function() {
      this.set(this.get() === this.a ? this.b : this.a);
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
   * MEMORY
   */

  vp.memory = {
    url: extendObject(protos.value, {
      name: 'url',
      pattern: /^(https?:\/\/(.*?)(?::[0-9]{1,5})?(?:\/.*)?)?$/,
      value: location.origin + location.pathname + 'help'
    }),

    scale: extendObject(protos.numericValue, {
      name: 'scale',
      value: 100,
      pattern: /^(([0-9]{1,3})(.([0-9]))?)%?$/,
      converter: toFixed1,
      min: 10,
      max: 100
    }),

    min: extendObject(protos.dimensionValue, {
      name: 'min',
      value: 320
    }),

    max: extendObject(protos.dimensionValue, {
      name: 'max',
      value: 480
    }),

    orientation: extendObject(protos.dualValue, {
      name: 'orientation',
      value: 'portrait',
      a: 'portrait',
      b: 'landscape'
    }),

    panel: extendObject(protos.dualValue, {
      name: 'panel',
      value: '1'
    }),

    controls: extendObject(protos.dualValue, {
      name: 'controls',
      value: '1'
    }),

    autoscale: extendObject(protos.dualValue, {
      name: 'autoscale',
      value: '1'
    }),

    filter: extendObject(protos.dualValue, {
      name: 'filter',
      value: 'all',
      a: 'all',
      b: 'favourites'
    }),

    hold: extendObject(protos.dualValue, {
      name: 'hold',
      value: '0'
    })
  };
  
  addEventListener('load', function() {
    vp.memory.height = vp.memory.max;
    vp.memory.width = vp.memory.min;
  }, false);





  /**
   * SPECIAL ORIENTATION BEHAVIOURS
   */

  (function() {
    var transformMinMaxToHeightWidth = function(aMsg, aData) {
      var valueEvent = aMsg.split('.');
      
      if (vp.memory.orientation.get() === 'portrait' && valueEvent[0] === 'max'
        || vp.memory.orientation.get() === 'landscape' && valueEvent[0] === 'min') {
        valueEvent[0] = 'height';
      } else {
        valueEvent[0] = 'width';
      }
      
      PubSub.publish(valueEvent.join('.'), aData, true);
    };
    
    PubSub.subscribe('min.change', transformMinMaxToHeightWidth);
    PubSub.subscribe('min.parseerror', transformMinMaxToHeightWidth);
    
    PubSub.subscribe('max.change', transformMinMaxToHeightWidth);
    PubSub.subscribe('max.parseerror', transformMinMaxToHeightWidth);

    PubSub.subscribe('orientation.change', function(aMsg, aData) {
      if (vp.memory.orientation.get() === 'portrait') {
        vp.memory.height = vp.memory.max;
        PubSub.publish('height.change', vp.memory.max.get(), true);
        vp.memory.width = vp.memory.min;
        PubSub.publish('width.change', vp.memory.min.get(), true);
      } else {
        vp.memory.height = vp.memory.min;
        PubSub.publish('height.change', vp.memory.min.get(), true);
        vp.memory.width = vp.memory.max;
        PubSub.publish('width.change', vp.memory.max.get(), true);
      }
    });
  })();





  /**
   * VIEWPORT
   */
  
  (function() {
    PubSub.subscribe('url.change', function(aMsg, aData) {
      $('#viewport').src = aData;
    });

    PubSub.subscribe('scale.change', function(aMsg, aData) {
      aData = (aData / 100).toFixed(3);
      $('#viewport-wrapper').style.setProperty(PrefixFree.prefix + 'transform', 'scale(' + aData + ')', '');
    });

    PubSub.subscribe('height.change', function(aMsg, aData) {
      $('#viewport').style.setProperty('height', aData + 'px', '');
      aData = Math.round(aData / 2);
      $('#viewport').style.setProperty('margin-top', '-' + aData + 'px', '');
    });

    PubSub.subscribe('width.change', function(aMsg, aData) {
      $('#viewport').style.setProperty('width', aData + 'px', '');
      aData = Math.round(aData / 2);
      $('#viewport').style.setProperty('margin-left', '-' + aData + 'px', '');
    });
  })();





  /**
   * INPUTS
   */
  
  (function() {
    var inputs = {
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

    for (var inputName in inputs) {
      (function(inputName, input) {
        PubSub.subscribe(inputName + '.change', function(aMsg, aData) {
          if (input.toFixed) {
            aData = aData.toFixed(input.toFixed);
          }
          $('#' + inputName + ' input').value = aData + input.suffix;
        });

        $('#' + inputName + ' input').addEventListener('change', function(e) {
          vp.memory[inputName].set(e.target.value);
        }, false);
      })(inputName, inputs[inputName]);
    }
  })();





  /**
   * CURSORS
   */

  (function() {
    var cursors = {
      scale: { 
        area: $('#scale'),
        cssProperty: 'bottom'
      },
      height: { 
        area: $('#height'),
        cssProperty: 'bottom'
      },
      width: {
        area: $('#width'),
        cssProperty: 'left'
      }
    };
    
    for (var cursorName in cursors) {
      (function(cursorName, cursor) {
        PubSub.subscribe(cursorName + '.change', function(aMsg, aData) {
          aData = (aData - vp.memory[cursorName].min) * 100 / (vp.memory[cursorName].max - vp.memory[cursorName].min);
          $('#' + cursorName + ' .cursor').style.setProperty(cursor.cssProperty, aData + '%', '');
        });
      })(cursorName, cursors[cursorName]);
    }
    
    var handleTitle = null;
    
    cursors.scale.computeValue = cursors.height.computeValue = function(x, y, memory) {
      return memory.max - ((y - this.area.offsetTop) * (memory.max - memory.min) / this.area.clientHeight);
    };

    var horizontalHandlePadding = $('#width .cursor').clientWidth - $('#width input').clientWidth;

    cursors.width.computeValue = function(x, y, memory) {
      var paddingLeft = !!+vp.memory.panel.get() ? $('#panel').clientWidth : 0;
      return (x - this.area.offsetLeft - paddingLeft - horizontalHandlePadding) * (memory.max - memory.min) / this.area.clientWidth + memory.min;
    };
    
    addEventListener('mousedown', function(e) {
      if (e.target.classList.contains('handle')) {
        e.preventDefault();
        handleTitle = e.target.title;
        vp.memory.hold.set('1');
        $('#mask').classList.add(handleTitle + '-resize');
      }
    }, false);

    addEventListener('mouseup', function(e) {
      $('#mask').classList.remove(handleTitle + '-resize');
      vp.memory.hold.set('0');
      handleTitle = null;
    }, false);

    addEventListener('mousemove', function(e) {
      if (handleTitle) {
        var min = vp.memory[handleTitle].min,
        max = vp.memory[handleTitle].max,
        val = cursors[handleTitle].computeValue(e.clientX, e.clientY, vp.memory[handleTitle]);
        val = Math.max(min, val);
        val = Math.min(val, max);
        val = vp.memory[handleTitle].converter(val);
        vp.memory[handleTitle].set(val);
      }
    }, false);
  })();





  /**
   * HASH
   */
  
  (function() {
    var lastHash = location.hash,
    pattern = /^#[^=^&]{1,2}=[^=^&]*(&[^=^&]{1,2}=[^=^&]*)*$/;

    var shortToLong = {
      u: 'url',
      s: 'scale',
      mi : 'min',
      ma: 'max',
      o: 'orientation',
      p: 'panel',
      c: 'controls',
      a: 'autoscale',
      f: 'filter'
    };

    var parse = function(force) {
      if (lastHash !== location.hash || force === true) {
        var arrayParams = location.hash.slice(1).split('&'),
        keyValue,
        parsedParams = {};

        if (pattern.test(location.hash)) {
          for (var i = 0; i < arrayParams.length; i += 1) {
            keyValue = arrayParams[i].split('=');
            parsedParams[keyValue[0]] = decodeURIComponent(keyValue[1]);
            vp.memory[shortToLong[keyValue[0]]].set(parsedParams[keyValue[0]]);
          }
        }
      }
    };
  
    addEventListener('hashchange', parse, false);
    
    var processUpdates = true;

    var update = function() {
      if (processUpdates) {
        var newHash = [];
        for (var shortName in shortToLong) {
          newHash.push(shortName + '=' + encodeURIComponent(vp.memory[shortToLong[shortName]].get()));
        }

        newHash = '#' + newHash.join('&');
        if (newHash !== lastHash) {
          lastHash = location.hash = newHash;
        }
      }
    };
    
    for (var shortName in shortToLong) {
      PubSub.subscribe(shortToLong[shortName] + '.change', update);
    }
    
    PubSub.subscribe('hold.change', function(aMsg, aData) {
      processUpdates = !+aData;
      if (processUpdates) {
        update();
      }
    });
  
    addEventListener('load', function() {
      parse(true);
      update();
    }, false);
  })();





  /**
   * TITLE
   */
  
  (function() {
    var values = ['url', 'min', 'max', 'orientation'];
    
    var processUpdates = true;

    var update = function() {
      if (processUpdates) {
        var min = vp.memory.min.get(),
        max = vp.memory.max.get(),
        orientation = vp.memory.orientation.get()[0].toUpperCase(),
        url = vp.memory.url.pattern.exec(vp.memory.url.get())[2];

        document.title = min + '\u2a09' + max + ' (' + orientation + ') ' + url + ' - Viewports';
      }
    };
    
    for (var i = 0; i < values.length; i++) {
      PubSub.subscribe(values[i] + '.change', update);
    }
    
    PubSub.subscribe('hold.change', function(aMsg, aData) {
      processUpdates = !+aData;
      if (processUpdates) {
        update(true);
      }
    });
  
    addEventListener('load.change', function() {
      update();
    }, false);
  })();





  /**
   * KEYBOARD
   */

  (function() {
    var listeners = {
      'pageup': function() {
        vp.memory.scale.alter(1);
      },
      'pageup+shift': function() {
        vp.memory.scale.alter(10);
      },
      'pagedown': function() {
        vp.memory.scale.alter(-1);
      },
      'pagedown+shift': function() {
        vp.memory.scale.alter(-10);
      },
      
      'up': function() {
        vp.memory.height.alter(1);
      },
      'up+shift': function() {
        vp.memory.height.alter(10);
      },
      'down': function() {
        vp.memory.height.alter(-1);
      },
      'down+shift': function() {
        vp.memory.height.alter(-10);
      },
      
      'right': function() {
        vp.memory.width.alter(1);
      },
      'right+shift': function() {
        vp.memory.width.alter(10);
      },
      'left': function() {
        vp.memory.width.alter(-1);
      },
      'left+shift': function() {
        vp.memory.width.alter(-10);
      },
      
      'O': function() {
        vp.memory.hold.set('0');
        vp.memory.orientation.toggle();
      },
      
      'P': function() {
        vp.memory.hold.set('0');
        vp.memory.panel.toggle();
      },
      
      'C': function() {
        vp.memory.hold.set('0');
        vp.memory.controls.toggle();
      },
      
      'A': function() {
        vp.memory.hold.set('0');
        vp.memory.autoscale.toggle();
      },
      
      'F': function() {
        vp.memory.filter.toggle();
      }
    };
    
    addEventListener('keydown', function(e) {
      if (e.target.nodeName === 'INPUT') {
        return;
      }
      
      vp.memory.hold.set('1');
      
      var keyCombination = keyNames(e);

      if (listeners[keyCombination]) {
        listeners[keyCombination]();
        e.preventDefault();
      }
    }, false);
    
    addEventListener('keyup', function(e) {
      vp.memory.hold.set('0');
    }, false);
  })();





  /**
   * DISPLAY
   */

  (function() {
    var displayElements = {
      orientation: 'both',
      panel: 'toggle',
      controls: 'toggle',
      autoscale: 'toggle',
      filter: 'both',
      hold: 'nobutton'
    };

    for (var elementName in displayElements) {
      (function(elementName) {
        PubSub.subscribe(elementName + '.change', function(aMsg, aData) {
          $('body').dataset[elementName] = aData;
        });
        
        if (displayElements[elementName] === 'both') {
          $('#' + elementName + '-' + vp.memory[elementName].a).addEventListener('click', function(e) {
            vp.memory[elementName].set(vp.memory[elementName].a);
          }, false);
          
          $('#' + elementName + '-' + vp.memory[elementName].b).addEventListener('click', function(e) {
            vp.memory[elementName].set(vp.memory[elementName].b);
          }, false);
        }
        if (displayElements[elementName] === 'toggle') {
          $('#' + elementName + '-switch').addEventListener('click', function(e) {
            vp.memory[elementName].toggle();
          }, false);
        }
      })(elementName);
    }
  })();





  /**
   * RESIZE
   */

  (function() {
    var values = ['min', 'max', 'orientation', 'panel', 'controls'];
    
    var scale = function(e) {
      if (!!+vp.memory.autoscale.get()) {
        var clientH = $('#viewport-wrapper').clientHeight,
        clientW = $('#viewport-wrapper').clientWidth,
        height = vp.memory.height.get(),
        width = vp.memory.width.get(),
        newScale = vp.memory.scale.get();

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
        vp.memory.scale.set(newScale);
      }
    };
    
    for (var i = 0; i < values.length; i++) {
      PubSub.subscribe(values[i] + '.change', scale);
    }
    
    addEventListener('resize', scale, false);
    addEventListener('transitionend', scale, false);
  })();
  
  return vp;
})({});