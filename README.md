# ASO Audit Agent

Paste an Apple App Store URL, confirm the app, and get a scored ASO audit with
prioritized recommendations. Built on [Mastra](https://mastra.ai) (agents,
tools, workflows, skills) and Next.js 16.

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in NVIDIA_NIM_API_KEY and FIRECRAWL_API_KEY in .env.local
npm run dev
```

Visit <http://localhost:3000>. Paste a URL like
`https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580`.

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

### Why these decisions

- **NIM via `@ai-sdk/openai-compatible`** — free credits, OpenAI-compatible
  endpoint, swap the model id without rewriting code. `meta/llama-3.3-70b-instruct`
  default balances tool-calling quality with NIM availability.
- **iTunes Search API for confirm, Firecrawl for the rest** — the iTunes
  API doesn't expose subtitle, promotional text, "What's New", or video
  presence. Firecrawl with a zod-schema extraction prompt fills the gap.
  Confirmation is fast (~200ms iTunes call) so the user isn't waiting on a
  scrape just to be asked "is this the right app?"
- **Workflow `suspend()` / `resumeStream()` for the human-in-the-loop**
  rather than agent-led tool calls. The handoff is typed (the suspend
  payload validates against `appMetadataSchema`), the run is referenced by
  id between requests, and the UI gets a clean state machine.
- **`jsonPromptInjection: true` on the scoring agent** — NIM models vary
  in their native structured-output support. Prompt injection coerces the
  model into emitting JSON matching the audit schema and Mastra validates
  it on the way back. The `auditSchema.parse()` in the step then double-checks.
- **Errors in the audit step are isolated** — if Firecrawl or the
  competitor lookup fails, we log and continue with an empty fallback rather
  than killing the whole audit. The audit will note the missing data.
- **In-memory workflow run storage (no Mastra storage configured)** — for
  this MVP, runs live in `workflow.runs` between the start and resume
  requests within the same Node process. Production would wire up a
  durable store; pulling that in here would be overkill.
- **No persistent chat memory on the agent** — the audit is the source of
  truth; the chat endpoint forwards it as a system message every turn.

## Scripts

- `npm run dev` — dev server with HMR
- `npm run build` — production build
- `npm run lint` — eslint

## Known limitations

- Workflow run storage is in-memory: if the dev server restarts between
  the start and resume requests, the confirmation flow has to be redone.
- Some apps don't expose a subtitle in the public listing; the audit will
  score that dimension conservatively and note the gap.
- The competitor lookup uses iTunes Search with a heuristic query (first
  word of the app name + genre). For broad categories like "Music" this
  is good; for niche apps it can be noisy.
