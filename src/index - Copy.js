console.log("index.js");
import { Provider } from 'react-redux';
import configureStore from './configureStore';
import VotingPage from './pages/VotingPage.jsx';
import { ModuleWrapper } from 'nexus-module';

const store = configureStore();

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('rootElement not found. Ensure <div id="root"></div> exists in your HTML.');
    return;
  }

  const root = window.ReactDOM.createRoot(rootElement);

  root.render(
    window.React.createElement(
      Provider,
      { store },
      window.React.createElement(
        ModuleWrapper,
        null,
        window.React.createElement(VotingPage)
      )
    )
  );
});
