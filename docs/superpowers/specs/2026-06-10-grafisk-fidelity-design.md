# Grafisk fidelity (stil B) — Designspecifikation

> **Projekt:** Rolige Lærespil (app-titel "Mine Lærespil")
> **Dato:** 2026-06-10
> **Status:** Design godkendt — klar til implementeringsplan
> **Bygger på:** v1 (klokke) + v2 (bogstaver). Tværgående visuelt løft — ingen ny aktivitet.

---

## 1. Formål

Løft alle appens illustrationer fra simple skitser til en blød, skygget **"stil B"** (flade former + bløde gradienter + blid skygge), giv uglen en lille **udtryks-API**, og tilføj en diskret **fade-in** på skærme. **Ingen ændring i logik** (klokke-matematik, stavning, fremgang) — kun udseende.

## 2. Stil B (det valgte udtryk)

Flade former i den eksisterende dæmpede pastel-palet (genbrug af design-tokens), tilført:
- bløde lineær-/radial-gradienter for let volumen,
- en blid `feDropShadow` for dybde/varme.

Rolig billedbogs-følelse — ingen skarpe kontraster, ingen blink. Understøttet i iPad-Safari.

## 3. Scope

**Løftes til stil B:**
- **Uglen** (`mascot`) + udtryk `rolig`/`glad` + krone ved rang.
- **Uret** (urskive, visere, tal) — kun udseende; viserne styres stadig 100 % af den eksisterende vinkel-matematik.
- **Ikoner:** dino, cykel, trofæ.
- **Ord-tegninger:** alle ni (sol, kat, hus, træ, bål, øje, bold, fisk, banan).
- **Diskret fade-in** på skærme (ren CSS).

**Uden for scope (YAGNI):** animationer ud over fade-in; wiring af uglens reaktion/level-op-fejring (det er **Spor A** — progression & level-op-følelse); helt nye motiver.

## 4. Ugle-udtryks-API (adfærds-afgrænsning)

`owlSvg(rank = 1, size = 64, expression: 'calm' | 'happy' = 'calm'): string`

- **Bagudkompatibel:** eksisterende kald (`owlSvg(1, 56)`, `owlSvg(rank, 44)`) virker uændret og giver den rolige ugle.
- **Krone** når `rank >= 2`, markeret med et stabilt `data-part="crown"` (robust for test).
- **`happy`** = smilende øjne (buer) + bløde rosa kinder.
- **Adfærd uændret i Spor B:** uglen vises `calm` alle de steder, hun bruges i dag; kronen følger rang som nu. At vise `happy` ved rigtigt svar og fejre level-op hører til **Spor A**, så det ikke bygges to gange.

## 5. Teknik

- **Ny enhed `src/ui/uid.ts`:** `uid(prefix: string): string` returnerer en unik id-streng (modul-tæller). Bruges til alle gradient-/filter-id'er, så flere tegninger på samme skærm **ikke kolliderer** i DOM'en (ugyldige dублet-id'er undgås).
- SVG med `feDropShadow` + gradienter; ren SVG, ingen nye afhængigheder, virker offline.
- **Fade-in:** `@keyframes fade-in` i `base.css`, anvendt på `.home` og `.activity` (ingen JS-ændring).
- **Berørte filer:** `src/ui/uid.ts` (ny), `src/ui/mascot.ts`, `src/activities/clock/clock-face.ts`, `src/ui/icons.ts`, `src/ui/pictures.ts`, `src/styles/base.css`. **Logik-filer (domain/services/aktivitets-orkestratorer) røres ikke.**

## 6. Test

- **`uid`:** to kald giver forskellige id'er.
- **`mascot` (opdateres):** `owlSvg(2)` indeholder `data-part="crown"`; `owlSvg(1)` gør ikke; `owlSvg(1,64,'happy')` ≠ `owlSvg(1,64,'calm')`; alle giver `<svg`.
- **`pictures` (uændret):** hvert ord giver `<svg` og ≠ pladsholder-figuren.
- **Alle øvrige tests** (clock-math, time-to-danish, clock-levels, words, progress, words-progress, storage, audio, dom, read-mode, set-mode, spell-mode) er **urørt** — kun udseende ændres, så de skal fortsat bestå uændret.

## 7. Leverance

Branch `feat/grafisk-fidelity` → PR → merge → auto-deploy (GitHub Pages). Version → **v0.3.0**. Bagefter: **Spor A** (progression & level-op-følelse), derefter v3 Tal.

## 8. Åbne punkter

- Finjustering af skygge-styrke, øjne og kinder kan ske løbende under bygningen ud fra hvordan det ser ud live.
