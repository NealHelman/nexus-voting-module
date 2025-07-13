import styled from '@emotion/styled';
import { Routes, Route } from 'react-router-dom';
import VotingPage from './VotingPage';
import AdminPage from './AdminPage';
import IssuePage from './IssuePage';
import UserGuidePage from './UserGuidePage';
import { useSelector, useDispatch } from 'react-redux';
import '../walletSessionManager.js';

export default function Main() {
  const rehydrated = useSelector(state => state._persist?.rehydrated);
  console.log("rehydrated", rehydrated);
  if (!rehydrated) return null;
  
  return (
    <Routes>
      <Route path="/" element={<VotingPage />} />
      <Route path="/voting" element={<VotingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/issue/:issueId" element={<IssuePage />} />
      <Route path="/userguide" element={<UserGuidePage />} />
    </Routes>
  );
}