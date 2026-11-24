/**
 * Builds the board's dataset from the hiring systems of Muslim-led
 * organisations: masjids, Islamic schools, Muslim charities and Islamic
 * finance. Every apply link goes to the organisation's own listing.
 *
 *   bun run ingest
 *
 * Three source types, each one a public endpoint or page the organisation
 * publishes for its own applicants:
 *
 *   Workday  — /wday/cxs/<tenant>/<site>/jobs, the same JSON its careers page
 *              uses. No key.
 *   BambooHR — /careers/list, the JSON behind its hosted vacancy list.
 *   HTML     — a plain vacancy page, parsed for title, blurb and link.
 *
 * Nothing here republishes listings from another job board or aggregator.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { classifyFamily, classifyRegion, countryOf, jobKey, plainText, stableId } from '../src/lib/score'
import type { Dataset, Job } from '../src/lib/types'

const OUT = new URL('../public/jobs.json', import.meta.url)
const CONTACT = process.env.CONTACT_EMAIL ?? 'khhnabubakar786@gmail.com'
const UA_HEADER = {
  'User-Agent': `amanah-jobs/1.0 (+${CONTACT}; index of roles at Muslim-led organisations)`,
  Accept: 'application/json, text/html;q=0.9',
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function get(url: string, init: RequestInit = {}, attempt = 1): Promise<Response | null> {
  try {
    const response = await fetch(url, { ...init, headers: { ...UA_HEADER, ...init.headers }, signal: AbortSignal.timeout(25_000) })
    if ((response.status === 429 || response.status >= 500) && attempt <= 2) {
      await sleep(1500 * attempt)
      return get(url, init, attempt + 1)
    }
    return response
  } catch (error) {
    if (attempt <= 2) {
      await sleep(1200 * attempt)
      return get(url, init, attempt + 1)
    }
    console.warn(`  failed ${url}: ${(error as Error).message}`)
    return null
  }
}

async function getJson<T = any>(url: string, init: RequestInit = {}): Promise<T | null> {
  const response = await get(url, init)
  if (!response?.ok) {
    if (response) console.warn(`  ${response.status} for ${url}`)
    return null
  }
  try {
    return (await response.json()) as T
  } catch {
    console.warn(`  not JSON: ${url}`)
    return null
  }
}

async function getText(url: string): Promise<string | null> {
  const response = await get(url)
  if (!response?.ok) {
    if (response) console.warn(`  ${response.status} for ${url}`)
    return null
  }
  return response.text()
}

/** Runs an async mapper over items with a small concurrency cap. */
async function mapLimit<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await mapper(items[current])
    }
  })
  await Promise.all(workers)
  return results
}

function hash<Result>(html: string): { excerpt: string; description: string } {
  const text = plainText(html, 3200)
  return { excerpt: plainText(html, 240), description: text }
}

function metaDescription(html: string): string | null {
  const match = html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]*content=["']([^"']+)["']/i)
  return match ? match[1].replace(/\s+/g, ' ').trim() : null
}

function salaryFrom(text: string): string | null {
  const match = text.match(/(?:£|CAD|USD|\$|€)\s?\d[\d,.]*(?:\s?(?:-|–|to)\s?(?:£|CAD|USD|\$|€)?\s?\d[\d,.]*)?(?:\s?(?:per|a|an)?\s?(?:year|annum|month|hour|hr))?/i)
  return match ? match[0].replace(/\s+/g, ' ').trim() : null
}

type Draft = { job: Job; key: string }

/* ------------------------------------------------------------------ Workday */

type WorkdayConfig = { company: string; base: string; tenant: string; site: string }

const WORKDAY_ORGS: WorkdayConfig[] = [
  {
    company: 'Islamic Relief Canada',
    base: 'https://islamicreliefcanada.wd3.myworkdayjobs.com',
    tenant: 'islamicreliefcanada',
    site: 'Islamic_Relief_Canada',
  },
]

/** "Posted 6 Days Ago" -> ISO date, best effort. */
function workdayDate(postedOn: string | undefined, startDate: string | undefined): string | null {
  if (startDate) {
    const parsed = Date.parse(startDate)
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString()
  }
  if (!postedOn) return null
  const days = postedOn.match(/(\d+)\s+day/i)
  if (days) return new Date(Date.now() - Number(days[1]) * 86_400_000).toISOString()
  if (/today|just posted/i.test(postedOn)) return new Date().toISOString()
  if (/30\+|month/i.test(postedOn)) return new Date(Date.now() - 45 * 86_400_000).toISOString()
  return null
}

