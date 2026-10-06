# TAS Group: Concept Website

A concept redesign for TAS Group (Butterworth, Penang, est. 1978), built in plain HTML, CSS and JavaScript. There's no framework and no build step.

- `index.html`: the site
- `wireframes.html`: page flow, user journeys, desktop and mobile wireframes
- `RATIONALE.md`: brand strategy, UX and motion reasoning, client pitch value

## Run locally

Any static server works:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy (free)

**Netlify:** drag the whole `tas-group` folder onto https://app.netlify.com/drop.

**GitHub Pages:** push this folder to a repo, then go to Settings → Pages → Deploy from branch → `main` / root.

**Vercel:** `npx vercel` in this folder, and accept the defaults.

## Structure

```
index.html            page markup and inline SVG illustrations
wireframes.html       wireframes deliverable
css/style.css         design tokens, themes, all component styles
data/ports.js         ports, lanes, transit times, tariff model (illustrative)
js/map.js             projection, hero map, interactive network map
js/main.js            nav, theme, reveals, counters, ticker, voyage HUD, containers, timeline, enquiry dialog
js/explorer.js        Ocean / Air / Land explorer
js/vessel.js          scroll-driven port-call story
js/calculator.js      four-step quote calculator
assets/world-dots.svg dotted world map (generated from Natural Earth 110m land)
assets/sea-dots.svg   finer SE Asia coastline for the land view (Natural Earth 50m)
```

## Editing content

- **Ports and lanes:** edit `TAS.ports` in `data/ports.js`. Each mode (`ocean`, `air`, `land`) is optional. `via` is a list of `[lat, lon]` waypoints the lane passes through.
- **Rates:** edit `TAS.rates` in the same file.
- **Copy:** edit it directly in `index.html`.

Rates, transit times and milestone descriptions are illustrative. See the last section of `RATIONALE.md`.

Map data: [Natural Earth](https://www.naturalearthdata.com/) (public domain).
