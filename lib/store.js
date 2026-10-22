// Shared state for the NODE installation: what a visitor is painting right now at the entrance
// wall, and the drawings finished there. Uses Upstash Redis (REST) when the host provides it,
// e.g. Vercel → Storage → Upstash Redis, which sets KV_REST_API_URL / KV_REST_API_TOKEN.
// Without it the state lives in this server's memory: fine for one machine, not shared between
// serverless instances. No credentials are stored in this file.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''
const LIVE = 'occupy:live', RECENT = 'occupy:recent', KEEP = 200, LIVE_TTL = 30

const mem = { live: null, liveAt: 0, recent: [] }

async function redis(...cmd) {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmd),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`redis ${res.status}`)
  return (await res.json()).result
}
const useRedis = () => Boolean(URL_ && TOKEN)

const HEX = /^[0-9a-f]{400}$/ // 40 x 40, four pixels per character
const clean = (s) => (typeof s === 'string' && HEX.test(s) ? s : null)

export async function readState() {
  if (useRedis()) {
    const [live, recent] = await Promise.all([redis('GET', LIVE), redis('LRANGE', RECENT, 0, KEEP - 1)])
    return { live: live ? JSON.parse(live) : null, recent: (recent || []).map((r) => JSON.parse(r)) }
  }
  const live = mem.live && Date.now() - mem.liveAt < LIVE_TTL * 1000 ? mem.live : null
  return { live, recent: mem.recent }
}

/** body: { type: 'live', bits, start } · { type: 'done', bits, start } · { type: 'idle' } */
export async function writeState(body) {
  const type = body?.type
  if (type === 'idle') {
    if (useRedis()) await redis('DEL', LIVE)
    else mem.live = null
    return { ok: true }
  }
  const bits = clean(body?.bits), start = clean(body?.start) || '0'.repeat(400)
  if (!bits) return { ok: false, error: 'bad drawing' }
  const entry = { bits, start, ts: Date.now() }
  if (type === 'live') {
    if (useRedis()) await redis('SET', LIVE, JSON.stringify(entry), 'EX', LIVE_TTL)
    else { mem.live = entry; mem.liveAt = Date.now() }
    return { ok: true }
  }
  if (type === 'done') {
    if (bits === start) return { ok: false, error: 'unchanged' }
    if (useRedis()) {
      await redis('LPUSH', RECENT, JSON.stringify(entry))
      await redis('LTRIM', RECENT, 0, KEEP - 1)
      await redis('DEL', LIVE)
    } else {
      mem.recent = [entry, ...mem.recent].slice(0, KEEP)
      mem.live = null
    }
    return { ok: true }
  }
  return { ok: false, error: 'unknown type' }
}
