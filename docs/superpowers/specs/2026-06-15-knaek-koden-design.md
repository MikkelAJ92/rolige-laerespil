# Alfred knækker koden — 4. spil i Alfred-appen (v0.11.0)

> **Projekt:** Alfred lærer klokken (rolige-laerespil)
> **Dato:** 2026-06-15
> **Status:** Design godkendt — klar til implementeringsplan
> **Bygger på:** v0.10.0 (klokke-spil + dino-stavespil med delt fremgang). Additivt — de eksisterende spil bevares verbatim.

---

## 1. Formål

Tilføj et fjerde spil til Alfred-appen: **„Alfred knækker koden"** — et roligt kodeknækker-spil (Mastermind med hængelås), hvor barnet læser ledetråde og regner den hemmelige 4-cifrede kode ud. Koden er **garanteret løselig og entydig** hver gang, og sværhedstrappen styres af antallet af „rette plads"-ankre.

Spillet kommer fra brugerens egen, færdige React-kode (gemt verbatim i `docs/reference/alfred-kode-original.jsx`). Det skal **adopteres** ind i appen efter præcis samme mønster som klokke- og dino-spillet: udseende og spil-logik bevares, mens de byggeklodser appen allerede har genbruges i stedet for at duplikeres.

Alt efter **ro-kontrakten**: barnet styrer tempoet og niveauet, ingen popups/pres/nedtælling, fejring uændret, og intet han elsker fjernes. De eksisterende spil ændres ikke.

## 2. Princip — adoptér verbatim, genbrug det fælles

Den medbragte kode indeholder sine egne kopier af `Owl`, `Cloud`, `Confetti`, `Btn`, `Pill`, `StarRow`, `shade` og `styleBlock`. Disse **droppes** til fordel for appens fælles komponenter (`src/components/Owl.tsx`, `src/components/ui.tsx`, `src/lib/colors.ts`, `src/lib/audio.ts`, appens globale fonte/stil). Det unikke for dette spil — hængelåsen, taltastaturet, ledetråds-rækkerne og kode-generatoren — bliver nye, fokuserede moduler.

Spil-logikken (clue/bulls-cows, `genPuzzle`, sværhedsgrads-kontrakten, ledetråds-teksterne) bevares **verbatim**. Eneste tilladte ændring er at gøre tilfældigheden testbar (se §3).

## 3. Kode-motoren (`src/domain/code.ts` — ren, testet)

Hele logikken fra den medbragte kode flyttes hertil som ren TypeScript:

- **Typer:** `CodeLevelKey = 'nem' | 'mellem' | 'svaer' | 'ekspert'`; `Clue { g: number[]; b: number; c: number }`; `Puzzle { secret: string; rows: Clue[] }`.
- **Funktioner (verbatim adfærd):** `clue(g, code)` (returnerer `[bulls, cows]`), `buildAll()`/`ALL` (alle 5040 koder med 4 forskellige cifre), `same`, `isClean`/`CLEAN`, `clueText(b, c)` (de eksakte danske strenge), `TARGETS`, `DIFF_FILL`, `genPuzzle(diff, rng)`, `FALLBACK`, samt level-meta (`LEVELS` med label/stars/desc og `LEVEL_COLOR`).
- **Ny hjælper:** `excludedDigits(puzzle): Set<number>` — cifre fra en „intet tal er rigtigt"-række (i dag beregnet inline i `App`).
- **Eneste ændring vs. den medbragte kode — injiceret `rng`:** `Math.random()` byttes til en parameter `rng: () => number = Math.random` i `sample4`, `genPuzzle` og de interne shuffles (præcis som `src/domain/time.ts` allerede gør). Med `Math.random` er adfærden identisk i appen; med en seeded `rng` bliver koderne deterministiske i tests. Dette er en adfærdsbevarende refaktorering — spillet er uændret.

`code.ts` har ingen afhængigheder til React eller DOM.

## 4. Komponenter

