# Nexus Community Voting Module

This is a React-based voting module for the [Nexus Interface](https://nexus.io), designed to allow community members to create, view, and vote on governance proposals directly within the desktop wallet.

---

## 📦 Features

- View a list of current voting issues
- Cast votes using 0.000001 NXS sent to designated accounts
- Restrict voting issue visibility based on trust level
- Markdown support for vote descriptions, arguments, and outcome analysis
- Live tally of votes for each option
- Admin interface to create new voting issues
- Optional DFS/IPFS-based links to detailed analysis

---

## 📁 Module Structure
```
├── index.ts                        # Entry file for module routes and reducers
├── constants.js                   # Shared constants (e.g., minimum trust weight)
├── features/
│   └── voteSlice.js               # Redux slice to manage vote data
├── pages/
│   ├── VotingPage.jsx             # Main page listing all available votes
│   ├── IssuePage.jsx              # Details + voting interface for a single issue
│   └── AdminPage.jsx              # Admin panel to create voting issues
├── services/
│   └── nexusVotingService.js     # Handles Nexus API interactions
├── styles.css                     # Module-specific styles to match Nexus wallet
```

---

## ⚙️ Installation

1. Clone or download this repository.
2. Move the files into your Nexus Interface module directory.
3. Rebuild or restart the wallet to detect the new module.

---

## 🗳️ Voting Authority Backend (VAS)
This module expects a backend wallet with access to a Voting Authority Sigchain to:

- Create accounts for each vote option
- Create and register vote metadata assets
- Store vote metadata for all-chain discovery

> Endpoint: `POST /create-vote`

Expected `POST` payload format:
```json
{
  "title": "Proposal Title",
  "description": "Markdown-formatted description",
  "option_labels": ["Yes", "No"],
  "min_trust": 5,
  "vote_finality": "one_time",
  "organizer_name": "Jane Doe",
  "organizer_telegram": "@janedoe",
  "deadline": 1746720000,
  "analysis_link": "cid://bafy...",
  "summary_pro": "Markdown arguments for",
  "summary_con": "Markdown arguments against",
  "possible_outcomes": ["X happens", "Y happens"],
  "created_by": "...",
  "created_at": 1746610000
}
```

---

## 📋 Future Improvements

- Caching/memoization of vote tallies
- Improved mobile layout (for future wallet support)
- Custom token voting support
- IPFS gateway switching

---

## 👩‍💻 License
MIT or similar (to be defined by the project owner)
