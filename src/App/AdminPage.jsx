// --- AdminPage.jsx ---  
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { proxyRequest } from 'nexus-module';
import { sha256FromFile } from '../utils/ipfs';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_BASE = 'http://65.20.79.65:4006';
const React = NEXUS.libraries.React;

function AdminPageComponent() {
  const {
    components: { TextField, MultilineTextField, Button, Dropdown, FieldSet, Panel, Tooltip },
    utilities: { apiCall, secureApiCall, showInfoDialog, showErrorDialog, showSuccessDialog },
  } = NEXUS;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [optionLabels, setOptionLabels] = React.useState(['', '']);
  const [minTrust, setMinTrust] = React.useState('');
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

  
  const searchParams = new URLSearchParams(window.location.search);
  const isEditing = searchParams.has('edit');
  const editingId = searchParams.get('edit');
  const panelTitle = isEditing
    ? 'Nexus Community On-Chain Voting – Edit Voting Issue'
    : 'Nexus Community On-Chain Voting – Enter New Voting Issue';
  const uuid = uuidv4();

  function formatDateLocal(ts) {
    const date = new Date(ts * 1000);
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset);
    return local.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'
  };

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
        const data = await apiCall("finance/list/accounts/owner?where='results.name=default'", { foo: 'bar' });
        const genesis = parseInt(data?.owner || 0);
        setCreatorGenesis(genesis);
      } catch (e) {
        showErrorDialog({
          message: 'Failed to retrieve genesis',
          note: e.message
        });
      }
    };
    getGenesis();
    
    if (editingId) {
      try {
        apiCall('assets/get/asset', { address: editingId })
          .then(async res => {
            const config = JSON.parse(decompressFromUTF16(res.config));

            setTitle(config.title);
            setDescription(config.description);
            setOptionLabels(config.option_labels);
            setMinTrust(config.min_trust);
            setVoteFinality(config.vote_finality);
            setOrganizerName(config.organizer_name);
            setOrganizerTelegram(config.organizer_telegram);
            setDeadline(config.deadline);
            setSupportingDocs(config.supporting_docs || []);
            setCreatorGenesis(config.creator_genesis || null);

            // ✅ Load offloaded fields if IPFS GUID is present
            if (config.info_guid) {
              try {
                const ipfsResponse = await axios.get(`https://ipfs.io/ipfs/${config.info_guid}`);
                const jsonInfo = ipfsResponse.data;

                setSummaryPro(jsonInfo.summary_pro || '');
                setSummaryCon(jsonInfo.summary_con || '');
                setPossibleOutcomes(jsonInfo.possible_outcomes || '');
              } catch (ipfsErr) {
                console.error(`Failed to fetch IPFS content for GUID ${config.info_guid}:`, ipfsErr);
              }
            }
          })
          .catch(err => console.error('Failed to prefill voting issue fields:', err));
      } catch (e) {
        showErrorDialog({
          message: 'Failed to retrieve voting issue',
          note: e.message
        });
      }
    }
  }, []);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowedTypes = ['text/markdown', 'text/plain', 'application/pdf'];
    const filtered = selectedFiles.filter(f => allowedTypes.includes(f.type));
    if (filtered.length === 0) return;

    const updatedFiles = [];

    for (const file of filtered) {
      try {
        const hash = await sha256FromFile(file);
        if (!hash) {
          setMessage(`Could not hash ${file.name}. Skipping.`);
          continue;
        }

        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]); // strip "data:...base64,"
          reader.onerror = () => reject('FileReader failed');
          reader.readAsDataURL(file);
        });

        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        console.log("filename: ", file.name);
        console.log("type: ", file.type);
        console.log("base64: ", base64);

        const response = await proxyRequest(
          `${BACKEND_BASE}/ipfs/upload`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: {
              name: file.name,
              mimeType: file.type,
              base64
          }
        });
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        if (!response?.data?.success || !response.data.guid) {
          throw new Error(`Invalid response from backend`);
        }

        updatedFiles.push({ name: file.name, guid: response.guid, sha256: hash });

      } catch (e) {
        console.error(`Failed to upload ${file.name}:`, e);
        showErrorDialog({
          message: `Upload failed for ${file.name}`,
          note: e.message || 'Unknown error'
        });
      }
    }

    if (updatedFiles.length > 0) {
      setSupportingDocs(prev => [...prev, ...updatedFiles]);
      setMessage(`${updatedFiles.length} file(s) uploaded to backend.`);
    }
  };
 
  const createVote = async () => {
    if (!title.trim() || !description.trim() || optionLabels.length < 2 || optionLabels.some(l => !l.trim())) {
      setMessage('Please fill in the title, description, and at least two valid option labels.');
      return;
    }
    
    const safeTitle = title.toLowerCase().replace(/\W+/g, '-').substring(0, 32);
    const assetName = `vote-${safeTitle}-${createdAt}-${uuid.slice(0, 8)}`

    const jsonContent = {
      summary_pro: summaryPro,
      summary_con: summaryCon,
      possible_outcomes: possibleOutcomes,
      version: 1,
      created: new Date().toISOString()
    };

    let jsonGuid = null;
    try {
      const uploadRes = await proxyRequest(`${BACKEND_BASE}/ipfs/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          name: 'issue_info.json',
          mimeType: 'application/json',
          base64: btoa(JSON.stringify(jsonContent))
        }
      });

      if (!uploadRes?.data?.success || !uploadRes.data.guid) {
        throw new Error(`Invalid response from backend`);
      }

      jsonGuid = uploadRes.data.guid;
      setJsonGuid(jsonGuid);
    } catch (err) {
      showErrorDialog({
        message: 'Failed to upload issue_info.json to backend',
        note: err?.response?.data?.Message || err.message
      });
      return;
    }

    const flaggedSupportingDocs = supportingDocs.map(doc => ({
      ...doc,
      is_analysis: doc.guid === analysisGuid
    }));

    const config = {
      title,
      description,
      option_labels: optionLabels,
      min_trust: parseInt(minTrust),
      vote_finality: voteFinality,
      organizer_name: organizerName,
      organizer_telegram: organizerTelegram,
      deadline: parseInt(deadline),
      issue_info_guid: jsonGuid,
      created_by: createdBy.trim() || 'unknown',
      creator_genesis: creatorGenesis,
      created_at: createdAt || Math.floor(Date.now() / 1000),
      supporting_docs: flaggedSupportingDocs
    };

    const compressed = compressToUTF16(JSON.stringify(config));
    const assetConfig = [{
      name: assetName,
      type: 'asset',
      format: 'JSON',
      json: [{
        name: 'config',
        type: 'string',
        value: compressed,
        mutable: true
      }],
      mutable: true
    }];


    const payloadSize = new Blob([compressed]).size;
    setByteCount(payloadSize);
    if (payloadSize > 1024) {
      setMessage(`Data exceeds the 1KB asset storage limit (actual: ${payloadSize} bytes). Please shorten your input.`);
      return;
    }

    try {
      const stringifiedAssetConfig = JSON.stringify(assetConfig);
      if (editingId) {
        await nexusVotingService.updateVoteViaBackend({
          assetConfig: stringifiedAssetConfig,
          id: editingId
        });
        showSuccessDialog({ message: 'Vote updated successfully.' });
        return;
      }

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

        const result = response.data ?? response; // fallback if not Axios
        if (!result.success) {
          showErrorDialog({ message: 'Failed sending voting issue creation fee' });
        }
        txidString = result.txid.toString();
        showInfoDialog({ message: "Sending NXS and submitting voting issue config..." });
      } catch (e) {
        showErrorDialog({
          message: 'Error during sending voting issue creation fee',
          note: e.message
        });
      }

      const maxWaitMs = 20 * 60 * 1000;
      const pollIntervalMs = 10000;
      const start = Date.now();

      while (Date.now() - start < maxWaitMs) {
        const res = await apiCall('ledger/get/transaction', { txid: txidString });
        console.log("res: ", res);
        if (res.contracts[0]?.claimed > 0) {
          const result = await nexusVotingService.createVoteViaBackend(stringifiedAssetConfig);
          if (result.success) showSuccessDialog({ 
            message: 'Success!',
            note: `TxID has been claimed! ${txidString}`
          });
          return;
        }
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }

      showErrorDialog({
        message: 'Timeout waiting for NXS transfer. Please try again.'
      });

    } catch (e) {
      showErrorDialog({
        message: 'Error during vote creation',
        note: e.message
      });
    }
  };

  return (
    <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}>
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
      
      <FieldSet legend="Options">
        {optionLabels.map((label, idx) => (
          <React.Fragment key={idx}>
          <label htmlFor={`option${idx + 1}`} style={{ marginBottom: '0.25rem' }}>{`Option ${idx + 1}`}</label>
          <TextField
            key={idx}
            label={`Option ${idx + 1}`}
            value={label}
            onChange={(e) => {
              const updated = [...optionLabels];
              updated[idx] = e.target.value;
              setOptionLabels(updated);
            }}
          />
          </React.Fragment>
        ))}
      <Button
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
        <p>Attach a markdown, text, or PDF file to serve as the primary analysis document. You may also attach additional supporting documents.</p>
        <input
          type="file"
          accept=".md,.txt,.pdf"
          multiple
          onChange={handleFileChange}
        />
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
            <ul>
              {supportingDocs.map((doc, i) => (
                <li key={doc.guid}>
                  <strong>{doc.name}</strong>
                  <label style={{ marginLeft: '1rem', marginRight: '1rem' }}>
                    <input
                      type="radio"
                      name="analysis_file"
                      checked={doc.guid === analysisGuid}
                      onChange={() => setAnalysisGuid(doc.guid)}
                    />
                    Use as Analysis File
                  </label>
                  {uploadProgress[doc.name] >= 0 && (
                    <div style={{ width: '200px', background: '#eee', height: '6px', marginTop: '4px' }}>
                      <div
                        style={{
                          width: `${uploadProgress[doc.name]}%`,
                          background: '#4caf50',
                          height: '100%',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p>{message}</p>
      </FieldSet>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        Submitting this vote will cost {submissionCost} NXS
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
        <Button onClick={createVote} disabled={byteCount > 1024}>Submit Voting Issue</Button>
        <Button>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Return to Voting Page
          </Link>
        </Button>
      </div>
    </Panel>
  );
}

export default AdminPageComponent;