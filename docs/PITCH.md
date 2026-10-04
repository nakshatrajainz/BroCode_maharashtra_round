# ModelLedger — simple 5-min pitch (say it like a first-year)

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

## 5 minutes

| Time | Say / show |
|---|---|
| 0:00–0:40 | Problem: anyone can claim an AI image |
| 0:40–1:20 | We stamp the story: company + model + time. Check gives one clear answer |
| 1:20–3:40 | **Live demo** (below) |
| 3:40–4:40 | Real product is the **API**, website is the demo remote |
| 4:40–5:00 | Close + thank you |

### What to say (almost word-for-word)

**Problem**  
AI pictures are everywhere. Anyone can download one and say “our company made this.” There is no simple public way to check.

**What we built**  
ModelLedger is a stamp notebook. Allowed companies stamp a picture when they create it, edit it, or post it. They also say which AI model they used. Later, anyone opens Check, uploads the file, and gets Trusted, Self-asserted, or Unverifiable.

**Demo**  
1. Open **Check** — show the three colored answers.  
2. Sign in → **Companies** — Maker with an approved model (Flux 1.1).  
3. **Stamp → Create** — pick company + model → stamp → download.  
4. If time: Edit → Publish with that same download.  
5. **Check** — upload download → Trusted, show company + model + time.  
6. Punch line: try Create again on the same file → blocked. You can’t fake a new origin.  
7. Say (don’t drown in docs): when they registered, they got an API key. In real life their app stamps with that key; today we clicked the website instead.

**Close**  
The website is how we demo. The product is the company API inside their create/edit/publish pipeline. Consumers only ever check.

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

## Demo checklist

- [ ] Site open (Vercel or laptop)
- [ ] Maker with model + API key ready
- [ ] One fresh image ready
- [ ] Create → Check Trusted works once
- [ ] Know one line: “API key comes with the company; website Stamp is the click demo”
