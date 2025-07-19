import './walletSessionManager';

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './store';
import { listenToWalletData } from 'nexus-module';
import marketplaceTheme from './Styles/theme';


import App from './App';
import './Styles/styles.css';

const {
  libraries: {
    React,
    ReactDOM,
    emotion: { react, styled, cache },
  }
} = NEXUS;
const { ThemeProvider } = NEXUS.libraries.emotion.react;

listenToWalletData(store);

const root = createRoot(document.getElementById('root'));
console.log("Redux Persist running");
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
       <ThemeProvider theme={marketplaceTheme}>
        <App />
      </ThemeProvider>
    </PersistGate>
  </Provider>
);