if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

const P = {

  getRandom: (list) => {
    let v = undefined;
    if (!list.length) {
      return;
    }
    while (!v) {
      let r = Math.floor(Math.random() * list.length);
      v = list[r];
    }
    return v;
  },

  shuffle: (d = []) => {
    for (var c = d.length - 1; c > 0; c--) {
      var b = Math.floor(Math.random() * (c + 1));
      var a = d[c];
      d[c] = d[b];
      d[b] = a;
    }
    return d
  },

  clamp: (num, min, max) => {
    return num < min ? min : num > max ? max : num;
  },

  resizeEl: ($el, type, containerWidth, containerHeight, elWidth, elHeight) => {
    var containerRatio = containerWidth / containerHeight;
    var elRatio = elWidth / elHeight;
    var scale, x, y;

    // define scale
    if (containerRatio > elRatio) {
      scale = containerWidth / elWidth;
    } else {
      scale = containerHeight / elHeight;
    }

    //FIT MODE
    //scale = Math.min(containerWidth/ elWidth, containerHe / this.targetCanvas.height)

    // define position
    if (containerRatio === elRatio) {
      x = y = 0;
    } else {
      x = (containerWidth - elWidth * scale) * 0.5 / scale;
      y = (containerHeight - elHeight * scale) * 0.5 / scale;
    }

    // fixed
    x = Number(x.toFixed(1));
    y = Number(y.toFixed(1));

    // set el css
    $el.css('transform', 'scale3d(' + scale + ', ' + scale + ', 1) translate3d(' + x + 'px,' + y + 'px,0)');
    $el.css('transform-origin', '0% 0% 0px');
  }


}
export default P
