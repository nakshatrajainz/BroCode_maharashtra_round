# ModelLedger

BroCode, Maharashtra round. Blockchain problem 3.

ModelLedger checks the story of a picture: which allowed company stamped it, what happened afterwards, and whether the file still matches that story.

## Pages

- Home explains the three jobs.
- Register is where a company joins the allowed list and receives a stamp.
- Create is where a company adds a picture line.
- Check is where anyone uploads a picture and gets one answer.

The build order is in [docs/PLAN.md](docs/PLAN.md).

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Copy `.env.example` to `.env.local` before registration can save a company. Do not commit `.env.local`.
