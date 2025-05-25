// --- Pages: IssuePage.jsx ---
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { decompressFromUTF16 } from 'lz-string';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const IssuePage = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState(null);
  const [docsContent, setDocsContent] = useState({});
  const [message, setMessage] = useState('');
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voteCounts, setVoteCounts] = useState({});

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await window.API.get(`/register/read/${id}`);
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        const config = JSON.parse(decompressFromUTF16(data.config));
        setIssue({ ...data, ...config });
      } catch (err) {
        console.error('Failed to load issue:', err);
        setError('Failed to load issue');
      }
    };
    fetchIssue();
  }, [id]);

  useEffect(() => {
    const loadDocs = async () => {
      if (!issue?.supporting_docs) return;
      const newDocsContent = {};
      for (const doc of issue.supporting_docs) {
        try {
          const res = await fetch(`https://ipfs.io/ipfs/${doc.cid}`);
          const contentType = res.headers.get('Content-Type');
          const text = await res.text();
          newDocsContent[doc.cid] = { content: text, type: contentType };
        } catch (e) {
          newDocsContent[doc.cid] = { content: 'Failed to load document.', type: 'text/plain' };
        }
      }
      setDocsContent(newDocsContent);
    };
    loadDocs();
  }, [issue]);

  useEffect(() => {
    const checkDuplicateVote = async () => {
      if (!issue?.option_accounts?.length || !window.USER?.genesis) return;
      try {
        const accountChecks = issue.option_accounts.map(addr => `results.contracts.to=${addr}`).join(' OR ');
        const whereClause = `results.contracts.OP=CREDIT AND results.genesis=${window.USER.genesis} AND (${accountChecks})`;
        const where = encodeURIComponent(whereClause).replace(/^where=/i, 'WHERE=');
        const res = await window.API.get(`/ledger/list/transactions?limit=100&WHERE=${where}`);
        const credits = Array.isArray(res) ? res : res?.results || [];
        for (const tx of credits) {
          for (const contract of tx.contracts || []) {
            if (issue.option_accounts.includes(contract.to)) {
              setUserVote(contract.to);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to check for existing vote:', err);
      }
    };
    checkDuplicateVote();
  }, [issue]);

  useEffect(() => {
    const fetchLiveTally = async () => {
      if (!issue?.address) return;
      try {
        const res = await fetch(`http://65.20.79.65:4006/tally-votes/${issue.address}`);
        const data = await res.json();
        setVoteCounts(data);
      } catch (e) {
        console.warn('Failed to fetch vote tally:', e);
      }
    };
    fetchLiveTally();
  }, [issue]);

  const handleVote = async (account) => {
    const pin = await window.getPIN(`You are about to vote for this option.\nThis will send 0.000001 NXS to:\n${account}`);
    if (!pin) return;
    try {
      setLoading(true);
      await window.API.post('/finance/debit/account', {
        pin,
        amount: 0.000001,
        to: account
      });
      setMessage('✅ Vote submitted successfully.');
      setUserVote(account);
    } catch (e) {
      setMessage(`❌ Error submitting vote: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p>{error}</p>;
  if (!issue) return <p>Loading...</p>;

  return (
    <div>
      <h2>{issue.title}</h2>

      {issue.description && <><p><strong>Description:</strong></p><div className="nxs-box"><ReactMarkdown>{issue.description}</ReactMarkdown></div></>}

      <p><strong>Organizer:</strong> {issue.organizer_name}</p>
      <p><strong>Telegram:</strong> {issue.organizer_telegram}</p>
      <p><strong>Deadline:</strong> {new Date(issue.deadline * 1000).toLocaleString()}</p>

      {issue.summary_pro && <><p><strong>Summary (Pro):</strong></p><div className="nxs-box"><ReactMarkdown>{issue.summary_pro}</ReactMarkdown></div></>}
      {issue.summary_con && <><p><strong>Summary (Con):</strong></p><div className="nxs-box"><ReactMarkdown>{issue.summary_con}</ReactMarkdown></div></>}
      {issue.possible_outcomes?.length > 0 && (
        <div>
          <p><strong>Possible Outcomes:</strong></p>
          <ul>{issue.possible_outcomes.map((outcome, i) => <li key={i}>{outcome}</li>)}</ul>
        </div>
      )}

      <p><strong>Vote Finality:</strong> {issue.vote_finality}</p>
      <p><strong>Trust Required:</strong> {issue.min_trust}</p>

      {issue.option_accounts?.length > 0 && (
        <div>
          <h3>Live Results:</h3>
          <ul>
            {issue.option_accounts.map((opt, idx) => {
              const label = issue.option_labels?.[idx] || `Option ${idx + 1}`;
              return (
                <li key={opt}>
                  {label}: {opt}
                  <button
                    onClick={() => handleVote(opt)}
                    disabled={issue.vote_finality === 'one_time' && userVote !== null || loading}
                    style={{ marginLeft: '1em' }}
                  >
                    Vote
                  </button>
                  {userVote === opt && <span> ✅ Your Vote</span>}<br />
                  <small>Votes: {voteCounts?.[opt] ?? '...'}</small>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {message && <p>{message}</p>}

      {issue.supporting_docs?.length > 0 && (
        <div>
          <h3>Supporting Documents:</h3>
          {issue.supporting_docs.map(doc => {
            const docData = docsContent[doc.cid];
            return (
              <div key={doc.cid} style={{ marginBottom: '2em' }}>
                <h4>{doc.name}</h4>
                <a href={`https://ipfs.io/ipfs/${doc.cid}`} download target="_blank" rel="noopener noreferrer">Download</a>
                {docData ? (
                  docData.type.includes('pdf') ? (
                    <Document file={`https://ipfs.io/ipfs/${doc.cid}`}>
                      <Page pageNumber={1} />
                    </Document>
                  ) : docData.type.includes('markdown') || doc.name.endsWith('.md') ? (
                    <ReactMarkdown children={docData.content} remarkPlugins={[remarkGfm]} />
                  ) : (
                    <pre>{docData.content}</pre>
                  )
                ) : (
                  <p>Loading...</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IssuePage;
