import twgl from 'twgl.js/dist/twgl-full';


export default class Background {
  constructor (deformer) {
    this._deformer = deformer;

    this._element = null;

    this._bgBufferInfo = null;
    this._bgProgramInfo = null;
    this._bgTextures = null;
    this._bgUniforms = null;
  }

  /**
   * @param {*} element - This will be the source for the background
   */
  setElement (element) {
    this._element = element;
    if (!this._element) {
      this._bgBufferInfo = null;
      this._bgProgramInfo = null;
      this._bgTextures = null;
      this._bgUniforms = null;
      return;
    }

    const gl = this._deformer.getGLContext();

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

    this._bgTextures = twgl.createTextures(gl, {
      video: { src: this._element }
    });

    this._bgUniforms = {
      u_sampler: this._bgTextures.video
    };
  }

  draw () {
    if (!this._element) { return; }

    const gl = this._deformer.getGLContext();

    gl.useProgram(this._bgProgramInfo.program);

    twgl.setTextureFromElement(gl, this._bgTextures.video, this._element);
    twgl.setBuffersAndAttributes(gl, this._bgProgramInfo, this._bgBufferInfo);
    twgl.setUniforms(this._bgProgramInfo, this._bgUniforms);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, this._bgBufferInfo);
  }
}
