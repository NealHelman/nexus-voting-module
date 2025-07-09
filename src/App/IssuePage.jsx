import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { proxyRequest } from 'nexus-module';
import { decompressFromBase64 } from 'lz-string';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import nexusVotingService from '../services/nexusVotingService';

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
    components: { Panel, Button, Dropdown, FieldSet, MultilineTextField },
    utilities: { apiCall, secureApiCall, confirm, showErrorDialog, showSuccessDialog, showInfoDialog },
  } = NEXUS;

  const { address } = useParams();
  const [genesis, setGenesis] = React.useState('');
  const [votingAuthoritySigchain, setVotingAuthoritySigchain] = React.useState('');
  const [votingAuthorityAccount, setVotingAuthorityAccount] = React.useState('');
  const [votingAuthorityGenesis, setVotingAuthorityGenesis] = React.useState('');
  const [issue, setIssue] = React.useState(null);
  const [userTrust, setUserTrust] = React.useState(0);
  const [userWeight, setUserWeight] = React.useState(0);
  const [userHasEnoughTrustToVote, setUserHasEnoughTrustToVote] = React.useState(false);
  const [senderAddress, setSenderAddress] = React.useState('');
  const [userVotesCastOverall, setUserVotesCastOverall] = React.useState(0);
  const [userCurrentlyVotedOn, setuserCurrentlyVotedOn] = React.useState('');
  const [userIneligibleToVote, setUserIneligibleToVote] = React.useState(false);
  const [optionAddresses, setOptionAddresses] = React.useState([]);
  const [optionVotedOn, setOptionVotedOn] = React.useState(null);
  const [votingOver, setVotingOver] = React.useState(false);
  const [jsonGuid, setJsonGuid] = React.useState('');
  const [summaryPro, setSummaryPro] = React.useState('');
  const [summaryCon, setSummaryCon] = React.useState('');
  const [possibleOutcomes, setPossibleOutcomes] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [docsContent, setDocsContent] = React.useState({});
  const [voteCost, setVoteCost] = React.useState(0.000001);
  const [openDocs, setOpenDocs] = React.useState({});

  const [searchParams] = useSearchParams();
  const issueId = searchParams.get('issueId');
  const panelTitle = "Nexus Community On-Chain Voting - Issue Details & Voting"

  function base64ToBlob(base64, mimeType='application/octet-stream') {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
  }
  
  function handleDownload(name, base64) {
    const blob = base64ToBlob(base64, getMimeTypeFromName(name));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function getMimeTypeFromName(name) {
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.doc')) return 'application/msword';
    if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    // add more as needed
    return 'application/octet-stream';
  }

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

    const fetchVotesCastOverall = async () => {
      if (!genesis || !senderAddress) return; // wait until both are available
      const response = await proxyRequest(
        `${BACKEND_BASE}/votes-cast/${genesis}?senderAddress=${encodeURIComponent(senderAddress)}`,
        { method: 'GET' }
      );
      setUserVotesCastOverall(response.data.votesCast || 0);
    };

    const fetchSenderAddress = async () => {
      try {
        const address = await apiCall('finance/get/account/address', {
          name: 'default'
        });
        setSenderAddress(address.address);
      } catch (e) {
        console.error('Failed to fetch your default account address:', e);
        setSenderAddress('');
      }
    };

    fetchSenderAddress();
    checkTrust();
    fetchVotesCastOverall();
  }, [genesis]);

  React.useEffect(() => {
    const debugValues = { genesis, userTrust, senderAddress, issue, optionVotedOn };
    console.log('Updating window.myModuleDebug:', debugValues);
    window.myModuleDebug = debugValues;
  }, [genesis, userTrust, senderAddress, issue, optionVotedOn]);

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
        console.log('fetchIssue::response: ', response);
        setIssue(response.data);
      } catch (e) {
        setError('Failed to load voting issue: ' + (e.message || e.toString()));
      }
      setLoading(false);
    }
    if (issueId) fetchIssue();
  }, [issueId]);
  
  React.useEffect(() => {
    const canUserVote = async () => {
      setUserHasEnoughTrustToVote(userTrust < issue.minTrust ? false : true);
      const date = new Date();
      const timestamp = date.getTime();
      setVotingOver((timestamp / 1000) > issue.deadline ? true : false);
    }
    if (issue) canUserVote();
  }, [issue, userTrust]);

  React.useEffect(() => {
    setOptionAddresses([]);
    setOptionVotedOn(null);
    setUserIneligibleToVote(false);
    setuserCurrentlyVotedOn('');
  }, [issue]);
  
  React.useEffect(() => {
    const fetchVotingDetails = async () => {
      if (!issue?.account_addresses?.length) return;
      const addresses = [];
      let votedOn = null;
      let ineligible = false;

      for (const {name, address} of issue.account_addresses) {
        addresses.push(address);

        // Did the user vote for this option
        try {
          const result = await apiCall('finance/transactions/account/timestamp/count', {
            verbose: 'summary',
            name: 'default',
            where: `results.contracts.OP=DEBIT AND results.contracts.to.address=${address} AND results.contracts.amount=0.000001`
          });
          if (result.count > 0) {
            votedOn = address;
            setuserCurrentlyVotedOn(address);
            if (issue.vote_finality === 'one_time') ineligible = true;
          }
        } catch (e) {
          showErrorDialog({
            message: 'Unable to get voting option account transaction count',
            note: e.message
          });
          return;
        }
      }
      setOptionAddresses(addresses);
      setOptionVotedOn(votedOn);
      setUserIneligibleToVote(ineligible);
    };
    if (issue) fetchVotingDetails();
  }, [issue, votingAuthoritySigchain]);

  // Fetch supporting docs from backend and decode
  React.useEffect(() => {
    console.log('issue: ', issue);
    async function fetchDocs() {
      if (!issue?.supporting_docs?.length) return;
      setJsonGuid(issue.issue_info_guid || null);
      
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
  const handleVote = async (address) => {
    console.log('handleVote::address: ', address);
    let txidString = '';
    try {
      const response = await secureApiCall('finance/debit/account', {
        from: senderAddress,
        to: address,
        amount: voteCost,
        reference: userWeight
        }
      );
      
      setOptionVotedOn(address);

      const result = response.data ?? response; // fallback if not Axios
      if (response.success) showSuccessDialog({ 
        message: 'Success!',
        note: 'You voted!'
      });

      if (!result.success) {
        showErrorDialog({
          message: 'NXS voting debit failed',
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
  };
  
  const toggleDoc = (guid) => {
    setOpenDocs((prev) => ({
      ...prev,
      [guid]: !prev[guid],
    }));
  };

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
            Total Number of Votes You've Cast: 
            {!userVotesCastOverall && userVotesCastOverall != 0 ? (
              <> <span style={{ color: 'red' }}>(loading...)</span></>
            ) : (
              <> {userVotesCastOverall.toLocaleString()} </>
            )}
          </p>
        </div>
      </FieldSet>

      <div style={{ marginBottom: '1em' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center', fontSize: 'x-large' }}>
          <p>
            <strong>{issue.title}</strong>
            <br />
            Voting is
            {!votingOver ? (
              <> still <span style={{ color: 'green' }}>OPEN</span>!</>
            ) : (
              <> <span style={{ color: 'red' }}>CLOSED</span>!</>
            )}
          </p>
        </div>
        <div style={{ marginBottom: '3rem' }}>
          <label htmlFor="descriptionTextField" style={{ marginBottom: '0.25rem' }}>Description</label>
          <MultilineTextField label="Description" value={issue.description} disabled />
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
        <strong>Organizer's Telegram:</strong> {issue.organizer_telegram || ''}
      </div>
      <div>
        <strong>Minimum Trust Required to Vote:</strong> {Number(issue.min_trust).toLocaleString()}
      </div>
      <div style={{ marginTop: '3rem' }}>
          <label htmlFor="summaryProArgumentsTextField" style={{ marginBottom: '0.25rem' }}>Summary - Pro Arguments</label>
          <MultilineTextField label="Summary - Pro Arguments" value={issue.summary_pro} disabled />
          <label htmlFor="summaryConArgumentsTextField" style={{ marginBottom: '0.25rem' }}>Summary - Con Arguments</label>
          <MultilineTextField label="Summary - Con Arguments" value={issue.summary_con} disabled />
          <label htmlFor="possibleOutcomesTextField" style={{ marginBottom: '0.25rem' }}>Possible Outcomes</label>
          <MultilineTextField label="Possible Outcomes" value={issue.possible_outcomes} disabled />
      </div>
      {/* --- SUPPORTING DOCUMENTS --- */}
    {issue.supporting_docs?.length > 0 && (
      <FieldSet legend="Supporting Documents">
        <div style={{ textAlign: 'center' }}>
          Click on the document title to toggle display of the document
        </div>
        <ul style={{ width: '100%', padding: 0, margin: 0, listStyle: 'none' }}>
          {issue.supporting_docs.map(doc => {
            const docData = docsContent[doc.guid];
            if (!docData) return <li key={doc.guid}>Loading document...</li>;
            if (docData.error) return <li key={doc.guid} style={{ color: 'red' }}>{docData.error}</li>;
            const isOpen = !!openDocs[doc.guid];
            return (
              <li key={doc.guid} style={{ width: '100%', boxSizing: 'border-box', marginBottom: '2em' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1em',
                    width: '100%',
                  }}
                >
                  <strong
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleDoc(doc.guid)}
                  >
                    {docData.name}
                  </strong>
                  <Button
                    onClick={() => handleDownload(docData.name, docData.base64)}
                    style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
                  >
                    Download
                  </Button>
                </div>
                {isOpen && (
                  <>
                    {docData.type === 'markdown' && (
                      <div className='document-display'>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{docData.content}</ReactMarkdown>
                      </div>
                    )}
                    {docData.type === 'text' && (
                      <pre className='document-display'>{docData.content}</pre>
                    )}
                    {docData.type === 'unknown' && (
                      <pre>{docData.content}</pre>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </FieldSet>
    )}
    {/* --- VOTE BUTTONS --- */}
      <FieldSet legend="CAST YOUR VOTE">
        <div style={{ textAlign: 'center' }}>
          {!userHasEnoughTrustToVote && (
            <p>You have insufficient trust to vote on this issue.<br />A trust score of {Number(issue.min_trust).toLocaleString()} is required.<br />Yours is currently {Number(userTrust).toLocaleString()}.</p>
          )}
          {votingOver && (
            <p>Voting is over.<br />The deadline was new {Date(issue.deadline * 1000).toLocaleString()}.</p>
          )}
          {userIneligibleToVote && (
            <p>You have already cast a vote on this issue, and it is set to One Time Voting.</p>
          )}
          <ul style={{ display: "inline-block", textAlign: "center", padding: 0, margin: 0, listStyle: "none" }}>
            {optionAddresses.map((address, idx) => (
              <li key={address} style={{ position: "relative", margin: "0.5em 0" }}>
                <div style={{ display: "inline-block", position: "relative" }}>
                  <Button 
                    key={address}
                    disabled={!userHasEnoughTrustToVote || votingOver || userIneligibleToVote} 
                    onClick={() => handleVote(address)}
                  >
                    Vote for {issue.option_labels?.[idx] || `Option ${idx + 1}`}
                  </Button>
                  {/* Indicator if voted */}
                  {optionVotedOn === address && (
                    <span style={{
                      position: "absolute",
                      left: "105%",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "green",
                      fontWeight: "bold",
                      fontSize: "0.95em",
                      whiteSpace: "nowrap",
                    }}>
                      (You voted on this one)
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </FieldSet>
      <div style={{ textAlign: 'center' }}>
        <Button>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Return to Voting Issue List Page
          </Link>
        </Button>
      </div>
      <div style={{ textAlign: 'right', fontSize: 'small' }}>
        © 2025, Neal Helman - Created with lots of help from AI.
      </div>
    </Panel>
  );
}

export default IssuePage;