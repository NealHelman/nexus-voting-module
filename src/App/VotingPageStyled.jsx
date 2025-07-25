import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Copyright } from '../utils/copyright.js';
import { StyledDropdownWrapper, StyledSelect, ModalFooterBar, ModalButton, StyledTextField, StyledTextArea } from '../Styles/StyledComponents';

const {
  libraries: { React },
  components: { Panel, FieldSet, Button, Modal, TextField, Tooltip },
} = NEXUS;

const WEIGHT_SCALE_FACTOR = 1000000;

function VotingPageStyled({
  loading,
  voteList = [],
  weightedVoteCounts = {},
  userTrust,
  userWeight,
  userVotesCast,
  currentPage,
  totalPages,
  filter,
  sortField,
  sortDirection,
  votesPerPage,
  subscribed,
  canAccessAdmin,
  handleViewOrEdit,
  handleRefresh,
  setCurrentPage,
  setFilter,
  setSortField,
  setSortDirection,
  setVotesPerPage,
  setEmailVisible,
  setSearchVisible,
  emailVisible,
  searchVisible,
  isDonating,
  setIsDonating,
  donationSent,
  setDonationSet,
  userEmail,
  setUserEmail,
  handleSubscriptionToggle,
  userEmailValid,
  resetEmailModal,
  donationAmount,
  setDonationAmount,
  senderAddress,
  handleDonation,
  resetDonationModal,
  status,
  votesFieldsetLegend,
  searchKey,
  setSearchKey,
  searchTerm,
  setSearchTerm,
  version,
  handleStartSearch,
  openSearchModal,
  closeSearchModal,
  handleSwitchPage
}) {
  const navigate = useNavigate();
  const genesis = useSelector(state => state.nexus.userStatus?.genesis);

  const showBusyIndicator = status === "loading" && voteList.length > 0;
  
  return (
    <Panel title="Nexus Community On-Chain Voting - Issues Available" icon={{ url: 'voting.svg', id: 'icon' }}>
      {/* Filter & Actions */}
      <FieldSet legend="" style={{ position: 'relative', padding: '2em 1em 1em 1em', marginBottom: '2em' }}>
        <div id='top' style={{ position: 'absolute', top: '1em', right: '1em', display: 'flex', gap: '1em' }}>
          <Tooltip.Trigger tooltip="Search for a Title">
            <Button skin="plain-link-primary" onClick={openSearchModal}>
              <img src='binoculars.svg' height='32px' />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Trigger tooltip="Display the User Guide">
            <Button 
              skin="plain-link-primary" 
              onClick={() => navigate('/userguide')}
            >
              <img src='document.svg' height='32px' />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Trigger tooltip="Refresh Voting List Page">
            <Button skin="plain-link-primary" onClick={handleRefresh}>
              <img src='refresh.svg' height='32px' />
            </Button>
          </Tooltip.Trigger>
        </div>
        <div style={{ display: 'flex', gap: '2em', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2em', justifyContent: 'center' }}>
          <label htmlFor="filterSelect" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
            <span>Status&nbsp;Filter: </span>
            <StyledDropdownWrapper label="Status Filter" style={{ minWidth: 150 }}>
              <StyledSelect value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="mine">Just Mine</option>
              </StyledSelect>
            </StyledDropdownWrapper>
          </label>
          <label htmlFor="sortBy" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
            <span>Sort&nbsp;By: </span>
            <StyledDropdownWrapper label="Sort By" style={{ minWidth: 150 }}>
              <StyledSelect value={sortField} onChange={e => setSortField(e.target.value)}>
                <option value="created">Created</option>
                <option value="title">Title</option>
                <option value="deadline">Deadline</option>
              </StyledSelect>
            </StyledDropdownWrapper>
          </label>
          <label htmlFor="direction" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
            <span>Sort Direction: </span>
            <StyledDropdownWrapper label="Sort Direction" style={{ minWidth: 150 }}>
              <StyledSelect value={sortDirection} onChange={e => setSortDirection(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </StyledSelect>
            </StyledDropdownWrapper>
          </label>
          <label htmlFor="pageSize" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
            <span>Page Size: </span>
            <StyledDropdownWrapper label="Page Size" style={{ minWidth: 150 }}>
              <StyledSelect value={votesPerPage} onChange={e => setVotesPerPage(parseInt(e.target.value, 10))}>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </StyledSelect>
            </StyledDropdownWrapper>
          </label>
        </div>
        <div style={{ display: 'flex', gap: '2em', justifyContent: 'center', marginBottom: '2em' }}>
          <Button skin="filled-primary" onClick={() => setEmailVisible(true)}>
            {subscribed ? 'Unsubscribe from Announcements' : 'Subscribe to Announcements'}
          </Button>
          {canAccessAdmin && (
            <Button 
              skin="filled-primary" 
              disabled={loading}
              onClick={() => navigate('/admin')}>
              Enter a New Issue to Vote On
            </Button>
          )}
        </div>
      </FieldSet>

      {/* Voting Power */}
      <FieldSet legend="YOUR VOTING POWER" style={{ marginBottom: '2em', textAlign: 'center' }}>
        <div>
          Your Trust Score: <strong>{(userTrust ?? 0).toLocaleString()} | </strong>
          Your Voting Weight: <strong>{(Number(userWeight).toLocaleString(undefined, { maximumFractionDigits: 6 }))} | </strong>
          Number of Votes You've Cast: <strong>{userVotesCast?.toLocaleString() ?? 'loading...'}</strong>
        </div>
      </FieldSet>

      {/* Voting Issue List */}
      <div style={{ position: 'relative' }}>
        <FieldSet legend={votesFieldsetLegend} style={{ marginBottom: '2em' }}>
          {/* Busy Indicator - positioned relative to the wrapper div */}
          {showBusyIndicator && (
            <div 
              style={{
                position: 'absolute',
                top: '0px',
                left: '0px',
                right: '0px',
                height: '3px',
                background: 'linear-gradient(90deg, #00b7fa 0%, #00ff8f 50%, #00b7fa 100%)',
                backgroundSize: '200% 100%',
                animation: 'busySlide 1.5s ease-in-out infinite',
                borderRadius: '3px 3px 0 0',
                zIndex: 1000
              }}
            />
          )}
          
          {status === "loading"  && voteList.length == 0 ? (
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: 'red' }}>Loading...</span>
            </div>
          ) : status === "searching" ? (
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: 'red' }}>Searching...</span>
            </div>
          ) : (
            voteList.length === 0 ? (
              <p style={{ textAlign: 'center' }}>No voting issues to display for this filter.</p>
            ) : (
              voteList.map(vote => (
                <FieldSet
                  key={vote.address}
                  legend={<React.Fragment><span>Title: </span><span style={{ color: 'rgb(0, 183, 250)' }}>{vote.title}</span></React.Fragment>}
                  style={{
                    marginBottom: '2em',
                    borderLeft: '4px solid #00b7fa',
                    background: '#282a30',
                    boxShadow: '0 2px 12px #0002',
                    borderRadius: '10px',
                    padding: '1.5em',
                  }}
                >
                  <div style={{ fontSize: '0.98em', marginBottom: '0.7em' }}>
                    <div>
                      Hashtag: <span style={{ color: '#00ff8f', fontWeight: 'bold' }}>{vote.hashtag}</span>
                    </div>
                    <div>Created On: {new Date(vote.created_at * 1000).toLocaleDateString()}</div>
                    <div>Deadline: {new Date(vote.deadline * 1000).toLocaleDateString()}</div>
                    <div>Number of Votes Cast: {vote.voteCount?.toLocaleString() ?? '0'}</div>
                  </div>
                  {vote.account_addresses && (
                    <div style={{ marginBottom: '0.5em' }}>
                      {vote.account_addresses.map((opt, idx) => {
                        const label = vote.option_labels?.[idx] || `Option ${idx + 1}`;
                        const address = opt.address || opt;
                        const weightedCount = Number(weightedVoteCounts?.[vote.slug]?.[address] ?? 0);
                        const totalWeighted = vote.account_addresses
                          .map(a => weightedVoteCounts?.[vote.slug]?.[a.address || a] ?? 0)
                          .reduce((acc, count) => acc + Number(count), 0);
                        const percent = totalWeighted > 0 ? (weightedCount / totalWeighted) * 100 : 0;
                        return (
                          <div key={address} style={{ marginBottom: '0.3em' }}>
                            <strong>{label}</strong> - {(weightedCount / WEIGHT_SCALE_FACTOR).toLocaleString(undefined, { maximumFractionDigits: 2 })} weighted NXS
                            <span style={{ marginLeft: '0.5em', color: '#888' }}>
                              ({percent.toFixed(2)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1em', marginTop: '1em' }}>
                    <Button skin="filled-primary" style={{ flex: 1 }} onClick={() => handleViewOrEdit('view', vote)} disabled={userTrust < vote.min_trust}>
                      Details/Vote
                    </Button>
                    {vote.creatorGenesis == genesis && (
                      <Button skin="filled" style={{ flex: 1 }} onClick={() => handleViewOrEdit('edit', vote)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </FieldSet>
              ))
            )
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1em', marginTop: '2em', flexWrap: 'wrap' }}>
            <Button skin="filled-primary" onClick={() => handleSwitchPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
            {[...Array(totalPages)].map((_, idx) => (
              <Button
                skin={currentPage === idx + 1 ? 'filled-primary' : 'filled'}
                key={idx + 1}
                onClick={() => handleSwitchPage(idx + 1)}
              >{idx + 1}</Button>
            ))}
            <Button skin="filled-primary" onClick={() => handleSwitchPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </FieldSet>
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

      {/* Modals */}
      {searchVisible && (
        <Modal id="searchEntryDialog" escToClose={true} removeModal={closeSearchModal} style={{ width: '500px' }}>
          <Modal.Header>Choose a key to search on,<br />and enter a word to search<br />(case-sensitive)</Modal.Header>
          <Modal.Body>
            <StyledDropdownWrapper label="Search Key">
              <StyledSelect value={searchKey} onChange={e => setSearchKey(e.target.value)}>
                <option value="title">Title</option>
                <option value="hashtag">Hashtag</option>
              </StyledSelect>
            </StyledDropdownWrapper>
            <StyledTextField label="SearchTerm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </Modal.Body>
          <ModalFooterBar>
            <Button skin="filled-primary" onClick={handleStartSearch} disabled={!searchTerm || !searchKey}>Search</Button>
            <Button skin="filled" onClick={closeSearchModal}>Cancel</Button>
          </ModalFooterBar>
        </Modal>
      )}
      {emailVisible && (
        <Modal id="emailEntryDialog" escToClose={true} removeModal={() => setEmailVisible(false)} style={{ width: '500px' }}>
          <Modal.Header>Enter your email</Modal.Header>
          <Modal.Body>
            <StyledTextField label="Email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
          </Modal.Body>
          <ModalFooterBar>
            <Button skin="filled-primary" onClick={handleSubscriptionToggle} disabled={!userEmailValid}>Submit</Button>
            <Button skin="filled" onClick={resetEmailModal}>Cancel</Button>
          </ModalFooterBar>
        </Modal>
      )}
      {isDonating && (
        <Modal id="DonationDialog" escToClose={true} removeModal={() => setIsDonating(false)} style={{ width: '500px' }}>
          <Modal.Header>Thank you!<br />How many NXS<br />do you wish to donate?</Modal.Header>
          <Modal.Body>
            <StyledTextField label="DonationAmount" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
          </Modal.Body>
          <ModalFooterBar>
            <Button skin="filled-primary" onClick={handleDonation} disabled={!donationAmount || !senderAddress || donationSent}>Donate</Button>
            <Button skin="filled" onClick={resetDonationModal}>Cancel</Button>
          </ModalFooterBar>
        </Modal>
      )}

      <style>
        {`
          @keyframes busySlide {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}
      </style>
    </Panel>
  );
}

export default VotingPageStyled;