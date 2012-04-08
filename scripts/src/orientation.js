/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : orientation
 */

(function () {
  'use strict';

  var $win = window,
      $ps = $win.PubSub,
      $mem = $win.$viewports.memory,
      orientation;

  orientation = $mem.orientation = {
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
      return $mem.height.value > $mem.width.value ? this.a : this.b;
    },

    toggle: function () {
      var height = $mem.height.value,
          width = $mem.width.value;

      $mem.height.value = width;
      $mem.width.value = height;
    }
  };

  var updateOrientation = function (aMsg, aData) {
    $ps.publish('orientation.change', orientation.value);
  };

  $ps.subscribe('height.change', updateOrientation);
  $ps.subscribe('width.change', updateOrientation);

})();
