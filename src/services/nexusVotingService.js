import { proxyRequest } from 'nexus-module';

const BACKEND_BASE = 'http://65.20.79.65:4006';

const nexusVotingService = {
  export async function getProtectedValues() {
    const { res } = await proxyRequest(
      `${BACKEND_BASE}/module/protected-values`,
      { method: 'GET', null }
    );
    return res.json();
  },
  
  export async function getWeightedResults(slug) {
	  const { res } = await proxyRequest(
      `${BACKEND_BASE}/weighted-results/${slug}`,
      { method: 'GET', null }
    );
	  if (!response.ok) {
      throw new Error('Failed to fetch weighted vote results');
	  }
	  return await response.json();
	}
 
  async createVoteViaBackend(issue) {
    const { res } = await proxyRequest(
      `${BACKEND_BASE}/create-vote`,
      {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    });
    if (!res.ok) throw new Error('Failed to contact VAS backend');
    return await res.json();
  },

  async updateVoteViaBackend(issue) {
    const { res } = await proxyRequest(
      `${BACKEND_BASE}/update-vote`,
      {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    });
    if (!res.ok) throw new Error('Failed to contact VAS backend for update');
    return await res.json();
  },
};

export default nexusVotingService;
