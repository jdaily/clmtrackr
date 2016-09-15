// See: http://stackoverflow.com/questions/33541949/react-material-ui-dropdown-menu-not-working
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();
// ----

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';

import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createLogger from 'redux-logger';
import reducers from './reducers';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';


const DEV_MODE = location.host.indexOf('localhost') === 0;


let store;
if (DEV_MODE) {
  store = createStore(reducers, applyMiddleware(createLogger()));
} else {
  store = createStore(reducers);
}


ReactDOM.render(
  <Provider store={store}>
    <MuiThemeProvider>
      <App />
    </MuiThemeProvider>
  </Provider>,
  document.getElementById('main')
);
