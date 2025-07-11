import { Provider } from 'react-redux';
import store from '../store'; 
import { useSelector } from 'react-redux';
import { ModuleWrapper } from 'nexus-module';
import Main from './Main';

export default function App() {
  const initialized = useSelector((state) => state.nexus && state.nexus.initialized);
  const theme = useSelector((state) => state.nexus && state.nexus.theme);
  
  return (
    <Provider store={store}>
      <ModuleWrapper initialized={initialized} theme={theme}>
        <Main />
      </ModuleWrapper>
    </Provider>
  );
}