export type JobSource = 'himalayas' | 'remoteok'

export type Family = 'engineering' | 'data' | 'qa' | 'devops' | 'security' | 'design' | 'other'

export type Region = 'worldwide' | 'americas' | 'europe' | 'asia-pacific' | 'other'

export type Job = {
  /** Stable id derived from the source url. */
  id: string
  title: string
  company: string
  /** Where the apply button goes. Himalayas requires its own applicationLink. */
  url: string
  source: JobSource
  postedAt: string
  /** Human readable, e.g. "Worldwide" or "United States, Canada". */
  location: string
  salary: string | null
  type: string
  tags: string[]
  seniority: string[]
  excerpt: string
  description: string
  /** 0-100 entry-level fit score. */
  fit: number
  reasons: string[]
  family: Family
  region: Region
}

export type Dataset = {
  generatedAt: string
  counts: {
    jobs: number
    companies: number
    countries: number
    salaryShown: number
  }
  sources: { name: string; url: string; note: string }[]
  jobs: Job[]
}

export const FAMILY_LABELS: Record<Family, string> = {
  engineering: 'Engineering',
  data: 'Data',
  qa: 'QA & testing',
  devops: 'DevOps & cloud',
  security: 'Security',
  design: 'Design',
  other: 'Other',
}

export const REGION_LABELS: Record<Region, string> = {
  worldwide: 'Worldwide',
  americas: 'Americas',
  europe: 'Europe',
  'asia-pacific': 'Asia-Pacific',
  other: 'Elsewhere',
}
