/**
 * Pulls entry-level remote tech roles from the two feeds whose terms allow
 * display on your own board, scores them, and writes public/jobs.json.
 *
 *   bun run ingest
 *
 * Himalayas: free API, up to 20 jobs per request, cached for an hour.
 *   Terms: use applicationLink for Apply, credit Himalayas, do not pass the
 *   listings on to other boards, drop expired jobs.
 * RemoteOK: terms require a followed link back to the Remote OK listing and
 *   naming Remote OK as the source, so its Apply link is the Remote OK page.
 *
 * Remotive is deliberately not used: its terms forbid republishing its jobs on
 * third-party job sites.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { classifyFamily, classifyRegion, jobKey, plainText, scoreFit, stableId } from '../src/lib/score'
import type { Dataset, Job, Region } from '../src/lib/types'

const OUT = new URL('../public/jobs.json', import.meta.url)
const CONTACT = process.env.CONTACT_EMAIL ?? 'khhnabubakar786@gmail.com'
const USER_AGENT = `firstrung-ingest/1.0 (+${CONTACT}; job board for entry-level roles)`
const UA_HEADER = { 'User-Agent': USER_AGENT, Accept: 'application/json' }

/** Queries are chosen so the 20-per-request limit still lands on tech roles. */
const HIMALAYAS_QUERIES = [
  'software engineer',
  'frontend developer',
  'backend developer',
  'full stack developer',
  'junior developer',
  'web developer',
  'data analyst',
  'qa engineer',
  'devops engineer',
  'technical support engineer',
]
const HIMALAYAS_PAGES = 2
const HIMALAYAS_CAP = 240
const REMOTEOK_CAP = 60
const MIN_FIT = 35

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function getJson(url: string, attempt = 1): Promise<any | null> {
  try {
    const response = await fetch(url, { headers: UA_HEADER })
    if (response.status === 429 || response.status === 503) {
      if (attempt > 2) return null
      const wait = Math.min(Number(response.headers.get('Retry-After') ?? 8) * 1000, 20_000)
      console.warn(`  rate limited, waiting ${Math.round(wait / 1000)}s`)
      await sleep(wait)
      return getJson(url, attempt + 1)
    }
    if (!response.ok) {
      console.warn(`  ${response.status} for ${url}`)
      return null
    }
    return await response.json()
  } catch (error) {
    if (attempt <= 2) {
      await sleep(1500 * attempt)
      return getJson(url, attempt + 1)
    }
    console.warn(`  failed ${url}: ${(error as Error).message}`)
    return null
  }
}

function formatSalary(min: number | null, max: number | null, currency: string | null, period: string | null): string | null {
  if (!min && !max) return null
  const short = (value: number) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value)))
  const unit = period === 'hourly' ? '/hr' : period === 'monthly' ? '/mo' : period === 'weekly' ? '/wk' : ''
  const code = currency ?? 'USD'
  if (min && max && min !== max) return `${code} ${short(min)}–${short(max)}${unit}`
  return `${code} ${short((min ?? max)!)}${unit}`
}

type Draft = {
  job: Job
  key: string
}

