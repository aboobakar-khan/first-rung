import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { monogram, sourceLabel, timeAgo } from '../../lib/jobs'
import { FAMILY_LABELS, type Job } from '../../lib/types'

export function JobRow({ job }: { job: Job }) {
  const age = timeAgo(job.postedAt)

  return (
    <Link
      to={`/job/${job.id}`}
      className="group relative flex flex-col gap-3 border-b border-line py-5 transition-colors hover:bg-surface/70 sm:-mx-4 sm:rounded-2xl sm:border-b-0 sm:px-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-[13px] font-medium tracking-tight text-muted">
            {monogram(job.company)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-medium text-muted">{job.company}</p>
            <p className="text-[12px] text-faint">
              {age ? `${age} · ` : ''}
              via {sourceLabel(job.source)}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
          {FAMILY_LABELS[job.family]}
        </span>
      </div>

      <h3 className="text-[18px] leading-snug font-medium tracking-[-0.015em] text-fg sm:text-[19px]">{job.title}</h3>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
        <span>{job.location}</span>
        {job.type && (
          <>
            <span className="text-line-strong">/</span>
            <span>{job.type}</span>
          </>
        )}
        {job.salary && (
          <>
            <span className="text-line-strong">/</span>
            <span className="font-medium text-fg tabular-nums">{job.salary}</span>
          </>
        )}
        {job.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px] text-muted">
            {tag}
          </span>
        ))}
      </div>

      <ArrowUpRight className="absolute top-5 right-4 size-4 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}
