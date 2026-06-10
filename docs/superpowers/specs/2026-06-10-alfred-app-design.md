# Alfred lærer klokken — adoptér React-appen som den deployede app

> **Projekt:** Rolige Lærespil → "Alfred lærer klokken"
> **Dato:** 2026-06-10
> **Status:** Design godkendt — klar til implementeringsplan
> **Beslutning:** Den eksisterende vanilla-PWA i `rolige-laerespil` erstattes af brugerens medbragte React-klokkespil (som hans dreng elsker), nu med **gemt fremgang** + offline. Samme repo og URL, så iPad-ikonet opdaterer automatisk.

---

## 1. Formål

Brugeren har en færdig, poleret React-version af klokkespillet ("Alfred lærer klokken" med uglen Ugo, to spil, niveauer, stjerner, pokaler, konfetti, træk-i-viser). Drengen elsker den, men er ked af, at den **ikke husker fremgang** (stjerner/pokaler/niveau nulstilles ved genstart). Vi gør den til den rigtige, deployede app: tilføjer **persistens**, gør den **offline/installerbar**, rydder koden op til moduler + TypeScript, og udskifter den nuværende vanilla-app i `src/`.

## 2. Bevar adfærd verbatim

Spillets **udseende og spil-logik bevares præcis** som i den medbragte kode — drengen må ikke mærke forskel (ud over at fremgang nu huskes). Det inkluderer den danske klokke-tekst nøjagtigt som givet (fx hele timer = "klokken tre", `:25` = "fem minutter i halv fire", `:20` = "tyve minutter over", `:40` = "tyve minutter i"), Ugo's udtryk, konfetti, pokal-ved-5-stjerner, og træk/＋−-betjening i "Sæt viserne".

## 3. Stak-skift

`rolige-laerespil` bliver en **Vite + React 18 + TypeScript + Tailwind CSS** PWA (i tråd med NIRAS-standarderne). Beholdes: `vite-plugin-pwa`, `@vite-pwa/assets-generator`, Vitest + jsdom, GitHub Pages-deploy-workflow, `VITE_BASE`-mekanik.

**Den nuværende vanilla-app erstattes** (klokke/bogstaver/progression/samling under `src/`). Den bevares i git-historikken; Bogstaver-aktiviteten og den fælles progression/samling kan **portes ind i React-appen senere** (noteret som fremtidigt arbejde, ikke i scope nu).

## 4. Kode-opdeling (i stedet for én ~600-linjers fil)

| Fil | Ansvar |
|-----|--------|
| `src/domain/time.ts` | `HOUR_NAMES`, `hourName`, `nextHourName`, `LEVELS`, `danishTime`, `randomTime`, `makeOptions`, `snapMinute`, `cap`, `digital`, `tKey`, `shuffle`, `randInt`, `rand`, `polar` — ren logik |
| `src/lib/colors.ts` | `shade(hex, amt)` |
| `src/lib/persistence.ts` | `loadProgress()/saveProgress()` mod `localStorage` (ren, injicerbar store) |
| `src/components/Owl.tsx` | Ugo-maskotten (mood-prop) |
| `src/components/Clock.tsx` | Uret (læs + interaktiv træk/snap) |
| `src/components/ui.tsx` | `Btn`, `RoundBtn`, `Pill`, `StarRow`, `Cloud`, `Confetti` |
| `src/App.tsx` | Menu + spil (forbruger persistens) |
| `src/main.tsx` | React-rod, importerer `index.css` + fonte |
| `src/index.css` | Tailwind-import + `@keyframes` (floaty/drift/pop/shakey/fall/softpulse) + skrift-tildeling |

Hver komponent/funktion har ét ansvar og kan forstås/testes for sig. Domæne (`time.ts`, `persistence.ts`, `colors.ts`) er rene og DOM-fri.

## 5. Persistens (kernen i ønsket)

- **Hvad gemmes:** `stars`, `trophies`, `starRow` (fremgang mod næste pokal, 0-4), `level` (timer/halve/kvarter/minutter), `mode` (read/set).
- **Hvad gemmes ikke:** aktuel opgave, valgmuligheder og anden flygtig UI-tilstand. `streak` nulstilles til 0 ved indlæsning (det er en kortvarig "i træk"-fornemmelse).
- **Nøgle:** `alfred.progress.v1`.
- **Hvornår:** indlæses ved appstart (lazy `useState`-initialisering fra `loadProgress()`), gemmes via `useEffect` når en af de gemte værdier ændrer sig.
- **Robusthed:** `loadProgress()` fanger ugyldig JSON og validerer felter (ukendt `level` → "timer", `mode` ∈ {read,set}, tal ≥ 0) og falder tilbage til standard. Aldrig kast.
- Appen **starter forfra** (ny nøgle), men husker fra første spil og frem — også pokaler.

## 6. Offline, ikon og fonte

- **PWA** beholdes: `registerType: 'autoUpdate'` (iPad henter selv nye versioner), `base` via `VITE_BASE=/rolige-laerespil/` i CI. Manifest opdateres: navn "Alfred lærer klokken", kort navn "Klokken", `theme_color`/`background_color` i appens varme palet.
- **Ikon:** ny `public/logo.svg` med Ugo (genbrug owl-formen), PNG'er via `@vite-pwa/assets-generator`.
- **Fonte:** Fredoka + Nunito **self-hostes** via `@fontsource/fredoka` + `@fontsource/nunito` (importeres i `main.tsx`), så spillet ser rigtigt ud offline (i stedet for Google Fonts `@import`, der kræver net).

## 7. Test (Vitest + jsdom)

- **`domain/time`:** `danishTime` for nøgletider (0, 5, 15, 20, 25, 30, 35, 40, 45, 55) — eksakt de strenge appen giver; `snapMinute` (nærmeste tilladte minut pr. niveau, inkl. wrap 55→0); `makeOptions` (4 unikke, inkl. svaret); `randomTime` (minut ∈ niveauets sæt, time 1-12).
- **`lib/persistence`:** gem→indlæs roundtrip; manglende nøgle → standard; ugyldig JSON → standard; ukendt `level`/`mode` → valideret fallback.
- (React-komponenttest er ikke i scope for v1; den rene logik + persistens dækker risikoen.)

## 8. Leverance

Branch `feat/alfred-app` → erstat `src/` + opdatér `index.html`, `package.json`, `vite.config.ts`, `pwa-assets.config.ts`, `public/logo.svg` → PR → merge → **auto-deploy til samme URL**. Version → **v0.5.0**. iPad-ikonet beholder sit nuværende navn, men indlæser den nye app automatisk.

## 9. Uden for scope (YAGNI)

- Bogstaver-aktivitet, samling-skærm og den fælles progressionsmodel fra vanilla-appen (kan portes ind senere; bevaret i git-historik).
- Migrering af gammel vanilla-fremgang til den nye nøgle (modellerne er forskellige; ny app starter rent).
- React-komponent-/E2E-tests.

## 10. Åbne punkter

- Senere: port Bogstaver + samling ind i React-appen, så den igen dækker mere end klokken.
- Evt. lyd (den medbragte kode har ingen lyd; bevares lydløs nu).
