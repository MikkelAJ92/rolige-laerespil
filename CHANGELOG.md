# Changelog

Formatet følger [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
og projektet bruger [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
