// --- VotingPage.jsx ---
import { useDispatch, useSelector } from 'react-redux';
import { proxyRequest } from 'nexus-module';
import { Link } from 'react-router-dom';
import { decompressFromUTF16 } from 'lz-string';
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
  const [canAccessAdmin, setCanAccessAdmin] = React.useState(0);
  const [subscribed, setSubscribed] = React.useState(0);
  const [userTrust, setUserTrust] = React.useState(0);
  const [userWeight, setUserWeight] = React.useState(0);
  const [userVotesCast, setUserVotesCast] = React.useState(0);
  const [weightedVoteCounts, setWeightedVoteCounts] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [voteList, setVoteList] = React.useState([]);
  const [minTrust, setMinTrust] = React.useState(0);
  const [votingAuthoritySigchain, setVotingAuthoritySigchain] = React.useState('');
  const [votingAuthorityAccount, setVotingAuthorityAccount] = React.useState('');
  
  React.useEffect(() => {
    nexusVotingService.getProtectedValues().then(({ data }) => {
      setVotingAuthoritySigchain(data.VOTING_AUTHORITY_SIGCHAIN);
      setVotingAuthorityAccount(data.VOTING_AUTHORITY_ACCOUNT);
    });
  }, []);

  React.useEffect(() => {
    const getGenesis = async () => {
      try {
        const data = await apiCall("finance/get/account/owner", { name: 'default' });
        const genesis = data?.owner || '';
        setGenesis(genesis);
      } catch (e) {
        showErrorDialog({
          message: 'Failed to retrieve genesis',
          note: e.message
        });
      }
    };
    getGenesis();
  }, []);
    
  React.useEffect(() => {
    if (!genesis) return; // 🚨 wait for genesis to be set

    const checkSubscriptionStatus = async () => {
      try {
        const response = await proxyRequest(`${BACKEND_BASE}/subscription-status/${genesis}`, { method: 'GET' });
        console.log("response.data.subscribed: ", response.data.subscribed);
        setSubscribed(response.data.subscribed);
      } catch (e) {
        console.error('Failed to check subscription status:', e);
      }
    };

    const checkTrust = async () => {
      try {
        const response = await apiCall('finance/list/trust/trust,stake', { name: 'trust' });
        const trust = response?.[0]?.trust || 0;
        const stake = response?.[0]?.stake || 0;
        setUserTrust(trust);
        setUserWeight(trust * stake);
        if (trust >= minTrust) setCanAccessAdmin(1);
      } catch (e) {
        showErrorDialog({ message: 'Failed to retrieve trust level', note: e.message });
        setCanAccessAdmin(0);
      }
    };

    const fetchVotesCast = async () => {
      try {
        const response = await proxyRequest(`${BACKEND_BASE}/votes-cast/${genesis}`, { method: 'GET' });
        setUserVotesCast(response.data.votesCast || 0);
      } catch (e) {
        console.error('Failed to fetch number of votes cast:', e);
        setUserVotesCast(0);
      }
    };

    checkSubscriptionStatus();
    checkTrust();
    fetchVotesCast();
  }, [genesis, minTrust]); // ✅ depend on genesis, not dispatch

  const handleSubscriptionToggle = async () => {
    const email = await window.getInput('Enter your email for voting issue announcements:');
    if (!email) return;
    const agreed = await confirm({ question: 'Please confirm your subscription change' });
    if (!agreed) return;
    const endpoint = subscribed ? '/unsubscribe' : '/subscribe';
    try {
      const data = await proxyRequest(`${BACKEND_BASE}${endpoint}`, {
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
    const debugValues = { genesis, filter, sortOrder, userTrust, minTrust, subscribed };
    console.log('Updating window.myModuleDebug:', debugValues);
    window.myModuleDebug = debugValues;
  }, [genesis, filter, sortOrder, userTrust, minTrust, subscribed]);

  React.useEffect(() => {
    async function loadVotes() {
      setLoading(true);

      try {
        const response = await proxyRequest(`${BACKEND_BASE}/ledger/list/objects`, { method: 'GET' });
        const rawVotes = response.data || [];
        console.log('rawVotes: ', rawVotes);

        const validVotes = rawVotes.flatMap(vote => {
          try {
            decompressFromUTF16(vote.config); // ensure config is valid
            return [vote];
          } catch (e) {
            console.warn(`Skipping corrupt vote asset ${vote.name}:`, e);
            return [];
          }
        });
        console.log('validVotes:', validVotes);

        const counts = {};
        const voteCounts = {};
        for (const vote of validVotes) {
          try {
            const response  = await proxyRequest(`${BACKEND_BASE}/weighted-results/${vote.slug}`, { method: 'GET' });
            console.log('response: ', response);
            counts[vote.slug] = response.data.countResult;
            voteCounts[vote.slug] = response.data.totalUniqueVotes || 0;
          } catch (err) {
            console.warn(`Failed to fetch weighted vote count for ${vote.slug}`, err);
            counts[vote.slug] = {};
            vote.voteCount = voteCounts[vote.slug];
          }
        }
        for (const vote of validVotes) {
          vote.voteCount = voteCounts[vote.slug] || 0;
        }

        setVoteList(validVotes);
        setWeightedVoteCounts(counts);
      } catch (e) {
        showErrorDialog({ message: 'Failed to load votes', note: e.message });
      }

      setLoading(false);
    }

    loadVotes();
  }, [genesis]);
  
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
      <FieldSet legend='Your Voting Power' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <p>
            Your Trust Score: {(userTrust ?? 0).toLocaleString()} |{' '}
            Your Voting Weight: {(userWeight ?? 0).toLocaleString()} |{' '}
            Number of Votes You've Cast: {(userVotesCast ?? 0).toLocaleString()}
          </p>
        </div>
      </FieldSet>
      <FieldSet legend='Votes (Filtered & Sorted)' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
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
                    <div
                      key={vote.slug}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '1rem 0',
                        borderBottom: '1px solid #ccc'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{vote.title}</div>
                        <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                          <div>Created On: {new Date(vote.created_at * 1000).toLocaleDateString()}</div>
                          <div>Deadline: {new Date(vote.deadline * 1000).toLocaleDateString()}</div>
                          <div>Number of Votes Cast: {vote.voteCount?.toLocaleString() ?? '0'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
                        <Link to={`/issue/${vote.id}`}>
                          <Button style={{ width: '100%' }}>Details/Vote</Button>
                        </Link>
                        {vote.creator_genesis === genesis && (
                          <Link to={`/admin?edit=${vote.id}`}>
                            <Button style={{ width: '100%' }}>Edit</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    {vote.optionAccounts && (
                      <ul style={{ fontSize: '0.9rem' }}>
                        {vote.optionAccounts.map((opt, idx) => {
                          const label = vote.option_labels?.[idx] || `Option ${idx + 1}`;
                          const weightedCount = weightedVoteCounts?.[vote.slug]?.[opt] ?? 0;

                          return (
                            <li key={opt}>
                              <strong>{label}</strong>: {(Number(weightedCount) / 1e8).toLocaleString(undefined, { maximumFractionDigits: 2 })} weighted NXS
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <hr />
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </FieldSet>
    </Panel>
  );
}

export default VotingPageComponent;