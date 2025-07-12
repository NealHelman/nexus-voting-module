const initialState = {
  issuesCache: {}, // { [issueId]: { data, timestamp } }
  currentIssue: null,
  issueFetched: false,
  issueId: '',
  issue: {},
  issueCache: {},
  title: '',
  description: '',
  optionLabels: ['', ''],
  optionAddresses: [],
  minTrust: '10000',
  voteFinality: 'one_time',
  organizerName: '',
  organizerTelegram: '',
  deadline: '',
  summaryPro: '',
  summaryCon: '',
  possibleOutcomes: '',
  supportingDocs: [],
  createdBy: '',
  createdAt: '',
  userGenesis: '',
  creatorGenesis: '',
  jsonGuid: '',
  analysisGuid: '',
  senderAddress: '',
  userTrust: 0,
  userWeight: 0,
  userHasEnoughTrustToVote: false,
  userIneligibleToVote: false,
  userCurrentlyVotedOn: '',
  userVotesCastOverall: 0,
  votingOver: false,
  optionVotedOn: '',
  votingAuthoritySigchain: '',
  votingAuthorityAccount: '',
  votingAuthorityGenesis: '',
  donationRecipient:'',
  donationAmount: 0
};

export default function issue(state = initialState, action) {
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
    case 'SET_ISSUE_FETCHED':
      return { ...state, issueFetched: action.payload };
    case 'SET_ISSUE_ID':
      return { ...state, issueId: action.payload };
    case 'SET_ISSUE':
      return { ...state, issue: action.payload };
    case 'SET_ISSUE_CACHE':
      return { ...state, issueCache: action.payload };
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    case 'SET_OPTION_LABELS':
      return { ...state, optionLabels: action.payload };
    case 'SET_OPTION_ADDRESSES':
      return { ...state, optionAddresses: action.payload };
    case 'SET_MIN_TRUST':
      return { ...state, minTrust: action.payload };
    case 'SET_VOTE_FINALITY':
      return { ...state, voteFinality: action.payload };
    case 'SET_ORGANIZER_NAME':
      return { ...state, organizerName: action.payload };
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
    case 'SET_USER_GENESIS':
      return { ...state, userGenesis: action.payload };
    case 'SET_JSON_GUID':
      return { ...state, jsonGuid: action.payload };
    case 'SET_ANALYSIS_GUID':
      return { ...state, analysisGuid: action.payload };
    case 'SET_SENDER_ADDRESS':
      return { ...state, senderAddress: action.payload };
    case 'SET_USER_TRUST':
      return { ...state, userTrust: action.payload };
    case 'SET_USER_HAS_ENOUGH_TRUST_TO_VOTE':
      return { ...state, userHasEnoughTrustToVote: action.payload };
    case 'SET_USER_INELIGIBLE_TO_VOTE':
      return { ...state, userIneligibleToVote: action.payload };
    case 'SET_USER_CURRENTLY_VOTED_ON':
      return { ...state, userCurrentlyVotedOn: action.payload };
    case 'SET_USER_VOTES_CAST_OVERALL':
      return { ...state, userVotesCastOverall: action.payload };
    case 'SET_VOTING_OVER':
      return { ...state, votingOver: action.payload };
    case 'SET_OPTION_VOTED_ON':
      return { ...state, optionVotedOn: action.payload };
    case 'SET_VOTING_AUTHORITY_SIGCHAIN':
      return { ...state, votingAuthoritySigchain: action.payload };
    case 'SET_VOTING_AUTHORITY_GENESIS':
      return { ...state, votingAuthorityGenesis: action.payload };
    case 'SET_DONATION_RECIPIENT':
      return { ...state, donationRecipient: action.payload };
    case 'SET_DONATION_AMOUNT':
      return { ...state, donationAmount: action.payload };
    default:
      return state;
  }
}