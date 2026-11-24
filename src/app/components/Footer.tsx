import { Link } from 'react-router'

import { Mark } from './Nav'

const contact = 'khhnabubakar786@gmail.com'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-[1320px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Mark className="size-5" />
              <span className="font-display text-[19px] tracking-[-0.04em]">First Rung</span>
            </div>
            <p className="mt-4 max-w-[36ch] text-[14px] leading-relaxed text-muted">
              Remote tech roles that hire beginners. Pulled from public job feeds, filtered for entry-level, refreshed daily.
            </p>
            <a href={`mailto:${contact}`} className="link-draw mt-4 inline-block text-[14px] text-fg">
              {contact}
            </a>
          </div>

          <div className="text-[14px]">
            <p className="text-[12px] tracking-[0.14em] text-faint uppercase">Board</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/" className="link-draw text-muted hover:text-fg">
                  Browse entry-level roles
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="link-draw text-muted hover:text-fg">
                  How the filter works
                </Link>
              </li>
              <li>
                <Link to="/employers" className="link-draw text-muted hover:text-fg">
                  Post a role
                </Link>
              </li>
              <li>
                <a href="/jobs.json" className="link-draw text-muted hover:text-fg">
                  Open dataset (JSON)
                </a>
              </li>
            </ul>
          </div>

          <div className="text-[14px]">
            <p className="text-[12px] tracking-[0.14em] text-faint uppercase">Sources</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href="https://himalayas.app/jobs" target="_blank" rel="noopener" className="link-draw text-muted hover:text-fg">
                  Himalayas
                </a>
              </li>
              <li>
                <a href="https://remoteok.com" target="_blank" rel="noopener" className="link-draw text-muted hover:text-fg">
                  Remote OK
                </a>
              </li>
            </ul>
            <p className="mt-4 max-w-[30ch] text-[12.5px] leading-relaxed text-faint">
              Listings belong to their sources. Apply links go to the source, which is credited on every role.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[12.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} First Rung. An independent index, not a recruiter.</p>
          <p>Made for people who are one good first job away.</p>
        </div>
      </div>
    </footer>
  )
}
