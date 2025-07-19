import { INITIALIZE } from 'nexus-module';
import { combineReducers } from 'redux';
import { walletDataReducer } from 'nexus-module';

import settings from './settings';
import ui from './ui';

import voting from './voting';
import admin from './admin';
import issue from './issue';
import userGuide from './userGuide';

export default function createReducer() {
  return function (state, action) {
    const baseReducer = combineReducers({
      voting,
      admin,
      issue,
      userGuide,
      settings,
      ui,
      nexus: walletDataReducer,
    });
    const newState = baseReducer(state, action);

    if (action.type === INITIALIZE) {
      const { storageData, moduleState } = action.payload;
      if (storageData || moduleState) {
        return {
          ...newState,
          ...action.payload.storageData,
          ...action.payload.moduleState,
        };
      }
    }

    return newState;
  };
}