async function fromWorkday(config: WorkdayConfig): Promise<Draft[]> {
  const listUrl = `${config.base}/wday/cxs/${config.tenant}/${config.site}/jobs`
  const postings: any[] = []
  let offset = 0

  for (let page = 0; page < 10; page += 1) {
    const data = await getJson<{ total: number; jobPostings: any[] }>(listUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: '' }),
    })
    if (!data?.jobPostings?.length) break
    postings.push(...data.jobPostings)
    offset += data.jobPostings.length
    if (offset >= (data.total ?? 0)) break
    await sleep(250)
  }

  const drafts = await mapLimit(postings, 4, async (posting): Promise<Draft | null> => {
    const detailUrl = `${config.base}/wday/cxs/${config.tenant}/${config.site}${posting.externalPath}`
    const detail = await getJson<{ jobPostingInfo?: any }>(detailUrl)
    const info = detail?.jobPostingInfo ?? {}

    const title: string = info.title ?? posting.title ?? ''
    if (!title) return null

    const description = plainText(info.jobDescription ?? '', 3200)
    const locationText: string = info.location ?? info.additionalLocations?.[0] ?? posting.locationsText ?? ''
    const location = locationText.replace(/\s*\d+\s*Locations?/i, '').trim() || 'Multiple locations'
    const bullet: string[] = posting.bulletFields ?? []
    const url = `${config.base}/en-US/${config.site}${posting.externalPath}`

    return {
      key: jobKey(config.company, title),
      job: {
        id: `wd-${stableId(url)}`,
        title,
        company: config.company,
        url,
        source: 'workday',
        postedAt: workdayDate(posting.postedOn, info.startDate),
        location,
        salary: salaryFrom(description),
        type: bullet[0] ?? '',
        tags: bullet.slice(1, 3),
        excerpt: metaDescription(description) ?? description.slice(0, 240),
        description,
        family: classifyFamily(title, bullet),
        region: classifyRegion(location),
      },
    }
  })

  await sleep(200)
  return drafts.filter((draft): draft is Draft => draft !== null)
}

/* ----------------------------------------------------------------- BambooHR */

type BambooConfig = { company: string; subdomain: string; fallbackLocation: string }

const BAMBOO_ORGS: BambooConfig[] = [
  { company: 'Human Appeal', subdomain: 'humanappeal', fallbackLocation: 'United Kingdom' },
]

async function fromBamboo(config: BambooConfig): Promise<Draft[]> {
  const data = await getJson<{ meta: { totalCount: number }; result: any[] }>(
    `https://${config.subdomain}.bamboohr.com/careers/list`,
  )
  if (!data?.result?.length) return []

  const drafts = await mapLimit(data.result, 4, async (row): Promise<Draft | null> => {
    const title: string = row.jobOpeningName ?? ''
    if (!title) return null

    const url = `https://${config.subdomain}.bamboohr.com/careers/${row.id}`
    const html = await getText(url)
    const description = html ? plainText(metaDescription(html) ?? '', 900) : ''

    const city = row.location?.city ?? ''
    const state = row.location?.state ?? ''
    const remote = row.isRemote === true || row.locationType === '1'
    const location = remote ? 'Remote' : [city, state].filter(Boolean).join(', ') || config.fallbackLocation
    const department: string = row.departmentLabel ?? ''

    return {
      key: jobKey(config.company, title),
      job: {
        id: `bh-${stableId(url)}`,
        title,
        company: config.company,
        url,
        source: 'bamboohr',
        postedAt: null,
        location,
        salary: salaryFrom(description),
        type: row.employmentStatusLabel ?? '',
        tags: department ? [department] : [],
        excerpt: description.slice(0, 240),
        description,
        family: classifyFamily(title, department ? [department] : []),
        region: classifyRegion(`${location}`, [city, state].filter(Boolean)),
      },
    }
  })

  await sleep(200)
  return drafts.filter((draft): draft is Draft => draft !== null)
}

/* ------------------------------------------------------------ Muslim Hands */

const MUSLIM_HANDS = {
  company: 'Muslim Hands',
  url: 'https://muslimhands.org.uk/get-involved/vacancies',
  origin: 'https://muslimhands.org.uk',
  fallbackLocation: 'United Kingdom',
}

