/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : prototypes
 */

(function () {
  'use strict';

  var $win = window,
      $ps = $win.PubSub,
      protos = $win.$viewports.protos = {};

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
  protos.numericValue = protos.value.createSimple({
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
  protos.dualValue = protos.value.createSimple({
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
  protos.dimensionValue = protos.numericValue.createSimple({
    pattern: /^([0-9]+)(?:px)?$/,
    converter: parseInt,
    min: 120,
    max: 2560
  });

})();
