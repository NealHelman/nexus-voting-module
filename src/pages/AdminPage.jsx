// --- Pages: AdminPage.jsx ---
import React, { useState, useEffect } from 'react';
import nexusVotingService from '../services/nexusVotingService';
import { MIN_TRUST_WEIGHT } from '../constants';

export import { useLocation } from 'react-router-dom';

const AdminPage = () => {
  useEffect(() => {
    const computeByteCount = () => {
      const fakeDocs = files.map(file => ({ name: file.name, cid: 'placeholder' }));
      const payload = {
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
        possible_outcomes: possibleOutcomes.split('
').map(s => s.trim()).filter(Boolean),
        created_by: window?.USER?.genesis || 'unknown',
        created_at: Math.floor(Date.now() / 1000),
        supporting_docs: fakeDocs,
      };
      const payloadSize = new Blob([JSON.stringify(payload)]).size;
      setByteCount(payloadSize);
    };
    computeByteCount();
  }, [title, description, optionLabels, minTrust, voteFinality, organizerName, organizerTelegram, deadline, analysisLink, summaryPro, summaryCon, possibleOutcomes]);
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

  useEffect(() => {
    const prefill = async () => {
      if (!editId) return;
      try {
        const res = await window.API.get(`/register/read/${editId}`);
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        setTitle(data.title || '');
        setDescription(data.description || '');
        setOptionLabels(data.option_labels || ['', '']);
        setMinTrust(data.min_trust || MIN_TRUST_WEIGHT);
        setVoteFinality(data.vote_finality || 'one_time');
        setOrganizerName(data.organizer_name || '');
        setOrganizerTelegram(data.organizer_telegram || '');
        setDeadline(data.deadline || '');
        setAnalysisLink(data.analysis_link || '');
        setSummaryPro(data.summary_pro || '');
        setSummaryCon(data.summary_con || '');
        setPossibleOutcomes((data.possible_outcomes || []).join('
'));
        setEditing(true);
        setEditingId(editId);
      } catch (e) {
        console.error('Failed to load existing vote:', e);
      }
    };
    prefill();
  }, [editId]);

  const createVote = async () => {
    const payload = {
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
      possible_outcomes: possibleOutcomes.split('
').map(s => s.trim()).filter(Boolean),
      created_by: window?.USER?.genesis || 'unknown',
      created_at: Math.floor(Date.now() / 1000),
      supporting_docs: [],
    };
    const payloadSize = new Blob([JSON.stringify(payload)]).size;
    setByteCount(payloadSize);
    if (payloadSize > 1024) {
      setMessage(`Data exceeds the 1KB asset storage limit (actual: ${payloadSize} bytes). Please shorten your input.`);
      return;
    }
    const payloadSize = new Blob([JSON.stringify({
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
      possible_outcomes: possibleOutcomes.split('
').map(s => s.trim()).filter(Boolean),
      created_by: window?.USER?.genesis || 'unknown',
      created_at: Math.floor(Date.now() / 1000),
      supporting_docs: [],
    })]).size;
    if (payloadSize > 1024) {
      setMessage(`Data exceeds the 1KB asset storage limit (actual: ${payloadSize} bytes). Please shorten your input.`);
      return;
    }
    const pin = await window.getPIN('This will send ' + (1 + optionLabels.length) + ' NXS to NexusCommunityVoting:default.');
    if (!pin) {
      setMessage('Vote creation cancelled.');
      return;
    }
    // PIN already retrieved via getPIN above
    if (uploading) return;
    setUploading(true);
    let supporting_docs = [];
    if (files.length > 0) {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
            method: 'POST',
            body: formData,
          });
          const text = await res.text();
          const cidMatch = text.match(/"Hash":"([^"]+)"/);
          if (cidMatch) supporting_docs.push({ name: file.name, cid: cidMatch[1] });
        } catch (e) {
          console.error('Failed to upload', file.name, e);
        }
      }
    }
    if (!title.trim() || !description.trim() || optionLabels.length < 2 || optionLabels.some(l => !l.trim())) {
      setMessage('Please fill in the title, description, and at least two valid option labels.');
      return;
    }

    const createTx = async (amount, to, pin) => {
      return await window.API.post('/finance/debit/account', {
        pin,
        amount,
        to
      });
    };

    try {
      await createTx(2 + optionLabels.length, 'NexusCommunityVoting:default', pin);
    } catch (e) {
      setMessage(`Error sending NXS to Voting Authority: ${e.message}`);
      return;
    }

    const optionAccounts = optionLabels.map(() => ''); // placeholder
      } catch (e) {
        setMessage(`Error creating option ${i}: ${e.message}`);
        return;
      }
    }
      } catch (e) {
        setMessage(`Error creating option ${i}: ${e.message}`);
        return;
      }
    }

    const issue = {
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
      possible_outcomes: possibleOutcomes.split('
').map(s => s.trim()).filter(Boolean),
      created_by: window?.USER?.genesis || 'unknown',
      created_at: Math.floor(Date.now() / 1000),
      option_accounts: optionAccounts,
            supporting_docs,
    };

    try {
      editing ? await nexusVotingService.updateVoteViaBackend({ ...issue, id: editingId }) : await nexusVotingService.createVoteViaBackend(issue);
      setMessage(`Vote creation request sent to Voting Authority.

Options:
${optionLabels.map((label, idx) => `  ${label}`).join('
')}`);
    } catch (e) {
      setMessage(`Error: ${e.message}`);
    }
  };

  return (
    <div>
      $1
      <p>You may upload supporting documents (PDF, Markdown, or TXT only):</p>
      <input type="file" accept=".pdf,.md,.txt" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
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
      <p style={{ color: byteCount > 1024 ? 'red' : 'inherit' }}>Current vote size: {byteCount} bytes (max: 1024 bytes)</p>
      <button onClick={createVote} disabled={byteCount > 1024}>Submit Vote</button>
      <p>{message}</p>
    </div>
  );
};