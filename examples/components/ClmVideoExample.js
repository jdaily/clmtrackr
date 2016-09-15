import React from 'react';
// import classNames from 'classnames';

import RaisedButton from 'material-ui/RaisedButton';

import Tracker from 'clmtrackr/js/Tracker';
import {
  supportsVideo,
  supportsH264BaselineVideo,
  supportsOggTheoraVideo,
  supportsUserMedia,
  loadVideo
} from 'clmtrackr/js/utils/video';
import { requestAnimFrame } from 'clmtrackr/js/utils/anim';

import TrackerContainer from 'clmtrackr/ui/container/TrackerContainer';

import '!style!css!react-image-crop/dist/ReactCrop.css';

import './ClmImageExample.styl';


const MEDIA_SIZE = { width: 400, height: 300 };


export default class ClmImageExample extends React.Component {
  constructor () {
    super();
    this.state = {
      tracker: null,

      showAltInstructions: false,
      mediaSrc: '',
      startButtonDisabled: true
    };

    this._boundOnFrame = this._onFrame.bind(this);
  }

  componentDidMount () {
    const tracker = new Tracker();
    this.setState({ tracker });
    tracker.init();

    setTimeout(() => {
      this._setupVideoStream();
    });
  }

  _setupVideoStream () {
    // check for camerasupport
    if (supportsUserMedia()) {
      // set up stream
      loadVideo((err, stream) => {
        if (err) {
          this._insertAltVideo();
          this.setState({ showAltInstructions: true });
          alert('There was some problem trying to fetch video from your webcam, using a fallback video instead.');
          return;
        }

        this.setState({ mediaSrc: stream });
      });
    } else {
      this._insertAltVideo();
      this.setState({ showAltInstructions: true });
      alert('Your browser does not seem to support getUserMedia, using a fallback video instead.');
    }

    const trackerContainer = this.refs.trackerContainer;
    const video = trackerContainer.refs.media;
    video.addEventListener('canplay', () => {
      this.setState({ startButtonDisabled: false });
    });
  }

  _onFrame () {
    // Update overlay
    const trackerContainer = this.refs.trackerContainer;
    if (trackerContainer) {
      const tracker = this.state.tracker;
      const cc = trackerContainer.refs.canvas.getContext('2d');
      cc.clearRect(0, 0, MEDIA_SIZE.width, MEDIA_SIZE.height);
      tracker.draw(cc.canvas);
    }
    requestAnimFrame(this._boundOnFrame);
  }

  _resetTracker () {
    const tracker = this.state.tracker;
    const trackerContainer = this.refs.trackerContainer;
    const overlayCC = trackerContainer.refs.canvas.getContext('2d');
    overlayCC.clearRect(0, 0, MEDIA_SIZE.width, MEDIA_SIZE.height);
    tracker.stop();
    tracker.reset();
  }

  _insertAltVideo () {
    if (supportsVideo()) {
      if (supportsOggTheoraVideo()) {
        this.setState({ mediaSrc: 'media/cap12_edit.ogv' });
      } else if (supportsH264BaselineVideo()) {
        this.setState({ mediaSrc: 'media/cap12_edit.mp4' });
      } else {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

  _startVideo () {
    // start video
    const trackerContainer = this.refs.trackerContainer;
    const video = trackerContainer.refs.media;
    // start tracking
    this._resetTracker();
    this.state.tracker.start(video);
    // start loop to draw face
    this._onFrame();
  }

  render () {
    const startButtonDisabled = this.state.startButtonDisabled;

    let instructions;
    if (!this.state.showAltInstructions) {
      instructions = (
        <div>
          <p>To try it out:</p>
          <ol>
            <li>allow the page to use your webcamera</li>
            <li>make sure that your face is clearly visible in the video, and click start</li>
            <li>see the model fitted to your face</li>
          </ol>
        </div>
      );
    } else {
      instructions = (
        <div>
          <p>There was some problem trying to capture your webcamera, please check that your browser supports WebRTC. Using a fallback video instead. To try it out:</p>
          <ol>
            <li>click start</li>
            <li>see the model fitted to the face</li>
          </ol>
        </div>
      );
    }

    return (
      <div className='clm-image-example-cmpt'>
        <h1>Tracking a video tag</h1>

        <TrackerContainer
          ref='trackerContainer'
          mediaType={'video'}
          mediaSrc={this.state.mediaSrc}
          mediaSize={MEDIA_SIZE}
          showStats={true}
          tracker={this.state.tracker}
        />

        <RaisedButton
          label={startButtonDisabled ? 'wait, loading video' : 'start'}
          disabled={startButtonDisabled}
          onClick={this._startVideo.bind(this)}
        />

        <div>
          <p>This is an example of face tracking using the javascript library <a href='https://github.com/auduno/clmtrackr'><em>clmtrackr</em></a>. The fitting method is generally called "Non-rigid/deformable face tracking/alignment using constrained local models".</p>
          <p>Note that this example works best in Google Chrome, with a computer that supports WebGL and floating point textures. It should however work in any modern browser.</p>

          {instructions}
        </div>
      </div>
    );
  }
}
