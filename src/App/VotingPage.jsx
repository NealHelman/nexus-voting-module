// --- VotingPage.jsx ---
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { persistor } from '../store';
import { Link } from 'react-router-dom';
import { decompressFromBase64  } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import AdminPage from './AdminPage';
import IssuePage from './IssuePage';
import nxsPackage from '../../nxs_package.json';
import VotingPageStyled from './VotingPageStyled';

import {
  IconButtonBar,
  CenteredColumn,
  HorizontalFilterBar,
  HorizontalButtonBar,
  ModalFooterBar,
  StatBar,
  VoteFieldSetWrapper,
  StyledLabel,
  VoteList,
  VoteItem,
  VoteItemContainer,
  VoteItemTitle,
  VoteItemDetails,
  VoteItemButtonColumn,
  OptionList,
  OptionItem,
  StyledGridFooter,
  VersionLeft,
  DonateCenter,
  StyledModalBody,
  LoadingText,
  StyledDropdownWrapper, 
  StyledSelect,
  ModalButton,
  Strong,
  StyledTextField,
  StyledTextArea
  } from '../Styles/StyledComponents';

const { version } = nxsPackage;
const BACKEND_BASE = 'http://65.20.79.65:4006';
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const {
  libraries: {
    React,
    ReactDOM,
    emotion: { react, styled, cache },
  },
  components: { Button, Modal, Panel, Dropdown, FieldSet, TextField, Tooltip 
  }, 
  utilities: { 
    apiCall, 
    confirm, 
    proxyRequest, 
    updateState, 
    secureApiCall, 
    showErrorDialog, 
    showInfoDialog, 
    showSuccessDialog
  }
} = NEXUS;

function VotingPageComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessed = useSelector(state => state.nexus.userStatus?.accessed);
  const genesis = useSelector(state => state.nexus.userStatus?.genesis);
  
  // Voting state from Redux
  const {
    voteListFetched,
    currentPage,
    votesPerPage,
    sortField,
    sortDirection,
    filter,
    voteList = [],
    weightedVoteCounts,
    voteListMeta,
    totalPages,
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
    donationRecipient,
    namedAssetCost,
    namedAccountCost,
    fetchedAt,
    totalNumberOfVotingIssues,
    votesFieldsetLegend
  } = useSelector(state => state.voting);

  // UI state
  const [isDonating, setIsDonating] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState(0);
  const [donationSent, setDonationSent] = React.useState(false);
  const [userEmailValid, setUserEmailValid] = React.useState(false);
  const [emailVisible, setEmailVisible] = React.useState(false);
  const [backendAvailable, setBackendAvailable] = React.useState(null);
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [status, setStatus] = React.useState("idle");
  const [loading, setLoading] = React.useState(true);
  const [searchKey, setSearchKey] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Redux setters
  const setVoteListFetched = (value) => dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: value });
  const setCurrentPage = (page) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
    dispatch({ type: 'SET_FETCHED_AT', payload: null });
  };
  const setVotesPerPage = (value) => {
    dispatch({ type: 'SET_VOTES_PER_PAGE', payload: value });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
    dispatch({ type: 'SET_FETCHED_AT', payload: null });
  };
  const setSortField = (field) => {
    dispatch({ type: 'SET_SORT_FIELD', payload: field });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
    dispatch({ type: 'SET_FETCHED_AT', payload: null });
  };
  const setSortDirection = (dir) => {
    dispatch({ type: 'SET_SORT_DIRECTION', payload: dir });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
    dispatch({ type: 'SET_FETCHED_AT', payload: null });
  };
  const setFilter = (value) => {
    dispatch({ type: 'SET_FILTER', payload: value });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
    dispatch({ type: 'SET_FETCHED_AT', payload: null });
  };

  // Vote data & meta
  const setVoteList = (page) => dispatch({ type: 'SET_VOTE_LIST', payload: page });
  const setWeightedVoteCounts = (value) => dispatch({ type: 'SET_WEIGHTED_VOTE_COUNTS', payload: value });
  const setTotalNumberOfVotingIssues = (value) => dispatch({ type: 'SET_TOTAL_NUMBER_OF_VOTING_ISSUES', payload: value });
  const setVotesFieldsetLegend = (value) => dispatch({ type: 'SET_VOTES_FIELD_LEGEND', payload: value });
  const setVoteListMeta = (page) => dispatch({ type: 'SET_VOTE_LIST_META', payload: page });
  const setTotalPages = (page) => dispatch({ type: 'SET_TOTAL_PAGES', payload: page });

  // User & admin state
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
  const setNamedAssetCost = (page) => dispatch({ type: 'SET_NAMED_ASSET_COST', payload: page });
  const setNamedAccountCost = (page) => dispatch({ type: 'SET_NAMED_ACCOUNT_COST', payload: page });
  
    // ***** DEBUGGING MASSIVE BUG *****
  const entireState = useSelector(state => state);
  console.log('Full Redux State:', entireState);

  
  function calculateDefaultDeadline() {
    const now = new Date();
    const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    deadline.setHours(23, 59, 0, 0); // Set to 23:59:00.000
    return Math.floor(deadline.getTime() / 1000); // Convert to Unix timestamp
  };

  // Cache freshness check
  const isCacheFresh = React.useMemo(() => {
    return fetchedAt && (Date.now() - fetchedAt < CACHE_TIMEOUT);
  }, [fetchedAt]);
  
  // Determine if this is the first module load since wallet started/user logged in
  React.useEffect(() => {
      if (!accessed) return;
      if (fetchedAt / 1000 < accessed) {
        localStorage.removeItem('persist:admin');
        localStorage.removeItem('persist:issue');
        handleRefresh();
      }
  }, [dispatch, fetchedAt]);

  // ----------- LOAD IMPORTANT INFORMATION FIRST THING (only if needed) -----------
  React.useEffect(() => {
    let cancelled = false;
    async function getImportantInfoAndVotes() {
      setStatus("loading");
      setLoading(true);

       // 1. Only load if cache is missing or stale
      if (voteList?.length && isCacheFresh) {
        setStatus("idle");
        setLoading(false);
        return;
      }

      // 2. Ping backend
      let backendOk = false;
      try {
        const { status } = await proxyRequest(`${BACKEND_BASE}/ping`, { method: 'GET' });
        backendOk = status == '200';
        setBackendAvailable(backendOk);
      } catch (err) {
        setBackendAvailable(false);
        showErrorDialog({ message: 'Backend is not responding. Please try again later.', note: err.message });
        setStatus("idle");
        setLoading(false);
        return;
      }
      if (!backendOk || cancelled) return;
          
      console.log('backend is alive...');

      // 2b. Load authority/protected values if missing
      let walletVotingAuthoritySigchain = votingAuthoritySigchain;
      let walletVotingAuthorityAccount = votingAuthorityAccount;
      let walletVotingAuthorityGenesis = votingAuthorityGenesis;
      let walletDonationRecipient = donationRecipient;
      let walletNamedAssetCost = namedAssetCost;
      let walletNamedAccountCost = namedAccountCost;
      if (!votingAuthoritySigchain || 
          !votingAuthorityAccount ||
          !votingAuthorityGenesis ||
          !donationRecipient ||
          !namedAssetCost ||
          !namedAccountCost
          ) {
        const { data } = await nexusVotingService.getProtectedValues();
        walletVotingAuthoritySigchain = data.VOTING_AUTHORITY_SIGCHAIN;
        walletVotingAuthorityAccount = data.VOTING_AUTHORITY_ACCOUNT;
        walletVotingAuthorityGenesis = data.VOTING_AUTHORITY_GENESIS;
        walletDonationRecipient = data.DONATION_RECIPIENT;
        walletNamedAssetCost = data.NAMED_ASSET_COST;
        walletNamedAccountCost = data.NAMED_ACCOUNT_COST;
        setVotingAuthoritySigchain(walletVotingAuthoritySigchain);
        setVotingAuthorityAccount(walletVotingAuthorityAccount);
        setVotingAuthorityGenesis(walletVotingAuthorityGenesis);
        setDonationRecipient(walletDonationRecipient);
        setNamedAssetCost(walletNamedAssetCost);
        setNamedAccountCost(walletNamedAccountCost);
      }
      if (cancelled) return;
      
      console.log('got VAS values');

      // 2c. Get wallet genesis if missing
      let walletGenesis = genesis;
      let walletSenderAddress = senderAddress;
      try {
        const data = await apiCall("finance/get/account/address", { name: 'default' });
        walletSenderAddress = data?.address || '';
        setSenderAddress(walletSenderAddress);
      } catch (e) {
        showErrorDialog({
          message: 'Failed to retrieve genesis',
          note: e.message
        });
        return;
      }
      if (cancelled) return;
      
      console.log('got genesis and senderAddress');

      // 5. Get user trust and weight
      try {
        // Trust and Stake
        const response = await apiCall('finance/list/trust/trust,stake,address', { name: 'trust' });
        const trust = response[0].trust || 0;
        const stake = response[0].stake || 0;
        const trustAddress = response[0].address || '';
        // Total Network Stake
        const metricsResponse = await apiCall('system/get/metrics', {});
        const totalStake = metricsResponse.trust.stake || 1;
        // Genesis Timestamp (Participation Start)
        const genesisTxResponse = await apiCall(
          'register/transactions/any/timestamp/min',
          { verbose: 'summary', 
            limit: 10000000,
            address: trustAddress,
            where: 'results.contract.OP=GENESIS OR results.contracts.OP=TRUST' }
        );
        const now = Date.now() / 1000;
        const genesisTime = genesisTxResponse.min || now;
        const participationTime = Math.max(1, Math.floor((now - genesisTime) / (60 * 60 * 24))); // days
        // Compute Voting Weight
        const x = stake / totalStake;
        const D_b = 1 / (1 + 10 * Math.exp(-x + 6));
        const W = (Math.pow(stake, 1.618) / 14.4) + stake;
        const R = W * participationTime;
        const S_b = D_b * R;

        setUserTrust(trust);
        setUserWeight(S_b);
        if (trust >= minTrust) setCanAccessAdmin(1);
      } catch (e) {
        showErrorDialog({ message: 'Failed to retrieve trust level', note: e.message });
        setCanAccessAdmin(0);
      }
      if (cancelled) return;
      
      console.log('got trust and weight');

      // 6. Get subscription status
      if (walletGenesis) {
        try {
          const response = await proxyRequest(`${BACKEND_BASE}/subscription-status/${walletGenesis}`, { method: 'GET' });
          console.log('Get subscription status::response: ', response);
          console.log("before subscription status");
          setSubscribed(response.data.subscribed);
          console.log("after subscription status");
        } catch (e) {
          console.error('Failed to check subscription status:', e);
        }
      }
      
      console.log('got subscription status');

      // 7. Get voting history (votes cast)
      if (walletGenesis && walletSenderAddress && votingAuthorityGenesis) {
        console.log('walletSenderAddress: ', walletSenderAddress);
        console.log('walletGenesis: ', walletGenesis);
        try {
          const response = await proxyRequest(
            `${BACKEND_BASE}/votes-cast/${walletGenesis}?senderAddress=${walletSenderAddress}&votingAuthorityGenesis=${votingAuthorityGenesis}`,
            { method: 'GET' }
          );

          const newTotal = response.data.totalNumberOfVotingIssues || 0;
          dispatch({ type: 'SET_USER_VOTES_CAST', payload: response.data.votesCast || 0 });
          dispatch({ type: 'SET_TOTAL_NUMBER_OF_VOTING_ISSUES', payload: newTotal });

          let display = '';
          const startIdx = (currentPage - 1) * votesPerPage;
          const issuesThisPage = Math.min(votesPerPage, Math.max(0, newTotal - startIdx)); // avoids negative

          const output = `Voting Issues (Filtered & Sorted) - Showing ${issuesThisPage} of ${newTotal} Total Votes`;
          setVotesFieldsetLegend(output);
          dispatch({ type: 'SET_VOTES_FIELDSET_LEGEND', payload: output }); // If you use Redux for the legend

        } catch (e) {
          showErrorDialog({ message: 'Failed to fetch voting history', note: e.message });
        }
      }
      
      // 8. Load votes from backend
      try {
        setStatus("loading");
        const offset = (currentPage - 1) * votesPerPage;
        let showMine = '';
        let searchKeyQ = '';
        let searchTermQ = '';
        let cleanSearchInput = '';
        if (sortField === 'mine') {
          showMine = `&creatorGenesis=${genesis}`;
        }
        if (searchTerm !== '' && searchKey !== '') {
          searchKeyQ = `&searchKey=${searchKey}`;
          cleanSearchInput = searchTerm.replace(/#/g, "");
          searchTermQ = `&searchTerm=${cleanSearchInput}`;
        }
        const response = await proxyRequest(
          `${BACKEND_BASE}/ledger/list/objects/paginated?limit=${votesPerPage}&offset=${offset}&status=${filter}&sort=${sortField}&direction=${sortDirection}${showMine}${searchKeyQ}${searchTermQ}&votingAuthorityGenesis=${walletVotingAuthorityGenesis}`,
          { method: 'GET' }
        );
        const rawVotes = response.data?.objects || [];
        const pageCount = Math.ceil((response.data?.total || 1) / votesPerPage);
        setTotalNumberOfVotingIssues(response.data?.total || 0);
        dispatch({ type: 'SET_TOTAL_PAGES', payload: pageCount });

        const counts = {};
        const voteCounts = {};
        for (const vote of rawVotes) {
          try {
            const response = await proxyRequest(`${BACKEND_BASE}/weighted-results/${vote.slug}?votingAuthorityGenesis=${walletVotingAuthorityGenesis}`, { method: 'GET' });
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
        dispatch({ type: 'SET_VOTE_LIST', payload: rawVotes });
        dispatch({ type: 'SET_WEIGHTED_VOTE_COUNTS', payload: counts });
        dispatch({
          type: 'SET_VOTE_LIST_META',
          payload: {
            currentPage,
            votesPerPage,
            sortField,
            sortDirection,
            searchKey,
            searchTerm,
            filter,
          },
        });
        dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: true });
        dispatch({ type: 'SET_FETCHED_AT', payload: Date.now() });
      } catch (e) {
        showErrorDialog({ message: 'Failed to load votes', note: e.message });
      }
      
      setStatus("idle");
      setLoading(false);
    }

    getImportantInfoAndVotes();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [
    currentPage,
    votesPerPage,
    sortField,
    sortDirection,
    filter,
    // dependencies that could invalidate cache
    isCacheFresh,
  ]);
  
/*   React.useEffect(() => {
    console.log('Full Redux state:', reduxState);
  }, [reduxState]);
 */  
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
  
  // ----------- EXPOSE SETTINGS FOR DEBUGGING -----------
  React.useEffect(() => {
    const debugValues = {
      backendAvailable,
      genesis,
      filter,
      sortDirection,
      userTrust,
      minTrust,
      subscribed,
      senderAddress,
      namedAccountCost,
      namedAssetCost,
      weightedVoteCounts,
      voteList,
      votingAuthorityGenesis,
      donationRecipient,
      userVotesCast,
      totalNumberOfVotingIssues,
      fetchedAt,
      isCacheFresh,
    };
    window.myModuleDebug = debugValues;
  }, [
    backendAvailable,
    genesis,
    filter,
    sortDirection,
    userTrust,
    minTrust,
    subscribed,
    senderAddress,
    namedAccountCost,
    namedAssetCost,
    weightedVoteCounts,
    voteList,
    votingAuthorityGenesis,
    donationRecipient,
    userVotesCast,
    totalNumberOfVotingIssues,
    fetchedAt,
    isCacheFresh,
  ]);

  // ----------- Refresh Handler: force cache invalidation -----------
  const handleRefresh = () => {
    dispatch({ type: 'SET_FETCHED_AT', payload: null });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
    setStatus("loading");
    setLoading(true);
  };

  // ----------- Search Handler -----------
  const handleStartSearch = (e) => {
    setStatus("searching");
    setSearchVisible(false);
    setCurrentPage(1);
    dispatch({ type: 'SET_FETCHED_AT', payload: null });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });
  };
  
  const handleSwitchPage = (e) => {
    console.log('setting page to ', e);
    setCurrentPage(e);
    dispatch({ type: 'SET_FETCHED_AT', payload: null });
    dispatch({ type: 'SET_VOTE_LIST_FETCHED', payload: false });

    let el = null;
    setTimeout(() => {
      el = document.getElementById('top');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100); // slight delay to ensure render
  };

  const resetEmailModal = async () => {
    setEmailVisible(false);
    setUserEmail('');
  };
  
  const handleDonation = async () => {
    if (!donationRecipient || !donationAmount) return false;
    setDonationSent(true);
    try {
      const response = await secureApiCall('finance/debit/account', {
        from: senderAddress,
        to: donationRecipient,
        amount: donationAmount
      });

      resetDonationModal();
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
  
   function openSearchModal() {
    setSearchKey('title');     // default dropdown value
    setSearchTerm('');         // clear search field
    setSearchVisible(true);    // show modal
  }

  function closeSearchModal() {
    setSearchVisible(false);   // hide modal
    setSearchKey('');          // clear dropdown
    setSearchTerm('');         // clear search field
  }
  
  return (
    <VotingPageStyled
      voteList={voteList}
      weightedVoteCounts={weightedVoteCounts}
      userTrust={userTrust}
      userWeight={userWeight}
      userVotesCast={userVotesCast}
      currentPage={currentPage}
      totalPages={totalPages}
      filter={filter}
      sortField={sortField}
      sortDirection={sortDirection}
      votesPerPage={votesPerPage}
      subscribed={subscribed}
      canAccessAdmin={canAccessAdmin}
      handleViewOrEdit={handleViewOrEdit}
      handleRefresh={handleRefresh}
      setCurrentPage={setCurrentPage}
      setFilter={setFilter}
      setSortField={setSortField}
      setSortDirection={setSortDirection}
      setVotesPerPage={setVotesPerPage}
      setEmailVisible={setEmailVisible}
      setSearchVisible={setSearchVisible}
      emailVisible={emailVisible}
      searchVisible={searchVisible}
      isDonating={isDonating}
      setIsDonating={setIsDonating}
      donationSent={donationSent}
      setDonationSent={setDonationSent}
      userEmail={userEmail}
      setUserEmail={setUserEmail}
      handleSubscriptionToggle={handleSubscriptionToggle}
      userEmailValid={userEmailValid}
      resetEmailModal={resetEmailModal}
      donationAmount={donationAmount}
      setDonationAmount={setDonationAmount}
      senderAddress={senderAddress}
      handleDonation={handleDonation}
      resetDonationModal={resetDonationModal}
      status={status}
      votesFieldsetLegend={votesFieldsetLegend}
      searchKey={searchKey}
      setSearchKey={setSearchKey}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      version={version}
      handleStartSearch={handleStartSearch}
      openSearchModal={openSearchModal}
      closeSearchModal={closeSearchModal}      
      handleSwitchPage={handleSwitchPage}
    />
  );
}

export default VotingPageComponent;