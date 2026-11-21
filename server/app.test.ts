import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app'

const FEED = 'https://canvas.school.edu/feeds/calendars/user_abc.ics'
const ICS = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n'
const publicDns = async () => ['151.101.1.1']

function call(app: ReturnType<typeof createApp>, url: string) {
  return app.request(`/api/feed?url=${encodeURIComponent(url)}`)
}

describe('GET /api/feed', () => {
  it('returns the calendar text for a valid feed', async () => {
    const fetch = vi.fn(async () => new Response(ICS, { status: 200 }))
    const res = await call(createApp({ fetch, resolve: publicDns }), FEED)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/calendar')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.text()).toBe(ICS)
  })

  it('rejects URLs that are not Canvas calendar feeds without fetching', async () => {
    const fetch = vi.fn()
    const res = await call(createApp({ fetch, resolve: publicDns }), 'https://example.com/')
    expect(res.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects hosts that resolve to private addresses', async () => {
    const fetch = vi.fn()
    const app = createApp({ fetch, resolve: async () => ['10.0.0.5'] })
    expect((await call(app, FEED)).status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 502 when the response is not a calendar', async () => {
    const fetch = vi.fn(async () => new Response('<html>Log in</html>', { status: 200 }))
    expect((await call(createApp({ fetch, resolve: publicDns }), FEED)).status).toBe(502)
  })

  it('returns 502 when Canvas answers with an error', async () => {
    const fetch = vi.fn(async () => new Response('nope', { status: 404 }))
    expect((await call(createApp({ fetch, resolve: publicDns }), FEED)).status).toBe(502)
  })

  it('returns 502 when the body is larger than the cap', async () => {
    const big = ICS + 'X'.repeat(200)
    const fetch = vi.fn(async () => new Response(big, { status: 200 }))
    const app = createApp({ fetch, resolve: publicDns, maxBytes: 100 })
    expect((await call(app, FEED)).status).toBe(502)
  })

  it('follows a redirect only if the new URL passes the same checks', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } }))
    expect((await call(createApp({ fetch, resolve: publicDns }), FEED)).status).toBe(502)

    const ok = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: 'https://new.instructure.com/feeds/calendars/user_abc.ics' } }),
      )
      .mockResolvedValueOnce(new Response(ICS, { status: 200 }))
    expect((await call(createApp({ fetch: ok, resolve: publicDns }), FEED)).status).toBe(200)
  })

  it('returns 504 when Canvas is too slow', async () => {
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        }),
    )
    const app = createApp({ fetch: fetch as typeof globalThis.fetch, resolve: publicDns, timeoutMs: 20 })
    expect((await call(app, FEED)).status).toBe(504)
  })

  it('never logs the feed URL', async () => {
    const log = vi.fn()
    const fetch = vi.fn(async () => new Response(ICS, { status: 200 }))
    await call(createApp({ fetch, resolve: publicDns, log }), FEED)
    expect(log).toHaveBeenCalled()
    expect(JSON.stringify(log.mock.calls)).not.toContain('user_abc')
  })
})
