// import './App.styl';
// import 'font-awesome-webpack';

import React from 'react';

import Tracker from 'clmtrackr/js/Tracker';

import VideoContainer from 'clmtrackr/ui/container/VideoContainer';

const VIDEO_SRC = 'media/franck.ogv';
const VIDEO_SIZE = { width: 368, height: 288 };


export default class SimpleExample extends React.Component {
  constructor () {
    super();
    this.state = {
      tracker: null
    };
  }

  componentDidMount () {
    const tracker = new Tracker();
    this.setState({ tracker });
    tracker.init();

    const videoContainer = this.refs.videoContainer;
    tracker.start(videoContainer.refs.video);

    requestAnimationFrame(this._onFrame.bind(this));
  }

  _onFrame () {
    // Update overlay
    const cc = this.refs.videoContainer.refs.canvas.getContext('2d');
    cc.clearRect(0, 0, VIDEO_SIZE.width, VIDEO_SIZE.height);
    this.state.tracker.draw(cc.canvas);

    // Update the rendered points
    this.forceUpdate();
    requestAnimationFrame(this._onFrame.bind(this));
  }

  render () {
    const positionChildren = [];

    const tracker = this.state.tracker;
    const positions = tracker && tracker.getCurrentPosition();
    if (positions) {
      for (let p = 0; p < 10; p++) {
        const positionString = (
          'featurepoint ' + p + ' : ' +
          '[' +
          positions[p][0].toFixed(2) +
          ', ' +
          positions[p][1].toFixed(2) +
          ']'
        );
        positionChildren.push(<div key={p}>{positionString}</div>);
      }
    }

    return (
      <div className='simple-example-cmpt'>
        <h1>Tracking a video tag</h1>

        <VideoContainer
          ref='videoContainer'
          videoSrc={VIDEO_SRC}
          videoSize={VIDEO_SIZE}
        />

        <p>Printing coordinates of the first 10 points in facial features:</p>

        <div className='positions'>
          {positionChildren}
        </div>
      </div>
    );
  }
}
