// simple wrapper for jsfeat face detector
var findFaceWorker = require('./jsfeat_detect_worker.js');

// Curtousy of stackoverflow this function
Worker.createURL = function(func_or_string){
  var str = (typeof func_or_string === 'function')?func_or_string.toString():func_or_string;
  var blob = new Blob(['\'use strict\';\nself.onmessage ='+str], { type: 'text/javascript' });
  return window.URL.createObjectURL(blob);
};

Worker.create = function(func_or_string){
  return new Worker(Worker.createURL(func_or_string));
};


/**
 * this cascade is derived from https://github.com/mtschirs/js-objectdetect implementation
 * @author Martin Tschirsich / http://www.tu-darmstadt.de/~m_t
 */
var frontalface = require('./filters/frontalface.json');

var jsfeat_face = function(image) {

  var work_canvas, work_ctx;

  var w = image.width;
  var h = image.height;

  if (image.tagName == 'VIDEO' || image.tagName == 'IMG') {
    work_canvas = document.createElement('canvas');
    work_canvas.height = h;
    work_canvas.width = w;
    work_ctx = work_canvas.getContext('2d');
  } else if (image.tagName == 'CANVAS') {
    work_ctx = image.getContext('2d');
  }

  // img_u8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
  // ii_sum = new Int32Array((w+1)*(h+1));
  // ii_sqsum = new Int32Array((w+1)*(h+1));
  // ii_tilted = new Int32Array((w+1)*(h+1));

  // var classifier = frontalface;

  this.findFace = function (callback) {
    if (image.tagName == 'VIDEO' || image.tagName == 'IMG') {
      work_ctx.drawImage(image, 0, 0);
    }
    var imageData = work_ctx.getImageData(0, 0, w, h);

    var worker = Worker.create(findFaceWorker);

    worker.addEventListener('message', function (e) {
      this.faceDetected(e, callback);
    }.bind(this), false);

    worker.postMessage({
      w: w,
      h: h,
      imageData:imageData
    });
  }

}

module.exports = jsfeat_face;