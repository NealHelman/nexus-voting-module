// --- Service: nexusVotingService.js ---
const API = window.API;
const BACKEND_BASE = 'http://65.20.79.65:4006';

const nexusVotingService = {
  export async function getProtectedValues() {
    const res = await fetch(`${BACKEND_BASE}/module/protected-values`);
    return res.json();
  },
 
  async getAllVotes() {
    const params = {
      limit: 1000,
      WHERE: "results.type=OBJECT AND results.data.title=* AND results.data.option_accounts=* AND results.data.created_by=*",
    };
    const res = await API.get('/ledger/list/objects', { params });
    return res.map((obj) => {
      try {
        const data = typeof obj.data === 'string' ? JSON.parse(obj.data) : obj.data;
        return {
          id: obj.address,
          title: data.title,
          deadline: data.deadline,
          organizer: data.organizer_name,
          optionAccounts: data.option_accounts,
          vote_finality: data.vote_finality,
          min_trust: data.min_trust,
          total_votes: data.option_accounts?.length || 0,
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  },

  async getVoteById(id) {
    const res = await API.get(`/register/read/${id}`);
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

    const voteCounts = {};
    if (data.option_accounts) {
      await Promise.all(
        data.option_accounts.map(async (account) => {
          const txs = await API.get('/ledger/list/transactions', {
            params: {
              limit: 1000,
              WHERE: `results.contracts.address=${account} AND results.contracts.OP=CREDIT`
            }
          });
          voteCounts[account] = txs.length;
        })
      );
    }

    return {
      id,
      ...data,
      voteCounts,
    };
  },

  async createVoteViaBackend(issue) {
    const res = await fetch(`${BACKEND_BASE}/create-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    });
    if (!res.ok) throw new Error('Failed to contact VAS backend');
    return await res.json();
  },

  async castVote(account) {
    const payload = {
      amount: 0.000001,
      to: account,
    };
    return API.post('/finance/debit/account', payload);
  },

  async updateVoteViaBackend(issue) {
    const res = await fetch(`${BACKEND_BASE}/update-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    });
    if (!res.ok) throw new Error('Failed to contact VAS backend for update');
    return await res.json();
  },
};

export default nexusVotingService;
