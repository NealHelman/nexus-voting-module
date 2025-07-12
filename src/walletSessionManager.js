import { persistor } from './store';

const {
  utilities: { onceInitialize, onWalletDataUpdated }
} = NEXUS;

const LAST_SESSION_KEY = 'persist:lastWalletSession';

// Utility to extract a session signature (customize as needed)
function getSessionSignature(data) {
  // Use whatever uniquely identifies a session (adapt if your userStatus has a better key)
  return data?.userStatus?.userID || '';
}

// 1. Register to initialize session and possibly purge old persisted state
if (typeof onceInitialize === 'function') {
  onceInitialize((initialData) => {
    const currentSession = getSessionSignature(initialData);
    const lastSession = localStorage.getItem(LAST_SESSION_KEY);

    if (lastSession && lastSession !== currentSession) {
      persistor.purge();
    }

    localStorage.setItem(LAST_SESSION_KEY, currentSession);
  });
}

// 2. Register to listen for logout and purge then too
if (typeof onWalletDataUpdated === 'function') {
  onWalletDataUpdated((walletData) => {
    if (walletData.userStatus === null) {
      persistor.purge();
      localStorage.removeItem(LAST_SESSION_KEY);
    }
  });
}