import type { Family, Region } from './types'

/**
 * Classification for the board: which kind of Muslim-organisation role a
 * listing is, and where it sits. Pure functions so the ingester and the tests
 * share one implementation.
 */

export function classifyFamily(title: string, extra: string[] = []): Family {
  const haystack = `${title} ${extra.join(' ')}`.toLowerCase()

  if (/(imam|islamic studies|quran|qur'an|hifz|hafiz|shariah|sharia|fatwa|chaplain|religious|aqeedah|seerah)/.test(haystack)) {
    return 'islamic-studies'
  }
  if (/(teacher|teaching|tutor|madrasah|madrasa|school|academy|seminary|curriculum|senco|lecturer|maths|mathematics|humanities|head of english|english teacher)/.test(haystack)) {
    return 'education'
  }
  if (/(fundrais|donor|philanthrop|legacy|major gift|community engagement|events? officer)/.test(haystack)) {
    return 'fundraising'
  }
  if (/(programme|program\b|project|relief|humanitarian|field officer|monitoring|evaluation|emergency|wash|livelihood|food security)/.test(haystack)) {
    return 'programmes'
  }
  if (/(finance|financial|accountant|accounting|payroll|bookkeep|audit|treasur|procurement)/.test(haystack)) {
    return 'finance'
  }
  if (/(market|communicat|social media|content|design|brand|media|digital marketing|copywrit|video|graphic|pr\b|public relations)/.test(haystack)) {
    return 'comms'
  }
  if (/(operations|operational|\bhr\b|human resources|people|recruit|office|administrat|facilit|logistics|compliance|governance|volunteer|security officer|facilities)/.test(haystack)) {
    return 'operations'
  }
  if (/(developer|engineer|software|\bit\b|data|web|systems? admin|technical|developer|devops|database|digital experience)/.test(haystack)) {
    return 'it'
  }
  if (/(nurse|health|medical|clinic|doctor|physician|counsel|therap|mental health|care worker|social worker|midwif)/.test(haystack)) {
    return 'health'
  }
  return 'other'
}

/** Country and state names first: they are the only reliable signal. */
const REGION_COUNTRIES: [Region, RegExp][] = [
  ['uk', /(united kingdom|\buk\b|england|scotland|wales|northern ireland|great britain)/i],
  ['north-america', /(united states|\busa?\b|u\.s\.|canada|ontario|quebec)/i],
  ['middle-east', /(saudi|uae|united arab emirates|qatar|kuwait|bahrain|oman|jordan|lebanon|iraq|yemen|palestine|gaza|syria|turkey|türkiye)/i],
  [
    'africa',
    /(nigeria|kenya|somalia|sudan|south sudan|ethiopia|egypt|morocco|algeria|tunisia|ghana|senegal|mali|uganda|tanzania|zambia|malawi|niger|chad|mauritania|gambia|sierra leone|libya|djibouti|burkina)/i,
  ],
  ['asia-pacific', /(pakistan|bangladesh|india|indonesia|malaysia|sri lanka|nepal|afghanistan|philippines|australia|new zealand|singapore|japan|china|thailand|vietnam)/i],
  [
    'europe',
    /(germany|france|spain|italy|netherlands|belgium|sweden|norway|denmark|finland|ireland|portugal|poland|austria|switzerland|bosnia|albania|kosovo|greece)/i,
  ],
]

/** Cities only after no country matched, and only unambiguous ones. */
const REGION_CITIES: [Region, RegExp][] = [
  ['uk', /(london|birmingham|manchester|leeds|glasgow|nottingham|leicester|coventry|bradford|luton|bristol|edinburgh|cardiff|belfast|sheffield|liverpool)/i],
  ['north-america', /(toronto|mississauga|brampton|ottawa|calgary|vancouver|edmonton|chicago|new york|houston|dallas|atlanta|detroit|los angeles|washington|montreal)/i],
  ['middle-east', /(dubai|abu dhabi|doha|riyadh|jeddah|amman|beirut|istanbul)/i],
  ['africa', /(khartoum|omdurman|mogadishu|nairobi|lagos|accra|dakar|bamako)/i],
]

/** Region for a free-text location, e.g. "Manchester, UK" or "Cambridge, Ontario". */
export function classifyRegion(location: string, countries: string[] = []): Region {
  const haystack = `${location} ${countries.join(' ')}`.trim()
  if (!haystack) return 'worldwide'
  if (/\b(remote|worldwide|global|anywhere)\b/i.test(haystack) && countries.length === 0) return 'worldwide'
  for (const [region, pattern] of REGION_COUNTRIES) {
    if (pattern.test(haystack)) return region
  }
  for (const [region, pattern] of REGION_CITIES) {
    if (pattern.test(haystack)) return region
  }
  return 'other'
}

const COUNTRY_HINTS: [string, RegExp][] = [
  ['United Kingdom', /(united kingdom|\buk\b|england|scotland|wales|northern ireland)/i],
  ['United States', /(united states|\busa?\b|u\.s\.)/i],
  ['Canada', /(canada|ontario|quebec)/i],
  ['Pakistan', /pakistan/i],
  ['Bangladesh', /bangladesh/i],
  ['Nigeria', /nigeria/i],
  ['Kenya', /kenya/i],
  ['Somalia', /somalia/i],
  ['Sudan', /(sudan|khartoum|omdurman)/i],
  ['Palestine', /(palestine|gaza)/i],
  ['Malaysia', /malaysia/i],
  ['Indonesia', /indonesia/i],
  ['Turkey', /(turkey|türkiye)/i],
  ['Saudi Arabia', /saudi/i],
  ['United Arab Emirates', /(uae|united arab emirates|dubai|abu dhabi)/i],
  ['South Africa', /south africa/i],
  ['Australia', /australia/i],
]

/** Best-effort country name from a location string, for the dataset counts. */
export function countryOf(location: string): string | null {
  for (const [country, pattern] of COUNTRY_HINTS) {
    if (pattern.test(location)) return country
  }
  return null
}

export function jobKey(company: string, title: string): string {
  return `${company} ${title}`
    .toLowerCase()
    .replace(/\b(gmbh|inc|incorporated|ltd|llc|corp|corporation|limited|uk|usa|canada|foundation|trust|charity)\b/g, ' ')
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
