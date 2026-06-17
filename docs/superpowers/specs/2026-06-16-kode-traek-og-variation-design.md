# Kodespil: træk-på-plads + mere ledetråds-variation (v0.12.0)

> **Projekt:** Alfred lærer klokken (rolige-laerespil)
> **Dato:** 2026-06-16
> **Status:** Design godkendt — klar til implementeringsplan
> **Bygger på:** v0.11.1 („Alfred knækker koden" med per-rude krydse-af-noter). Additivt — de øvrige spil og kodespillets løsnings-/scene-/mærke-logik bevares.

---

## 1. Formål

To forbedringer af kodespillet, begge aftalt med brugeren, samlet i én udgivelse:

- **Del A — træk kodetallene på plads:** Alfred skal kunne lægge et tal i præcis det felt han vil (træk), så koden ikke *nødvendigvis* skal tastes fra venstre mod højre. Tastning i rækkefølge bevares som den lette vej.
- **Del B — mere variation i ledetrådene:** generatoren laver for mange „3 tal er rigtige, men på forkerte pladser" (typen `0,3`); ledetråds-typerne skal spredes mere.

Alt efter **ro-kontrakten**: barnet styrer tempoet, forudsigeligt layout, blød feedback, intet han elsker fjernes. Skal virke med **touch på iPad**.

---

## 2. Del A — træk kodetallene på plads

### 2.1 Felt-model: fra liste til 4 faste pladser
I dag er de indtastede tal en liste (`entry: number[]`) der fyldes venstre→højre. Det ændres til **4 selvstændige pladser**: `Slots = (number | null)[]` af længde 4. Hvert felt kan fyldes/ryddes uafhængigt, så et tal kan ligge i et vilkårligt felt.

### 2.2 Ren placerings-logik (`src/domain/code.ts` — testet)
Små rene hjælpere, så reglerne kan unit-testes uden DOM:
- `emptyEntry(): Slots` → `[null, null, null, null]`.
- `placeDigit(slots, index, digit): Slots` → nyt array med `digit` på `index` (erstatter et evt. eksisterende tal).
- `clearSlot(slots, index): Slots` → nyt array med `null` på `index`.
- `firstEmpty(slots): number` → indeks på første tomme felt, ellers `-1`.
- `entryComplete(slots): boolean` → alle fire felter fyldt.
- `entryToCode(slots): string` → de fire cifre samlet (kun meningsfuldt når `entryComplete`).

### 2.3 Betjening (`src/components/CodeGame.tsx`)
- **Tryk på et tal** (0-9 på tastaturet) → lægges i `firstEmpty` (uændret „i rækkefølge"-vej). Hvis intet felt er tomt, sker intet.
- **Træk et tal** fra tastaturet op på et felt → `placeDigit` på det felt (erstatter et evt. tal der lå der).
- **Tryk på et fyldt felt** → `clearSlot` (tag tallet ud igen).
- **⌫** → rydder det **senest lagte** tal (CodeGame husker sidst-ændrede felt; falder tilbage til højre-mest fyldte hvis intet er registreret).
- **🔓** aktiv når `entryComplete`; løsnings-tjek = `entryToCode(slots) === puzzle.secret` (samme celebration/onSolved/onWrong som nu).

### 2.4 Touch-venligt træk (pointer-baseret, som „Sæt viserne")
Almindelig HTML5-drag virker ikke på iOS-touch, så trækket bygges på **pointer events** (samme tilgang som `Clock` allerede bruger til viserne):
- `onPointerDown` på en tal-tast starter en mulig træk-gestus (gemmer start-punkt + cifret, `setPointerCapture`).
- Bevæger fingeren sig over en lille tærskel (~8px) → **træk-tilstand**: et blødt „spøgelses-tal" følger fingeren (et `position: fixed`-element ved pointer-koordinaterne), og de fire felter fremhæves stille som drop-zoner.
- `onPointerUp`: er vi i træk-tilstand, **hit-testes** pointer-koordinaterne mod de fire felters `getBoundingClientRect()`; rammer vi et felt → `placeDigit` der. Ramte vi intet felt → ingenting. Var det **ikke** træk (under tærsklen) → behandl som et tryk = `firstEmpty`.
- Mus giver samme oplevelse (pointer events dækker begge). Ingen voldsom animation; blødt løft + rolig zone-fremhævning.

De fire felter får en `ref`/markør så deres rektangler kan hit-testes. Krydse-af-mærker (tryk på ledetråds-ruder) og scene/keypad-input er uændrede og kolliderer ikke (træk starter kun på tal-tasterne).

### 2.5 Uden for scope (Del A)
- Ingen omrokering ved at trække et tal **fra ét felt til et andet** (træk går kun tastatur→felt; rettelser sker via tryk-for-at-rydde + nyt træk).
- Ingen persistens (indtastning er flygtig, nulstilles ved „Ny kode").

---

## 3. Del B — mere variation i ledetrådene (`src/domain/code.ts`)

### 3.1 Baggrund
Ledetråds-„ordforrådet" er bevidst begrænset til **rene** typer (`CLEAN` = `0,0 / 1,0 / 2,0 / 3,0 / 0,1 / 0,2 / 0,3` — kun-på-plads eller kun-forkert-plads, ingen blandede). Udfyldnings-loopet i `genPuzzle` favoriserer på de svære niveauer „forkert plads"-typer, og da der findes mange gæt med netop `0,3`, klumper ledetrådene sig om den.

### 3.2 Ændringer i `genPuzzle`
1. **Round-robin udfyldning:** når koden fyldes op til entydighed, sorteres kandidat-typerne primært efter **lavest nuværende antal** (mindst-brugte type først), så typerne spredes jævnt. Den eksisterende sværhedspræference (`place`/`wrong`) bliver kun en **tiebreaker** — sværhedsgraden bevares via TARGETS-ankrene.
2. **Loft over `0,3`:** højst **1** ledetråd af typen `0,3` pr. kode (typen springes over i udfyldnings-puljen når den allerede er brugt én gang).
3. **Stærkere variations-krav:** accept-kriteriet hæves fra „≥3 forskellige typer" til **„≥4 forskellige typer"**.

### 3.3 Garantien holder
Koden er fortsat **garanteret entydigt løselig** — uændret. De nye krav må ikke få generatoren til oftere at falde tilbage på de faste reserve-koder (`FALLBACK`). Det sikres ved at:
- variations-kravene tjekkes som en del af de eksisterende 200 forsøg, og
- hvis et bestemt niveau ikke robust kan opfylde „≥4 typer + ≤1×`0,3`" sammen med entydighed (verificeres i test-sweep), **blødgøres kravet for netop det niveau** (fx „≥3 typer" for `ekspert`, som per design kun bruger forkert-plads-typer) frem for at miste entydigheden eller ende i fallback.

---

## 4. Berørte filer

| Fil | Ændring |
|-----|---------|
| `src/domain/code.ts` | ÆNDRES — nye rene placerings-hjælpere (`Slots`, `emptyEntry`, `placeDigit`, `clearSlot`, `firstEmpty`, `entryComplete`, `entryToCode`); `genPuzzle` round-robin + `0,3`-loft + ≥4 typer |
| `src/components/CodeGame.tsx` | ÆNDRES — felt-model `Slots`, pointer-baseret træk + drop-zoner + spøgelses-tal, tryk-for-at-rydde, ⌫ = ryd sidst lagte, submit via `entryToCode` |
| `tests/code.test.ts` | UDVIDES — placerings-hjælpere; variations-test (≥4 typer, ≤1×`0,3`) på tværs af seeds; eksisterende entydigheds-sweep består fortsat |
| `package.json`, `CHANGELOG.md`, `README.md` | ÆNDRES — version v0.12.0 |

Scener (`domain/scenes.ts`), Padlock, krydse-af-mærker, persistens, klokke-/dino-spil: **urørt**.

## 5. Test (Vitest)

- **Placerings-hjælpere:** `emptyEntry` (4×null); `placeDigit` (sætter/erstatter på indeks, immutabel); `clearSlot`; `firstEmpty` (første tomme / −1 når fuld); `entryComplete`; `entryToCode` (rigtig rækkefølge uanset udfyldnings-rækkefølge — fx fyld indeks 2 før 0).
- **Variation:** for hver sværhedsgrad og mange seeds — `genPuzzle` giver ≥4 forskellige ledetråds-typer og højst 1×`0,3` (med den dokumenterede per-niveau-blødgøring hvis nødvendig).
- **Entydighed (uændret garanti):** den eksisterende sweep (præcis ét tal i `ALL` opfylder alle rækker) består fortsat for alle niveauer og seeds.
- Selve træk-gestussen verificeres **live i preview** (pointer-events), ikke i unit-test.

## 6. Leverance & scope

Subagent-drevet i faser (domæne+test → CodeGame-træk → version/docs), derefter opus-review, live-playtest i preview (tryk-fyld, træk-til-felt på touch/mus, ryd, løs, variation i ledetrådene), branch → PR → merge → auto-deploy → CHANGELOG + memory. Version **v0.12.0**.

**Uden for scope (YAGNI):** ingen felt-til-felt-omrokering, ingen persistens af indtastning, ingen ændring af scene-/mærke-/løsnings-logik, ingen blandede ledetråds-typer (ordforrådet forbliver rent).
