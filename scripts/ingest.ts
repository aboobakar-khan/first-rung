/**
 * Builds the board's dataset from the hiring systems of Muslim-led
 * organisations: masjids, Islamic schools, Muslim charities and Islamic
 * finance. Every apply link goes to the organisation's own listing.
 *
 *   bun run ingest
 *
 * Four source types, each a public endpoint or page the organisation publishes
 * for its own applicants:
 *
 *   Workday  — /wday/cxs/<tenant>/<site>/jobs, the JSON behind its careers page.
 *   BambooHR — /careers/list, the JSON behind its hosted vacancy list.
 *   Workable — /api/v1/widget/accounts/<account>, the widget's own feed.
 *   HTML     — a plain vacancy page, parsed for titles and links.
 *
 * Nothing here republishes listings from another job board or aggregator.
 * Every organisation was checked by hand: the slug has to resolve to that
 * organisation, not to something with a similar name.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { classifyFamily, classifyRegion, countryOf, jobKey, plainText, stableId } from '../src/lib/score'
import type { Dataset, Job, JobSource } from '../src/lib/types'

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

function metaDescription(html: string): string | null {
  const match = html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]*content=["']([^"']+)["']/i)
  return match ? match[1].replace(/\s+/g, ' ').trim() : null
}

function meta(html: string, property: string): string | null {
  const match = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'))
  return match ? match[1].replace(/\s+/g, ' ').trim() : null
}

function salaryFrom(text: string): string | null {
  const match = text.match(
    /(?:£|CAD|USD|\$|€)\s?\d[\d,.]*(?:\s?(?:-|–|to)\s?(?:£|CAD|USD|\$|€)?\s?\d[\d,.]*)?(?:\s?(?:per|a|an)?\s?(?:year|annum|month|hour|hr))?/i,
  )
  return match ? match[0].replace(/\s+/g, ' ').trim() : null
}

type Draft = { job: Job; key: string }

type Build = {
  company: string
  source: JobSource
  title: string
  url: string
  location: string
  postedAt?: string | null
  type?: string
  tags?: string[]
  description?: string
  excerpt?: string
  salary?: string | null
}

function cleanTitle(raw: string): string {
  const title = raw
    .replace(/^\/+|\/+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return title ? title[0].toUpperCase() + title.slice(1) : title
}

/** The board lists paid roles; volunteer posts and nav junk are dropped. */
function keepTitle(title: string): boolean {
  if (title.length < 4) return false
  if (/\bvolunteer/i.test(title)) return false
  if (/^(events|jobs|careers|apply|search|menu)$/i.test(title)) return false
  return /[a-z]{3}/i.test(title)
}

function makeJob(input: Build): Draft {
  const description = (input.description ?? '').trim()
  const tags = (input.tags ?? []).filter(Boolean).slice(0, 3)
  const location = input.location.replace(/\s*\d+\s*Locations?/i, '').trim() || 'Multiple locations'

  return {
    key: jobKey(input.company, input.title),
    job: {
      id: `${input.source.slice(0, 2)}-${stableId(input.url)}`,
      title: input.title,
      company: input.company,
      url: input.url,
      source: input.source,
      postedAt: input.postedAt ?? null,
      location,
      salary: input.salary ?? salaryFrom(description),
      type: input.type ?? '',
      tags,
      excerpt: (input.excerpt ?? description).slice(0, 240),
      description,
      family: classifyFamily(input.title, tags),
      region: classifyRegion(location),
    },
  }
}

/* ------------------------------------------------------------------ Workday */

type WorkdayOrg = { company: string; base: string; tenant: string; site: string }

const WORKDAY_ORGS: WorkdayOrg[] = [
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

async function fromWorkday(org: WorkdayOrg): Promise<Draft[]> {
  const listUrl = `${org.base}/wday/cxs/${org.tenant}/${org.site}/jobs`
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
    const detail = await getJson<{ jobPostingInfo?: any }>(`${listUrl.replace('/jobs', '')}${posting.externalPath}`)
    const info = detail?.jobPostingInfo ?? {}
    const title: string = info.title ?? posting.title ?? ''
    if (!title) return null

    const bullet: string[] = posting.bulletFields ?? []
    return makeJob({
      company: org.company,
      source: 'workday',
      title,
      url: `${org.base}/en-US/${org.site}${posting.externalPath}`,
      location: info.location ?? posting.locationsText ?? '',
      postedAt: workdayDate(posting.postedOn, info.startDate),
      type: bullet[0] ?? '',
      tags: bullet.slice(1, 3),
      description: plainText(info.jobDescription ?? '', 3200),
    })
  })

  await sleep(200)
  return drafts.filter((draft): draft is Draft => draft !== null)
}

/* ----------------------------------------------------------------- BambooHR */

type BambooOrg = { company: string; subdomain: string; fallbackLocation: string }

