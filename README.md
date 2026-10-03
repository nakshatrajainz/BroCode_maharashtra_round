# ModelLedger

BroCode, Maharashtra round. Blockchain problem 3.

ModelLedger checks the story of a picture: which allowed company stamped it, what happened afterwards, and whether the file still matches that story.

## Two surfaces

- **Public check** (`/check`) — anyone uploads a picture and gets Trusted, Self-asserted, or Unverifiable. No login.
- **Company workspace** (`/register`, `/create`) — register a Maker / Editor / Publisher, then stamp picture lines while signed in.

There is no admin dashboard. The server keeper wallet registers and revokes companies on the BNB notebook.

## Docs

- [docs/PLAN.md](docs/PLAN.md) — locked choices, phases, demo cases
- [docs/HANDOFF.md](docs/HANDOFF.md) — current status, next commands, free faucet steps (keep this updated when switching tools)

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Copy `.env.example` to `.env` before registration can save a company. Do not commit `.env` or `.env.local`.

## Ledger (BNB testnet — free, not real money)

The notebook is on **BNB Smart Chain testnet**. Gas uses **tBNB**, which has no cash value. You claim it from a faucet. You do **not** buy BNB.

1. Get free tBNB (no real money). Prefer Discord/Telegram or QuickNode — see [docs/HANDOFF.md](docs/HANDOFF.md).
   Close any page that says you need **0.002 BNB on BSC Mainnet** or mainnet ETH. That is the wrong faucet.
2. Deploy:

```bash
npm run ledger:compile
npm run ledger:deploy
```

3. Paste the printed `LEDGER_CONTRACT_ADDRESS` into `.env`.

Until that address is set, companies still save in Supabase; they are just not on the public notebook yet.

After the address is set, new registrations also write the public stamp onto the notebook.
