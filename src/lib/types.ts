export type JobSource = 'workday' | 'bamboohr' | 'muslimhands'

export type Family =
  | 'islamic-studies'
  | 'education'
  | 'fundraising'
  | 'programmes'
  | 'finance'
  | 'comms'
  | 'operations'
  | 'it'
  | 'health'
  | 'other'

export type Region =
  | 'uk'
  | 'north-america'
  | 'europe'
  | 'middle-east'
  | 'africa'
  | 'asia-pacific'
  | 'worldwide'
  | 'other'

export type Job = {
  /** Stable id derived from the apply url. */
  id: string
  title: string
  /** The Muslim-led organisation doing the hiring. */
  company: string
  /** Where the apply button goes: the organisation's own listing. */
  url: string
  source: JobSource
  /** Null when the source publishes no date; the UI then omits the age. */
  postedAt: string | null
  /** Human readable, e.g. "Manchester, United Kingdom". */
  location: string
  salary: string | null
  type: string
  tags: string[]
  excerpt: string
  description: string
  family: Family
  region: Region
}

export type Dataset = {
  generatedAt: string
  counts: {
    jobs: number
    organisations: number
    countries: number
    salaryShown: number
  }
  sources: { name: string; url: string; note: string }[]
  jobs: Job[]
}

export const FAMILY_LABELS: Record<Family, string> = {
  'islamic-studies': 'Imam & Islamic studies',
  education: 'Education',
  fundraising: 'Fundraising',
  programmes: 'Programmes & relief',
  finance: 'Finance',
  comms: 'Marketing & comms',
  operations: 'Operations & HR',
  it: 'IT & digital',
  health: 'Health & care',
  other: 'Other',
}

export const REGION_LABELS: Record<Region, string> = {
  uk: 'United Kingdom',
  'north-america': 'North America',
  europe: 'Europe',
  'middle-east': 'Middle East',
  africa: 'Africa',
  'asia-pacific': 'Asia-Pacific',
  worldwide: 'Worldwide',
  other: 'Elsewhere',
}

export const SOURCE_LABELS: Record<JobSource, string> = {
  workday: 'Workday',
  bamboohr: 'BambooHR',
  muslimhands: 'Muslim Hands',
}
