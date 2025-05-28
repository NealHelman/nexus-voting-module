// Fallback for dev mode if wallet fails to inject React and ReactDOM
// Fallback for development ONLY: inject React globals for wallet module dev testing
if (!window.React || !window.ReactDOM) {
  import('react').then((React) => {
    window.React = React.default;
  });
  import('react-dom').then((ReactDOM) => {
    window.ReactDOM = ReactDOM;
  });
}

import('react-dom/client').then((ReactDOMClient) => {
  window.ReactDOMClient = ReactDOMClient;
});


const React = window.React;
const ReactDOM = window.ReactDOM;

import VotingPage from './pages/VotingPage';

const rootElement = document.getElementById('root');

if (ReactDOM.createRoot) {
  ReactDOM.createRoot(rootElement).render(<VotingPage />);
} else {
  ReactDOM.render(<VotingPage />, rootElement);
}
