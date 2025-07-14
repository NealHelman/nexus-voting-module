import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { decompressFromBase64 } from 'lz-string';
import MarkdownWithZoom from "./MarkdownWithZoom";
import nexusVotingService from '../services/nexusVotingService';
import { Copyright } from '../utils/copyright.js';
import nxsPackage from '../../nxs_package.json' with { type: "json" };

const { version } = nxsPackage;
const BACKEND_BASE = 'http://65.20.79.65:4006';
const CACHE_AGE_LIMIT = 5 * 60 * 1000; // 5 minutes
const React = NEXUS.libraries.React;

function base64ToUint8Array(base64) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

function IssuePage() {
  const rehydrated = useSelector(state => state._persist?.rehydrated);
  const { currentIssue } = useSelector(state => state.issue);
  const issue = currentIssue?.data;
  console.log('[IssuePage::issue: ', issue);
  const { issueId } = useParams();

  const {
    components: { Panel, Button, Dropdown, FieldSet, Modal, TextField, Tooltip, MultilineTextField },
    utilities: { apiCall, copyToClipboard, secureApiCall, confirm, proxyRequest, showErrorDialog, showSuccessDialog, showInfoDialog },
  } = NEXUS;

  // Issue state from Redux
  const {
  issueFetched,
  issueCache = {},
  title,
  description,
  optionLabels = ['', ''],
  optionAddresses = [],
  minTrust,
  voteFinality,
  organizerName,
  organizerEmail,
  organizerTelegram,
  hashtag,
  deadline,
  summaryPro,
  summaryCon,
  possibleOutcomes,
  supportingDocs = [],
  createdBy,
  createdAt,
  userGenesis,
  creatorGenesis,
  jsonGuid,
  analysisGuid,
  senderAddress,
  userTrust,
  userWeight,
  userHasEnoughTrustToVote,
  userIneligibleToVote,
  userCurrentlyVotedOn,
  userVotesCastOverall,
  votingOver,
  optionVotedOn,
  votingAuthoritySigchain,
  votingAuthorityAccount,
  votingAuthorityGenesis,
  donationRecipient
} = useSelector(state => state.issue);

  const dispatch = useDispatch();

  // Flags and Miscellaneous
  const [isDonating, setIsDonating] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [docsContent, setDocsContent] = React.useState([]);
  const [voteCost, setVoteCost] = React.useState(0.000001);
  const [openDocs, setOpenDocs] = React.useState([]);

  // User & issue state
  const issueCacheEntry = useSelector(state => state.issue.issuesCache?.[issueId] || null);
  const setIssueFetched = (value) => dispatch({ type: 'SET_ISSUE_FETCHED', payload: value });
  const setTitle = (value) => dispatch({ type: 'SET_TITLE', payload: value });
  const setDescription = (value) => dispatch({ type: 'SET_DESCRIPTION', payload: value });
  const setOptionLabels = (value) => dispatch({ type: 'SET_OPTION_LABELS', payload: value });
  const setOptionAddresses = (value) => dispatch({ type: 'SET_OPTION_ADDRESSES', payload: value });
  const setMinTrust = (value) => dispatch({ type: 'SET_MIN_TRUST', payload: value });
  const setVoteFinality = (value) => dispatch({ type: 'SET_VOTE_FINALITY', payload: value });
  const setOrganizerName = (value) => dispatch({ type: 'SET_ORGANIZER_NAME', payload: value });
  const setOrganizerEmail = (value) => dispatch({ type: 'SET_ORGANIZER_EMAIL', payload: value });
  const setOrganizerTelegram = (value) => dispatch({ type: 'SET_ORGANIZER_TELEGRAM', payload: value });
  const setHashtag = (value) => dispatch({ type: 'SET_HASHTAG', payload: value });
  const setDeadline = (value) => dispatch({ type: 'SET_DEADLINE', payload: value });
  const setSummaryPro = (value) => dispatch({ type: 'SET_SUMMARY_PRO', payload: value });
  const setSummaryCon = (value) => dispatch({ type: 'SET_SUMMARY_CON', payload: value });
  const setPossibleOutcomes = (value) => dispatch({ type: 'SET_POSSIBLE_OUTCOMES', payload: value });
  const setSupportingDocs = (value) => dispatch({ type: 'SET_SUPPORTING_DOCS', payload: value });
  const setCreatedBy = (value) => dispatch({ type: 'SET_CREATED_BY', payload: value });
  const setCreatedAt = (value) => dispatch({ type: 'SET_CREATED_AT', payload: value });
  const setCreatorGenesis = (value) => dispatch({ type: 'SET_CREATOR_GENESIS', payload: value });
  const setUserGenesis = (value) => dispatch({ type: 'SET_USER_GENESIS', payload: value });
  const setJsonGuid = (value) => dispatch({ type: 'SET_JSON_GUID', payload: value });
  const setAnalysisGuid = (value) => dispatch({ type: 'SET_ANALYSIS_GUID', payload: value });
  const setSenderAddress = (value) => dispatch({ type: 'SET_SENDER_ADDRESS', payload: value });
  const setUserTrust = (value) => dispatch({ type: 'SET_USER_TRUST', payload: value });
  const setUserWeight = (value) => dispatch({ type: 'SET_USER_WEIGHT', payload: value });
  const setUserHasEnoughTrustToVote = (value) => dispatch({ type: 'SET_USER_HAS_ENOUGH_TRUST_TO_VOTE', payload: value });
  const setUserIneligibleToVote = (value) => dispatch({ type: 'SET_USER_INELGIBLE_TO_VOTE', payload: value });
  const setUserCurrentlyVotedOn = (value) => dispatch({ type: 'SET_USER_CURRENTLY_VOTED_ON', payload: value });
  const setUserVotesCastOverall = (value) => dispatch({ type: 'SET_USER_VOTES_CAST_OVERALL', payload: value });
  const setVotingOver = (value) => dispatch({ type: 'SET_VOTING_OVER', payload: value });
  const setOptionVotedOn = (value) => dispatch({ type: 'SET_OPTION_VOTED_ON', payload: value });
  const setVotingAuthoritySigchain = (value) => dispatch({ type: 'SET_VOTING_AUTHORITY_SIGCHAIN', payload: value });
  const setVotingAuthorityAccount = (value) => dispatch({ type: 'SET_VOTING_AUTHORITY_ACCOUNT', payload: value });
  const setVotingAuthorityGenesis = (value) => dispatch({ type: 'SET_VOTING_AUTHORITY_GENESIS', payload: value });
  const setDonationRecipient = (page) => dispatch({ type: 'SET_DONATION_RECIPIENT', payload: page });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const issueIdFromParam = searchParams.get('edit');

  React.useEffect(() => {
    if (issueIdFromParam) {
      setIssueId(issueIdFromParam);
    }
  }, [issueIdFromParam]);
  
  const panelTitle = "Nexus Community On-Chain Voting - Issue Details & Voting"

  function base64ToBlob(base64, mimeType='application/octet-stream') {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
  }
  
  function handleDownload(name, base64) {
    const blob = base64ToBlob(base64, getMimeTypeFromName(name));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function getMimeTypeFromName(name) {
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.doc')) return 'application/msword';
    if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    // add more as needed
    return 'application/octet-stream';
  }

  // ---------- SET FORM MODE PROPERLY FOR BOTH ENTRY PATHS ----------
  React.useEffect(() => {
    if (!rehydrated || !issueId) return;

    if (
      issueCacheEntry  &&
      (Date.now() - issueCacheEntry .timestamp < CACHE_AGE_LIMIT)
    ) {
      // Use cache
      dispatch({ type: 'SET_ISSUE', payload: issueCacheEntry .data });
      dispatch({ type: 'SET_ISSUE_FETCHED', payload: true });
    } else if (!issueCacheEntry || !issueFetched) {
      // Only fetch if not already fetched/cached
      fetchIssue(issueId).then(issueData => {
        dispatch({ type: 'SET_ISSUE', payload: issueData });
        dispatch({ type: 'SET_ISSUE_CACHE', payload: { issueId, data: issueData, timestamp: Date.now() } });
        dispatch({ type: 'SET_ISSUE_FETCHED', payload: true });
      });
    }
  }, [rehydrated, issueId, issueCacheEntry]);

  React.useEffect(() => {
    nexusVotingService.getProtectedValues().then(({ data }) => {
      setVotingAuthoritySigchain(data.VOTING_AUTHORITY_SIGCHAIN);
      setVotingAuthorityAccount(data.VOTING_AUTHORITY_ACCOUNT);
      setVotingAuthorityGenesis(data.VOTING_AUTHORITY_GENESIS);
    });
  }, []);

  React.useEffect(() => {
    const getGenesis = async () => {
      try {
        const data = await apiCall("finance/get/account/owner", { name: 'default' });
        setUserGenesis(data?.owner || '');
      } catch (e) {
        showErrorDialog({
          message: 'Failed to retrieve genesis',
          note: e.message
        });
      }
    };
    getGenesis();
  }, [dispatch, rehydrated]);
  
  React.useEffect(() => {
    if (!userGenesis) return;
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
  }, [userGenesis]);

  React.useEffect(() => {
    if (!userGenesis) return;

    const checkTrust = async () => {
      try {
        const response = await apiCall('finance/list/trust/trust,stake', { name: 'trust' });
        console.log('checkTrust response: ', response);
        const trust = response?.[0]?.trust || 0;
        const stake = response?.[0]?.stake || 0;
        setUserTrust(trust);
        setUserWeight(trust * stake);
      } catch (e) {
        showErrorDialog({ message: 'Failed to retrieve trust level', note: e.message });
      }
    };

    const fetchVotesCastOverall = async () => {
      if (!userGenesis || !senderAddress) return; // wait until both are available
      const response = await proxyRequest(
        `${BACKEND_BASE}/votes-cast/${userGenesis}?senderAddress=${encodeURIComponent(senderAddress)}&votingAuthorityGenesis=${votingAuthorityGenesis}`,
        { method: 'GET' }
      );
      setUserVotesCastOverall(response.data.votesCast || 0);
    };

    checkTrust();
    fetchVotesCastOverall();
  }, [userGenesis, senderAddress]);

  React.useEffect(() => {
    const debugValues = { userGenesis, userTrust, senderAddress, issue};
    console.log('Updating window.myModuleDebug:', debugValues);
    window.myModuleDebug = debugValues;
  }, [userGenesis, userTrust, senderAddress, issue]);

  // Fetch the voting issue metadata
  const fetchIssue = React.useCallback(
    async () => {
      if (!issue) return;
      setLoading(true);
      setError('');
      try {
        if (currentIssue) {
          setIssue(currentIssue);
        } else {
          const response = await proxyRequest(
            `${BACKEND_BASE}/ledger/object?issueId=${issueId}`,
            { method: 'GET' }
          );
        }
        console.log('fetchIssue::response: ', response);
        setIssue(response.data);

        const issueInfoGuid = response.data.issueInfo;
        setJsonGuid(issueInfoGuid || null);
      } catch (e) {
        setError('Failed to load voting issue: ' + (e.message || e.toString()));
      }
      setLoading(false);
    },
  [currentIssue, issueId]);
  
  React.useEffect(() => {
    const canUserVote = async () => {
      setUserHasEnoughTrustToVote(userTrust < issue.minTrust ? false : true);
      const date = new Date();
      const timestamp = date.getTime();
      setVotingOver((timestamp / 1000) > issue.deadline ? true : false);
    }
    if (issue) canUserVote();
  }, [issue, userTrust]);

  React.useEffect(() => {
    setOptionAddresses([]);
    setOptionVotedOn(null);
    setUserIneligibleToVote(false);
    setUserCurrentlyVotedOn ('');
  }, [issue]);
  
  React.useEffect(() => {
    const fetchVotingDetails = async () => {
      if (!issue?.account_addresses?.length) return;
      const addresses = [];
      let votedOn = null;
      let ineligible = false;

      for (const {name, address} of issue.account_addresses) {
        addresses.push(address);

        // Did the user vote for this option
        try {
          const result = await apiCall('finance/transactions/account/timestamp/count', {
            verbose: 'summary',
            name: 'default',
            where: `results.contracts.OP=DEBIT AND results.contracts.to.address=${address} AND results.contracts.amount=0.000001`
          });
          if (result.count > 0) {
            votedOn = address;
            setUserCurrentlyVotedOn (address);
            if (issue.vote_finality === 'one_time') ineligible = true;
          }
        } catch (e) {
          showErrorDialog({
            message: 'Unable to get voting option account transaction count',
            note: e.message
          });
          return;
        }
      }
      setOptionAddresses(addresses);
      setOptionVotedOn(votedOn);
      setUserIneligibleToVote(ineligible);
    };
    if (issue) fetchVotingDetails();
  }, [issue, votingAuthoritySigchain]);

  // Fetch supporting docs from backend and decode
  React.useEffect(() => {
    console.log('issue: ', issue);
    async function decodeDocs() {
      if (!issue?.supporting_docs?.length) return;

      //'md', 'markdown', 'txt', 'pdf', 'doc', 'docx', 'ppt', 'pptx'
      const docs = [];
      for (const doc of issue.supporting_docs) {
        try {
          let content, type = '';
          // Try to determine type from name or magic
          if (doc.type == 'text/markdown') {
            content = atob(doc.base64);
            type = 'markdown';
          } else if (doc.type == 'text/plain') {
            content = atob(doc.base64);
            type = 'text';
          } else if (doc.type == 'application/pdf') {
            content = atob(doc.base64);
            type = 'pdf';
          } else if (doc.type == 'application/msword' || doc.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            content = atob(doc.base64);
            type = 'word';
          } else if (doc.type == 'application/vnd.ms-powerpoint' || doc.type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            content = atob(doc.base64);
            type = 'powerpoint';
          } else {
            // fallback: offer download
            content = atob(doc.base64);
            type = 'unknown';
          }
          docs[doc.guid] = { guid: doc.guid, name: doc.name, content: content, type: type, base64: doc.base64 };
          console.log('docs[doc.guid]: ', docs[doc.guid]);
        } catch (e) {
          docs[doc.guid] = { error: 'Failed to load or decode document.' };
          showErrorDialog({ message: 'Failed to load or decode document.', note: e.message });
        }
      }
      setDocsContent(docs);
    }
    if (issue) decodeDocs();
  }, [issue]);
  
  // Cast Vote //
  const handleVote = async (address) => {
    let txidString = '';
    try {
      const response = await secureApiCall('finance/debit/account', {
        from: senderAddress,
        to: address,
        amount: voteCost,
        reference: userWeight
      })
      const result = response.data ?? response;

      // If result is a string, parse and patch
      let outputObj;
      if (typeof result === "string") {
        try {
          outputObj = JSON.parse(result);
        } catch (err) {
          showErrorDialog({
            message: "Unexpected response format",
            note: result,
          });
          return;
        }
      } else {
        outputObj = result;
      }

       // Normalize success to 1 if it's boolean true
      if (outputObj && outputObj.success === true) {
        outputObj.success = 1;
      }
      
      if (!outputObj.success) {
        showErrorDialog({
          message: 'Failed',
          note: `Your attempt to vote failed - err: ${err.message}`
        });
        return;
      }
      
     showSuccessDialog({ 
        message: 'Success!',
        note: 'You voted!'
      });
      setOptionVotedOn(address);
      txidString = result.txid?.toString?.() ?? '';
      console.log('voting txidString: ', txidString);

    } catch (e) {
      showErrorDialog({
        message: 'Error during donation',
        note: e.message
      });
      return;
    }
  };
  
  const toggleDoc = (guid) => {
    setOpenDocs((prev) => ({
      ...prev,
      [guid]: !prev[guid],
    }));
  };

  const handleReturnToVotingPageClick = (e) => {
    e.preventDefault(); // Prevent default link behavior if needed
    navigate("/voting");
  };

  // ----------- SEND DONATION TO MODULE AUTHOR -----------
  const handleDonation = async () => {
    if (!donationRecipient || !donationAmount) return;
    try {
      const response = await secureApiCall('finance/debit/account', {
        from: senderAddress.address,
        to: donationRecipient,
        amount: donationAmount
        }
      );

      const result = response.data ?? response;

      // If result is a string, parse and patch
      let outputObj;
      if (typeof result === "string") {
        try {
          outputObj = JSON.parse(result);
        } catch (err) {
          showErrorDialog({
            message: "Unexpected response format",
            note: result,
          });
          return;
        }
      } else {
        outputObj = result;
      }

      // Normalize success to 1 if it's boolean true
      if (outputObj && outputObj.success === true) {
        outputObj.success = 1;
      }

      if (!outputObj.success) {
        showErrorDialog({
          message: "Donation failed",
          note: "Maybe try again later?"
        });
        return;
      }
    } catch (e) {
      showErrorDialog({
        message: 'Error during donation',
        note: e.message
      });
      return;
    }
  };
  
  const resetDonationModal = async () => {
    setIsDonating(false);
    setDonationAmount(0);
  };

  if (error) return <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}><p style={{ color: 'red' }}>{error}</p></Panel>;
  if (!currentIssue) return <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}><p>No voting issue found.</p></Panel>;

  return (
    <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}>
      <FieldSet legend='Your Voting Power' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <p>
            Your Trust Score: {(userTrust ?? 0).toLocaleString()} |{' '}
            Your Voting Weight: {(Number(userWeight) / 1e8).toLocaleString(undefined, { maximumFractionDigits: 2 })} |{' '}
            Total Number of Votes You've Cast: 
            {!userVotesCastOverall && userVotesCastOverall != 0 ? (
              <> <span style={{ color: 'red' }}>(loading...)</span></>
            ) : (
              <> {userVotesCastOverall.toLocaleString()} </>
            )}
          </p>
        </div>
      </FieldSet>

      <div style={{ marginBottom: '1em' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center', fontSize: 'x-large' }}>
          <p>
            <strong>{issue.title}</strong>
            <br />
            Voting is
            {!votingOver ? (
              <> still <span style={{ color: 'green' }}>OPEN</span>!</>
            ) : (
              <> <span style={{ color: 'red' }}>CLOSED</span>!</>
            )}
          </p>
        </div>
        <div style={{ marginBottom: '3rem' }}>
          <label htmlFor="descriptionTextField" style={{ marginBottom: '0.25rem' }}>Description</label>
          <MultilineTextField label="Description" value={issue.description} disabled />
        </div>
      </div>
      <div>
        <strong>Created:</strong> {issue.created_at ? new Date(issue.created_at * 1000).toLocaleString() : 'N/A'}
      </div>
      <div>
        <strong>Deadline:</strong> {issue.deadline ? new Date(issue.deadline * 1000).toLocaleString() : 'N/A'}
      </div>
      <div>
        <strong>Organizer:</strong> {issue.organizer_name || 'Anonymous'}
      </div>
      <div>
        <strong>Organizer's Email:</strong> {issue.organizer_email || 'Anonymous'}
      </div>
      <div>
        <strong>Organizer's Telegram:</strong> {issue.organizer_telegram || ''}
      </div>
      <div>
        <strong>Hashtag:</strong> {issue.hashtag || ''}
      </div>
      <div>
        <strong>Minimum Trust Required to Vote:</strong> {Number(issue.min_trust).toLocaleString()}
      </div>
      <div style={{ marginTop: '3rem' }}>
          <label htmlFor="summaryProArgumentsTextField" style={{ marginBottom: '0.25rem' }}>Summary - Pro Arguments</label>
          <MultilineTextField label="Summary - Pro Arguments" value={issue.summary_pro} disabled />
          <label htmlFor="summaryConArgumentsTextField" style={{ marginBottom: '0.25rem' }}>Summary - Con Arguments</label>
          <MultilineTextField label="Summary - Con Arguments" value={issue.summary_con} disabled />
          <label htmlFor="possibleOutcomesTextField" style={{ marginBottom: '0.25rem' }}>Possible Outcomes</label>
          <MultilineTextField label="Possible Outcomes" value={issue.possible_outcomes} disabled />
      </div>
      {/* --- SUPPORTING DOCUMENTS --- */}
    {issue.supporting_docs?.length > 0 && (
      <FieldSet legend="Supporting Documents">
        <div style={{ textAlign: 'center' }}>
          Click on the document title to toggle display of the document<br />(Viewer for text or markdown files, download all others.)
        </div>
        <ul style={{ width: '100%', padding: 0, margin: 0, listStyle: 'none' }}>
          {issue.supporting_docs.map(doc => {
            const docData = docsContent[doc.guid];
            if (!docData) return <li key={doc.guid}>Loading document...</li>;
            if (docData.error) return <li key={doc.guid} style={{ color: 'red' }}>{docData.error}</li>;
            const isOpen = !!openDocs[doc.guid];
            return (
              <li key={doc.guid} style={{ width: '100%', boxSizing: 'border-box', marginBottom: '2em' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1em',
                    width: '100%',
                  }}
                >
                {console.log('IssuePage::docData: ', docData)}
                {(docData.type == 'markdown' || docData.type === 'text') && (
                  <strong
                    style={{ cursor: 'pointer', color: '#00b7fa' }}
                    onClick={() => toggleDoc(doc.guid)}
                  >
                    {docData.name}
                  </strong>
                )}
                {(docData.type !== 'markdown' && docData.type !== 'text') && (
                  <strong>
                    {docData.name}
                  </strong>
                )}
                  <Button
                    onClick={() => handleDownload(docData.name, docData.base64)}
                    style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
                  >
                    Download
                  </Button>
                </div>
                {isOpen && (
                  <>
                    {docData.type === 'markdown' && (
                      <div className="document-display" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                        <MarkdownWithZoom>
                          {docData.content}
                        </MarkdownWithZoom>
                      </div>
                    )}
                    {docData.type === 'text' && (
                      <div className='document-display'>
                        <pre>{docData.content}</pre>
                      </div>
                    )}
                    {docData.type === 'unknown' && (
                      <pre>{docData.content}</pre>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </FieldSet>
    )}
    {/* --- ON-CHAIN ADDRESSES --- */}
    <FieldSet legend="ON-CHAIN ADDRESSES">
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
      }}>
        <div style={{
          textAlign: 'left',
          width: '100%',
          maxWidth: 960
        }}>
            <div>
              <strong>Voting Issue Account Name:</strong>
              <Tooltip.Trigger tooltip="Click to copy to clipboard">
                <span
                  onClick={() => copyToClipboard(`${votingAuthoritySigchain}:${issue.slug}`)}
                  style={{ cursor: 'pointer', color: '#00b7fa', marginLeft: 6 }}
                >
                  {votingAuthoritySigchain}:{issue.slug}
                </span>
              </Tooltip.Trigger>
            </div>

            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Voting Issue Account Address:</strong>
              <Tooltip.Trigger tooltip="Click to copy to clipboard">
                <span
                  onClick={() => copyToClipboard(issue.address)}
                  style={{ cursor: 'pointer', color: '#00b7fa', marginLeft: 6 }}
                >
                  {issue.address}
                </span>
              </Tooltip.Trigger>
            </div>

            {issue.account_addresses && (
              <ul style={{ fontSize: '0.9rem' }}>
                {(() => {
                  return issue.account_addresses.map((opt, idx) => {
                    // Use the object's properties
                    const label = issue.option_labels?.[idx] || `Option ${idx + 1}`;
                    const name = opt.name || ''; // The option's name (e.g., "opt-yes-dc9d9622")
                    const address = opt.address || opt; // Support both object and string, just in case
                    return (
                      <li key={address}>
                        <div>
                          <strong>{label} - Voting Option Account Name:</strong>
                          <Tooltip.Trigger tooltip="Click to copy to clipboard">
                            <span
                              onClick={() => copyToClipboard(`${votingAuthoritySigchain}:${name}`)}
                              style={{ cursor: 'pointer', color: '#00b7fa', marginLeft: 6 }}
                            >
                              {votingAuthoritySigchain}:{name}
                            </span>
                          </Tooltip.Trigger>
                        </div>

                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong><span style={{ color: 'transparent' }}>{label} - </span>Voting Option Account Address:</strong>
                          <Tooltip.Trigger tooltip="Click to copy to clipboard">
                            <span
                              onClick={() => copyToClipboard(issue.address)}
                              style={{ cursor: 'pointer', color: '#00b7fa', marginLeft: 6 }}
                            >
                              {opt.address}
                            </span>
                          </Tooltip.Trigger>
                        </div>
                      </li>
                    );
                  });
                })()}
              </ul>
            )}
        </div>
      </div>
    </FieldSet>
    {/* --- VOTE BUTTONS --- */}
      <FieldSet legend="CAST YOUR VOTE">
        <div style={{ textAlign: 'center' }}>
          {!userHasEnoughTrustToVote && (
            <p>You have insufficient trust to vote on this issue.<br />A trust score of {Number(issue.min_trust).toLocaleString()} is required.<br />Yours is currently {Number(userTrust).toLocaleString()}.</p>
          )}
          {votingOver && (
            <p>Voting is over.<br />The deadline was new {Date(issue.deadline * 1000).toLocaleString()}.</p>
          )}
          {userIneligibleToVote && (
            <p>You have already cast a vote on this issue, and it is set to One Time Voting.</p>
          )}
          <ul style={{ display: "inline-block", textAlign: "center", padding: 0, margin: 0, listStyle: "none" }}>
            {optionAddresses.map((address, idx) => (
              <li key={address} style={{ position: "relative", margin: "0.5em 0" }}>
                <div style={{ display: "inline-block", position: "relative" }}>
                  <Button 
                    key={address}
                    disabled={!userHasEnoughTrustToVote || votingOver || userIneligibleToVote} 
                    onClick={() => handleVote(address)}
                  >
                    Vote for {issue.option_labels?.[idx] || `Option ${idx + 1}`}
                  </Button>
                  {/* Indicator if voted */}
                  {optionVotedOn === address && (
                    <span style={{
                      position: "absolute",
                      left: "105%",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "green",
                      fontWeight: "bold",
                      fontSize: "0.95em",
                      whiteSpace: "nowrap",
                    }}>
                      (You voted on this one)
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </FieldSet>
      <div style={{ textAlign: 'center' }}>
        <Button>
          <Link onClick={handleReturnToVotingPageClick} style={{ textDecoration: 'none', color: 'inherit' }}>
            Return to Voting Issue List Page
          </Link>
        </Button>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        fontSize: 'small'
      }}>
        <div>
          {/* Left-justified content here */}
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
            <div class="Modal__Footer">
              <Button onClick={handleDonation} disabled={!donationAmount} style={{ marginRight: '1rem' }}>
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

export default IssuePage;