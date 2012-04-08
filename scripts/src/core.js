/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : core
 */

(function () {
  'use strict';

  var $win = window,
      $loc = $win.location;

  /**
   * GLOBAL!!
   */
  $win.$viewports = {
    getRootUrl: function () {
      return $loc.protocol + '//' + $loc.host + $loc.pathname;
    }
  };

})();