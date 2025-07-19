const {
  libraries: {
    emotion: { styled }
  }
} = NEXUS;

// Top-right icon button container
export const IconButtonBar = styled.div`
  position: absolute;
  top: 1em;
  right: 1em;
  z-index: 2;
  display: flex;
  gap: 1rem;
`;

// Main flex containers
export const CenteredColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const HorizontalFilterBar = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2em;
  justify-content: center;
  flex-wrap: wrap;
`;

export const HorizontalButtonBar = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
`;

export const ModalFooterBar = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

export const StatBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  margin-top: 1rem;
`;

export const VoteFieldSetWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  margin-top: 1rem;
`;

export const StyledLabel = styled.label`
  margin-bottom: auto;
  margin-top: auto;
  text-align: center;
`;

export const VoteList = styled.ul`
  padding-left: 0;
  list-style: none;
`;

export const VoteItem = styled.li`
  margin-bottom: 0;
`;

export const VoteItemContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #ccc;
`;

export const VoteItemTitle = styled.div`
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: ${({ theme }) => theme.primary};
`;

export const VoteItemDetails = styled.div`
  font-size: 0.9rem;
  line-height: 1.4;
`;

export const VoteItemButtonColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 130px;
`;

export const OptionList = styled.ul`
  font-size: 0.9rem;
  margin-top: 0.25em;
  margin-bottom: 0.25em;
`;

export const OptionItem = styled.li``;

export const StyledGridFooter = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  font-size: small;
  margin-top: 2em;
`;

export const VersionLeft = styled.div`
  justify-self: start;
`;

export const DonateCenter = styled.div`
  justify-self: center;
`;

export const StyledModalBody = styled.div`
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.foreground};
  padding: 2em;
`;

export const LoadingText = styled.span`
  color: red;
`;

export const StyledDropdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 180px;
  margin-bottom: 1em;

  label {
    color: ${({ theme }) => theme.text || '#f5f7fa'};
    font-weight: bold;
    margin-bottom: 4px;
    font-size: 1em;
  }
`;

export const StyledSelect = styled.select`
  background: ${({ theme }) => theme.inputBackground || '#23262c'};
  color: ${({ theme }) => theme.text || '#f5f7fa'};
  border: 2px solid ${({ theme }) => theme.primary || '#00b7fa'};
  border-radius: 8px;
  padding: 0.6em 1em;
  font-size: 1em;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.accent || '#1875f1'};
  }
`;

export const ModalButton = styled.button`
  padding: 0.7em 2em;
  border-radius: 6px;
  border: none;
  font-size: 1.1em;
  cursor: pointer;
  font-weight: bold;
  background: ${({ skin, theme }) =>
    skin === 'danger'
      ? theme.danger || '#f03a47'
      : skin === 'filled'
      ? theme.buttonBg || '#444b56'
      : theme.buttonBg || '#294EFF'};
  color: ${({ skin, theme }) =>
    skin === 'danger'
      ? '#fff'
      : skin === 'filled'
      ? theme.text || '#f5f7fa'
      : '#fff'};
  transition: background 0.15s;

  &:hover {
    opacity: 0.85;
  }
`;

export const StyledTextField = styled.input`
  background-color: #121212;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  width: 100%;
  font-size: 0.95rem;
  font-family: 'Inter', 'Roboto', 'Arial', sans-serif;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  line-height: 1.4;

  &:focus {
    outline: none;
    border-color: #555;
    box-shadow: 0 0 0 2px rgba(51, 51, 51, 0.3);
  }

  &:hover {
    border-color: #444;
  }

  &::placeholder {
    color: #888;
    opacity: 1;
    font-style: italic;
  }

  &:disabled {
    background-color: #0a0a0a;
    color: #666;
    border-color: #222;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const StyledTextArea = styled.textarea`
  background-color: #121212;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  width: 100%;
  min-height: 100px;
  font-size: 0.95rem;
  font-family: 'Inter', 'Roboto', 'Arial', sans-serif;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: #555;
    box-shadow: 0 0 0 2px rgba(51, 51, 51, 0.3);
  }

  &:hover {
    border-color: #444;
  }

  &::placeholder {
    color: #888;
    opacity: 1;
    font-style: italic;
  }

  &:disabled {
    background-color: #0a0a0a;
    color: #666;
    border-color: #222;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Keep your existing StyledSelect and StyledDropdownWrapper as they are!

export const Strong = styled.strong``;