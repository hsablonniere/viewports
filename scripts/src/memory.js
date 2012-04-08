/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : memory
 */

(function () {
  'use strict';

  var $win = window,
      $vp = $win.$viewports,
      $protos = $vp.protos,
      mem;

  mem = $vp.memory = {
    url: $protos.value.createSimple({
      name: 'url',
      pattern: /^(https?:\/\/(.*?)(?::[0-9]{1,5})?(?:\/.*)?)?$/,
      defaultValue: $vp.getRootUrl() + 'help.html'
    }),

    scale: $protos.numericValue.createSimple({
      name: 'scale',
      defaultValue: 100,
      pattern: /^(([0-9]{1,3})(.([0-9]))?)%?$/,
      converter: function (aValue) {
        return Number(Number(aValue).toFixed(1));
      },
      min: 10,
      max: 100
    }),

    height: $protos.dimensionValue.createSimple({
      name: 'height',
      defaultValue: 480
    }),

    width: $protos.dimensionValue.createSimple({
      name: 'width',
      defaultValue: 320
    }),

    panel: $protos.dualValue.createSimple({
      name: 'panel',
      defaultValue: '1'
    }),

    controls: $protos.dualValue.createSimple({
      name: 'controls',
      defaultValue: '1'
    }),

    autoscale: $protos.dualValue.createSimple({
      name: 'autoscale',
      defaultValue: '1'
    }),

    filter: $protos.dualValue.createSimple({
      name: 'filter',
      defaultValue: 'favourites',
      a: 'all',
      b: 'favourites'
    }),

    hold: $protos.dualValue.createSimple({
      name: 'hold',
      defaultValue: '0'
    })
  };

  $win.addEventListener('load', function (aEvent) {
    var values = ['url', 'scale', 'height', 'width', 'panel', 'controls', 'autoscale', 'filter', 'hold'],
        i;

    for (i = 0; i < values.length; i += 1) {
      mem[values[i]].init();
    }
  }, false);

})();
