import { useSelector } from 'react-redux';
import { ModuleWrapper } from 'nexus-module';

import Main from './Main';

export default function App() {
  const initialized = useSelector((state) => state.nexus.initialized);
  const theme = useSelector((state) => state.nexus.theme);

  const content = <Main />;

  console.log('[DEBUG] typeof content:', typeof content);
  console.log('[DEBUG] content:', content);

  return (
    <ModuleWrapper initialized={initialized} theme={theme}>
      {content}
    </ModuleWrapper>
  );
}
