import React from 'react';
import classNames from 'classnames';

import RaisedButton from 'material-ui/RaisedButton';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import Toggle from 'material-ui/Toggle';

import Tracker from 'clmtrackr/js/Tracker';
import {
  supportsVideo,
  supportsH264BaselineVideo,
  supportsOggTheoraVideo,
  supportsUserMedia,
  loadVideo
} from 'clmtrackr/js/utils/video';
import { requestAnimFrame } from 'clmtrackr/js/utils/anim';

import { MASKS, getMask } from 'clmtrackr/examples/masks';

import TrackerContainer from 'clmtrackr/ui/container/TrackerContainer';
import Deformer from 'clmtrackr/js/deformers/twgl';

import './FaceMaskExample.styl';


const MEDIA_SIZE = { width: 370, height: 288 };

export default class FaceMaskExample extends React.Component {
  constructor () {
    super();
    this.state = {
      tracker: null,
      deformer: null,

      startButtonDisabled: true,
      showScore: false,

      hideMedia: false,
      useStockVideo: false,

      selectedMask: null,
      mask: null
    };

    this._boundOnFrame = this._onFrame.bind(this);
  }

  componentDidMount () {
    const tracker = new Tracker();
    tracker.init();

    const deformer = new Deformer();
    const trackerContainer = this.refs.trackerContainer;
    deformer.init(trackerContainer.refs.deformerCanvas);

    this.setState({ tracker, deformer });

    // tracker.on('converged', () => {
    //   this._setupFaceDeformation();
    // });

    const video = trackerContainer.refs.media;
    video.addEventListener('canplay', () => {
      this.setState({ startButtonDisabled: false });
    });

    setTimeout(() => {
      this._setupVideoStream();
      this._handleMaskChange(MASKS[0].id, true);
    });
  }

  _setupFaceDeformation () {
    // hide message element
    this.setState({ showScore: false });

    const trackerContainer = this.refs.trackerContainer;
    const video = trackerContainer.refs.media;

    // draw face deformation model
    const tracker = this.state.tracker;
    const deformer = this.state.deformer;
    deformer.load(
      video,
      tracker.getCurrentPosition(),
      tracker,
      null
    );

    // hide video
    this.setState({ hideMedia: true });
  }

  _drawGridLoop () {
    // get position of face
    const trackerContainer = this.refs.trackerContainer;
    const media = trackerContainer.refs.media;
    const tracker = this.state.tracker;
    const positions = tracker.getCurrentPosition(media);

    const overlayCC = trackerContainer.refs.canvas.getContext('2d');
    overlayCC.clearRect(0, 0, MEDIA_SIZE.width, MEDIA_SIZE.height);

    if (positions) {
      // draw current grid
      tracker.draw(overlayCC.canvas);
    }
    // check whether mask has converged
    var pn = tracker.getConvergence();
    if (pn < 0.4) {
      this._switchMasks();
      requestAnimFrame(this._drawMaskLoop.bind(this));
    } else {
      requestAnimFrame(this._drawGridLoop.bind(this));
    }
  }

  _drawMaskLoop () {
    const trackerContainer = this.refs.trackerContainer;
    const overlayCC = trackerContainer.refs.canvas.getContext('2d');
    overlayCC.clearRect(0, 0, MEDIA_SIZE.width, MEDIA_SIZE.height);
    // get position of face
    const tracker = this.state.tracker;
    const positions = tracker.getCurrentPosition();
    if (positions) {
      // draw mask on top of face
      const deformer = this.state.deformer;
      deformer.draw(positions);
    }
    requestAnimFrame(this._drawMaskLoop.bind(this));
  }

  _setupVideoStream () {
    if (this.state.useStockVideo) {
      this._insertAltVideo();
      return;
    }

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
  }

  _onFrame () {
    // Update overlay
    const trackerContainer = this.refs.trackerContainer;
    if (trackerContainer) {
      // TODO: This should really draw to the same canvas as the deformer,
      // Need to add webgl support to `tracker#draw`
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
        this.setState({ mediaSrc: 'media/cap13_edit2.ogv' });
      } else if (supportsH264BaselineVideo()) {
        this.setState({ mediaSrc: 'media/cap13_edit2.mp4' });
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
    this.setState({ showScore: true });
    // start loop to draw face
    // this._onFrame();
    this._setupFaceDeformation();
    this._drawGridLoop();
  }

  _switchMasks () {
    const mask = this.state.mask;
    const deformer = this.state.deformer;
    deformer.setPoints(mask.map);

    const image = new Image();
    image.onload = () => {
      deformer.setMaskTexture(image)
    };
    image.src = mask.texture;
  }

  _handleMaskChange (value, skipUpdate) {
    this.setState({
      selectedMask: value,
      mask: getMask(value)
    });
    if (!skipUpdate) {
      setTimeout(() => this._switchMasks());
    }
  }

  _handleStockVideoToggle (flag) {
    this.setState({ useStockVideo: flag });
    setTimeout(() => this._setupVideoStream());
  }

  render () {
    let instructions;
    if (!this.state.showAltInstructions) {
      instructions = (
        <div>
          <p>To try it out:</p>
          <ol>
            <li>allow the page to use your webcamera</li>
            <li>make sure that your face is clearly visible in the video, and click start</li>
            <li>keep your face still, and wait till model fits your face and mask is applied</li>
            <li>try out different masks from the dropdown</li>
          </ol>
        </div>
      );
    } else {
      instructions = (
        <div>
          <p>There was some problem trying to capture your webcamera, please check that your browser supports WebRTC. Using a fallback video instead. try it out:</p>
          <ol>
            <li>click start</li>
            <li>wait till model fits the face and a mask is applied</li>
            <li>try out different masks from the dropdown</li>
          </ol>
        </div>
      );
    }

    const startButtonDisabled = this.state.startButtonDisabled;
    let scoreText;
    if (this.state.showScore) {
      scoreText = <p>Please keep head still while model fits</p>;
    }

    const dropdownItems = MASKS.map((mask, i) => <MenuItem
      value={mask.id}
      primaryText={mask.name}
      key={i}
    />);

    return (
      <div
        className={classNames('face-mask-example-cmpt', {
          'hide-media': this.state.hideMedia
        })}
      >
        <h1>Face Mask</h1>

        <TrackerContainer
          ref='trackerContainer'
          mediaType={'video'}
          mediaSrc={this.state.mediaSrc}
          mediaSize={MEDIA_SIZE}
          showStats={true}
          tracker={this.state.tracker}
          hasDeformer={true}
        />

        <div className='control-row'>
          <RaisedButton
            label={startButtonDisabled ? 'wait, loading video' : 'start'}
            disabled={startButtonDisabled}
            onClick={this._startVideo.bind(this)}
          />

          <Toggle
            label='Use stock video'
            toggled={this.state.useStockVideo}
            style={{ width: 'auto' }}
            onToggle={(event, flag) => this._handleStockVideoToggle(flag)}
          />

          <div className='mask-select'>
            <div>Select Mask</div>
            <DropDownMenu
              value={this.state.selectedMask}
              onChange={(event, index, value) => this._handleMaskChange(value)}
            >
              {dropdownItems}
            </DropDownMenu>
          </div>
        </div>
        {scoreText}
        <div>
          <p>This is an example of face deformation using the javascript library <a href='https://github.com/auduno/clmtrackr'><em>clmtrackr</em></a>.</p>
          <p>Note that this example needs support for WebGL, and works best in Google Chrome.</p>

          {instructions}
        </div>
      </div>
    );
  }
}
