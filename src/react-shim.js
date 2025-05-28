if (typeof NEXUS !== 'undefined' && NEXUS.libraries?.React && NEXUS.libraries?.ReactDOM) {
  window.React = NEXUS.libraries.React;
  window.ReactDOM = NEXUS.libraries.ReactDOM;
} else {
  console.warn('[Shim] Using fallback React versions');
  window.React = require('react');
  window.ReactDOM = require('react-dom/client');
}
