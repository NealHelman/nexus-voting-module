// utils/env.js

export function getVotingConfig() {
  const isDev = window.location.hostname === 'localhost';
  const ENV = isDev ? 'DEV' : 'PROD';
  const VOTING_SIGCHAIN = ENV === 'PROD' ? 'NexusCommunityVoting' : 'VotingTestAuthority'; //VotingTestUser
  return { ENV, VOTING_SIGCHAIN };
}