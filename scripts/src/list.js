/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : list
 */

(function () {
  'use strict';

  var $win = window,
      $ich = $win.ich,
      $ps = $win.PubSub,
      $dqs = $win.dqs,
      $vp = $win.$viewports,
      $mem = $vp.memory,
      selectViewport;

  $ps.subscribe('list.load', function (aMsg, aData) {
    var i;

    for (i = 0; i < aData.items.length; i += 1) {
      $mem.list.add(aData.items[i]);
    }

    if (!$ich.listTemplate) {
      $ich.refresh();
    }

    $mem.list.items.sort(function (a, b) {
      if (a.size.min === b.size.min) {
        return a.size.max - b.size.max;
      } else {
        return a.size.min - b.size.min;
      }
    });

    $dqs('#list').innerHTML = $ich.listTemplate({
      items: $mem.list.items,
      getRootUrl: $vp.getRootUrl
    });

    $ps.publish('list.loaded', $mem.list.indexedItems);
  });

  $dqs('#list').addEventListener('click', function (aEvent) {
    var min,
        max,
        orientation;

    if (aEvent.target.classList.contains('orientation')) {
      min = Number(aEvent.target.dataset.sizeMin);
      max = Number(aEvent.target.dataset.sizeMax);
      orientation = aEvent.target.dataset.orientation;

      if (orientation === 'portrait') {
        $mem.height.value = max;
        $mem.width.value = min;
      } else {
        $mem.height.value = min;
        $mem.width.value = max;
      }
    }
  }, false);

  selectViewport = function (aMsg, aData) {
    var min = Math.min($mem.height.value, $mem.width.value),
        max = Math.max($mem.height.value, $mem.width.value),
        currentSelection,
        newSelection;

    currentSelection = $dqs('.viewport[data-selected="1"]', true);
    if (currentSelection !== null) {
      currentSelection.dataset.selected = '0';
    }

    newSelection = $dqs('.viewport[data-size-min="' + min + '"][data-size-max="' + max + '"]');
    if (newSelection !== null) {
      newSelection.scrollIntoViewIfNeeded(false);
      newSelection.dataset.selected = '1';
    }
  };

  $ps.subscribe('height.change', selectViewport);
  $ps.subscribe('width.change', selectViewport);

})();
