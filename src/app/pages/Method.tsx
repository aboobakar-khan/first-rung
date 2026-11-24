import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { updatedAgo, useDataset } from '../../lib/jobs'

const rules = [
  {
    title: 'A real tech role',
    body: 'The title or its tags have to describe engineering, data, QA, DevOps, security or design work. Sales, support-heavy and clinical roles are dropped even when they are entry-level.',
  },
  {
    title: 'Entry-level, checked twice',
    body: 'We only query the feeds for listings they mark as entry-level, then score each one again. Senior, staff, principal, lead and manager titles are removed outright.',
  },
  {
    title: 'Experience requirements read, not assumed',
    body: 'Listings that ask for three or more years, a PhD, or clearly senior ownership lose enough points to fall off the board. Internships and graduate programmes score highly.',
  },
  {
    title: 'One copy of each role',
    body: 'The same job posted by several boards appears once, keeping the version with the strongest fit and the most useful apply link.',
  },
]

export function Method() {
  const { data } = useDataset()

  return (
    <div className="mx-auto max-w-[980px] px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-[12px] tracking-[0.16em] text-muted uppercase">The method</p>
      <h1 className="font-display mt-5 max-w-[24ch] text-[clamp(36px,5.6vw,64px)] text-balance">
        How a listing earns a place here.
      </h1>
      <p className="mt-6 max-w-[62ch] text-[15.5px] leading-relaxed text-muted text-pretty">
        This board is assembled by a script, not by a person reading job ads all day. That is the point: it can be rebuilt
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
        <h2 className="font-display text-[clamp(24px,3vw,32px)]">Where the jobs come from</h2>
        <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-muted">
          Two public feeds, both used under the terms their operators publish. First Rung is an index: the listing, the
          application and the hiring decision all belong to the source.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-2/60 text-[11.5px] tracking-[0.1em] text-faint uppercase">
              <tr>
                <th className="px-4 py-3 font-normal">Source</th>
                <th className="px-4 py-3 font-normal">What it gives us</th>
                <th className="px-4 py-3 font-normal">Attribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="px-4 py-4 align-top">
                  <a href="https://himalayas.app/jobs" target="_blank" rel="noopener" className="link-draw font-medium">
                    Himalayas
                  </a>
                </td>
                <td className="px-4 py-4 align-top text-muted">
                  Seniority, salary range, location and timezone restrictions, and the application link.
                </td>
                <td className="px-4 py-4 align-top text-muted">Apply links go to Himalayas; the source is named on every role.</td>
              </tr>
              <tr>
                <td className="px-4 py-4 align-top">
                  <a href="https://remoteok.com" target="_blank" rel="noopener" className="link-draw font-medium">
                    Remote OK
                  </a>
                </td>
                <td className="px-4 py-4 align-top text-muted">Junior-titled roles, tags and salary ranges.</td>
                <td className="px-4 py-4 align-top text-muted">Every role links back to its Remote OK listing, with a followed link.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[12.5px] leading-relaxed text-faint">
          Remotive is deliberately not used: its API terms forbid republishing its listings on third-party job sites. We would
          rather have a smaller board than a board built on someone else’s terms being broken.
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
          A score is a guess. “Entry-level” means different things at different companies, and a role that says no experience
          can still be looking for a year of it. Use the fit score to decide what to read first, not what to apply to. If a
          listing looks wrong, the fastest fix is an email, and we will drop it.
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
