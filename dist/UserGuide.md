# Nexus Community Voting Module - User Guide

Welcome to the Nexus Community Voting Module --- a secure, on-chain
voting tool integrated with your Nexus desktop wallet. This guide will
walk you through installation, usage, and what to expect.

## 📦 Installation

1.  Open the Nexus Interface (desktop wallet)
2.  Go to *Settings \> Modules*
3.  Drag and drop the ZIP archive for this module onto the Modules page
4.  Restart the wallet if prompted

> ✅ Make sure you have a wallet with sufficient trust level to
> participate in or administer votes

## 🗳 Browsing and Participating in Votes

Once installed, open the **Voting** tab in the Nexus wallet. There, you
can:

### 🔍 View Open Voting Issues

- See the title, description, organizer, and Telegram handle
- Read summaries of each position (Pro and Con)
- See the deadline, required trust level, and finality setting
- Review possible outcomes
- View supporting documents (Markdown, PDF, or text) inline with syntax
  highlighting and lazy-loaded images

### ✅ Cast Your Vote

1.  Review the options and their current vote weights
2.  Click the **Vote** button for your choice
3.  You'll be prompted to enter your PIN
4.  Your vote sends 0.000001 NXS to the associated option account
    on-chain
5.  The transaction's reference field includes your weighted vote amount
    based on your trust and stake

> 💡 Your vote is recorded as a Nexus CREDIT transaction from your
> sigchain, with your weight calculated as *(trust + stake/1,000,000)*

### 🔒 Finality Options

- *****one_time*****: You can vote only once
- *****changeable*****: You may change your vote once --- only the
  **most recent valid vote** from your sigchain is counted

## 🧾 Submitting Voting Issues *(Admin Only)*

If your trust level meets the configured threshold, you'll see an
**Admin** tab where you can:

- Create a new voting issue

- Enter metadata: title, description, pro/con summaries, outcomes,
  deadline, etc.

  - Minimum trust score required to vote defaults to 10000
  - Deadline defaults to 30 days in the future

- Upload supporting documents (PDF, Markdown, text) to IPFS

- Preview your total data size (max 1KB compressed JSON payload)

- Submit the vote with a PIN prompt --- this sends NXS to the backend
  Voting Authority to fund asset and account creation

- Documents can be deleted before submission if desired

> ⛽ Cost: 2 NXS for the vote asset + 1 NXS per named voting option
> account

## 📊 Vote Counting and Security

- Vote counts are weighted sums based on each voter's trust and stake
- Tallying reads the *contracts.reference* from each debit transaction
  to retrieve vote weights
- Only the most recent valid vote per sigchain is included in the total
- Votes are pseudonymous: they are public on-chain but tied to a
  sigchain hash, not your name

> 🔐 The module does not store or expose personal data

## 📢 Announcements and Subscriptions

You can subscribe to be notified of new voting issues via:

- **Email:** A prompt in the Voting tab allows you to
  subscribe/unsubscribe using your email address and PIN. Emails are
  sent from *announcement@nexus-voting.com*.
- **Telegram:** New voting issues are optionally announced in a Nexus
  community Telegram channel.

## ❓ FAQ

**Q: Can I see who voted for what?**\
A: No. Voter identities are not shown, only aggregate weighted vote
counts.

**Q: Can I change my vote?**\
A: Only if the vote's finality setting is *changeable*, and you haven't
already changed it once.

**Q: Where are my votes stored?**\
A: On-chain in the Nexus ledger --- each vote is a 0.000001 NXS CREDIT
to the option account

**Q: Are vote weights public?**\
A: Yes. They are derived from public trust and stake metrics stored in
your trust account.

## 📬 Support and Feedback

If you need help or want to report a bug, contact the Voting Authority
or submit feedback through the official Nexus community channels.

Enjoy shaping the future of Nexus --- democratically and securely!
