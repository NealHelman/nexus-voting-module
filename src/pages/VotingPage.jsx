// --- VotingPage.jsx ---
const {
  libraries: { React, useEffect, useState },
  components: { Button, Panel, Dropdown },
  utilities: { apiCall, confirm, showErrorDialog },
} = NEXUS;

import { useDispatch, useSelector } from 'react-redux';
import { proxyRequest } from 'nexus-module';
import { Link } from 'react-router-dom';
import { decompressFromUTF16 } from 'lz-string';
import { fetchWeightedVoteCounts } from '../services/nexusVotingService';
import { getVotingConfig, getWalletUserInfo } from '../utils/env';

const { ENV, VOTING_SIGCHAIN } = getVotingConfig();
const { username, genesis } = getWalletUserInfo();

const BACKEND_BASE = 'https://65.20.79.65:4006';

export default function VotingPage({ userGenesis }) {
  const [filter, setFilter] = useState('active');
  const [sortOrder, setSortOrder] = useState('newest');
  const dispatch = useDispatch();
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);
  const [userGenesis, setUserGenesis] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [userTrust, setUserTrust] = useState(0);
  const [weightedVoteCounts, setWeightedVoteCounts] = useState({});


  useEffect(() => {
    getProtectedValues().then(values => {
    setMinTrust(values.MIN_TRUST);
    });
  }, []);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const { res } = await proxyRequest(
          `${BACKEND_BASE}/subscription-status/${genesis}`),
          { method: 'GET', null }
        );
        const data = await res.json();
        setSubscribed(data.subscribed);
      } catch (e) {
        console.error('Failed to check subscription status:', e);
      }
    };

    const checkTrust = async () => {
      try {
        const res = await apiCall('finance/get/account', { name: `${username}:trust` });
        const trust = parseInt(res?.trust || 0);
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
    dispatch(fetchVotes());
    apiCall('sessions/status/local')
      .then((res) => setUserGenesis(res?.genesis || null))
      .catch(() => setUserGenesis(null));
  }, [dispatch]);

  const handleSubscriptionToggle = async () => {
    const email = await window.getInput('Enter your email for voting issue announcements:');
    if (!email) return;
    await confirm({options.question : "Please confirm your subscription change"})
          then((agreed) => {
          if (agreed) {
            const endpoint = subscribed ? '/unsubscribe' : '/subscribe';
            try {
              await proxyRequest(
                `${BACKEND_BASE}${endpoint}`,
                {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, genesis: window?.USER?.genesis })
              });
              setSubscribed(!subscribed);
            } catch (e) {
              console.error(`Failed to ${subscribed ? 'unsubscribe' : 'subscribe'}:`, e);
            }
          } else {
            return;
          }
  };

  useEffect(() => {
    async function loadVotes() {
      const weighted = await fetchWeightedVoteCounts();
      setWeightedVoteCounts(weighted);
    }

    loadVotes();
  }, []);

  return (
    <Panel title="Nexus Community Voting">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Dropdown
          label="Filter"
          value={filter}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Closed', value: 'closed' },
          ]}
          onChange={e => setFilter(e.target.value)}
        />
        <Dropdown
          label="Sort"
          value={sortOrder}
          options={[
            { label: 'Newest First', value: 'newest' },
            { label: 'Oldest First', value: 'oldest' },
          ]}
          onChange={e => setSortOrder(e.target.value)}
        />
      </div>
      <Button onClick={handleSubscriptionToggle}>
        {subscribed ? 'Unsubscribe from Announcements' : 'Subscribe to Announcements'}
      </Button>

      {canAccessAdmin && <p><Link to="/admin">Go to Admin Panel</Link></p>}
      {loading ? <p>Loading...</p> : (
        <ul>
          {voteList
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
            })
          {votes.map((vote) => (
            <li key={vote.id}>
              <Link to={`/issue/${vote.id}`}>{vote.title}</Link>
              {vote.creator_genesis && vote.creator_genesis === userGenesis && (
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
      )}
    </Panel>
  );
};

export default VotingPage;
