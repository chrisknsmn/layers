# ASO Audit Agent

Paste an Apple App Store URL, confirm the app, and get a scored ASO audit with
prioritized recommendations. Built on [Mastra](https://mastra.ai) (agents,
tools, workflows, skills) and Next.js 16.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the following link:

```bash
http://localhost:3000
```

Example app url:

```bash
https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580
```

## Production link

```bash
https://layers-navy.vercel.app/
```

### Required env

- `NVIDIA_NIM_API_KEY` — free key from <https://build.nvidia.com>. The default
  model is `meta/llama-3.3-70b-instruct`; override with `NVIDIA_NIM_MODEL`.
- `FIRECRAWL_API_KEY` — free key from <https://firecrawl.dev>.

## Architecture

```
mastra/
  index.ts                 Mastra instance — registers agents + workflows
  llm.ts                   NVIDIA NIM via @ai-sdk/openai-compatible
  schemas.ts               Shared zod schemas (AppMetadata, Audit, …)
  agents/aso-agent.ts      Follow-up Q&A agent (all four tools available)
  tools/                   Four createTool() definitions
    parse-app-store-url.ts iTunes URL → { country, appId }
    fetch-app-metadata.ts  iTunes Search API
    scrape-app-listing.ts  Firecrawl + zod structured extraction
    fetch-competitors.ts   iTunes Search by genre + name
  workflows/
    aso-audit-workflow.ts  Two-step workflow with suspend/resume
  skills/
    aso-audit.md           Scoring framework + output spec (the "skill")
app/
  page.tsx                 Chat UI entry
  components/              Chat shell, confirm card, score card, audit view
  api/
    audit/start/route.ts   POST → workflow.start() → suspend → { runId, candidate }
    audit/resume/route.ts  POST → run.resumeStream() → SSE
    chat/route.ts          POST → agent.stream() for follow-up Q&A
```

### The flow

1. **POST `/api/audit/start`** — workflow calls `parse-app-store-url`
   then `fetch-app-metadata`, then **suspends** with the candidate app.
   The route returns `{ runId, candidate }` to the UI.
2. UI renders an **AppConfirmCard** so the user can confirm or reject.
3. On confirm, UI calls **POST `/api/audit/resume`** which calls
   `run.resumeStream()`. The route bridges Mastra workflow events to an
   **SSE stream** so the UI shows "Scraping listing…", "Running audit…",
   then the final `audit` event with the scored result.
4. The audit step runs `scrape-app-listing` (Firecrawl) and
   `fetch-competitors` in parallel, then asks a Mastra scoring agent
   (whose instructions are the `aso-audit.md` skill) to produce the
   structured audit via `agent.generate({ structuredOutput: { schema, jsonPromptInjection: true } })`.
5. After the audit lands, the user can ask follow-up questions via
   **POST `/api/chat`**, which streams from `asoAgent` (the four tools
   are wired in, so the agent can re-scrape or re-search if needed).

## Scripts

- `npm run dev` — dev server with HMR
- `npm run build` — production build
- `npm run lint` — eslint
