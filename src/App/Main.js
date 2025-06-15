import styled from '@emotion/styled';
import { HashRouter, Routes, Route } from 'react-router-dom';
import VotingPage from './VotingPage';
import AdminPage from './AdminPage';
console.log('AdminPage import:', AdminPage)
import { useSelector, useDispatch } from 'react-redux';
import {
  Panel,
  Switch,
  Tooltip,
  TextField,
  Button,
  FieldSet,
  confirm,
  apiCall,
  showErrorDialog,
  showSuccessDialog,
} from 'nexus-module';

import {
  showConnections,
  hideConnections,
  updateInput,
} from 'actions/actionCreators';

export default function Main() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<VotingPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </HashRouter>
  );
}