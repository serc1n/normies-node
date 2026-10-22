# Normies NODE

**Normies Canvas**: a live installation for [NODE Foundation](https://nodefoundation.com/program/occupy)'s
OCCUPY program, Exhibition 1 (entrance LED wall + LED cube).

One link runs on all five screens. NODE appends `?surface=` and the page shows something different on each:

| `?surface=` | Screen | Shows |
|---|---|---|
| `entrance-led` | Entrance LED wall · 8,640 × 2,448 | The Normies Canvas editor repainting a Normie, beside the wall of every Normie repainted on-chain |
| `cube-1` | LED cube, side 1 · 1,280 × 1,280 | The **Legendary Canvases**, one at a time with the artist's name |
| `cube-2` | LED cube, side 2 · 1,280 × 1,280 | **Customized Normies** being repainted, pixel by pixel (edits of 12+ pixels) |
| `cube-3` | LED cube, side 3 · 1,280 × 1,280 | **Live painting**: an open canvas for visitors |
| `cube-4` | LED cube, side 4 · 1,280 × 1,280 | **Live painting**: a second open canvas |

Without `?surface=` the window's shape decides (wide → wall, square → replay). `&mode=wall|focus|legendary|paint|before|after|mosaic`
forces a layout for testing.

- **Live:** the grids show only customized Normies, from the Normies API, refreshed every minute.
- **In sync:** every screen reads the same clock, so all five show the same Normie at the same moment (12 s each).
- **Any resolution:** everything is laid out from the window size, from 1,280 × 1,280 up to 8,640 × 2,448.
- **Visitors can paint** with a mouse or touch: click the canvas for a blank 40×40 (or **Random Normie**),
  click a pixel to add or remove it, **Done** replays their drawing on that screen. Nothing they draw is stored.

## Files

- `index.html`: the whole installation (one canvas, no dependencies).
- `api/occupy.js`: `GET /api/occupy`, the customized Normies (before/after art and the changed pixels) and the Legendary Canvases, from `api.normies.art`.
- `server.mjs`: local preview server.

## Run locally

```bash
npm start   # http://localhost:3002/?surface=entrance-led
```

## Deploy

Import the repo in Vercel (no build step). Optional environment variable: `NORMIES_INTERNAL_SECRET`
(see `.env.example`). No keys are stored in this repository.

CC0, like Normies.
