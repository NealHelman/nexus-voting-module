// --- VotingPage.jsx ---
import { useDispatch, useSelector } from 'react-redux';
import { proxyRequest } from 'nexus-module';
import { Link } from 'react-router-dom';
import { decompressFromUTF16 } from 'lz-string';
import { getVotingConfig, getWalletUserInfo } from '../utils/env';
import nexusVotingService from '../services/nexusVotingService';
import AdminPage from './AdminPage';

const BACKEND_BASE = 'http://65.20.79.65:4006';
const React = NEXUS.libraries.React;

function VotingPageComponent() {
  const {
    components: { Button, Panel, Dropdown, FieldSet },
    utilities: { apiCall, confirm, showErrorDialog },
  } = NEXUS;
  
  const [filter, setFilter] = React.useState('active');
  const [sortOrder, setSortOrder] = React.useState('newest');
  const dispatch = useDispatch();
  const [genesis, setGenesis] = React.useState('');
  const [canAccessAdmin, setCanAccessAdmin] = React.useState(false);
  const [subscribed, setSubscribed] = React.useState(false);
  const [userTrust, setUserTrust] = React.useState('');
  const [weightedVoteCounts, setWeightedVoteCounts] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [voteList, setVoteList] = React.useState([]);
  const [minTrust, setMinTrust] = React.useState('');
  const [environment, setEnvironment] = React.useState('');
  
  React.useEffect(() => {
    const { ENV, VOTING_SIGCHAIN } = getVotingConfig();
    nexusVotingService.getProtectedValues().then(values => {
    setMinTrust(values.MIN_TRUST_WEIGHT);
    setEnvironment(ENV);
    });
  }, []);
  
  React.useEffect(() => {
    window.myModuleDebug = { environment, genesis, filter, sortOrder, userTrust, minTrust };
  }, [environment, genesis, filter, sortOrder, userTrust, minTrust]);

  React.useEffect(() => {
    const getGenesis = async () => {
      try {
        const genesis = await apiCall(
          'finance/get/account/owner', 
          { name: 'default' });
        setGenesis(genesis);
      } catch (e) {
        showErrorDialog({
          message: 'Failed to retrieve genesis',
          note: e.message
        });
      }
    };
    getGenesis();

    const checkSubscriptionStatus = async () => {
      try {
        const { data } = await proxyRequest(
          `${BACKEND_BASE}/subscription-status/${genesis}`,
          { method: 'GET' }
        );
        setSubscribed(data.subscribed);
      } catch (e) {
        console.error('Failed to check subscription status:', e);
      }
    };

    const checkTrust = async () => {
      try {
        const trustScore = await apiCall(
          'finance/list/trust/trust', 
          { name: 'trust' });
        setUserTrust(trustScore?.[0]?.trust || 0);
        if (userTrust >= minTrust) setCanAccessAdmin(true);
      } catch (e) {
        showErrorDialog({
          message: 'Failed to retrieve trust level',
          note: e.message
        });
        setCanAccessAdmin(false);
      }
    };

    checkSubscriptionStatus();
    checkTrust();
  }, [dispatch]);

  const handleSubscriptionToggle = async () => {
    const email = await window.getInput('Enter your email for voting issue announcements:');
    if (!email) return;
    const agreed = await confirm({ question: "Please confirm your subscription change" });
	if (!agreed) return;
	const endpoint = subscribed ? '/unsubscribe' : '/subscribe';
	try {
	  const data = await proxyRequest(
		`${BACKEND_BASE}${endpoint}`,
		{
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, genesis })
	  });
	  setSubscribed(!subscribed);
	} catch (e) {
	  console.error(`Failed to ${subscribed ? 'unsubscribe' : 'subscribe'}:`, e);
	}
  };

  React.useEffect(() => {
    async function loadVotes() {
      setLoading(true);

      try {
        // Step 1: Get all votes
        const data = await proxyRequest(`${BACKEND_BASE}/ledger/list/objects`, { method: 'GET' });
        const votes = data.votes || [];
        setVoteList(votes);

        // Step 2: Fetch weighted counts for each vote
        const counts = {};
        for (const vote of votes) {
          try {
            const countResult  = await proxyRequest(`${BACKEND_BASE}/weighted-results/${vote.slug}`, { method: 'GET' });
            counts[vote.slug] = countResult ;
          } catch (err) {
            console.warn(`Failed to fetch weighted vote count for ${vote.slug}`, err);
            counts[vote.slug] = {};
          }
        }
        setWeightedVoteCounts(counts);
      } catch (e) {
        showErrorDialog({
          message: 'Failed to load votes',
          note: e.message
        });
      }

      setLoading(false);
    }

    loadVotes();
  }, []);
  
  return (
    <Panel title="Nexus Community On-Chain Voting - Issue Display" icon={{ url: 'voting.svg', id: 'icon' }}>
      <FieldSet style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <label htmlFor="filterSelect" style={{ marginBottom: '0.25rem' }}>Filter Voting Issues</label>
          <Dropdown label="Filter">
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </Dropdown>
          <label htmlFor="sortSelect" style={{ marginBottom: '0.25rem' }}>Sort Voting Issues</label>
          <Dropdown label="Sort">
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </Dropdown>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <Button onClick={handleSubscriptionToggle}>
            {subscribed ? 'Unsubscribe from Announcements' : 'Subscribe to Announcements'}
          </Button>
          {canAccessAdmin && <Button><Link to="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>Enter a New Issue to Vote On</Link></Button>}
        </div>
      </FieldSet>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
        {loading ? <p>Loading...</p> : (() => {
          const filteredVotes = voteList
            .filter(vote => vote.min_trust === undefined || userTrust >= vote.min_trust)
            .filter(vote => {
              const now = Date.now() / 1000;
              if (filter === 'active') return !vote.deadline || vote.deadline > now;
              if (filter === 'closed') return vote.deadline && vote.deadline <= now;
              return true;
            })
            .sort((a, b) => {
              return sortOrder === 'newest'
                ? b.created_at - a.created_at
                : a.created_at - b.created_at;
            });

          if (filteredVotes.length === 0) {
            return <p>No voting issues to display for this filter.</p>;
          }

          return (
            <ul>
              {filteredVotes.map((vote) => (
                <li key={vote.id}>
                  <Link to={`/issue/${vote.id}`}>{vote.title}</Link>
                  {vote.creator_genesis && vote.creator_genesis === genesis && (
                    <div><Link to={`/admin?edit=${vote.id}`}>(edit)</Link></div>
                  )}
                  {vote.optionAccounts && (
                    <ul style={{ fontSize: '0.9rem' }}>
                      {vote.optionAccounts.map((opt, idx) => {
                        const label = vote.option_labels?.[idx] || `Option ${idx + 1}`;
                        const weightedCount = weightedVoteCounts?.[vote.slug]?.[opt] ?? '...';

                        return (
                          <li key={opt}>
                            <strong>{label}</strong>: {weightedCount} weighted NXS
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          );
        })()}
        </div>
    </Panel>
  );
}

export default VotingPageComponent;