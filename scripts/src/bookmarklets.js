/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : bookmarklets
 */

(function () {
  'use strict';

  var $win = window,
      $dqs = $win.dqs,
      $getRootUrl = $win.$viewports.getRootUrl;

  $win.addEventListener('click', function (aEvent) {
    if (aEvent.target.dataset !== null && aEvent.target.dataset.bookmarklet === 'only') {
      aEvent.preventDefault();
    }
  }, false);

  $win.addEventListener('load', function (aEvent) {
    $dqs('h1 a').href = 'javascript:(function(){location.href="' + $getRootUrl() + '#u="+encodeURIComponent(location.href)})()';
  }, false);

})();