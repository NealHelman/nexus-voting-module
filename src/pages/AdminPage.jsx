// --- Pages: AdminPage.jsx ---
import React, { useState, useEffect } from 'react';
import { compressToUTF16 } from 'lz-string';
import nexusVotingService from '../services/nexusVotingService';
import { MIN_TRUST_WEIGHT } from '../constants';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const AdminPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [optionLabels, setOptionLabels] = useState(['', '']);
  const [minTrust, setMinTrust] = useState(MIN_TRUST_WEIGHT);
  const [voteFinality, setVoteFinality] = useState('one_time');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerTelegram, setOrganizerTelegram] = useState('');
  const [deadline, setDeadline] = useState('');
  const [analysisLink, setAnalysisLink] = useState('');
  const [summaryPro, setSummaryPro] = useState('');
  const [summaryCon, setSummaryCon] = useState('');
  const [possibleOutcomes, setPossibleOutcomes] = useState('');
  const [message, setMessage] = useState('');
  const [byteCount, setByteCount] = useState(0);
  const [fieldSizes, setFieldSizes] = useState({});
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const prefill = async () => {
      if (!editId) return;
      try {
        const res = await window.API.get(`/register/read/${editId}`);
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        const config = JSON.parse(require('lz-string').decompressFromUTF16(data.config));
        setTitle(config.title || '');
        setDescription(config.description || '');
        setOptionLabels(config.option_labels || ['', '']);
        setMinTrust(config.min_trust || MIN_TRUST_WEIGHT);
        setVoteFinality(config.vote_finality || 'one_time');
        setOrganizerName(config.organizer_name || '');
        setOrganizerTelegram(config.organizer_telegram || '');
        setDeadline(config.deadline || '');
        setAnalysisLink(config.analysis_link || '');
        setSummaryPro(config.summary_pro || '');
        setSummaryCon(config.summary_con || '');
        setPossibleOutcomes(config.possible_outcomes || '');
        setEditing(true);
        setEditingId(editId);
      } catch (e) {
        console.error('Failed to load existing vote:', e);
      }
    };
    prefill();
  }, [editId]);

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
        created_by: window?.USER?.genesis || 'unknown',
        created_at: Math.floor(Date.now() / 1000),
        supporting_docs: files.map(file => ({ name: file.name, cid: file.cid || 'placeholder' }))
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
      setFieldSizes({
        wrapped_payload: size,
        compressed_config: new Blob([compressed]).size
      });
    };
    computeByteCount();
  }, [title, description, optionLabels, minTrust, voteFinality, organizerName, organizerTelegram, deadline, analysisLink, summaryPro, summaryCon, possibleOutcomes, files]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowedTypes = ['text/markdown', 'text/plain', 'application/pdf'];
    const filtered = selectedFiles.filter(f => allowedTypes.includes(f.type));
    if (filtered.length === 0) return;

    setUploading(true);
    try {
      const updatedFiles = await Promise.all(filtered.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post('https://ipfs.infura.io:5001/api/v0/add', formData);
        return { name: file.name, cid: res.data.Hash };
      }));
      setFiles(prev => [...prev, ...updatedFiles]);
    } catch (e) {
      setMessage('Failed to upload file to IPFS.');
    } finally {
      setUploading(false);
    }
  };

  const createVote = async () => {
    if (!title.trim() || !description.trim() || optionLabels.length < 2 || optionLabels.some(l => !l.trim())) {
      setMessage('Please fill in the title, description, and at least two valid option labels.');
      return;
    }

    const pin = await window.getPIN('This will send ' + (2 + optionLabels.length) + ' NXS to NexusCommunityVoting:default.');
    if (!pin) {
      setMessage('Vote creation cancelled.');
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
      created_by: window?.USER?.genesis || 'unknown',
      created_at: Math.floor(Date.now() / 1000),
      supporting_docs: files
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
      await window.API.post('/finance/debit/account', {
        pin,
        amount: 2 + optionLabels.length,
        to: 'VoteTestAuthority:default'
      });

      const optionAccounts = optionLabels.map(() => '');
      const issue = {
        ...config,
        option_accounts: optionAccounts
      };

      editing
        ? await nexusVotingService.updateVoteViaBackend({ ...issue, id: editingId })
        : await nexusVotingService.createVoteViaBackend(issue);

      setMessage(`Vote creation request sent to Voting Authority.\nOptions:\n${optionLabels.map((label) => `  ${label}`).join('\\n')}`);
    } catch (e) {
      setMessage(`Error: ${e.message}`);
    }
  };

  return (
    <div>
      $1
      <p>You may upload supporting documents (PDF, Markdown, or TXT only). You may also unpin previously uploaded files from Infura if you're the original submitter:</p>
      <input type="file" accept=".pdf,.md,.txt" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
      {editing && supporting_docs?.length > 0 && (
        <ul>
          {supporting_docs.map((doc, i) => (
            <li key={i}>{doc.name} <button type="button" onClick={async () => {
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
            }}>🗑 Unpin</button></li>
          ))}
        </ul>
      )}
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Description (markdown supported)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <textarea placeholder="Summary - Pro Arguments" value={summaryPro} onChange={(e) => setSummaryPro(e.target.value)} />
      <textarea placeholder="Summary - Con Arguments" value={summaryCon} onChange={(e) => setSummaryCon(e.target.value)} />
      <textarea placeholder="Possible Outcomes (one per line)" value={possibleOutcomes} onChange={(e) => setPossibleOutcomes(e.target.value)} />
      {optionLabels.map((label, idx) => (
        <input key={idx} value={label} onChange={(e) => {
          const copy = [...optionLabels];
          copy[idx] = e.target.value;
          setOptionLabels(copy);
        }} placeholder={`Option ${idx + 1}`} />
      ))}
      <button onClick={() => setOptionLabels([...optionLabels, ''])}>Add Option</button>
      <input placeholder="Minimum Trust Weight" type="number" value={minTrust} onChange={(e) => setMinTrust(e.target.value)} />
      <select value={voteFinality} onChange={(e) => setVoteFinality(e.target.value)}>
        <option value="one_time">One-Time Vote</option>
        <option value="changeable">Changeable Vote</option>
      </select>
      <input placeholder="Organizer Name" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
      <input placeholder="Telegram Handle (optional)" value={organizerTelegram} onChange={(e) => setOrganizerTelegram(e.target.value)} />
      <input placeholder="Deadline (Unix Timestamp)" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      <input placeholder="Analysis Link (e.g., cid://...)" value={analysisLink} onChange={(e) => setAnalysisLink(e.target.value)} />
      <p style={{ color: byteCount > 1024 ? 'red' : 'inherit' }}>
        Current vote size: {byteCount} bytes (max: 1024 bytes)
        <span title="Compressed fields: summary_pro, summary_con, possible_outcomes. Supporting docs and property names are included."> 🛈</span>
      </p>
      <ul style={{ fontSize: '0.9rem', color: '#ccc', paddingLeft: '1rem' }}>
        {Object.entries(fieldSizes).map(([key, size]) => (
          <li key={key}>{key}: {size} bytes</li>
        ))}
      </ul>
      <button onClick={createVote} disabled={byteCount > 1024}>Submit Vote</button>
      <p>{message}</p>
    </div>
  );
};

export default AdminPage;
