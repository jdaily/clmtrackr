let VIDEO_EL;

const getVideoEl = () => {
  if (!VIDEO_EL) {
    VIDEO_EL = document.createElement('video');
  }
  return VIDEO_EL;
};


export const supportsVideo = () => {
  return !!getVideoEl().canPlayType;
};


export const supportsH264BaselineVideo = () => {
  if (!supportsVideo()) {
    return false;
  }
  return getVideoEl().canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
};


export const supportsOggTheoraVideo = () => {
  if (!supportsVideo()) {
    return false;
  }
  return getVideoEl().canPlayType('video/ogg; codecs="theora, vorbis"');
};


export const URL = (
  window.URL || window.webkitURL || window.msURL || window.mozURL
);


export const getUserMedia = (
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia
).bind(navigator);


export const supportsUserMedia = () => {
  return !!getUserMedia;
};


export const supportsWebGL = () => {
  let webGLContext;
  let webGLTestCanvas = document.createElement('canvas');

  if (!window.WebGLRenderingContext) {
    return false;
  }

  webGLContext = (
    webGLTestCanvas.getContext('webgl') ||
    webGLTestCanvas.getContext('experimental-webgl')
  );

  if (!webGLContext || !webGLContext.getExtension('OES_texture_float')) {
    webGLContext = null;
  }

  return webGLContext != null;
};


export const loadVideo = (cb) => {
  if (!getUserMedia) {
    cb(new Error('browser does not support getUserMedia'));
    return;
  }
  // set up stream

  let videoSelector = { video: true };
  const appVersion = window.navigator.appVersion;
  if (appVersion.match(/Chrome\/(.*?) /)) {
    const chromeVersion = parseInt(
      appVersion.match(/Chrome\/(\d+)\./)[1],
      10
    );
    if (chromeVersion < 20) {
      videoSelector = 'video';
    }
  };

  getUserMedia(videoSelector, (stream) => {
    cb(null, stream);
  }, () => {
    cb(new Error('problem trying to fetch video from your webcam'));
  });
};


export const setVideoSrc = (videoEl, src) => {
  if (videoEl.mozCaptureStream) {
    videoEl.mozSrcObject = src;
  } else {
    videoEl.src = (URL && URL.createObjectURL(src)) || src;
  }
}