const BAMBOO_ORGS: BambooOrg[] = [
  { company: 'Human Appeal', subdomain: 'humanappeal', fallbackLocation: 'United Kingdom' },
  { company: 'Human Concern International', subdomain: 'hci', fallbackLocation: 'Canada' },
]

async function fromBamboo(org: BambooOrg): Promise<Draft[]> {
  const data = await getJson<{ meta: { totalCount: number }; result: any[] }>(`https://${org.subdomain}.bamboohr.com/careers/list`)
  if (!data?.result?.length) return []

  const drafts = await mapLimit(data.result, 4, async (row): Promise<Draft | null> => {
    const title: string = row.jobOpeningName ?? ''
    if (!title) return null

    const url = `https://${org.subdomain}.bamboohr.com/careers/${row.id}`
    const html = await getText(url)
    const description = html ? metaDescription(html) ?? '' : ''
    const city = row.location?.city ?? ''
    const state = row.location?.state ?? ''
    const remote = row.isRemote === true || row.locationType === '1'
    const department: string = row.departmentLabel ?? ''

    return makeJob({
      company: org.company,
      source: 'bamboohr',
      title,
      url,
      location: remote ? 'Remote' : [city, state].filter(Boolean).join(', ') || org.fallbackLocation,
      type: row.employmentStatusLabel ?? '',
      tags: department ? [department] : [],
      description,
      excerpt: description,
    })
  })

  await sleep(200)
  return drafts.filter((draft): draft is Draft => draft !== null)
}

/* ----------------------------------------------------------------- Workable */

type WorkableOrg = { company: string; account: string; fallbackLocation: string }

const WORKABLE_ORGS: WorkableOrg[] = [
  { company: 'READ Foundation', account: 'readfoundationuk', fallbackLocation: 'United Kingdom' },
]

async function fromWorkable(org: WorkableOrg): Promise<Draft[]> {
  const data = await getJson<{ name: string; jobs: any[] }>(`https://apply.workable.com/api/v1/widget/accounts/${org.account}?details=true`)
  if (!data?.jobs?.length) return []

  return data.jobs.map((job) => {
    const city = job.location?.city ?? ''
    const country = job.location?.country ?? ''
    return makeJob({
      company: org.company,
      source: 'workable',
      title: job.title ?? '',
      url: job.url ?? `https://apply.workable.com/${org.account}/j/${job.shortcode}/`,
      location: [city, country].filter(Boolean).join(', ') || (job.telecommuting ? 'Remote' : org.fallbackLocation),
      type: job.employment_type ?? '',
      tags: job.department ? [job.department] : [],
      description: plainText(job.description ?? job.requirements ?? '', 3200),
      excerpt: job.shortDescription ?? '',
      postedAt: job.published_on ? new Date(`${job.published_on}T12:00:00Z`).toISOString() : null,
    })
  })
}

/* --------------------------------------------------------------------- HTML */

type HtmlOrg = {
  company: string
  source: JobSource
  url: string
  fallbackLocation: string
  find: (html: string) => { title: string; url: string; blurb?: string }[]
}

/** Muslim Hands UK: repeating <article class="Card"> blocks. */
const muslimHandsUk: HtmlOrg = {
  company: 'Muslim Hands',
  source: 'muslimhands',
  url: 'https://muslimhands.org.uk/get-involved/vacancies',
  fallbackLocation: 'United Kingdom',
  find(html) {
    const found: { title: string; url: string; blurb?: string }[] = []
    for (const block of html.split(/<article class="Card">/i).slice(1)) {
      const title = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]
      const blurb = block.match(/<div class="Prose">\s*<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
      const path = block.match(/href="(\/get-involved\/vacancies\/[^"]+)"/i)?.[1]
      if (!title || !path) continue
      found.push({
        title: plainText(title, 160),
        url: `https://muslimhands.org.uk${path}`,
        blurb: plainText(blurb ?? '', 240),
      })
    }
    return found
  },
}

/** Muslim Hands Canada: heading followed by its detail link. */
const muslimHandsCanada: HtmlOrg = {
  company: 'Muslim Hands Canada',
  source: 'muslimhands',
  url: 'https://muslimhands.ca/about-us/careers',
  fallbackLocation: 'Canada',
  find(html) {
    const found: { title: string; url: string }[] = []
    const pattern = /<h3[^>]*>([^<]{3,90})<\/h3>([\s\S]{0,900}?)href="\/about-us\/careers\/([a-z0-9-]+)"/gi
    for (const match of html.matchAll(pattern)) {
      const title = match[1].trim()
      if (!title || /^(menu|search)$/i.test(title)) continue
      found.push({ title, url: `https://muslimhands.ca/about-us/careers/${match[3]}` })
    }
    return found
  },
}

