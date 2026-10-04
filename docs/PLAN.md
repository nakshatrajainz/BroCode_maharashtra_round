# ModelLedger plan

BroCode. Blockchain problem 3. Deadline is around Sunday 12 noon.

ModelLedger lets a person upload a picture and see whether an allowed company stamped it, what happened to it afterwards, and whether that story still matches the file.

## Locked choices

- The website is a Next.js app and will be hosted on Vercel.
- Logins and private secrets live in a new Supabase project.
- The public notebook of stamps and picture lines lives on the BNB practice network. No real money.
- Demo pictures are prepared first. A live AI picture is added only if time remains.
- Judges get a public link. The laptop remains the backup.
- Three company categories: Maker, Editor, Publisher.
- Three answers: Trusted, Self-asserted, Unverifiable.

## Two surfaces (not three portals)

There is no separate consumer product and company product with different brands. One site, two jobs:

1. **Public check.** Anyone opens `/check`, uploads a picture, and gets one answer. No login.
2. **Company workspace.** Someone who stamps pictures signs in, registers on `/register`, and writes lines on `/create`. One account can hold at most one Maker, one Editor, and one Publisher.

**Admin is not a portal.** The keeper wallet on the server is the only admin. It registers and revokes companies on the BNB notebook. Revoke for the demo is a short server script, not a dashboard. Do not build an admin UI unless a judge needs a live revoke click and time remains.

## What each category may say

- **Maker.** "We created this picture." This is the first line. It does not point at an older line.
- **Editor.** "We changed this picture." The line must point at an earlier line.
- **Publisher.** "We posted this picture." The line must point at an earlier line.

Each company does exactly one job and has one stamp. A business that does two jobs registers two companies with two different names. One account can hold at most one Maker, one Editor, and one Publisher.

Registering is one step for a new visitor: pick the job, name the company, and make the account in the same form.

## Phases

### Phase 0. Website shell

The app runs locally with four pages: Home, Register, Create, and Check.

Done when someone can open the site and understand the three jobs without reading this file.

### Phase 1. Company registration

Accounts and stamps now save. A company signs in, picks a category, and receives one stamp. The private half stays on the server. When the ledger contract is deployed, registration also writes the public stamp onto the BNB notebook (`chain_tx` on `companies`). A company can later be removed from the allowed list. Old lines stay. New lines from a removed company do not count as Trusted.

Done when Aura can register as a Maker and ScaleKit can register as an Editor, and both appear on the allowed list on-chain.

### Phase 2. A created picture

A Maker stamps a prepared picture on `/create`. The line stores the exact fingerprint, the look-alike fingerprint, the hidden id inside the PNG, and a hash of the sealed private sentence. The sentence itself is not stored in plaintext (`prompt_envelopes` holds only the sealed blob).

Done offline when that picture can be downloaded and the line exists in Supabase. Done fully when the notebook also has the creation line (`picture_lines.chain_tx`).

### Phase 3. The check page

Anyone can upload a PNG on `/check` and receive one answer, one reason, and the list of lines. An optional “claimed maker” field covers the Self-asserted demo case.

Done when the honest stamped picture says Trusted and a phone photo with a fake claim says Self-asserted.

### Phase 4. Later steps

An Editor can add a resize line that points at the creation line. A Publisher can add a posting line. The check page shows the path in order.

**Rule:** stamped PNG uploads must keep their bytes (no Sharp re-encode) so the hidden id survives. Only JPEG/WebP convert to PNG.

Done when one picture shows created, then resized, then posted.

### Phase 5. The hard cases

The same check page must handle every case below.

### Phase 6. Public demo

The site is on a public Vercel link. The notebook is on the BNB practice network. The seven scenes are rehearsed on a fresh run.

## Cases the demo must show

1. A Maker creates a picture. Answer: Trusted. The private sentence stays hidden.
2. The same stamp is used on many pictures, each with its own line.
3. The creator chooses to open the sealed sentence later.
4. An Editor shrinks the picture and writes that down. Answer: Trusted, with both steps.
5. Someone re-saves the picture and writes nothing. The look-alike serial number and hidden id still match. Answer: Trusted.
6. Someone tears off the attached note. The hidden id still finds the line. Answer: Trusted.
7. A picture from a company that never registered. Answer: Unverifiable.
8. A person who is not a Maker writes "Aura made this" on a phone photo. Answer: Self-asserted.
9. That person registers under their own name and stamps the phone photo. The page shows their stamp, not Aura's.
10. Someone sticks an old note on a different picture. Answer: Unverifiable.
11. Someone paints over a trusted picture and leaves the old note. Answer: Unverifiable.
12. An allowed Editor makes a real change and writes it down. The origin stays visible. The current file is a changed copy, not the untouched original.
13. Two allowed Makers both claim they created the same picture. Answer: Unverifiable.
14. A line points at an earlier line that was never written. Answer: Unverifiable.
15. A company is removed from the allowed list. Old lines remain. New lines do not count as Trusted.
16. A stolen stamp is marked dead. Lines pressed after that moment fail.
17. Create, resize, and post are three lines. Answer: Trusted when every link is real and the file matches the last line.

## Where things live

- Website pages: what a person clicks.
- Supabase: accounts, and the private secrets that open a sealed sentence.
- BNB practice network: the allowed list and the picture lines. This is the record a judge can open outside our website.

## Order of work

Phase 0–5 core demo path is in: Maker/Editor/Publisher stamps, Check verdicts, reveal sentence, revoke. Stamped-PNG preserve bug on Create is fixed (see HANDOFF). Companies pre-approve AI models; stamps store model + time for Check. Next: Phase 6 public Vercel demo + rehearsal Create → Edit → Publish → Check.

## Testnet gas is free

BNB practice network uses **tBNB**. It is not real money. Get it free via Telegram/Discord — see [HANDOFF.md](HANDOFF.md). Skip any faucet that demands mainnet BNB.
