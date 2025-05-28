import { useSelector } from 'react-redux';
import { ModuleWrapper } from 'nexus-module';
import VotingPage from '../pages/VotingPage.jsx';

export default function App() {
  const initialized = useSelector((state) => state.nexus.initialized);
  const theme = useSelector((state) => state.nexus.theme);

  return (
    <ModuleWrapper initialized={initialized} theme={theme}>
      <VotingPage />
    </ModuleWrapper>
  );
}
