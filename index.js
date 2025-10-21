import { registerRootComponent } from 'expo';
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';

import React from 'react';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './src/Redux/store'; // adjust the path to your store file

// Wrap App with Provider
const Root = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
registerRootComponent(Root);
