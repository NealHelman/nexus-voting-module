import { proxyRequest } from 'nexus-module';

const BACKEND_BASE = 'http://65.20.79.65:4006';

  const {
    utilities: { showErrorDialog },
  } = NEXUS;

const nexusVotingService = {
  getProtectedValues: async () => {
    const environment = process.env.NODE_ENV;
    const data = await proxyRequest(
      `${BACKEND_BASE}/module-protected-values/${environment}`,
      { method: 'GET' }
    );
    console.log(JSON.stringify(data, null, 2));
    return data;
  },
  
  createVoteViaBackend: async (txid, assetConfig, optionAccounts) => {
    const response = await proxyRequest(
      `${BACKEND_BASE}/create-vote`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          txid,
          assetConfig,
          optionAccounts
        }
      }
    );
    
    if (!response.data.success) {
      showErrorDialog({ message: 'Vote creation failed', note: response.error || 'Unknown error' });
      return;
    }

    console.log("createVoteViaBackend::response.data: ", response.data);
    return response.data;
  },

  updateVoteViaBackend: async (assetId, assetConfig, optionAccounts) => {
    const response = await proxyRequest(
      `${BACKEND_BASE}/update-vote`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          assetId,
          assetConfig,
          optionAccounts
        }
      }
    );

    if (!response.data.success) {
      showErrorDialog({ message: 'Vote update failed', note: response.error || 'Unknown error' });
      return;
    }

    return response.data;
  }
};

export default nexusVotingService;
