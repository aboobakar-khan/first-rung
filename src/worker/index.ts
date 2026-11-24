import { Hono } from 'hono'

type Env = { ASSETS: Fetcher }

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true }))

/**
 * The public dataset. Same bytes as /jobs.json, with CORS and a short cache so
 * other tools can use the index without scraping the HTML.
 */
app.get('/api/jobs', async (c) => {
  const asset = await c.env.ASSETS.fetch(new Request(new URL('/jobs.json', c.req.url)))
  if (!asset.ok) return c.json({ error: 'The job index is unavailable.' }, 503)

  return c.body(await asset.text(), 200, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=600',
  })
})

app.all('/api/*', (c) => c.json({ error: 'Not found.' }, 404))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