async function fromMuslimHands(): Promise<Draft[]> {
  const html = await getText(MUSLIM_HANDS.url)
  if (!html) return []

  const rows: { title: string; blurb: string; path: string }[] = []
  for (const block of html.split(/<article class="Card">/i).slice(1)) {
    const title = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]
    const blurb = block.match(/<div class="Prose">\s*<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
    const path = block.match(/href="(\/get-involved\/vacancies\/[^"]+)"/i)?.[1]
    if (!title || !path) continue
    rows.push({ title: plainText(title, 160), blurb: plainText(blurb ?? '', 240), path })
  }

  const drafts = await mapLimit(rows, 3, async (row): Promise<Draft> => {
    const url = `${MUSLIM_HANDS.origin}${row.path}`
    const page = await getText(url)
    const description = page ? plainText(metaDescription(page) ?? '', 900) : row.blurb
    return {
      key: jobKey(MUSLIM_HANDS.company, row.title),
      job: {
        id: `mh-${stableId(url)}`,
        title: row.title,
        company: MUSLIM_HANDS.company,
        url,
        source: 'muslimhands',
        postedAt: null,
        location: MUSLIM_HANDS.fallbackLocation,
        salary: salaryFrom(`${row.blurb} ${description}`),
        type: '',
        tags: [],
        excerpt: (row.blurb || description).slice(0, 240),
        description: row.blurb || description,
        family: classifyFamily(row.title, [row.blurb]),
        region: classifyRegion(MUSLIM_HANDS.fallbackLocation),
      },
    }
  })

  await sleep(200)
  return drafts
}

/* -------------------------------------------------------------------- main */

async function main() {
  console.log('Fetching vacancies from Muslim-led organisations…')

  const [workday, bamboo, hands] = await Promise.all([
    Promise.all(WORKDAY_ORGS.map(fromWorkday)),
    Promise.all(BAMBOO_ORGS.map(fromBamboo)),
    fromMuslimHands(),
  ])

  const all: Draft[] = [...workday.flat(), ...bamboo.flat(), ...hands]
  for (const group of [...workday, ...bamboo]) {
    const company = group[0]?.job.company
    if (company) console.log(`  ${company}: ${group.length} roles`)
  }
  console.log(`  ${MUSLIM_HANDS.company}: ${hands.length} roles`)

  if (all.length === 0) {
    console.error('No vacancies fetched. Keeping the existing public/jobs.json untouched.')
    process.exit(1)
  }

  const merged = new Map<string, Job>()
  for (const draft of all) {
    const existing = merged.get(draft.key)
    if (!existing || (draft.job.description.length > existing.description.length && existing.postedAt === null)) {
      merged.set(draft.key, draft.job)
    }
  }

  const jobs = [...merged.values()].sort((a, b) => {
    const at = a.postedAt ? Date.parse(a.postedAt) : 0
    const bt = b.postedAt ? Date.parse(b.postedAt) : 0
    if (bt !== at) return bt - at
    return a.company.localeCompare(b.company) || a.title.localeCompare(b.title)
  })

  const countries = new Set<string>()
  for (const job of jobs) {
    const country = countryOf(job.location)
    if (country) countries.add(country)
  }

  const dataset: Dataset = {
    generatedAt: new Date().toISOString(),
    counts: {
      jobs: jobs.length,
      organisations: new Set(jobs.map((job) => job.company)).size,
      countries: countries.size,
      salaryShown: jobs.filter((job) => job.salary !== null).length,
    },
    sources: [
      {
        name: 'Islamic Relief Canada',
        url: 'https://islamicreliefcanada.org',
        note: 'Workday careers site, read through its public job-board feed.',
      },
      {
        name: 'Human Appeal',
        url: 'https://humanappeal.org.uk',
        note: 'BambooHR careers site, read through its public vacancy list. Apply links go to BambooHR.',
      },
      {
        name: 'Muslim Hands',
        url: 'https://muslimhands.org.uk',
        note: 'Vacancies page, linked through to the organisation’s own listing.',
      },
    ],
    jobs,
  }

  let previous: Dataset | null = null
  try {
    previous = JSON.parse(await readFile(OUT, 'utf8')) as Dataset
  } catch {
    previous = null
  }
  if (jobs.length < 5 && previous && previous.jobs.length > jobs.length) {
    console.warn(`Only ${jobs.length} roles this run; keeping the previous ${previous.jobs.length}-role dataset.`)
    process.exit(1)
  }

  await mkdir(new URL('../public', import.meta.url), { recursive: true })
  await writeFile(OUT, `${JSON.stringify(dataset, null, 2)}\n`)

  console.log(`\nWrote ${jobs.length} roles from ${dataset.counts.organisations} organisations to public/jobs.json`)
  const byFamily = jobs.reduce<Record<string, number>>((acc, job) => ({ ...acc, [job.family]: (acc[job.family] ?? 0) + 1 }), {})
  console.log('Categories:', byFamily)
  for (const job of jobs.slice(0, 6)) console.log(`  ${job.family.padEnd(16)} ${job.title} — ${job.company}`)
}

await main()
