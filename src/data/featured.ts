/**
 * Paid placements. When a slot is sold, add it here; the board renders it at
 * the top of the results and labels it as sponsored (never disguised as a job).
 */
export type FeaturedSlot = {
  company: string
  title: string
  blurb: string
  url: string
  price: string
  until: string
}

export const featuredSlots: FeaturedSlot[] = []

/** The house ad shown while inventory is unsold. */
export const houseAd = {
  eyebrow: 'Your role here',
  title: 'Put a job in front of people who are actually looking for a first break.',
  blurb: 'Featured placements run at the top of the board and in the weekly digest. $199 for 30 days, listed manually.',
  cta: 'See employer pricing',
  href: '/employers',
}
