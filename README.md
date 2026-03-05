# Kuntapeli

Finnish municipality guessing game. Identify all 308 municipalities from visual clues — border shapes or coats of arms.

## Game Modes

- **Päivittäinen** (Daily) — Same municipality for everyone, one per day
- **Harjoittelu** (Casual) — Unlimited practice with random municipalities
- **Ura** (Career) — Complete all 308 municipalities, tracked separately for each clue type

## Clue Types

- **Rajat** (Shapes) — Identify municipalities from their border outlines
- **Vaakunat** (Coats of arms) — Identify municipalities from their coat of arms
- **Vaakunat Hard** — Hidden mode (long-press Vaakunat card): one guess, no hints

## How It Works

Players see a visual clue and type their guess. Each guess shows distance, direction, and proximity feedback with temperature-colored bars. Three progressive hints are available: region, population category, and nearest neighbors. Six attempts per round (except hard mode: one attempt).

Career mode includes a **Finland map** view with region zoom and a **coat collection** with sorting by region, date, or number of tries.

## Development

```sh
npm install
npm run dev
```

### Data Scripts

```sh
npm run fetch-geodata   # Fetch municipality boundaries → public/shapes/
npm run fetch-coats     # Fetch coat of arms PNGs → public/coats/
```

### Build

```sh
npm run build   # TypeScript check + Vite production build
```

## PWA

Installable as a standalone app ("add to home screen"). Works offline after first visit. Uses a prompt-to-update strategy — a banner appears when a new version is available.

## Tech

React 19 + TypeScript 5.9 + Vite 7. No router or state library — React state with localStorage persistence. PWA via vite-plugin-pwa.

## Data Sources

- Municipality boundaries: [Finnish Statistics Center WFS API](https://geo.stat.fi/)
- Coats of arms: [Wikimedia Commons](https://commons.wikimedia.org/) via [Suomen kunnanvaakunat](https://fi.wikipedia.org/wiki/Suomen_kunnanvaakunat)
