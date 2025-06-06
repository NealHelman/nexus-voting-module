import { Provider } from 'react-redux';
import configureStore from './configureStore';
import { ModuleWrapper, onceInitialize, INITIALIZE } from 'nexus-module';
import VotingPage from './pages/VotingPage.jsx';

const store = configureStore();

function renderApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ rootElement not found.');
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
}

document.addEventListener('DOMContentLoaded', () => {
  onceInitialize((initialData) => {
    console.log("🔧 onceInitialize received: ", initialData);

    store.dispatch({
      type: INITIALIZE,
      payload: initialData,
    });

    console.log("✅ Store state after INIT", store.getState());

    renderApp();  // ✅ Only render AFTER store is populated
  });
});
