# Amanah Jobs

A board of roles at Muslim-led organisations — masjids, Islamic schools,
charities, Islamic finance and halal businesses — that keeps itself up to date.

A script reads each organisation's own careers system, normalises the openings,
groups them by category and writes `public/jobs.json`. The site reads that file,
so the board, the JSON API and the dataset are all the same data.

- **Board** — search, category, region and salary filters.
- **Role page** — location, type, salary when the employer states it, the
  employer's own description, and an apply link that goes to them.
- **Employers** — the paid placement offer and what is checked first.
- **How it works** — the rules, the sources and the honest limits.

## Run it

```sh
bun install
bun run ingest     # refresh public/jobs.json from the employers' careers systems
bun run dev        # http://127.0.0.1:5173
bun run build      # dist/client + dist/amanah_jobs/index.js
bun run typecheck
bun test tests
```

`public/jobs.json` is committed, so the site renders without network access.
`bun run ingest` runs on a schedule (the local launchd job and the GitHub
Action both call it) — once a day is enough.

## Where the roles come from

| Organisation | Source | Notes |
| --- | --- | --- |
| Islamic Relief Canada | Workday public careers feed | Apply links stay on Workday |
| Human Appeal | BambooHR public vacancy list | Apply links stay on BambooHR |
| Muslim Hands | Vacancy page | Links to the organisation's own listing |

Three source adapters live in `scripts/ingest.ts` (`fromWorkday`,
`fromBamboo`, `fromMuslimHands`). Adding an organisation means adding its
careers system to the matching list; nothing else changes.

Deliberately **not** used: other Muslim job boards and aggregators. Copying
their listings is not ours to do, and ReliefWeb's jobs API now needs an
approved application name.

## How a role is classified

`src/lib/score.ts` holds the taxonomy: `classifyFamily` (imam and Islamic
studies, education, fundraising, programmes, finance, comms, operations, IT,
health) and `classifyRegion`. Both are pure and covered by
`tests/score.test.ts`. There is no "fit" score — a curated list does not need
one, and a score would only invite questions about how it was measured.

Sources that publish no date produce `postedAt: null`, and the UI says nothing
rather than inventing an age.

## How it makes money

Featured placements, sold by hand: `$199` for 30 days at the top of the board,
`$499` for three, `$99` for an email sponsorship once the list is large enough.
Sold slots go in `src/data/featured.ts`; until one is sold the board shows a
house ad pointing at `/employers`.

Honest status: revenue follows traffic. The automated part is supply — the board
stays current without anyone touching it. The manual part is demand — selling
the first placements and growing the email list.

## Deploy

Two deploy paths are configured and both build first:

```sh
bun run build
./node_modules/.bin/wrangler deploy --config wrangler.deploy.jsonc
```

`wrangler.deploy.jsonc` is separate from `wrangler.jsonc` (which the Vite plugin
uses for dev) because `scripts/postbuild.mjs` strips source maps and the
generated config demands them.

- `.github/workflows/refresh-jobs.yml` — daily ingest, commit, build and deploy.
  Needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.
- `scripts/refresh.sh` + a launchd job (`dev.firstrung.refresh`, 06:17 local) —
  the same pipeline on this machine, credentials kept in
  `~/.config/firstrung/cloudflare.env`.

`/api/jobs` serves the dataset with CORS so it can be used as an API;
`/api/health` exists for uptime checks.
