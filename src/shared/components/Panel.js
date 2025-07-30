const {
  libraries: {
    React,
    ReactDOM,
    emotion: { react, styled },
  },
  components: {
    Icon
  }
} = NEXUS;

const { keyframes } = NEXUS.libraries.emotion.react;
const { ComponentProps, ReactNode } = React;

const intro = keyframes`
  from { 
    transform: scale(0.92);
    opacity: 0.66 
  }
  to { 
    transform: scale(1);
    opacity: 1
  }
`;

const borderRadius = 4;

const PanelWrapper = styled.div({
  width: '100%',
  height: '100%',
  padding: '30px 10% 0 10%', // Remove bottom padding!
  display: 'flex',
  alignItems: 'stretch',
});

const PanelComponent = styled.div(({ theme }) => ({
  display: 'grid',
  gridTemplateAreas: '"header" "body"',
  gridTemplateRows: 'min-content 1fr',
  color: theme.foreground,
  width: '100%',
  height: '100%',
  animation: `${intro} .2s ease-out`,
}));

const PanelHeader = styled.div(({ theme }) => ({
  gridArea: 'header',
  background: theme.background,
  borderTopLeftRadius: borderRadius,
  borderTopRightRadius: borderRadius,
  padding: '10px 30px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: theme.mixer(0.75),
}));

const PanelTitle = styled.h3(({ theme }) => ({
  fontSize: 28,
  fontWeight: 'normal',
  margin: 0,
  color: theme.primary,
}));

const PanelBody = styled.div(({ theme }) => ({
  gridArea: 'body',
  background: theme.lower(theme.background, 0.3),
  borderBottomLeftRadius: borderRadius,
  borderBottomRightRadius: borderRadius,
  padding: '20px 30px 0 30px', // Remove bottom padding!
  paddingBottom: 0, // Explicitly set to 0
  position: 'relative',
  overflow: 'auto',
  overscrollBehavior: 'none',
  display: 'flex', // Add flex for better footer control
  flexDirection: 'column', // Stack content vertically
}));

const Panel = ({
  icon,
  title,
  controls,
  ref,
  children,
  allowStickyFooter = false,
  ...rest
}) => (
  <PanelWrapper {...rest}>
    <PanelComponent ref={ref}>
      <PanelHeader>
        <PanelTitle>
          {!!icon && <Icon className="mr0_4" icon={icon} />}
          <span className="v-align">{title}</span>
        </PanelTitle>
        {controls}
      </PanelHeader>

      <PanelBody style={allowStickyFooter ? { paddingBottom: 0 } : undefined}>
        {children}
      </PanelBody>
    </PanelComponent>
  </PanelWrapper>
);

export default Panel;