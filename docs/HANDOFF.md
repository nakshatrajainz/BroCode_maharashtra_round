# ModelLedger handoff

Use this file when switching tools or people. Keep it current. Do not put secrets here.

## What this project is

ModelLedger proves the story of a picture on a public notebook:

1. An allowed company stamps a picture (create / edit / publish).
2. Anyone uploads the file later and gets **Trusted**, **Self-asserted**, or **Unverifiable**.

Hackathon: BroCode, blockchain problem 3. Deadline ~ Sunday 12:00 noon IST.

## Correct end-to-end flow (must work)

1. **Register** a Maker (on-chain). Optionally register Editor + Publisher with **different names**.
2. **/create → Step Create** — upload a **fresh** (unstamped) image → download the stamped PNG.
3. **/create → Step Edit** — upload that **exact downloaded PNG** (not a screenshot) → resize + stamp → download again.
4. **/create → Step Publish** — upload the editor download → stamp as posted → download.
5. **/check** — upload the last download → **Trusted** with story: Created → Changed → Posted.

### Critical implementation rule

- **Stamped PNGs must never be re-encoded** with Sharp before reading the hidden id.
- Create and Check: if the upload is already a PNG, keep bytes as-is; only convert JPEG/WebP → PNG.
- Re-encoding strips `tEXt ModelLedger.Id`, so Editors think the file is “not stamped” and parent chains break.

### Stamp rules

| Role | Upload | Result |
|---|---|---|
| Maker | Fresh / unstamped only | First line, new hidden id |
| Editor | Must contain hidden id | Resize + new line with `parent_line_id` |
| Publisher | Must contain hidden id | Post line with `parent_line_id` |

Maker re-stamp of an already-stamped file is rejected.

## Two surfaces

| Surface | Routes | Auth |
|---|---|---|
| Public check | `/check` | No |
| Company workspace | `/register`, `/create` | Yes (Sign in). Register = add company while signed in |

Header: **Check** (anyone) · **Companies** (`/register`) · **Stamp** (`/create`) · Sign in / email + Sign out.

No admin portal. Keeper wallet = admin.

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 0–3 | **Done** | Shell, auth, Maker stamp, Check verdicts |
| 1 On-chain | **Deployed** | Ledger `0x500c480786a6e07347860d9ba784cb3cda545236` |
| 4 Editor + Publisher | **Done** (fix parent PNG preserve) | Parent links + Check path |
| 5 Hard cases | **Core done** | Reveal, revoke, dual-maker, post-revoke |
| 6 Public demo | In progress | UI polish + AI models; Vercel next |

## Hackathon pitch

**Demo the website. Pitch the company API.** Full 5-min script: [docs/PITCH.md](PITCH.md).

Judges: Register (approve AI models) → Stamp (Create/Edit/Publish with model) → Check (company + model + time). Production: companies call stamp API in their pipeline; consumers only Check. Notebook on BNB testnet.

## Env (never commit values)

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- Stamps: `STAMP_KEY_SECRET`
- Chain: `BNB_TESTNET_RPC_URL`, `LEDGER_KEEPER_PRIVATE_KEY`, `LEDGER_CONTRACT_ADDRESS`
- Local file: `.env` (not committed)

Keeper address: `0x3871ceF36cDeD546A9b09004D8a77c55669AbC69`  
Faucets: see older notes — use Telegram/Discord free tBNB; skip mainnet-gated faucets.

## Tables

- `companies` (+ `chain_tx`, `allowed`, `revoked_at`)
- `stamp_keys`
- `picture_lines` (+ `parent_line_id`, fingerprints, `hidden_id`, `chain_tx`)
- `prompt_envelopes` (sealed blob only)

## Key files

- `/create` — `src/app/create/*` (role steps Create/Edit/Publish)
- `/check` — `src/app/check/*`, `src/lib/verdict.ts`
- Pictures — `src/lib/pictures.ts` (`normalizeToPng`, `embedHiddenId`, `extractHiddenId`, `resizePngHalf`)
- Ledger — `src/lib/ledger.ts`, `contracts/Ledger.sol`
- Docs — `docs/PLAN.md`, this file

## Known pitfall (fixed)

Editor/Publisher upload of stamped PNG was passed through `normalizeToPng` (Sharp), wiping the hidden id → false “not stamped” / no parent story on Check. Preserve PNG bytes when already PNG.

## AI models

- Table `company_models` (per company). Makers must approve ≥1 model at Register.
- Stamp stores `picture_lines.ai_model` + `model_id`. Check shows company, model, stamped time.
- Add more models on `/create` → Approved AI models.

## Next

1. Deploy Vercel (framework: **Next.js**). Set all `.env` keys in Project Settings → Environment Variables (Production).
2. Rehearse Create (with model) → Edit → Publish → Check Trusted.
3. Prefer new companies registered **after** ledger deploy so `chain_tx` is set.
4. Practice [docs/PITCH.md](PITCH.md) once out loud.

## Attribution / git

Use existing git identity only. No Co-authored-by. Do not commit `.env` or `.cursor/`.
