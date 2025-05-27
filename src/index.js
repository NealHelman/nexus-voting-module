import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { listenToWalletData } from 'nexus-module';

import configureStore from './configureStore';
import App from './App';

const store = configureStore();
listenToWalletData(store);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
