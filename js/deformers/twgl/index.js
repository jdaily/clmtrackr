import twgl from 'twgl.js/dist/twgl-full';

import Background from './Background';


export default class Deformer {
  constructor (params = {}) {
    twgl.setDefaults({ attribPrefix: 'a_' });

    this._isLoaded = false;

    this.background = new Background(this);
    this.debug = new Background(this);

    this._tracker = null;
    this._gl = null;

    this._pdmModel = null;
    this._verticeMap = null;

    this._maskTextureCoord = null;
    this._maskProgramInfo = null;
    this._maskTextures = null;
    this._maskUniforms = null;
  }

  getGLContext () {
    return this._gl;
  }

  init (canvas) {
    // FIXME: this is from svmfilter_webgl, import it
    this._gl = getWebGLContext(canvas); // eslint-disable-line
  }

  loadTexture (texPath, points, tracker, bgElement) {
    let element = document.createElement('img');
    element.src = texPath;
    element.addEventListener('load', () => {
      this.load(element, points, tracker, bgElement);
    }, false);
  }

  load (element, points, tracker, bgElement) {
    this._tracker = tracker;
    this.background.setElement(bgElement);
    this._pdmModel = tracker.model;
    // Set verts for this mask
    this._verticeMap = this._pdmModel.path.vertices;

    // Find texture cropping from mask points
    let maxx, minx, maxy, miny;
    let width, height;

    maxx = 0;
    minx = element.width;
    maxy = 0;
    miny = element.height;

    for (let i = 0; i < points.length; i++) {
      if (points[i][0] > maxx) maxx = points[i][0];
      if (points[i][0] < minx) minx = points[i][0];
      if (points[i][1] > maxy) maxy = points[i][1];
      if (points[i][1] < miny) miny = points[i][1];
    }

    minx = Math.floor(minx);
    maxx = Math.ceil(maxx);
    miny = Math.floor(miny);
    maxy = Math.ceil(maxy);

    width = maxx - minx;
    height = maxy - miny;

    // Get mask texture
    let cc;
    if (element.tagName === 'VIDEO' || element.tagName === 'IMG') {
      let ca = document.createElement('canvas');
      ca.width = element.width;
      ca.height = element.height;
      cc = ca.getContext('2d');
      cc.drawImage(element, 0, 0, element.width, element.height);
    } else if (element.tagName === 'CANVAS') {
      cc = element.getContext('2d');
    } else {
      throw new Error('unknown tagName: ' + element.tagName);
    }

    let maskImage = cc.getImageData(minx, miny, width, height);

    // @TODO too many in-memory canvases, need to simplify and speed up
    let crx = document.createElement('canvas').getContext('2d');
    crx.canvas.width = width;
    crx.canvas.height = height;
    crx.putImageData(maskImage, 0, 0);

    // correct points
    let nupoints = [];
    for (let i = 0; i < points.length; i++) {
      nupoints[i] = [];
      nupoints[i][0] = points[i][0] - minx;
      nupoints[i][1] = points[i][1] - miny;
    }

    // create vertices based on points
    let textureVertices = [];
    for (let i = 0; i < this._verticeMap.length; i++) {
      textureVertices.push(nupoints[this._verticeMap[i][0]][0] / width);
      textureVertices.push(nupoints[this._verticeMap[i][0]][1] / height);
      textureVertices.push(nupoints[this._verticeMap[i][1]][0] / width);
      textureVertices.push(nupoints[this._verticeMap[i][1]][1] / height);
      textureVertices.push(nupoints[this._verticeMap[i][2]][0] / width);
      textureVertices.push(nupoints[this._verticeMap[i][2]][1] / height);
    }

    this._maskTextureCoord = textureVertices;

    const gl = this.getGLContext();
    this._maskProgramInfo = twgl.createProgramInfo(gl, [
      require('raw!./shaders/deform.vert'),
      require('raw!./shaders/deform.frag')
    ]);

    this._maskTextures = twgl.createTextures(gl, {
      mask: {
        mag: gl.LINEAR,
        min: gl.LINEAR,
        src: crx.canvas
      }
    });

    this._maskUniforms = {
      u_resolution: [gl.drawingBufferWidth, gl.drawingBufferHeight],
      u_sampler: this._maskTextures.mask
    };

    this._isLoaded = true;
  }

  draw (points) {
    if (!this._isLoaded) {
      console.warn('deformer not yet loaded, draw cannot run');
      return;
    }

    const gl = this.getGLContext();
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this.background.draw();
    this.drawMask(points);
    this.debug.draw();
  }

  drawMask (points) {
    const gl = this.getGLContext();

    // create drawvertices based on points
    let vertices = [];
    for (let i = 0; i < this._verticeMap.length; i++) {
      vertices.push(points[this._verticeMap[i][0]][0]);
      vertices.push(points[this._verticeMap[i][0]][1]);
      vertices.push(points[this._verticeMap[i][1]][0]);
      vertices.push(points[this._verticeMap[i][1]][1]);
      vertices.push(points[this._verticeMap[i][2]][0]);
      vertices.push(points[this._verticeMap[i][2]][1]);
    }

    this._maskBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: vertices
      },
      texcoord: {
        numComponents: 2,
        data: this._maskTextureCoord
      }
    });

    gl.useProgram(this._maskProgramInfo.program);

    twgl.setBuffersAndAttributes(gl, this._maskProgramInfo, this._maskBufferInfo);
    twgl.setUniforms(this._maskProgramInfo, this._maskUniforms);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, this._maskBufferInfo);
  }

  clear () {
    const gl = this.getGLContext();
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}