/** Green Lane Masjid encodes each role in its application-form link. */
const greenLaneMasjid: HtmlOrg = {
  company: 'Green Lane Masjid',
  source: 'muslimhands',
  url: 'https://greenlanemasjid.org/careers',
  fallbackLocation: 'Birmingham, United Kingdom',
  find(html) {
    const found: { title: string; url: string }[] = []
    const seen = new Set<string>()
    for (const match of html.matchAll(/job_title=([^"'&]{3,90})/gi)) {
      const raw = match[1].trim()
      const title = cleanTitle(decodeURIComponent(raw).replace(/[-_]+/g, ' '))
      if (title.length < 4 || !/[a-z]/i.test(title) || seen.has(title.toLowerCase())) continue
      seen.add(title.toLowerCase())
      found.push({
        title,
        url: `https://greenlanemasjid.org/website-vacancy-application-form/?job_title=${encodeURIComponent(title)}`,
      })
    }
    return found
  },
}

const HTML_ORGS: HtmlOrg[] = [muslimHandsUk, muslimHandsCanada, greenLaneMasjid]

async function fromHtml(org: HtmlOrg): Promise<Draft[]> {
  const html = await getText(org.url)
  if (!html) return []

  const rows = org.find(html)
  const drafts = await mapLimit(rows, 3, async (row): Promise<Draft> => {
    const page = await getText(row.url)
    const description = page ? plainText(metaDescription(page) ?? '', 900) : row.blurb ?? ''
    return makeJob({
      company: org.company,
      source: org.source,
      title: cleanTitle(row.title),
      url: row.url,
      location: org.fallbackLocation,
      description: description || row.blurb || '',
      excerpt: row.blurb || description,
    })
  })

  await sleep(200)
  return drafts
}

/* -------------------------------------------------------------------- main */

async function main() {
  console.log('Fetching vacancies from Muslim-led organisations…')

  const [workday, bamboo, workable, html] = await Promise.all([
    Promise.all(WORKDAY_ORGS.map((org) => fromWorkday(org))),
    Promise.all(BAMBOO_ORGS.map((org) => fromBamboo(org))),
    Promise.all(WORKABLE_ORGS.map((org) => fromWorkable(org))),
    Promise.all(HTML_ORGS.map((org) => fromHtml(org))),
  ])

  const groups: { company: string; drafts: Draft[] }[] = [
    ...workday.map((drafts, index) => ({ company: WORKDAY_ORGS[index].company, drafts })),
    ...bamboo.map((drafts, index) => ({ company: BAMBOO_ORGS[index].company, drafts })),
    ...workable.map((drafts, index) => ({ company: WORKABLE_ORGS[index].company, drafts })),
    ...html.map((drafts, index) => ({ company: HTML_ORGS[index].company, drafts })),
  ]

  for (const group of groups) console.log(`  ${group.company}: ${group.drafts.length} roles`)
  const all = groups.flatMap((group) => group.drafts).filter((draft) => keepTitle(draft.job.title))

  if (all.length === 0) {
    console.error('No vacancies fetched. Keeping the existing public/jobs.json untouched.')
    process.exit(1)
  }

  const merged = new Map<string, Job>()
  for (const draft of all) {
    const existing = merged.get(draft.key)
    if (!existing || draft.job.description.length > existing.description.length) merged.set(draft.key, draft.job)
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

  const sourceUrl: Record<string, string> = {
    'Islamic Relief Canada': 'https://islamicreliefcanada.org',
    'Human Appeal': 'https://humanappeal.org.uk',
    'Human Concern International': 'https://humanconcern.org',
    'READ Foundation': 'https://readfoundation.org.uk',
    'Muslim Hands': 'https://muslimhands.org.uk',
    'Muslim Hands Canada': 'https://muslimhands.ca',
    'Green Lane Masjid': 'https://greenlanemasjid.org',
  }
  const sourceNote: Record<string, string> = {
    'Islamic Relief Canada': 'Public Workday careers feed. Apply links stay on Workday.',
    'Human Appeal': 'Public BambooHR vacancy list. Apply links stay on BambooHR.',
    'Human Concern International': 'Public BambooHR vacancy list. Apply links stay on BambooHR.',
    'READ Foundation': 'Public Workable jobs feed. Apply links stay on Workable.',
    'Muslim Hands': 'Vacancies page, linked through to the organisation’s own listing.',
    'Muslim Hands Canada': 'Careers page, linked through to the organisation’s own listing.',
    'Green Lane Masjid': 'Careers page; the apply link opens the masjid’s own application form.',
  }
  const listedCompanies = [...new Set(jobs.map((job) => job.company))]

  const dataset: Dataset = {
    generatedAt: new Date().toISOString(),
    counts: {
      jobs: jobs.length,
      organisations: listedCompanies.length,
      countries: countries.size,
      salaryShown: jobs.filter((job) => job.salary !== null).length,
    },
    sources: listedCompanies.map((company) => ({
      name: company,
      url: sourceUrl[company] ?? '',
      note: sourceNote[company] ?? 'Read from the organisation’s own careers page.',
    })),
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
