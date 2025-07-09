import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { copyright } from '../utils/copyright.js';
import nxsPackage from '../../nxs_package.json' with { type: "json" };

const { version } = nxsPackage;
const React = NEXUS.libraries.React;
const userGuideUrl = 'UserGuide.md';

function UserGuidePage() {
  const {
    components: { Panel, Button, Dropdown, FieldSet, MultilineTextField },
    utilities: { apiCall, secureApiCall, confirm, showErrorDialog, showSuccessDialog, showInfoDialog },
  } = NEXUS;

  const [docContent, setDocContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  const panelTitle = "Nexus Community On-Chain Voting - User Guide"

  React.useEffect(() => {
    fetch(userGuideUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load User Guide');
        return response.text();
      })
      .then((md) => {
        setDocContent(md);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}>
      <FieldSet legend="User Guide">
        <div className='document-display'>
          {loading ? (
            <div>Loading user guide...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>Error: {error}</div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {docContent}
            </ReactMarkdown>
          )}
        </div>
      </FieldSet>
      <div style={{ textAlign: 'center' }}>
        <Button>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Return to Voting Issue List Page
          </Link>
        </Button>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 'small'
      }}>
        <div>
          {/* Left-justified content here */}
          version {version}
        </div>
        <div>
          {/* Right-justified content here */}
          {copyright}
        </div>
        </div>
    </Panel>
  );
}


export default UserGuidePage;