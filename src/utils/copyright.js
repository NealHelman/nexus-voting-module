const baseYear = 2025;
const currentYear = new Date().getFullYear();
const yearString = currentYear === baseYear
  ? `${baseYear}`
  : `${baseYear}-${currentYear}`;

export const copyright = `© ${yearString}, Neal Helman - Created with lots of help from AI.`;