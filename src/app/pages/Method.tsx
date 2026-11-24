import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { updatedAgo, useDataset } from '../../lib/jobs'

const rules = [
  {
    title: 'A fixed list of Muslim-led employers',
    body: 'Masjids, Islamic schools and seminaries, Muslim charities, Islamic finance and halal businesses. A role is only here because its employer is on that list, not because a keyword matched.',
  },
  {
    title: 'Read from the employer’s own careers page',
    body: 'Each organisation publishes openings through its own hiring system. The script reads that system directly, so the listing is the employer’s own text, not a copy of a copy.',
  },
  {
    title: 'Sorted by category, not by a score',
    body: 'Roles are grouped as imam and Islamic studies, education, fundraising, programmes, finance, comms, operations, IT or health, so you can go straight to the work you do.',
  },
  {
    title: 'One copy of each role',
    body: 'The same opening found twice appears once, keeping the version with the fuller description and the working application link. Closed roles drop off on the next rebuild.',
  },
]

const fallbackSources = [
  {
    name: 'Islamic Relief Canada',
    url: 'https://islamicreliefcanada.org',
    note: 'Public Workday careers feed; apply links stay on Workday.',
  },
  {
    name: 'Human Appeal',
    url: 'https://humanappeal.org.uk',
    note: 'Public BambooHR vacancy list; apply links stay on BambooHR.',
  },
  {
    name: 'Muslim Hands',
    url: 'https://muslimhands.org.uk',
    note: 'Vacancies page, linked to the organisation’s own listing.',
  },
]

export function Method() {
  const { data } = useDataset()
  const sources = data?.sources?.length ? data.sources : fallbackSources

  return (
    <div className="mx-auto max-w-[980px] px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-[12px] tracking-[0.16em] text-muted uppercase">The method</p>
      <h1 className="font-display mt-5 max-w-[24ch] text-[clamp(36px,5.6vw,64px)] text-balance">
        How a role earns a place here.
      </h1>
      <p className="mt-6 max-w-[62ch] text-[15.5px] leading-relaxed text-muted text-pretty">
        This board is assembled by a script, not by someone reading job ads all day. That is the point: it can be rebuilt
        every day without anyone getting bored of it. Here is exactly what the script does.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {rules.map((rule, index) => (
          <div key={rule.title} className="rounded-card border border-line bg-surface p-6">
            <p className="text-[11.5px] tracking-[0.14em] text-faint uppercase">Rule {index + 1}</p>
            <h2 className="mt-2.5 text-[16px] font-medium">{rule.title}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{rule.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-14 border-t border-line pt-10">
        <h2 className="font-display text-[clamp(24px,3vw,32px)]">Where the roles come from</h2>
        <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-muted">
          Every organisation below is read from the careers system it already publishes for applicants. Amanah Jobs is an
          index: the listing, the application and the hiring decision belong to the employer.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-2/60 text-[11.5px] tracking-[0.1em] text-faint uppercase">
              <tr>
                <th className="px-4 py-3 font-normal">Organisation</th>
                <th className="px-4 py-3 font-normal">How its roles are read</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sources.map((source) => (
                <tr key={source.name}>
                  <td className="px-4 py-4 align-top">
                    <a href={source.url} target="_blank" rel="noopener" className="link-draw font-medium">
                      {source.name}
                    </a>
                  </td>
                  <td className="px-4 py-4 align-top text-muted">{source.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[12.5px] leading-relaxed text-faint">
          Bigger Muslim job boards exist, and we do not copy them. Republishing another board's listings is not ours to do,
          and ReliefWeb's job API now requires an approved application name — so the list grows by adding organisations'
          own careers systems, one at a time.
        </p>
      </section>

      <section className="mt-14 border-t border-line pt-10">
        <h2 className="font-display text-[clamp(24px,3vw,32px)]">Freshness</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line p-5">
            <p className="text-[11.5px] tracking-[0.1em] text-faint uppercase">Last rebuild</p>
            <p className="mt-1.5 text-[15px] font-medium">{data ? updatedAgo(data.generatedAt) : '—'}</p>
          </div>
          <div className="rounded-2xl border border-line p-5">
            <p className="text-[11.5px] tracking-[0.1em] text-faint uppercase">Cadence</p>
            <p className="mt-1.5 text-[15px] font-medium">Daily, early morning</p>
          </div>
          <div className="rounded-2xl border border-line p-5">
            <p className="text-[11.5px] tracking-[0.1em] text-faint uppercase">Closed roles</p>
            <p className="mt-1.5 text-[15px] font-medium">Dropped on rebuild</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          Because closed roles are dropped, a saved link can stop working. If you find one that has,{' '}
          <a href="mailto:khhnabubakar786@gmail.com?subject=Closed%20role" className="link-draw text-fg">
            tell us
          </a>{' '}
          and we will pull it sooner.
        </p>
      </section>

      <section className="mt-14 rounded-card border border-line bg-fg p-8 text-bg">
        <h2 className="font-display text-[clamp(24px,3vw,32px)] text-balance">The honest limitation</h2>
        <p className="mt-3 max-w-[62ch] text-[13.5px] leading-relaxed text-bg/70">
          A curated list is only as good as the names on it. A handful of organisations is a start, not a sector: UK and
          Canadian charities are well covered, and Islamic schools, masjids and halal businesses mostly are not yet. If your
          organisation publishes openings somewhere the script can read, send the link and it gets added.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/" className="inline-flex h-10 items-center gap-2 rounded-full bg-bg px-4 text-[13px] font-medium text-fg">
            Back to the board <ArrowUpRight className="size-3.5" />
          </Link>
          <a href="/jobs.json" className="inline-flex h-10 items-center rounded-full border border-bg/25 px-4 text-[13px] text-bg/80 hover:border-bg/50">
            Download the dataset
          </a>
        </div>
      </section>
    </div>
  )
}
