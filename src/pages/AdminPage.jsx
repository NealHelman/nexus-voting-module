// --- AdminPage.jsx ---
const {
  libraries: { React, useState, useEffect },
  components: {
    TextField, TextArea, Button, Dropdown, Panel, Tooltip,
  },
  utilities: {
    apiCall, send, showInfoDialog, showErrorDialog, showSuccessDialog,
  },
} = NEXUS;

import { compressToUTF16 } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import { MIN_TRUST_WEIGHT } from '../constants';
import { getVotingConfig } from '../utils/env';
import axios from 'axios';

const { ENV, VOTING_SIGCHAIN } = getVotingConfig();
const BACKEND_BASE = 'https://65.20.79.65:4006';

const AdminPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [optionLabels, setOptionLabels] = useState(['', '']);
  const [minTrust, setMinTrust] = useState(MIN_TRUST_WEIGHT);
  const [voteFinality, setVoteFinality] = useState('one_time');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerTelegram, setOrganizerTelegram] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [analysisLink, setAnalysisLink] = useState('');
  const [summaryPro, setSummaryPro] = useState('');
  const [summaryCon, setSummaryCon] = useState('');
  const [possibleOutcomes, setPossibleOutcomes] = useState('');
  const [message, setMessage] = useState('');
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [byteCount, setByteCount] = useState(0);
  const [createdBy, setCreatedBy] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [createdAt, setCreatedAt] = useState(null);
  const [creatorGenesis, setCreatorGenesis] = useState(null);


  useEffect(() => {
    apiCall('sessions/status/local')
      .then((res) => setCreatorGenesis(res?.genesis))
      .catch(() => setCreatorGenesis(null));

    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get('edit');
    if (editId) {
      apiCall('assets/get/asset', { address: editId })
        .then(res => {
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
          setSummaryPro(config.summary_pro);
          setSummaryCon(config.summary_con);
          setPossibleOutcomes(config.possible_outcomes);
          setSupportingDocs(config.supporting_docs || []);
          setCreatedAt(config.created_at || Math.floor(Date.now() / 1000));
          setCreatedBy(config.created_by || '');
          setCreatorGenesis(config.creator_genesis || null);
        })
        .catch(err => console.error('Failed to prefill:', err));
    }
  }, []);

  useEffect(() => {
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
        summary_pro: summaryPro,
        summary_con: summaryCon,
        possible_outcomes: possibleOutcomes,
        created_by: createdBy.trim() || 'unknown',
        creator_genesis: creatorGenesis,
        created_at: createdAt || Math.floor(Date.now() / 1000),
        supporting_docs: supportingDocs,
        creator_genesis: creatorGenesis
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
  }, [title, description, optionLabels, minTrust, voteFinality, organizerName, organizerTelegram, deadline, analysisLink, summaryPro, summaryCon, possibleOutcomes]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowedTypes = ['text/markdown', 'text/plain', 'application/pdf'];
    const filtered = selectedFiles.filter(f => allowedTypes.includes(f.type));
    if (filtered.length === 0) return;
  
    const updatedFiles = [];
    for (const file of filtered) {
      try {
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
        updatedFiles.push({ name: file.name, cid: res.data.Hash });
      } catch (e) {
        console.error('Upload error:', file.name, e);
        setMessage(`Failed to upload ${file.name}`);
      }
    }
  
    setSupportingDocs(prev => [...prev, ...updatedFiles]);
    setMessage(`${updatedFiles.length} file(s) uploaded to IPFS.`);
  };
 
  const searchParams = new URLSearchParams(window.location.search);
  const editingId = searchParams.get('edit');

  const createVote = async () => {
    if (!title.trim() || !description.trim() || optionLabels.length < 2 || optionLabels.some(l => !l.trim())) {
      setMessage('Please fill in the title, description, and at least two valid option labels.');
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
      summary_pro: summaryPro,
      summary_con: summaryCon,
      possible_outcomes: possibleOutcomes,
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

      const { address: recipientAddress } = await apiCall('finance/get/account/address', {
        name: `${VOTING_SIGCHAIN}:default`
      });

      const { address: senderAddress } = await apiCall('finance/get/account/address', {
        name: 'default',
      });

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
    <Panel title="Create a New Voting Issue">
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <TextArea label="Summary - Pro Arguments" value={summaryPro} onChange={(e) => setSummaryPro(e.target.value)} />
      <TextArea label="Summary - Con Arguments" value={summaryCon} onChange={(e) => setSummaryCon(e.target.value)} />
      <TextArea label="Possible Outcomes (one per line)" value={possibleOutcomes} onChange={(e) => setPossibleOutcomes(e.target.value)} />
      <TextField label="Created By (your Nexus username)" value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />

      <TextField label="Organizer Name" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
      <TextField label="Telegram Handle (optional)" value={organizerTelegram} onChange={(e) => setOrganizerTelegram(e.target.value)} />
      <Dropdown
        label="Vote Finality"
        value={voteFinality}
        options={[
          { label: 'One-Time Vote', value: 'one_time' },
          { label: 'Changeable Vote', value: 'changeable' },
        ]}
        onChange={(e) => setVoteFinality(e.target.value)}
      />
      <TextField label="Minimum Trust Weight" type="number" value={minTrust} onChange={(e) => setMinTrust(e.target.value)} />
      <label>
        Deadline (local time):
        <input
          type="datetime-local"
          value={deadline ? new Date(deadline * 1000).toISOString().slice(0, 16) : ''}
          onChange={(e) => {
            const ts = Math.floor(new Date(e.target.value).getTime() / 1000);
            setDeadline(ts);
          }}
          style={{ marginLeft: '1em' }}
        />
      </label>
      <TextField label="Analysis Link (e.g., cid://...)" value={analysisLink} onChange={(e) => setAnalysisLink(e.target.value)} />

      {optionLabels.map((label, idx) => (
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
      ))}
      <p><strong>Attach Supporting Documents:</strong> Upload .md, .txt, or .pdf files that explain the issue.</p>
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
      <Button onClick={createVote} disabled={byteCount > 1024}>Submit Voting Issue</Button>
    </Panel>
  );
};

export default AdminPage;
