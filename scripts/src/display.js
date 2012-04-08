/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : display
 */

(function () {
  'use strict';

  var $win = window,
      $ps = $win.PubSub,
      $dqs = $win.dqs,
      $mem = $win.$viewports.memory,
      displayElements,
      addSubscribers,
      addDomListeners,
      elementName;

  displayElements = {
    orientation: 'both',
    panel: 'toggle',
    controls: 'toggle',
    autoscale: 'toggle',
    filter: 'both',
    hold: 'nobutton'
  };

  addSubscribers = function (aElementName) {
    $ps.subscribe(aElementName + '.change', function (aMsg, aData) {
      $dqs('body').dataset[aElementName] = aData;
    });
  };

  addDomListeners = function (aElementName) {
    if (displayElements[aElementName] === 'both') {
      $dqs('#' + aElementName + '-' + $mem[aElementName].a).addEventListener('click', function (aEvent) {
        $mem[aElementName].value = $mem[aElementName].a;
      }, false);

      $dqs('#' + aElementName + '-' + $mem[aElementName].b).addEventListener('click', function (aEvent) {
        $mem[aElementName].value = $mem[aElementName].b;
      }, false);
    }

    if (displayElements[aElementName] === 'toggle') {
      $dqs('#' + aElementName + '-switch').addEventListener('click', function (aEvent) {
        $mem[aElementName].toggle();
      }, false);
    }
  };

  for (elementName in displayElements) {
    if (displayElements.hasOwnProperty(elementName)) {
      addSubscribers(elementName);
      addDomListeners(elementName);
    }
  }
})();