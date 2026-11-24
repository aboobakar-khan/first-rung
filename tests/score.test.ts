import { describe, expect, test } from 'bun:test'

import { classifyFamily, classifyRegion, countryOf, jobKey, plainText, stableId } from '../src/lib/score'

describe('classifyFamily', () => {
  test('recognises religious roles', () => {
    expect(classifyFamily('Full-Time Imam')).toBe('islamic-studies')
    expect(classifyFamily('Quran Teacher (Part-Time)')).toBe('islamic-studies')
  })

  test('separates education, fundraising and programmes', () => {
    expect(classifyFamily('Head of Maths')).toBe('education')
    expect(classifyFamily('Community Fundraiser')).toBe('fundraising')
    expect(classifyFamily('Programmes Officer')).toBe('programmes')
  })

  test('separates finance, comms, operations, IT and health', () => {
    expect(classifyFamily('Finance Assistant')).toBe('finance')
    expect(classifyFamily('Social Media Manager')).toBe('comms')
    expect(classifyFamily('HR Coordinator')).toBe('operations')
    expect(classifyFamily('Backend Engineer')).toBe('it')
    expect(classifyFamily('Registered Nurse')).toBe('health')
    expect(classifyFamily('Logistics Assistant')).toBe('operations')
  })

  test('falls back to other', () => {
    expect(classifyFamily('General Assistant')).toBe('other')
  })
})

describe('classifyRegion', () => {
  test('reads the country before the city', () => {
    expect(classifyRegion('Cambridge, Ontario')).toBe('north-america')
    expect(classifyRegion('Cambridge, UK')).toBe('uk')
    expect(classifyRegion('Manchester, United Kingdom')).toBe('uk')
    expect(classifyRegion('Toronto, Canada')).toBe('north-america')
  })

  test('handles other regions', () => {
    expect(classifyRegion('Dubai, United Arab Emirates')).toBe('middle-east')
    expect(classifyRegion('Nairobi, Kenya')).toBe('africa')
    expect(classifyRegion('Lahore, Pakistan')).toBe('asia-pacific')
    expect(classifyRegion('Berlin, Germany')).toBe('europe')
  })

  test('is honest when it cannot tell', () => {
    expect(classifyRegion('')).toBe('worldwide')
    expect(classifyRegion('Multiple locations')).toBe('other')
  })
})

describe('countryOf', () => {
  test('extracts a country for the dataset counts', () => {
    expect(countryOf('Manchester, United Kingdom')).toBe('United Kingdom')
    expect(countryOf('Burlington, ON, Canada')).toBe('Canada')
    expect(countryOf('Remote')).toBeNull()
  })
})

describe('helpers', () => {
  test('jobKey ignores organisation suffixes so duplicates collapse', () => {
    expect(jobKey('Human Appeal', 'Fundraiser')).toBe(jobKey('Human Appeal Ltd', 'Fundraiser'))
  })

  test('plainText strips markup, entities and keeps a clean cut', () => {
    const text = plainText('<p>Hello&nbsp;<b>world</b></p><script>bad()</script><p>Second line.</p>')
    expect(text).not.toContain('<')
    expect(text).not.toContain('bad()')
    expect(text).toContain('Hello world')
    expect(text).toContain('Second line.')
    expect(plainText('x'.repeat(5000)).length).toBeLessThanOrEqual(2601)
  })

  test('stableId is deterministic and url-safe', () => {
    expect(stableId('https://humanappeal.bamboohr.com/careers/40')).toBe(stableId('https://humanappeal.bamboohr.com/careers/40'))
    expect(stableId('https://humanappeal.bamboohr.com/careers/40')).not.toBe(stableId('https://humanappeal.bamboohr.com/careers/41'))
    expect(stableId('x')).toMatch(/^[a-z0-9]+$/)
  })
})
