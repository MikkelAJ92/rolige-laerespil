# Progression & level-op-følelse (Spor A) — Designspecifikation

> **Projekt:** Rolige Lærespil (app-titel "Mine Lærespil")
> **Dato:** 2026-06-10
> **Status:** Design godkendt — klar til implementeringsplan
> **Bygger på:** v1 (klokke), v2 (bogstaver), v0.3.0 (stil B + ugle-udtryk). Tværgående — ingen ny aktivitet.

---

## 1. Formål

Gør gamification meningsfuld og rolig-belønnende: ryd op i fremgangsmodellen, vis tydelig fremgang, fejr level-op med et blidt kort (der bruger den nye glade krone-ugle), og giv barnet en **besøgbar samling**. Stadig ingen reklamer/blink/tidspres.

## 2. Komponenter

### A. Fælles fremgangsmodel (oprydning)
Saml klokke- og bogstav-fremgang i én generisk model i `services/progress.ts`, nøglet pr. aktivitet (`clock`, `words`, klar til `tal`). `services/words-progress.ts` udgår (foldes ind).

**Skema (ny nøgle `rl.progress.v2`):**
```
interface ActivityProgress { level: number; correctByLevel: Record<number, number>; trophies: string[]; collection: string[]; }
interface ProgressState { activities: Record<string, ActivityProgress>; }
```
**Funktioner:** `defaultActivity()`, `load(store?)`, `save(state, store?)`, `getActivity(state, id)`, `recordCorrect(state, id, level, maxLevel)`, samt aggregater `totalTrophies(state)`, `allDinos(state)`, `overallRank(state)`.

**Belønningsregel (uændret):** tærskel 5 rigtige pr. niveau → trofæ (`${id}-lvl${level}-${count}`) + ny dino (`${id}-dino-N`) + level-op hvis `count === 5 && level < maxLevel`. maxLevel gives af kalderen (clock = 4, words = 3).

**Migration (vigtig — ingen tabt fremgang):** ved `load()` uden `rl.progress.v2` importeres eksisterende `rl.progress.v1` (→ `activities.clock`) og `rl.words.v1` (→ `activities.words`), og resultatet gemmes i v2. Findes ingen gamle nøgler, bruges defaults.

### B. Fremgangsbar
I aktivitetens top-bar: en blød bar (fyld = `correctByLevel[level] % 5 / 5`) + "X mere 🏆" til næste trofæ.

### C. Level op-kort
Glider frem ved level-op (overlay på `document.body`): glad krone-ugle, "Niveau X!", rang-navn, ny dino + trofæ, blød tone + uglen siger en kort ros (via `AudioService`). Lukkes med en "Videre"-knap.

### D. Min samling (fra forsiden)
Ny rolig skærm: ugle (rang) + rang-navn, trofæ-hylde (optjente + låste-grå), dino-samling (oplåste + stiplede silhuetter). Åbnes fra et lille "Min samling"-felt på forsiden; en "‹ Hjem"-knap tilbage.

### E. Uglens rang-navne
`domain/ranks.ts`: `rankName(level)` → 1: "Ugle-ven", 2: "Klog ugle", 3: "Vis ugle", 4+: "Mester-ugle". Vist i level-op-kortet og samlingen.

## 3. Adfærd / dataflow

- Aktivitet (clock/words) viser **fremgangsbaren** i top-baren ud fra `getActivity(state, id).correctByLevel[level]`.
- Ved rigtigt svar: `recordCorrect(state, id, level, maxLevel)` → gem. Hvis `leveledUp` (eller nyt trofæ) → vis **level-op-kortet** (med `rankName(nytNiveau)` + glad krone-ugle) og spil rolig lyd; ellers gentegn blidt som nu.
- Forsiden viser samlet trofætal + uglens rang (`overallRank`) og har **"Min samling"**-adgang.

## 4. Teknik / enheder

| Enhed | Ansvar | Status |
|-------|--------|--------|
| `services/progress.ts` | Generisk fremgang pr. aktivitet + aggregater + **migration** | OMSKRIVES |
| `services/words-progress.ts` | — | **SLETTES** (foldes ind) |
| `domain/ranks.ts` | `rankName(level)` (rent) | NY |
| `ui/progress-bar.ts` | `progressBar(current, threshold)` → element | NY |
| `ui/level-up-card.ts` | `showLevelUpCard({ level, rankName, owlSvg, onClose })` overlay | NY |
| `ui/collection.ts` | `renderCollection(container, { onBack })` | NY |
| `activities/clock/clock-activity.ts` | brug generisk API; vis bar; udløs kort | ÆNDRES |
| `activities/words/words-activity.ts` | brug generisk API; vis bar; udløs kort | ÆNDRES |
| `ui/home.ts` | samlings-adgang + aggregater | ÆNDRES |
| `main.ts` | rut til samlingen | ÆNDRES |
| `styles/base.css` | styles til bar, kort-overlay, samling | ÆNDRES (append) |

Genbruger: den nye `owlSvg` (calm/happy + krone), `AudioService`, `core/dom`, `core/router`, design-tokens, `ui/icons` (trofæ/dino). **Domæne (clock/words/time-to-danish), read-mode, set-mode, spell-mode og tegninger røres ikke.**

## 5. Test (Vitest)

- **`progress` (omskrives):** `recordCorrect` (tærskel, level-op kun under maxLevel), aggregater (`totalTrophies`, `overallRank`), **migration** (givet gamle `rl.progress.v1` + `rl.words.v1` i storage giver `load()` korrekt v2-state).
- **`ranks`:** rang-navn-mapping incl. 4+.
- **`progress-bar`:** korrekt fyld-bredde + "X mere".
- **`level-up-card`:** render viser niveau/rang; "Videre" kalder `onClose` og fjerner overlayet.
- **`collection`:** render viser antal trofæer + oplåste/låste dinoer.
- **Uændret:** clock-math, time-to-danish, clock-levels, words, storage, audio, dom, uid, mascot, read-mode, set-mode, spell-mode, pictures. (`words-progress.test.ts` slettes sammen med modulet.)

## 6. Leverance

Branch `feat/progression` → PR → merge → auto-deploy. Version → **v0.4.0**. Derefter: **v3 Tal & tælle**, som genbruger den fælles fremgangsmodel direkte.

## 7. Åbne punkter

- Cykel-tur-fremgangsspor er bevidst udeladt (kan komme senere).
- Rang-navnene kan finjusteres.
