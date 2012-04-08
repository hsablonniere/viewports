/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, es5:true, indent:2, trailing:true scripturl:true */

/**
 * Viewports : hash
 */

(function () {
  'use strict';

  var $win = window,
      $loc = $win.location,
      $ps = $win.PubSub,
      $mem = $win.$viewports.memory,
      lastHash = $loc.hash,
      pattern = /^#[^=&]=[^=&]*(&[^=&]=[^=&]*)*$/,
      shortToLong,
      shortName,
      parse,
      processUpdates = true,
      update;

  shortToLong = {
    u: 'url',
    s: 'scale',
    h: 'height',
    w: 'width',
    p: 'panel',
    c: 'controls',
    a: 'autoscale',
    f: 'filter'
  };

  parse = function (aForce) {
    var arrayParams,
        keyValue,
        parsedParams = {},
        i;

    if (lastHash !== $loc.hash || aForce === true) {
      arrayParams = $loc.hash.slice(1).split('&');

      if (pattern.test($loc.hash)) {
        for (i = 0; i < arrayParams.length; i += 1) {
          keyValue = arrayParams[i].split('=');
          parsedParams[keyValue[0]] = decodeURIComponent(keyValue[1]);
          $mem[shortToLong[keyValue[0]]].value = parsedParams[keyValue[0]];
        }
        if (arrayParams.length !== Object.keys(shortToLong).length) {
          update();
        }
      }
    }
  };

  $win.addEventListener('hashchange', parse, false);

  update = function () {
    var newHash,
        shortName;

    if (processUpdates) {
      newHash = [];
      for (shortName in shortToLong) {
        if (shortToLong.hasOwnProperty(shortName)) {
          newHash.push(shortName + '=' + encodeURIComponent($mem[shortToLong[shortName]].value));
        }
      }

      newHash = '#' + newHash.join('&');
      if (newHash !== $loc.hash) {
        lastHash = $loc.hash = newHash;
      }
    }
  };

  for (shortName in shortToLong) {
    if (shortToLong.hasOwnProperty(shortName)) {
      $ps.subscribe(shortToLong[shortName] + '.change', update);
      $ps.subscribe(shortToLong[shortName] + '.parseerror', update);
    }
  }

  $ps.subscribe('hold.change', function (aMsg, aData) {
    processUpdates = !Boolean(Number(aData));
    if (processUpdates) {
      update();
    }
  });

  $win.addEventListener('load', function (aEvent) {
    parse(true);
  }, false);

})();