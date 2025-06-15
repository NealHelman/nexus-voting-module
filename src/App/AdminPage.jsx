// --- AdminPage.jsx ---  
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { proxyRequest } from 'nexus-module';
import { getVotingConfig, getWalletUserInfo } from '../utils/env';
import { sha256FromFile } from '../utils/ipfs';

const BACKEND_BASE = 'https://65.20.79.65:4006';
const React = NEXUS.libraries.React;

function AdminPageComponent() {
  const {
    components: { TextField, Button, Dropdown, FieldSet, Panel, Tooltip },
    utilities: { apiCall, send, showInfoDialog, showErrorDialog, showSuccessDialog },
  } = NEXUS;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [optionLabels, setOptionLabels] = React.useState(['', '']);
  const [minTrust, setMinTrust] = React.useState(null);
  const [voteFinality, setVoteFinality] = React.useState('one_time');
  const [organizerName, setOrganizerName] = React.useState('');
  const [organizerTelegram, setOrganizerTelegram] = React.useState('');
  const [deadline, setDeadline] = React.useState(null);
  const [analysisLink, setAnalysisLink] = React.useState('');
  const [summaryPro, setSummaryPro] = React.useState('');
  const [summaryCon, setSummaryCon] = React.useState('');
  const [possibleOutcomes, setPossibleOutcomes] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [supportingDocs, setSupportingDocs] = React.useState([]);
  const [byteCount, setByteCount] = React.useState(0);
  const [createdBy, setCreatedBy] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState({});
  const [createdAt, setCreatedAt] = React.useState(null);
  const [creatorGenesis, setCreatorGenesis] = React.useState(null);
  const [jsonCid, setJsonCid] = React.useState('');
  
  const searchParams = new URLSearchParams(window.location.search);
  const isEditing = searchParams.has('edit');
  const editingId = searchParams.get('edit');
  const panelTitle = isEditing
    ? 'Nexus Community On-Chain Voting – Edit Voting Issue'
    : 'Nexus Community On-Chain Voting – Enter New Voting Issue';


  React.useEffect(() => {
    const { ENV, VOTING_SIGCHAIN } = getVotingConfig();
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
    
    const computeHash = async (file) => {
      try {
        const buffer = await file.arrayBuffer();
        return sha256(new Uint8Array(buffer));
      } catch (e) {
        console.error("Hashing failed:", e);
        return null;
      }
    };

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
            setAnalysisLink(config.analysis_link);
            setSupportingDocs(config.supporting_docs || []);
            setCreatorGenesis(config.creator_genesis || null);

            // ✅ Load offloaded fields if IPFS CID is present
            if (config.info_cid) {
              try {
                const ipfsResponse = await axios.get(`https://ipfs.io/ipfs/${config.info_cid}`);
                const jsonInfo = ipfsResponse.data;

                setSummaryPro(jsonInfo.summary_pro || '');
                setSummaryCon(jsonInfo.summary_con || '');
                setPossibleOutcomes(jsonInfo.possible_outcomes || '');
              } catch (ipfsErr) {
                console.error(`Failed to fetch IPFS content for CID ${config.info_cid}:`, ipfsErr);
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

  React.useEffect(() => {
    const computeByteCount = () => {
      const config = {
        title,
        description,
        option_labels: optionLabels,
        min_trust: parseInt(minTrust),
        vote_finality: voteFinality,
        organizer_name: organizerName,
        organizer_telegram: organizerTelegram,
        deadline: parseInt(deadline),
        analysis_link: analysisLink,
        issue_info_cid: `cid://${jsonCid}`,
        created_by: createdBy.trim() || 'unknown',
        creator_genesis: creatorGenesis,
        created_at: createdAt || Math.floor(Date.now() / 1000),
        supporting_docs: supportingDocs,
      };
      const compressed = compressToUTF16(JSON.stringify(config));
      const wrapped = JSON.stringify([{
        name: "config",
        type: "string",
        value: compressed,
        mutable: true
      }]);
      const size = new Blob([wrapped]).size;
      setByteCount(size);
    };
    computeByteCount();
  }, [title, description, optionLabels, minTrust, voteFinality, organizerName, organizerTelegram, deadline, analysisLink, summaryPro, summaryCon, possibleOutcomes, jsonCid]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowedTypes = ['text/markdown', 'text/plain', 'application/pdf'];
    const filtered = selectedFiles.filter(f => allowedTypes.includes(f.type));
    if (filtered.length === 0) return;

    const updatedFiles = [];
    for (const file of filtered) {
      try {
        const sha256 = await computeHash(file);
        if (!sha256) {
          setMessage(`Could not hash ${file.name}. Skipping.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await axios.post('https://ipfs.infura.io:5001/api/v0/add', formData, {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: percent
            }));
          }
        });

        if (!/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(res.data.Hash)) {
          throw new Error('Invalid CID returned from IPFS');
        }

        updatedFiles.push({ name: file.name, cid: res.data.Hash, sha256 });

      } catch (e) {
        console.error('Upload error:', file.name, e);
        setMessage(`Failed to upload ${file.name}`);
      }
    }

    setSupportingDocs(prev => [...prev, ...updatedFiles]);
    setMessage(`${updatedFiles.length} file(s) uploaded to IPFS.`);
  };
 
  const createVote = async () => {
    if (!title.trim() || !description.trim() || optionLabels.length < 2 || optionLabels.some(l => !l.trim())) {
      setMessage('Please fill in the title, description, and at least two valid option labels.');
      return;
    }

    // Construct and upload issue_info.json to IPFS
    const jsonContent = {
      summary_pro: summaryPro,
      summary_con: summaryCon,
      possible_outcomes: possibleOutcomes,
      version: 1,
      created: new Date().toISOString()
    };

    const jsonBlob = new Blob([JSON.stringify(jsonContent)], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', jsonBlob, 'issue_info.json');

    let jsonCid = null;
    try {
      const response = await axios.post('https://ipfs.infura.io:5001/api/v0/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (!cid || !/^[A-Za-z0-9]+$/.test(cid)) {
        showErrorDialog({ message: 'Invalid CID returned from IPFS' });
        return;
      }
      jsonCid = response.data.Hash;
    } catch (err) {
      showErrorDialog({
        message: 'Failed to upload JSON to IPFS',
        note: err?.response?.data?.Message || err.message
      });
      return;
    }

    const config = {
      title,
      description,
      option_labels: optionLabels,
      min_trust: parseInt(minTrust),
      vote_finality: voteFinality,
      organizer_name: organizerName,
      organizer_telegram: organizerTelegram,
      deadline: parseInt(deadline),
      analysis_link: analysisLink,
      issue_info_cid: jsonCid ? `cid://${jsonCid}` : '',
      created_by: createdBy.trim() || 'unknown',
      creator_genesis: creatorGenesis,
      created_at: createdAt || Math.floor(Date.now() / 1000),
      supporting_docs: supportingDocs
    };

    const compressed = compressToUTF16(JSON.stringify(config));
    const wrapped = JSON.stringify([{
      name: "config",
      type: "string",
      value: compressed,
      mutable: true
    }]);

    const payloadSize = new Blob([wrapped]).size;
    setByteCount(payloadSize);
    if (payloadSize > 1024) {
      setMessage(`Data exceeds the 1KB asset storage limit (actual: ${payloadSize} bytes). Please shorten your input.`);
      return;
    }

    try {
      if (editingId) {
        await nexusVotingService.updateVoteViaBackend({ ...config, id: editingId });
        showSuccessDialog({ message: 'Vote updated successfully.' });
        return;
      }
      
      try {
        const recipientAddress = await apiCall(
          'finance/get/account/address', 
          { name: `${VOTING_SIGCHAIN}:default` });
      } catch (e) {
        showErrorDialog({
          message: 'Failed to retrieve Voting Authority account address',
          note: e.message
        });
      }

      try {
        const senderAddress = await apiCall(
          'finance/get/account/address', 
          { name: 'default' });
      } catch (e) {
        showErrorDialog({
          message: 'Failed to retrieve sender account address',
          note: e.message
        });
      }

      const amount = String(2 + optionLabels.length);

      await send({
        sendFrom: senderAddress,
        recipients: [
          {
            address: recipientAddress,
            amount,
            reference: 0,
          },
        ],
        advancedOptions: true,
      });

      showInfoDialog({
        message: 'Waiting for NXS transfer to be detected...'
      });

      const where = `results.contracts.OP=CREDIT AND results.contracts.to=${recipientAddress} AND results.contracts.from=${senderAddress} AND results.contracts.amount=${amount} AND results.confirmations>1`;
      const maxWaitMs = 10 * 60 * 1000;
      const pollIntervalMs = 10000;
      const start = Date.now();

      while (Date.now() - start < maxWaitMs) {
        try {
          const res = await apiCall('ledger/list/transactions', {
            limit: 1,
            where
          });
          if (Array.isArray(res) && res[0]?.txid) {
            await nexusVotingService.createVoteViaBackend(config);
            showSuccessDialog({ message: 'Vote created and transfer confirmed!' });
            return;
          }
        } catch (e) {}
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }

      showErrorDialog({
        message: 'Timeout waiting for NXS transfer. Please try again.'
      });

    } catch (e) {
      showErrorDialog({
        message: 'Error during vote creation',
        note: e.message,
      });
    }
  };

  return (
    <Panel title={panelTitle} icon={{ url: 'react.svg', id: 'icon' }}>
      <FieldSet legend="Basic Info">
        <label htmlFor="titleTextField" style={{ marginBottom: '0.25rem' }}>Title</label>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor="descriptionTextField" style={{ marginBottom: '0.25rem' }}>Description (multiline)</label>
        <TextField multiline label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <label htmlFor="summaryProArgumentsTextField" style={{ marginBottom: '0.25rem' }}>Summary - Pro Arguments (multiline)</label>
        <TextField multiline label="Summary - Pro Arguments" value={summaryPro} onChange={(e) => setSummaryPro(e.target.value)} />
        <label htmlFor="summaryConArgumentsTextField" style={{ marginBottom: '0.25rem' }}>Summary - Con Arguments (multiline)</label>
        <TextField multiline label="Summary - Con Arguments" value={summaryCon} onChange={(e) => setSummaryCon(e.target.value)} />
        <label htmlFor="possibleOutcomesTextField" style={{ marginBottom: '0.25rem' }}>Possible Outcomes (one per line)</label>
        <TextField multiline label="Possible Outcomes (one per line)" value={possibleOutcomes} onChange={(e) => setPossibleOutcomes(e.target.value)} />
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
        <p>
          <label htmlFor="minTrustWeightTextField" style={{ marginBottom: '0.25rem' }}>Minimum Trust Required to Vote</label>
          <TextField label="Minimum Trust Weight" type="number" value={minTrust} onChange={(e) => setMinTrust(e.target.value)} />
        </p>
        <label>
          Voting Deadline (local time):
          <input
            type="datetime-local"
            value={deadline ? new Date(deadline * 1000).toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              const ts = Math.floor(new Date(e.target.value).getTime() / 1000);
              setDeadline(ts);
            }}
            style={{ marginLeft: '1em', marginRight: '1rem' }}
          />
        </label>
      </FieldSet>
      
      <p>
        <label htmlFor="analysisCID" style={{ marginBottom: '0.25rem' }}>CID link to Analysis File on IPFS</label>
        <TextField label="Analysis Link (e.g., cid://...)" value={analysisLink} onChange={(e) => setAnalysisLink(e.target.value)} />
      </p>

      <FieldSet legend="Options">
        {optionLabels.map((label, idx) => (
          <>
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
          </>
        ))}
        <Button onClick={() => setOptionLabels([...optionLabels, ''])}>
          ➕ Add Another Option
        </Button>
      </FieldSet>
      
      <FieldSet legend="Supporting Documents">
        <p>Upload .md, .txt, or .pdf files that explain the issue.</p>
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
                <li key={i}>
                  {doc.name}
                  <button type="button" onClick={async () => {
                    const confirm = window.confirm(`Unpin ${doc.name} from Infura? This will make it less available on IPFS.`);
                    if (!confirm) return;
                    try {
                      const res = await fetch(`${BACKEND_BASE}/unpin`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cid: doc.cid })
                      });
                      const data = await res.json();
                      if (data.success) setMessage(`Unpinned ${doc.name} successfully.`);
                      else throw new Error(data.error || 'Unknown error');
                    } catch (e) {
                      console.error(e);
                      setMessage(`Failed to unpin ${doc.name}: ${e.message}`);
                    }
                  }}>🗑 Unpin</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p>{message}</p>
      </FieldSet>

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