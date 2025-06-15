// utils/env.js

export const getVotingConfig = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const ENV = isDev ? 'DEV' : 'PROD';
  const VOTING_SIGCHAIN = ENV === 'DEV' ? 'VotingTestAuthority' : 'NexusCommunityVoting';
  return { ENV, VOTING_SIGCHAIN };
};
