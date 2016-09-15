import React from 'react';

import MenuDrawer from './MenuDrawer';
import SimpleExample from './simple';

import './App.styl'


export default class App extends React.Component {
  render () {
    const example = <SimpleExample />;

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
