# Bogstaver — "Stav ordet" (v2) — Designspecifikation

> **Projekt:** Rolige Lærespil (app-titel "Mine Lærespil")
> **Dato:** 2026-06-10
> **Status:** Design godkendt — klar til implementeringsplan
> **Bygger på:** v1 (forside + klokke-aktivitet). Genbruger app-skal, `Activity`-interface, dom-hjælpere, audio, mascot, design-tokens.

---

## 1. Formål

Tilføj appens anden aktivitet — **Bogstaver** — med én rolig måde: **"Stav ordet"**. Barnet (5-7 år, læser allerede læs-let-bøger) ser en rolig tegning og bygger ordet ved at trykke bogstaverne i rigtig rækkefølge. Det træner stavning og bogstavkendskab for en begynderlæser — uden at være babyagtigt og uden reklamer/blink/tidspres.

## 2. Målgruppe og kontekst

- Samme dreng som v1; han **læser læs-let-bøger** (begynderlæser), så niveauet starter trygt og bliver hurtigt udfordrende.
- Personlige favoritter væves ind: **ugle, dino, cykel** som de første ord/tegninger.
- Samme rolige principper som v1: dæmpet pastel, store trykflader, blid dansk stemme (kan slås fra), ingen reklamer/pop-ups/sporing, virker offline.

## 3. Scope

**Med i v2:** Én aktivitet "Bogstaver" med ét spil, **"Stav ordet"**, med progression.

**Uden for scope (YAGNI):** de øvrige måder fra brainstormen (find ordet til billedet, match STORE/små, find billedet til ordet), fonik/bogstavlyde, skrive/spore bogstaver. Kan komme i senere versioner.

## 4. Interaktion — "Stav ordet"

Skærmen (samme rolige opbygning som klokke-skærmen, med tydelig spørgsmål- og svar-zone):

- **Spørgsmålszone:** uglen + talebobbel; en rolig **tegning** af ordet. Uglen siger ordet højt (🔊).
- **Svarzone:** en række **tomme felter** (ét pr. bogstav) og nedenunder en bakke med ordets **bogstavbrikker i blandet rækkefølge**.
- Barnet trykker brikkerne i rigtig rækkefølge:
  - Rigtig brik → fylder næste tomme felt, blød bekræftelsestone, brikken forsvinder fra bakken.
  - Forkert brik → vipper blidt og bliver i bakken (ingen hård fejl, ingen lyd-skæld).
- Når ordet er færdigt: uglen siger ordet, blød to-tone-bekræftelse, fremgang registreres, og næste ord kommer efter et kort, roligt ophold.
- Bakken indeholder **kun ordets egne bogstaver** (ingen distraktorer i v2) — altid løsbart og roligt. Gentagne bogstaver matches på bogstav-værdi.

## 5. Bogstaver, ord og progression

- **Små bogstaver** (som i hans læs-let-bøger).
- **Niveauer (eget spor for Bogstaver):**
  1. **Niveau 1:** 3-bogstavsord, og **ordet vises** som hjælp over felterne (kopiér).
  2. **Niveau 2:** 4-bogstavsord, **ordet skjult** (stav ud fra tegningen).
  3. **Niveau 3:** 5+ bogstavsord, skjult.
- **Startordliste (~10, udvides nemt)** med enkle, rolige SVG-tegninger:
  - Favoritter: **ugle, dino, cykel**
  - Enkle: **sol, kat, hus, bil, bold, fisk**
  - Med æ/ø/å: **træ, sø, bål** (sikrer øvelse i de danske bogstaver)
- Ord vælges tilfældigt inden for det aktuelle niveau (deterministisk via injiceret RNG i test).

## 6. Rolig gamification

Genbruger v1's princip (synlig, samlebar fremgang — ingen blink/fanfarer):

- **Bogstaver får sit eget niveau-spor** gemt under en separat `localStorage`-nøgle (`rl.words.v1`), så klokkens fremgang er uberørt.
- Trofæer og dino-samling optjenes på samme måde (hver N rigtige ord → trofæ + ny dino + evt. level-op, level maks. 3).
- **Forsidens trofætæller lægger begge aktiviteter sammen** (klokke + bogstaver).
- Uglens rang på forsiden afspejler samlet fremgang.

## 7. Lyd

Genbruger `AudioService`. Uglen **læser ordet højt** (dansk stemme klarer hele ord fint), og siger en blid ros ved færdigt ord. Bløde bekræftelsestoner. Alt kan slås fra i forælder-hjørnet (uændret).

## 8. Teknisk arkitektur (genbrug + nyt)

**Genbruger uændret:** `core/activity.ts`, `core/dom.ts`, `core/router.ts`, `services/audio.ts`, `ui/mascot.ts`, `ui/icons.ts`, `styles/tokens.css`. Klokke-koden røres ikke.

**Nye enheder (hver ét ansvar):**

| Enhed | Ansvar | Afhænger af |
|-------|--------|-------------|
| `domain/words.ts` | Ordliste + niveau-config + ren stave-logik (næste-rigtige-bogstav, blanding, ord-færdig) | — |
| `ui/pictures.ts` | Rolige SVG-tegninger pr. ord (returnerer betroet SVG-streng) | — |
| `services/words-progress.ts` | Bogstaver-fremgang (niveau, rigtige, trofæer, samling) i `localStorage` | core/storage |
| `activities/words/spell-mode.ts` | Render + interaktion for "Stav ordet" | domain/words, pictures, mascot, dom, audio |
| `activities/words/words-activity.ts` | Orkestrator, implementerer `Activity` (niveau-stribe, fremgang) | spell-mode, words-progress |

**Ændres let:** `ui/home.ts` (aktivér "Bogstaver"-feltet + summér trofæer på tværs af aktiviteter), `main.ts` (rut "letters" → `WordsActivity`). Styles tilføjes i `styles/base.css` (stave-skærm, brik-bakke).

**Note om fremgang:** klokkens `services/progress.ts` er klokke-specifik (niveau 1-4). For at undgå at ændre v1 får Bogstaver et parallelt `words-progress.ts` med egen nøgle. Mild gentagelse accepteres i v2; en fælles, aktivitets-generisk fremgangsmodel kan laves senere, hvis en tredje aktivitet (Tal) kommer til.

## 9. Test (Vitest)

- **Unit (vigtigst):** `domain/words.ts` — næste-rigtige-bogstav-logik, blanding (deterministisk med fast RNG), ord-færdig-detektion, gentagne bogstaver; niveau-filtrering (ordlængde + vis/skjul).
- **Service:** `words-progress.ts` — level-op/trofæ/dino, maks. niveau, sikker load.
- **Component (jsdom):** `spell-mode` — render giver N tomme felter + ordets brikker; tryk i rigtig rækkefølge fylder felterne og kalder `onComplete`; forkert brik fylder ikke.

## 10. Leverance

Bygges på branch **`feat/v2-bogstaver`** → PR → merge til `main` → **auto-deploy** via GitHub Pages (allerede sat op). CHANGELOG opdateres til v0.2.0.

## 11. Åbne punkter

- Ordlisten kan justeres/udvides (flere tegninger). Tegningerne er enkle skitser i v1-stilen og kan forfines.
