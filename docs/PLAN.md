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

## What each category may say

- **Maker.** "We created this picture." This is the first line. It does not point at an older line.
- **Editor.** "We changed this picture." The line must point at an earlier line.
- **Publisher.** "We posted this picture." The line must point at an earlier line.

A company that does two jobs gets two stamps.

## Phases

### Phase 0. Website shell

The app runs locally with four pages: Home, Register, Create, and Check.

Done when someone can open the site and understand the three jobs without reading this file.

### Phase 1. Company registration

Accounts and stamps now save. A company signs in, picks a category, and receives one stamp. The private half stays on the server. The public shape still needs to be written into the BNB notebook. A company can later be removed from the allowed list. Old lines stay. New lines from a removed company do not count as Trusted.

Done when Aura can register as a Maker and ScaleKit can register as an Editor, and both appear on the allowed list.

### Phase 2. A created picture

A prepared picture is stamped by a Maker. The line stores the exact serial number, the look-alike serial number, the hidden id inside the picture, and a sealed envelope of the private sentence. The sentence itself is not stored.

Done when that picture can be downloaded and the notebook has its creation line.

### Phase 3. The check page

Anyone can upload a picture and receive one answer, one reason, and the list of lines.

Done when the honest picture says Trusted and a phone photo with a fake claim says Self-asserted.

### Phase 4. Later steps

An Editor can add a resize line that points at the creation line. A Publisher can add a posting line. The check page shows the path in order.

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

Phase 0 is the shell. Phase 1 is next, and it is the registration flow. Do not start the check page until a Maker can write a real line.
