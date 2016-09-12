// simple wrapper for jsfeat face detector
var findFaceWorker = require('./jsfeat_detect.worker');

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

  var worker = findFaceWorker();

  this.findFace = function (callback) {
    if (image.tagName == 'VIDEO' || image.tagName == 'IMG') {
      work_ctx.drawImage(image, 0, 0);
    }
    var imageData = work_ctx.getImageData(0, 0, w, h);

    worker.addEventListener('message', function (e) {
      if (e.data.type === 'console') {
        console[e.data.func].apply(window, e.data.args);
        return;
      }

      this.faceDetected(e, callback);
    }.bind(this), false);

    worker.postMessage({
      w: w,
      h: h,
      imageData: imageData
    });
  }

}

module.exports = jsfeat_face;