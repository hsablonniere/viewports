/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : favourite
 */

(function () {
  'use strict';

  var $win = window,
      $dqs = $win.dqs,
      $ps = $win.PubSub,
      $mem = $win.$viewports.memory;

  $dqs('#list').addEventListener('click', function (aEvent) {
    if (aEvent.target.classList.contains('favourite')) {
      $mem.list.toggleFavourite(aEvent.target.dataset.sizeMin, aEvent.target.dataset.sizeMax);
    }
  }, false);

  $ps.subscribe('favourite.change', function (aMsg, aData) {
    var min = aData.size.min,
        max = aData.size.max,
        favourite = aData.favourite,
        viewport;

    viewport = $dqs('.viewport[data-size-min="' + min + '"][data-size-max="' + max + '"]');
    if (viewport !== null) {
      viewport.dataset.favourite = favourite;
    }

    localStorage.setItem('viewports.' + $mem.list.getIndex(min, max) + '.favourite', favourite);
  });

  $ps.subscribe('list.loaded', function (aMsg, aData) {
    var itemIdx,
        favourite;

    for (itemIdx in aData) {
      if (aData.hasOwnProperty(itemIdx)) {
        favourite = localStorage.getItem('viewports.' + itemIdx + '.favourite');
        if (favourite !== null) {
          $mem.list.toggleFavourite(aData[itemIdx].size.min, aData[itemIdx].size.max, favourite);
        }
      }
    }
  }, false);

})();