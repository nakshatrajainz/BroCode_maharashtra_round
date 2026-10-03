# ModelLedger handoff

Use this file when switching tools or people. Keep it current. Do not put secrets here.

## What this project is

ModelLedger proves the story of a picture on a public notebook:

1. An allowed company stamps a picture (create / edit / publish).
2. Anyone uploads the file later and gets **Trusted**, **Self-asserted**, or **Unverifiable**.

Hackathon: BroCode, blockchain problem 3. Deadline ~ Sunday 12:00 noon IST.

## Money: you do not pay

The notebook lives on **BNB Smart Chain testnet** (chain id **97**). That network uses **tBNB**, which is fake gas for developers.

- tBNB has **no real value**.
- You get it from a **faucet** (free drip).
- You never buy mainnet BNB for this project.

Some faucet pages ask for a tiny bit of **real** mainnet BNB as anti-bot. **Skip those.** Use a free faucet instead (list below).

### What the “keeper” is

- A throwaway testnet wallet whose private key lives only in `.env` as `LEDGER_KEEPER_PRIVATE_KEY`.
- The website server uses it to call `registerCompany` / `setAllowed` on `contracts/Ledger.sol`.
- Current keeper address (safe to share): `0x3871ceF36cDeD546A9b09004D8a77c55669AbC69`
- Private key: only in local `.env`. Never commit it. Never paste it into docs or chat if you can avoid it.

### Free faucet options (prefer these)

Many web faucets now demand **mainnet** dust as anti-bot. That is real money — skip them.

**Truly free paths (no mainnet balance):**

1. BNB Chain Discord — open a support ticket and ask for tBNB to the keeper address: https://discord.gg/bnbchain  
   Docs: https://docs.bnbchain.org/bnb-smart-chain/developers/faucet/
2. Telegram: message `@bnbchain_official_bot` with something like:  
   `I would like to get tBNB to my wallet 0x3871ceF36cDeD546A9b09004D8a77c55669AbC69`
3. QuickNode (free, but needs MetaMask connect + often a tweet): https://faucet.quicknode.com/binance-smart-chain/bnb-testnet  
   Import the keeper private key into a throwaway MetaMask account on **BNB Smart Chain Testnet**, then Connect Wallet there.

**Do not use these if they ask for mainnet funds:**

- https://www.bnbchain.org/en/testnet-faucet → error **"less than 0.002 BNB on BSC Mainnet"** → close it. Do not buy BNB.
- https://faucet.chainstack.com/bnb-testnet-faucet → wants **0.08 ETH on Ethereum mainnet** → skip.

### If faucets keep failing — do this exactly

1. Close every faucet tab that mentions mainnet BNB or mainnet ETH.
2. Open Telegram → search `@bnbchain_official_bot` → Start → paste this exact message:

```text
I would like to get tBNB to my wallet 0x3871ceF36cDeD546A9b09004D8a77c55669AbC69
```

3. Wait for a reply with a transaction hash (can take a few minutes).
4. In the project folder run:

```bash
npm run ledger:deploy
```

5. If it still says `Balance 0 tBNB`, Discord ticket at https://discord.gg/bnbchain with the same address.
6. If Discord/Telegram also fail tonight: **stop fighting the faucet**. Reply in chat `build phase 2` — we continue Create/Check offline; deploy the contract later when any teammate gets free tBNB. The app already works without `LEDGER_CONTRACT_ADDRESS`.

Paste the keeper address above. Wait for the tx. Then deploy.

### Meanwhile (no faucet yet)

Registration still works in Supabase when `LEDGER_CONTRACT_ADDRESS` is empty. Product work on Phase 2 Create can continue; on-chain writes stay queued until the contract is deployed.

### Local-only alternative (coding, not the judge demo)

You can develop against a local chain later if needed. The **locked demo target** is still BNB testnet so judges can open the notebook outside our site. Do not switch the public demo to a private chain unless the team explicitly changes `docs/PLAN.md`.

Until `LEDGER_CONTRACT_ADDRESS` is set, registration still works in Supabase only (no on-chain write). That is intentional so product work can continue.

## Two surfaces

| Surface | Routes | Auth |
|---|---|---|
| Public check | `/check` | No |
| Company workspace | `/register`, `/create` | Yes |

No admin portal. Keeper wallet = admin.

## Phase status (update this when you finish a step)

