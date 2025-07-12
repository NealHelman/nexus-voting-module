import './walletSessionManager';

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './store';
import { listenToWalletData } from 'nexus-module';

import App from './App';
import './Styles/styles.css';

listenToWalletData(store);

const root = createRoot(document.getElementById('root'));
console.log("Redux Persist running");
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);