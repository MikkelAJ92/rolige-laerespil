# Alfred lærer klokken

Et roligt, reklamefrit klokke-spil (PWA) til børn — læs uret og sæt viserne, med uglen Ugo.
Bygget med Vite + React + TypeScript + Tailwind. Husker fremgang (stjerner, pokaler, niveau) lokalt.

## Tech stack
| Lag | Valg |
|-----|------|
| Build | Vite |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Test | Vitest + jsdom |
| PWA | vite-plugin-pwa (offline + hjemmeskærm) |

## Quick start
```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

## Funktioner
- Klog motor: adaptive opgaver, "Mit ur"-mestringskort og et "lige nu"-ur med den rigtige tid
- To spil: "Hvad er klokken?" (læs uret) og "Sæt viserne" (træk eller ＋/−)
- Niveauer: hele timer → halve → kvarter → fem minutter (vælges frit i menuen)
- Stjerner + pokal for hver 5 stjerner; Ugo med udtryk; konfetti
- Gemmer fremgang lokalt og virker offline

## Version
v0.5.0 — se [CHANGELOG.md](CHANGELOG.md).
