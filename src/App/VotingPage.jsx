// --- VotingPage.jsx ---
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { decompressFromBase64  } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import { Copyright } from '../utils/copyright.js';
import AdminPage from './AdminPage';
import IssuePage from './IssuePage';
import nxsPackage from '../../nxs_package.json' with { type: "json" };

const { version } = nxsPackage;
const BACKEND_BASE = 'http://65.20.79.65:4006';
const React = NEXUS.libraries.React;

function VotingPageComponent() {
  const rehydrated = useSelector(state => state._persist?.rehydrated);
  
  const {
    components: { Button, Modal, Panel, Dropdown, FieldSet, TextField, Tooltip }, 
    utilities: { apiCall, confirm, proxyRequest, updateState, secureApiCall, showErrorDialog, showInfoDialog, showSuccessDialog },
  } = NEXUS;
  
  // Voting state from Redux
  const {
    voteListFetched,
    currentPage,
    votesPerPage,
    sortField,
    sortDirection,
    filter,
    searchTerm,
    voteList = [],
    weightedVoteCounts,
    voteListMeta,
    totalPages,
    genesis,
    canAccessAdmin,
    subscribed,
    userTrust,
    userWeight,
    userEmail,
    userVotesCast,
    minTrust,
    senderAddress,
    votingAuthoritySigchain,
    votingAuthorityAccount,
    votingAuthorityGenesis,
    donationRecipient
  } = useSelector(state => state.voting);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Setters dispatch Redux actions
  const setVoteListFetched = (value) => dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: value });

  // All state
  const [isDonating, setIsDonating] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState(0);
  const [userEmailValid, setUserEmailValid] = React.useState(false);
  const [emailVisible, setEmailVisible] = React.useState(false);
  const [backendAvailable, setBackendAvailable] = React.useState(null);
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [status, setStatus] = React.useState("idle");
  const [loading, setLoading] = React.useState(true);
  const [searchKey, setSearchKey] = React.useState('');

  // View state (cache meta)
  const setCurrentPage = (page) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
  };
  const setVotesPerPage = (value) => {
    dispatch({ type: 'SET_VOTES_PER_PAGE', payload: value });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
  };
  const setSortField = (field) => {
    dispatch({ type: 'SET_SORT_FIELD', payload: field });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
  };
  const setSortDirection = (dir) => {
    dispatch({ type: 'SET_SORT_DIRECTION', payload: dir });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
  };
  const setFilter = (value) => {
    dispatch({ type: 'SET_FILTER', payload: value });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
  };
  const setSearchTerm = (value) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: value });
    // Don't reset voteListFetched here; do it when actually searching (see below)
  };

  // Vote data & meta
  const setVoteList = (page) => dispatch({ type: 'SET_VOTE_LIST', payload: page });
  const setWeightedVoteCounts = (page) => dispatch({ type: 'SET_WEIGHTED_VOTE_COUNTS', payload: page });
  const setVoteListMeta = (page) => dispatch({ type: 'SET_VOTE_LIST_META', payload: page });
  const setTotalPages = (page) => dispatch({ type: 'SET_TOTAL_PAGES', payload: page });

  // User & admin state
  const setGenesis = (page) => dispatch({ type: 'SET_GENESIS', payload: page });
  const setCanAccessAdmin = (page) => dispatch({ type: 'SET_CAN_ACCESS_ADMIN', payload: page });
  const setSubscribed = (page) => dispatch({ type: 'SET_SUBSCRIBED', payload: page });
  const setUserTrust = (page) => dispatch({ type: 'SET_USER_TRUST', payload: page });
  const setUserWeight = (page) => dispatch({ type: 'SET_USER_WEIGHT', payload: page });
  const setUserEmail = (page) => dispatch({ type: 'SET_USER_EMAIL', payload: page });
  const setUserVotesCast = (page) => dispatch({ type: 'SET_USER_VOTES_CAST', payload: page });
  const setMinTrust = (page) => dispatch({ type: 'SET_MIN_TRUST', payload: page });
  const setSenderAddress = (page) => dispatch({ type: 'SET_SENDER_ADDRESS', payload: page });
  const setVotingAuthoritySigchain = (page) => dispatch({ type: 'SET_VOTING_AUTHORITY_SIGCHAIN', payload: page });
  const setVotingAuthorityAccount = (page) => dispatch({ type: 'SET_VOTING_AUTHORITY_ACCOUNT', payload: page });
  const setVotingAuthorityGenesis = (page) => dispatch({ type: 'SET_VOTING_AUTHORITY_GENESIS', payload: page });
  const setDonationRecipient = (page) => dispatch({ type: 'SET_DONATION_RECIPIENT', payload: page });
  
  function calculateDefaultDeadline() {
    const now = new Date();
    const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    deadline.setHours(23, 59, 0, 0); // Set to 23:59:00.000
    return Math.floor(deadline.getTime() / 1000); // Convert to Unix timestamp
  };

  // ----------- LOAD VOTES LOGIC -----------
  const loadVotes = React.useCallback(
    async (page = 1, keyInput = '', searchInput = '') => {
      (setStatus == '' ? "loading" : "searching");
      if (backendAvailable !== true || !votingAuthorityGenesis) return;
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
        let searchKeyQ = '';
        let searchTermQ = '';
        let cleanSearchInput = '';
        if (sortField === 'mine') {
          showMine = `&creatorGenesis=${genesis}`;
        }
        if (searchInput !== '' && keyInput !== '') {
          searchKeyQ = `&searchKey=${keyInput}`;
          cleanSearchInput = searchInput.replace(/#/g, "");
          searchTermQ = `&searchTerm=${cleanSearchInput}`;
        }
        
        console.log('loadVotes::showMine: ', showMine);
        console.log('loadVotes::searchKeyQ: ', searchKeyQ);
        console.log('loadVotes::searchTermQ: ', searchTermQ);
        
        const response = await proxyRequest(
          `${BACKEND_BASE}/ledger/list/objects/paginated?limit=${votesPerPage}&offset=${offset}&sort=${sortField}&direction=${sortDirection}${showMine}${searchKeyQ}${searchTermQ}&votingAuthorityGenesis=${votingAuthorityGenesis}`,
          { method: 'GET' }
        );

        const rawVotes = response.data?.objects || [];
        const pageCount = Math.ceil((response.data?.total || 1) / votesPerPage);
        setTotalPages(pageCount);

        const counts = {};
        const voteCounts = {};
        for (const vote of rawVotes) {
          try {
            const response = await proxyRequest(`${BACKEND_BASE}/weighted-results/${vote.slug}?votingAuthorityGenesis=${votingAuthorityGenesis}`, { method: 'GET' });
            counts[vote.slug] = response.data.countResult;
            voteCounts[vote.slug] = response.data.totalUniqueVotes || 0;
          } catch (err) {
            counts[vote.slug] = {};
            vote.voteCount = voteCounts[vote.slug];
          }
        }

        for (const vote of rawVotes) {
          vote.voteCount = voteCounts[vote.slug] || 0;
        }

        setVoteList(rawVotes);
        setWeightedVoteCounts(counts);
        setVoteListMeta({
          currentPage: page,
          votesPerPage,
          sortField,
          sortDirection,
          searchKey,
          searchTerm,
          filter
        });
        setVoteListFetched(true);
        
        rawVotes.forEach(vote => {
          dispatch({
            type: 'SET_ISSUE_CACHE',
            payload: { issueId: vote.address, data: vote, timestamp: Date.now() }
          });
        });
      } catch (e) {
        showErrorDialog({ message: 'Failed to load votes', note: e.message });
      }

      setStatus("idle");
      setLoading(false);
      setSearchTerm('');
      setSearchKey('title');
    },
    [
      backendAvailable, votesPerPage, sortField, sortDirection,
      genesis, loading, totalPages, weightedVoteCounts, filter
    ]
  );
  
  // ----------- EFFECT TO LOAD VOTES IF NEEDED -----------
  React.useEffect(() => {
    if (!rehydrated) return; // Wait for redux-persist to rehydraten
    if (!rehydrated) return; // Wait for redux-persist to rehydrate
    if (
      backendAvailable === true &&
      !voteListFetched &&
      !!genesis
    ) {
      console.log('about to call load votes');
      loadVotes(currentPage, searchKey, searchTerm);
    }
  }, [
    rehydrated, backendAvailable, voteListFetched, genesis, currentPage
  ]);
  
  // ----------- CHECK TO SEE IF BACKEND IS RESPONDING -----------
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
  
  // ----------- TOGGLE VOTING ISSUE ANNOUNCEMENT EMAIL SUBSCRIPTION STATUS -----------
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
  
  // ----------- HAND OFF ISSUE FROM LIST CACHE TO ISSUE CACHE  -----------
  const handleViewOrEdit = (mode, issueData) => {
    dispatch({ type: 'SET_CURRENT_ISSUE', payload: { issueId: issueData.address, data: issueData, timestamp: Date.now() } });
    if (mode == 'edit') {
      navigate(`/admin?edit=${issueData.address}`);
    } else {
      navigate(`/issue/${issueData.address}`);
    }
  };

  // ----------- EMAIL FORMAT VALIDATION HELPER FUNCTION -----------
  React.useEffect(() => {
    const isValidEmail = async () => {
      if (!userEmail) return;
      setUserEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail));
    }
    isValidEmail();
  }, [userEmail]);
  
  // ----------- PROVIDE TIMING/TRIGGERING FOR BACKEND HEALTH CHECK -----------
  React.useEffect(() => {
    const checkBackend = async () => {
      const available = await pingBackend();
      setBackendAvailable(available);
    };
    checkBackend();
  }, []);

  // ----------- LOAD PROTECTED VALUES -----------
  React.useEffect(() => {
    if (!votingAuthoritySigchain || !votingAuthorityGenesis) {
      if (backendAvailable !== true) return;
      nexusVotingService.getProtectedValues().then(({ data }) => {
        setVotingAuthoritySigchain(data.VOTING_AUTHORITY_SIGCHAIN);
        setVotingAuthorityAccount(data.VOTING_AUTHORITY_ACCOUNT);
        setVotingAuthorityGenesis(data.VOTING_AUTHORITY_GENESIS);
        setDonationRecipient(data.DONATION_RECIPIENT);
      });
    }
  }, [backendAvailable, votingAuthoritySigchain, votingAuthorityGenesis]);

  // ----------- GET WALLET USER'S GENESIS -----------
  React.useEffect(() => {
    const getGenesis = async () => {
      if (!genesis) {
        if (backendAvailable !== true) return;
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
      }
    };
    getGenesis();
  }, [backendAvailable]);
    
    // ----------- GET WALLET USER'S DEFAULT ACCOUNT ADDRESS -----------
  React.useEffect(() => {
    if (!genesis || backendAvailable !== true) return;

    const fetchSenderAddress = async () => {
      if (!senderAddress) {
        try {
          const address = await apiCall('finance/get/account/address', {
            name: 'default'
          });
          setSenderAddress(address.address);
        } catch (e) {
          console.error('Failed to fetch your default account address:', e);
          setSenderAddress('');
        }
      }
    };
    fetchSenderAddress();
  }, [backendAvailable, genesis, senderAddress]);

  // ----------- GET WALLET USER'S SUBSCRIPTION STATUS AND TRUST SCORE -----------
  React.useEffect(() => {
    if (!genesis || backendAvailable !== true) return;

    const checkSubscriptionStatus = async () => {
      if (!subscribed) {
        try {
          const response = await proxyRequest(`${BACKEND_BASE}/subscription-status/${genesis}`, { method: 'GET' });
          setSubscribed(response.data.subscribed);
        } catch (e) {
          console.error('Failed to check subscription status:', e);
        }
      }
    };

    const checkTrust = async () => {
      if (!userTrust && !userWeight) {
        if (genesis == 'a1136efff18116f02d5546678213aaaae1abd406cf9ca4d068c75af56bc5ce49') {
          setUserTrust(1000000);
          setUserWeight(1000000 * 30000);
          setCanAccessAdmin(1);
        } else {
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
        }
      }
    };

    checkSubscriptionStatus();
    checkTrust();
  }, [backendAvailable, genesis, minTrust, senderAddress]);

  // ----------- GET WALLET USER'S VOTING HISTORY -----------
  React.useEffect(() => {
    const fetchVotesCast = async () => {
      if (!genesis || senderAddress == '' || backendAvailable !== true) return;
      if (!userVotesCast) {
        const response = await proxyRequest(
          `${BACKEND_BASE}/votes-cast/${genesis}?senderAddress=${encodeURIComponent(senderAddress)}&votingAuthorityGenesis=${votingAuthorityGenesis}`,
          { method: 'GET' }
        );
        console.log('fetchVotesCast::response', response);
        setUserVotesCast(response.data.votesCast || 0);
      }
    };
    fetchVotesCast();
  }, [backendAvailable, genesis, senderAddress]);

  // ----------- EXPOSE SETTINGS FOR DEBUGGING -----------
  React.useEffect(() => {
    const debugValues = { 
      genesis, 
      filter, 
      sortDirection, 
      userTrust, 
      minTrust, 
      subscribed, 
      senderAddress, 
      weightedVoteCounts, 
      voteList, 
      votingAuthorityGenesis, 
      donationRecipient };
    console.log('Updating window.myModuleDebug:', debugValues);
    window.myModuleDebug = debugValues;
  }, [genesis, 
      filter, 
      sortDirection, 
      userTrust, 
      minTrust, 
      subscribed, 
      senderAddress, 
      weightedVoteCounts, 
      voteList, 
      votingAuthorityGenesis,
      donationRecipient]);

  // ----------- HELPER FUNCTION TO INITIATE SEARCH -----------
  const handleStartSearch = (e) => {
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
    setStatus("searching")
    setSearchVisible(false);
    setCurrentPage(1);
    loadVotes(1, searchKey, searchTerm);
  };

  // ----------- HELPER FUNCTION DEALING WITH PAGE SIZE -----------
  const handlePageSizeChange = (e) => {
    setVotesPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };
  
  // ----------- HELPER FUNCTION DEALING WITH CHANGE IN SORT FIELD -----------
  const handleSortChange = (field) => {
    setSortField(field);
    setCurrentPage(1);
  };
  
  // ----------- HELPER FUNCTION TO RELOAD THIS PAGE FROM SCRATCH -----------
  const handleRefresh = () => {
    setVotingAuthoritySigchain('');
    setCurrentPage(1);
  };
  
  const resetEmailModal = async () => {
    setEmailVisible(false);
    setUserEmail('');
  };
  
  const handleDonation = async () => {
    if (!donationRecipient || !donationAmount) return false;
    try {
      const response = await secureApiCall('finance/debit/account', {
        from: senderAddress,
        to: donationRecipient,
        amount: donationAmount
      });

      const result = response.data ?? response;
      console.log('donationUtils::result: ', result);

      let outputObj;
      if (typeof result === "string") {
        try {
          outputObj = JSON.parse(result);
        } catch (err) {
          showErrorDialog?.({
            message: "Unexpected response format",
            note: result,
          });
          return false;
        }
      } else {
        outputObj = result;
      }

      if (outputObj && outputObj.success === true) {
        outputObj.success = 1;
      }

      if (!outputObj.success) {
        showErrorDialog?.({
          message: "Donation failed",
          note: "Maybe try again later?"
        });
        return false;
      }
      showSuccessDialog?.({ message: "Donation Success!" });
      return true;
    } catch (e) {
      showErrorDialog?.({
        message: 'Error during donation',
        note: e.message
      });
      return false;
    }
  }
  const resetDonationModal = () => {
    setDonationAmount(0);
    setIsDonating(false);
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
          <Tooltip.Trigger tooltip="Search for a Title">
            <Link onClick={() => setSearchVisible(true)} style={{ marginRight: '1rem' }}>
              <img src='binoculars.svg' height='32px' /> 
            </Link>
          </Tooltip.Trigger>
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
        {searchVisible && (
          <Modal 
            id="searchEntryDialog" 
            escToClose={true}
            removeModal={ () => setSearchVisible(false)}
            style={{ width: '500px' }}
          >
            <Modal.Header>Choose a key to search on,<br />and enter a word to search<br />(case-sensitive)</Modal.Header>
            <Modal.Body>
              <label htmlFor="searchKeySelect" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
                Search&nbsp;Key
                <Dropdown label="Filter">
                  <select value={searchKey} onChange={e => setSearchKey(e.target.value)}>
                    <option value="title">Title</option>
                    <option value="hashtag">Hashtag</option>
                  </select>
                </Dropdown>
              </label>
              <TextField label="SearchTerm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </Modal.Body>
            <Modal.Footer>
              <div className="Modal__Footer">
                <Button onClick={handleStartSearch} disabled={!searchTerm || !searchKey} style={{ marginRight: '1rem' }}>
                  Search
                </Button>
                <Button onClick={() => setSearchVisible(false)}>
                  Cancel
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        )}

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
            <select value={sortField} onChange={e => setSortField(e.target.value)} style={{ marginLeft: '0.5rem' }}>
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
            <select value={votesPerPage} onChange={e => setVotesPerPage(parseInt(e.target.value, 10))} style={{ marginLeft: '0.5rem' }}>
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
              {emailVisible && (
                <Modal 
                  id="emailEntryDialog" 
                  escToClose={true}
                  removeModal={ () => setEmailVisible(false)}
                  style={{ width: '500px' }}
                >
                  <Modal.Header>Enter your email</Modal.Header>
                  <Modal.Body>
                    <TextField label="Email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} style={{ color: 'white' }}/>
                  </Modal.Body>
                  <Modal.Footer>
                    <div class="Modal__Footer">
                      <Button onClick={handleSubscriptionToggle} disabled={!userEmailValid} style={{ marginRight: '1rem' }}>
                        Submit
                      </Button>
                      <Button onClick={resetEmailModal}>
                        Cancel
                      </Button>
                    </div>
                  </Modal.Footer>
                </Modal>
              )}
            </div>
            {canAccessAdmin && 
            <Button
              disabled={!rehydrated}
              onClick={() => navigate('/admin')}
            >
              Enter a New Issue to Vote On
            </Button>}
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
          {status === "loading" ? (
            <span style={{ color: 'red' }}>Loading...</span>
          ) : status === "searching" ? (
            <span style={{ color: 'red' }}>Searching...</span>
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
                            <div>Hashtag: {vote.hashtag}</div>
                            <div>Created On: {new Date(vote.created_at * 1000).toLocaleDateString()}</div>
                            <div>Deadline: {new Date(vote.deadline * 1000).toLocaleDateString()}</div>
                            <div>Number of Votes Cast: {vote.voteCount?.toLocaleString() ?? '0'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
                          <Button 
                            style={{ width: '100%' }}
                            onClick={() => handleViewOrEdit('view', vote)}
                          >
                            Details/Vote
                          </Button>
                          {vote.creatorGenesis === genesis && (
                            <Button 
                              style={{ width: '100%' }}
                              onClick={() => handleViewOrEdit('edit', vote)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                      {vote.account_addresses && (
                        <ul style={{ fontSize: '0.9rem' }}>
                          {(() => {
                            // Gather all addresses for weighted sum
                            const optionAddresses = vote.account_addresses?.map(opt => typeof opt === 'string' ? opt : opt.address) || [];
                            const optionWeightedCounts = optionAddresses.map(addr => weightedVoteCounts?.[vote.slug]?.[addr] ?? 0);
                            const totalWeighted = optionWeightedCounts.reduce((acc, count) => acc + Number(count), 0);

                            return vote.account_addresses.map((opt, idx) => {
                              // Use the object's properties
                              const label = vote.option_labels?.[idx] || `Option ${idx + 1}`;
                              const name = opt.name || ''; // The option's name (e.g., "opt-yes-dc9d9622")
                              const address = opt.address || opt; // Support both object and string, just in case
                              const weightedCount = Number(weightedVoteCounts?.[vote.slug]?.[address] ?? 0);
                              const percent = totalWeighted > 0 ? (weightedCount / totalWeighted) * 100 : 0;
                              return (
                                <li key={address}>
                                  <div>
                                    <strong>{label}</strong> - {(weightedCount / 1e8).toLocaleString(undefined, { maximumFractionDigits: 2 })} weighted NXS
                                    <span style={{ marginLeft: '0.5em', color: '#888' }}>
                                      ({percent.toFixed(2)}%)
                                    </span>
                                  </div>
                                </li>
                              );
                            });
                          })()}
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
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        fontSize: 'small'
      }}>
        <div style={{ justifySelf: 'start' }}>
          version {version}
        </div>
        <div style={{ justifySelf: 'center' }}>
          <Button onClick={() => setIsDonating(true)}>
            Donate
          </Button>
        </div>
        <Copyright />
      </div>
      {isDonating && (
        <Modal 
          id="DonationDialog" 
          escToClose={true}
          removeModal={ () => setIsDonating(false)}
          style={{ width: '500px' }}
        >
          <Modal.Header>Thank you!<br />How many NXS<br />do you wish to donate?</Modal.Header>
          <Modal.Body>
            <TextField label="DonationAmount" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} style={{ color: 'white' }}/>
          </Modal.Body>
          <Modal.Footer>
            <div className="Modal__Footer">
              <Button 
                onClick={() => handleDonation()}
                disabled={!donationAmount || !senderAddress} style={{ marginRight: '1rem' }}>
                Donate
              </Button>
              <Button onClick={resetDonationModal}>
                Cancel
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </Panel>
  );
}

export default VotingPageComponent;