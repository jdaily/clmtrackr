// part one of meanshift calculation
export const gpopt = (responseWidth, currentPositionsj, updatePosition, vecProbs, responses, opj0, opj1, j, variance, scaling) => {
  var pos_idx = 0;
  var vpsum = 0;
  var dx, dy;
  for (var k = 0;k < responseWidth;k++) {
    updatePosition[1] = opj1+(k*scaling);
    for (var l = 0;l < responseWidth;l++) {
      updatePosition[0] = opj0+(l*scaling);

      dx = currentPositionsj[0] - updatePosition[0];
      dy = currentPositionsj[1] - updatePosition[1];
      vecProbs[pos_idx] = responses[j][pos_idx] * Math.exp(-0.5*((dx*dx)+(dy*dy))/(variance*scaling));

      vpsum += vecProbs[pos_idx];
      pos_idx++;
    }
  }

  return vpsum;
}

// part two of meanshift calculation
export const gpopt2 = (responseWidth, vecpos, updatePosition, vecProbs, vpsum, opj0, opj1, scaling) => {
  //for debugging
  //var vecmatrix = [];

  var pos_idx = 0;
  var vecsum = 0;
  vecpos[0] = 0;
  vecpos[1] = 0;
  for (var k = 0;k < responseWidth;k++) {
    updatePosition[1] = opj1+(k*scaling);
    for (var l = 0;l < responseWidth;l++) {
      updatePosition[0] = opj0+(l*scaling);
      vecsum = vecProbs[pos_idx]/vpsum;

      //for debugging
      //vecmatrix[k*responseWidth + l] = vecsum;

      vecpos[0] += vecsum*updatePosition[0];
      vecpos[1] += vecsum*updatePosition[1];
      pos_idx++;
    }
  }
  // for debugging
  //return vecmatrix;
}