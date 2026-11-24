import { expect, test } from 'bun:test'
import app from '../src/worker/index'

const dataset = { generatedAt: new Date().toISOString(), counts: { jobs: 1, companies: 1, countries: 0, salaryShown: 0 }, sources: [], jobs: [] }

function assets(handler?: () => Response) {
  return {
    ASSETS: {
      fetch: async () => handler?.() ?? new Response(JSON.stringify(dataset), { headers: { 'content-type': 'application/json' } }),
    } as unknown as Fetcher,
  }
}

test('health check answers JSON', async () => {
  const response = await app.request('https://example.test/api/health')
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ ok: true })
})

test('the jobs API returns the dataset with CORS and caching', async () => {
  const response = await app.request('https://example.test/api/jobs', {}, assets())
  expect(response.status).toBe(200)
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
  expect(response.headers.get('cache-control')).toContain('max-age')
  expect((await response.json()).counts.jobs).toBe(1)
})

test('a missing index is a JSON 503 rather than an HTML error page', async () => {
  const response = await app.request('https://example.test/api/jobs', {}, assets(() => new Response('nope', { status: 404 })))
  expect(response.status).toBe(503)
  expect((await response.json()).error).toBeString()
})

test('unknown API routes never fall through to the app shell', async () => {
  const response = await app.request('https://example.test/api/missing')
  expect(response.status).toBe(404)
  expect((await response.json()).error).toBeString()
})
