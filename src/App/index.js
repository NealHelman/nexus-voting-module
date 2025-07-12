import { Provider } from 'react-redux';
import store from '../store'; 
import { useSelector } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { ModuleWrapper } from 'nexus-module';
import Main from './Main';
import RouteTracker from './RouteTracker';
import RestoreLastPage from './RestoreLastPage';

export default function App() {
  const initialized = useSelector((state) => state.nexus && state.nexus.initialized);
  const theme = useSelector((state) => state.nexus && state.nexus.theme);
  
  return (
    <ModuleWrapper initialized={initialized} theme={theme}>
      <HashRouter>
        <RestoreLastPage />
        <RouteTracker />
        <Main />
      </HashRouter>
    </ModuleWrapper>
  );
}