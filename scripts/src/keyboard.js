/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : keyboard
 */

(function () {
  'use strict';

  var $win = window,
      $mem = $win.$viewports.memory,
      $list = $win.$viewports.list,
      listeners;

  listeners = {
    'pageup': function () {
      $mem.scale.alter(1);
    },
    'pageup+shift': function () {
      $mem.scale.alter(10);
    },
    'pagedown': function () {
      $mem.scale.alter(-1);
    },
    'pagedown+shift': function () {
      $mem.scale.alter(-10);
    },

    'up': function () {
      $mem.height.alter(1);
    },
    'up+ctrl': function () {
      $mem.height.value = $list.sizes.closestAfter($mem.height.value);
    },
    'up+shift': function () {
      $mem.height.alter(10);
    },
    'down': function () {
      $mem.height.alter(-1);
    },
    'down+ctrl': function () {
      $mem.height.value = $list.sizes.closestBefore($mem.height.value);
    },
    'down+shift': function () {
      $mem.height.alter(-10);
    },

    'right': function () {
      $mem.width.alter(1);
    },
    'right+ctrl': function () {
      $mem.width.value = $list.sizes.closestAfter($mem.width.value);
    },
    'right+shift': function () {
      $mem.width.alter(10);
    },
    'left': function () {
      $mem.width.alter(-1);
    },
    'left+ctrl': function () {
      $mem.width.value = $list.sizes.closestBefore($mem.width.value);
    },
    'left+shift': function () {
      $mem.width.alter(-10);
    },

    'O': function () {
      $mem.hold.value = '0';
      $mem.orientation.toggle();
    },

    'P': function () {
      $mem.hold.value = '0';
      $mem.panel.toggle();
    },

    'C': function () {
      $mem.hold.value = '0';
      $mem.controls.toggle();
    },

    'A': function () {
      $mem.hold.value = '0';
      $mem.autoscale.toggle();
    },

    'F': function () {
      $mem.hold.value = '0';
      $mem.filter.toggle();
    }
  };

  $win.addEventListener('keydown', function (aEvent) {
    if (aEvent.target.nodeName === 'INPUT') {
      return;
    }

    $mem.hold.value = '1';

    var keyCombination = aEvent.keyName();

    if (listeners[keyCombination] !== undefined) {
      listeners[keyCombination]();
      aEvent.preventDefault();
    }
  }, false);

  $win.addEventListener('keyup', function (aEvent) {
    var keyCombination = aEvent.keyName();

    if (listeners[keyCombination] !== undefined) {
      $mem.hold.value = '0';
    }
  }, false);

})();
