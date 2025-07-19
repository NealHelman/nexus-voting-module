// theme.js
const marketplaceTheme = {
  // Core palette
  primary: "#00b7fa",             // Nexus cyan accent
  primaryAccent: "#282a30",       // Slightly lighter card bg
  background: "#212328",          // Main background
  foreground: "#f5f7fa",          // Main text
  card: "#282a30",                // Card backgrounds
  border: "#20232a",              // Borders
  accent: "#00ff8f",              // Green accent (for highlights/buttons)
  danger: "#ff4c4c",
  dangerAccent: "#fff",

  // Functions, can be improved for more complex color logic
  mixer: (amt = 1) => `rgba(0,183,250,${amt})`, // For overlays, lines, etc
  raise: (color, amt) => color,                 // For shadows, hover (implement if needed)
  lower: (color, amt) => color,                 // For pressed effect (implement if needed)
  fade: (color, amt) => `rgba(0,183,250,${amt})`,

  // Typography
  fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
  fontWeight: "normal",

  // Sizing
  borderRadius: "12px",
  cardRadius: "10px",

  // Shadows
  boxShadow: "0 0 32px #0009",
  cardShadow: "0 2px 12px #0002",
};

export default marketplaceTheme;