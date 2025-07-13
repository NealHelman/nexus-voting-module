import { persistor } from './store';

const {
  utilities: { uiSessionId },
} = NEXUS;

const LAST_SESSION_KEY = 'persist:lastWalletSession';

const currentSession = uiSessionId();
const lastSession = localStorage.getItem(LAST_SESSION_KEY);

console.log('currentSession: ', currentSession); 
console.log('lastSession: ', lastSession); 


if (lastSession && lastSession !== currentSession) {
  persistor.purge();
  localStorage.setItem(LAST_SESSION_KEY, currentSession);
}

