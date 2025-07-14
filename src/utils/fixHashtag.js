/**
 * Ensures hashtag is valid:
 * - Starts with a single '#'
 * - Only one '#' in the string
 * - At least one character after the '#'
 * - No spaces, no extra hashes
 * If it is invalid, returns a corrected version or null if cannot be fixed.
 * @param {string} hashtag
 * @returns {string|null} - Corrected hashtag or null if cannot fix
 */
export function fixHashtag(hashtag) {
  if (typeof hashtag !== 'string') return null;
  // Trim whitespace
  let tag = hashtag.trim();

  // Remove all '#' except the first, and ensure it starts with '#'
  tag = tag.replace(/#+/g, "#"); // collapse consecutive hashes
  if (!tag.startsWith("#")) tag = "#" + tag.replace(/^#*/, "");

  // Remove any subsequent '#' characters (keep only the first)
  tag = "#" + tag.slice(1).replace(/#/g, "");

  // Remove spaces and other whitespace
  tag = tag.replace(/\s/g, "");

  // Remove if nothing after '#'
  if (tag.length < 2) return null;

  // Validate again: starts with #, only one #, at least one char after, no spaces
  if (/^#[^#\s]+$/.test(tag)) return tag;
  return null;
}