async function fromHimalayas(): Promise<Draft[]> {
  const seen = new Map<string, Draft>()
  let requests = 0

  for (const query of HIMALAYAS_QUERIES) {
    for (let page = 1; page <= HIMALAYAS_PAGES; page += 1) {
      const url = new URL('https://himalayas.app/jobs/api/search')
      url.searchParams.set('q', query)
      url.searchParams.set('seniority', 'Entry-level')
      url.searchParams.set('sort', 'recent')
      url.searchParams.set('page', String(page))
      const data = await getJson(url.toString())
      requests += 1
      if (!data?.jobs?.length) break

      for (const raw of data.jobs) {
        const title: string = raw.title ?? ''
        const description = plainText(raw.description ?? '')
        const fit = scoreFit({
          title,
          text: description,
          seniority: raw.seniority ?? [],
          tags: raw.categories ?? [],
        })
        if (!fit) continue

        const countries: string[] = raw.locationRestrictions ?? []
        const salary = formatSalary(raw.minSalary ?? null, raw.maxSalary ?? null, raw.currency ?? null, raw.salaryPeriod ?? 'annual')
        const applyUrl: string = raw.applicationLink ?? raw.guid ?? ''
        if (!title || !applyUrl || !raw.companyName) continue

        const id = `hs-${stableId(applyUrl)}`
        const key = jobKey(raw.companyName, title)
        const job: Job = {
          id,
          title,
          company: raw.companyName,
          url: applyUrl,
          source: 'himalayas',
          postedAt: new Date((raw.pubDate ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
          location: countries.length === 0 ? 'Worldwide' : countries.slice(0, 3).join(', '),
          salary,
          type: raw.employmentType ?? 'Full Time',
          tags: (raw.categories ?? []).slice(0, 4),
          seniority: raw.seniority ?? [],
          excerpt: plainText(raw.excerpt ?? description, 240),
          description,
          fit: fit.fit,
          reasons: fit.reasons,
          family: classifyFamily(title, raw.categories ?? []),
          region: classifyRegion(countries),
        }

        const existing = seen.get(key)
        if (!existing || existing.job.fit < job.fit) seen.set(key, { job, key })
      }

      await sleep(320)
    }
  }

  console.log(`  himalayas: ${requests} requests, ${seen.size} matching listings`)
  return [...seen.values()]
}

const REMOTEOK_JUNIOR = /(junior|\bjr\b|entry[\s-]?level|graduate|intern|trainee|apprentice|no experience)/i

async function fromRemoteOk(): Promise<Draft[]> {
  const data = await getJson('https://remoteok.com/api')
  if (!Array.isArray(data)) return []

  const drafts: Draft[] = []
  for (const raw of data.slice(1)) {
    if (!raw?.position || !raw?.company) continue
    const text = plainText(raw.description ?? '')
    if (!REMOTEOK_JUNIOR.test(`${raw.position} ${text}`)) continue

    const fit = scoreFit({ title: raw.position, text, tags: raw.tags ?? [] })
    if (!fit) continue

    // Remote OK's terms: link back to the Remote OK listing, with a followed link.
    const url: string = raw.url ?? (raw.slug ? `https://remoteok.com/remote-jobs/${raw.slug}` : '')
    if (!url) continue

    const salary = formatSalary(raw.salary_min || null, raw.salary_max || null, 'USD', 'annual')
    const job: Job = {
      id: `rok-${stableId(url)}`,
      title: raw.position,
      company: raw.company,
      url,
      source: 'remoteok',
      postedAt: raw.date ?? new Date((raw.epoch ?? Date.now() / 1000) * 1000).toISOString(),
      location: raw.location || 'Worldwide',
      salary,
      type: 'Full Time',
      tags: (raw.tags ?? []).slice(0, 4),
      seniority: [],
      excerpt: plainText(text, 240),
      description: text,
      fit: fit.fit,
      reasons: fit.reasons,
      family: classifyFamily(raw.position, raw.tags ?? []),
      region: classifyRegion([raw.location].filter(Boolean)),
    }
    drafts.push({ job, key: jobKey(raw.company, raw.position) })
  }

  console.log(`  remoteok: ${drafts.length} junior-listed roles`)
  return drafts
}

async function main() {
  console.log('Fetching feeds…')
  const [himalayas, remoteok] = await Promise.all([fromHimalayas(), fromRemoteOk()])
  if (himalayas.length === 0 && remoteok.length === 0) {
    console.error('No listings fetched. Keeping the existing public/jobs.json untouched.')
    process.exit(1)
  }

  const merged = new Map<string, Job>()
  const ordered = [
    ...himalayas.sort((a, b) => b.job.fit - a.job.fit).slice(0, HIMALAYAS_CAP).map((draft) => draft.job),
    ...remoteok.sort((a, b) => b.job.fit - a.job.fit).slice(0, REMOTEOK_CAP).map((draft) => draft.job),
  ]
  for (const job of ordered) {
    const key = jobKey(job.company, job.title)
    const existing = merged.get(key)
    if (!existing || existing.fit < job.fit) merged.set(key, job)
  }

  const jobs = [...merged.values()]
    .filter((job) => job.fit >= MIN_FIT)
    .sort((a, b) => b.fit - a.fit || Date.parse(b.postedAt) - Date.parse(a.postedAt))

  const countries = new Set<string>()
  for (const job of jobs) {
    if (job.location === 'Worldwide') continue
    for (const part of job.location.split(', ')) countries.add(part)
  }

  const dataset: Dataset = {
    generatedAt: new Date().toISOString(),
    counts: {
      jobs: jobs.length,
      companies: new Set(jobs.map((job) => job.company.toLowerCase())).size,
      countries: countries.size,
      salaryShown: jobs.filter((job) => job.salary !== null).length,
    },
    sources: [
      {
        name: 'Himalayas',
        url: 'https://himalayas.app/jobs',
        note: 'Free public remote jobs API. Apply links go to Himalayas, which is credited on every listing.',
      },
      {
        name: 'Remote OK',
        url: 'https://remoteok.com',
        note: 'Every Remote OK role links back to its Remote OK listing, which is named as the source.',
      },
    ],
    jobs,
  }

  // Keep the previous generation if every feed failed above; otherwise replace.
  let previous: Dataset | null = null
  try {
    previous = JSON.parse(await readFile(OUT, 'utf8')) as Dataset
  } catch {
    previous = null
  }
  if (dataset.jobs.length < 20 && previous && previous.jobs.length > dataset.jobs.length) {
    console.warn(`Only ${dataset.jobs.length} jobs this run; keeping the previous ${previous.jobs.length}-job dataset.`)
    process.exit(1)
  }

  await mkdir(new URL('../public', import.meta.url), { recursive: true })
  await writeFile(OUT, `${JSON.stringify(dataset, null, 2)}\n`)

  const regions = dataset.jobs.reduce<Record<Region, number>>(
    (acc, job) => ({ ...acc, [job.region]: (acc[job.region] ?? 0) + 1 }),
    { worldwide: 0, americas: 0, europe: 0, 'asia-pacific': 0, other: 0 },
  )
  console.log(`\nWrote ${dataset.jobs.length} jobs (${dataset.counts.companies} companies) to public/jobs.json`)
  console.log('Regions:', regions)
  console.log('Top roles:')
  for (const job of dataset.jobs.slice(0, 5)) console.log(`  ${job.fit} ${job.family.padEnd(11)} ${job.title} — ${job.company}`)
}

await main()
