// utils/env.js

let USERNAME = null;
let GENESIS = null;

NEXUS.utilities.onWalletDataUpdated((walletData) => {
  if (walletData?.userStatus?.username && walletData?.userStatus?.genesis) {
    USERNAME = walletData.userStatus.username;
    GENESIS = walletData.userStatus.genesis;
  }
});

export const getVotingConfig = () => {
  const isDev = window.location.pathname.includes('/repo/');
  const ENV = isDev ? 'DEV' : 'PROD';
  const VOTING_SIGCHAIN = ENV === 'DEV' ? 'VotingTestAuthority' : 'NexusCommunityVoting';
  return { ENV, VOTING_SIGCHAIN };
};

export const getWalletUserInfo = () => ({
  username: USERNAME,
  genesis: GENESIS,
});