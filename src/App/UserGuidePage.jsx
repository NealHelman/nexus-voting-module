import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import MarkdownWithZoom from "./MarkdownWithZoom";
import { Copyright } from '../utils/copyright.js';
import nxsPackage from '../../nxs_package.json' with { type: "json" };

const { version } = nxsPackage;
const React = NEXUS.libraries.React;
const userGuideUrl = 'https://raw.githubusercontent.com/NealHelman/nexus-voting-module/main/path/to/UserGuide.md';

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
      <div style={{ textAlign: 'center' }}>
        <Button>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Return to Voting Issue List Page
          </Link>
        </Button>
      </div>
      <FieldSet legend="User Guide">
        {loading ? (
          <div>Loading user guide...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>Error: {error}</div>
        ) : (
          <div className="document-display" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
            <MarkdownWithZoom>
              {docContent}
            </MarkdownWithZoom>
          </div>
        )}
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
        <Copyright />
        </div>
    </Panel>
  );
}


export default UserGuidePage;