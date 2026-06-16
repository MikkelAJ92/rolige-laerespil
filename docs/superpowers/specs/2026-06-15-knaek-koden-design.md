# Alfred knækker koden — 4. spil i Alfred-appen (v0.11.0)

> **Projekt:** Alfred lærer klokken (rolige-laerespil)
> **Dato:** 2026-06-15
> **Status:** Design godkendt — klar til implementeringsplan
> **Bygger på:** v0.10.0 (klokke-spil + dino-stavespil med delt fremgang). Additivt — de eksisterende spil bevares verbatim.

---

## 1. Formål

Tilføj et fjerde spil til Alfred-appen: **„Alfred knækker koden"** — et roligt kodeknækker-spil (Mastermind med hængelås), hvor barnet læser ledetråde og regner den hemmelige 4-cifrede kode ud. Koden er **garanteret løselig og entydig** hver gang.

Spillet kommer fra brugerens egen, færdige React-kode (gemt verbatim i `docs/reference/alfred-kode-original.jsx`) og **adopteres** ind i appen efter samme mønster som klokke- og dino-spillet: udseende og spil-logik bevares, mens appens eksisterende byggeklodser genbruges. Oven på den medbragte kode lægges tre rolige forbedringer, aftalt med brugeren:

1. **Scener** — hver kode rammes ind af en blød scene (dino-æg, skattekiste, raket …); hele skærmen klæder sig efter scenen.
2. **Krydse-af-noter** — Alfred kan markere tal som „ikke i koden" (✕) eller „med, men forkert plads" (◯), så hans tanker flyttes ud på skærmen.
3. **Ugo læser ledetråden højt** — støtte til Læs-Let-niveauet.

Alt efter **ro-kontrakten**: barnet styrer tempoet og niveauet, ingen popups/pres/nedtælling, fejring kort og forudsigelig, og intet han elsker fjernes. De eksisterende spil ændres ikke.

## 2. Princip — adoptér verbatim, genbrug det fælles

Den medbragte kode indeholder sine egne kopier af `Owl`, `Cloud`, `Confetti`, `Btn`, `Pill`, `StarRow`, `shade` og `styleBlock`. Disse **droppes** til fordel for appens fælles komponenter (`src/components/Owl.tsx`, `src/components/ui.tsx`, `src/lib/colors.ts`, `src/lib/audio.ts`, appens globale fonte/stil). Det unikke — hængelåsen, taltastaturet, ledetråds-rækkerne og kode-generatoren — bliver nye, fokuserede moduler.

Spil-logikken (clue/bulls-cows, `genPuzzle`, sværhedsgrads-kontrakten, ledetråds-teksterne) bevares **verbatim**. Eneste ændring er at gøre tilfældigheden testbar (se §3). Scener og krydse-af-noter er rene tilføjelser ovenpå.

## 3. Kode-motoren (`src/domain/code.ts` — ren, testet)

Hele logikken fra den medbragte kode flyttes hertil som ren TypeScript:

