# Kuntapeli

Finnish municipality guessing game. Identify all 308 municipalities from visual clues — border shapes or coats of arms.

## Game Modes

- **Päivittäinen** (Daily) — Same municipality for everyone, one per day
- **Harjoittelu** (Casual) — Unlimited practice with random municipalities
- **Ura** (Career) — Complete all 308 municipalities, tracked separately for each clue type

## How It Works

Players see a visual clue (municipality border outline or coat of arms) and type their guess. Each guess shows distance, direction, and proximity feedback. Three progressive hints are available: region, population category, and nearest neighbors. Six attempts per round.

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

## Tech

React 19 + TypeScript + Vite. No router or state library — React state with localStorage persistence.

## Data Sources

- Municipality boundaries: [Finnish Statistics Center WFS API](https://geo.stat.fi/)
- Coats of arms: [Wikimedia Commons](https://commons.wikimedia.org/) via [Suomen kunnanvaakunat](https://fi.wikipedia.org/wiki/Suomen_kunnanvaakunat)
