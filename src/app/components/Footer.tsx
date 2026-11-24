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
              <span className="font-display text-[19px] tracking-[-0.04em]">Amanah Jobs</span>
            </div>
            <p className="mt-4 max-w-[38ch] text-[14px] leading-relaxed text-muted">
              Roles at Muslim-led organisations: masjids, Islamic schools, charities, Islamic finance and halal businesses.
              Read from their own careers pages and rebuilt daily.
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
                  Browse all roles
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="link-draw text-muted hover:text-fg">
                  How the list is built
                </Link>
              </li>
              <li>
                <Link to="/employers" className="link-draw text-muted hover:text-fg">
                  List a role
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
                <a href="https://islamicreliefcanada.org" target="_blank" rel="noopener" className="link-draw text-muted hover:text-fg">
                  Islamic Relief Canada
                </a>
              </li>
              <li>
                <a href="https://humanappeal.org.uk" target="_blank" rel="noopener" className="link-draw text-muted hover:text-fg">
                  Human Appeal
                </a>
              </li>
              <li>
                <a href="https://muslimhands.org.uk" target="_blank" rel="noopener" className="link-draw text-muted hover:text-fg">
                  Muslim Hands
                </a>
              </li>
            </ul>
            <p className="mt-4 max-w-[30ch] text-[12.5px] leading-relaxed text-faint">
              Listings belong to the organisations that posted them. Apply links always go to the employer.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[12.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Amanah Jobs. An independent index, not a recruiter.</p>
          <p>Work that serves the ummah.</p>
        </div>
      </div>
    </footer>
  )
}
