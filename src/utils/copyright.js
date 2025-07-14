const React = NEXUS.libraries.React;

  const {
    components: { Tooltip }
  } = NEXUS;

export function Copyright() {
  const baseYear = 2025;
  const currentYear = new Date().getFullYear();
  const yearString = currentYear === baseYear
    ? `${baseYear}`
    : `${baseYear}-${currentYear}`;

  const style = { cursor: 'pointer', color: '#00b7fa', marginLeft: 6 };
  const profilePic = <img src="Neal.png" width={64} alt="Neal Helman" />;

  return (
    <div style={{ justifySelf: 'end' }}>
      <span>copyright = © {yearString},</span>
      <Tooltip.Trigger
        tooltip={
        <div style={{ textAlign: 'center' }}>
          <img src="Neal.png" width={96} alt="Neal Helman" style={{ borderRadius: '8px' }} />
          <div style={{ marginTop: 8, fontSize: 14, color: '#fff' }}>
            <div>
              neal.helman@nexus.io
            </div>
            <div>
                @nhelman64
            </div>
          </div>
        </div>
        }
        position='top'>
        <span style={style}>Neal Helman</span>
      </Tooltip.Trigger>
      <span>- Created with lots of help from</span>
      <Tooltip.Trigger tooltip="Mostly GitHub CoPilot, and smidgen of ChatGPT" position='top'>
        <span style={style}>AI.</span>
      </Tooltip.Trigger>
    </div>
  );
}