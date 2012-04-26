/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : memory
 */

(function () {
  'use strict';

  var $win = window,
      $ps = $win.PubSub,
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
    }),

    orientation: {
      name: 'orientation',
      a: 'portrait',
      b: 'landscape',

      set value(aValue) {
        if (this.value === this.a && aValue === this.b ||
            this.value === this.b && aValue === this.a) {
          this.toggle();
        }
      },

      get value() {
        return mem.height.value > mem.width.value ? this.a : this.b;
      },

      toggle: function () {
        var height = mem.height.value,
            width = mem.width.value;

        mem.height.value = width;
        mem.width.value = height;
      }
    },

    list: {
      name: 'list',
      items: [],
      indexesByMin: [],
      indexesByMax: [],
      indexedItems: {},
      sizes: [],

      add: function (aViewport) {
        var min = aViewport.size.min,
            max = aViewport.size.max,
            indexByMin = this.getIndex(min, max),
            indexByMax = this.getIndex(max, min);

        this.items.pushOnce(aViewport);

        this.indexesByMin.pushOnce(indexByMin);
        this.indexesByMin.sort();
        this.indexedItems[indexByMin] = aViewport;

        this.indexesByMax.pushOnce(indexByMax);
        this.indexesByMax.sort();
        this.indexedItems[indexByMax] = aViewport;

        this.sizes.pushOnce(Number(min));
        this.sizes.pushOnce(Number(max));
        this.sizes.sortNumeric();
      },

      getIndex: function (aSizeA, aSizeB) {
        return String(aSizeA).completeBefore(' ', 4) + String(aSizeB).completeBefore(' ', 4);
      },

      set selectedItem(aViewport) {
        if (mem.orientation.value === 'portrait') {
          mem.height.value = aViewport.size.max;
          mem.width.value = aViewport.size.min;
        } else {
          mem.height.value = aViewport.size.min;
          mem.width.value = aViewport.size.max;
        }
      },

      get selectedItem() {
        return this.indexedItems[this.getIndex(mem.height.value, mem.width.value)];
      },

      get indexesByHeight() {
        if (mem.orientation.value === 'portrait') {
          return this.indexesByMax;
        } else {
          return this.indexesByMin;
        }
      },

      get indexesByWidth() {
        if (mem.orientation.value === 'portrait') {
          return this.indexesByMin;
        } else {
          return this.indexesByMax;
        }
      },

      closestBefore: function (aIndexes, aSize, bSize) {
        var currentIdx = this.getIndex(aSize, bSize),
            newIdx = aIndexes.closestBefore(currentIdx);

        return this.indexedItems[newIdx];
      },

      closestAfter: function (aIndexes, aSize, bSize) {
        var currentIdx = this.getIndex(aSize, bSize),
            newIdx = aIndexes.closestAfter(currentIdx);

        return this.indexedItems[newIdx];
      },

      toggleFavourite: function (aSizeA, aSizeB, aFavourite) {
        var favouriteItem = this.indexedItems[this.getIndex(aSizeA, aSizeB)];
        favouriteItem.favourite = aFavourite || String(Number(!Boolean(Number(favouriteItem.favourite))));
        $ps.publish('favourite.change', favouriteItem);
      }
    }
  };

  $win.addEventListener('load', function (aEvent) {
    var values = ['url', 'scale', 'height', 'width', 'panel', 'controls', 'autoscale', 'filter', 'hold'],
        i;

    for (i = 0; i < values.length; i += 1) {
      mem[values[i]].init();
    }
  }, false);

})();
