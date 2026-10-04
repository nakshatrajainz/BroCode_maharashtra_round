# ModelLedger — 5 min demo + 2 min Q&A

Timing target: speak at **12:00**. Keep PPT optional; this script + live site is enough.

## One-line

ModelLedger proves the story of an AI picture on a public BNB notebook: which allowed company stamped it, which model made it, what happened next, and whether the file still matches.

## 5-minute rundown

| Min | What |
|---|---|
| 0:00–0:45 | Hook + problem |
| 0:45–1:30 | What we built (Trusted / Self-asserted / Unverifiable) |
| 1:30–4:00 | Live demo |
| 4:00–4:45 | Why BNB + product angle (company API) |
| 4:45–5:00 | Close |

### Script

**Hook (45s)**  
AI images are everywhere. Anyone can claim “our model made this.” There is no public way to prove which company created it, which model, who edited it, or whether the file was swapped.

**Product (45s)**  
ModelLedger is a stamp notebook on BNB Smart Chain. Allowed companies — Maker, Editor, Publisher — pre-approve their AI models and stamp each step. Anyone opens Check, uploads the file, and gets one answer: Trusted, Self-asserted, or Unverifiable — with company, model, and stamp time.

**Demo (2.5 min)** — do not narrate every click  
1. Open Check first (public, no login) — show the three answers.  
2. Sign in → Companies: Maker with approved model (e.g. Flux 1.1).  
3. Stamp → Create: pick company + model → stamp → download.  
4. (If time) Edit → Publish with the downloaded PNG.  
5. Check: upload download → **Trusted** with story, model, times.  
6. Optional punch: try to Create again on the same file → rejected (origin cannot be forged).

**Why blockchain + closer (1 min)**  
The notebook is public and hard to rewrite. Private stamp keys stay on the server; the chain holds the proof. Today’s website is the demo. The real product is a company stamp API inside create/edit/publish pipelines — consumers only ever use Check.

## Likely Q&A (2 min)

**Why not just metadata in the PNG?**  
Metadata is easy to strip or fake. We fingerprint the file, keep a hidden id, and write the line on a public notebook.

**Does Check guess if an image is AI?**  
No. We do not classify “looks synthetic.” We verify the stamped story.

**What if two makers claim the same picture?**  
Unverifiable — the story is ambiguous.

**What if a company is revoked?**  
Old Trusted lines stay. New lines after revoke do not count as Trusted.

**Where do models come from?**  
Companies pre-approve models. In production the stamp API sends company + model + time automatically; the demo form is the manual stand-in.

**Why BNB?**  
Public notebook, cheap testnet gas for the hackathon, chain id 97.

**Is the private prompt on-chain?**  
Only a hash. The sealed sentence stays on the server; the company can reveal it later.

## Demo checklist (before 12:00)

- [ ] Public Vercel URL opens
- [ ] Fresh Maker (with model) registered after ledger deploy (`chain_tx` set)
- [ ] Create → download → Check = Trusted (model + time visible)
- [ ] Laptop localhost backup ready
- [ ] One prepared unstamped PNG ready
