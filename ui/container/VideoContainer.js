import React, { PropTypes } from 'react';

import './VideoContainer.styl';


export default class VideoContainer extends React.Component {
  render () {
    return (
      <div className='video-container-cmpt'>
        <video
          ref='video'
          autoPlay
          loop
          {...this.props.videoSize}
        >
          <source src={this.props.videoSrc} type='video/ogg'/>
        </video>

        <canvas
          ref='canvas'
          {...this.props.videoSize}
        />
      </div>
    );
  }
}

VideoContainer.propTypes = {
  videoSrc: PropTypes.string,
  videoSize: PropTypes.object.isRequired
};