| Phase | Status | Notes |
|---|---|---|
| 0 Shell | **Done** | Home, Register, Create, Check render |
| 1 Accounts + stamps | **Done** | Supabase auth, companies, sealed stamp keys |
| 1 On-chain register | **Deployed** | Ledger `0x500c480786a6e07347860d9ba784cb3cda545236` on BSC testnet; keeper still has leftover tBNB |
| 2 Create picture line | **Done** | `/create` accepts PNG upload (or prepared sample); stamps + download; on-chain when company has `chain_tx` |
| 3 Check page | **Done** | `/check` upload → Trusted / Self-asserted / Unverifiable |
| 4 Editor + Publisher | **Next** | Parent links |
| 5 Hard cases | Not started | See cases in `docs/PLAN.md` |
| 6 Public demo | Not started | Vercel + rehearsed scenes |

## Hackathon pitch (one line)

**Demo the website. Pitch the company API.**

- Judges click: Register → Create (stamp) → Check (Trusted / Self-asserted / Unverifiable)
- Story: in production, Aura plugs ModelLedger into their generate→deliver pipeline; consumers only ever Check
- Public notebook on BNB testnet is the record outside our site

## Exact next steps

### A. Finish Phase 1 on-chain (mostly done)

- Ledger deployed: `0x500c480786a6e07347860d9ba784cb3cda545236`
- `LEDGER_CONTRACT_ADDRESS` is in local `.env`
- Deploy used ~0.0001 tBNB; ~0.0999 tBNB left (plenty)
- **Next:** register a **new** company (old rows have empty `chain_tx`). Then stamp on `/create` and confirm both `companies.chain_tx` and `picture_lines.chain_tx` fill in.

### B. Phase 3 Check — done (hardened)

- `/check` — public upload, optional claimed maker name
- Verdict engine in `src/lib/verdict.ts` (hidden id → exact → lookalike lookup; company join normalized; story lines oldest→newest)
- Honest stamped file → Trusted
- Unknown file + claim name → Self-asserted
- Unknown file, no claim → Unverifiable
- Stamped PNGs are checked without re-encoding (keeps hidden id + exact fingerprint)
- Upload limit raised to 9mb via `experimental.serverActions.bodySizeLimit`
- Smoke: `npm run smoke:stamp`

### C. Next: Phase 4 Editor + Publisher

Editor resize line + Publisher post line pointing at parent; Check already walks parents.

## Phase 2 Create — what was built

- `/create` accepts PNG / JPEG / WebP (converts to stamped PNG so the hidden id can live in the file)
- `/check` accepts the same; stamped PNGs are checked without re-encoding
- Exact fingerprint = keccak of file bytes; look-alike = keccak of 32×32 pixel sample
- Private sentence sealed into `prompt_envelopes.sealed_blob` (no plaintext column)
- Public hash in `picture_lines.sealed_prompt_hash`
- Download stamped PNG from the success panel
- If ledger configured **and** company has `chain_tx`, calls `writeLine` on chain
- Otherwise saves Supabase only and says notebook write is pending

### Tables added

- `picture_lines` — line metadata + optional `chain_tx`
- `prompt_envelopes` — sealed blob only (RLS: no client policies; server secret key)

### Key files

- `src/app/create/page.tsx`, `create-form.tsx`, `actions.ts`
- `src/lib/pictures.ts`, `src/lib/prompts.ts`
- `src/lib/stamps.ts` — now includes `unsealPrivateKey`
- `src/lib/ledger.ts` — `signLinePayload`, `writeLineOnChain`

## Env vars (never commit values)

See `.env.example`. Required for register today:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `STAMP_KEY_SECRET`

Required for on-chain register:

- `BNB_TESTNET_RPC_URL` (default publicnode is fine)
- `LEDGER_KEEPER_PRIVATE_KEY`
- `LEDGER_CONTRACT_ADDRESS`

Secrets live in local `.env` (this repo currently uses `.env`, not only `.env.local`).

## Supabase

- Project ref: `evcxeucgzsamvmsvlsjd` (ap-south-1)
- Tables: `companies` (incl. `chain_tx`), `stamp_keys`
- RLS on; server uses secret key for inserts of sealed keys

## Important files

- Plan: `docs/PLAN.md`
- This handoff: `docs/HANDOFF.md`
- Contract: `contracts/Ledger.sol`
- Register: `src/app/register/*`
- Ledger client: `src/lib/ledger.ts`
- Stamps: `src/lib/stamps.ts`
- Categories: `src/lib/categories.ts`
- Local agent notes (do not commit): `.cursor/rules/project.mdc`

## Attribution / git rules

- Use existing git identity only. Never change git config.
- Never add Co-authored-by or tool names in commits or tracked files.
- Do not commit `.env`, `.env.local`, or `.cursor/`.

## When you finish work in a session

Update the phase table above and the “Exact next steps” section so the next tool can continue without re-discovering state.
