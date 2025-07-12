const initialState = {
  issuesCache: {}, // { [issueId]: { data, timestamp } }
  currentIssue: null,
  adminListFetched: false,
  isEditing: false,
  editingId: '',
  title: '',
  description: '',
  optionLabels: ['', ''],
  minTrust: '10000',
  voteFinality: 'one_time',
  organizerName: '',
  organizerEmail: '',
  organizerTelegram: '',
  deadline: '',
  summaryPro: '',
  summaryCon: '',
  possibleOutcomes: '',
  supportingDocs: [],
  createdBy: '',
  createdAt: '',
  creatorGenesis: '',
  jsonGuid: '',
  analysisGuid: '',
  votingAuthoritySigchain: '',
  votingAuthorityAccount: '',
  donationRecipient: '',
  donationAmount: 0,
  namedAssetCost: 0,
  namedAccountCost: 0,
  submissionCost: 0
};

export default function admin(state = initialState, action) {
  switch (action.type) {
    case 'SET_CURRENT_ISSUE':
      return {
        ...state,
        currentIssue: action.payload,
      };
    case 'CLEAR_CURRENT_ISSUE':
      return {
        ...state,
        currentIssue: null,
      };
    case 'RESET_ISSUE_FORM':
      return {
        ...state,
        ...initialState,
      };
    case 'SET_ISSUE_CACHE':
      return {
        ...state,
        issuesCache: {
          ...state.issuesCache,
          [action.payload.issueId]: {
            data: action.payload.data,
            timestamp: action.payload.timestamp
          }
        }
      };
    case 'SET_ADMIN_LIST_FETCHED':
      return { ...state, adminListFetched: action.payload };
    case 'SET_IS_EDITING':
      return { ...state, isEditing: action.payload };
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload };
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    case 'SET_OPTION_LABELS':
      return { ...state, optionLabels: action.payload };
    case 'SET_MIN_TRUST':
      return { ...state, minTrust: action.payload };
    case 'SET_VOTE_FINALITY':
      return { ...state, voteFinality: action.payload };
    case 'SET_ORGANIZER_NAME':
      return { ...state, organizerName: action.payload };
    case 'SET_ORGANIZER_EMAIL':
      return { ...state, organizerEmail: action.payload };
    case 'SET_ORGANIZER_TELEGRAM':
      return { ...state, organizerTelegram: action.payload };
    case 'SET_DEADLINE':
      return { ...state, deadline: action.payload };
    case 'SET_SUMMARY_PRO':
      return { ...state, summaryPro: action.payload };
    case 'SET_SUMMARY_CON':
      return { ...state, summaryCon: action.payload };
    case 'SET_POSSIBLE_OUTCOMES':
      return { ...state, possibleOutcomes: action.payload };
    case 'SET_SUPPORTING_DOCS':
      return { ...state, supportingDocs: action.payload };
    case 'SET_CREATED_BY':
      return { ...state, createdBy: action.payload };
    case 'SET_CREATED_AT':
      return { ...state, createdAt: action.payload };
    case 'SET_CREATOR_GENESIS':
      return { ...state, creatorGenesis: action.payload };
    case 'SET_JSON_GUID':
      return { ...state, jsonGuid: action.payload };
    case 'SET_ANALYSIS_GUID':
      return { ...state, analysisGuid: action.payload };
    case 'SET_VOTING_AUTHORITY_SIGCHAIN':
      return { ...state, votingAuthoritySigchain: action.payload };
    case 'SET_VOTING_AUTHORITY_ACCOUNT':
      return { ...state, votingAuthorityAccount: action.payload };
    case 'SET_DONATION_RECIPIENT':
      return { ...state, donationRecipient: action.payload };
    case 'SET_DONATION_AMOUNT':
      return { ...state, donationAmount: action.payload };
    case 'SET_NAMED_ASSET_COST':
      return { ...state, namedAssetCost: action.payload };
    case 'SET_NAMED_ACCOUNT_COST':
      return { ...state, namedAccountCost: action.payload };
    case 'SET_SUBMISSION_COST':
      return { ...state, submissionCost: action.payload };
    default:
      return state;
  }
}