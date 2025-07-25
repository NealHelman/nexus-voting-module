const initialState = {
  voteListFetched: false,
  // View state (cache meta)
  currentPage: 1,
  votesPerPage: 10,
  sortField: 'created',
  sortDirection: 'desc',
  filter: 'active',
  searchTerm: '',
  // Vote data & meta
  voteList: [],
  weightedVoteCounts: {},
  voteListMeta: {
    currentPage: 1,
    votesPerPage: 10,
    sortField: 'created',
    sortDirection: 'desc',
    filter: 'active',
    searchTerm: ''
  },
  totalPages: 1,
  // User & admin state
  canAccessAdmin: 0,
  subscribed: 1,
  userTrust: 0,
  userWeight: 0,
  userEmail: '',
  userVotesCast: 0,
  minTrust: 0,
  senderAddress: '',
  votingAuthoritySigchain: '',
  votingAuthorityAccount: '',
  votingAuthorityGenesis: '',
  donationRecipient: '',
  namedAssetCost: 0,
  namedAccountCost: 0,
  fetchedAt: null,
  totalNumberOfVotingIssues: 0,
  votesFieldsetLegend: 'Voting Issues (Filtered & Sorted) - Showing 0 of 0 Total Votes'

};

export default function voting(state = initialState, action) {
  switch (action.type) {
    case 'SET_VOTE_LIST_FETCHED':
      return { ...state, voteListFetched: action.payload };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_VOTES_PER_PAGE':
      return { ...state, votesPerPage: action.payload };
    case 'SET_SORT_FIELD':
      return { ...state, sortField: action.payload };
    case 'SET_SORT_DIRECTION':
      return { ...state, sortDirection: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_VOTE_LIST':
      return { ...state, voteList: action.payload };
    case 'SET_WEIGHTED_VOTE_COUNTS':
      return { ...state, weightedVoteCounts: action.payload };
    case 'SET_VOTE_LIST_META':
      return { ...state, voteListMeta: action.payload };
    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload };
    case 'SET_CAN_ACCESS_ADMIN':
      return { ...state, canAccessAdmin: action.payload };
    case 'SET_SUBSCRIBED':
      return { ...state, subscribed: action.payload };
    case 'SET_USER_TRUST':
      return { ...state, userTrust: action.payload };
    case 'SET_USER_WEIGHT':
      return { ...state, userWeight: action.payload };
    case 'SET_USER_EMAIL':
      return { ...state, userEmail: action.payload };
    case 'SET_USER_VOTES_CAST':
      return { ...state, userVotesCast: action.payload };
    case 'SET_MIN_TRUST':
      return { ...state, minTrust: action.payload };
    case 'SET_SENDER_ADDRESS':
      return { ...state, senderAddress: action.payload };
    case 'SET_VOTING_AUTHORITY_SIGCHAIN':
      return { ...state, votingAuthoritySigchain: action.payload };
    case 'SET_VOTING_AUTHORITY_ACCOUNT':
      return { ...state, votingAuthorityAccount: action.payload };
    case 'SET_VOTING_AUTHORITY_GENESIS':
      return { ...state, votingAuthorityGenesis: action.payload };
    case 'SET_DONATION_RECIPIENT':
      return { ...state, donationRecipient: action.payload };
    case 'SET_NAMED_ASSET_COST':
      return { ...state, namedAssetCost: action.payload };
    case 'SET_NAMED_ACCOUNT_COST':
      return { ...state, namedAccountCost: action.payload };
    case 'SET_FETCHED_AT':
      return { ...state, fetchedAt: action.payload };
    case 'SET_TOTAL_NUMBER_OF_VOTING_ISSUES':
      return { ...state, totalNumberOfVotingIssues: action.payload };
    case 'SET_VOTES_FIELDSET_LEGEND':
      return { ...state, votesFieldsetLegend: action.payload };
    default:
      return state;
  }
}