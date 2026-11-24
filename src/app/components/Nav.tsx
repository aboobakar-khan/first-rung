import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

export function Mark({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M7 3v18M17 3v18M7 8h10M7 15h10" />
    </svg>
  )
}

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <Mark className="size-5 text-fg" />
          <span className="font-display text-[19px] tracking-[-0.04em]">First Rung</span>
        </Link>

        <nav className="flex items-center gap-5 text-[14px] sm:gap-7">
          <Link to="/" className="link-draw hidden text-muted transition-colors hover:text-fg sm:inline">
            Browse roles
          </Link>
          <Link to="/how-it-works" className="link-draw hidden text-muted transition-colors hover:text-fg sm:inline">
            How it works
          </Link>
          <Link
            to="/employers"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-fg px-4 text-[13.5px] font-medium text-bg transition-colors hover:bg-[#2b2925]"
          >
            Post a job
            <ArrowUpRight className="size-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  )
}
