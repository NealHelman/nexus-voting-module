// Fallback for dev mode if wallet fails to inject React and ReactDOM
if (!window.React || !window.ReactDOM) {
  import('react').then((React) => {
    window.React = React.default;
  });
  import('react-dom').then((ReactDOM) => {
    window.ReactDOM = ReactDOM;
  });
}

import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { listenToWalletData } from 'nexus-module';

import('react-dom/client').then((ReactDOMClient) => {
  window.ReactDOMClient = ReactDOMClient;
});


const React = window.React;
const ReactDOM = window.ReactDOM;

import VotingPage from './pages/VotingPage';

if (ReactDOM.createRoot) {
  ReactDOM.createRoot(rootElement).render(<VotingPage />);
} else {
  ReactDOM.render(<VotingPage />, rootElement);
}
