import React, { PropTypes } from 'react';

import Stats from 'stats.js/src/Stats';

import './TrackerContainer.styl';


export default class TrackerContainer extends React.Component {
  constructor () {
    super();
    this._stats = null;
    this._boundUpdateStats = this._updateStats.bind(this);
  }

  _updateStats () {
    const stats = this._stats;
    if (!stats) { return; }
    stats.update();
  }

  componentDidMount () {
    // Initialize the tracker
    this.componentDidUpdate({ tracker: null });
  }

  _addTrackerListeners (tracker) {
    tracker.on('iteration', this._boundUpdateStats);
  }

  _removeTrackerListeners (tracker) {
    if (!tracker) { return; }
    tracker.removeListener('iteration', this._boundUpdateStats);
  }

  shouldComponentUpdate (nextProps) {
    return (
      nextProps.tracker !== this.props.tracker ||
      nextProps.showStats !== this.props.showStats
    );
  }

  componentDidUpdate (prevProps) {
    const oldTracker = prevProps.tracker;
    const tracker = this.props.tracker;
    if (!this.props.showStats) {
      this._removeTrackerListeners(oldTracker);
    } else {
      this._removeTrackerListeners(oldTracker);
      if (tracker) {
        this._addTrackerListeners(tracker);
        // new stats!
        const statsContainer = this.refs.statsContainer;
        if (!statsContainer) {
          throw new Error('statsContainer is not available yet');
        }
        this._stats = new Stats({ container: statsContainer, cssText: '' });
      }
    }
  }

  render () {
    const mediaType = this.props.mediaType;
    let media;
    if (mediaType === 'video') {
      media = (
        <video
          className='media'
          ref='media'
          autoPlay
          loop
          {...this.props.mediaSize}
        >
          <source src={this.props.mediaSrc} type='video/ogg'/>
        </video>
      );
    } else if (mediaType === 'image') {
      media = (
        <canvas
          className='media'
          ref='media'
          {...this.props.mediaSize}
        />
      );
    } else {
      throw new Error('unknown mediaType: ' + mediaType);
    }

    return (
      <div className='tracker-container-cmpt'>
        {media}

        <canvas
          ref='canvas'
          className='overlay'
          {...this.props.mediaSize}
        />

        <div className='stats-container' ref='statsContainer' />
      </div>
    );
  }
}

TrackerContainer.propTypes = {
  mediaType: PropTypes.string.isRequired,
  mediaSrc: PropTypes.string,
  mediaSize: PropTypes.object.isRequired,
  showStats: PropTypes.bool,
  tracker: PropTypes.any
};
