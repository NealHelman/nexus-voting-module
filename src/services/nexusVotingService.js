import { proxyRequest } from 'nexus-module';

const BACKEND_BASE = 'http://65.20.79.65:4006';

const nexusVotingService = {
  getProtectedValues: async () => {
    const { data } = await proxyRequest(
      `${BACKEND_BASE}/module-protected-values`,
      { method: 'GET' }
    );
    console.log(JSON.stringify(data, null, 2));
    return data;
  },
  
  createVoteViaBackend: async (issue) => {
    const { data } = await proxyRequest(
      `${BACKEND_BASE}/create-vote`,
      {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    });
    if (!data.ok) throw new Error('Failed to contact VAS backend');
    return await data;
  },

  updateVoteViaBackend: async (issue) => {
    const { data } = await proxyRequest(
      `${BACKEND_BASE}/update-vote`,
      {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    });
    if (!data.ok) throw new Error('Failed to contact VAS backend for update');
    return await data.json();
  },
};

export default nexusVotingService;
