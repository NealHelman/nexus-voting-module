import styled from '@emotion/styled';
import { Routes, Route } from 'react-router-dom';
import VotingPage from './VotingPage';
import AdminPage from './AdminPage';
import IssuePage from './IssuePage';
import UserGuidePage from './UserGuidePage';
import { useSelector, useDispatch } from 'react-redux';

export default function Main() {
  const rehydrated = useSelector(state => state._persist?.rehydrated);
  const wholeState = useSelector(state => state);
  console.log("rehydrated", rehydrated, wholeState);
  if (!rehydrated) return null;
  
  return (
    <Routes>
      <Route path="/" element={<VotingPage />} />
      <Route path="/voting" element={<VotingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/issue" element={<IssuePage />} />
      <Route path="/userguide" element={<UserGuidePage />} />
    </Routes>
  );
}