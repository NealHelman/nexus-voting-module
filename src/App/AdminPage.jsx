// --- AdminPage.jsx ---  
import { compressToBase64, decompressFromBase64 } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import axios from 'axios';
import { Link, useNavigate, useSearchParams  } from 'react-router-dom';
import { proxyRequest } from 'nexus-module';
import { sha256FromFile } from '../utils/ipfs';

const BACKEND_BASE = 'http://65.20.79.65:4006';
const React = NEXUS.libraries.React;

function AdminPageComponent() {
  const {
    components: { TextField, MultilineTextField, Button, Dropdown, FieldSet, Panel, Switch, Tooltip },
    utilities: { apiCall, secureApiCall, showInfoDialog, showErrorDialog, showSuccessDialog },
  } = NEXUS;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [optionLabels, setOptionLabels] = React.useState(['', '']);
  const [minTrust, setMinTrust] = React.useState('10000');
  const [voteFinality, setVoteFinality] = React.useState('one_time');
  const [organizerName, setOrganizerName] = React.useState('');
  const [organizerTelegram, setOrganizerTelegram] = React.useState('');
  const [deadline, setDeadline] = React.useState('');
  const [summaryPro, setSummaryPro] = React.useState('');
  const [summaryCon, setSummaryCon] = React.useState('');
  const [possibleOutcomes, setPossibleOutcomes] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [supportingDocs, setSupportingDocs] = React.useState([]);
  const [byteCount, setByteCount] = React.useState(0);
  const [createdBy, setCreatedBy] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState({});
  const [createdAt, setCreatedAt] = React.useState('');
  const [creatorGenesis, setCreatorGenesis] = React.useState('');
  const [jsonGuid, setJsonGuid] = React.useState('');
  const [analysisGuid, setAnalysisGuid] = React.useState('');
  const [votingAuthoritySigchain, setVotingAuthoritySigchain] = React.useState('');
  const [votingAuthorityAccount, setVotingAuthorityAccount] = React.useState('');
  const [namedAssetCost, setNamedAssetCost] = React.useState(0);
  const [namedAccountCost, setNamedAccountCost] = React.useState(0);
  const [submissionCost, setSubmissionCost] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [submitButtonTitle, setSubmitButtonTitle] = React.useState('Submit');
  
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.has('edit');
  const editingId = searchParams.get('edit');
  const panelTitle = isEditing
    ? 'Nexus Community On-Chain Voting – Edit Voting Issue'
    : 'Nexus Community On-Chain Voting – Enter New Voting Issue';
  const navigate = useNavigate();
  const fileInputRef = React.useRef();

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
  
  function handleNewIssueClick() {
    setTitle('');
    setDescription('');
    setOptionLabels(['', '']);
    setMinTrust('10000');
    setVoteFinality('one_time');
    setOrganizerName('');
    setOrganizerTelegram('');
    setDeadline('');
    setSupportingDocs([]);
    setJsonGuid('');
    setAnalysisGuid('');
    setSubmitButtonTitle('Submit');
    setMessage('');
    setSummaryPro('');
    setSummaryCon('');
    setPossibleOutcomes('');
    setCreatedAt('');


    navigate('/admin');
    setTimeout(() => {
      const el = document.getElementById('top');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100); // slight delay to ensure render
  };

  React.useEffect(() => {
    const debugValues = { editingId };
    console.log('Updating window.myModuleDebug:', debugValues);
    window.myModuleDebug = debugValues;
  }, [editingId]);
  
  React.useEffect(() => {
    nexusVotingService.getProtectedValues().then(({ data }) => {
      setVotingAuthoritySigchain(data.VOTING_AUTHORITY_SIGCHAIN);
      setVotingAuthorityAccount(data.VOTING_AUTHORITY_ACCOUNT);
      setNamedAssetCost(data.NAMED_ASSET_COST);
      setNamedAccountCost(data.NAMED_ACCOUNT_COST);
    });
  }, []);

  React.useEffect(() => {
    setSubmissionCost(namedAssetCost + (namedAccountCost * optionLabels.length));
  }, [namedAssetCost, namedAccountCost, optionLabels.length]);

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
  if (!creatorGenesis) return;

  setDeadline(calculateDefaultDeadline());

  if (editingId) {
    const fetchAsset = async () => {
      setSubmitButtonTitle('Update');
      try {
        // Fetch the on-chain asset (contains issueInfo, title, deadline, etc)
        const assetData = await apiCall('assets/get/asset', { verbose: 'summary', address: editingId });

        setTitle(assetData.title || '');
        setDeadline(assetData.deadline);
        setCreatorGenesis(assetData.creatorGenesis || null);

        const issueInfoGuid = assetData.issueInfo;
        setJsonGuid(issueInfoGuid || null);

        if (issueInfoGuid) {
          // Fetch the off-chain config from your backend (it returns { base64: ... })
          const { data } = await proxyRequest(`${BACKEND_BASE}/ipfs/fetch/${issueInfoGuid}`, { method: 'GET' });

          try {
            const jsonStr = atob(data.base64); // base64 decode
            const config = JSON.parse(jsonStr);
            
            console.log('fetchAsset::config: ', config);

            setDescription(config.description || '');
            setSummaryPro(config.summary_pro || '');
            setSummaryCon(config.summary_con || '');
            setPossibleOutcomes(config.possible_outcomes || '');
            setOptionLabels(config.option_labels || []);
            setMinTrust(config.min_trust || '');
            setVoteFinality(config.vote_finality || '');
            setOrganizerName(config.organizer_name || '');
            setOrganizerTelegram(config.organizer_telegram || '');
            setSupportingDocs(config.supporting_docs || []);
            const analysisGuid = config.supporting_docs?.find(doc => doc.is_analysis)?.guid;
            setAnalysisGuid(analysisGuid || null);
          } catch (e) {
            console.error('Failed to parse base64-encoded JSON:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load vote asset:', err);
      }
    };

    fetchAsset();
  }
}, [creatorGenesis, editingId]);
  
  React.useEffect(() => {
    if (!jsonGuid) return;
    if (editingId) {
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
      };

      fetchSummaries();
    }
  }, [jsonGuid, editingId]);
  
  React.useEffect(() => {
    console.log('supportingDocs updated: ', supportingDocs);
  }, [supportingDocs]);
  
  const handleFileChange = async (e) => {
    console.log('handleFileChange called with files:', e.target.files?.length);
    
    // Log the actual file names to debug
    if (e.target.files) {
      Array.from(e.target.files).forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
      });
    }
  
    setIsUploading(true);
    
    try {
      const selectedFiles = Array.from(e.target.files);
      const allowedTypes = ['text/markdown', 'text/x-markdown', 'text/plain', 'application/pdf'];
      const allowedExtensions = {
        md: 'text/markdown',
        txt: 'text/plain',
        pdf: 'application/pdf'
      };

      const filesWithMime = Array.from(e.target.files).map(file => {
        let mimeType = file.type;
        if (!allowedTypes.includes(mimeType)) {
          const ext = file.name.split('.').pop().toLowerCase();
          mimeType = allowedExtensions[ext] || '';
        }
        return { file, mimeType };
      });
      
      if (filesWithMime.length === 0) {
        setMessage('No valid files selected. Please choose .md, .txt, or .pdf files.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploadProgress({});
        return;
      }

      const updatedFiles = [];

      let guid = "";
      for (const { file, mimeType } of filesWithMime) {
        try {
          const hash = await sha256FromFile(file);
          if (!hash) {
            onError(`Could not hash ${file.name}. Skipping.`);
            continue;
          }
          guid = crypto.randomUUID();
          
          console.log(`Hash for ${file.name}: ${hash}`);
          console.log(`GUID for ${file.name}: ${guid}`);

          const reader = new FileReader();
          const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = () => reject('FileReader failed');
            reader.readAsDataURL(file);
          });

          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const response = await proxyRequest(
            `${BACKEND_BASE}/ipfs/upload`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              data: {
                name: file.name,
                guid,
                mimeType,
                base64
            }
          });
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          
          if (!response?.data?.success) {
            throw new Error(`Invalid response from backend for ${file.name}`);
          }

          console.log(`Successfully uploaded ${file.name} with guid: ${guid}`);
          updatedFiles.push({ name: file.name, guid, sha256: hash });
        } catch (e) {
          console.error(`Failed to upload ${file.name}:`, e);
          setMessage(`Upload failed for ${file.name}: ${e.message || 'Unknown error'}`);
        }
      }
      if (updatedFiles.length > 0) {
        setSupportingDocs(prev => {
          const existingGuids = new Set(prev.map(d => d.guid));
          // Avoid duplicates
          const onlyNew = updatedFiles.filter(doc => !existingGuids.has(doc.guid));
          return [...prev, ...onlyNew];
        });
        setMessage(`${updatedFiles.length} file(s) uploaded successfully.`);
      } else {
        setMessage('No files were uploaded successfully.');
      }
    } catch (error) {
      console.error('Error in handleFileChange:', error);
      setMessage(`Upload error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      console.log('The fileInputRef.current.value was set to empty string.');
      setUploadProgress({});
    }
  };

  const createVote = async () => {
    setIsSubmitting(true);
    setMessage('Please wait while the voting issue data is submmitted...<br />First, the NXS must be claimed by the Voting Authority...<br />Then, several objects need to be written to the blockchain.<br />PLEASE BE PATIENT.');
    if (!title.trim() || !description.trim() || optionLabels.length < 2 || optionLabels.some(l => !l.trim())) {
      setMessage('Please fill in the title, description, and at least two valid option labels.');
      return;
    }
    
    const safeTitle = title.toLowerCase().replace(/\W+/g, '-').substring(0, 32);
    let guid = crypto.randomUUID();
    const assetName = `vote-${safeTitle}-${createdAt}-${guid.slice(0, 8)}`

    const optionAccounts = optionLabels.map((label, idx) => {
      const optionSafe = label.toLowerCase().replace(/\W+/g, '-').substring(0, 20);
      guid = crypto.randomUUID();
      return {
        name: `opt-${optionSafe}-${guid.slice(0, 8)}`,
        label: label.trim()
      };
    });
    
    const slugs = optionAccounts.map(acc => acc.name);
    console.log('[createVote] account slugs: ', slugs);

    const issueInfoGuid = crypto.randomUUID();
    const assetConfig = {
      name: assetName,
      title,
      deadline: parseInt(deadline),
      issueInfo: issueInfoGuid,
      creatorGenesis
    };
    
    console.log('[createVote] assetConfig: ', assetConfig);

   try {
      let resultToUse = {};
      if (editingId) {
        try {
          const assetId = editingId;
          const updateResult = await nexusVotingService.updateVoteViaBackend(assetId, assetConfig, optionAccounts);
          if (updateResult.success) showSuccessDialog({ 
            message: 'Success!',
            note: 'Vote updated...'
          });
          resultToUse = updateResult;
        } catch (e) {
          showErrorDialog({
            message: 'Error updating voting issue',
            note: e.message
          });
        }
      } else {
        const senderAddress = await apiCall('finance/get/account/address', {
          name: 'default'
        });
        
        let txidString = '';
        try {
          const response = await secureApiCall('finance/debit/account', {
            from: senderAddress.address,
            to: votingAuthorityAccount,
            amount: submissionCost
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

          // Now your check will work as desired
          if (!outputObj.success) {
            showErrorDialog({
              message: "NXS debit failed",
              note: "No txid returned.",
            });
            return;
          }
          txidString = outputObj.txid.toString();
          console.log('txidString: ', txidString);
        } catch (e) {
          showErrorDialog({
            message: 'Error during sending voting issue creation fee',
            note: e.message
          });
          return;
        }

        const serviceRes = await nexusVotingService.createVoteViaBackend(txidString, assetConfig, optionAccounts);
        if (!serviceRes.success) {
          showErrorDialog({ 
            message: 'Failed to create vote asset',
            note: serviceRes.error
          });
          return;
        }
        resultToUse = serviceRes;
      }
      console.log('[createVote] resultToUse: ', resultToUse);

      // Write issue_info only after asset and accounts have been created
      const flaggedSupportingDocs = supportingDocs.map(doc => ({
        ...doc,
        is_analysis: doc.guid === analysisGuid
      }));
      
      console.log('[createVote] flaggedSupportingDocs: ', flaggedSupportingDocs);
      
      const config = {
        description,
        summary_pro: summaryPro,
        summary_con: summaryCon,
        possible_outcomes: possibleOutcomes,
        option_labels: optionLabels,
        account_slugs: slugs,
        account_addresses: resultToUse.accounts,
        min_trust: parseInt(minTrust),
        vote_finality: voteFinality,
        organizer_name: organizerName,
        organizer_telegram: organizerTelegram,
        created_by: createdBy.trim() || 'unknown',
        created_at: createdAt || Math.floor(Date.now() / 1000),
        supporting_docs: flaggedSupportingDocs,
        version: 1,
        created: new Date().toISOString()
      };
      
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
      return;
    } catch (e) {
      showErrorDialog({
        message: 'Error during vote creation',
        note: e.message
      });
    } finally {
      setIsSubmitting(false);
      setMessage('Submission complete!');
    }
  };

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
          <div style={{ display : isEditing ? 'inline' : 'none', marginBottom: '1rem', display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
            Unfortunately, the Nexus API  does not currently provide a mechanism for changing the voting option labels while editing the voting option.
          </div>
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

          {supportingDocs.length > 0 && (
            <div>
              <h4>Uploaded Supporting Documents:</h4>
              <ul className="uploaded-files-list">
                {supportingDocs.map((doc, i) => {
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
                              setAnalysisGuid(prev => (prev === doc.guid ? null : doc.guid));
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
        {!editingId && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            Submitting this vote will cost {submissionCost} NXS
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <Button onClick={createVote} disabled={byteCount > 1024 || isSubmitting}>
            { submitButtonTitle } Voting Issue
          </Button>
          <Button disabled={isSubmitting} onClick={handleNewIssueClick}>Enter a New Issue</Button>
          <Button disabled={isSubmitting}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Return to Voting Page
            </Link>
          </Button>
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 'small' }}>
        © 2025, Neal Helman - Created with lots of help from AI.
      </div>
    </Panel>
  );
}

export default AdminPageComponent;