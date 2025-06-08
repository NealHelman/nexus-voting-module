const {
  libraries: { React, useEffect, useState },
  components: { Panel, Button },
  utilities: { apiCall, send, showErrorDialog, showSuccessDialog },
} = NEXUS;

import { useParams } from 'react-router-dom';
import { proxyRequest } from 'nexus-module';
import { decompressFromUTF16 } from 'lz-string';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Document, Page, pdfjs } from 'react-pdf';
import { getWeightedResults } from '../services/nexusVotingService';
import { getVotingConfig, getWalletUserInfo } from '../utils/env';

const { ENV, VOTING_SIGCHAIN } = getVotingConfig();
const { username, genesis } = getWalletUserInfo();


pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const IssuePage = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [message, setMessage] = useState('');
  const [userVote, setUserVote] = useState(null);
  const [docsContent, setDocsContent] = useState({});

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const { res } = await proxyRequest(
          'register/read', { address: id },
          { method: 'GET', null }
        );
        const config = JSON.parse(decompressFromUTF16(res.config));
        setIssue({ ...res, ...config });
      } catch (err) {
        showErrorDialog({ message: 'Failed to load issue', note: err.message });
      }
    };
    fetchIssue();
  }, [id]);

  useEffect(() => {
    async function fetchVoteWeights() {
      try {
        const weighted = await getWeightedResults(issue?.slug);
        setIssue(prev => ({ ...prev, voteCounts: weighted }));
      } catch (err) {
        console.error('Failed to fetch weighted results:', err);
      }
    }

    if (issue?.slug) {
      fetchVoteWeights();
      const interval = setInterval(fetchVoteWeights, 30000);
      return () => clearInterval(interval);
    }
  }, [issue?.slug]);

  useEffect(() => {
    const loadDocs = async () => {
      if (!issue?.supporting_docs) return;
      const newDocsContent = {};
      for (const doc of issue.supporting_docs) {
        try {
          const { res } = await proxyRequest(
            `https://ipfs.io/ipfs/${doc.cid}`,
            { method: 'GET', null }
          );
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

  const handleVote = async (accountName, label) => {
    try {
      const recipientName = accountName.includes(':') ? accountName : `${VOTING_SIGCHAIN}:${accountName}`;
      const { address: recipientAddress } = await apiCall('finance/get/account/address', { name: recipientName });

      // Get voter's trust account info
      const trustAccount = await apiCall('finance/get/trust', { name: `${username}:trust` });
      const trust = trustAccount.trust || 0;
      const stake = trustAccount.stake || 0;
      const weightedVote = trust * (stake / 1000000);

      await send({
        sendFrom: 'default',
        recipients: [
          {
            address: recipientAddress,
            amount: '0.000001',
            reference: weightedVote.toFixed(6),
          },
        ],
        advancedOptions: true,
      });

      const where = `results.contracts.OP=CREDIT AND results.contracts.to.address=${recipientAddress} AND results.contracts.amount=0.000001 AND results.confirmations>1`;
      const maxWaitMs = 10 * 60 * 1000;
      const pollIntervalMs = 10000;
      const start = Date.now();

      while (Date.now() - start < maxWaitMs) {
        try {
          const res = await apiCall('ledger/list/transactions', {
            limit: 1,
            verbose: 'summary',
            WHERE: where,
          });
          if (Array.isArray(res) && res[0]?.txid) {
            showSuccessDialog({ message: `Vote for "${label}" confirmed.` });
            setUserVote(recipientAddress);
            return;
          }
        } catch {}
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }

      showErrorDialog({ message: 'Timeout waiting for vote confirmation.' });
      showSuccessDialog({ message: `Vote for "${label}" submitted successfully. Transfer pending confirmation.` });
      setUserVote(recipientAddress);
    } catch (e) {
      showErrorDialog({ message: 'Vote submission failed', note: e.message });
    }
  };

  if (!issue) return <p>Loading...</p>;

  return (
    <Panel title={issue.title}>
      {issue.description && <><p><strong>Description:</strong></p><ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.description}</ReactMarkdown></>}
      <p><strong>Organizer:</strong> {issue.organizer_name}</p>
      {issue.organizer_telegram && (
        <p>
          <strong>Telegram:</strong>{' '}
          <a
            href={`https://t.me/${issue.organizer_telegram.replace(/^@/, '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {issue.organizer_telegram}
          </a>
        </p>
      )}
      <p><strong>Created By:</strong> {issue.created_by}</p>
      <p><strong>Created At:</strong> {new Date(issue.created_at * 1000).toLocaleString()}</p>
      {issue.deadline ? (
        <p><strong>Deadline:</strong> {new Date(issue.deadline * 1000).toLocaleString()}</p>
      ) : (
        <p><strong>Deadline:</strong> Not set</p>
      )}

      {issue.summary_pro && <><p><strong>Summary (Pro):</p><ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.summary_pro}</ReactMarkdown></>}
      {issue.summary_con && <><p><strong>Summary (Con):</strong></p><ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.summary_con}</ReactMarkdown></>}

      {issue.possible_outcomes && (
        <div>
          <p><strong>Possible Outcomes:</strong></p>
          <ul>{issue.possible_outcomes.split('\n').map((outcome, i) => <li key={i}>{outcome}</li>)}</ul>
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
                  <Button
                    onClick={() => handleVote(opt, label)}
                    disabled={issue.vote_finality === 'one_time' && userVote !== null}
                    style={{ marginLeft: '1em' }}
                  >
                    Vote
                  </Button>
                  {userVote === opt && <span> ✅ Your Vote</span>}<br />
                  <small>Weighted NXS (Trust x Stake): {issue.voteCounts?.[opt] ?? '...'}</small>
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{docData.content}</ReactMarkdown>
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

      {message && <p>{message}</p>}
    </Panel>
  );
};

export default IssuePage;
