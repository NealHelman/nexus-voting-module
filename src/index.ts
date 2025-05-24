// --- Root entry: index.ts ---
import { VotingPage } from './pages/VotingPage';
import { IssuePage } from './pages/IssuePage';
import { AdminPage } from './pages/AdminPage';
import { voteReducer } from './features/voteSlice';

export const routes = [
  { path: '/voting', element: <VotingPage /> },
  { path: '/voting/:issueId', element: <IssuePage /> },
  { path: '/admin', element: <AdminPage /> },
];

export const reducers = {
  voting: voteReducer,
};