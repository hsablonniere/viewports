/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : iframe
 */

(function () {
  'use strict';

  var $win = window,
      $ps = $win.PubSub,
      $pf = $win.PrefixFree,
      $dqs = $win.dqs;

  $ps.subscribe('url.change', function (aMsg, aData) {
    $dqs('#viewport').src = aData;
  });

  $ps.subscribe('url.refresh', function (aMsg, aData) {
    $dqs('#viewport').refresh();
  });

  $ps.subscribe('scale.change', function (aMsg, aData) {
    aData = (aData / 100).toFixed(3);
    $dqs('#viewport-wrapper').style.setProperty($pf.prefixProperty('transform'), 'scale(' + aData + ')', '');
  });

  $ps.subscribe('height.change', function (aMsg, aData) {
    $dqs('#viewport').style.setProperty('height', aData + 'px', '');
    aData = Math.round(aData / 2);
    $dqs('#viewport').style.setProperty('margin-top', '-' + aData + 'px', '');
  });

  $ps.subscribe('width.change', function (aMsg, aData) {
    $dqs('#viewport').style.setProperty('width', aData + 'px', '');
    aData = Math.round(aData / 2);
    $dqs('#viewport').style.setProperty('margin-left', '-' + aData + 'px', '');
  });

})();
