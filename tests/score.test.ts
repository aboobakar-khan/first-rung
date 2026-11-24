import { describe, expect, test } from 'bun:test'

import { classifyFamily, classifyRegion, jobKey, plainText, scoreFit, stableId } from '../src/lib/score'

describe('scoreFit', () => {
  test('keeps an entry-level engineering role', () => {
    const result = scoreFit({
      title: 'Junior Frontend Developer',
      text: 'Build interfaces with React. No experience required, we train you. 0-2 years.',
      seniority: ['Entry-level'],
      tags: ['engineering'],
    })
    expect(result).not.toBeNull()
    expect(result!.fit).toBeGreaterThanOrEqual(85)
    expect(result!.reasons.length).toBeGreaterThan(0)
  })

  test('drops senior titles even when the feed says entry-level', () => {
    expect(
      scoreFit({
        title: 'Senior Software Engineer',
        text: 'Lead a team of five engineers. 6+ years of experience required.',
        seniority: ['Entry-level'],
        tags: ['engineering'],
      }),
    ).toBeNull()
  })

  test('drops non-tech roles', () => {
    expect(scoreFit({ title: 'Registered Nurse', text: 'Clinical care', seniority: ['Entry-level'] })).toBeNull()
    expect(scoreFit({ title: 'Sales Development Representative', text: 'Outbound sales', seniority: ['Entry-level'] })).toBeNull()
  })

  test('penalises explicit experience requirements in the body', () => {
    const plain = scoreFit({ title: 'Backend Developer', text: 'Python services.', seniority: ['Entry-level'] })
    const demanding = scoreFit({ title: 'Backend Developer', text: 'Python services. 5+ years of production experience.', seniority: ['Entry-level'] })
    expect(plain!.fit).toBeGreaterThan(demanding!.fit)
  })

  test('scores are bounded', () => {
    const result = scoreFit({
      title: 'Junior Graduate Software Engineer Intern',
      text: 'No experience. Bootcamp friendly. Recent graduate. 1+ year. Salary $70k.',
      seniority: ['Entry-level'],
      tags: ['engineering'],
    })
    expect(result!.fit).toBeLessThanOrEqual(98)
    expect(result!.fit).toBeGreaterThanOrEqual(0)
  })
})

describe('helpers', () => {
  test('jobKey ignores company suffixes and seniority words so duplicates collapse', () => {
    expect(jobKey('Acme GmbH', 'Junior Developer (m/f/d)')).toBe(jobKey('Acme', 'Developer'))
  })

  test('classifyRegion reads the first region a country belongs to', () => {
    expect(classifyRegion([])).toBe('worldwide')
    expect(classifyRegion(['United States'])).toBe('americas')
    expect(classifyRegion(['Germany'])).toBe('europe')
    expect(classifyRegion(['India', 'Singapore'])).toBe('asia-pacific')
    expect(classifyRegion(['Kenya'])).toBe('other')
  })

  test('classifyFamily separates QA, data and engineering', () => {
    expect(classifyFamily('QA Engineer', [])).toBe('qa')
    expect(classifyFamily('Data Analyst', [])).toBe('data')
    expect(classifyFamily('Backend Developer', [])).toBe('engineering')
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
    expect(stableId('https://himalayas.app/jobs/1')).toBe(stableId('https://himalayas.app/jobs/1'))
    expect(stableId('https://himalayas.app/jobs/1')).not.toBe(stableId('https://himalayas.app/jobs/2'))
    expect(stableId('x')).toMatch(/^[a-z0-9]+$/)
  })
})
