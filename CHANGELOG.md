# Changelog

Formatet følger [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
og projektet bruger [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.1] - 2026-06-16

### Changed
- Krydse-af-noter i „Alfred knækker koden" er nu **pr. rude** i stedet for pr. tal: at markere et tal i én række påvirker kun den rude — ikke alle forekomster af tallet. Alfred kigger selv hver række igennem og streger tallene ud én ad gangen (mere aktivt, mindre auto-hjælp). Taltastaturet afspejler ikke længere mærker.

## [0.11.0] - 2026-06-15

### Added
- Nyt fjerde spil: „Alfred knækker koden" — kodeknækker (Mastermind) med hængelås, garanteret-løselige koder og fire sværhedsgrader.
- Rolige scener (dino-æg, skattekiste, cykel, raket, Ugos trædør, magisk dør) der rammer hver kode ind; hele skærmen klæder sig efter scenen.
- Krydse-af-noter: Alfred kan markere tal i ledetrådene som „ikke i koden" (✕) eller „med, men forkert plads" (◯) — vises på alle forekomster.
- Ugo læser ledetråden højt ved tryk på teksten.
- Delt stjerne-/pokal-konto på tværs af alle fire spil.

### Changed
- „Vis facit" i kodespillet er erstattet af en altid-tilgængelig „Ny kode"-knap (blidere, low-arousal).

## [0.10.0] - 2026-06-10

### Added
- Nyt spil: "Stav med Dino" 🦕 — dinoen har gemt bogstaver i et ord (1.-klasses niveau med æ/ø/å), og man finder dem blandt brikkerne. Ugo siger ordet højt, emoji viser det, og 🔊-knappen gentager
- Tre sværhedsgrader: korte ord/ét gemt bogstav → lange fakta-ord/tre gemte bogstaver
- Stjerner og pokaler deles med klokke-spillet

## [0.9.0] - 2026-06-10

### Added
- Hjælp-på-tryk: rør ved uret i "Hvad er klokken?" og få trinvis visestøtte — først den lille viser (som pulserer blidt), så den store. Talt højt, uden at afsløre svaret, og kun når barnet selv beder om det

## [0.8.0] - 2026-06-10

### Added
- Ugo reagerer på berøring: rør ved uglen og hun jubler blidt og siger hej — kun når barnet selv rører
- Døgnhimmel: spillets himmel følger den rigtige tid — morgenlys, dag, aftenrøde og nattehimmel med måne og stjerner

## [0.7.0] - 2026-06-10

### Added
- Ugos stemme: blid dansk oplæsning — "Sæt uret til halv fire", svaret når man rammer rigtigt, og den rigtige tid når den afsløres
- Bløde bekræftelsestoner (to toner ved rigtigt, tre ved pokal — ingen fanfarer)
- Lyd til/fra-knap i menuen og i spillet; valget huskes

## [0.6.0] - 2026-06-10

### Added
- Klog motor: adaptiv opgavevælger — mere af det man næsten kan, stille gentagelse af det lærte, altid inden for barnets eget valgte niveau
- Nabo-fælden: én svarmulighed er altid nabotimen med samme minutter (tester ægte halv/kvart-forståelse)
- Ugos blide forslag om næste niveau når alt er mestret (kan ignoreres; skifter aldrig selv)
- "Mit ur": mestringsside hvor hver tid-position bliver guld når den er lært (+ ✓/◐ på niveau-knapperne)
- "Lige nu"-ur i menuen med den rigtige tid og "Spørg mig om den!"-knap (kun på barnets initiativ)

### Teknisk
- Ny localStorage-nøgle `alfred.stats.v1` (stjerner/pokaler urørt)

## [0.5.0] - 2026-06-10

### Changed
- Appen er nu "Alfred lærer klokken" — en React-version (Vite + React + TS + Tailwind) som barnet er glad for, deployet på samme URL
- Den tidligere vanilla-app (klokke/bogstaver/progression) er erstattet (bevaret i git-historikken)

### Added
- Gemt fremgang: stjerner, pokaler, fremgang-mod-næste-pokal, valgt niveau og spil huskes lokalt
- Self-hostede fonte (Fredoka/Nunito) så spillet ser rigtigt ud offline
- Ugo-app-ikon

## [0.4.0] - 2026-06-10

### Added
- Fremgangsbar i aktiviteterne (mod næste trofæ)
- Level op-kort der fejrer nye niveauer med den glade krone-ugle + rolig ros
- "Min samling"-skærm (fra forsiden): trofæer, oplåste dinoer og uglens rang-navn
- Uglens rang-navne (Ugle-ven → Klog ugle → Vis ugle → Mester-ugle)

### Changed
- Fælles, aktivitets-generisk fremgangsmodel (klokke + bogstaver), klar til Tal
- Forsidens trofætal og uglens rang afspejler nu al fremgang samlet

### Migration
- Eksisterende lokal fremgang flyttes automatisk til den nye model (intet tabt)

## [0.3.0] - 2026-06-10

### Changed
- Alle illustrationer løftet til blød "stil B" (gradienter + blid skygge): ugle, ur, dino, cykel, trofæ og ord-tegninger
- Uglen har nu udtryk (rolig/glad) og krone ved højere rang
- Diskret fade-in når en skærm vises (respekterer prefers-reduced-motion)
- Unikke gradient-/filter-id'er pr. tegning (undgår DOM-id-kollision)

## [0.2.0] - 2026-06-10

### Added
- Bogstaver-aktivitet med spillet "Stav ordet": rolig tegning + tomme felter + blandede bogstavbrikker
- Niveauer (ord vist på niveau 1, skjult fra niveau 2; ordlængde 3 → 4 → 5)
- Ordliste med billeder (sol, kat, hus, træ, bål, øje, ugle, dino, bold, fisk, cykel, banan)
- Separat fremgangsspor for Bogstaver; forsidens trofætæller summerer begge aktiviteter

## [0.1.0] - 2026-06-09

### Added
- Forside med tre aktivitetsfelter og rolig gamification-visning
- Klokke-aktivitet: "Se klokken" (4 svar) og "Stil klokken" (steppers)
- Dansk tid-til-tekst (hele, halve, kvarter, fem-minutter)
- Niveauer, trofæer, uglens rang og dino-samling (gemt lokalt)
- Dansk tale + bløde toner med mute
- Forælder-hjørne (lyd, niveau, nulstil)
- PWA: manifest, ikoner og offline-understøttelse
