// utils/env.js

export function getVotingConfig() {
  const devPathMatch = window?.location?.href?.includes('/repos');
  const ENV = devPathMatch ? 'DEV' : 'PROD';
  const VOTING_SIGCHAIN = ENV === 'PROD' ? 'NexusCommunityVoting' : 'VotingTestAuthority';
  return { ENV, VOTING_SIGCHAIN };
}