- **Typer:** `CodeLevelKey = 'nem' | 'mellem' | 'svaer' | 'ekspert'`; `Clue { g: number[]; b: number; c: number }`; `Puzzle { secret: string; rows: Clue[] }`; `Mark = 'none' | 'ude' | 'med'`.
- **Funktioner (verbatim adfærd):** `clue(g, code)` → `[bulls, cows]`, `buildAll()`/`ALL` (alle 5040 koder med 4 forskellige cifre), `same`, `isClean`/`CLEAN`, `clueText(b, c)` (de eksakte danske strenge), `TARGETS`, `DIFF_FILL`, `genPuzzle(diff, rng)`, `FALLBACK`, samt level-meta (`LEVELS` med label/stars/desc og `LEVEL_COLOR`).
- **Hjælpere:** `excludedDigits(puzzle): Set<number>` (cifre fra en „intet tal er rigtigt"-række — i dag inline i `App`); `cycleMark(m: Mark): Mark` (ren cyklus `none → ude → med → none` til krydse-af-noterne, jf. §5).
- **Eneste ændring vs. den medbragte kode — injiceret `rng`:** `Math.random()` byttes til en parameter `rng: () => number = Math.random` i `sample4`, `genPuzzle` og de interne shuffles (præcis som `src/domain/time.ts`). Med `Math.random` er adfærden identisk i appen; med en seeded `rng` bliver koderne deterministiske i tests. Adfærdsbevarende refaktorering.

`code.ts` har ingen afhængigheder til React eller DOM.

## 4. Scene-system (`src/domain/scenes.ts` — ren, testet)

Hver ny kode rammes ind af en rolig scene: én ting der skal låses op, en kort dansk sætning, og en blød tematisk baggrund, så hele skærmens univers tilpasser sig.

- **Type:** `Scene { id: string; locked: string; opened: string; title: string; bg: readonly [string, string]; accent: string }` — `locked`/`opened` er emojis (låst → åben), `title` er ramme-teksten, `bg` er to gradient-stop (hardcodede hex, så scenen ikke inverterer), `accent` en blød fremhævningsfarve.
- **`SCENES`:** de seks kuraterede scener (Alfreds verden + klassiske „lås op"-drømme):

  | id | `locked` | ramme-tekst (`title`) | `opened` (når løst) |
  |----|--------|----------------------|---------------------|
  | `dino` | 🥚 | „Knæk koden, så klækker ægget!" | 🦕 |
  | `kiste` | 🧰 | „Hjælp Ugo med at åbne kisten!" | 💎 |
  | `cykel` | 🚲 | „Lås cyklen op — så kan I køre en tur!" | 🚲 (klar) |
  | `raket` | 🚀 | „Tast startkoden til raketten!" | 🚀🌙 |
  | `traedoer` | 🦉 | „Den hemmelige dør i Ugos træ." | 🪟 |
  | `doer` | 🚪 | „En dør med en hemmelig kode…" | ✨ |

- **`pickScene(rng, avoid?): Scene`** — vælger en tilfældig scene; springer `avoid` (forrige scene-id) over, så samme scene aldrig kommer to gange i træk. Deterministisk via injiceret `rng`.

**Low-arousal:** bløde gradienter i samme varme palette, ÉN ting i fokus, **præcis samme layout hver gang** (kun tema/farve/ting skifter), intet blink. Åbne-fejringen pr. kode er ét blidt skift (`locked` → `opened`) + den eksisterende bløde hængelås-åbning + 2-tone. Den store konfetti er fortsat **kun** til pokalen (hver 5. stjerne). Klokkespillet beholder sin døgnhimmel (`lib/sky.ts`); kode-spillet får sit eget scene-univers — hvert spil ejer sin baggrund.

## 5. Krydse-af-noter (Alfreds egne markeringer)

Alfred kan flytte sine deduktioner ud på skærmen: markere et tal som **✕ ikke i koden** eller **◯ med, men forkert plads**.

- **Pr. rude, ikke pr. tal:** et mærke hører til den enkelte rude i en ledetråd (række + position). Markerer Alfred et „9" i én række, påvirkes **kun** den rude — andre 9-taller i andre rækker er urørte. Det er med vilje: han skal selv kigge hver række igennem og strege tallene ud én ad gangen (mere aktivt, mindre auto-hjælp). Taltastaturet afspejler **ikke** mærker — det er kun til input.
- **Tilstand:** `Record<rude-nøgle "række-position", Mark>` i `CodeGame` (in-memory), **nulstilles ved „Ny kode"**, gemmes ikke (ikke over-tracket).
- **Betjening — tryk-cyklus:** tryk på en tal-rude i en ledetråd kører `cycleMark`: rent → ✕ ude → ◯ med → rent. Ét tryk, intet at huske.
- **Visning (faste, forudsigelige farver):** `ude` = gennemstreget + dæmpet (gråtone) i den markerede rude; `med` = blød ring i en fast, dæmpet farve. Mærkerne ser **ens ud i alle scener** (uafhængigt af scenens `accent`) — forudsigeligt = roligt. Ingen animation.
- **Markering blokerer aldrig:** et `ude`-mærket tal kan stadig tastes ind — mærket er kun Alfreds note, ikke en spærring. (Kun „Hjælp mig" deaktiverer taster.)
- **Sameksistens med „Hjælp mig":** den eksisterende automatiske hjælp (deaktiverer/dæmper „intet rigtigt"-cifrene) bevares uændret; Alfreds manuelle mærker ligger ovenpå og vinder visuelt ved overlap.

## 6. Ugo læser ledetråden højt

Kode-spillet kræver mere læsning end klokkespillet. Appen har allerede Ugos blide danske stemme (`audio.speak`, med lyd-knap + mute):

- **Tryk på en ledetråds-tekst → Ugo læser den højt** ("Ét tal er rigtigt og på rette plads"). Barne-initieret, gratis, respekterer mute.
- **Tryk-mål adskilt:** tal-ruderne i en ledetråd = markér (§5); selve ledetråds-teksten = læs højt. De støder ikke sammen.
- Ved knækket kode: blid 2-tone + kort talt ros (som klokke/dino). Ved forkert gæt: stille (kun den eksisterende shake + Ugos opmuntrende besked). Default-start på sværhedsgrad **„Nem"**.

## 7. Komponenter

| Komponent | Indhold |
|-----------|---------|
| `src/components/Padlock.tsx` | NY — hængelåsen (SVG, åben/lukket) verbatim. Bruger fælles `shade`. |
| `src/components/CodeGame.tsx` | NY — spillebrættet: scene-baggrund + ting + ramme-tekst, hængelås + 4 tal-felter, ledetråds-rækkerne (`ClueRow` + `Dot`), taltastaturet (`Keypad`), hjælp-/facit-knapper og Ugo-besked-striben. `ClueRow`, `Dot` og `Keypad` er små, lokale hjælpekomponenter i filen. Genbruger fælles `Owl`, `ui` (`Confetti`) og `audio`-singleton. |

`CodeGame` ejer sin egen spil-tilstand: aktuelt puzzle, aktuel scene, indtastede tal, **krydse-af-mærker** (`Record<digit, Mark>`), hint on/off, afsløret, shake, lokal `mood`/besked, in-memory `streak` og `done`-mærker. Den deler **ikke** den globale fremgang selv. Props:

- `level: CodeLevelKey` — hvilken sværhedsgrad puzzles genereres til.
- `starRow: number` — den **delte** stjernerække (read-only), så `StarRow` kan vises over hængelåsen. Ejes og opdateres i `App`.
- `onSolved()` — kaldes når en kode knækkes (App giver stjerne/pokal + konfetti + lyd).
- `onWrong()` — kaldes ved forkert gæt (App afspiller ingen/blid feedback; ingen straf).

„Ny kode" (nyt puzzle + ny scene, samme sværhedsgrad; nulstiller mærker) og klik-på-ledetråd-oplæsning er interne i `CodeGame`. Menu/tilbage leveres af appens fælles ramme. Kontrakten (`onSolved`/`onWrong`) er samme mønster som `WordGame` (`onComplete`/`onWrong`).

## 8. Delt belønning

En knækket kode = **+1 stjerne i samme stjernerække** som klokke- og dino-spillet → 5 stjerner = samme pokal, samme konfetti, samme Ugo-jubel + lyd. Alfred har **ÉN konto** på tværs af alle fire spil.

- Kode-spillets oprindelige interne `stars/trophies/starRow/done` (global belønning) erstattes af appens delte fremgang i `App`.
- `streak` (🔥) og `done` (✅ pr. klaret sværhedsgrad) bevares som **in-memory** i `CodeGame` — som i originalen.
- Kode-spillet rører **ikke** klokke-mestringsmotoren (`alfred.stats.v1`). Ren adskillelse, ligesom dino-spillet.

## 9. Persistens (`src/lib/persistence.ts`)

Minimal, robust udvidelse af `alfred.progress.v1` (samme mønster som `wordLevel`):

- `Progress.mode`: `'read' | 'set' | 'ord'` → `'read' | 'set' | 'ord' | 'kode'`.
- Nyt felt `codeLevel: CodeLevelKey` (default `'nem'`), valideres mod de fire gyldige nøgler.
- `loadProgress` accepterer `mode === 'kode'`; `defaultProgress()` får `codeLevel: 'nem'`.
- `alfred.stats.v1` er **urørt**. Krydse-af-mærker og aktuel scene gemmes **ikke** (scratch pr. kode).

Da `Progress.mode` er en union, udvides `App.tsx`' mode-håndtering i samme ombæring, så projektet forbliver grønt efter persistens-ændringen.

## 10. App-wiring (`src/App.tsx`)

- **Menu:** et fjerde spil-kort „Alfred knækker koden 🔓" ved siden af de tre andre. Lav visuel støj, samme kort-stil.
- **Niveau-chips:** mode-bevidste — klokke-niveauer for `read`/`set`, ord-niveauer for `ord`, **kode-sværhedsgrader** (Nem/Mellem/Svær/Ekspert) for `kode`. Valgt gemmes i `codeLevel`.
- **Render:** i `kode`-mode vises `CodeGame` (klokke-/ord-områderne skjules), med `level` + `starRow` + `onSolved`/`onWrong` koblet til den delte stjerne-/pokal-økonomi (`handleCorrect`) inkl. konfetti + Ugo-lyd. Forkert gæt giver ingen straf.
- **Bevares verbatim:** `„Sæt viserne"` (codepoints `201E 0053 … 201C`) skal forblive uændret efter hver redigering. Samme vagt for kode-menuens danske citationstegn („intet tal er rigtigt") og scene-teksterne.

## 11. Test (Vitest, TDD)

`tests/code.test.ts` med seeded `rng`:

- **Entydig løselighed (kerne-garantien):** for hver sværhedsgrad og flere seeds er den genererede kode entydigt bestemt — præcis ét tal i `ALL` opfylder alle `rows`.
- **Konsistens:** hver række opfylder `clue(row.g, secret) === [row.b, row.c]`.
- **Secret-form:** 4 forskellige cifre; `rows.length ≤ 7`; ≥ 3 forskellige ledetråds-typer.
- `clue()`: bulls/cows på kendte eksempler.
- `excludedDigits()`: korrekte cifre fra „intet rigtigt"-rækken; tom mængde uden sådan række.
- `cycleMark()`: `none → ude → med → none`.
- `clueText()`: eksakte danske strenge for `(0,0)/(1,0)/(2,0)/(0,1)/(0,2)/(0,3)`.
- **FALLBACK:** hver fast kode er selv gyldig + entydig.

`tests/scenes.test.ts`:

- `SCENES` ikke-tom; hver scene har ikke-tomme `locked/opened/title` og to `bg`-stop.
- `pickScene(rng, avoid)` returnerer altid en gyldig scene og aldrig `avoid` (når > 1 scene findes); deterministisk for en given `rng`.

## 12. Berørte filer

| Fil | Ændring |
|-----|---------|
| `docs/reference/alfred-kode-original.jsx` | NY — den medbragte kode verbatim |
| `src/domain/code.ts` | NY — motor + level-meta + `excludedDigits` + `cycleMark`, injiceret `rng` |
| `src/domain/scenes.ts` | NY — `Scene` + `SCENES` + `pickScene` |
| `src/components/Padlock.tsx` | NY — hængelåsen |
| `src/components/CodeGame.tsx` | NY — spillebræt (scene + mærker + lokale `ClueRow`/`Dot`/`Keypad`) |
| `src/lib/persistence.ts` | ÆNDRES — `mode` får `'kode'`, nyt `codeLevel` |
| `src/App.tsx` | ÆNDRES — 4. menukort, kode-chips, render i `kode`-mode (passer `level`+`starRow`+callbacks), delt økonomi |
| `tests/code.test.ts`, `tests/scenes.test.ts` | NY |
| `package.json`, `CHANGELOG.md`, `README.md` | ÆNDRES — version v0.11.0 + noter |

Owl, Clock, NowClock, MasteryClock, Dino, WordGame, time.ts, mastery.ts, hints.ts, words.ts, sky.ts, audio.ts, konfetti, farver: **urørt**.

## 13. Leverance & scope

Subagent-drevet i faser (domæne+test → persistens → komponenter → App-wiring → version), derefter opus-review, live-playtest i preview, branch `feat/knaek-koden` → PR → merge → auto-deploy (samme URL; iPad opdaterer selv) → CHANGELOG + memory. Version **v0.11.0**.

**Uden for scope (YAGNI):**
- Ingen separat kode-pokalkonto (delt med de andre spil).
- Ingen ny maskot — Ugo går igen (som i den medbragte kode).
- Ingen persistering af `streak`/`done`/mærker/scene (in-memory, scratch).
- Rører ikke klokke-mestringsmotoren.
- Ingen lyd-effekter ud over appens eksisterende `audio` (stemme + bløde toner).
