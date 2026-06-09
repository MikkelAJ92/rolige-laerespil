# Rolige Lærespil — Designspecifikation

> **Projekt:** Rolige Lærespil (app-titel vist for barnet: "Mine Lærespil")
> **Dato:** 2026-06-09
> **Status:** Design godkendt — klar til implementeringsplan
> **Type:** Personligt projekt (uden for NIRAS-porteføljen)

---

## 1. Formål og motivation

En rolig, reklamefri læringsapp til en dreng på **5-7 år**, bygget af hans far. Den findes, fordi de fleste børneapps er fulde af reklamer, blink, høje fanfarer og overdrevne visuelle signaler. Denne app skal være det modsatte: **dæmpet, fokuseret og venlig**, men stadig **motiverende** via rolig gamification.

**Designfilosofi (gælder alt i appen):**
- Dæmpet pastelpalet, masser af luft, ingen skrigende farver.
- Intet tidspres, ingen stress-scorer, ingen nedtælling.
- Ingen reklamer, ingen pop-ups, ingen sporing, **intet netværkskald** under brug.
- Ingen "dark patterns" (ingen manipulerende loops, ingen "tryk nu!").
- Lyd er blid og kan altid slås fra.
- Gamification er **stille og synlig**: fremgang man kan se og samle på — aldrig blink eller fanfarer.

## 2. Målgruppe

- Primær bruger: dreng, 5-7 år (skolestart), dansktalende, læser endnu ikke flydende.
- Sekundær bruger: forælder, der styrer indstillinger (lyd, niveau) via et diskret forælder-hjørne.
- Personlige interesser indarbejdes: **ugler, dinoer og cykler.**

## 3. Platform og levering

- **Progressive Web App (PWA)**, bygget på Windows.
- Lægges på iPad'ens hjemmeskærm med eget ikon ("Føj til hjemmeskærm" i Safari), åbner i fuldskærm uden browser-knapper.
- **Virker offline** via service worker.
- Ingen App Store, ingen konto, ingen betaling.
- **Levering:** når appen er klar, hostes den på gratis statisk HTTPS-hosting (kandidater: Cloudflare Pages, Netlify, GitHub Pages eller Azure Static Web Apps). HTTPS er nødvendigt for at service worker (offline) virker, og for at PWA'en kan installeres. Endeligt valg af host træffes ved deployment.
- Tidlig test sker lokalt (Vite dev-server) og på iPad'en via LAN.

## 4. App-struktur

Én app med en rolig **forside** og tre aktiviteter. Forsiden viser tre store felter:

| Aktivitet | Version | Indhold |
|-----------|---------|---------|
| **Klokken** | v1 (prioritet) | Lære at aflæse og stille et analogt ur på dansk |
| **Bogstaver & ord** | v2 | Bogstaver (inkl. æ, ø, å), bogstavlyde, korte ord + billede |
| **Tal & tælle** | v3 | Genkende tal, tælle ting (dinoer), ganske simpel plus/minus |

Forsiden har desuden et diskret **forælder-hjørne** (tryk-og-hold på et lille ikon) til indstillinger.

## 5. Maskot og motiver

- **Uglen ("Ugo" — pladsholdernavn, omdøbes af barnet)** er gennemgående følgesvend. Den stiller spørgsmål, siger svar højt og "vokser" (får ny rang) ved nye niveauer.
- **Dinoer** bruges til at tælle og som samleobjekter ("lås en ny dino op").
- **Cyklen** er et roligt gennemgående tema (fx en cykeltur, der bliver længere, jo mere man lærer).
- Alle figurer tegnes i samme bløde pastel-stil (simple, afrundede former; SVG).

## 6. Visuel stil (palette A — blød pastel)

Design-tokens (CSS-variabler):

```
Baggrund (creme):        #F4F1EA
Kort/flade (offwhite):   #FBF8F1
Felt-flade (lys):        #F8F5EE
Primær tekst:            #4A4A45
Sekundær/mutet tekst:    #9A968B
Kant/divider:            #E0D8C8

Aktivitetsfarver (rolige, hver sin):
  Klokken (sage):        #A8C3B8   (mørkere variant #8FB0A4)
  Bogstaver (ler/fersken):#E0B7A0
  Tal (dæmpet blå):      #A9BBD0

Accenter:
  Visere/varm accent:    #C98A6B
  Trofæ (dæmpet guld):   #CBA15A
  Dino (sage-grøn):      #9DB89A
  Cykel (dæmpet blå):    #9AB0C4

Typografi:
  Overskrifter:          Georgia, serif
  Brødtekst/labels:      system-ui, sans-serif
```

- Store trykflader (mindst ~64px) til små fingre.
- Tydelig adskillelse mellem **spørgsmålszone** og **svarzone** (svar i eget felt med egen kant og overskrift "Tryk på det rigtige svar").
- Bløde skygger, afrundede hjørner, ingen hårde kontraster.

## 7. Lyd

- **Blid dansk stemme + bløde lyde**, kan slås fra i forælder-hjørnet.
- Stemme via browserens **Web Speech API** (`speechSynthesis`) med dansk stemme (`da-DK`) — gratis, offline, indbygget i iPad.
- Stemmen siger fx "Klokken er tre", bogstavlyde og tal.
- Diskrete bekræftelseslyde (korte, bløde toner) — **ingen jubel-fanfarer.**
- Lyd udløses kun af brugerens handling (krav for `speechSynthesis` på iOS: første tale skal ske efter et tryk).

## 8. Rolig gamification

