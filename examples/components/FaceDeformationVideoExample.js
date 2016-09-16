import React from 'react';
import classNames from 'classnames';
import Dat, { DatNumber, DatBoolean } from 'react-dat-gui';
import '!style!css!react-dat-gui/lib/Dat.css';

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

import { ParamHolder } from 'clmtrackr/js/deformers/presets';

import TrackerContainer from 'clmtrackr/ui/container/TrackerContainer';
import Deformer from 'clmtrackr/js/deformers/twgl';

import './FaceDeformationVideoExample.styl';


const MEDIA_SIZE = { width: 370, height: 288 };


export default class FaceDeformationVideoExample extends React.Component {
  constructor () {
    super();
    this.state = {
      tracker: null,
      deformer: null,

      data: new ParamHolder(),
      startButtonDisabled: true,
      showScore: false,

      positions: null,
      hideMedia: false
    };

    this._boundOnFrame = this._onFrame.bind(this);
  }

  componentDidMount () {
    const tracker = new Tracker({ stopOnConvergence: true });
    tracker.init();
    tracker.convergenceThreshold = 1.8;

    const deformer = new Deformer();
    const trackerContainer = this.refs.trackerContainer;
    deformer.init(trackerContainer.refs.deformerCanvas);

    this.setState({ tracker, deformer });

    tracker.on('converged', () => {
      this._setupFaceDeformation();
    });

    setTimeout(() => {
      this._setupVideoStream();
    });
  }

  _setupFaceDeformation () {
    // hide message element
    this.setState({ showScore: false });

    const trackerContainer = this.refs.trackerContainer;
    const video = trackerContainer.refs.media;
    video.pause();

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

    setTimeout(() => { this._drawDeformedFace(); });
  }

  _drawDeformedFace () {
    const rotation = 0;
    const scale = 3;
    const xOffset = -10;
    const yOffset = 0;

    const tracker = this.state.tracker;
    const parameters = tracker.getCurrentParameters();
    parameters[0] = scale * Math.cos(rotation) - 1;
    parameters[1] = scale * Math.sin(rotation);
    parameters[2] = xOffset;
    parameters[3] = yOffset;

    const data = this.state.data;
    for (let i = 0; i < 20; i++) {
      parameters[i + 4] = data['param' + (i + 1)];
    }

    const positions = tracker.calculatePositions(parameters);
    const deformer = this.state.deformer;
    deformer.clear();
    if (data.drawFace) {
      deformer.draw(positions);
    }
    if (data.drawGrid) {
      deformer.drawGrid(positions);
    }
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
        this.setState({ mediaSrc: 'media/franck.ogv' });
      } else if (supportsH264BaselineVideo()) {
        alert('no mp4 video');
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
    this._onFrame();
  }

  _handleDatUpdate (dataUpdated) {
    this.setState({ data: dataUpdated });
    setTimeout(() => this._drawDeformedFace());
  }

  render () {
    const datControls = [];
    for (let i = 1; i <= 20; i++) {
      const min = -20;
      const max = 20;
      datControls.push(
        <DatNumber
          path={'param' + i}
          label={'Param ' + i}
          min={min}
          max={max}
          step={0.1}
          key={i}
        />
      );
    }
    datControls.push(<DatBoolean path='drawGrid' label='Draw Grid' key={50} />);
    datControls.push(<DatBoolean path='drawFace' label='Draw Face' key={51} />);

    let instructions;
    if (!this.state.showAltInstructions) {
      instructions = (
        <div>
          <p>To try it out:</p>
          <ol>
            <li>allow the page to your use webcamera</li>
            <li>make sure that your face is clearly visible in the video, and click start</li>
            <li>keep your head still until the model fits your face properly</li>
            <li>choose a preset or fiddle with the parameters on the right hand side, to deform the captured face</li>
          </ol>
        </div>
      );
    } else {
      instructions = (
        <div>
          <p>There was some problem trying to capture your webcamera, please check that your browser supports WebRTC. Instead we'll use a static image. To try it out:</p>
          <ol>
            <li>click start</li>
            <li>wait till the model fits the face</li>
            <li>choose a preset or fiddle with the parameters on the right hand side, to deform the captured face</li>
          </ol>
        </div>
      );
    }

    const startButtonDisabled = this.state.startButtonDisabled;
    let scoreText;
    if (this.state.showScore) {
      scoreText = <p>Please keep head still while model fits</p>;
    }

    return (
      <div
        className={classNames('face-deformation-video-example-cmpt', {
          'hide-media': this.state.hideMedia
        })}
      >
        <h1>Face deformation</h1>

        <TrackerContainer
          ref='trackerContainer'
          mediaType={'video'}
          mediaSrc={this.state.mediaSrc}
          mediaSize={MEDIA_SIZE}
          showStats={true}
          tracker={this.state.tracker}
          hasDeformer={true}
        />

        <div>
          <RaisedButton
            label={startButtonDisabled ? 'wait, loading video' : 'start'}
            disabled={startButtonDisabled}
            onClick={this._startVideo.bind(this)}
          />
        </div>
        {scoreText}
        <div>
          <p>This is an example of face deformation using the javascript library <a href='https://github.com/auduno/clmtrackr'><em>clmtrackr</em></a>.</p>
          <p>Note that this example needs support for WebGL, and works best in Google Chrome.</p>

          {instructions}
        </div>

        <Dat
          data={this.state.data}
          onUpdate={this._handleDatUpdate.bind(this)}
        >
          {datControls}
        </Dat>
      </div>
    );
  }
}
