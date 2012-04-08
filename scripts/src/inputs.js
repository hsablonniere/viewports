/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : inputs
 */

(function () {
  'use strict';

  var $win = window,
      $ps = $win.PubSub,
      $dqs = $win.dqs,
      $mem = $win.$viewports.memory,
      inputs,
      setInputValue,
      addSubscribers,
      addDomListeners,
      inputName;

  inputs = {
    url: {
      suffix: ''
    },
    scale: {
      suffix: '%',
      toFixed: 1
    },
    height: {
      suffix: 'px'
    },
    width: {
      suffix: 'px'
    }
  };

  setInputValue = function (aInputName, aInput, aValue) {
    $dqs('#' + aInputName + ' input').value = aValue + aInput.suffix;
  };

  addSubscribers = function (aInputName, aInput) {
    $ps.subscribe(aInputName + '.change', function (aMsg, aData) {
      if (!isNaN(aInput.toFixed)) {
        aData = aData.toFixed(aInput.toFixed);
      }
      setInputValue(aInputName, aInput, aData);
      $dqs('#' + aInputName + ' input').blur();
    });

    $ps.subscribe(aInputName + '.parseerror', function (aMsg, aData) {
      setInputValue(aInputName, aInput, $mem[aInputName].value);
    });
  };

  addDomListeners = function (aInputName, aInput) {
    $dqs('#' + aInputName + ' input').addEventListener('change', function (aEvent) {
      $mem[aInputName].value = aEvent.target.value;
    }, false);

    $dqs('#' + aInputName + ' input').addEventListener('focus', function (aEvent) {
      $dqs('#' + aInputName).classList.add('focused');
    }, false);

    $dqs('#' + aInputName + ' input').addEventListener('blur', function (aEvent) {
      $dqs('#' + aInputName).classList.remove('focused');
    }, false);
  };

  for (inputName in inputs) {
    if (inputs.hasOwnProperty(inputName)) {
      addSubscribers(inputName, inputs[inputName]);
      addDomListeners(inputName, inputs[inputName]);
    }
  }
  
})();
