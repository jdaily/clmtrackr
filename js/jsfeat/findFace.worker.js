import jsfeat from './jsfeatWithFrontalface';

onmessage = function (e) {
  const imageData = e.data.imageData;
  const w = e.data.w;
  const h = e.data.h;

  const img_u8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
  const ii_sum = new Int32Array((w + 1) * (h + 1));
  const ii_sqsum = new Int32Array((w + 1) * (h + 1));
  const ii_tilted = new Int32Array((w + 1) * (h + 1));

  const classifier = jsfeat.haar.frontalface;

  // Old findFace
  jsfeat.imgproc.grayscale(imageData.data, img_u8.data);
  jsfeat.imgproc.equalize_histogram(img_u8, img_u8);
  jsfeat.imgproc.compute_integral_image(img_u8, ii_sum, ii_sqsum, null);
  let rects = jsfeat.haar.detect_multi_scale(
    ii_sum,
    ii_sqsum,
    ii_tilted,
    null,
    img_u8.cols,
    img_u8.rows,
    classifier,
    1.15,
    2
  );
  rects = jsfeat.haar.group_rectangles(rects, 1);

  const rl = rects.length;

  // console.timeEnd('findFace');
  if (rl > 0) {
    let best = rects[0];
    for (let i = 1; i < rl; i++) {
      if (rects[i].neighbors > best.neighbors) {
        best = rects[i]
      } else if (rects[i].neighbors == best.neighbors) {
        if (rects[i].confidence > best.confidence) {
          best = rects[i];
        }
      }
    }
    // return [best];
    self.postMessage({
      comp: [best]
    });
  } else {
    self.postMessage(imageData);
    //return false;
  }
  // END Old findFace
};
