# Klog motor — adaptiv mestring i Alfred-spillet (v0.6.0)

> **Projekt:** Alfred lærer klokken (rolige-laerespil)
> **Dato:** 2026-06-10
> **Status:** Design godkendt — klar til implementeringsplan
> **Bygger på:** v0.5.0 (React-appen med gemt fremgang). Additivt — spillets udseende, fejring og betjening bevares verbatim.

---

## 1. Formål

Gør spillet *klogere* uden at gøre det anderledes: en usynlig mestringsmotor vælger opgaver adaptivt (mere af det han næsten kan, stille gentagelse af det lærte), svarmulighederne tester ægte forståelse, mestring bliver synlig på en rolig "Mit ur"-side, og et "lige nu"-ur bygger broen til den virkelige klokke. Alt efter **ro-kontrakten**: barnet styrer tempoet og niveauet, ingen popups/pres/nedtælling, fejring uændret, alt nyt er stille eller barne-initieret.

## 2. Mestringsmodellen (`src/domain/mastery.ts` — ren, testet)

- **Enhed:** de 12 minut-positioner (0, 5, 10, …, 55). Læs- og sæt-spillet deler ét fælles kort (enkelt og forståeligt for barnet; begge træner samme tidsbegreb).
- **Stat pr. position:** `{ correct: number; wrong: number; streak: number }`. *Rigtig i første forsøg* → `correct+1`, `streak+1`; ellers → `wrong+1`, `streak=0`. (Læs-spil: første tryk; sæt-spil: første "Er det rigtigt?"-tjek.)
- **Tilstand:** `bucketState(stat)` → `'ny'` (aldrig set) | `'øver'` (set, streak < 3) | `'mestret'` (streak ≥ 3).
- **Vægtet valg:** `pickTime(stats, level, rng)` — time uniform 1-12; minut vægtet inden for `LEVELS[level].minutes`: kæmper (set, streak 0) = 4, ny = 3, øver (streak 1-2) = 2, mestret = 1 (stille gentagelse). Deterministisk via injiceret `rng`.
- **Niveau-mestring:** `levelMastered(stats, level)` = alle niveauets minut-positioner mestret. `deriveLevel(minute)` = mindste niveau hvis minut-sæt indeholder minuttet (bruges af nu-spørgsmålet).
- **Motoren ændrer aldrig selv barnets valgte niveau.**

## 3. Klogere svarmuligheder (`src/domain/time.ts`)

`makeOptions(answer, level)` udvides: én distraktor er altid **nabo-fælden** — `{h: answer.h % 12 + 1, m: answer.m}` (samme minutter, nabotime; rammer netop halv-konstruktionens kendte forveksling, fx "halv fire" vs "halv fem"). Øvrige distraktorer som i dag. Stadig 4 unikke muligheder inkl. svaret; udseende uændret.

## 4. Ugos blide forslag

Når `levelMastered(currentLevel)` og et næste niveau findes: ved **næste opgave** (aldrig oven i fejringen) viser Ugo i den *eksisterende* besked-stribe: "Du kan de hele timer nu! Skal vi prøve halve timer? 🦉" med to små knapper **"Ja!"** (skifter niveau) / **"Ikke nu"** (forsvinder). Højst én gang pr. session pr. niveau (in-memory). Ingen popup, intet pres.

## 5. "Mit ur" — mestringskortet (valgt: egen side)

- Ny skærm (`screen: 'mitur'`), åbnes fra menuen ("Mit ur 🕐"), lukkes med samme tilbage-mønster som spillet.
- Indhold: en stor urskive (genbruger `polar`) med en prik ved hver af de 12 positioner: **guld** = mestret, **ring** = øver, **svag** = ny. Kort legend. Ingen lyd/animation — kontemplativ som pokalerne.
- Menuens niveau-knapper får et diskret mærke: **✓** = niveau mestret, **◐** = mindst én position i niveauet mestret (men ikke alle).

## 6. "Lige nu"-uret (`src/components/NowClock.tsx`)

- Nederst i menuen: et lille analogt ur + dansk tekst. **Visere og tekst rundes begge til nærmeste 5 minutter**, så ur og ord altid stemmer ("Klokken er ti minutter over to"). Opdateres løbende (interval ~10 s).
- Knap **"Spørg mig om den!"** (kun barne-initieret): starter én læs-opgave om den afrundede virkelige tid — svarmuligheder fra `deriveLevel(minut)`-puljen, uden at røre hans valgte niveau. Svaret tæller med i mestringskortet; derefter fortsætter spillet normalt.

## 7. Persistens

Ny nøgle **`alfred.stats.v1`** (i `src/lib/persistence.ts`): `loadStats()/saveStats()/defaultStats()` — robust som `loadProgress` (manglende/ugyldig JSON → defaults; tal valideres ≥ 0). `alfred.progress.v1` (stjerner/pokaler/niveau/spil) er **urørt**. App: lazy `useState(loadStats)`-init + gem via `useEffect` ved ændring.

## 8. Berørte filer

| Fil | Ændring |
|-----|---------|
| `src/domain/mastery.ts` | NY — model + vægtet valg + niveau-mestring + deriveLevel |
| `src/domain/time.ts` | ÆNDRES — nabo-fælde i `makeOptions` |
| `src/lib/persistence.ts` | ÆNDRES — stats-funktioner (ny nøgle) |
| `src/components/NowClock.tsx` | NY — lige nu-uret + spørg-knap |
| `src/components/MasteryClock.tsx` | NY — Mit ur-skiven |
| `src/App.tsx` | ÆNDRES — stats-state, pickTime i stedet for randomTime, første-forsøgs-registrering, forslag, mitur-skærm, menu-tilføjelser |
| `tests/mastery.test.ts` | NY |
| `tests/time.test.ts`, `tests/persistence.test.ts` | UDVIDES |

Owl, Clock, ui-komponenter, fejring, konfetti, farver: **urørt**.

## 9. Test (Vitest)

- `mastery`: recordAnswer (streak-opbygning/nulstilling), bucketState-grænser, pickTime-vægtning (seeded rng → forventelig fordeling/medlemskab af niveau-sæt), levelMastered, deriveLevel.
- `time`: nabo-fælden — `makeOptions` indeholder altid `{h: h%12+1, m}` (inkl. 12→1-wrap); eksisterende egenskabstests består.
- `persistence`: stats gem→indlæs, manglende/korrupt → defaults, negative tal → 0.

## 10. Leverance & scope

Branch `feat/klog-motor` → PR → merge → auto-deploy (samme URL; iPad opdaterer selv). Version **v0.6.0** + CHANGELOG.

**Uden for scope (YAGNI):** "Ugos dag", udforsk-uret, minut-øvelsen, forældre-ankre, lyd — senere skiver af visionen.
