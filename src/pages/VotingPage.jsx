const React = NEXUS.utilities.React;
import { connect } from 'react-redux';

function VotingPage({ initialized, theme }) {
  console.log('🟩 VotingPage rendering:', { initialized, theme });

  if (!initialized) {
    return React.createElement('div', null, '⏳ Waiting...');
  }

  return React.createElement(
    'div',
    { style: { padding: '2rem', background: theme?.background || 'black', color: theme?.foreground || 'lime' } },
    `✅ VotingPage loaded with background ${theme?.background}`
  );
}

const mapStateToProps = (state) => ({
  initialized: state.nexus?.initialized,
  theme: state.nexus?.theme,
});

export default connect(mapStateToProps)(VotingPage);
