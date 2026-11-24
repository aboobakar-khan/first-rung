import type { Family, Region } from './types'

/**
 * The whole product is this file: deciding which of the ~12,000 entry-level
 * listings in the feeds are genuinely a first tech job. Everything here is
 * pure so the ingester and the tests share one implementation.
 */

const TECH_ROLE =
  /(engineer|developer|programmer|software|front[\s-]?end|back[\s-]?end|full[\s-]?stack|data (analyst|engineer|scientist|ops)|analytics engineer|machine learning|\bml\b|\bai\b|artificial intelligence|devops|sre\b|site reliability|qa\b|quality assurance|tester|test automation|security|cyber|cloud|infrastructure|mobile|ios|android|web|wordpress|react|node|python|java\b|golang|\brust\b|\bphp\b|\bruby\b|\.net|c\+\+|sql|database|sysadmin|systems? admin|support engineer|technical support)/i

const NON_TECH =
  /(nurse|clinical|physician|therapist|attorney|paralegal|accountant|bookkeep|sales|account executive|recruiter|talent acquisition|copywriter|content writer|social media|marketing|virtual assistant|data entry|translat|tutor|teacher|customer success|office manager)/i

const SENIOR_TITLE = /(senior|staff\b|principal|lead\b|head of|director|manager|architect|vp\b|chief)/i

const JUNIOR_TITLE = /(junior|\bjr\b|entry[\s-]?level|graduate|recent grad|\bintern\b|internship|apprentice|trainee|\bassociate\b|\bi\b$)/i

const JUNIOR_TEXT =
  /(no experience|without experience|bootcamp|recent graduate|new grad|graduate program|0[\s-]?2 years|0[\s-]?–[\s-]?2 years|entry level|entry-level|first (job|role)|career (change|changer|switcher))|(?:1\+?\s*year)/i

const YEARS_3_PLUS = /\b([3-9]|[1-9]\d)\s*\+?\s*years?\b/i

export type FitInput = {
  title: string
  text: string
  seniority?: string[]
  tags?: string[]
}

export type Fit = { fit: number; reasons: string[] }

/** Returns null when the listing is not a tech role at all. */
export function scoreFit({ title, text, seniority = [], tags = [] }: FitInput): Fit | null {
  const haystack = `${title} ${tags.join(' ')} ${text}`.toLowerCase()
  const titleLower = title.toLowerCase()

  const isTech = TECH_ROLE.test(title) || tags.some((tag) => TECH_ROLE.test(tag))
  if (!isTech) return null
  if (NON_TECH.test(titleLower) && !TECH_ROLE.test(title)) return null

  const reasons: string[] = []
  let fit = 38

  const levels = seniority.map((value) => value.toLowerCase())
  if (levels.includes('entry-level')) {
    fit += 34
    reasons.push('Listed as entry-level')
  } else if (levels.length > 0) {
    fit -= 6
  }

  if (JUNIOR_TITLE.test(title)) {
    fit += 18
    reasons.push('Junior title')
  }

  if (JUNIOR_TEXT.test(haystack)) {
    fit += 9
    reasons.push('Mentions no experience / early career')
  }

  if (SENIOR_TITLE.test(title)) {
    fit -= 34
  }

  if (YEARS_3_PLUS.test(text)) {
    fit -= 18
  }

  if (/\b(phd|doctorate)\b/i.test(text)) {
    fit -= 10
  }

  const salary = /(salary|compensation|\$\d|€\d|£\d)/i.test(text)
  if (salary) {
    fit += 3
  }

  fit = Math.max(0, Math.min(98, Math.round(fit)))
  if (fit < 35) return null
  if (reasons.length === 0) reasons.push('Entry-friendly requirements')
  return { fit, reasons: reasons.slice(0, 3) }
}

/** 0 = worldwide, otherwise the first region any country falls into. */
export function classifyRegion(countries: string[]): Region {
  if (countries.length === 0) return 'worldwide'
  const list = countries.map((country) => country.toLowerCase()).join(' ')

  if (/(united states|canada|mexico|brazil|argentina|chile|colombia|peru|uruguay|america)/.test(list)) return 'americas'
  if (/(united kingdom|germany|france|spain|portugal|netherlands|ireland|italy|poland|sweden|norway|denmark|finland|switzerland|austria|belgium|czech|romania|ukraine|estonia|lithuania|latvia|greece|hungary|bulgaria|croatia|slovakia|slovenia|serbia|europe)/.test(list)) return 'europe'
  if (/(india|australia|new zealand|singapore|japan|korea|philippines|indonesia|malaysia|vietnam|thailand|pakistan|bangladesh|sri lanka|china|hong kong|taiwan)/.test(list)) return 'asia-pacific'
  return 'other'
}

export function classifyFamily(title: string, tags: string[]): Family {
  const haystack = `${title} ${tags.join(' ')}`.toLowerCase()
  if (/(qa\b|quality assurance|tester|test automation|sdet)/.test(haystack)) return 'qa'
  if (/(devops|sre\b|site reliability|platform engineer|cloud|infrastructure|kubernetes|aws)/.test(haystack)) return 'devops'
  if (/(security|cyber|soc analyst|penetration)/.test(haystack)) return 'security'
  if (/(data analyst|data engineer|data scientist|analytics|machine learning|\bml\b|\bai\b)/.test(haystack)) return 'data'
  if (/(designer|ux|ui design|product design|figma)/.test(haystack)) return 'design'
  if (/(engineer|developer|programmer|software|front[\s-]?end|back[\s-]?end|full[\s-]?stack|web|mobile|ios|android)/.test(haystack)) return 'engineering'
  return 'other'
}

export function jobKey(company: string, title: string): string {
  return `${company} ${title}`
    .toLowerCase()
    .replace(/\((?:m|f|d|w|x)(?:\s*\/\s*(?:m|f|d|w|x))+\)/g, ' ')
    .replace(/\b(gmbh|inc|incorporated|ltd|llc|corp|corporation|limited|ug|bv)\b/g, ' ')
    .replace(/\b(senior|staff|lead|principal|junior|jr|entry|level)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function stableId(input: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

export function plainText(html: string, limit = 2600): string {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (text.length <= limit) return text
  const cut = text.slice(0, limit)
  const lastBreak = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf('. '))
  return `${(lastBreak > limit * 0.6 ? cut.slice(0, lastBreak) : cut).trim()}…`
}
