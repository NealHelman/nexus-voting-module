// --- VotingPage.jsx ---
import { useDispatch, useSelector } from 'react-redux';
import { proxyRequest } from 'nexus-module';
import { Link } from 'react-router-dom';
import { decompressFromUTF16 } from 'lz-string';
import { getVotingConfig, getWalletUserInfo } from '../utils/env';
import nexusVotingService from '../services/nexusVotingService';

const BACKEND_BASE = 'http://65.20.79.65:4006';

export default function VotingPage() {
  const {
    libraries: { React },
    components: { Button, Panel, Dropdown },
    utilities: { apiCall, confirm, showErrorDialog },
  } = NEXUS;
  
  const [filter, setFilter] = React.useState('active');
  const [sortOrder, setSortOrder] = React.useState('newest');
  const dispatch = useDispatch();
  const [username, setUsername] = React.useState(null);
  const [genesis, setGenesis] = React.useState(null);
  const [canAccessAdmin, setCanAccessAdmin] = React.useState(false);
  const [userGenesis, setUserGenesis] = React.useState(null);
  const [subscribed, setSubscribed] = React.useState(false);
  const [userTrust, setUserTrust] = React.useState(0);
  const [weightedVoteCounts, setWeightedVoteCounts] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [voteList, setVoteList] = React.useState([]);
  const [minTrust, setMinTrust] = React.useState(null);
  
  React.useEffect(() => {
  // ✅ 1. Handle initial wallet load
    NEXUS.utilities.onceInitialize((initialData) => {
      if (initialData.userStatus) {
        setUsername(initialData.userStatus.username);
        setGenesis(initialData.userStatus.genesis);
      }
    });

    // ✅ 2. Keep in sync with future login/logout events
    NEXUS.utilities.onWalletDataUpdated((walletData) => {
      if (walletData.userStatus) {
        setUsername(walletData.userStatus.username);
        setGenesis(walletData.userStatus.genesis);
      } else {
        setUsername(null);
        setGenesis(null);
      }
    });

    const { ENV, VOTING_SIGCHAIN } = getVotingConfig();
    nexusVotingService.getProtectedValues().then(values => {
    setMinTrust(values.MIN_TRUST);
    console.log("minTrust: " + minTrust);
    });
  }, []);
  
  React.useEffect(() => {
    if (!genesis) return;
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
      if (!username) return;
      try {
        const data = await apiCall('finance/get/account', { name: `${username}:trust` });
        const trust = parseInt(data?.trust || 0);
        setUserTrust(trust);
        if (trust >= MIN_TRUST_WEIGHT) setCanAccessAdmin(true);
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
    apiCall('sessions/status/local')
      .then((res) => setUserGenesis(res?.genesis || null))
      .catch(() => setUserGenesis(null));
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
    <Panel title="Nexus Community Voting" icon={{ url: 'react.svg', id: 'icon' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Dropdown label="Filter">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </Dropdown>
        <Dropdown label="Sort">
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </Dropdown>
      </div>
      <Button onClick={handleSubscriptionToggle}>
        {subscribed ? 'Unsubscribe from Announcements' : 'Subscribe to Announcements'}
      </Button>
      {canAccessAdmin && <p><Link to="/admin">Go to Admin Panel</Link></p>}
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
    </Panel>
  );
}