| Komponent | Indhold |
|-----------|---------|
| `src/components/Padlock.tsx` | NY — hængelåsen (SVG, åben/lukket) verbatim. Bruger fælles `shade` fra `src/lib/colors.ts`. |
| `src/components/CodeGame.tsx` | NY — selve spillebrættet: hængelås + 4 tal-felter, ledetråds-rækkerne (`ClueRow` + `Dot`), taltastaturet (`Keypad`), hjælp-/facit-knapper og Ugo-besked-striben. `ClueRow`, `Dot` og `Keypad` er små, lokale hjælpekomponenter i denne fil (specifikke for spillet). Genbruger fælles `Owl`, `ui` (`Confetti`) og `audio`-singleton (importeres direkte). |

`CodeGame` ejer **kun** sin egen spil-tilstand (aktuelt puzzle, indtastede tal, hint on/off, afsløret, shake, lokal `mood`/besked, in-memory `streak` og `done`-mærker). Den deler **ikke** den globale fremgang selv. Props:

- `level: CodeLevelKey` — hvilken sværhedsgrad puzzles genereres til.
- `starRow: number` — den **delte** stjernerække (read-only), så den velkendte `StarRow` kan vises over hængelåsen (verbatim-fornemmelse). Den ejes og opdateres i `App`.
- `onSolved()` — kaldes når en kode knækkes (App giver stjerne/pokal + konfetti + lyd).
- `onWrong()` — kaldes ved forkert gæt (App afspiller ingen/blid feedback; ingen straf).

Klik-på-ledetråd-oplæsningen (§6) er **intern** i `CodeGame`: `ClueRow`s `onClick` kalder `audio.speak(clueText(b, c))` direkte på den globale `audio`-singleton (som allerede respekterer mute). „Ny kode" (nyt puzzle, samme sværhedsgrad) er også intern; menu/tilbage leveres af appens fælles ramme. Kontrakten (`onSolved`/`onWrong`) er præcis samme mønster som `WordGame` (`onComplete`/`onWrong`).

## 5. Delt belønning

En knækket kode = **+1 stjerne i samme stjernerække** som klokke- og dino-spillet. 5 stjerner = samme pokal, samme konfetti, samme Ugo-jubel + lyd. Alfred har **ÉN konto** på tværs af alle fire spil.

- Kode-spillets oprindelige interne `stars/trophies/starRow/done` (global belønning) erstattes af appens delte fremgang i `App`.
- `streak` (🔥 „… i træk!") og `done` (✅ pr. klaret sværhedsgrad) bevares som **in-memory** tilstand i `CodeGame` — ligesom i den oprindelige kode. De persisteres ikke (ikke over-tracket; rolig).
- Kode-spillet rører **ikke** klokke-mestringsmotoren (`alfred.stats.v1`) — den handler om de 12 minut-positioner og er uvedkommende her. Ren adskillelse, ligesom dino-spillet.

## 6. Én rolig tilføjelse: Ugo læser ledetråden højt

Kode-spillet kræver **mere læsning** end klokkespillet (hele ledetrådssætninger). Appen har allerede Ugos blide danske stemme (`audio.speak`, med lyd-knap + mute i menu og spil). Derfor den ene additive forbedring:

- **Tryk på en ledetråds-række → Ugo læser den højt** ("Ét tal er rigtigt og på rette plads"). Barne-initieret, gratis, respekterer mute. Direkte støtte til Læs-Let-niveauet.
- Ved knækket kode: blid 2-tone + kort talt ros (som klokke/dino). Ved forkert gæt: stille (ingen hård lyd), kun den eksisterende shake + Ugos opmuntrende besked.
- Default-start på sværhedsgrad **„Nem"** (flest „rette plads"-ankre).

Alt respekterer den eksisterende `sound`-toggle i `Progress`.

## 7. Persistens (`src/lib/persistence.ts`)

Minimal, robust udvidelse af den eksisterende `alfred.progress.v1` (samme mønster som `wordLevel`):

- `Progress.mode`-unionen udvides: `'read' | 'set' | 'ord'` → `'read' | 'set' | 'ord' | 'kode'`.
- Nyt felt `codeLevel: CodeLevelKey` (default `'nem'`).
- `loadProgress` valideres: `mode === 'kode'` accepteres; `codeLevel` valideres mod de fire gyldige nøgler (ellers `'nem'`).
- `defaultProgress()` får `codeLevel: 'nem'`.
- `alfred.stats.v1` er **urørt**.

Da `Progress.mode` er en union, skal `App.tsx`' mode-håndtering udvides i samme ombæring, så projektet forbliver grønt (typecheck + tests) efter persistens-ændringen.

