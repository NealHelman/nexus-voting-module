import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import MarkdownWithZoom from "./MarkdownWithZoom";
import { Copyright } from '../utils/copyright.js';
import nxsPackage from '../../nxs_package.json';
import { StyledDropdownWrapper, StyledSelect, ModalFooterBar, ModalButton } from '../Styles/StyledComponents';

const { version } = nxsPackage;
const BACKEND_BASE = 'http://65.20.79.65:4006';
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const userGuideUrl = 'https://raw.githubusercontent.com/NealHelman/nexus-voting-module/main/user_guide/UserGuide.md';

function UserGuidePage() {
  const {
    libraries: { 
      React, 
      emotion: { react, styled, cache },
    },
    components: { 
      Panel, 
      Button, 
      Dropdown, 
      FieldSet, 
      TextField,
      MultilineTextField,
      Modal
    },
    utilities: { 
      apiCall, 
      proxyRequest, 
      secureApiCall, 
      confirm, 
      showErrorDialog, 
      showSuccessDialog, 
      showInfoDialog },
  } = NEXUS;
  
  // State from Redux
  const {
    senderAddress: votingSenderAddress,
    donationRecipient: votingDonationRecipient,
    fetchedAt: votingFetchedAt
  } = useSelector(state => state.voting);
  
  const {
    fetchedAt: userGuideFetchedAt
  } = useSelector(state => state.userGuide);

  const senderAddress = votingSenderAddress;
  const donationRecipient = votingDonationRecipient;
  const fetchedAt = userGuideFetchedAt;

  const [docContent, setDocContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [backendAvailable, setBackendAvailable] = React.useState(null);
  const [isDonating, setIsDonating] = React.useState(false);
  const [status, setStatus] = React.useState("idle");
  const [donationAmount, setDonationAmount] = React.useState(0);
  const [donationSent, setDonationSent] = React.useState(false);
  
  const setSenderAddress = (page) => dispatch({ type: 'SET_SENDER_ADDRESS', payload: page });
  const setDonationRecipient = (page) => dispatch({ type: 'SET_DONATION_RECIPIENT', payload: page });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const panelTitle = "Nexus Community On-Chain Voting - User Guide"

  React.useEffect(() => {
    const loadUserGuide = async () => {
      try {
        const response = await proxyRequest(userGuideUrl, { method: 'GET' });
        console.log('UserGuide::response: ', response);
        setDocContent(response.data || response); // Use response.data if it exists, otherwise use response directly
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load User Guide');
        setLoading(false);
      }
    };

    loadUserGuide();
  }, []);

  // Cache freshness check
  const isCacheFresh = React.useMemo(() => {
    return fetchedAt && (Date.now() - fetchedAt < CACHE_TIMEOUT);
  }, [fetchedAt]);

  // ----------- LOAD IMPORTANT INFORMATION FIRST THING (only if needed) -----------
  React.useEffect(() => {
    let cancelled = false;
    async function getImportantInfoAndVotes() {
      setStatus("loading");
      setLoading(true);

       // 1. Only load if cache is missing or stale
      if (isCacheFresh) {
        setStatus("idle");
        setLoading(false);
        return;
      }

      // 2. Ping backend
      let backendOk = false;
      try {
        const { status } = await proxyRequest(`${BACKEND_BASE}/ping`, { method: 'GET' });
        backendOk = status == '200';
        setBackendAvailable(backendOk);
      } catch (err) {
        setBackendAvailable(false);
        showErrorDialog({ message: 'Backend is not responding. Please try again later.', note: err.message });
        setStatus("idle");
        setLoading(false);
        return;
      }
      if (!backendOk || cancelled) return;
          
      console.log('backend is alive...');

      // 2b. Load authority/protected values if missing
      let walletDonationRecipient = donationRecipient;
      const { data } = await nexusVotingService.getProtectedValues();
      walletDonationRecipient = data.DONATION_RECIPIENT;
      setDonationRecipient(walletDonationRecipient);
      if (cancelled) return;

      // 2c. Get senderAddress if missing
      let walletSenderAddress = senderAddress;
      if (!walletSenderAddress) {
        try {
          const data = await apiCall("finance/get/account/address", { name: 'default' });
          walletSenderAddress = data?.address || '';
          setSenderAddress(walletSenderAddress);
        } catch (e) {
          showErrorDialog({
            message: 'Failed to retrieve senderAddress',
            note: e.message
          });
          return;
        }
      }
      if (cancelled) return;
    }
    getImportantInfoAndVotes();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [
    isCacheFresh
  ]);

  const handleDonation = async () => {
    if (!donationRecipient || !donationAmount) return false;
    setDonationSent(true);
    try {
      const response = await secureApiCall('finance/debit/account', {
        from: senderAddress,
        to: donationRecipient,
        amount: donationAmount
      });

      resetDonationModal();
      const result = response.data ?? response;
      console.log('donationUtils::result: ', result);

      let outputObj;
      if (typeof result === "string") {
        try {
          outputObj = JSON.parse(result);
        } catch (err) {
          showErrorDialog?.({
            message: "Unexpected response format",
            note: result,
          });
          return false;
        }
      } else {
        outputObj = result;
      }

      if (outputObj && outputObj.success === true) {
        outputObj.success = 1;
      }

      if (!outputObj.success) {
        showErrorDialog?.({
          message: "Donation failed",
          note: "Maybe try again later?"
        });
        return false;
      }

      showSuccessDialog?.({ message: "Donation Success!" });
      return true;
    } catch (e) {
      showErrorDialog?.({
        message: 'Error during donation',
        note: e.message
      });
      return false;
    }
  }

  const resetDonationModal = () => {
    setDonationAmount(0);
    setIsDonating(false);
  };

  return (
    <Panel title={panelTitle} icon={{ url: 'voting.svg', id: 'icon' }}>
      <div style={{ textAlign: 'center', marginBottom: '2em' }}>
        <Button skin="filled-primary" onClick={() => navigate('/')}>
          Return to Voting Issue List Page
        </Button>
      </div>
      
      <FieldSet legend="User Guide" style={{ marginBottom: '2em' }}>
        {loading ? (
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'red' }}>Loading user guide...</span>
          </div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center' }}>Error: {error}</div>
        ) : (
          <div className="document-display" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
            <MarkdownWithZoom>
              {docContent}
            </MarkdownWithZoom>
          </div>
        )}
      </FieldSet>
      
      <div style={{ textAlign: 'center', marginBottom: '2em' }}>
        <Button skin="filled-primary" onClick={() => navigate('/')}>
          Return to Voting Issue List Page
        </Button>
      </div>
      
      {/* Footer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        fontSize: 'small',
        marginTop: '2em'
      }}>
        <div style={{ justifySelf: 'start' }}>version {version}</div>
        <div style={{ justifySelf: 'center' }}>
          <Button skin="filled-primary" onClick={() => setIsDonating(true)}>Donate</Button>
        </div>
        <Copyright />
      </div>
      {isDonating && (
        <Modal id="DonationDialog" escToClose={true} removeModal={() => setIsDonating(false)} style={{ width: '500px' }}>
          <Modal.Header>Thank you!<br />How many NXS<br />do you wish to donate?</Modal.Header>
          <Modal.Body>
            <TextField label="DonationAmount" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
          </Modal.Body>
          <ModalFooterBar>
            <Button skin="filled-primary" onClick={handleDonation} disabled={!donationAmount || !senderAddress || donationSent}>Donate</Button>
            <Button skin="filled" onClick={resetDonationModal}>Cancel</Button>
          </ModalFooterBar>
        </Modal>
      )}
    </Panel>
  );
}


export default UserGuidePage;