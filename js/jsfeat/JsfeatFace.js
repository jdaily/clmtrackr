// simple wrapper for jsfeat face detector
import findFaceWorker from './findFace.worker';

/**
 * this cascade is derived from https://github.com/mtschirs/js-objectdetect implementation
 * @author Martin Tschirsich / http://www.tu-darmstadt.de/~m_t
 */
import frontalface from '../filters/frontalface.json';

export default class JsfeatFace {
  /**
   * @param  {Canvas|Image|Video} image
   */
  constructor (image) {
    this.work_canvas = undefined;
    this.work_ctx = undefined;

    this.image = image;
    this.w = this.image.width;
    this.h = this.image.height;

    if (this.image.tagName == 'VIDEO' || this.image.tagName == 'IMG') {
      this.work_canvas = document.createElement('canvas');
      this.work_canvas.height = h;
      this.work_canvas.width = w;
      this.work_ctx = this.work_canvas.getContext('2d');
    } else if (this.image.tagName == 'CANVAS') {
      this.work_ctx = this.image.getContext('2d');
    }

    // img_u8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
    // ii_sum = new Int32Array((w+1)*(h+1));
    // ii_sqsum = new Int32Array((w+1)*(h+1));
    // ii_tilted = new Int32Array((w+1)*(h+1));

    // var classifier = frontalface;

    this.worker = findFaceWorker();
  }

  findFace (callback) {
    this.worker.addEventListener('message', (e) => {
      if (e.data.type === 'console') {
        console[e.data.func].apply(window, e.data.args);
        return;
      }

      this.faceDetected(e, callback);
    }, false);

    if (this.image.tagName == 'VIDEO' || this.image.tagName == 'IMG') {
      this.work_ctx.drawImage(this.image, 0, 0);
    }
    const imageData = this.work_ctx.getImageData(0, 0, this.w, this.h);

    this.worker.postMessage({
      w: this.w,
      h: this.h,
      imageData: imageData
    });
  }

}
