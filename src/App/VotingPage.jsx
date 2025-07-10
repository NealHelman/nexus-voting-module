// --- VotingPage.jsx ---
import { useDispatch, useSelector } from 'react-redux';
import { proxyRequest } from 'nexus-module';
import { Link } from 'react-router-dom';
import { decompressFromBase64  } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import { copyright } from '../utils/copyright.js';
import AdminPage from './AdminPage';
import IssuePage from './IssuePage';
import nxsPackage from '../../nxs_package.json' with { type: "json" };

const { version } = nxsPackage;
const BACKEND_BASE = 'http://65.20.79.65:4006';
const React = NEXUS.libraries.React;

function VotingPageComponent() {
  const {
    components: { Button, Panel, Dropdown, FieldSet, TextField, Tooltip },
    utilities: { apiCall, confirm, showErrorDialog, showSuccessDialog },
  } = NEXUS;
  
  const [filter, setFilter] = React.useState('active');
  const dispatch = useDispatch();
  const [genesis, setGenesis] = React.useState('');
  const [canAccessAdmin, setCanAccessAdmin] = React.useState(0);
  const [subscribed, setSubscribed] = React.useState(1);
  const [userTrust, setUserTrust] = React.useState(0);
  const [userWeight, setUserWeight] = React.useState(0);
  const [userEmail, setUserEmail] = React.useState('');
  const [userEmailValid, setUserEmailValid] = React.useState(false);
  const [emailVisible, setEmailVisible] = React.useState(false);
  const [userVotesCast, setUserVotesCast] = React.useState(0);
  const [weightedVoteCounts, setWeightedVoteCounts] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [voteList, setVoteList] = React.useState([]);
  const [minTrust, setMinTrust] = React.useState(0);
  const [senderAddress, setSenderAddress] = React.useState('');
  const [votingAuthoritySigchain, setVotingAuthoritySigchain] = React.useState('');
  const [votingAuthorityAccount, setVotingAuthorityAccount] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [votesPerPage, setVotesPerPage] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(1);
  const [sortField, setSortField] = React.useState('created');
  const [sortDirection, setSortDirection] = React.useState('desc');
  const [backendAvailable, setBackendAvailable] = React.useState(null);
  
  const pingBackend = async () => {
    try {
      const response = await fetch(`${BACKEND_BASE}/ping`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (err) {
      showErrorDialog({ message: 'Backend is not responding. Please try again later.' });
      setLoading(false);
      return false;
    }
  };
  
  const handleSubscriptionToggle = async () => {
    if (!userEmail || !genesis || backendAvailable !== true) return;
    const labelYes = subscribed ? 'Unsubscribe' : 'Subscribe';
    const agreed = await confirm({ 
      question: 'Please confirm your subscription change',
      labelYes,
      labelNo: 'Cancel'
    });
    if (!agreed) return;
    const endpoint = subscribed ? '/unsubscribe' : '/subscribe';
    try {
      const response = await proxyRequest(`${BACKEND_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ email: userEmail, genesis: genesis })
      });
      if (!response.data.success) {
        showErrorDialog({ message: 'Failed to change your subscription' });
        return;
      } else {
        const newStatus = subscribed ? 'unsubscribed' : 'subscribed';
        showSuccessDialog({ message: 'Success', note: 'You are now ' + newStatus + ' to announcements when new voting issues are submitted.' });
      }
      
      setSubscribed(!subscribed);
    } catch (e) {
      showErrorDialog({ 
        message: 'Failed to change your subscription',
        note: e.message
      });
    } finally {
      setUserEmail('');
      setEmailVisible(false);
    }
  };

  React.useEffect(() => {
    const isValidEmail = async () => {
      if (!userEmail) return;
      setUserEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail));
    }
    isValidEmail();
  }, [userEmail]);
  
  React.useEffect(() => {
    const checkBackend = async () => {
      const available = await pingBackend();
      setBackendAvailable(available);
    };
    checkBackend();
  }, []);

  React.useEffect(() => {
    if (backendAvailable !== true) return;
    nexusVotingService.getProtectedValues().then(({ data }) => {
      setVotingAuthoritySigchain(data.VOTING_AUTHORITY_SIGCHAIN);
      setVotingAuthorityAccount(data.VOTING_AUTHORITY_ACCOUNT);
    });
  }, [backendAvailable]);

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
  }, [backendAvailable]);
    
  React.useEffect(() => {
    if (!genesis || backendAvailable !== true) return;

    const fetchSenderAddress = async () => {
      try {
        const address = await apiCall('finance/get/account/address', {
          name: 'default'
        });
        setSenderAddress(address.address);
      } catch (e) {
        console.error('Failed to fetch your default account address:', e);
        setSenderAddress('');
      }
    };
    fetchSenderAddress();
  }, [backendAvailable, genesis]);

  React.useEffect(() => {
    if (!genesis || backendAvailable !== true) return;

    const checkSubscriptionStatus = async () => {
      try {
        const response = await proxyRequest(`${BACKEND_BASE}/subscription-status/${genesis}`, { method: 'GET' });
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

    checkSubscriptionStatus();
    checkTrust();
  }, [backendAvailable, genesis, minTrust, senderAddress]);

  React.useEffect(() => {
    const fetchVotesCast = async () => {
      if (!genesis || senderAddress == '' || backendAvailable !== true) return; // wait until both are available
      const response = await proxyRequest(
        `${BACKEND_BASE}/votes-cast/${genesis}?senderAddress=${encodeURIComponent(senderAddress)}`,
        { method: 'GET' }
      );
      console.log('fetchVotesCast::response', response);
      setUserVotesCast(response.data.votesCast || 0);
    };
    fetchVotesCast();
  }, [backendAvailable, genesis, senderAddress]);

  React.useEffect(() => {
    const debugValues = { genesis, filter, sortDirection, userTrust, minTrust, subscribed, senderAddress, weightedVoteCounts };
    console.log('Updating window.myModuleDebug:', debugValues);
    window.myModuleDebug = debugValues;
  }, [genesis, filter, sortDirection, userTrust, minTrust, subscribed, senderAddress, weightedVoteCounts]);

  React.useEffect(() => {
    async function loadVotes(page = 1) {
      if (backendAvailable !== true) return;
      setLoading(true);

      const backendListening = await pingBackend();
      if (!backendListening) {
        setBackendAvailable(false);
        showErrorDialog({ message: 'Backend is not responding. Please try again later.' });
        setLoading(false);
        return;
      } else {
        setBackendAvailable(true);
      }

      try {
        const offset = (page - 1) * votesPerPage;
        let showMine = '';
        if (sortField == 'mine') {
          showMine = `&creatorGenesis=${creatorGenesis}`;
        };
        const response = await proxyRequest(
          `${BACKEND_BASE}/ledger/list/objects/paginated?limit=${votesPerPage}&offset=${offset}&sort=${sortField}&direction=${sortDirection}${showMine}`,
          { method: 'GET' }
        );

        const rawVotes = response.data?.objects || [];
        console.log('rawVotes: ', rawVotes);
        const pageCount = Math.ceil((response.data?.total || 1) / votesPerPage);
        setTotalPages(pageCount);

        const counts = {};
        const voteCounts = {};
        for (const vote of rawVotes) {
          try {
            const response  = await proxyRequest(`${BACKEND_BASE}/weighted-results/${vote.slug}`, { method: 'GET' });
            console.log('weighted-results response: ', response);
            counts[vote.slug] = response.data.countResult;
            voteCounts[vote.slug] = response.data.totalUniqueVotes || 0;
          } catch (err) {
            console.warn(`Failed to fetch weighted vote count for ${vote.slug}`, err);
            counts[vote.slug] = {};
            vote.voteCount = voteCounts[vote.slug];
          }
        }

        for (const vote of rawVotes) {
          vote.voteCount = voteCounts[vote.slug] || 0;
        }

        setVoteList(rawVotes);
        setWeightedVoteCounts(counts);
      } catch (e) {
        showErrorDialog({ message: 'Failed to load votes', note: e.message });
      }

      setLoading(false);
    }

    if (genesis) loadVotes(currentPage);
  }, [backendAvailable, genesis, currentPage, filter, votesPerPage, sortField, sortDirection]);

  const handlePageSizeChange = (e) => {
    setVotesPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const handleSortChange = (field) => {
    setSortField(field);
    setCurrentPage(1);
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };


  return (
    <Panel title="Nexus Community On-Chain Voting - Issues Available" icon={{ url: 'voting.svg', id: 'icon' }}>
      <FieldSet style={{ position: 'relative', padding: '2em 1em 1em 1em' }}>
        {/* Top-right Refresh Icon */}
        <div style={{
          position: 'absolute',
          top: '1em',
          right: '1em',
          zIndex: 2,
          cursor: 'pointer'
        }}>
          <Tooltip.Trigger tooltip="Display the User Guide">
            <Link to={`/userguide`} style={{ marginRight: '1rem' }}>
              <img src='document.svg' height='32px' /> 
            </Link>
          </Tooltip.Trigger>
          <Tooltip.Trigger tooltip="Refresh Voting List Page">
            <Link onClick={handleRefresh}>
              <img src='refresh.svg' height='32px' /> 
            </Link>
          </Tooltip.Trigger>
        </div>
        {/* Centered Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            gap: '2rem',
            marginBottom: '2em',
            justifyContent: 'center'
          }}>
            <label htmlFor="filterSelect" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
            Status&nbsp;Filter
            <Dropdown label="Filter">
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="mine">Just Mine</option>
              </select>
            </Dropdown>
            </label>
          <label htmlFor="sortBy" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
            Sort&nbsp;By
            <Dropdown label="SortBy">
            <select value={sortField} onChange={e => handleSortChange(e.target.value)} style={{ marginLeft: '0.5rem' }}>
              <option value="created">Created</option>
              <option value="title">Title</option>
              <option value="deadline">Deadline</option>
            </select>
            </Dropdown>
          </label>
          <label htmlFor="direction" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
            Sort Direction
            <Dropdown label="SortDirection">
            <select value={sortDirection} onChange={e => setSortDirection(e.target.value)} style={{ marginLeft: '0.5rem' }}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            </Dropdown>
          </label>	  
          <label htmlFor="pageSize" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
            Page Size:
            <Dropdown label="PageSize">
            <select value={votesPerPage} onChange={handlePageSizeChange} style={{ marginLeft: '0.5rem' }}>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
            </select>
            </Dropdown>
          </label>
          </div>
          <div style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center'
          }}>
            <div>
              <div>
                <Button onClick={() => setEmailVisible(true)}>
                  {subscribed ? 'Unsubscribe from Announcements' : 'Subscribe to Announcements'}
                </Button>
              </div>
              <div style={{ textAlign: 'center', display: emailVisible ? 'inline' : 'none' }}>
                <div>
                  <label htmlFor="emailTextField" style={{ marginBottom: '0.25rem' }}>Email</label>
                  <TextField label="Email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                </div>
                <div>
                  <Button onClick={handleSubscriptionToggle} disabled={!userEmailValid} style={{ marginRight: '1rem' }}>
                    Submit
                  </Button>
                  <Button onClick={() => setEmailVisible(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
            {canAccessAdmin && <Button><Link to="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>Enter a New Issue to Vote On</Link></Button>}
          </div>
        </div>
      </FieldSet>
      <FieldSet legend='Your Voting Power' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <p>
            Your Trust Score: {(userTrust ?? 0).toLocaleString()} |{' '}
            Your Voting Weight: {(Number(userWeight) / 1e8).toLocaleString(undefined, { maximumFractionDigits: 2 })} |{' '}
            Number of Votes You've Cast:
            {!userVotesCast && userVotesCast != 0 ? (
              <> <span style={{ color: 'red' }}>(loading...)</span></>
            ) : (
              <> {userVotesCast.toLocaleString()} </>
            )}
          </p>
        </div>
      </FieldSet>
      <FieldSet legend='Voting Issues (Filtered & Sorted)' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          {loading ? (
            <span style={{ color: 'red' }}>Loading...</span>
          ) : (
            (() => {
              const filteredVotes = voteList
                .filter(vote => vote.min_trust === undefined || userTrust >= vote.min_trust)
                .filter(vote => {
                  const now = Date.now() / 1000;
                  if (filter === 'active') return !vote.deadline || vote.deadline > now;
                  if (filter === 'closed') return vote.deadline && vote.deadline <= now;
                  return true;
                })

              if (filteredVotes.length === 0) {
                return <p>No voting issues to display for this filter.</p>;
              }

              return (
                <ul>
                  {filteredVotes.map((vote) => (
                    <li key={vote.address}>
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
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#00b7fa' }}>{vote.title}</div>
                          <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                            <div>Created On: {new Date(vote.created_at * 1000).toLocaleDateString()}</div>
                            <div>Deadline: {new Date(vote.deadline * 1000).toLocaleDateString()}</div>
                            <div>Number of Votes Cast: {vote.voteCount?.toLocaleString() ?? '0'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
                          <Link to={`/issue?issueId=${vote.address}`}>
                            <Button style={{ width: '100%' }}>Details/Vote</Button>
                          </Link>
                          {vote.creatorGenesis === genesis && (
                            <Link to={`/admin?edit=${vote.address}`}>
                              <Button style={{ width: '100%' }}>Edit</Button>
                            </Link>
                          )}
                        </div>
                      </div>
                      {vote.account_addresses && (
                        <ul style={{ fontSize: '0.9rem' }}>
                          {vote.account_addresses.map((opt, idx) => {
                            const label = vote.option_labels?.[idx] || `Option ${idx + 1}`;
                            const addressString = typeof opt === 'string' ? opt : opt.address;
                            const weightedCount = weightedVoteCounts?.[vote.slug]?.[addressString] ?? 0;
                            return (
                              <li key={addressString}>
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
            })()
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          {[...Array(totalPages)].map((_, idx) => (
            <Button
              key={idx + 1}
              variant={currentPage === idx + 1 ? 'filled' : 'outline'}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </Button>
          ))}
          <Button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      </FieldSet>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 'small'
      }}>
        <div>
          {/* Left-justified content here */}
          version {version}
        </div>
        <div>
          {/* Right-justified content here */}
          {copyright}
        </div>
      </div>
    </Panel>
  );
}

export default VotingPageComponent;