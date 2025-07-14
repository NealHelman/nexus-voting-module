// --- AdminPage.jsx ---  
import { useDispatch, useSelector } from 'react-redux';
import { compressToBase64, decompressFromBase64 } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import axios from 'axios';
import { Link, useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { sha256FromFile } from '../utils/ipfs';
import { Copyright } from '../utils/copyright.js';
import nxsPackage from '../../nxs_package.json' with { type: "json" };

const { version } = nxsPackage;
const BACKEND_BASE = 'http://65.20.79.65:4006';
const React = NEXUS.libraries.React;


function AdminPageComponent() {
  const rehydrated = useSelector(state => state._persist?.rehydrated);
  const { currentIssue } = useSelector(state => state.issue);
  const assetData = currentIssue?.data;
  const { issueId } = useParams();
  
  const {
    components: { TextField, Modal, MultilineTextField, Button, Dropdown, FieldSet, Panel, Switch, Tooltip },
    utilities: { apiCall, proxyRequest, secureApiCall, showInfoDialog, showErrorDialog, showSuccessDialog },
  } = NEXUS;
  
  // Admin state from Redux
  const {
    adminListFetched,
    isEditing,
    editingId,
    title,
    description,
    optionLabels = [],
    minTrust,
    voteFinality,
    organizerName,
    organizerEmail,
    organizerTelegram,
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
    senderAddress,
    votingAuthoritySigchain,
    votingAuthorityAccount,
    donationRecipient,
    donationAmount,
    namedAssetCost,
    namedAccountCost,
    submissionCost
  } = useSelector(state => state.admin);
  
  const _supportingDocs = Array.isArray(supportingDocs) ? supportingDocs : [];

  const dispatch = useDispatch();

  // Setters dispatch Redux actions
  const setAdminListFetched = (value) => dispatch({ type: 'SET_ADMIN_LIST_FETCHED', payload: value });

  // Flags and Miscellaneous
  const [message, setMessage] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [submitButtonTitle, setSubmitButtonTitle] = React.useState('Submit');
  const [isDonating, setIsDonating] = React.useState(false);
  const [userEmailValid, setUserEmailValid] = React.useState(false);

  // User & admin state
  const setIsEditing = (value) => dispatch({ type: 'SET_IS_EDITING', payload: value });
  const setEditingId = (value) => dispatch({ type: 'SET_EDITING_ID', payload: value });
  const setTitle = (value) => dispatch({ type: 'SET_TITLE', payload: value });
  const setDescription = (value) => dispatch({ type: 'SET_DESCRIPTION', payload: value });
  const setOptionLabels = (value) => dispatch({ type: 'SET_OPTION_LABELS', payload: value });
  const setMinTrust = (value) => dispatch({ type: 'SET_MIN_TRUST', payload: value });
  const setVoteFinality = (value) => dispatch({ type: 'SET_VOTE_FINALITY', payload: value });
  const setOrganizerName = (value) => dispatch({ type: 'SET_ORGANIZER_NAME', payload: value });
  const setOrganizerEmail = (value) => dispatch({ type: 'SET_ORGANIZER_EMAIL', payload: value });
  const setOrganizerTelegram = (value) => dispatch({ type: 'SET_ORGANIZER_TELEGRAM', payload: value });
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
  const setVotingAuthoritySigchain = (value) => dispatch({ type: 'SET_VOTING_AUTHORITY_SIGCHAIN', payload: value });
  const setVotingAuthorityAccount = (value) => dispatch({ type: 'SET_VOTING_AUTHORITY_ACCOUNT', payload: value });
  const setDonationRecipient = (page) => dispatch({ type: 'SET_DONATION_RECIPIENT', payload: page });
  const setDonationAmount = (page) => dispatch({ type: 'SET_DONATION_AMOUNT', payload: page });
  const setNamedAssetCost = (value) => dispatch({ type: 'SET_NAMED_ASSET_COST', payload: value });
  const setNamedAccountCost = (value) => dispatch({ type: 'SET_NAMED_ACCOUNT_COST', payload: value });
  const setSubmissionCost = (value) => dispatch({ type: 'SET_SUBMISSION_COST', payload: value });
  
  const navigate = useNavigate();
  const fileInputRef = React.useRef();

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const editingIdFromParams = searchParams.get('edit') || '';
  const inEditMode = !!editingIdFromParams;
  const panelTitle = inEditMode
    ? 'Nexus Community On-Chain Voting – Edit Voting Issue'
    : 'Nexus Community On-Chain Voting – Enter New Voting Issue';

  function isAdminFormEmpty() {
    return !title && !description && optionLabels.every(l => !l.trim());
  }
  
  // ---------- SET FORM MODE PROPERLY FOR BOTH ENTRY PATHS ----------
  React.useEffect(() => {
    if (!rehydrated) return;

    // Always reset form (with default deadline), whether new or edit mode
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
    // Only run on rehydrated/editingIdFromParams change
  }, [dispatch, rehydrated, editingIdFromParams]);

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
      const response = await fetch(`${BACKEND_BASE}/ping`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (err) {
      return false;
    }
  };
  
  function handleNewIssueClick() {
    dispatch({ type: 'RESET_ADMIN_FORM', payload: { deadline: calculateDefaultDeadline() } });

    navigate('/admin');
    let el = null;
    setTimeout(() => {
      el = document.getElementById('top');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100); // slight delay to ensure render
  };

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
    nexusVotingService.getProtectedValues().then(({ data }) => {
      setVotingAuthoritySigchain(data.VOTING_AUTHORITY_SIGCHAIN);
      setVotingAuthorityAccount(data.VOTING_AUTHORITY_ACCOUNT);
      setNamedAssetCost(data.NAMED_ASSET_COST);
      setNamedAccountCost(data.NAMED_ACCOUNT_COST);
    });
  }, [adminListFetched]);

  React.useEffect(() => {
    setSubmissionCost(namedAssetCost + (namedAccountCost * optionLabels.length));
  }, [adminListFetched, namedAssetCost, namedAccountCost, optionLabels.length]);

  React.useEffect(() => {
    const getGenesis = async () => {
      try {
        const data = await apiCall("finance/get/account/owner", { name: 'default' });
        const genesis = data?.owner || 0;
        setCreatorGenesis(genesis);
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
  }, [currentIssue, rehydrated, editingIdFromParams]);
  
  React.useEffect(() => {
    if (editingIdFromParams && assetData) {
      setTitle(assetData.title || '');
      setDescription(assetData.description || '');
      setOptionLabels(assetData.option_labels || []);
      setMinTrust(assetData.min_trust || '');
      setVoteFinality(assetData.vote_finality || 'one_time');
      setOrganizerName(assetData.organizer_name || '');
      setOrganizerEmail(assetData.organizer_email || '');
      setOrganizerTelegram(assetData.organizer_telegram || '');
      setDeadline(assetData.deadline || '');
      setSummaryPro(assetData.summary_pro || '');
      setSummaryCon(assetData.summary_con || '');
      setPossibleOutcomes(assetData.possible_outcomes || '');
      setSupportingDocs(assetData.supporting_docs || []);
      setCreatedBy(assetData.created_by || '');
      setCreatedAt(assetData.created_at || '');
      setCreatorGenesis(assetData.creatorGenesis || '');
      setJsonGuid(assetData.issueInfo || '');
      setVotingAuthoritySigchain(assetData.votingAuthoritySigchain || '');
      setVotingAuthorityAccount(assetData.votingAuthorityAccount || '');
      setNamedAssetCost(assetData.namedAssetCost || '');
      setNamedAccountCost(assetData.namedAccountCost || '');
      setSubmissionCost(assetData.submissionCost || '');
      setSubmitButtonTitle('Update');
    } else {
      setTitle('');
      setDescription('');
      setOptionLabels(['', '']);
      setMinTrust(10000);
      setVoteFinality('one_time');
      setOrganizerName('');
      setOrganizerEmail('');
      setOrganizerTelegram('');
      setDeadline(calculateDefaultDeadline());
      setSummaryPro('');
      setSummaryCon('');
      setPossibleOutcomes('');
      setSupportingDocs([]);
      setCreatedBy('');
      setCreatedAt('');
      setCreatorGenesis('');
      setJsonGuid('');
      setSubmitButtonTitle('Submit');
    }
  }, [editingIdFromParams, assetData]);

  React.useEffect(() => {
    if (!jsonGuid) return;
    if (!adminListFetched && editingId) {
      const fetchSummaries = async () => {
        try {
          const { data } = await proxyRequest(`${BACKEND_BASE}/ipfs/fetch/${jsonGuid}`, { method: 'GET' });
          // ...rest of function...
        } catch (err) {
          // ...
        }
      }
      fetchSummaries();
    }
  }, [adminListFetched, jsonGuid, editingId, proxyRequest, BACKEND_BASE]);

  // ---------- PREPARE FILES FOR UPLOAD AND DISPLAY FILENAMES ----------
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowedExtensions = ['md', 'txt', 'pdf', 'doc', 'docx'];
    const filteredFiles = selectedFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return allowedExtensions.includes(ext);
    });

    const docsWithMeta = await Promise.all(filteredFiles.map(async (file) => {
      if (file instanceof Blob) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => reject('FileReader failed');
          reader.readAsDataURL(file);
        });
        const sha256 = await sha256FromFile(file);
        return {
          name: file.name,
          guid: crypto.randomUUID(),
          type: file.type,
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

  const createVote = async () => {
    setIsSubmitting(true);
    setMessage('Please wait while the voting issue data is submmitted...<br />First, the NXS must be claimed by the Voting Authority...<br />Then, several objects need to be written to the blockchain.<br />PLEASE BE PATIENT.');
    if (!title.trim() || !description.trim() || optionLabels.length < 2 || optionLabels.some(l => !l.trim())) {
      setMessage('Please fill in the title, description, and at least two valid option labels.');
      return;
    }
    
    let assetName = '';
    let issueInfoGuid = '';
    let optionAccounts = [];
    let slugs = [];
    let uploadedDocs = [];
    if (!editingIdFromParams) {
      const safeTitle = title.toLowerCase().replace(/\W+/g, '-').substring(0, 32);
      let guid = crypto.randomUUID();
      assetName = `vote-${safeTitle}-${createdAt}-${guid.slice(0, 8)}`

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
      slugs = assetData.account_slugs;
    }
    
    const config = {
      description,
      summary_pro: summaryPro,
      summary_con: summaryCon,
      possible_outcomes: possibleOutcomes,
      option_labels: optionLabels,
      account_slugs: slugs,
      account_addresses: assetData.account_addresses,
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
      issueInfo: issueInfoGuid,
      creatorGenesis
    };
    
    console.log('[createVote] assetConfig: ', assetConfig);

    setIsUploading(true);
    let foundBlob = false;

    for (const doc of supportingDocs) {
      if (doc.file instanceof Blob) {
        foundBlob = true;
        try {
          const reader = new FileReader();
          const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = () => reject('FileReader failed');
            reader.readAsDataURL(doc.file);
          });

          const response = await proxyRequest(
            `${BACKEND_BASE}/ipfs/upload`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              data: {
                name: doc.name,
                guid: doc.guid,
                mimeType: doc.type,
                base64
              }
            }
          );

          if (!response?.data?.success) {
            throw new Error(`Failed to upload ${doc.name}`);
          }

          uploadedDocs.push({
            name: doc.name,
            guid: doc.guid,
            sha256: await sha256FromFile(doc.file),
            is_analysis: doc.guid === analysisGuid
          });
        } catch (e) {
          showErrorDialog({ message: `Upload failed for ${doc.name}`, note: e.message });
          setIsUploading(false);
          return;
        }
      }
    }

    setIsUploading(false);

    if (!foundBlob) {
      setSupportingDocs([]);
    } else {
      setSupportingDocs(uploadedDocs);
    }
      
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
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.6)', // optional dim overlay
            zIndex: 9999
          }}>
            <div className="spinner" />
          </div>
        )}
        <FieldSet legend="Basic Info">
          <label htmlFor="titleTextField" style={{ marginBottom: '0.25rem' }}>Title</label>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label htmlFor="descriptionTextField" style={{ marginBottom: '0.25rem' }}>Description (multiline)</label>
          <MultilineTextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <label htmlFor="summaryProArgumentsTextField" style={{ marginBottom: '0.25rem' }}>Summary - Pro Arguments (multiline)</label>
          <MultilineTextField label="Summary - Pro Arguments" value={summaryPro} onChange={(e) => setSummaryPro(e.target.value)} />
          <label htmlFor="summaryConArgumentsTextField" style={{ marginBottom: '0.25rem' }}>Summary - Con Arguments (multiline)</label>
          <MultilineTextField label="Summary - Con Arguments" value={summaryCon} onChange={(e) => setSummaryCon(e.target.value)} />
          <label htmlFor="possibleOutcomesTextField" style={{ marginBottom: '0.25rem' }}>Possible Outcomes (one per line)</label>
          <MultilineTextField label="Possible Outcomes (one per line)" value={possibleOutcomes} onChange={(e) => setPossibleOutcomes(e.target.value)} />
        </FieldSet>

        <FieldSet legend="Organizer Details">
          <label htmlFor="organizerNameTextField" style={{ marginBottom: '0.25rem' }}>Organizer Name</label>
          <TextField label="Organizer Name" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
          <label htmlFor="organizerEmailTextField" style={{ marginBottom: '0.25rem' }}>Organizer Email</label>
          <TextField label="Organizer Email" value={organizerEmail} onChange={(e) => setOrganizerEmail(e.target.value)} />
          <label htmlFor="telegramHandleTextField" style={{ marginBottom: '0.25rem' }}>Telegram Handle (optional)</label>
          <TextField label="Telegram Handle (optional)" value={organizerTelegram} onChange={(e) => setOrganizerTelegram(e.target.value)} />
        </FieldSet>
        
        <FieldSet legend="Voting Configuration">
          <label htmlFor="voteFinality" style={{ marginBottom: '0.25rem', marginRight: '1rem' }}>Can People Change Their Vote?</label>
          <Dropdown label="Vote Finality">
              <select  value={voteFinality} onChange={e => setVoteFinality(e.target.value)}>
                <option value="one_time">One-Time Vote</option>
                <option value="changeable">Changeable Vote</option>
              </select>
          </Dropdown>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="minTrustWeightTextField" style={{ marginBottom: '0.25rem' }}>Minimum Trust Required to Vote</label>
            <TextField label="Minimum Trust Weight" type="number" value={minTrust} onChange={(e) => setMinTrust(e.target.value)} />
          </div>
          <label>
            Voting Deadline (local time):
            <input
              type="datetime-local"
              value={deadline ? formatDateLocal(deadline) : ''}
              onChange={(e) => {
                const ts = Math.floor(new Date(e.target.value).getTime() / 1000); // converts local to UTC
                setDeadline(ts);
              }}
              style={{ marginLeft: '1em', marginRight: '1rem' }}
            />
          </label>
        </FieldSet>
        
        <FieldSet legend="Voting Options">
        {isEditing && (
          <div style={{
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'center',
            textAlign: 'center'
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
                marginBottom: '1rem',
                gap: '0.5rem',
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <label htmlFor={`option${idx + 1}`} style={{ display: 'block', marginBottom: '0.25rem' }}>
                  {`Voting Option ${idx + 1}`}
                </label>
                <TextField
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
                  size="sm"
                  variant="destructive"
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
        <Button
          disabled={isEditing}
          onClick={() => {
            const newOptionLabels = [...optionLabels, ''];
            setOptionLabels(newOptionLabels);
            setSubmissionCost(namedAssetCost + (namedAccountCost * optionLabels.length));

          }}
        >
          ➕ Add Another Option
        </Button>
        </FieldSet>
        
        <FieldSet legend="Supporting Documents">
          <p>Attach a markdown, text, PDF, or Word file to serve as the primary analysis document. You may also attach additional supporting documents.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.pdf, .doc, .docx"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          {/* Visible button that triggers file input */}
          <Button
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
          {Object.entries(uploadProgress).map(([filename, percent]) => (
            <div key={filename} style={{ margin: '0.5em 0' }}>
              <strong>{filename}</strong>
              <progress value={percent} max="100" style={{ marginLeft: '1em' }} />
              <span> {percent}%</span>
            </div>
          ))}

          {_supportingDocs.length > 0 && (
            <div>
              <h4>Uploaded Supporting Documents:</h4>
              <ul className="uploaded-files-list">
                {_supportingDocs.map((doc, i) => {
                  const isChecked = analysisGuid === doc.guid;
                  return (
                    <li className="uploaded-file-row" key={doc.guid}>
                      <span className="file-name">{doc.name}</span>
                      <span className="file-actions">
                        {supportingDocs.length > 1 && doc.guid !== analysisGuid && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await proxyRequest(`${BACKEND_BASE}/ipfs/delete/${doc.guid}`, { method: 'DELETE' });
                                if (response?.data?.success) {
                                  setSupportingDocs(prev => prev.filter(d => d.guid !== doc.guid));
                                } else {
                                  showErrorDialog({ message: 'Failed to delete file', note: response?.data?.error || 'Unknown error' });
                                }
                              } catch (e) {
                                showErrorDialog({ message: 'Error deleting file', note: e.message });
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </span>
                      <span className="file-analysis-switch">
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
        <div style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
          <p dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        {!editingIdFromParams && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            Submitting this vote will cost {submissionCost} NXS
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <Button onClick={createVote} disabled={isSubmitting}>
            { submitButtonTitle } Voting Issue
          </Button>
          <Button disabled={isSubmitting} onClick={handleNewIssueClick}>Enter a New Issue</Button>
          <Button disabled={isSubmitting}>
            <Link onClick={handleReturnToVotingPageClick} style={{ textDecoration: 'none', color: 'inherit' }}>
              Return to Voting Page
            </Link>
          </Button>
        </div>
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

export default AdminPageComponent;