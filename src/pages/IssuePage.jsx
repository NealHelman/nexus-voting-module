// --- Pages: IssuePage.jsx ---
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVoteById } from '../features/voteSlice';
import nexusVotingService from '../services/nexusVotingService';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

export const IssuePage = () => {
  const { issueId } = useParams();
  const dispatch = useDispatch();
  const vote = useSelector((state) => state.voting.voteDetails[issueId]);
  const [userVote, setUserVote] = useState(null);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docContents, setDocContents] = useState({});

  useEffect(() => {
    if (issueId) dispatch(fetchVoteById(issueId));
    const checkUserVote = async () => {
      try {
        const userGenesis = window?.USER?.genesis;
        if (!vote || !userGenesis) return;
        for (const acct of vote.optionAccounts || []) {
          const txs = await window.API.get('/ledger/list/transactions', {
            params: {
              limit: 1,
              WHERE: `results.contracts.address=${acct} AND results.contracts.OP=CREDIT AND results.genesis=${userGenesis}`,
            },
          });
          if (txs.length > 0) {
            setUserVote(acct);
            break;
          }
        }
      } catch (e) {
        console.error('Error checking user vote:', e);
      }
    };
    checkUserVote();
  }, [dispatch, issueId, vote]);

  const handleVote = async (account) => {
    try {
      setLoading(true);
      const confirm = window.confirm('This will send 0.000001 NXS to cast your vote. Do you want to proceed?');
      if (!confirm) return;
      await nexusVotingService.castVote(account);
      setUserVote(account);
      setMessage('Vote submitted successfully.');
    } catch (e) {
    console.error('Vote creation error:', e);
    setMessage(`Error: ${e.message}`);
    } finally {
    setUploading(false);
  }
  };

  useEffect(() => {
    const fetchSupportingDocs = async () => {
      if (!vote?.supporting_docs) return;
      const contents = {};
      for (const doc of vote.supporting_docs) {
        if (doc.name.endsWith('.md') || doc.name.endsWith('.txt')) {
          try {
            const res = await fetch(`https://ipfs.io/ipfs/${doc.cid}`);
            contents[doc.cid] = await res.text();
          } catch (e) {
            contents[doc.cid] = 'Failed to load content';
          }
        }
      }
      setDocContents(contents);
    };
    fetchSupportingDocs();
  }, [vote]);

  if (!vote) return <p>Loading vote details...</p>;

  return (
    <div>
      <h2>{vote.title}</h2>
      <p><strong>Organizer:</strong> {vote.organizer}</p>
      <p><strong>Deadline:</strong> {vote.deadline ? new Date(vote.deadline * 1000).toLocaleString() : 'None'}</p>
      {vote.summary_pro && <><p><strong>Summary (Pro):</strong></p><div className="nxs-box"><ReactMarkdown>{vote.summary_pro}</ReactMarkdown></div></>}
      {vote.summary_con && <><p><strong>Summary (Con):</strong></p><div className="nxs-box"><ReactMarkdown>{vote.summary_con}</ReactMarkdown></div></>}
      {vote.possible_outcomes?.length > 0 && (
        <div>
          <p><strong>Possible Outcomes:</strong></p>
          <ul>{vote.possible_outcomes.map((outcome, i) => <li key={i}>{outcome}</li>)}</ul>
        </div>
      )}
      {vote.description && <><p><strong>Description:</strong></p><div className="nxs-box"><ReactMarkdown>{vote.description}</ReactMarkdown></div></>}
      {vote.analysis_link && vote.analysis_link.startsWith('cid://') && (
        <p><strong>Analysis:</strong></p>
        <iframe
          className="nxs-box"
          style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}
          src={`https://ipfs.io/ipfs/${vote.analysis_link.replace('cid://', '')}`}
          title="IPFS Analysis"
        />
      )}
      <p><strong>Live Results:</strong></p>
      <ul>
        {vote.optionAccounts?.map((opt, idx) => {
          const label = vote.option_labels?.[idx] || `Option ${idx + 1}`;
          return (
            <li key={opt}>
              {label}: {opt}
              <button
                onClick={() => handleVote(opt)}
                disabled={vote.vote_finality === 'one_time' && userVote !== null || loading}
              >
                Vote
              </button>
              {userVote === opt && <span> ✅ Your Vote</span>}<br />
              <small>Votes: {vote.voteCounts?.[opt] ?? '...'}</small>
            </li>
          );
        })}
      </ul>
      {vote.supporting_docs?.length > 0 && (
        <div>
          <p><strong>Supporting Documents:</strong></p>
          <ul>
            {vote.supporting_docs.map((doc, i) => (
              <li key={i}>
                {doc.name.endsWith('.pdf') ? (
                  <iframe
                    src={`https://ipfs.io/ipfs/${doc.cid}`}
                    style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
                    title={doc.name}
                  />
                ) : doc.name.endsWith('.md') || doc.name.endsWith('.txt') ? (
                <ReactMarkdown
  remarkPlugins={[remarkGfm, remarkBreaks]}
  rehypePlugins={[rehypeRaw, rehypeHighlight]}
  components={{
    img: ({ node, ...props }) => <img loading="lazy" {...props} />
  }}
  children={docContents[doc.cid] || 'Loading...'}
/>
                ) : (
                  <iframe
                    src={`https://ipfs.io/ipfs/${doc.cid}`}
                    style={{ width: '100%', height: '400px', border: '1px solid #ccc' }}
                    title={doc.name}
                  />
                ) : (
                  <a href={`https://ipfs.io/ipfs/${doc.cid}`} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                )}
              </li>
            ))}
              <li key={i}><a href={`https://ipfs.io/ipfs/${doc.cid}`} target="_blank" rel="noopener noreferrer">{doc.name}</a></li>
            ))}
          </ul>
        </div>
      )}
      $1
  );
};
