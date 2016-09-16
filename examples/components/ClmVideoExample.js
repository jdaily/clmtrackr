import React from 'react';

import VideoExample from './VideoExample';

import Tracker from 'clmtrackr/js/Tracker';


export default class ClmVideoExample extends VideoExample {
  constructor () {
    super();
    this.state = _.merge(this.state, {
      title: 'Tracking a video tag'
    });

    this.mediaSize = { width: 400, height: 300 };
    this.oggVideoSrc = 'media/cap12_edit.ogv';
    this.mp4VideoSrc = 'media/cap12_edit.mp4';
  }

  newTracker () {
    return new Tracker();
  }

  startVideo () {
    super.startVideo();
    // start loop to draw face
    this._onFrame();
  }

  renderInstructions () {
    return (
      <ol>
        <li>allow the page to use your webcamera</li>
        <li>make sure that your face is clearly visible in the video, and click start</li>
        <li>see the model fitted to your face</li>
      </ol>
    );
  }

  renderAltInstructions () {
    return (
      <ol>
        <li>click start</li>
        <li>see the model fitted to the face</li>
      </ol>
    );
  }
}
