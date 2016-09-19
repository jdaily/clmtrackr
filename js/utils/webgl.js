import { error } from './logging';
import { isInIFrame, updateCSSIfInIFrame } from './window';

/**
 * Converts a WebGL enum to a string
 * @param {!WebGLContext} gl The WebGLContext to use.
 * @param {number} value The enum value.
 * @return {string} The enum as a string.
 */
export const glEnumToString = function (gl, value) {
  for (var p in gl) {
    if (gl[p] === value) {
      return p;
    }
  }
  return '0x' + value.toString(16);
};


/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
export const makeFailHTML = function (msg) {
  return '' +
    '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
    '<td align="center">' +
    '<div style="display: table-cell; vertical-align: middle;">' +
    '<div style="">' + msg + '</div>' +
    '</div>' +
    '</td></tr></table>';
};


/**
 * Mesasge for getting a webgl browser
 * @type {string}
 */
// const GET_A_WEBGL_BROWSER = '' +
//   'This page requires a browser that supports WebGL.<br/>' +
//   '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';


/**
 * Mesasge for need better hardware
 * @type {string}
 */
// const OTHER_PROBLEM = '' +
//   "It doesn't appear your computer can support WebGL.<br/>" +
//   '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';


/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @param {WebGLContextCreationAttirbutes} optAttribs Any
 *     creation attributes you want to pass in.
 * @return {WebGLRenderingContext} The created context.
 */
export const setupWebGL = function (canvas, optAttribs) {
  // const showLink = function (str) {
  //   var container = canvas.parentNode;
  //   if (container) {
  //     container.innerHTML = makeFailHTML(str);
  //   }
  // };

  if (!window.WebGLRenderingContext) {
    // showLink(GET_A_WEBGL_BROWSER);
    return null;
  }

  var context = create3DContext(canvas, optAttribs);
  if (!context) {
    // showLink(OTHER_PROBLEM);
    return null;
  }
  return context;
};


/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
export const create3DContext = function (canvas, optAttribs) {
  var names = ['webgl', 'experimental-webgl'];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], optAttribs);
    } catch (e) {}
    if (context) {
      break;
    }
  }
  return context;
};


/**
 * Gets a WebGL context.
 * makes its backing store the size it is displayed.
 */
export const getWebGLContext = function (canvas) {
  if (isInIFrame()) {
    updateCSSIfInIFrame();

    // make the canvas backing store the size it's displayed.
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  var gl = setupWebGL(canvas);
  return gl;
};


/**
 * Loads a shader.
 * @param {!WebGLContext} gl The WebGLContext to use.
 * @param {string} shaderSource The shader source.
 * @param {number} shaderType The type of shader.
 * @param {function(string): void) optErrorCallback callback for errors.
 * @return {!WebGLShader} The created shader.
 */
export const loadShader = function (gl, shaderSource, shaderType, optErrorCallback) {
  var errFn = optErrorCallback || error;
  // Create the shader object
  var shader = gl.createShader(shaderType);

  // Load the shader source
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check the compile status
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    // Something went wrong during compilation; get the error
    var lastError = gl.getShaderInfoLog(shader);
    errFn("*** Error compiling shader '" + shader + "':" + lastError);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};


/**
 * Creates a program, attaches shaders, binds attrib locations, links the
 * program and calls useProgram.
 * @param {!Array.<!WebGLShader>} shaders The shaders to attach
 * @param {!Array.<string>} optAttribs The attribs names.
 * @param {!Array.<number>} optLocations The locations for the attribs.
 */
export const loadProgram = function (gl, shaders, optAttribs, optLocations) {
  var program = gl.createProgram();
  for (let i = 0; i < shaders.length; ++i) {
    gl.attachShader(program, shaders[i]);
  }
  if (optAttribs) {
    for (let i = 0; i < optAttribs.length; ++i) {
      gl.bindAttribLocation(
          program,
          optLocations ? optLocations[i] : i,
          optAttribs[i]);
    }
  }
  gl.linkProgram(program);

  // Check the link status
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    // something went wrong with the link
    const lastError = gl.getProgramInfoLog(program);
    error('Error in program linking:' + lastError);

    gl.deleteProgram(program);
    return null;
  }
  return program;
};


/**
 * Loads a shader from a script tag.
 * @param {!WebGLContext} gl The WebGLContext to use.
 * @param {string} scriptId The id of the script tag.
 * @param {number} optShaderType The type of shader. If not passed in it will
 *     be derived from the type of the script tag.
 * @param {function(string): void) optErrorCallback callback for errors.
 * @return {!WebGLShader} The created shader.
 */
export const createShaderFromScript = function (
  gl, scriptId, optShaderType, optErrorCallback
) {
  var shaderSource = '';
  var shaderType;
  var shaderScript = document.getElementById(scriptId);
  if (!shaderScript) {
    throw new Error('*** Error: unknown script element' + scriptId);
  }
  shaderSource = shaderScript.text;

  if (!optShaderType) {
    if (shaderScript.type === 'x-shader/x-vertex') {
      shaderType = gl.VERTEX_SHADER;
    } else if (shaderScript.type === 'x-shader/x-fragment') {
      shaderType = gl.FRAGMENT_SHADER;
    } else if (
      shaderType !== gl.VERTEX_SHADER &&
      shaderType !== gl.FRAGMENT_SHADER
    ) {
      throw new Error('*** Error: unknown shader type');
    }
  }

  return loadShader(
    gl,
    shaderSource,
    optShaderType || shaderType,
    optErrorCallback
  );
};