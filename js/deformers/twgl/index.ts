import twgl from 'twgl.js/dist/twgl';

import { getImageData } from '../../utils/image';
import { getBoundingBox } from '../../utils/points';
import { getWebGLContext } from '../../utils/webgl';
import Background from './Background';

import createDeformVert from './shaders/deform.vert';
import createDeformFrag from './shaders/deform.frag';

import IDeformer from '../IDeformer';


export default class Deformer implements IDeformer {
  private _isLoaded: boolean;

  private background: Background;
  private debug: Background;

  private _tracker;
  private _gl;

  private _verticeMap;

  private _dynamicMaskTexture;
  private _maskTextureSrcElement;
  private _maskTextureCanvas;
  private _pointBB;

  private _maskTextureCoord;
  private _maskProgramInfo;
  private _maskTextures;
  private _maskUniforms;
  private _maskBufferInfo;

  constructor (params = {}) {
    twgl.setDefaults({ attribPrefix: 'a_' });

    this._isLoaded = false;

    this.background = new Background(this);
    this.debug = new Background(this);

    this._tracker = null;
    this._gl = null;

    this._verticeMap = null;

    this._dynamicMaskTexture = false;
    this._maskTextureSrcElement = null;
    this._maskTextureCanvas = document.createElement('canvas');
    this._pointBB = null;

    this._maskTextureCoord = null;
    this._maskProgramInfo = null;
    this._maskTextures = null;
    this._maskUniforms = null;
    this._maskBufferInfo = null;
  }

  getGLContext () {
    return this._gl;
  }

  init (canvas) {
    if (!canvas) {
      throw new Error('canvas parameter is falsey');
    }
    this._gl = getWebGLContext(canvas);
    if (!this._gl) {
      throw new Error('Could not get a webgl context; have you already tried getting a 2d context on this canvas?');
    }
  }

  loadTexture (texPath, points, tracker, bgElement) {
    const image = new Image();
    image.addEventListener('load', () => {
      this.load(image, points, tracker, bgElement);
    });
    image.src = texPath;
  }

  _generateTextureVertices (points, vertMap, scaleX = 1, scaleY = 1) {
    const tvs = [];
    for (let i = 0; i < vertMap.length; i++) {
      tvs.push(points[vertMap[i][0]][0] * scaleX);
      tvs.push(points[vertMap[i][0]][1] * scaleY);
      tvs.push(points[vertMap[i][1]][0] * scaleX);
      tvs.push(points[vertMap[i][1]][1] * scaleY);
      tvs.push(points[vertMap[i][2]][0] * scaleX);
      tvs.push(points[vertMap[i][2]][1] * scaleY);
    }
    return tvs;
  }

  setMaskTexture (element) {
    this._maskTextureSrcElement = element;

    const tagName = this._maskTextureSrcElement.tagName;
    if (tagName === 'CANVAS') {
      // Use the element as texture (its dynamic!)
      this._dynamicMaskTexture = true;
    } else {
      // We need a still frame from it
      this._dynamicMaskTexture = false;
      this.updateMaskTexture();
    }
  }

  updateMaskTexture () {
    if (
      !this._maskTextureSrcElement ||
      !this._pointBB
    ) { return; }

    let srcElement;
    if (!this._dynamicMaskTexture) {
      // Draw the srcElement to the mask texture canvas
      const {
        minX, minY, width, height
      } = this._pointBB;

      const maskImage = getImageData(
        this._maskTextureSrcElement,
        minX,
        minY,
        width,
        height
      );

      const canvas = this._maskTextureCanvas;
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      ctx.putImageData(maskImage, 0, 0);

      srcElement = canvas;
    } else {
      srcElement = this._maskTextureSrcElement
    }

    // Update the webgl stuff
    const gl = this.getGLContext();
    this._maskTextures = twgl.createTextures(gl, {
      mask: {
        mag: gl.LINEAR,
        min: gl.LINEAR,
        src: srcElement
      }
    });

    this._maskUniforms = {
      u_resolution: [gl.drawingBufferWidth, gl.drawingBufferHeight],
      u_sampler: this._maskTextures.mask
    };
  }

  setPoints (points) {
    if (!points) {
      throw new Error('points is falsey');
    }

    // Find texture cropping from mask points
    this._pointBB = getBoundingBox(points);

    // correct points
    let nupoints = points.map(p => [
      p[0] - this._pointBB.minX,
      p[1] - this._pointBB.minY
    ]);

    // create vertices based on points
    this._maskTextureCoord = this._generateTextureVertices(
      nupoints,
      this._verticeMap,
      1 / this._pointBB.width,
      1 / this._pointBB.height
    );

    this.updateMaskTexture();
  }

  setTracker (tracker) {
    this._tracker = tracker;
    // Set verts for this mask
    this._verticeMap = tracker.model.path.vertices;
  }

  load (element, points, tracker, bgElement) {
    this.setTracker(tracker);
    this.setMaskTexture(element);
    points && this.setPoints(points);

    this.background.setElement(bgElement);

    const gl = this.getGLContext();
    this._maskProgramInfo = twgl.createProgramInfo(gl, [
      createDeformVert(),
      createDeformFrag()
    ]);

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
    let vertices = this._generateTextureVertices(points, this._verticeMap);

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

  drawGrid () {
    // TODO: implement (what is drawGrid?)
  }

  clear () {
    const gl = this.getGLContext();
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}
