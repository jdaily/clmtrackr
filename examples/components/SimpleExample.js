import React from 'react';

import Tracker from 'clmtrackr/js/Tracker';
import {
  requestAnimFrame,
  cancelRequestAnimFrame
} from 'clmtrackr/js/utils/anim';

import TrackerContainer from 'clmtrackr/ui/container/TrackerContainer';

import './ClmImageExample.styl';


const MEDIA_SRC = 'media/franck.ogv';
const MEDIA_SIZE = { width: 368, height: 288 };


export default class SimpleExample extends React.Component {
  constructor () {
    super();
    this.state = {
      tracker: null,
      points: null
    };

    this._animateRequestId = null;
  }

  componentDidMount () {
    const tracker = new Tracker();
    this.setState({ tracker });
    tracker.init();

    const trackerContainer = this.refs.trackerContainer;
    tracker.start(trackerContainer.refs.media);

    setTimeout(() => this._onFrame());
  }

  componentWillUnmount () {
    const tracker = this.state.tracker;
    tracker.stop();

    if (this._animateRequestId) {
      cancelRequestAnimFrame(this._animateRequestId);
      this._animateRequestId = null;
    }
  }

  _onFrame () {
    // Update overlay
    const trackerContainer = this.refs.trackerContainer;
    if (trackerContainer) {
      const tracker = this.state.tracker;
      const cc = trackerContainer.refs.canvas.getContext('2d');
      cc.clearRect(0, 0, MEDIA_SIZE.width, MEDIA_SIZE.height);
      tracker.draw(cc.canvas);

      // Update the rendered points
      this.setState({ points: tracker.getCurrentPosition() });
    }
    this._animateRequestId = requestAnimFrame(this._onFrame.bind(this));
  }

  render () {
    const positionChildren = [];

    const points = this.state.points;
    if (points) {
      for (let p = 0; p < 10; p++) {
        const positionString = (
          'featurepoint ' + p + ' : ' +
          '[' +
          points[p][0].toFixed(2) +
          ', ' +
          points[p][1].toFixed(2) +
          ']'
        );
        positionChildren.push(<div key={p}>{positionString}</div>);
      }
    }

    return (
      <div className='clm-image-example-cmpt'>
        <h1>Tracking a video tag</h1>

        <TrackerContainer
          ref='trackerContainer'
          mediaType={'video'}
          mediaSrc={MEDIA_SRC}
          mediaSize={MEDIA_SIZE}
          showStats={true}
          tracker={this.state.tracker}
        />

        <p>Printing coordinates of the first 10 points in facial features:</p>

        <div className='positions'>
          {positionChildren}
        </div>
      </div>
    );
  }
}
