import { useEffect, useState } from 'react'

import type { Dataset, Job, JobSource } from './types'
import { SOURCE_LABELS } from './types'

let cache: Promise<Dataset> | null = null

export function loadDataset(): Promise<Dataset> {
  if (!cache) {
    cache = fetch('/jobs.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load the job index (${response.status}).`)
        return response.json() as Promise<Dataset>
      })
      .catch((error: unknown) => {
        cache = null
        throw error
      })
  }
  return cache
}

export type DatasetState = { loading: boolean; data?: Dataset; error?: string }

export function useDataset(): DatasetState {
  const [state, setState] = useState<DatasetState>({ loading: true })

  useEffect(() => {
    let alive = true
    loadDataset().then(
      (data) => alive && setState({ loading: false, data }),
      (error: unknown) =>
        alive &&
        setState({
          loading: false,
          error: error instanceof Error ? error.message : 'Could not load the job index.',
        }),
    )
    return () => {
      alive = false
    }
  }, [])

  return state
}

export function useJob(id: string | undefined): { loading: boolean; job?: Job; data?: Dataset } {
  const state = useDataset()
  const job = state.data && id ? state.data.jobs.find((entry) => entry.id === id) : undefined
  return { loading: state.loading, job, data: state.data }
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Null when the organisation publishes no date, so the UI can stay honest. */
export function timeAgo(iso: string | null): string | null {
  if (!iso) return null
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return null
  const diff = Math.max(0, Date.now() - then)
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MINUTE))}m ago`
  if (diff < DAY) return `${Math.round(diff / HOUR)}h ago`
  const days = Math.round(diff / DAY)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.round(days / 30)}mo ago`
}

export function updatedAgo(iso: string): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 'recently'
  const hours = Math.max(0, Math.round((Date.now() - then) / HOUR))
  if (hours < 1) return 'in the last hour'
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

export function sourceLabel(source: JobSource): string {
  return SOURCE_LABELS[source] ?? source
}

export function monogram(company: string): string {
  const words = company.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/)
  if (words.length === 0 || !words[0]) return '·'
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

export function searchable(job: Job): string {
  return `${job.title} ${job.company} ${job.tags.join(' ')} ${job.location} ${job.family}`.toLowerCase()
}
