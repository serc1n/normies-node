# Normies NODE

**Normies Canvas**: a live installation for [NODE Foundation](https://nodefoundation.com/program/occupy)'s
OCCUPY program, Exhibition 1 (entrance LED wall + LED cube).

One link runs on all five screens. NODE appends `?surface=` and the page shows something different on each:

| `?surface=` | Screen | Shows |
|---|---|---|
| `entrance-led` | Entrance LED wall · 8,640 × 2,448 | The Normies Canvas editor repainting a Normie, beside the wall of every Normie repainted on-chain |
| `cube-1` | LED cube, side 1 · 1,280 × 1,280 | The **Legendary Canvases**, one at a time with the artist's name |
| `cube-2` | LED cube, side 2 · 1,280 × 1,280 | **Customized Normies** being repainted, pixel by pixel (edits of 12+ pixels) |
| `cube-3` | LED cube, side 3 · 1,280 × 1,280 | **Live**: the canvas a visitor is painting at the entrance wall, as they paint |
| `cube-4` | LED cube, side 4 · 1,280 × 1,280 | **Painted at NODE**: every drawing finished at the wall, newest first |

Without `?surface=` the window's shape decides (wide → wall, square → replay). `&mode=wall|focus|legendary|paint|before|after|mosaic`
forces a layout for testing.

- **Live:** the grids show only customized Normies, from the Normies API, refreshed every minute.
- **In sync:** every screen reads the same clock, so all five show the same Normie at the same moment (12 s each).
- **Any resolution:** everything is laid out from the window size, from 1,280 × 1,280 up to 8,640 × 2,448.
- **Visitors paint at the entrance wall** with a mouse: click the canvas for a blank 40×40 (or **Random Normie**),
  click a pixel to add or remove it, **Done** finishes. The cube shows the painting live (side 3) and keeps
  every finished drawing (side 4).

## Files

- `index.html`: the whole installation (one canvas, no dependencies).
- `api/occupy.js`: `GET /api/occupy`, the customized Normies (before/after art and the changed pixels) and the Legendary Canvases, from `api.normies.art`.
- `api/occupy/live.js`: `GET/POST /api/occupy/live`, the painting in progress and the drawings finished at NODE.
- `lib/store.js`: where that lives: Upstash Redis when the host provides it, otherwise memory.
- `server.mjs`: local preview server.

## Run locally

```bash
npm start   # http://localhost:3002/?surface=entrance-led
```

## Deploy

Import the repo in Vercel (no build step). So the wall and the cube share one state across servers,
add **Storage → Upstash Redis** to the project; Vercel sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
Optional: `NORMIES_INTERNAL_SECRET` (see `.env.example`). No keys are stored in this repository.

CC0, like Normies.
