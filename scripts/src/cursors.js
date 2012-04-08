/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : cursors
 */

(function () {
  'use strict';

  var $win = window,
      $ps = $win.PubSub,
      $dqs = $win.dqs,
      $mem = $win.$viewports.memory,
      $list = $win.$viewports.list,
      cursors,
      cursorName,
      handleTitle = null,
      addSubscriber,
      firstAltEvent = null,
      horizontalHandlePadding;

  cursors = {
    scale: {
      area: $dqs('#scale'),
      cssProperty: 'bottom'
    },
    height: {
      area: $dqs('#height'),
      cssProperty: 'bottom'
    },
    width: {
      area: $dqs('#width'),
      cssProperty: 'left'
    }
  };

  addSubscriber = function (aCursorName, aCursor) {
    $ps.subscribe(aCursorName + '.change', function (aMsg, aData) {
      aData = (aData - $mem[aCursorName].min) * 100 / ($mem[aCursorName].max - $mem[aCursorName].min);
      $dqs('#' + aCursorName + ' .cursor').style.setProperty(aCursor.cssProperty, aData + '%', '');
    });
  };

  for (cursorName in cursors) {
    if (cursors.hasOwnProperty(cursorName)) {
      addSubscriber(cursorName, cursors[cursorName]);
    }
  }

  cursors.scale.computeValue = cursors.height.computeValue = function (aX, aY, aMemory) {
    var coeff = (aMemory.max - aMemory.min) / this.area.clientHeight;

    if (firstAltEvent !== null) {
      aY = firstAltEvent.clientY + ((aY - firstAltEvent.clientY) / (coeff * 3));
    }

    return aMemory.max - ((aY - this.area.offsetTop) * coeff);
  };

  horizontalHandlePadding = $dqs('#width .cursor').clientWidth - $dqs('#width input').clientWidth - 5;

  cursors.width.computeValue = function (aX, aY, aMemory) {
    var paddingLeft = Boolean(Number($mem.panel.value)) ? $dqs('#panel').clientWidth : 0,
        coeff = (aMemory.max - aMemory.min) / this.area.clientWidth;

    if (firstAltEvent !== null) {
      aX = firstAltEvent.clientX + ((aX - firstAltEvent.clientX) / (coeff * 3));
    }

    return (aX - this.area.offsetLeft - paddingLeft - horizontalHandlePadding) * coeff + aMemory.min;
  };

  $win.addEventListener('mousedown', function (aEvent) {
    if (aEvent.target.classList.contains('handle')) {
      aEvent.preventDefault();
      handleTitle = aEvent.target.title;
      $mem.hold.value = '1';
      $dqs('#mask').classList.add(handleTitle + '-resize');
    }
  }, false);

  $win.addEventListener('mouseup', function (aEvent) {
    $dqs('#mask').classList.remove(handleTitle + '-resize');
    $mem.hold.value = '0';
    handleTitle = null;
  }, false);

  $win.addEventListener('mousemove', function (aEvent) {
    var min,
        max,
        val,
        before,
        after;

    if (firstAltEvent === null && aEvent.altKey) {
      firstAltEvent = aEvent;
    }

    if (firstAltEvent !== null && !aEvent.altKey) {
      firstAltEvent = null;
    }

    if (handleTitle !== null) {
      min = $mem[handleTitle].min;
      max = $mem[handleTitle].max;
      val = cursors[handleTitle].computeValue(aEvent.clientX, aEvent.clientY, $mem[handleTitle]);
      val = Math.max(min, val);
      val = Math.min(val, max);
      val = $mem[handleTitle].converter(val);

      if (aEvent.ctrlKey) {
        before = $list.sizes.closestBefore(val);
        after = $list.sizes.closestAfter(val);
        if (after - val > val - before) {
          $mem[handleTitle].value = before;
        } else {
          $mem[handleTitle].value = after;
        }
      } else {
        $mem[handleTitle].value = val;
      }
    }
  }, false);

})();