/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : title
 */

(function () {
  'use strict';

  var $win = window,
      $doc = $win.document,
      $ps = $win.PubSub,
      $mem = $win.$viewports.memory,
      values = ['url', 'height', 'width'],
      processUpdates = true,
      update,
      i;

  update = function () {
    if (processUpdates) {
      var width = $mem.width.value,
          height = $mem.height.value,
          url = $mem.url.pattern.exec($mem.url.value)[2];

      $doc.title = width + 'x' + height + ' - ' + url + ' - Viewports';
    }
  };

  for (i = 0; i < values.length; i += 1) {
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
