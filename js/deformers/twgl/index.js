import twgl from 'twgl.js/dist/twgl-full';


export default class Deformer {
  constructor (params = {}) {
    this._isDebug = params.isDebug;
    this._debugCanvas = params.debugCanvas;

    twgl.setDefaults({ attribPrefix: 'a_' });

    this._isLoaded = false;

    this._bgBufferInfo = null;
    this._bgProgramInfo = null;
    this._bgElement = null;
    this._bgTextures = null;
    this._bgUniforms = null;

    this._debugBufferInfo = null;
    this._debugProgramInfo = null;
    this._debugTextures = null;
    this._debugUniforms = null;

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

  _initBgData () {
    const gl = this.getGLContext();

    this._bgBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [ -1, 1, -1, -1, 1, -1, -1, 1, 1, 1, 1, -1 ]
      },
      texcoord: {
        numComponents: 2,
        data: [ 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1 ]
      }
    });

    this._bgProgramInfo = twgl.createProgramInfo(gl, [
      require('raw!./shaders/background.vert'),
      require('raw!./shaders/background.frag')
    ]);

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = this._bgElement.width;
    ctx.canvas.height = this._bgElement.height;

    this._bgTextures = twgl.createTextures(gl, {
      video: { src: ctx.canvas }
    });

    this._bgUniforms = {
      u_sampler: this._bgTextures.video
    };
  }

  _initDebugData () {
    const gl = this.getGLContext();

    this._debugBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [ -1, 1, -1, -1, 1, -1, -1, 1, 1, 1, 1, -1 ]
      },
      texcoord: {
        numComponents: 2,
        data: [ 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1 ]
      }
    });

    this._debugProgramInfo = twgl.createProgramInfo(gl, [
      require('raw!./shaders/background.vert'),
      require('raw!./shaders/background.frag')
    ]);

    this._debugTextures = twgl.createTextures(gl, {
      canvas: { src: this._debugCanvas }
    });

    this._debugUniforms = {
      u_sampler: this._debugTextures.canvas
    };
  }

  init (canvas) {
    // FIXME: this is from svmfilter_webgl, import it
    this._gl = getWebGLContext(canvas); // eslint-disable-line
  }

  loadTexture (texPath, points, pModel, vertices, bgElement) {
    let element = document.createElement('img');
    element.src = texPath;
    element.addEventListener('load', () => {
      this.load(element, points, pModel, vertices, bgElement);
    }, false);
  }

  load (element, points, pModel, vertices, bgElement) {
    const gl = this.getGLContext();

    this._bgElement = bgElement;

    if (this._bgElement) {
      this._initBgData();
    }

    if (this._isDebug) {
      this._initDebugData();
    }

    this._pdmModel = pModel;

    // Set verts for this mask
    if (vertices) {
      this._verticeMap = vertices;
    } else {
      this._verticeMap = this._pdmModel.path.vertices;
    }
    if (!this._verticeMap) {
      throw new Error('must provide either vertices or a model with path.vertices');
    }

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

    if (this._bgElement) {
      this.drawBackground();
    }

    this.drawMask(points);

    // @TODO fix white background issue, make it transparent
    // if (this._isDebug) {
    //   this.drawDebug();
    // }
  }

  drawBackground () {
    const gl = this.getGLContext();

    gl.useProgram(this._bgProgramInfo.program);

    twgl.setTextureFromElement(gl, this._bgTextures.video, this._bgElement);
    twgl.setBuffersAndAttributes(gl, this._bgProgramInfo, this._bgBufferInfo);
    twgl.setUniforms(this._bgProgramInfo, this._bgUniforms);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, this._bgBufferInfo);
  }

  drawDebug () {
    const gl = this.getGLContext();

    gl.useProgram(this._debugProgramInfo.program);

    twgl.setTextureFromElement(gl, this._debugTextures.canvas, this._debugCanvas);
    twgl.setBuffersAndAttributes(gl, this._debugProgramInfo, this._debugBufferInfo);
    twgl.setUniforms(this._debugProgramInfo, this._debugUniforms);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, this._debugBufferInfo);
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

  calculatePositions (parameters, useTransforms) {
    if (!this._isLoaded) {
      return;
    }

    let x, y, a, b;
    let numParameters = parameters.length;
    let positions = [];
    for (let i = 0; i < this._pdmModel.patchModel.numPatches; i++) {
      x = this._pdmModel.shapeModel.meanShape[i][0];
      y = this._pdmModel.shapeModel.meanShape[i][1];
      for (let j = 0; j < numParameters - 4; j++) {
        x += this._pdmModel.shapeModel.eigenVectors[(i * 2)][j] * parameters[j + 4];
        y += this._pdmModel.shapeModel.eigenVectors[(i * 2) + 1][j] * parameters[j + 4];
      }
      if (useTransforms) {
        a = parameters[0] * x - parameters[1] * y + parameters[2];
        b = parameters[0] * y + parameters[1] * x + parameters[3];
        x += a;
        y += b;
      }
      positions[i] = [x, y];
    }

    return positions;
  }
}