## 8. App-wiring (`src/App.tsx`)

- **Menu:** et fjerde spil-kort „Alfred knækker koden 🔓" ved siden af „Hvad er klokken?", „Sæt viserne" og „Stav med Dino". Lav visuel støj — samme kort-stil, roligt layout.
- **Niveau-chips:** mode-bevidste — klokke-niveauer for `read`/`set`, ord-niveauer for `ord`, **kode-sværhedsgrader** (Nem/Mellem/Svær/Ekspert) for `kode`. Valgt sværhedsgrad gemmes i `codeLevel`.
- **Render:** i `kode`-mode vises `CodeGame` (klokke-/ord-områderne skjules), med `onSolved`/`onWrong` koblet til den **delte** stjerne-/pokal-økonomi (`handleCorrect`) inkl. konfetti + Ugo-lyd. Forkert gæt giver ingen straf.
- **Bevares verbatim:** `„Sæt viserne"` (codepoints `201E 0053 … 201C`) skal forblive uændret efter hver redigering af `App.tsx`. Samme vagt gælder kode-menuens danske citationstegn ved „intet tal er rigtigt".

## 9. Test (Vitest, TDD) — kernen er garantien

`tests/code.test.ts` med seeded `rng`:

- **Entydig løselighed (kerne-garantien):** for hver sværhedsgrad og flere seeds er den genererede kode entydigt bestemt — præcis ét tal i `ALL` opfylder alle `rows` ledetråde.
- **Konsistens:** hver række i et genereret puzzle opfylder `clue(row.g, secret) === [row.b, row.c]`.
- **Secret-form:** 4 forskellige cifre; `rows.length ≤ 7`; mindst 3 forskellige ledetråds-typer.
- `clue()`: bulls/cows på kendte eksempler (inkl. delvise/ingen overlap).
- `excludedDigits()`: korrekte cifre fra „intet rigtigt"-rækken; tom mængde når ingen sådan række findes.
- `clueText()`: de eksakte danske strenge for repræsentative `(b, c)` (0,0 / 1,0 / 2,0 / 0,1 / 0,2 / 0,3).
- **FALLBACK:** hver fast kode (`nem/mellem/svaer/ekspert`) er selv gyldig + entydig (sikrer sikkerhedsnettet).

## 10. Berørte filer

| Fil | Ændring |
|-----|---------|
| `docs/reference/alfred-kode-original.jsx` | NY — den medbragte kode gemt verbatim |
| `src/domain/code.ts` | NY — motor + level-meta + `excludedDigits`, injiceret `rng` |
| `src/components/Padlock.tsx` | NY — hængelåsen |
| `src/components/CodeGame.tsx` | NY — spillebræt (+ lokale `ClueRow`/`Dot`/`Keypad`) |
| `src/lib/persistence.ts` | ÆNDRES — `mode` får `'kode'`, nyt `codeLevel` |
| `src/App.tsx` | ÆNDRES — 4. menukort, kode-chips, render i `kode`-mode (passer `level`+`starRow`+`onSolved`/`onWrong` til `CodeGame`), delt økonomi |
| `tests/code.test.ts` | NY |
| `package.json`, `CHANGELOG.md`, `README.md` | ÆNDRES — version v0.11.0 + noter |

Owl, Clock, NowClock, MasteryClock, Dino, WordGame, time.ts, mastery.ts, hints.ts, words.ts, sky.ts, audio.ts, konfetti, farver: **urørt**.

## 11. Leverance & scope

Subagent-drevet i faser (domæne+test → persistens → komponenter → App-wiring → version), derefter opus-review, live-playtest i preview, branch `feat/knaek-koden` → PR → merge → auto-deploy (samme URL; iPad opdaterer selv) → CHANGELOG + memory. Version **v0.11.0**.

**Uden for scope (YAGNI):**
- Ingen separat kode-pokalkonto (delt med de andre spil).
- Ingen ny maskot — Ugo går igen (som i den medbragte kode).
- Ingen persistering af `streak`/`done` (in-memory, som originalen).
- Rører ikke klokke-mestringsmotoren.
- Ingen ny himmel/baggrunds-logik — appens eksisterende ramme bruges.
