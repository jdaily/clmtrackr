import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import MenuDrawer from './MenuDrawer';
import SimpleExample from './SimpleExample';
import ClmImageExample from './ClmImageExample';

import './App.styl'

const EXAMPLE_TO_CMPT = {
  simple: SimpleExample,
  clmImage: ClmImageExample
}

class App extends React.Component {
  render () {
    const exampleCtor = EXAMPLE_TO_CMPT[this.props.activeExample];
    let example;
    if (exampleCtor) {
      example = React.createElement(exampleCtor);
    } else {
      example = <h1>Coming Soon!</h1>;
    }

    return (
      <div className='app-cmpt'>
        <MenuDrawer />
        <div className='example-wrapper'>
          {example}
        </div>
      </div>
    );
  }
}

App.propTypes = {
  activeExample: PropTypes.string
};

const mapStateToProps = state => {
  return {
    activeExample: state.examples.activeExample
  };
};

const mapDispatchToProps = dispatch => {
  return { };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
