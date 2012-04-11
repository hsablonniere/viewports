/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : orientation
 */

(function () {
  'use strict';

  var $win = window,
      $ps = $win.PubSub,
      $mem = $win.$viewports.memory,
      updateOrientation;

  updateOrientation = function (aMsg, aData) {
    $ps.publish('orientation.change', $mem.orientation.value);
  };

  $ps.subscribe('height.change', updateOrientation);
  $ps.subscribe('width.change', updateOrientation);

})();
