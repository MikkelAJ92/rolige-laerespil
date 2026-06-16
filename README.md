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
- Fire spil delt om samme stjerne-/pokal-konto:
  - **"Hvad er klokken?"** — læs uret (fire svarmuligheder, adaptiv sværhed)
  - **"Sæt viserne"** — flyt viserne på plads med ＋/−-knapper
  - **"Stav med Dino"** — find bogstaverne dinoen har gemt, 1.-klasses ord med oplæsning
  - **"Alfred knækker koden"** — kodeknækker (Mastermind): læs ledetrådene, krydse tal af og tast den rigtige firecifrede kode; rolige scener, fire sværhedsgrader
- Klog motor: adaptive opgaver, "Mit ur"-mestringskort og et "lige nu"-ur med den rigtige tid
- Niveauer: hele timer → halve → kvarter → fem minutter (klokke); nem → ekspert (kode)
- Stjerner + pokal for hver 5 stjerner; Ugo med udtryk; konfetti
- Ugos stemme: blid dansk oplæsning og bløde toner (kan slås fra)
- Gemmer fremgang lokalt og virker offline
- Døgnhimmel der følger den rigtige tid, og en ugle man kan røre ved
- Hjælp-på-tryk: rør ved uret og få blid, trinvis visestøtte

## Version
v0.11.0 — se [CHANGELOG.md](CHANGELOG.md).
