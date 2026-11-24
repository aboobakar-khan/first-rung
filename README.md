# First Rung

An entry-level remote tech job board that keeps itself up to date.

A script pulls about a thousand listings from two public job feeds each day,
scores every one for whether it is genuinely a first tech job, drops the senior
ones, and writes the result to `public/jobs.json`. The site reads that file, so
the board, the JSON API and the dataset are all the same data.

- **Board** — search, role family, region and salary filters, fit score.
- **Role page** — salary, location, type, why it scored what it scored, apply
  link to the source, related roles.
- **Employers** — the paid placement offer and what we check before a role is
  accepted.
- **How it works** — the filter rules, sources and their terms, freshness.

## Run it

```sh
bun install
bun run ingest     # refresh public/jobs.json from the feeds (takes ~1 min)
bun run dev        # http://127.0.0.1:5173
bun run build      # dist/client + dist/first-rung/index.js
bun run typecheck
bun test tests
```

`public/jobs.json` is committed, so the site renders without network access.
Run `bun run ingest` on a schedule (cron, GitHub Action, or the host's scheduler)
to keep it honest — once a day is enough; both feeds cache for an hour.

## How the filter works

`src/lib/score.ts` is the product. It returns `null` unless the listing is a
tech role, then starts at 38 and moves:

| Signal | Effect |
| --- | --- |
| Source marks it entry-level | +34 |
| Junior / graduate / intern / trainee title | +18 |
| Body mentions no experience, bootcamp, 0-2 years | +9 |
| Salary is stated | +3 |
| Senior, staff, lead, principal, manager in title | −34 |
| Body asks for 3+ years | −18 |
| Postgraduate degree required | −10 |

Anything under 35 is dropped, as is duplicate company+title pairs across
sources. The tests in `tests/score.test.ts` pin that behaviour.

## Sources and their terms

- **Himalayas** — free public API. Apply links must use its `applicationLink`,
  Himalayas must be visibly credited, and listings must not be passed on to
  other boards. Both are handled in `scripts/ingest.ts` and on the role page.
- **Remote OK** — every role links back to its Remote OK listing with a followed
  link and names Remote OK as the source.
- **Remotive is not used.** Its terms forbid republishing its listings on
  third-party job sites.

If you fork this, re-read each provider's terms before adding a source.

## How it makes money

Featured placements, sold by hand: `$199` for 30 days at the top of the board,
`$499` for three, `$99` for a digest sponsorship once the list is large enough.
Sold slots go in `src/data/featured.ts`; until one is sold the board shows a
house ad pointing at `/employers`.

Honest status: this is an inventory-led business, so revenue follows traffic.
The automated part is supply — the board stays full and fresh without anyone
touching it. The manual part is demand — selling those first few placements and
building the Monday email list. Nothing here promises passive income; it
promises that the repetitive work is done for you.

## Deploy

`deploy.json` points at the build output. Build, then deploy with the
`sites_deploy` tool. `/api/jobs` serves the dataset with CORS so it can be used
as an API; `/api/health` is there for uptime checks.
