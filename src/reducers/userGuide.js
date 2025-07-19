const initialState = {
  senderAddress: '',
  donationRecipient: '',
  fetchedAt: null
};

export default function voting(state = initialState, action) {
  switch (action.type) {
    case 'SET_SENDER_ADDRESS':
      return { ...state, senderAddress: action.payload };
    case 'SET_DONATION_RECIPIENT':
      return { ...state, donationRecipient: action.payload };
    case 'SET_FETCHED_AT':
      return { ...state, fetchedAt: action.payload };
    default:
      return state;
  }
}