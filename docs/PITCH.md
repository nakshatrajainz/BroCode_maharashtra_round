# ModelLedger — 5-min pitch (PPT first, then live demo)

**Deck:** [ModelLedger-Pitch.pptx](ModelLedger-Pitch.pptx)  
**Screenshots:** [pitch-assets/](pitch-assets/)

Order for judges: **PPT (≈2 min) → live demo (≈2.5 min) → close (≈30s) → Q&A**.

No heavy jargon. If a word feels fancy, skip it.

## The idea in one breath

People can fake “we made this AI picture.”
ModelLedger lets a real company put a stamp on the picture when they make / edit / post it.
Later, anyone uploads the file and we say if the story is real.

Three answers only:

- **Trusted** — real stamp, file still matches
- **Self-asserted** — someone claimed a name, but no real stamp
- **Unverifiable** — we cannot prove the story

## Car-plate story (use this)

Every car has a number plate.
The plate alone is not enough — the RTO also has a register.

Same here:

1. We stick a small secret id inside the picture (like a plate).
2. We write a public notebook line: which company, which AI model, what step, what time.
3. The company must be allowed to stamp (like a registered plate issuer).
4. If someone changes the picture too much, or sticks an old plate on a new photo, Check says Unverifiable.

You do **not** need to say “hash”, “keccak”, or “signature” unless a judge asks.

If they ask “how do you know it wasn’t edited?”:
> We store a fingerprint of the file. If the file changes a lot, the fingerprint won’t match.

If they ask “why blockchain?”:
> So the notebook is public and hard to quietly rewrite. Judges can look outside our website.

## 5 minutes (with PPT)

| Time | What |
|---|---|
| 0:00–0:40 | PPT: problem (anyone can claim an AI image) |
| 0:40–1:20 | PPT: solution + 3 answers + Register → Stamp → Check flow |
| 1:20–2:00 | PPT: company API flow + “website is the demo remote” + screenshots |
| 2:00–4:30 | **Live demo** on Vercel / laptop |
| 4:30–5:00 | Close: They generate. We stamp. Anyone checks. |

### What to say over the PPT

**Problem**  
AI pictures are everywhere. Anyone can download one and say “our company made this.” There is no simple public way to check.

**What we built**  
ModelLedger is a stamp notebook. Allowed companies stamp a picture when they create it, edit it, or post it. They also say which AI model they used. Later, anyone opens Check, uploads the file, and gets Trusted, Self-asserted, or Unverifiable.

**API (say this clearly)**  
In real life the company registers once, gets an API key, and their engineering team calls our Stamp API after an image is generated. We return the stamped file. They give that file to their client. The client (or anyone) uses Check. We don’t run their models — we are the trust layer.

### Live demo clicks

1. Open **Check** — show the three colored answers.  
2. **Companies** — Maker + model (API key shown once).  
3. **Stamp → Create** — company + model → download.  
4. **Check** — upload → Trusted (company, model, time).  
5. Optional: try Create again on same file → blocked.  
6. One line: website Stamp = click demo; production = same thing via API key.

**Close**  
They generate. We stamp. Anyone checks.

## Easy Q&A

**Do you detect if an image is AI?**  
No. We don’t guess from pixels. We check the stamp story.

**What if two companies claim the same picture?**  
Unverifiable. The story is unclear.

**What if the company is kicked out later?**  
Old trusted stamps stay. New stamps after that don’t count as Trusted.

**Is the private prompt public?**  
No. Only the company can open their sealed note later.

**Why not only put text inside the PNG?**  
Anyone can delete or copy that text. The public notebook + company stamp is the real proof.

**What do you provide vs their eng team?**  
We provide register, stamps, notebook, Check, and the Stamp/Check APIs. Their eng plugs Stamp into their generate pipeline and ships the stamped file.

## Rebuild the PPT

```bash
npm install --no-save pptxgenjs
node scripts/build-pitch-pptx.mjs
```

## Demo checklist

- [ ] Vercel URL open (or laptop backup)
- [ ] PPT open: `docs/ModelLedger-Pitch.pptx`
- [ ] Fresh Maker ready (or register live)
- [ ] One unstamped photo in `demo-photos/01-unstamped/`
- [ ] Create → Check Trusted works once
- [ ] Closing line memorized: “They generate. We stamp. Anyone checks.”
