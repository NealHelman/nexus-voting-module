const initialState = {
  inputValue: '', // preserve your controlled input if needed
  lastVisitedPath: '/voting', // default path or whatever makes sense
  // ...any other UI state
};

export default function ui(state = initialState, action) {
  switch (action.type) {
    case 'SET_LAST_VISITED_PATH':
      return { ...state, lastVisitedPath: action.payload };
    case 'UPDATE_INPUT':
      return { ...state, inputValue: action.payload };
    // ...other UI cases
    default:
      return state;
  }
}