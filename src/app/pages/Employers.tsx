import { ArrowUpRight, Check, Mail } from 'lucide-react'
import { Link } from 'react-router'

import { useDataset } from '../../lib/jobs'

const MAIL = 'khhnabubakar786@gmail.com'

const plans = [
  {
    name: 'Featured listing',
    price: '$199',
    unit: 'per role, 30 days',
    points: [
      'Pinned above the results on the board',
      'Included in one Monday email',
      'Labelled clearly as sponsored',
      'We check the role is genuinely entry-level',
    ],
    cta: 'Reserve a slot',
    highlight: true,
  },
  {
    name: 'Launch bundle',
    price: '$499',
    unit: 'three roles, 30 days',
    points: ['Three featured roles', 'Digest mention each week for a month', 'Same fit check on every role'],
    cta: 'Ask about the bundle',
  },
  {
    name: 'Digest sponsor',
    price: '$99',
    unit: 'per issue',
    points: ['One line at the top of the Monday email', 'No job listing needed', 'Runs once the list passes 1,000 readers'],
    cta: 'Get in line',
  },
]

const checks = [
  'The role is remote or hybrid, and open to people at the start of their career.',
  'The title is not senior, staff, lead or principal.',
  'The listing does not require more than roughly two years of experience.',
  'The application link works and goes to the employer or their ATS.',
  'We will turn down roles that fail these checks, and refund if we already took payment.',
]

export function Employers() {
  const { data } = useDataset()

  return (
    <div className="mx-auto max-w-[1160px] px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-[12px] tracking-[0.16em] text-muted uppercase">For employers</p>
      <h1 className="font-display mt-5 max-w-[20ch] text-[clamp(38px,6vw,72px)] text-balance">
        Hire someone on their <span className="text-accent">first rung</span>.
      </h1>
      <p className="mt-6 max-w-[58ch] text-[15.5px] leading-relaxed text-muted text-pretty">
        First Rung is a small board for entry-level remote tech roles. The people reading it are looking for exactly one
        thing: a role that will take them without five years of experience first.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
        {[
          { label: 'Live roles indexed', value: data ? data.counts.jobs : '—' },
          { label: 'Companies', value: data ? data.counts.companies : '—' },
          { label: 'Rebuilt', value: 'Daily' },
          { label: 'Reader cost', value: 'Free' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface p-4">
            <p className="text-[11.5px] tracking-[0.1em] text-faint uppercase">{stat.label}</p>
            <p className="mt-1.5 text-[18px] tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 max-w-[70ch] text-[12.5px] leading-relaxed text-faint">
        Straight answer on traffic: the board is new, so these are inventory numbers, not audience numbers. Pricing below
        reflects that — it is founding pricing for the first handful of employers, and slots are sold by hand until the
        list is big enough to justify more.
      </p>

      <section className="mt-14">
        <h2 className="text-[11.5px] tracking-[0.16em] text-faint uppercase">Placements</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-card border p-6 ${plan.highlight ? 'border-fg bg-fg text-bg' : 'border-line bg-surface'}`}
            >
              <p className={`text-[12px] tracking-[0.12em] uppercase ${plan.highlight ? 'text-bg/55' : 'text-faint'}`}>{plan.name}</p>
              <p className="font-display mt-3 text-[42px] leading-none">{plan.price}</p>
              <p className={`mt-1.5 text-[12.5px] ${plan.highlight ? 'text-bg/60' : 'text-muted'}`}>{plan.unit}</p>
              <ul className={`mt-5 flex-1 space-y-2.5 text-[13px] leading-snug ${plan.highlight ? 'text-bg/80' : 'text-muted'}`}>
                {plan.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <Check className={`mt-0.5 size-3.5 shrink-0 ${plan.highlight ? 'text-bg' : 'text-accent'}`} />
                    {point}
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:${MAIL}?subject=${encodeURIComponent(`First Rung — ${plan.name}`)}&body=${encodeURIComponent('Role title:\nCompany:\nLink:\nLocation:\nSalary range:\n\nAnything else:')}`}
                className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full text-[13.5px] font-medium transition-colors ${
                  plan.highlight ? 'bg-bg text-fg hover:bg-white' : 'border border-fg text-fg hover:bg-fg hover:text-bg'
                }`}
              >
                {plan.cta}
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-10 border-t border-line pt-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <h2 className="font-display text-[clamp(26px,3vw,34px)]">What we check before a role goes up</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            The whole value of this board is that a reader can trust the filter. A paid placement skips the queue, not the
            checks.
          </p>
          <ul className="mt-6 space-y-3">
            {checks.map((check) => (
              <li key={check} className="flex gap-3 text-[13.5px] leading-relaxed text-[#2f2c27]">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {check}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-card border border-line bg-surface p-7">
          <h2 className="font-display text-[26px]">How it works in practice</h2>
          <ol className="mt-4 space-y-4 text-[13.5px] leading-relaxed text-muted">
            <li>
              <span className="font-medium text-fg">1. You email the role.</span> Title, company, link, location, salary
              range.
            </li>
            <li>
              <span className="font-medium text-fg">2. We check it by hand.</span> Usually within one working day. If it is
              not entry-level, we say so.
            </li>
            <li>
              <span className="font-medium text-fg">3. You pay by invoice.</span> No card checkout yet — this is deliberate
              while volume is low.
            </li>
            <li>
              <span className="font-medium text-fg">4. It goes live for 30 days.</span> You get a note when it is up, and
              the option to swap the role once.
            </li>
          </ol>
          <a
            href={`mailto:${MAIL}?subject=${encodeURIComponent('First Rung — role enquiry')}&body=${encodeURIComponent('Role title:\nCompany:\nLink:\nLocation:\nSalary range:\n\nAnything else:')}`}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-fg text-[13.5px] font-medium text-bg hover:bg-[#2b2925]"
          >
            <Mail className="size-4" /> {MAIL}
          </a>
          <p className="mt-3 text-center text-[11.5px] text-faint">Replace this address with your own before launch.</p>
        </div>
      </section>

      <section className="mt-16 border-t border-line pt-8">
        <h2 className="text-[11.5px] tracking-[0.16em] text-faint uppercase">Fair questions</h2>
        <dl className="mt-5 grid gap-8 sm:grid-cols-2">
          {[
            {
              q: 'Will readers know it is paid?',
              a: 'Yes. Every placement is labelled as sponsored and never mixed into the ranked results as if it were earned.',
            },
            {
              q: 'Can I post a mid-level role?',
              a: 'Not as a listing. The board only shows roles that are realistically open to people at the start of their career.',
            },
            {
              q: 'Do you guarantee applicants?',
              a: 'No, and anyone who does is selling you something else. You get placement and a targeted audience.',
            },
            {
              q: 'What if I need to change the role?',
              a: 'One swap is included in a 30-day placement. Email the new details and we will update it.',
            },
          ].map((item) => (
            <div key={item.q}>
              <dt className="text-[14px] font-medium">{item.q}</dt>
              <dd className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-14 text-[13px] text-muted">
        Looking for a role instead?{' '}
        <Link to="/" className="link-draw font-medium text-fg">
          The board is free and always will be.
        </Link>
      </p>
    </div>
  )
}
