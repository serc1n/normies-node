// GET /api/occupy → { updatedAt, total, items }: every customized Normie, newest edit first, with its
// art before (`base`) and after (`now`) its Canvas edits as hex bitmaps of size × size, plus the
// added/removed pixel indexes. All data comes from the public Normies API (api.normies.art).
//
// Optional: set NORMIES_INTERNAL_SECRET in the host's environment to skip the API's per-IP rate
// limit. It is read from the environment only and never stored in this repository.

const API = (process.env.NORMIES_API_URL || 'https://api.normies.art').replace(/\/$/, '')
const MAX_ITEMS = 400
const PAGE = 100
const MAX_PAGES = 30
const TTL = 60_000 // rebuild at most once a minute per warm instance

const headers = () => (process.env.NORMIES_INTERNAL_SECRET ? { 'x-internal-secret': process.env.NORMIES_INTERNAL_SECRET } : {})

async function json(path) {
  try {
    const res = await fetch(`${API}${path}`, { headers: headers() })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}
async function text(path) {
  try {
    const res = await fetch(`${API}${path}`, { headers: headers() })
    return res.ok ? (await res.text()).trim() : null
  } catch {
    return null
  }
}

/** A 0/1 string as hex, four pixels per character. */
function toHex(bits) {
  let out = ''
  for (let i = 0; i < bits.length; i += 4) out += parseInt(bits.slice(i, i + 4).padEnd(4, '0'), 2).toString(16)
  return out
}

async function pool(items, size, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  }))
  return out
}

// art per token, keyed by its latest edit: a Normie not edited again is never fetched twice
const art = new Map()
let cached = null

// The curated Legendary Canvases, one entry per artwork: neighbouring canvases by the same artist are
// one piece (Coldie's is two canvases side by side). Each canvas's current art, as hex.
async function legendaryArt() {
  const data = await json('/rarity/legendary')
  const rows = (data?.current ?? []).filter((r) => Number.isInteger(Number(r?.id)))
  const works = []
  for (const r of rows) {
    const artist = String(r.artist ?? '').trim() || `Normie #${r.id}`
    const last = works[works.length - 1]
    if (last && last.artist === artist) last.ids.push(Number(r.id))
    else works.push({ artist, ids: [Number(r.id)] })
  }
  const out = await pool(works, 6, async (w) => {
    const bits = await Promise.all(w.ids.map((id) => text(`/normie/${id}/pixels`)))
    if (bits.some((b) => !b || b.length !== 1600)) return null
    return { artist: w.artist, ids: w.ids, size: 40, art: bits.map(toHex) }
  })
  return out.filter(Boolean)
}

async function build() {
  const latest = new Map()
  for (let p = 0; p < MAX_PAGES; p++) {
    const data = await json(`/history/customized?limit=${PAGE}&offset=${p * PAGE}`)
    const events = data?.events ?? []
    for (const e of events) if (!latest.has(e.tokenId)) latest.set(e.tokenId, e)
    if (!data?.hasMore || events.length === 0 || latest.size >= MAX_ITEMS) break
  }
  const events = [...latest.values()].slice(0, MAX_ITEMS)

  const items = (await pool(events, 12, async (e) => {
    const id = e.tokenId
    const key = `${id}:${e.txHash ?? e.timestamp}`
    if (art.has(key)) return art.get(key)
    const [now, diff] = await Promise.all([text(`/normie/${id}/pixels`), json(`/normie/${id}/canvas/diff`)])
    if (!now || !/^[01]+$/.test(now)) return null
    const size = Math.round(Math.sqrt(now.length))
    if (size * size !== now.length) return null
    const added = (diff?.added ?? []).map((p) => p.y * size + p.x)
    const removed = (diff?.removed ?? []).map((p) => p.y * size + p.x)
    if (added.length + removed.length === 0) return null
    const base = now.split('')
    for (const i of added) base[i] = '0'
    for (const i of removed) base[i] = '1'
    const item = { id: Number(id), ts: Number(e.timestamp), size, base: toHex(base.join('')), now: toHex(now), added, removed }
    art.set(key, item)
    return item
  })).filter(Boolean)

  return { updatedAt: Date.now(), total: items.length, items, legendary: await legendaryArt() }
}

export default async function handler(req, res) {
  try {
    if (!cached || Date.now() - cached.updatedAt > TTL) cached = await build()
    res.setHeader('cache-control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=600')
    res.setHeader('access-control-allow-origin', '*')
    res.status(200).json(cached)
  } catch (err) {
    res.status(502).json({ error: 'Normies API unreachable', updatedAt: Date.now(), total: 0, items: [] })
  }
}
