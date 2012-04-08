/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */
/**
 * Viewports : bookmarklets
 */

(function () {
  'use strict';

  var $win = window,
      $ps = $win.PubSub,
      $dqs = $win.dqs,
      $mem = $win.$viewports.memory,
      values = ['height', 'width', 'panel', 'controls'],
      scale,
      i;

  scale = function (aEvent) {
    var clientH,
        clientW,
        height,
        width,
        newScale;

    if (Boolean(Number($mem.autoscale.value))) {
      clientH = $dqs('#viewport-wrapper').clientHeight;
      clientW = $dqs('#viewport-wrapper').clientWidth;
      height = $mem.height.value;
      width = $mem.width.value;
      newScale = $mem.scale.value;

      if (height > clientH || width > clientW) {
        if ((height - clientH) / height > (width - clientW) / width) {
          newScale = clientH / height * 100;
        } else {
          newScale = clientW / width * 100;
        }
      } else {
        newScale = 100;
      }

      newScale = $mem.scale.converter(newScale);
      $mem.scale.value = newScale;
    }
  };

  for (i = 0; i < values.length; i += 1) {
    $ps.subscribe(values[i] + '.change', scale);
  }

  $win.addEventListener('resize', scale, false);
  $win.addEventListener('transitionend', scale, false);

})();
