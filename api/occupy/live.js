// GET/POST /api/occupy/live: the canvas a visitor is painting at the entrance wall (cube side 3)
// and the drawings finished at NODE (cube side 4). See lib/store.js for where it is kept.
import { readState, writeState } from '../../lib/store.js'

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      const r = await writeState(body)
      return res.status(r.ok ? 200 : 400).json(r)
    }
    return res.status(200).json(await readState())
  } catch {
    return res.status(502).json({ live: null, recent: [] })
  }
}
