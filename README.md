# Mine Lærespil (Rolige Lærespil)

Rolig, reklamefri læringsapp (PWA) til en dreng på 5-7 år — klokken, bogstaver og tal,
uden reklamer, pop-ups, blink eller sporing. Bygget med Vite + TypeScript.

## Tech stack
| Lag | Valg |
|-----|------|
| Build | Vite |
| Sprog | TypeScript (vanilla, ingen UI-framework) |
| Test | Vitest + jsdom |
| PWA | vite-plugin-pwa |
| Styling | Ren CSS med design-tokens |

## Quick start
```bash
npm install
npm run dev        # udvikling
npm test           # kør alle tests
npm run build      # produktion (dist/)
npm run preview    # kør produktions-build lokalt
```

## Funktioner (v1)
- Forside med tre aktiviteter (Klokken aktiv; Bogstaver/Tal kommer i v2/v3)
- Klokken: "Se klokken" og "Stil klokken", dansk progression (hele → halve → kvarter → 5-min)
- Bogstaver: "Stav ordet" — byg korte ord ud fra en tegning (niveauer med stigende sværhed)
- Rolig dansk stemme + bløde toner (kan slås fra)
- Rolig gamification: niveauer, trofæer, uglens rang, dino-samling
- Forælder-hjørne (tryk-og-hold): lyd, niveau, nulstil
- Virker offline, kan lægges på iPad'ens hjemmeskærm

## Version
v0.1.0 — se [CHANGELOG.md](CHANGELOG.md).
