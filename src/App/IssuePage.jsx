import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { proxyRequest } from 'nexus-module';
import { decompressFromBase64 } from 'lz-string';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Document, Page, pdfjs } from 'react-pdf';
import nexusVotingService from '../services/nexusVotingService';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const BACKEND_BASE = 'http://65.20.79.65:4006';
const React = NEXUS.libraries.React;

function base64ToUint8Array(base64) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

function IssuePage() {
  const {
    components: { Panel, Button, Dropdown, FieldSet },
    utilities: { apiCall, confirm, showErrorDialog },
  } = NEXUS;

  const { address } = useParams();
  const [genesis, setGenesis] = React.useState('');
  const [votingAuthoritySigchain, setVotingAuthoritySigchain] = React.useState('');
  const [votingAuthorityAccount, setVotingAuthorityAccount] = React.useState('');
  const [votingAuthorityGenesis, setVotingAuthorityGenesis] = React.useState('');
  const [issue, setIssue] = React.useState(null);
  const [userTrust, setUserTrust] = React.useState(0);
  const [userWeight, setUserWeight] = React.useState(0);
  const [userVotesCast, setUserVotesCast] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [docsContent, setDocsContent] = React.useState({});
  const [voteCost, setVoteCost] = React.useState(0.000001);

  const [searchParams] = useSearchParams();
  const issueId = searchParams.get('issueId');
  const panelTitle = "Nexus Community On-Chain Voting - Issue Details & Voting"

  React.useEffect(() => {
    nexusVotingService.getProtectedValues().then(({ data }) => {
      setVotingAuthoritySigchain(data.VOTING_AUTHORITY_SIGCHAIN);
      setVotingAuthorityAccount(data.VOTING_AUTHORITY_ACCOUNT);
      setVotingAuthorityGenesis(data.VOTING_AUTHORITY_GENESIS);
    });
  }, []);

  React.useEffect(() => {
    const getGenesis = async () => {
      try {
        const data = await apiCall("finance/get/account/owner", { name: 'default' });
        setGenesis(data?.owner || '');
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
    if (!genesis) return;

    const checkTrust = async () => {
      try {
        const response = await apiCall('finance/list/trust/trust,stake', { name: 'trust' });
        console.log('checkTrust response: ', response);
        const trust = response?.[0]?.trust || 0;
        const stake = response?.[0]?.stake || 0;
        setUserTrust(trust);
        setUserWeight(trust * stake);
      } catch (e) {
        showErrorDialog({ message: 'Failed to retrieve trust level', note: e.message });
      }
    };

    const fetchVotesCast = async () => {
      try {
        const response = await proxyRequest(`${BACKEND_BASE}/votes-cast/${genesis}`, { method: 'GET' });
        setUserVotesCast(response.data.votesCast || 0);
      } catch (e) {
        console.error('Failed to fetch number of votes cast:', e);
        setUserVotesCast(0);
      }
    };

    checkTrust();
    fetchVotesCast();
  }, [genesis]);

  React.useEffect(() => {
    const debugValues = { genesis, userTrust };
    console.log('Updating window.myModuleDebug:', debugValues);
    window.myModuleDebug = debugValues;
  }, [genesis, userTrust]);

  // Fetch the voting issue metadata
  React.useEffect(() => {
    async function fetchIssue() {
      setLoading(true);
      setError('');
      try {
        // Fetch the asset object by address from backend: TODO - CREATE BACKEND ENDPOINT
        const response = await proxyRequest(
          `${BACKEND_BASE}/ledger/object?issueId=${issueId}`,
          { method: 'GET' }
        );
        // Decompress config
        const config = decompressFromBase64(response.data.config || '');
        const metadata = JSON.parse(config);
        console.log('metadata: ', metadata);
        setIssue({ ...response.data, ...metadata });
      } catch (e) {
        setError('Failed to load voting issue: ' + (e.message || e.toString()));
      }
      setLoading(false);
      console.log('issue: ', issue);
    }
    if (issueId) fetchIssue();
  }, [issueId]);

  // Fetch supporting docs from backend and decode
  React.useEffect(() => {
    async function fetchDocs() {
      if (!issue?.supporting_docs?.length) return;
      const docs = {};
      for (const doc of issue.supporting_docs) {
        try {
          // Expect doc.guid is present (as written by backend)
          const res = await fetch(`${BACKEND_BASE}/ipfs/fetch/${doc.guid}`);
          if (!res.ok) throw new Error('Network error');
          const { name, base64 } = await res.json();
          let content, type = '';
          // Try to determine type from name or magic
          if (name.endsWith('.md') || name.endsWith('.markdown')) {
            content = atob(base64);
            type = 'markdown';
          } else if (name.endsWith('.txt')) {
            content = atob(base64);
            type = 'text';
          } else if (name.endsWith('.pdf')) {
            content = base64ToUint8Array(base64);
            type = 'pdf';
          } else {
            // fallback: treat as text, try to display, or offer download
            content = atob(base64);
            type = 'unknown';
          }
          docs[doc.guid] = { name, content, type, base64 };
        } catch (e) {
          docs[doc.guid] = { error: 'Failed to load or decode document.' };
        }
      }
      setDocsContent(docs);
    }
    fetchDocs();
  }, [issue]);
  
    // Cast Vote //
    React.useEffect(() => {
      async function handleVote(opt) {
        const senderAddress = await apiCall('finance/get/account/address', {
          name: 'default'
        });
        
        const voteSlug = await apiCall('assets/get/asset/name verbose=summary', { address: `${issue.issueId}` });

        const where =`'results.owner={votingAuthorityGenesis} AND results.data=*{voteSlug.name}*'`;
        const castVoteToThisAddress = await apiCall('register/list/finance:account', { where });
        
        let txidString = '';
        try {
          const response = await secureApiCall('finance/debit/account', {
            from: senderAddress.address,
            to: castVoteToThisAddress.address,
            amount: voteCost
            }
          );

          const result = response.data ?? response; // fallback if not Axios
          if (!result.success) {
            showErrorDialog({
              message: 'NXS debit failed',
              note: 'No txid returned.'
            });
            return;
          }
          txidString = result.txid.toString();
          console.log('voting txidString: ', txidString);
        } catch (e) {
          showErrorDialog({
            message: 'Error during sending voting issue creation fee',
            note: e.message
          });
          return;
        }
      }
  }, []);
  
  if (loading) return <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}><p>Loading voting issue...</p></Panel>;
  if (error) return <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}><p style={{ color: 'red' }}>{error}</p></Panel>;
  if (!issue) return <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}><p>No voting issue found.</p></Panel>;

  return (
    <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}>
      <FieldSet legend='Your Voting Power' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <p>
            Your Trust Score: {(userTrust ?? 0).toLocaleString()} |{' '}
            Your Voting Weight: {(Number(userWeight) / 1e8).toLocaleString(undefined, { maximumFractionDigits: 2 })} |{' '}
            Total Number of Votes You've Cast: {(userVotesCast ?? 0).toLocaleString()} 
          </p>
        </div>
      </FieldSet>

      <div style={{ marginBottom: '1em' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center', fontSize: 'x-large' }}>
          {issue.title}
        </div>
        <strong>Description:</strong>
        <div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {issue.description || 'No description provided.'}
          </ReactMarkdown>
        </div>
      </div>
      <div>
        <strong>Created:</strong> {issue.created_at ? new Date(issue.created_at * 1000).toLocaleString() : 'N/A'}
      </div>
      <div>
        <strong>Deadline:</strong> {issue.deadline ? new Date(issue.deadline * 1000).toLocaleString() : 'N/A'}
      </div>
      <div>
        <strong>Organizer:</strong> {issue.organizer_name || 'Anonymous'}
      </div>
      <div>
        <strong>Minimum Trust Required:</strong> {Number(issue.min_trust).toLocaleString()}
      </div>
      <div style={{ margin: '1em 0' }}>
        <strong>Summary - Pro Arguments:</strong>
        <div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {issue.summary_pro || 'No Summary - Pro Arguments provided.'}
          </ReactMarkdown>
        </div>
      </div>
      <div style={{ margin: '1em 0' }}>
        <strong>Summary - Con Arguments:</strong>
        <div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {issue.summary_con || 'No Summary - Con Arguments provided.'}
          </ReactMarkdown>
        </div>
      </div>
      <div style={{ margin: '1em 0' }}>
        <strong>Possible Outcomes:</strong>
        <div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {issue.possible_outcomes || 'No Possible Outcomes provided.'}
          </ReactMarkdown>
        </div>
      </div>
      {/* --- VOTE BUTTONS --- */}
      <div style={{ textAlign: 'center' }}>
        <p>Cast Your Vote</p>
        <ul>
          {(issue.optionAccounts || []).map((opt, idx) => (
            <li key={opt}>
              <Button disabled={userTrust < issue.minTrust} onClick={() => handleVote(opt)}>
                Vote for {issue.option_labels?.[idx] || `Option ${idx + 1}`}
              </Button>
            </li>
          ))}
        </ul>
      </div>
      {/* --- SUPPORTING DOCUMENTS --- */}
      {issue.supporting_docs?.length > 0 && (
        <FieldSet legend="Supporting Documents">
          <ul>
            {issue.supporting_docs.map(doc => {
              const docData = docsContent[doc.guid];
              if (!docData) return <li key={doc.guid}>Loading document...</li>;
              if (docData.error) return <li key={doc.guid} style={{ color: 'red' }}>{docData.error}</li>;
              return (
                <li key={doc.guid}>
                  <div><strong>{docData.name}</strong> (<a href={`${BACKEND_BASE}/ipfs/fetch/${doc.guid}`} download>Download</a>)</div>
                  {docData.type === 'markdown' && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{docData.content}</ReactMarkdown>
                  )}
                  {docData.type === 'text' && (
                    <pre style={{ background: '#f3f3f3', padding: '1em' }}>{docData.content}</pre>
                  )}
                  {docData.type === 'pdf' && (
                    <Document file={{ data: docData.content }}>
                      <Page pageNumber={1} />
                    </Document>
                  )}
                  {docData.type === 'unknown' && (
                    <pre style={{ background: '#f9f9f9', padding: '1em', color: '#555' }}>
                      {docData.content}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        </FieldSet>
      )}
    </Panel>
  );
}

export default IssuePage;