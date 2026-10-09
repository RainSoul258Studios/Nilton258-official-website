# Nilton258 Oficial Web

This folder is a self-contained Firebase website and backend, with the
Token258 Solidity contract and its deployment scripts. The supplied source
folder is left unchanged. Its `.env` file is not included; use `.env.example`
for local contract development and never commit private keys or API keys.

## Website preview

Use Node.js 22 for local development and deployment.

Install the project tools and start Firebase emulators:

```sh
npm install
npm --prefix functions install
npm run firebase:emulators
```

The Hosting emulator serves the full `public/` site. To test chat locally,
create `functions/.secret.local` with a `GEMINI_API_KEY=...` entry. That file is
ignored by Git; never put a live API key in frontend code.

## Firebase deployment

1. Sign in with `npx firebase-tools login`.
2. The local `.firebaserc` is already linked to `graphic-nexus-k4gkq`.
3. Upgrade the project to the Blaze plan; Firebase Cloud Functions and Secret
   Manager require a billable project.
4. Store the Gemini key with `npx firebase-tools functions:secrets:set GEMINI_API_KEY`.
5. Deploy with `npm run firebase:deploy`.

The chat endpoint validates and caps messages at 2,000 characters. The browser
renders chat messages as text, not HTML. Configure Firebase App Check and
appropriate billing alerts before sharing the public endpoint broadly.

The Gemini API key must be added to Firebase Secret Manager by the project
owner. The Firebase CLI must also be authenticated and the project must have
Blaze billing enabled before deployment.

## Token258 contract

Copy `.env.example` to `.env` and set an RPC URL, a test wallet private key,
and a real metadata directory URL in `INITIAL_TOKEN_URI`. Keep `.env` private.
Update the placeholder IPFS values in `metadata/` and upload the finished
metadata before deploying the contract.

Compile locally with `npm run compile`. The recommended deployment target is
Optimism Sepolia: `npm run deploy:optimism-sepolia`. Mainnet deployment is
blocked unless `ENABLE_MAINNET_DEPLOY=true` is explicitly set. Contract
deployment broadcasts an irreversible blockchain transaction and should only
be run after reviewing the network, account, gas, and metadata.

The wallet connection on the website only reads the connected public address
and, when the contract is deployed, its Token258 balance on Optimism Sepolia.
The address carried over from the source currently has no contract bytecode on
Optimism Sepolia or Optimism mainnet, so the page reports that the balance is
unavailable until a verified deployment address is configured. After deploying
and verifying the contract, update `tokenContractAddress` in
`public/js/web3-client.js`. The wallet connection does not request signatures
or send transactions.
