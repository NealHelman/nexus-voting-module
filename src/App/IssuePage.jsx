import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { decompressFromBase64 } from 'lz-string';
import MarkdownWithZoom from "./MarkdownWithZoom";
import nexusVotingService from '../services/nexusVotingService';
import { Copyright } from '../utils/copyright.js';
import nxsPackage from '../../nxs_package.json';

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
const CACHE_AGE_LIMIT = 5 * 60 * 1000; // 5 minutes
const WEIGHT_SCALE_FACTOR = 1000000;
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentIssue } = useSelector(state => state.issue);
  const issue = currentIssue?.data;
  console.log('[IssuePage::issue: ', issue);
  const { issueId } = useParams();

  const {
    components: { Panel, Button, Dropdown, FieldSet, Modal, TextField, Tooltip, MultilineTextField, Switch },
    utilities: { apiCall, copyToClipboard, secureApiCall, confirm, proxyRequest, showErrorDialog, showSuccessDialog, showInfoDialog },
  } = NEXUS;

  // Issue state from Redux
  const {
  issueFetched,
  issueCache = {},
  title,
  description,
  optionLabels = ['', ''],
  optionAddresses = ['', ''],
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
  creatorGenesis,
  jsonGuid,
  analysisGuid,
  userTrust,
  userHasEnoughTrustToVote,
  userIneligibleToVote,
  userCurrentlyVotedOn,
  userVotesCastOverall,
  votingOver,
  optionVotedOn,
  votingAuthorityAccount,
  votingAuthorityGenesis
} = useSelector(state => state.issue);

  // Get values from the voting slice
  const {
    userWeight,
    senderAddress: votingSenderAddress,
    donationRecipient: votingDonationRecipient,
    votingAuthoritySigchain,
    weightedVoteCounts
  } = useSelector(state => state.voting);
  
  const userGenesis = useSelector(state => state.userStatus?.genesis);


  // Use the most appropriate values
  const senderAddress = votingSenderAddress || issueSenderAddress;
  const donationRecipient = votingDonationRecipient || issueDonationRecipient;

  // Flags and Miscellaneous
  const [isDonating, setIsDonating] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState(0);
  const [donationSent, setDonationSent] = React.useState(false);
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
  const setWeightedVoteCounts = (page) => dispatch({ type: 'SET_WEIGHTED_VOTE_COUNTS', payload: page });

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
    if (!issueId) return;

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
  }, [issueId, issueCacheEntry]);

  React.useEffect(() => {
    nexusVotingService.getProtectedValues().then(({ data }) => {
      setVotingAuthoritySigchain(data.VOTING_AUTHORITY_SIGCHAIN);
      setVotingAuthorityAccount(data.VOTING_AUTHORITY_ACCOUNT);
      setVotingAuthorityGenesis(data.VOTING_AUTHORITY_GENESIS);
    });
  }, []);

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
    const debugValues = { userGenesis, userTrust, senderAddress, issue};
    console.log('Updating window.myModuleDebug:', debugValues);
    window.myModuleDebug = debugValues;
  }, [userGenesis, userTrust, senderAddress, issue]);

  // Fetch the voting issue metadata
  const fetchIssue = React.useCallback(
    async () => {
      if (issue) return;
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
  [dispatch, currentIssue, issueId]);
  
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
    // Convert decimal weight to integer for the reference field
    const scaledWeight = Math.floor(userWeight * WEIGHT_SCALE_FACTOR);
    
    console.log(`Original weight: ${userWeight}`);
    console.log(`Scaled weight for reference: ${scaledWeight}`);

    try {
      const response = await secureApiCall('finance/debit/account', {
        from: senderAddress,
        to: address,
        amount: voteCost,
        reference: scaledWeight
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
        note: "You voted! Your vote won't be reflected until the voting transaction is confirmed on the network."
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
      {/* Voting Power */}
      <FieldSet legend="YOUR VOTING POWER" style={{ marginBottom: '2em', textAlign: 'center' }}>
        <div>
          Your Trust Score: <strong>{(userTrust ?? 0).toLocaleString()} | </strong>
          Your Voting Weight: <strong>{(Number(userWeight).toLocaleString(undefined, { maximumFractionDigits: 6 }))} | </strong>
          Total Number of Votes You've Cast: <strong>
            {!userVotesCastOverall && userVotesCastOverall != 0 ? (
              <span style={{ color: 'red' }}>(loading...)</span>
            ) : (
              userVotesCastOverall.toLocaleString()
            )}
          </strong>
        </div>
      </FieldSet>

      {/* Issue Title and Status */}
      <FieldSet legend="" style={{ marginBottom: '2em', textAlign: 'center', fontSize: 'x-large' }}>
        <div>
          <strong style={{ color: '#00b7fa' }}>{issue.title}</strong>
          <br />
          Voting is
          {!votingOver ? (
            <> still <span style={{ color: 'green' }}>OPEN</span>!</>
          ) : (
            <> <span style={{ color: 'red' }}>CLOSED</span>!</>
          )}
        </div>
      </FieldSet>

      {/* Issue Details */}
      <FieldSet legend="ISSUE DETAILS" style={{ marginBottom: '2em' }}>
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="descriptionTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Description</label>
          <MultilineTextField label="Description" value={issue.description} disabled />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1em', marginBottom: '1em' }}>
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
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <strong>Minimum Trust Required to Vote:</strong> {Number(issue.min_trust).toLocaleString()}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="summaryProArgumentsTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Summary - Pro Arguments</label>
          <MultilineTextField label="Summary - Pro Arguments" value={issue.summary_pro} disabled />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="summaryConArgumentsTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Summary - Con Arguments</label>
          <MultilineTextField label="Summary - Con Arguments" value={issue.summary_con} disabled />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="possibleOutcomesTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Possible Outcomes</label>
          <MultilineTextField label="Possible Outcomes" value={issue.possible_outcomes} disabled />
        </div>
      </FieldSet>

      {/* Supporting Documents */}
      {issue.supporting_docs?.length > 0 && (
        <FieldSet legend="SUPPORTING DOCUMENTS" style={{ marginBottom: '2em' }}>
          <div style={{ textAlign: 'center', marginBottom: '1em' }}>
            Click on the document title to toggle display of the document<br />(Viewer for text or markdown files, download all others.)
          </div>
          
          <div style={{ marginTop: '1.5em' }}>
            <ul className="uploaded-files-list" style={{ listStyle: 'none', padding: 0 }}>
              {issue.supporting_docs.map(doc => {
                const docData = docsContent[doc.guid];
                if (!docData) return <li key={doc.guid}>Loading document...</li>;
                if (docData.error) return <li key={doc.guid} style={{ color: 'red' }}>{docData.error}</li>;
                const isOpen = !!openDocs[doc.guid];
                const isChecked = analysisGuid === doc.guid;
                
                return (
                  <li className="uploaded-file-row" key={doc.guid} style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: '1em',
                    padding: '1em',
                    marginBottom: '0.5em',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    {/* Left column - Filename */}
                    <span className="file-name" style={{ 
                      fontWeight: 'bold', 
                      color: '#1c1d1f',
                      justifySelf: 'start',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
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
                    </span>
                    
                    {/* Center column - Download Button */}
                    <span className="file-actions" style={{ justifySelf: 'center' }}>
                      <Button
                        skin="filled-primary"
                        onClick={() => handleDownload(docData.name, docData.base64)}
                      >
                        Download
                      </Button>
                    </span>
                    
                    {/* Right column - Analysis Switch */}
                    <span className="file-analysis-switch" style={{ justifySelf: 'end' }}>
                      <Switch
                        name="analysis_file"
                        checked={isChecked}
                        readOnly={true}
                      />
                    </span>
                    
                    {/* Content viewer in separate div below the grid */}
                    {isOpen && (
                      <div style={{
                        gridColumn: '1 / -1', // Span all columns
                        marginTop: '1em',
                        padding: '1em',
                        backgroundColor: '#2d2d2d',
                        color: '#ffffff',
                        borderRadius: '4px',
                        border: '1px solid #555',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap',
                        overflow: 'auto',
                        maxHeight: '800px'
                      }}>
                        {docData.type === 'markdown' && (
                          <div className="document-display" style={{ fontFamily: 'Times New Roman, Times, serif', color: '#ffffff' }}>
                            <MarkdownWithZoom>
                              {docData.content}
                            </MarkdownWithZoom>
                          </div>
                        )}
                        {docData.type === 'text' && (
                          <div className='document-display'>
                            <pre style={{ margin: 0, fontFamily: 'inherit', color: 'inherit' }}>{docData.content}</pre>
                          </div>
                        )}
                        {docData.type === 'unknown' && (
                          <pre style={{ margin: 0, fontFamily: 'inherit', color: 'inherit' }}>{docData.content}</pre>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </FieldSet>
      )}

      {/* On-Chain Addresses */}
      <FieldSet legend="ON-CHAIN ADDRESSES" style={{ marginBottom: '2em' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }}>
          <div style={{
            width: '100%',
            maxWidth: 960
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto 1fr', 
              gap: '0.5em 1em',
              alignItems: 'center'
            }}>
              {/* Voting Issue Account Name */}
              <div style={{ textAlign: 'right' }}>
                <strong>Voting Issue Account Name:</strong>
              </div>
              <div style={{ textAlign: 'left' }}>
                <Tooltip.Trigger tooltip="Click to copy to clipboard">
                  <span
                    onClick={() => copyToClipboard(`${votingAuthoritySigchain}:${issue.slug}`)}
                    style={{ cursor: 'pointer', color: '#00b7fa' }}
                  >
                    {votingAuthoritySigchain}:{issue.slug}
                  </span>
                </Tooltip.Trigger>
              </div>

              {/* Voting Issue Account Address */}
              <div style={{ textAlign: 'right' }}>
                <strong>Voting Issue Account Address:</strong>
              </div>
              <div style={{ textAlign: 'left' }}>
                <Tooltip.Trigger tooltip="Click to copy to clipboard">
                  <span
                    onClick={() => copyToClipboard(issue.address)}
                    style={{ cursor: 'pointer', color: '#00b7fa' }}
                  >
                    {issue.address}
                  </span>
                </Tooltip.Trigger>
              </div>

              {/* Voting Options */}
              {issue.account_addresses && issue.account_addresses.map((opt, idx) => {
                const label = issue.option_labels?.[idx] || `Option ${idx + 1}`;
                const name = opt.name || '';
                const address = opt.address || opt;
                return (
                  <React.Fragment key={address}>
                    {/* Option Account Name */}
                    <div style={{ textAlign: 'right' }}>
                      <strong>{label} - Voting Option Account Name:</strong>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <Tooltip.Trigger tooltip="Click to copy to clipboard">
                        <span
                          onClick={() => copyToClipboard(`${votingAuthoritySigchain}:${name}`)}
                          style={{ cursor: 'pointer', color: '#00b7fa' }}
                        >
                          {votingAuthoritySigchain}:{name}
                        </span>
                      </Tooltip.Trigger>
                    </div>

                    {/* Option Account Address */}
                    <div style={{ textAlign: 'right' }}>
                      <strong>Voting Option Account Address:</strong>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <Tooltip.Trigger tooltip="Click to copy to clipboard">
                        <span
                          onClick={() => copyToClipboard(opt.address)}
                          style={{ cursor: 'pointer', color: '#00b7fa' }}
                        >
                          {opt.address}
                        </span>
                      </Tooltip.Trigger>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </FieldSet>

      {/* Vote Buttons */}
      <FieldSet legend="CAST YOUR VOTE" style={{ marginBottom: '2em' }}>
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
            {optionAddresses.map((address, idx) => {
              const label = issue.option_labels?.[idx] || `Option ${idx + 1}`;
              
              // Calculate weighted vote counts and percentages
              const weightedCount = Number(weightedVoteCounts?.[issue.slug]?.[address] ?? 0);
              const totalWeighted = optionAddresses
                .map(addr => weightedVoteCounts?.[issue.slug]?.[addr] ?? 0)
                .reduce((acc, count) => acc + Number(count), 0);
              const percent = totalWeighted > 0 ? (weightedCount / totalWeighted) * 100 : 0;
              const displayWeight = (weightedCount / WEIGHT_SCALE_FACTOR).toLocaleString(undefined, { maximumFractionDigits: 2 });
              
              return (
                <li key={address} style={{ position: "relative", margin: "0.5em 0", display: "flex", justifyContent: "center" }}>
                  <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {/* Left side - Vote counts and percentage */}
                    <div style={{
                      position: "absolute",
                      right: "105%",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#00b7fa",
                      fontWeight: "bold",
                      fontSize: "0.9em",
                      whiteSpace: "nowrap",
                      textAlign: "right"
                    }}>
                      <div>{displayWeight} weighted NXS</div>
                      <div style={{ color: "#888", fontSize: "0.85em" }}>({percent.toFixed(2)}%)</div>
                    </div>
                    
                    {/* Center - Vote button */}
                    <Button 
                      key={address}
                      skin="filled-primary"
                      disabled={!userHasEnoughTrustToVote || votingOver || userIneligibleToVote} 
                      onClick={() => handleVote(address)}
                      style={{ width: "100%", minWidth: "300px" }}
                    >
                      Vote for {label}
                    </Button>
                    
                    {/* Right side - "You voted" indicator */}
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
              );
            })}
          </ul>
        </div>
      </FieldSet>

      {/* Return Button */}
      <div style={{ textAlign: 'center', marginBottom: '2em' }}>
        <Button skin="filled-primary" onClick={handleReturnToVotingPageClick}>
          Return to Voting Issue List Page
        </Button>
      </div>

      {/* Footer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        fontSize: 'small',
        marginTop: '2em'
      }}>
        <div style={{ justifySelf: 'start' }}>version {version}</div>
        <div style={{ justifySelf: 'center' }}>
          <Button skin="filled-primary" onClick={() => setIsDonating(true)}>Donate</Button>
        </div>
        <Copyright />
      </div>

      {/* Donation Modal */}
      {isDonating && (
        <Modal id="DonationDialog" escToClose={true} removeModal={() => setIsDonating(false)} style={{ width: '500px' }}>
          <Modal.Header>Thank you!<br />How many NXS<br />do you wish to donate?</Modal.Header>
          <Modal.Body>
            <StyledTextField label="DonationAmount" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
          </Modal.Body>
          <ModalFooterBar>
            <Button skin="filled-primary" onClick={handleDonation} disabled={!donationAmount}>Donate</Button>
            <Button skin="filled" onClick={resetDonationModal}>Cancel</Button>
          </ModalFooterBar>
        </Modal>
      )}
    </Panel>
  );
}

export default IssuePage;