import { ArrowLeft, ArrowUpRight, Banknote, Briefcase, Clock, MapPin } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'

import { monogram, sourceLabel, timeAgo, useJob } from '../../lib/jobs'
import { FAMILY_LABELS } from '../../lib/types'
import { JobRow } from '../components/JobRow'

export function JobDetail() {
  const { id } = useParams()
  const { loading, job, data } = useJob(id)

  useEffect(() => {
    if (job) document.title = `${job.title} at ${job.company} — Amanah Jobs`
    return () => {
      document.title = 'Amanah Jobs — roles at Muslim-led organisations'
    }
  }, [job])

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] animate-pulse px-5 py-20 sm:px-8">
        <div className="h-3 w-24 rounded bg-surface-2" />
        <div className="mt-8 h-8 w-3/5 rounded bg-surface-2" />
        <div className="mt-4 h-4 w-2/5 rounded bg-surface-2" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-[1100px] px-5 py-24 sm:px-8">
        <p className="text-[12px] tracking-[0.16em] text-faint uppercase">Role not indexed</p>
        <h1 className="font-display mt-4 text-[clamp(34px,5vw,56px)]">This listing has closed.</h1>
        <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">
          Roles are removed when they disappear from the organisation's careers page. The board is rebuilt daily, so there
          will be something new.
        </p>
        <Link to="/" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-[14px] font-medium text-bg">
          <ArrowLeft className="size-4" /> Back to the board
        </Link>
      </div>
    )
  }

  const age = timeAgo(job.postedAt)
  const sourceName = sourceLabel(job.source)
  const related = (data?.jobs ?? []).filter((entry) => entry.id !== job.id && entry.family === job.family).slice(0, 3)
  const paragraphs = job.description.split('\n').map((line) => line.trim()).filter(Boolean)

  return (
    <div className="mx-auto max-w-[1160px] px-5 py-10 sm:px-8 sm:py-14">
      <Link to="/" className="link-draw inline-flex items-center gap-2 text-[13.5px] text-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> All roles
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-[13.5px] font-medium text-muted">
              {monogram(job.company)}
            </span>
            <div>
              <p className="text-[14px] font-medium">{job.company}</p>
              <p className="text-[12.5px] text-faint">
                {FAMILY_LABELS[job.family]}
                {age ? ` · posted ${age}` : ''} · via {sourceName}
              </p>
            </div>
          </div>

          <h1 className="font-display mt-6 text-[clamp(30px,4.6vw,50px)] text-balance">{job.title}</h1>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            <div className="bg-surface p-4">
              <dt className="flex items-center gap-1.5 text-[11.5px] tracking-[0.1em] text-faint uppercase">
                <Banknote className="size-3.5" /> Salary
              </dt>
              <dd className="mt-1.5 text-[13.5px] font-medium tabular-nums">{job.salary ?? 'Not listed'}</dd>
            </div>
            <div className="bg-surface p-4">
              <dt className="flex items-center gap-1.5 text-[11.5px] tracking-[0.1em] text-faint uppercase">
                <MapPin className="size-3.5" /> Location
              </dt>
              <dd className="mt-1.5 text-[13.5px] font-medium">{job.location}</dd>
            </div>
            <div className="bg-surface p-4">
              <dt className="flex items-center gap-1.5 text-[11.5px] tracking-[0.1em] text-faint uppercase">
                <Briefcase className="size-3.5" /> Type
              </dt>
              <dd className="mt-1.5 text-[13.5px] font-medium">{job.type || 'Not stated'}</dd>
            </div>
            <div className="bg-surface p-4">
              <dt className="flex items-center gap-1.5 text-[11.5px] tracking-[0.1em] text-faint uppercase">
                <Clock className="size-3.5" /> Posted
              </dt>
              <dd className="mt-1.5 text-[13.5px] font-medium">{age ?? 'Not dated'}</dd>
            </div>
          </dl>

          {job.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {job.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-line px-2.5 py-1 text-[12px] text-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-10 border-t border-line pt-8">
            <p className="text-[11.5px] tracking-[0.16em] text-faint uppercase">The role, as posted</p>
            <div className="mt-4 space-y-3.5 text-[14.5px] leading-[1.7] text-[#2f2c27]">
              {paragraphs.length > 0 ? (
                paragraphs.map((line, index) => <p key={index}>{line}</p>)
              ) : (
                <p className="text-muted">
                  This organisation's careers page does not publish a description — open the listing to read the full role.
                </p>
              )}
            </div>
            <p className="mt-6 text-[12.5px] leading-relaxed text-faint">
              Text is reproduced from {job.company}'s {sourceName} careers page so you can judge the role before you leave.
              The full posting and the application live there.
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-line bg-surface p-6">
            <p className="text-[11.5px] tracking-[0.16em] text-faint uppercase">Apply</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              {job.company} takes applications on its own {sourceName} careers site.
            </p>

            <a
              href={job.url}
              target="_blank"
              rel="noopener"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-fg text-[14px] font-medium text-bg transition-colors hover:bg-[#2b2925]"
            >
              Apply at {job.company}
              <ArrowUpRight className="size-4" />
            </a>
            <p className="mt-3 text-center text-[11.5px] leading-relaxed text-faint">
              You’ll finish the application there. Amanah Jobs never asks for your details.
            </p>
          </div>

          <div className="mt-4 rounded-card border border-line p-5 text-[12.5px] leading-relaxed text-muted">
            <p className="font-medium text-fg">Where this came from</p>
            <p className="mt-2">
              Read from {job.company}'s own careers page ({sourceName}), which handles the application. Spotted something
              wrong?{' '}
              <a href={`mailto:khhnabubakar786@gmail.com?subject=Listing%20issue%3A%20${encodeURIComponent(job.title)}`} className="link-draw text-fg">
                Tell us
              </a>
              .
            </p>
          </div>

          <div className="mt-4 rounded-card border border-line bg-fg p-5 text-bg">
            <p className="text-[13px] leading-snug font-medium">Hiring at your organisation?</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-bg/65">Feature the role at the top of the board for 30 days.</p>
            <Link to="/employers" className="link-draw mt-3 inline-block text-[12.5px] font-medium text-bg">
              Employer pricing →
            </Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-8">
          <h2 className="text-[11.5px] tracking-[0.16em] text-faint uppercase">More {FAMILY_LABELS[job.family].toLowerCase()} roles</h2>
          <div className="mt-3">
            {related.map((entry) => (
              <JobRow key={entry.id} job={entry} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
