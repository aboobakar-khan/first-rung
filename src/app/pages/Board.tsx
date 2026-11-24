import { ArrowUpRight, ChevronDown, Mail, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { houseAd } from '../../data/featured'
import { searchable, updatedAgo, useDataset } from '../../lib/jobs'
import { FAMILY_LABELS, REGION_LABELS, type Family, type Region } from '../../lib/types'
import { JobRow } from '../components/JobRow'
import { cx } from '../lib/cx'

const PAGE = 20

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'h-8 shrink-0 rounded-full border px-3.5 text-[13px] transition-colors',
        active ? 'border-fg bg-fg text-bg' : 'border-line-strong bg-transparent text-muted hover:border-fg hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 appearance-none rounded-full border border-line-strong bg-transparent pr-8 pl-3.5 text-[13px] text-fg transition-colors hover:border-fg"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-muted" />
    </label>
  )
}

export function Board() {
  const { loading, data, error } = useDataset()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<'all' | Family>('all')
  const [region, setRegion] = useState<'all' | Region>('all')
  const [salaryOnly, setSalaryOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE)

  const jobs = data?.jobs ?? []

  const families = useMemo(() => {
    const counts = new Map<Family, number>()
    for (const job of jobs) counts.set(job.family, (counts.get(job.family) ?? 0) + 1)
    return [...counts.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1])
  }, [jobs])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return jobs
      .filter((job) => {
        if (family !== 'all' && job.family !== family) return false
        if (region !== 'all' && job.region !== region) return false
        if (salaryOnly && !job.salary) return false
        if (needle && !searchable(job).includes(needle)) return false
        return true
      })
      .sort((a, b) => {
        const at = a.postedAt ? Date.parse(a.postedAt) : 0
        const bt = b.postedAt ? Date.parse(b.postedAt) : 0
        return bt - at || a.company.localeCompare(b.company) || a.title.localeCompare(b.title)
      })
  }, [jobs, query, family, region, salaryOnly])

  const filtersActive = query !== '' || family !== 'all' || region !== 'all' || salaryOnly
  const visible = results.slice(0, limit)

  return (
    <>
      <section className="mx-auto max-w-[1320px] px-5 pt-14 pb-10 sm:px-8 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="flex items-center gap-2 text-[12px] tracking-[0.16em] text-muted uppercase">
              <span className="inline-block size-1.5 rounded-full bg-accent" />
              Masjids · schools · charities · Islamic finance
            </p>
            <h1 className="font-display mt-5 text-[clamp(42px,7vw,84px)] text-balance">
              Work that serves
              <br />
              the <span className="text-accent">ummah</span>.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[15.5px] leading-relaxed text-muted text-pretty">
              Every role here is at a Muslim-led organisation — imams and teachers, fundraisers, programme officers,
              accountants and engineers. Read from the organisations' own careers pages, not copied from another board.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#roles" className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-[14px] font-medium text-bg transition-colors hover:bg-[#2b2925]">
                Browse {loading ? 'roles' : `${jobs.length} roles`}
                <ArrowUpRight className="size-4" />
              </a>
              <Link to="/how-it-works" className="link-draw inline-flex h-11 items-center text-[14px] text-muted hover:text-fg">
                How roles are chosen
              </Link>
            </div>
          </div>

          <div className="rounded-card border border-line bg-surface p-6">
            <div className="flex items-baseline justify-between">
              <p className="text-[12px] tracking-[0.14em] text-faint uppercase">Live index</p>
              <p className="text-[12px] text-faint">{data ? updatedAgo(data.generatedAt) : 'loading'}</p>
            </div>
            <p className="font-display mt-3 text-[64px] leading-none tabular-nums">{loading ? '—' : data?.counts.jobs}</p>
            <p className="mt-1 text-[13.5px] text-muted">
              open roles at {loading ? '—' : data?.counts.organisations} organisations
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5 text-[12.5px]">
              <div>
                <p className="text-faint">Countries</p>
                <p className="mt-1 text-[17px] tabular-nums">{loading ? '—' : data?.counts.countries}</p>
              </div>
              <div>
                <p className="text-faint">With salary</p>
                <p className="mt-1 text-[17px] tabular-nums">{loading ? '—' : data?.counts.salaryShown}</p>
              </div>
              <div>
                <p className="text-faint">Sources</p>
                <p className="mt-1 text-[17px] tabular-nums">{loading ? '—' : data?.sources.length}</p>
              </div>
            </div>

            <p className="mt-5 text-[12px] leading-relaxed text-faint">
              Rebuilt daily from the careers pages of{' '}
              {data?.sources.slice(0, 3).map((source, index) => (
                <span key={source.name}>
                  {index > 0 && ', '}
                  <a href={source.url} target="_blank" rel="noopener" className="link-draw text-muted">
                    {source.name}
                  </a>
                </span>
              ))}
              {data && data.sources.length > 3 ? ` and ${data.sources.length - 3} more` : ''}. Apply links go to the employer.
            </p>
          </div>
        </div>
      </section>

      <div id="roles" className="sticky top-16 z-30 border-y border-line bg-bg/92 backdrop-blur-md">
        <div className="mx-auto max-w-[1320px] px-5 py-3 sm:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setLimit(PAGE)
                  }}
                  placeholder="Search role, organisation or city"
                  aria-label="Search roles"
                  className="h-10 w-full rounded-full border border-line-strong bg-surface pr-4 pl-10 text-[14px] placeholder:text-faint focus:border-fg focus:outline-none"
                />
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Select
                  label="Location"
                  value={region}
                  onChange={(value) => {
                    setRegion(value as 'all' | Region)
                    setLimit(PAGE)
                  }}
                  options={[
                    { value: 'all', label: 'Anywhere' },
                    ...(Object.keys(REGION_LABELS) as Region[]).map((key) => ({ value: key, label: REGION_LABELS[key] })),
                  ]}
                />
              </div>
            </div>

            <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
              <Chip active={family === 'all'} onClick={() => { setFamily('all'); setLimit(PAGE) }}>
                All roles
              </Chip>
              {families.map(([key, count]) => (
                <Chip key={key} active={family === key} onClick={() => { setFamily(key); setLimit(PAGE) }}>
                  {FAMILY_LABELS[key]} <span className="text-faint">{count}</span>
                </Chip>
              ))}
              <span className="mx-1 h-5 w-px shrink-0 bg-line" />
              <Chip active={salaryOnly} onClick={() => { setSalaryOnly(!salaryOnly); setLimit(PAGE) }}>
                Salary shown
              </Chip>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1320px] px-5 py-8 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_304px] lg:gap-14">
          <div>
            <div className="flex items-baseline justify-between gap-4 pb-2">
              <p className="text-[13px] text-muted">
                {loading ? 'Loading the index…' : `${results.length} ${results.length === 1 ? 'role' : 'roles'}`}
                {filtersActive && !loading && <span className="text-faint"> · filtered from {jobs.length}</span>}
              </p>
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setFamily('all')
                    setRegion('all')
                    setSalaryOnly(false)
                    setLimit(PAGE)
                  }}
                  className="link-draw text-[13px] text-muted hover:text-fg"
                >
                  Clear filters
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-line bg-surface p-6 text-[14px] text-muted">
                {error} Run <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[12.5px]">bun run ingest</code> to rebuild the
                index.
              </div>
            )}

            {loading && (
              <div className="space-y-5 pt-3">
                {[0, 1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="animate-pulse space-y-3 border-b border-line py-5">
                    <div className="h-3 w-40 rounded bg-surface-2" />
                    <div className="h-4 w-3/5 rounded bg-surface-2" />
                    <div className="h-3 w-2/5 rounded bg-surface-2" />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="mt-3 rounded-2xl border border-line bg-surface p-8">
                <p className="font-display text-[26px]">Nothing matches that yet.</p>
                <p className="mt-2 max-w-[48ch] text-[14px] text-muted">
                  The index is rebuilt daily, so new roles land all the time. Clear a filter or two, or get the weekly list by
                  email.
                </p>
                <a
                  href="mailto:khhnabubakar786@gmail.com?subject=Add%20me%20to%20the%20Friday%20list"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-fg px-4 text-[13.5px] font-medium text-bg"
                >
                  <Mail className="size-4" /> Join the Friday list
                </a>
              </div>
            )}

            {!loading && !error && visible.length > 0 && (
              <div>
                {visible.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </div>
            )}

            {results.length > limit && (
              <button
                type="button"
                onClick={() => setLimit(limit + PAGE)}
                className="mt-8 h-11 w-full rounded-full border border-line-strong text-[14px] font-medium transition-colors hover:border-fg hover:bg-surface"
              >
                Show {Math.min(PAGE, results.length - limit)} more roles
              </button>
            )}
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-36 lg:self-start">
            <div className="rounded-card border border-line bg-fg p-6 text-bg">
              <p className="text-[11.5px] tracking-[0.16em] text-bg/55 uppercase">{houseAd.eyebrow}</p>
              <p className="font-display mt-3 text-[23px] leading-[1.08] text-balance">{houseAd.title}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-bg/65">{houseAd.blurb}</p>
              <Link
                to={houseAd.href}
                className="mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-bg text-[13.5px] font-medium text-fg transition-colors hover:bg-white"
              >
                {houseAd.cta}
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="rounded-card border border-line bg-surface p-6">
              <p className="text-[11.5px] tracking-[0.16em] text-faint uppercase">Every Friday</p>
              <p className="mt-3 text-[15px] leading-snug font-medium">New roles at Muslim-led organisations, one email.</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Only what was added since the last list. No recruiter spam, no “unlimited opportunity” nonsense.
              </p>
              <a
                href="mailto:khhnabubakar786@gmail.com?subject=Add%20me%20to%20the%20Friday%20list&body=Send%20me%20the%20weekly%20roles%20at%20Muslim-led%20organisations."
                className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-medium text-fg link-draw"
              >
                <Mail className="size-4" /> Join the list
              </a>
            </div>

            <div className="rounded-card border border-line p-6">
              <p className="text-[11.5px] tracking-[0.16em] text-faint uppercase">How this list is built</p>
              <ul className="mt-3 space-y-2 text-[13px] text-muted">
                <li>· A fixed list of Muslim-led employers</li>
                <li>· Read from their own careers pages</li>
                <li>· Every apply link goes to the employer</li>
              </ul>
              <Link to="/how-it-works" className="link-draw mt-3 inline-block text-[13px] font-medium text-fg">
                Read the method
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