Motiverende, men uden overstimulering. Fremgang er knyttet til **ægte færdighed**, ikke tilfældige belønninger.

- **Niveauer:** følger den faglige progression (se klokke-progression i §9). At "level op" betyder, at man har lært nok til næste trin.
- **Trofæer:** stille badges på en **trofæ-hylde**, der kan besøges når som helst. Optjenes ved milepæle (fx "10 rigtige klokkeslæt", "Klar til halve timer").
- **Samling:** lås nye **dinoer** op efterhånden — en blid samlealbum-følelse.
- **Uglen vokser:** får en ny rang/lille tilbehør (fx krone) ved nye niveauer.
- **Cykeltur:** valgfrit roligt fremgangsspor, der bliver længere.
- **Forbud:** ingen blink, ingen høje fanfarer, intet tidspres, ingen pop-ups, ingen daglige "streaks" der presser.

## 9. Klokken (v1 — detaljeret)

**To måder at lege på:**
1. **Se klokken:** et analogt ur vises; barnet vælger blandt **4 svarmuligheder**; uglen siger det rigtige svar højt.
2. **Stil klokken:** uglen beder om et klokkeslæt (fx "Sæt den til halv 4"); barnet trækker viserne på plads.

**Dansk progression (niveauer):**
1. Hele timer ("Klokken er tre")
2. Halve timer ("halv fire" = 3:30 — bemærk dansk "halv" peger på *næste* time)
3. Kvart over / kvart i ("kvart over tre", "kvart i fire")
4. Fem-minutters-intervaller

**Skærmlayout:**
- Øverst: rolig niveau-/trofæ-stribe.
- Spørgsmålszone (på creme-flade): ugle + talebobbel + stort analogt ur.
- Svarzone (eget hvidt felt, sage topstribe, overskrift): 4 svar i 2×2-gitter.
- Rolig, blid bekræftelse ved rigtigt svar; venlig "prøv igen" uden negativ markering ved forkert.

**Dansk tid-til-tekst** er en central, testbar enhed (omsætter timer/minutter til korrekt dansk formulering, inkl. "halv", "kvart over/i", "minutter over/i").

## 10. Forælder-hjørne

- Åbnes diskret (tryk-og-hold på lille tandhjuls-ikon) så barnet ikke rammer det ved uheld.
- Indstillinger: **lyd til/fra**, **valg af niveau/sværhedsgrad**, og **nulstil fremgang**.
- Ingen kontooprettelse, ingen e-mail, intet login.

## 11. Teknisk arkitektur

**Stak:**
- **Vite + TypeScript** (vanilla — ingen tung UI-framework; aktiviteterne er overskuelige DOM/SVG/Canvas-moduler).
- **Ren CSS med design-tokens** (CSS-variabler) — ikke Tailwind, for fuld kontrol over den dæmpede stil.
- **vite-plugin-pwa** til manifest + service worker (offline, installerbar).
- **SVG** til ur, maskot og figurer; **Canvas** hvis en tegneaktivitet tilføjes senere.

**Enheder med klare ansvar (isolation):**

| Enhed | Ansvar | Afhænger af |
|-------|--------|-------------|
| App-skal / forside | Routing mellem forside og aktiviteter | Aktivitetsmoduler |
| `Activity`-interface | Fælles kontrakt: `mount(container)`, `unmount()`, `setLevel(n)` | — |
| Klokke-modul | Implementerer `Activity` for klokken | Audio, Progress, tid-til-tekst |
| `time-to-danish` | Ren funktion: (time, minut) → dansk tekst | — (ingen) |
| Audio-service | Tale (`speechSynthesis`, da-DK) + bløde lyde + mute | — |
| Progress-service | Niveauer, trofæer, samling — gemt i `localStorage` | — |
| Reward/gamification | Beregner optjente trofæer, uglens rang | Progress |
| Theme/tokens | Centrale design-tokens (CSS-variabler) | — |
| Mascot-render | Tegner uglen i forskellige rang-trin | Theme |

**Data:** al fremgang gemmes lokalt i `localStorage` (niveau, trofæer, samling). Ingen konti, ingen server, ingen synkronisering. Privatliv ved design.

## 12. Test

Følger projektstandarderne (Vitest):
- **Unit (vigtigst):** `time-to-danish` (alle progressionstrin og randtilfælde som 12:00, "halv", "kvart i"), progressions-/niveaulogik, trofæ-betingelser.
- **Component/integration:** at klokke-modulet `mount/unmount` korrekt og viser 4 svar.
- **E2E (senere):** Playwright for det kritiske flow "vælg klokken-aktivitet → svar rigtigt → se fremgang".

## 13. Uden for scope (YAGNI)

- Native App Store-app.
- Flere børneprofiler, login, cloud-synkronisering.
- Multiplayer / online.
- Tegne- og hukommelsesaktiviteter (kan overvejes i en senere version).
- Backend / database / API.

## 14. Leverancer pr. version

- **v1:** Forside (3 felter) + forælder-hjørne + Klokken (Se + Stil) med niveau 1-4 + rolig gamification (trofæer, uglens rang, samling-stub) + PWA-opsætning (offline, ikon) + dansk stemme.
- **v2:** Bogstaver & ord.
- **v3:** Tal & tælle (med dino-tælling).

## 15. Åbne punkter

- **Maskottens navn:** "Ugo" som pladsholder; barnet bestemmer endeligt navn (ét sted at ændre).
- **Valg af hosting:** træffes ved deployment (Cloudflare Pages / Netlify / GitHub Pages / Azure Static Web Apps).
