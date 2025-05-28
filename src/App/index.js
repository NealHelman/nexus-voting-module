// === SHIM REACT/REACTDOM ===
if (typeof window.React === 'undefined') {
  if (typeof NEXUS !== 'undefined' && NEXUS.libraries?.React) {
    window.React = NEXUS.libraries.React;
  } else {
    window.React = require('react');
  }
}

if (typeof window.ReactDOM === 'undefined') {
  if (typeof NEXUS !== 'undefined' && NEXUS.libraries?.ReactDOM) {
    window.ReactDOM = NEXUS.libraries.ReactDOM;
  } else {
    window.ReactDOM = require('react-dom/client');
  }
}

// === IMPORTS ===
import { Provider } from 'react-redux';
import store from './store';
import VotingPage from './pages/VotingPage.jsx';
import { ModuleWrapper } from 'nexus-module';

// === MAIN ENTRY POINT ===
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ No #root element found in HTML');
    return;
  }

  const content = window.React.createElement(
    Provider,
    { store },
    window.React.createElement(
      ModuleWrapper,
      null,
      window.React.createElement(VotingPage)
    )
  );

  if (typeof window.ReactDOM.createRoot === 'function') {
    window.ReactDOM.createRoot(rootElement).render(content);
  } else {
    window.ReactDOM.render(content, rootElement);
  }
});
