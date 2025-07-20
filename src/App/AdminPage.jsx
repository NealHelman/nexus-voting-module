// --- AdminPage.jsx ---  
import { useDispatch, useSelector } from 'react-redux';
import { compressToBase64, decompressFromBase64 } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import axios from 'axios';
import { Link, useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { sha256FromFile } from '../utils/ipfs';
import { Copyright } from '../utils/copyright.js';
import { fixHashtag } from '../utils/fixHashtag.js';
import nxsPackage from '../../nxs_package.json' with { type: "json" };

const { version } = nxsPackage;
const BACKEND_BASE = 'http://65.20.79.65:4006';
const React = NEXUS.libraries.React;

const {
  components: { TextField, Modal, MultilineTextField, Button, Dropdown, FieldSet, Panel, Switch, Tooltip },
  utilities: { apiCall, proxyRequest, secureApiCall, showInfoDialog, showErrorDialog, showSuccessDialog },
} = NEXUS;

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
    
function AdminPageComponent() {
  const { currentIssue } = useSelector(state => state.issue);
  let assetData = currentIssue?.data;
  const { issueId } = useParams();
  
  // Admin state from Redux
  const {
    adminListFetched,
    isEditing,
    editingId,
    title,
    description,
    optionLabels = [],
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
    jsonGuid,
    analysisGuid,
    submissionCost
  } = useSelector(state => state.admin);
  
  // Get values from the voting slice
  const {
    genesis: creatorGenesis,
    userWeight,
    senderAddress,
    donationRecipient,
    votingAuthoritySigchain,
    votingAuthorityAccount,
    votingAuthorityGenesis,
    namedAssetCost,
    namedAccountCost
  } = useSelector(state => state.voting);

  console.log('Redux supportingDocs raw:', supportingDocs);
  console.log('Redux supportingDocs type:', typeof supportingDocs);
  console.log('Redux supportingDocs isArray:', Array.isArray(supportingDocs));

  const _supportingDocs = Array.isArray(supportingDocs) ? supportingDocs : [];
  console.log('Final _supportingDocs:', _supportingDocs);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Setters dispatch Redux actions
  const setAdminListFetched = (value) => dispatch({ type: 'SET_ADMIN_LIST_FETCHED', payload: value });

  // Flags and Miscellaneous
  const [isDonating, setIsDonating] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState(0);
  const [donationSent, setDonationSent] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [submitButtonTitle, setSubmitButtonTitle] = React.useState('Submit');
  const [userEmailValid, setUserEmailValid] = React.useState(false);

  // User & admin state
  const setIsEditing = (value) => dispatch({ type: 'SET_IS_EDITING', payload: value });
  const setEditingId = (value) => dispatch({ type: 'SET_EDITING_ID', payload: value });
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
  const setSupportingDocs = (value) => {
    console.log('setSupportingDocs called with:', value);
    dispatch({ type: 'SET_SUPPORTING_DOCS', payload: value });
  };
  const setCreatedBy = (value) => dispatch({ type: 'SET_CREATED_BY', payload: value });
  const setCreatedAt = (value) => dispatch({ type: 'SET_CREATED_AT', payload: value });
  const setCreatorGenesis = (value) => dispatch({ type: 'SET_CREATOR_GENESIS', payload: value });
  const setJsonGuid = (value) => dispatch({ type: 'SET_JSON_GUID', payload: value });
  const setAnalysisGuid = (value) => dispatch({ type: 'SET_ANALYSIS_GUID', payload: value });
  const setSenderAddress = (value) => dispatch({ type: 'SET_SENDER_ADDRESS', payload: value });
  const setSubmissionCost = (value) => dispatch({ type: 'SET_SUBMISSION_COST', payload: value });
    const setVotingAuthoritySigchain = (value) => dispatch({ type: 'SET_VOTING_AUTHORITY_SIGCHAIN', payload: value });
  const setVotingAuthorityAccount = (value) => dispatch({ type: 'SET_VOTING_AUTHORITY_ACCOUNT', payload: value });
  const setVotingAuthorityGenesis = (value) => dispatch({ type: 'SET_VOTING_AUTHORITY_GENESIS', payload: value });
  const setDonationRecipient = (page) => dispatch({ type: 'SET_DONATION_RECIPIENT', payload: page });
  const setNamedAssetCost = (page) => dispatch({ type: 'SET_NAMED_ASSET_COST', payload: page });
  const setNamedAccountCost = (page) => dispatch({ type: 'SET_NAMED_ACCOUNT_COST', payload: page });
  const setWeightedVoteCounts = (page) => dispatch({ type: 'SET_WEIGHTED_VOTE_COUNTS', payload: page });
  
  const fileInputRef = React.useRef();

  const [searchParams] = useSearchParams();
  const location = useLocation();
  let editingIdFromParams = searchParams.get('edit') || '';
  let inEditMode = !!editingIdFromParams;
  const panelTitle = (editingIdFromParams || isEditing)
    ? 'Nexus Community On-Chain Voting – Edit Voting Issue'
    : 'Nexus Community On-Chain Voting – Enter New Voting Issue';

  function isAdminFormEmpty() {
    return !title && !description && optionLabels.every(l => !l.trim());
  }
  
  // ---------- SET FORM MODE PROPERLY FOR BOTH ENTRY PATHS ----------
  React.useEffect(() => {
    dispatch({
      type: 'RESET_ADMIN_FORM',
      payload: { deadline: calculateDefaultDeadline() }
    });

    if (editingIdFromParams) {
      // Edit mode: set editingId and fetch data
      dispatch({ type: 'SET_IS_EDITING', payload: true });
      dispatch({ type: 'SET_EDITING_ID', payload: editingIdFromParams });
      // The existing effect that fetches asset data when editingId changes will handle data population
    } else {
      // New mode
      dispatch({ type: 'SET_IS_EDITING', payload: false });
      dispatch({ type: 'SET_EDITING_ID', payload: '' });
    }
  }, [dispatch, editingIdFromParams]);

  function formatDateLocal(ts) {
    const date = new Date(ts * 1000);
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset);
    return local.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'
  };
  
  function calculateDefaultDeadline() {
    const now = new Date();
    const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    deadline.setHours(23, 59, 0, 0); // Set to 23:59:00.000
    return Math.floor(deadline.getTime() / 1000); // Convert to Unix timestamp
  };
  
  function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  };
  
  async function pingBackend() {
    try {
      const { status } = await proxyRequest(`${BACKEND_BASE}/ping`, { method: 'GET' });
      backendOk = status == '200';
      setBackendAvailable(backendOk);
    } catch (err) {
      setBackendAvailable(false);
      showErrorDialog({ message: 'Backend is not responding. Please try again later.', note: err.message });
      setStatus("idle");
      setLoading(false);
    }
  };
  
  function handleNewIssueClick() {
    // Clear the URL search params first
    navigate('/admin', { replace: true });
    
    // Then clear all the Redux state
    dispatch({ type: 'RESET_ADMIN_FORM', payload: { deadline: calculateDefaultDeadline() } });
    setTitle('');
    setDescription('');
    setOptionLabels(['', '']);
    setOptionAddresses(['', '']);
    setMinTrust(10000);
    setVoteFinality('one_time');
    setOrganizerName('');
    setOrganizerEmail('');
    setOrganizerTelegram('');
    setHashtag('');
    setDeadline(calculateDefaultDeadline());
    setSummaryPro('');
    setSummaryCon('');
    setPossibleOutcomes('');
    setSupportingDocs([]);
    setCreatedBy('');
    setCreatedAt('');
    setJsonGuid('');
    setSubmitButtonTitle('Submit');
    
    setTimeout(() => {
      const el = document.getElementById('top');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  const handleReturnToVotingPageClick = (e) => {
    e.preventDefault(); // Prevent default link behavior if needed
    navigate("/voting");
  };

  React.useEffect(() => {
    const debugValues = { editingId, assetData };
    console.log('Updating window.myModuleDebug:', debugValues);
    window.myModuleDebug = debugValues;
  }, [editingId, assetData]);
  
  React.useEffect(() => {
    if (!votingAuthorityGenesis) {
      nexusVotingService.getProtectedValues().then(({ data }) => {
        setVotingAuthoritySigchain(data.VOTING_AUTHORITY_SIGCHAIN);
        setVotingAuthorityAccount(data.VOTING_AUTHORITY_ACCOUNT);
        setVotingAuthorityGenesis(data.VOTING_AUTHORITY_GENESIS);
        setNamedAssetCost(data.NAMED_ASSET_COST);
        setNamedAccountCost(data.NAMED_ACCOUNT_COST);
      });
    }
  }, [adminListFetched]);

  React.useEffect(() => {
    setSubmissionCost(namedAssetCost + (namedAccountCost * optionLabels.length));
  }, [dispatch, adminListFetched, editingIdFromParams, optionLabels.length]);

  React.useEffect(() => {
    if (assetData) return;

    const fetchAsset = async () => {
      try {
        // Fetch the on-chain asset (contains issueInfo, title, deadline, etc)
        const response = await apiCall('assets/get/asset', { verbose: 'summary', address: editingIdFromParams });

        setTitle(response.title || '');
        setDeadline(response.deadline);
        setCreatorGenesis(response.creatorGenesis || null);

        const issueInfoGuid = response.issueInfo;
        setJsonGuid(issueInfoGuid || null);
      } catch (err) {
        console.error('Failed to load vote asset:', err);
      }
    };

    fetchAsset();
  }, [currentIssue, editingIdFromParams]);
  
  React.useEffect(() => {
    if (editingIdFromParams && assetData) {
      setTitle(assetData.title || '');
      setDescription(assetData.description || '');
      setOptionLabels(assetData.option_labels || []);
      setOptionAddresses(assetData.option_addresses || []);
      setMinTrust(assetData.min_trust || '');
      setVoteFinality(assetData.vote_finality || 'one_time');
      setOrganizerName(assetData.organizer_name || '');
      setOrganizerEmail(assetData.organizer_email || '');
      setOrganizerTelegram(assetData.organizer_telegram || '');
      setHashtag(assetData.hashtag || '');
      setDeadline(assetData.deadline || '');
      setSummaryPro(assetData.summary_pro || '');
      setSummaryCon(assetData.summary_con || '');
      setPossibleOutcomes(assetData.possible_outcomes || '');
      setSupportingDocs(assetData.supporting_docs || []);
      setCreatedBy(assetData.created_by || '');
      setCreatedAt(assetData.created_at || '');
      setCreatorGenesis(assetData.creatorGenesis || '');
      setJsonGuid(assetData.issueInfo || '');
      setSubmissionCost(assetData.submissionCost || '');
      setSubmitButtonTitle('Update');
    } else {
      setTitle('');
      setDescription('');
      setOptionLabels(['', '']);
      setOptionAddresses(['', '']);
      setMinTrust(10000);
      setVoteFinality('one_time');
      setOrganizerName('');
      setOrganizerEmail('');
      setOrganizerTelegram('');
      setHashtag('');
      setDeadline(calculateDefaultDeadline());
      setSummaryPro('');
      setSummaryCon('');
      setPossibleOutcomes('');
      setSupportingDocs([]);
      setCreatedBy('');
      setCreatedAt('');
      setJsonGuid('');
      setSubmitButtonTitle('Submit');
      editingIdFromParams=false;
      inEditMode=false;
      setIsEditing(false);
    }
  }, [dispatch, editingIdFromParams, assetData]);

  React.useEffect(() => {
    if (!jsonGuid) return;
    if (!adminListFetched && editingId) {
      const fetchSummaries = async () => {
        try {
          const { data } = await proxyRequest(`${BACKEND_BASE}/ipfs/fetch/${jsonGuid}`, { method: 'GET' });
            console.log('data: ', data);
            try {
              const jsonStr = atob(data.base64); // decode base64 to string
              const parsed = JSON.parse(jsonStr);    // parse JSON

              setSummaryPro(parsed.summary_pro || '');
              setSummaryCon(parsed.summary_con || '');
              setPossibleOutcomes(parsed.possible_outcomes || '');
            } catch (e) {
              console.error('Failed to parse base64-encoded JSON:', e);
            }
        } catch (err) {
          console.error('Failed to load vote asset:', err);
        }
      }
      fetchSummaries();
    }
  }, [adminListFetched, jsonGuid, editingId]);

  // ---------- PREPARE FILES FOR UPLOAD AND DISPLAY FILENAMES ----------
  const allowedExtensions = {
    md:        'text/markdown',
    markdown:  'text/markdown',
    txt:       'text/plain',
    pdf:       'application/pdf',
    doc:       'application/msword',
    docx:      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt:       'application/vnd.ms-powerpoint',
    pptx:      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
  const allowedTypes = Object.values(allowedExtensions);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    const filteredFiles = selectedFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      // Accept if extension is allowed, even if MIME type is missing or wrong
      return Object.keys(allowedExtensions).includes(ext);
    });
    
    console.log('[handleFileChange] filteredFiles: ', filteredFiles);

    const docsWithMeta = await Promise.all(filteredFiles.map(async (file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      const mappedType = allowedExtensions[ext] || file.type || 'application/octet-stream';
      if (file instanceof Blob) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => reject('FileReader failed');
          reader.readAsDataURL(file);
        }); // <-- Only one closing parenthesis here!
        const sha256 = await sha256FromFile(file);
        return {
          name: file.name,
          guid: crypto.randomUUID(),
          type: mappedType,
          base64,
          sha256
        };
      }
    }));

    if (docsWithMeta.length > 0) {
      const currentDocs = Array.isArray(supportingDocs) ? supportingDocs : [];
      setSupportingDocs([...currentDocs, ...docsWithMeta]);
      setMessage(`${docsWithMeta.length} file(s) staged for upload. They will be uploaded on submission.`);
    } else {
      setSupportingDocs = [];
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Checks if the value is a valid hashtag:
   * - Starts with a single '#'
   * - Only one '#' character in the string
   * - At least one character after the '#'
   * @param {string} hashtag
   * @returns {boolean}
   */
  function isValidHashtag(hashtag) {
    if (typeof hashtag !== 'string') return false;
    // Must start with '#' and have only one '#', and at least one character after it
    return /^#[^#\s]+$/.test(hashtag);
  }
  
  const createVote = async () => {
    setIsSubmitting(true);
    setMessage('');

    if (!title.trim() || !description.trim() || optionLabels.length < 2 || optionLabels.some(l => !l.trim())) {
      setMessage('Please fill in the title, description, and at least two valid option labels.');
      setIsSubmitting(false);
      return;
    }

    let assetName = '';
    let issueInfoGuid = '';
    let optionAccounts = [];
    let optionAddresses = [];
    let slugs = [];
    let uploadedDocs = [];
    let resultToUse = null;

    if (!editingIdFromParams) {
      const safeTitle = title.toLowerCase().replace(/\W+/g, '-').substring(0, 32);
      let guid = crypto.randomUUID();
      assetName = `vote-${safeTitle}-${createdAt}-${guid.slice(0, 8)}`;

      optionAccounts = optionLabels.map((label, idx) => {
        const optionSafe = label.toLowerCase().replace(/\W+/g, '-').substring(0, 20);
        guid = crypto.randomUUID();
        return {
          name: `opt-${optionSafe}-${guid.slice(0, 8)}`,
          label: label.trim()
        };
      });

      slugs = optionAccounts.map(acc => acc.name);
      issueInfoGuid = crypto.randomUUID();
    } else {
      assetName = assetData.slug;
      issueInfoGuid = assetData.issueInfo;
      optionAccounts = assetData.account_slugs;
      optionAddresses = assetData.account_addresses;
      slugs = assetData.account_slugs;
    }

    let config = {
      description,
      summary_pro: summaryPro,
      summary_con: summaryCon,
      possible_outcomes: possibleOutcomes,
      option_labels: optionLabels,
      account_slugs: slugs,
      account_addresses: optionAddresses,
      min_trust: parseInt(minTrust),
      vote_finality: voteFinality,
      organizer_name: organizerName,
      organizer_email: organizerEmail,
      organizer_telegram: organizerTelegram,
      created_by: createdBy.trim() || 'unknown',
      created_at: createdAt || Math.floor(Date.now() / 1000),
      supporting_docs: supportingDocs,
      version: 1,
      created: new Date().toISOString()
    };

    const assetConfig = {
      name: assetName,
      title,
      description,
      deadline: parseInt(deadline),
      hashtag: fixHashtag(hashtag),
      issueInfo: issueInfoGuid,
      creatorGenesis
    };

    console.log('[createVote] assetConfig: ', assetConfig);

    if (!editingIdFromParams) {
      let txidString = '';
      try {
        const response = await secureApiCall('finance/debit/account', {
          from: senderAddress,
          to: votingAuthorityAccount,
          amount: submissionCost
        });

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
            setIsSubmitting(false);
            return;
          }
        } else {
          outputObj = result;
        }

        // Normalize success to 1 if it's boolean true
        if (outputObj && outputObj.success === true) {
          outputObj.success = 1;
        }

        // Now your check will work as desired
        if (!outputObj.success) {
          showErrorDialog({
            message: "NXS debit failed",
            note: "No txid returned.",
          });
          setIsSubmitting(false);
          return;
        }
        txidString = outputObj.txid?.toString?.() || '';
        console.log('txidString: ', txidString);
      } catch (e) {
        showErrorDialog({
          message: 'Error during sending voting issue creation fee',
          note: e.message
        });
        setIsSubmitting(false);
        return;
      }

      setIsUploading(true);

      resultToUse = await nexusVotingService.createVoteViaBackend(txidString, assetConfig, optionAccounts);
      if (!resultToUse.success) {
        showErrorDialog({
          message: 'Failed to create vote asset',
          note: resultToUse.error
        });
        setIsUploading(false);
        setIsSubmitting(false);
        return;
      }

      if (resultToUse.accounts && Array.isArray(resultToUse.accounts)) {
        setOptionAddresses(resultToUse.accounts); // Keep full objects
        config.account_addresses = resultToUse.accounts; // Update config with full objects
      }
    } else {
      // We're editing, so update
      setIsUploading(true);

      resultToUse = await nexusVotingService.updateVoteViaBackend(editingId, assetConfig, optionAccounts);
      if (!resultToUse.success) {
        showErrorDialog({
          message: 'Failed to create vote asset',
          note: resultToUse.error
        });
        setIsUploading(false);
        setIsSubmitting(false);
        return;
      }
    }

    console.log('[createVote] resultToUse: ', resultToUse);
    console.log('[createVote] supportingDocs: ', supportingDocs);

    // UPLOAD SUPPORTING DOCS
    uploadedDocs = [];
    for (const doc of supportingDocs) {
      try {
        const response = await proxyRequest(
          `${BACKEND_BASE}/ipfs/upload`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: {
              name: doc.name,
              guid: doc.guid,
              mimeType: doc.type,
              base64: doc.base64
            }
          }
        );

        if (!response?.data?.success) {
          throw new Error(`Failed to upload ${doc.name}`);
        }

        uploadedDocs.push({
          name: doc.name,
          guid: doc.guid,
          sha256: doc.sha256, // Use precomputed hash!
          is_analysis: doc.guid === analysisGuid
        });
      } catch (e) {
        showErrorDialog({ message: `Upload failed for ${doc.name}`, note: e.message });
        setIsUploading(false);
        setIsSubmitting(false);
        return;
      }
    }
    setIsUploading(false);
    setSupportingDocs(uploadedDocs);

    // UPLOAD THE MAIN ISSUE INFO JSON
    try {
      const uploadRes = await proxyRequest(`${BACKEND_BASE}/ipfs/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          name: 'issue_info.json',
          guid: issueInfoGuid,
          mimeType: 'application/json',
          base64: btoa(JSON.stringify(config))
        }
      });

      if (!uploadRes?.data?.success) {
        throw new Error(`Invalid response from backend`);
      }
    } catch (err) {
      showErrorDialog({
        message: 'Failed to upload issue_info.json to backend',
        note: err?.response?.data?.Message || err.message
      });
      setIsSubmitting(false);
      return;
    }

    showSuccessDialog({
      message: 'Success!',
      note: 'Vote created..'
    });

    setIsSubmitting(false);
    setMessage('Submission complete!');
    return;
  };
  
  // ----------- SEND DONATION TO MODULE AUTHOR -----------
  const handleDonation = async () => {
    if (!donationRecipient || !donationAmount) return;
    setDonationSent(true);
    try {
      const response = await secureApiCall('finance/debit/account', {
        from: senderAddress.address,
        to: donationRecipient,
        amount: donationAmount
        }
      );

      resetDonationModal();
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
  
  const resetDonationModal = () => {
    setDonationAmount(0);
    setIsDonating(false);
  };

  if (!currentIssue && editingIdFromParams) return <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}><p>No voting issue found.</p></Panel>;

  return (
    <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}>
      <div id='top' style={{ opacity: isSubmitting ? 0.5 : 1, pointerEvents: isSubmitting ? 'none' : 'auto' }}>
        {isSubmitting && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            zIndex: 9999
          }}>
            <div className="spinner" />
            <div style={{ 
              color: 'red', 
              backgroundColor: 'yellow',
              textAlign: 'center', 
              fontWeight: 'bold',
              zIndex: 10000,
              padding: '1.5em',
              marginTop: '25vh' // This positions it halfway between spinner and bottom
            }}>
              Please wait while the voting issue data is submitted.<br /><br />
              First, the NXS must be claimed by the Voting Authority...<br />
              Then, several objects need to be written to the blockchain.<br />
              There is a 10-second delay between writing each<br />
              objects to avoid incurring extra fees.<br />
              Do not click on any other wallet buttons while this is processing.<br /><br />
              PLEASE BE PATIENT.
            </div>
          </div>
        )}        
        <FieldSet legend="BASIC INFO" style={{ marginBottom: '2em' }}>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="titleTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Title</label>
            <StyledTextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="descriptionTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Description (multiline)</label>
            <MultilineTextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="summaryProArgumentsTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Summary - Pro Arguments (multiline)</label>
            <MultilineTextField label="Summary - Pro Arguments" value={summaryPro} onChange={(e) => setSummaryPro(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="summaryConArgumentsTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Summary - Con Arguments (multiline)</label>
            <MultilineTextField label="Summary - Con Arguments" value={summaryCon} onChange={(e) => setSummaryCon(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="possibleOutcomesTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Possible Outcomes (one per line)</label>
            <MultilineTextField label="Possible Outcomes (one per line)" value={possibleOutcomes} onChange={(e) => setPossibleOutcomes(e.target.value)} />
          </div>
        </FieldSet>

        <FieldSet legend="ORGANIZER DETAILS" style={{ marginBottom: '2em' }}>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="organizerNameTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Organizer Name</label>
            <StyledTextField label="Organizer Name" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="organizerEmailTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Organizer Email</label>
            <StyledTextField label="Organizer Email" value={organizerEmail} onChange={(e) => setOrganizerEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="hashtagTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Hashtag</label>
            <StyledTextField label="Hashtag" value={hashtag} onChange={(e) => setHashtag(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="telegramHandleTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Telegram Handle (optional)</label>
            <StyledTextField label="Telegram Handle (optional)" value={organizerTelegram} onChange={(e) => setOrganizerTelegram(e.target.value)} />
          </div>
        </FieldSet>
        
        <FieldSet legend="VOTING CONFIGURATION" style={{ marginBottom: '2em' }}>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="voteFinality" style={{ marginBottom: '0.25rem', display: 'block' }}>Can People Change Their Vote?</label>
            <StyledDropdownWrapper label="Vote Finality">
              <StyledSelect value={voteFinality} onChange={e => setVoteFinality(e.target.value)}>
                <option value="one_time">One-Time Vote</option>
                <option value="changeable">Changeable Vote</option>
              </StyledSelect>
            </StyledDropdownWrapper>
          </div>
          <div style={{ marginBottom: '1.5em' }}>
            <label htmlFor="minTrustWeightTextField" style={{ marginBottom: '0.25rem', display: 'block' }}>Minimum Trust Required to Vote</label>
            <StyledTextField label="Minimum Trust Weight" type="number" value={minTrust} onChange={(e) => setMinTrust(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5em' }}>
            <label style={{ marginBottom: '0.25rem', display: 'block' }}>
              Voting Deadline (local time):
              <input
                type="datetime-local"
                value={deadline ? formatDateLocal(deadline) : ''}
                onChange={(e) => {
                  const ts = Math.floor(new Date(e.target.value).getTime() / 1000);
                  setDeadline(ts);
                }}
                style={{ marginLeft: '1em', marginRight: '1rem', padding: '0.5em', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </label>
          </div>
        </FieldSet>
        
        <FieldSet legend="VOTING OPTIONS" style={{ marginBottom: '2em' }}>
          {isEditing && (
            <div style={{
              marginBottom: '2em',
              display: 'flex',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '1em',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              color: '#856404'
            }}>
              Unfortunately, the Nexus API does not currently provide a mechanism for changing the voting option labels while editing the voting option.
            </div>
          )}
          {optionLabels.map((label, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5em',
                gap: '0.5rem',
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <label htmlFor={`option${idx + 1}`} style={{ display: 'block', marginBottom: '0.25rem' }}>
                  {`Voting Option ${idx + 1}`}
                </label>
                <StyledTextField
                  id={`option${idx + 1}`}
                  value={label}
                  disabled={isEditing}
                  onChange={(e) => {
                    const updated = [...optionLabels];
                    updated[idx] = e.target.value;
                    setOptionLabels(updated);
                  }}
                />
              </div>

              {optionLabels.length >= 3 && (
                <Button
                  skin="filled"
                  disabled={isEditing}
                  onClick={() => {
                    const newOptions = optionLabels.filter((_, i) => i !== idx);
                    setOptionLabels(newOptions);
                  }}
                  style={{ alignSelf: 'center' }}
                >
                  ❌
                </Button>
              )}
            </div>
          ))}
          <div style={{ textAlign: 'center' }}>
            <Button
              skin="filled-primary"
              disabled={isEditing}
              onClick={() => {
                const newOptionLabels = [...optionLabels, ''];
                setOptionLabels(newOptionLabels);
                setSubmissionCost(namedAssetCost + (namedAccountCost * optionLabels.length));
              }}
            >
              ➕ Add Another Option
            </Button>
          </div>
        </FieldSet>
        
        <FieldSet legend="SUPPORTING DOCUMENTS" style={{ marginBottom: '2em' }}>
          <div style={{ marginBottom: '1.5em', textAlign: 'center' }}>
            <p>Attach a markdown, text, PDF, Word, or PowerPoint file to serve as the primary analysis document. You may also attach additional supporting documents.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md, .txt,.pdf, .doc, .docx, .ppt, .pptx"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <div style={{ textAlign: 'center', marginBottom: '1.5em' }}>
            <Button
              skin="filled-primary"
              onClick={() => {
                console.log('Button clicked, triggering file input');
                if (fileInputRef.current) {
                  console.log('File input found, clicking it');
                  fileInputRef.current.click();
                } else {
                  console.log('File input not found!');
                }
              }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Choose Files'}
            </Button>
          </div>
          
          {Object.entries(uploadProgress).map(([filename, percent]) => (
            <div key={filename} style={{ margin: '0.5em 0', textAlign: 'center' }}>
              <strong>{filename}</strong>
              <progress value={percent} max="100" style={{ marginLeft: '1em' }} />
              <span> {percent}%</span>
            </div>
          ))}

          {_supportingDocs.length > 0 && (
            <div style={{ marginTop: '1.5em' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1em' }}>Uploaded Supporting Documents:</h4>
              <ul className="uploaded-files-list" style={{ listStyle: 'none', padding: 0 }}>
                {_supportingDocs.map((doc, i) => {
                  const isChecked = analysisGuid === doc.guid;
                  console.log('MAPPING DOC:', doc.name, 'GUID:', doc.guid, 'isAnalysis:', isChecked);
                  return (
                    <li className="uploaded-file-row" key={doc.guid} style={{ 
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr', // Three equal columns: filename | delete button | switch
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
                        {doc.name}
                      </span>
                      
                      {/* Center column - Delete Button */}
                      <span className="file-actions" style={{ justifySelf: 'center' }}>
                        {_supportingDocs.length > 1 && doc.guid !== analysisGuid && (
                          <Button
                            skin="filled"
                            onClick={async () => {
                              console.log('Delete button clicked for:', doc.guid);
                              try {
                                const response = await proxyRequest(`${BACKEND_BASE}/ipfs/delete/${doc.guid}`, { method: 'DELETE' });
                                console.log('Delete response:', response);
                                
                                if (response?.data?.success) {
                                  const currentDocs = Array.isArray(supportingDocs) ? supportingDocs : [];
                                  const newArray = currentDocs.filter(d => d.guid !== doc.guid);
                                  console.log('Direct update - currentDocs:', currentDocs);
                                  console.log('Direct update - newArray:', newArray);
                                  setSupportingDocs(newArray);
                                } else {
                                  showErrorDialog({ 
                                    message: 'Failed to delete file', 
                                    note: response?.data?.error || 'Unknown error' 
                                  });
                                }
                              } catch (e) {
                                console.error('Delete error:', e);
                                showErrorDialog({ 
                                  message: 'Error deleting file', 
                                  note: e.message 
                                });
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </span>
                      
                      {/* Right column - Analysis Switch */}
                      <span className="file-analysis-switch" style={{ justifySelf: 'end' }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
                          <Switch
                            name="analysis_file"
                            checked={isChecked}
                            onChange={() => {
                              setAnalysisGuid(analysisGuid === doc.guid ? null : doc.guid);
                            }}
                          />
                          Use as Analysis File
                        </label>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </FieldSet>
        
        <div style={{ textAlign: 'center', marginBottom: '2em' }}>
          <div style={{ marginBottom: '1em' }}>
            <p dangerouslySetInnerHTML={{ __html: message }} />
          </div>
          {!editingIdFromParams && (
            <div style={{ marginBottom: '1em', fontSize: 'large', fontWeight: 'bold' }}>
              Submitting this vote will cost {submissionCost} NXS
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2em' }}>
          <Button skin="filled-primary" onClick={createVote} disabled={isSubmitting}>
            {submitButtonTitle} Voting Issue
          </Button>
          <Button skin="filled" disabled={isSubmitting} onClick={handleNewIssueClick}>
            Enter a New Issue
          </Button>
          <Button skin="filled" disabled={isSubmitting} onClick={handleReturnToVotingPageClick}>
            Return to Voting Page
          </Button>
        </div>
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
            <Button skin="filled-primary" onClick={handleDonation} disabled={!donationAmount || !senderAddress || donationSent}>Donate</Button>
            <Button skin="filled" onClick={resetDonationModal}>Cancel</Button>
          </ModalFooterBar>
        </Modal>
      )}
    </Panel>
  );
}

export default AdminPageComponent;