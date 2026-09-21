# Vindra — gedrags-/prikkellogboek voor neurodivergente kinderen

Ingevulde versie van `reference_tracker_app_discovery_framework.md` (geheugen van dit
project) voor de niche die na marktonderzoek werd gekozen als sterkste kandidaat voor
de volgende Nuvo-engine-app — zie `MULTI_APP_STRATEGY.md` voor de onderbouwing/cijfers
achter deze keuze. Dit bestand triggert geen codewijziging in Nuvo zelf; het is het
startdocument voor een **nieuw, apart project**.

**Status: emmer 1+2+3 staan er, `tsc`/`eslint`/`expo-doctor` alle drie volledig schoon.**
Secties 1-10 zijn samen met de gebruiker doorlopen en besloten (2026-09-21), de appnaam
is vastgelegd (zie "Naamgeving"), en dit project zelf is al aangemaakt en gevuld — zie
"Uitvoeringslog"
onderaan voor precies wat er al staat en wat nog moet gebeuren (emmer 3). Sectie 11
(visueel) is bewust nog open.

## 1. Niche & doelgroep

Ouders/verzorgers van kinderen met autisme, ADHD en/of hoge prikkelgevoeligheid
("breder neurodivergent", bewust niet autisme-only) die gedrag, prikkels en stemming
willen bijhouden — voor zichzelf en om te delen met school/behandelaar. Nu vaak losse
Word/PDF-ABC-formulieren of papier: ongestructureerd, lastig te delen.

**Regelgeving-grens**: puur registreren. **Geen** diagnostische claim, **geen**
"detecteert automatisch patronen" — dat duwt richting medisch-hulpmiddel-regelgeving
(MDR), zelfde reden waarom epilepsie-tracking eerder als niche werd afgewezen. Simpele
optellingen/overzichten tonen (zoals Nuvo's dagrapport) mag wel; conclusies trekken
niet.

## 2. Event-typen — wordt `EVENT_TYPES`

| kind | isDuration | varianten | gratis/premium |
|---|---|---|---|
| Gedrag/incident | nee | licht/matig/heftig | **gratis** (de hook-differentiator) |
| Prikkel | nee | geluid/licht/aanraking/geur/anders | premium |
| Stemming | nee | 1-5 schaal of emoji-set | premium |
| Medicatie | nee | vrij tekstveld (welk medicijn) | premium |
| Slaap | ja (start/stop) | — | premium |
| Positief moment/succes | nee | — | premium |

**Besloten (2026-09-21): Gedrag/incident is het gratis type**, niet Stemming.
Onderbouwing:
- Zelfde logica als Nuvo's gratis slaap-event: laat de échte differentiator (snel
  loggen tijdens het moment zelf) direct zien, zonder betaalmuur.
- Vangt het hoogste-inzet-moment (een meltdown), niet een generieke dagelijkse
  check-in — sterkste activatiemoment.
- Voorkomt de "nog een moodtracker"-valkuil: als Stemming het zichtbare gratis
  onderdeel was geweest, voelt de gratis versie als het verzadigde mood-tracker-
  segment dat `MULTI_APP_STRATEGY.md` expliciet afraadt om in te stappen.
- **PDF/rapport-export blijft premium, ook al is loggen zelf gratis** — de gratis
  versie lost alleen "snel vastleggen" op, niet het einddoel ("dit meenemen naar het
  IB-gesprek"). Precies het moment met de hoogste betalingsbereidheid (een aankomende
  afspraak) blijft dus achter het slot. Prikkel/Stemming/Medicatie blijven ook gegated:
  pas de combinatie met Gedrag geeft het volledige beeld dat een behandelaar nodig
  heeft.
- **Bekend, geaccepteerd risico** (zelfde open vraag als bij Nuvo, zie
  `MARKETING_PLAN.md` §1): sommige ouders hebben mogelijk genoeg aan alleen het gratis
  incidentenlogboek en converteren nooit. Pas te meten na launch.

## 3. Wiel-groepering — wordt `DEFAULT_WHEEL_ORDER`

Voorstel, nog niet in detail uitgewerkt: "Gedrag" en "Prikkel" als aparte wielknoppen
(elk met hun eigen sub-opties), "Stemming"/"Medicatie" evt. samen onder één knop,
"Slaap" apart (duur-event), "Overig" voor positief moment + vrije notitie.

## 4. Tijdlijn-kolommen — wordt `TIMELINE_LANES`

4 kolommen, zelfde structuur als Nuvo: **Gedrag/Prikkels** (samen) · **Stemming** ·
**Medicatie** · **Overig** (positief moment + notitie). Slaap: evt. 5e kolom, of onder
"Overig" — nog te bepalen tijdens het bouwen zelf, geen principiële keuze.

## 5. Profiel-niveau — wordt het `child`-equivalent

Kind: naam + geboortedatum, zelfde als Nuvo. **Besloten (2026-09-21): géén
diagnose/label-veld** — bewust weggelaten, te gevoelig om als los invulveld op te
slaan, ook al zou het nooit als medisch feit getoond worden.

## 6. Duur-events — quick-acties

Alleen Slaap (indien meegenomen) krijgt quick-acties, zoals Nuvo's "Einde dag"/"Sinds
middernacht". Overige types zijn momentopnamen, geen quick-acties nodig.

## 7. Dagrapport / PDF

Aantal incidenten/prikkels per dag/week, gemiddelde ernst, meest voorkomende
aanleiding/prikkeltype, stemmingsverloop — export voor school/IB'er/behandelaar. Zelfde
killer-feature-functie als Nuvo's PDF-rapport voor de kinderarts.

## 8. Sync/delen

Waarschijnlijk relevant: ouders onderling + eventueel een begeleider/IB'er die
meekijkt. Nuvo's partner-sync-architectuur (Supabase, end-to-end versleuteld,
`lib/sync.ts`/`lib/crypto.ts`/`supabase/schema.sql`) is vrijwel 1-op-1 herbruikbaar —
wel een nieuw, eigen Supabase-project nodig (niet Nuvo's project hergebruiken).

## 9. Talen

Nederlands eerst — sterkste voordeel uit het onderzoek (geen enkele NL-concurrent
gevonden, zie `MULTI_APP_STRATEGY.md`). Engels later, zelfde "pas doen als NL
aantoonbaar iets trekt"-afweging als bij Nuvo.

## 10. Expliciet buiten scope (fase 1)

- Widgets/Live Activities.
- **Automatische inzichten/AI-patroonherkenning** — bewust vermijden, MDR-risico (zie
  sectie 1). De app registreert, de ouder/behandelaar trekt zelf conclusies.
- Professionele/caseload-features (meerdere cliënten beheren voor een behandelaar) —
  dat is het marktsegment van professionele ABA-tools (bv. TallyFlex), niet deze app.
- Android — zelfde volgorde als Nuvo, iOS eerst.

## 11. Visueel/design — bewust nog open

Nog geen keuze gemaakt tussen "1-op-1 Nuvo's stijl overnemen" (snelste pad: donkere
achtergrond `#12161c`, amber-accent, soft-depth-schaduwstijl) of een eigen visuele
identiteit voor deze app. Aanbevolen om dit pas te doen zodra naam/branding gekozen
wordt — zie `reference_tracker_app_discovery_framework.md` sectie 11 voor de volledige
lijst overneembare tokens.

## Naamgeving (besloten 2026-09-21)

**Appnaam: "Vindra"** — gekozen na hetzelfde soort naamgevingsproces als Nuvo (Mono/
Mira destijds afgewezen op botsingen): eerst 4 korte, taalneutrale "voorloop"-woorden
verkend (Kalmo, Klaro, Ankra, Tilo — elk qua thema goed passend bij kalm/helderheid/
stabiliteit), maar **alle vier afgevallen op een echte botsing**:
- Kalmo — kalmo.com/.nl/.app al bezet door een actief Italiaans bedrijf (Kalmo,
  health-aanpalende B2B-veiligheidssoftware) + fonetisch te dicht bij het wereldwijd
  bekende merk "Calm".
- Tilo — tilo.com/.nl/.app bezet door een bestaand bedrijf met eigen App Store-app, én
  een bestaande App Store-app "Tilo – Time Log & Focus" (zelfde brede categorie:
  loggen) én een kinderapp "Tilo Touch".
- Ankra — een levende App Store-app heet al letterlijk "Ankra" (Flashcards & Quizzes),
  plus "Ankra Health" (AI-gezondheidsplatform).
- Klaro — twee bestaande App Store-apps heten al "Klaro", waarvan één in een
  aanpalende categorie (ademhalings-/ontspanningsoefeningen).

Daarna een tweede ronde met een ander klankpatroon (3 lettergrepen i.p.v. de sterk
"gemijnde" korte CVCV-op-o/-a-vorm): **Vindra** (survivor, samen met "Merla") bleek
schoon — geen relevante app-/merk-botsing in een aanpalende categorie (alleen
onrelevante hits: schoeisel, onderzeese kabels, zaden-bedrijf), en **vindra.nl is
vrij** (vindra.com/.app zijn bezet door onrelevante bedrijven, net als Nuvo destijds
akkoord ging met een bezette kale .com naast een vrije .nl-variant).

**Zichtbare App Store-naam**: `Vindra – Gedragslogboek` — bewust een neutrale,
niet-klinische toevoeging achter de streep, **geen** "Autisme"/"ADHD" in de zichtbare
naam. Reden: die naam staat zichtbaar onder het app-icoon op het beginscherm van de
ouder — net zo gevoelig als het eerder afgewezen diagnose-veld (sectie 5). Specifieke
zoektermen (autisme, ADHD, prikkelgevoelig, meltdown) horen in het **onzichtbare
App Store-keywords-veld**, zelfde scheiding als Nuvo's eigen ASO-aanpak.

## Herziening (2026-09-21): geen "vanaf nul", ook geen volledige repo-kopie — gerichte extractie

Het eerdere uitgangspunt ("niet de Nuvo-repo kopiëren, apart en vers beginnen") was een
bewuste keuze **vóórdat** Nuvo bewezen was. Nu Nuvo feitelijk klaar is (App Store-review),
is dat achterhaald: een fresh `create-expo-app`-scaffold zou opnieuw tegen dezelfde,
al opgeloste lay-out-/gebaar-/safe-area-bugs aanlopen die in Nuvo weken kostten (zie
`project_status.md`-geschiedenis: header-overflow, wiel-label-pivot, tijdlijn-marker-
centrering, safe-area-inzetten op TestFlight, modal-in-modal-nesting, enz.).

**Codeonderzoek bevestigt dat de architectuur al scheidbaar is** zoals `CLAUDE.md`
voorschrijft: `wheel-arc.tsx` (887 regels, hét kernbestand van het gebaar) verwijst
maar 18x naar domain-config — de rest is generieke gebaar-/animatie-/positionerings-
logica. Vandaar: geen blinde repo-kopie (sleept Nuvo-specifieke rommel mee), geen
from-scratch rebuild (hertinkert alles) — een **gerichte, eenmalige bestandsextractie**.

**Bonus-inzicht**: Vindra's "profiel" is óók een kind (een neurodivergent kind), dus
de hele "child"-terminologie/laag (`db/child.ts`, `active-child-context.tsx`,
`children-settings-sheet.tsx`, `birth-date-fields.tsx`) hoeft vermoedelijk **niet
hernoemd** te worden, in tegenstelling tot een niche zonder kind-concept (bv.
mantelzorg) — gewoon overnemen.

### Emmer 1 — pure engine, 1-op-1 kopiëren, geen edits verwacht
`components/wheel/*` (arc/badge/button/handle/ring/inline-input-card),
`components/timeline/{timeline-grid,hour-column,now-line,target-time-line,event-dot,event-capsule}.tsx`,
`components/settings/{settings-sheet-shell,settings-rows}.tsx`,
`components/ui/*` (primary-button/icon-button/icon-symbol(.ios)/event-icon),
`components/themed-text.tsx`, `components/themed-view.tsx`, `components/error-boundary.tsx`,
`lib/color.ts`, `lib/timeline-layout.ts`, `lib/wheel-geometry.ts`, `lib/time.ts`, `lib/time-options.ts`,
`hooks/use-color-scheme{,.web}.ts`, `hooks/use-theme-color.ts`.

### Emmer 2 — herbruikbaar patroon, kopiëren dan licht herbedraden
`lib/i18n/index.tsx` (mechanisme, niet `translations.ts` zelf),
`lib/active-child-context.tsx`, `lib/preferences-context.tsx`,
`components/timeline/onboarding-name-banner.tsx`,
`components/settings/{children-settings-sheet,child-switcher-sheet,child-share-sheet,birth-date-fields}.tsx`,
`lib/backup.ts`, `db/{schema,child,events,day-log,migrate}.ts`,
`lib/sync.ts`, `lib/crypto.ts`, `lib/supabase.ts`, `supabase/schema.sql` (→ **nieuw, eigen
Supabase-project**, niet Nuvo's project hergebruiken),
`lib/purchases.ts`, `lib/purchases-context.tsx`,
`components/paywall/{paywall-screen,entitlement-gate}.tsx`, `components/settings/subscription-sheet.tsx`
(→ nieuwe RevenueCat-entitlement/producten/prijzen), `app/_layout.tsx` (klein, 54 regels,
vooral provider-bedrading).

### Referentie-alleen — te verweven om blind te kopiëren, wel als voorbeeld gebruiken
`app/index.tsx` (811 regels, de hoofdscherm-orkestratie — bind hier alle domain-config
zelf aan elkaar, per definitie uniek per app),
`components/timeline/{event-detail-sheet,lane-header,lane-summary-pills}.tsx`,
`components/settings/{settings-sheet,wheel-settings-sheet}.tsx`,
`components/day/{day-report-sheet,day-picker-sheet}.tsx`.
**Open vraag**: `components/day/day-rating-sheet.tsx` (Nuvo's "hoe was de dag"-dagcijfer,
1-10) — het mechanisme is generiek genoeg (datum + cijfer), beslis tijdens het bouwen of
dit concept ook bij Vindra past.

### Emmer 3 — vers schrijven, geen copy
`constants/event-types.ts`, `constants/timeline-lanes.ts`, `constants/timeline.ts`,
`lib/i18n/translations.ts` (inhoud), `lib/event-summary.ts`, `app.json`/`eas.json`.

## Scaffold-script

```powershell
# 1. Scaffold
New-Item -ItemType Directory -Path "C:\Users\Wouter\Documents\Vindra"
Set-Location "C:\Users\Wouter\Documents\Vindra"
npx create-expo-app@latest .

# 2. Kopieer emmer 1 + 2 uit Nuvo (bestand-voor-bestand, geen hele mappen — voorkomt
#    dat emmer-3-config per ongeluk meekomt)
$nuvo = "C:\Users\Wouter\Documents\BabyTracker"
$files = @(
  # --- Emmer 1: pure engine ---
  "components\wheel\wheel-arc.tsx","components\wheel\wheel-badge.tsx",
  "components\wheel\wheel-button.tsx","components\wheel\wheel-handle.tsx",
  "components\wheel\wheel-ring.tsx","components\wheel\inline-input-card.tsx",
  "components\timeline\timeline-grid.tsx","components\timeline\hour-column.tsx",
  "components\timeline\now-line.tsx","components\timeline\target-time-line.tsx",
  "components\timeline\event-dot.tsx","components\timeline\event-capsule.tsx",
  "components\settings\settings-sheet-shell.tsx","components\settings\settings-rows.tsx",
  "components\ui\primary-button.tsx","components\ui\icon-button.tsx",
  "components\ui\icon-symbol.tsx","components\ui\icon-symbol.ios.tsx",
  "components\ui\event-icon.tsx","components\themed-text.tsx","components\themed-view.tsx",
  "components\error-boundary.tsx","lib\color.ts","lib\timeline-layout.ts",
  "lib\wheel-geometry.ts","lib\time.ts","lib\time-options.ts",
  "hooks\use-color-scheme.ts","hooks\use-color-scheme.web.ts","hooks\use-theme-color.ts",
  # --- Emmer 2: herbruikbaar patroon, licht herbedraden na kopie ---
  "lib\i18n\index.tsx","lib\active-child-context.tsx","lib\preferences-context.tsx",
  "components\timeline\onboarding-name-banner.tsx",
  "components\settings\children-settings-sheet.tsx","components\settings\child-switcher-sheet.tsx",
  "components\settings\child-share-sheet.tsx","components\settings\birth-date-fields.tsx",
  "lib\backup.ts","db\schema.ts","db\child.ts","db\events.ts","db\day-log.ts","db\migrate.ts",
  "lib\sync.ts","lib\crypto.ts","lib\supabase.ts","supabase\schema.sql",
  "lib\purchases.ts","lib\purchases-context.tsx",
  "components\paywall\paywall-screen.tsx","components\paywall\entitlement-gate.tsx",
  "components\settings\subscription-sheet.tsx","app\_layout.tsx"
)
foreach ($f in $files) {
  $dest = Join-Path (Get-Location) $f
  New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
  Copy-Item (Join-Path $nuvo $f) $dest -Force
}

# 3. Daarna pas: claude starten en verder met emmer 3 (constants/event-types.ts,
#    timeline-lanes.ts, i18n-teksten, app.json-branding) + app/index.tsx als voorbeeld
#    ernaast houden, niet klakkeloos kopiëren.
claude
```

**Eerste bericht in die nieuwe Claude Code-sessie**: vraag om twee geheugenbestanden op
te halen uit `C:\Users\Wouter\.claude\projects\C--Users-Wouter-Documents-BabyTracker\memory\`
en in het geheugen van het nieuwe project te zetten (geheugen is per werkmap gescoped,
laadt niet vanzelf mee):
- `reference_app_store_launch_playbook.md` — herbruikbaar Apple/RevenueCat/EAS-draaiboek.
- `reference_tracker_app_discovery_framework.md` — het framework (dit bestand hier is de
  al ingevulde versie voor déze niche, kopieer 'm mee zodat 'ie niet opnieuw bedacht
  hoeft te worden).

Dependencies (`expo-sqlite`, `react-native-gesture-handler`/`reanimated`, `expo-linear-gradient`,
Supabase/crypto-pakketten, `react-native-purchases`, enz.) pas installeren zodra de
bijbehorende sectie daadwerkelijk gebruikt wordt — zie de tabel in
`reference_tracker_app_discovery_framework.md` sectie 0. Na het kopiëren: `npx expo
install --fix` om versies met de nieuwe SDK te matchen, en verwacht een paar losse
TypeScript-fouten waar emmer-2-bestanden nog naar niet-bestaande emmer-3-config
(`event-types.ts` etc.) verwijzen — dat is verwacht, lost zich op zodra die geschreven zijn.

## Uitvoeringslog (2026-09-21) — dit is al gedaan, niet opnieuw doen

Scaffolden + kopiëren is **al uitgevoerd** (niet door de gebruiker handmatig, maar
rechtstreeks door Claude Code met tool-toegang tot deze machine). Dit project bestaat
al en compileert. Twee onverwachte, belangrijke ontdekkingen onderweg:

### 1. Het Expo-default-template is veranderd: `src/`-layout, niet root-level

`npx create-expo-app@latest .` (SDK 57) scaffoldt tegenwoordig met een **`src/`-map**
(`src/app`, `src/components`, `src/hooks`, `src/constants`, plus een `src/global.css`),
niet de root-level `app/`/`components/`-structuur die Nuvo gebruikt. `tsconfig.json`'s
`@/*`-alias wijst hier dus naar `./src/*`, niet naar de repo-root. Precies waar
`AGENTS.md` voor waarschuwt ("Expo HAS CHANGED").

**Goed nieuws**: alle gekopieerde Nuvo-bestanden gebruiken uitsluitend `@/`-alias-
imports (geen relatieve `../`-paden) — dus alles simpelweg ónder `src/` neerzetten in
plaats van op de root loste dit volledig op, **zonder een enkele import-regel aan te
passen**. Dat bevestigt nog een keer hoe goed config-gedreven/scheidbaar de architectuur
al was.

**Wat dit betekent voor toekomstige apps na Vindra**: check bij het scaffolden altijd
eerst of `create-expo-app` nog steeds een `src/`-layout gebruikt (kan bij een latere
SDK weer veranderen) — zie de bijgewerkte `reference_tracker_app_discovery_framework.md`.

Het nieuwe template's eigen demo-schermen (`explore.tsx`, `app-tabs.tsx`,
`animated-icon.tsx`, `hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx`) zijn
verwijderd — ze gebruiken een rijkere `ThemedText`/`ThemedView`-API (`type="small"`,
`themeColor`, enz.) dan Nuvo's simpelere versie, en niets van de gekopieerde
engine-code gebruikt ze sowieso. `src/app/index.tsx` is vervangen door een minimale
placeholder ("Vindra — hoofdscherm nog te bouwen") in afwachting van het echte,
domeinspecifieke hoofdscherm (emmer 3).

### 2. Alle benodigde packages zijn al geïnstalleerd

`npx expo install expo-sqlite expo-linear-gradient expo-haptics expo-camera expo-print
expo-sharing expo-document-picker expo-file-system expo-crypto expo-localization
@expo/vector-icons react-native-purchases @supabase/supabase-js tweetnacl
tweetnacl-util react-native-qrcode-svg` is al gedraaid. `npx tsc --noEmit` geeft nu
**uitsluitend** de verwachte emmer-3-gaten (`@/constants/event-types`,
`@/constants/timeline`, `@/lib/event-summary`, `@/lib/i18n/translations` bestaan nog
niet) plus een onschuldige `src/constants/theme.ts`-quirk (`@/global.css`-type
verschijnt vanzelf na de eerste `expo start`, onafhankelijk van dit project).

### 3. Belangrijke zijvondst: Nuvo's eigen `npm run lint` was stil kapot (stale)

Bij het linten van Vindra kwamen 4 **echte, pre-existente** React Compiler-
zuiverheidsfouten naar boven in de letterlijk gekopieerde Nuvo-code:
- `lib/preferences-context.tsx:49` en `lib/purchases-context.tsx:58` — `refresh()`
  (dat zelf `setState` doet) rechtstreeks aangeroepen in een `useEffect`-body.
- `lib/sync.ts:220` — een ref (`onChangedRef.current = onChanged`) bijgewerkt tijdens
  render i.p.v. in een effect.

**Bevestigd dat dit ook in Nuvo zelf zit, nu, ongefixt**: `npx eslint . --no-cache` in
de BabyTracker-repo vindt dezelfde 3 fouten (+ een losse `metro.config.js`-regel-
definitie-fout). `npm run lint` (via de `expo lint`-wrapper) rapporteert daar ten
onrechte "schoon" — die wrapper linarmant blijkbaar niet hetzelfde bestandenbereik als
kaal `npx eslint .`. **Nog niet gefixt in Nuvo zelf, nog niet gevraagd door de
gebruiker** — wel gemeld. Zie de sessie van 2026-09-21 voor de volledige context.

### Wat écht nog moet gebeuren (emmer 3, ongewijzigd t.o.v. eerder in dit document)

`src/constants/event-types.ts`, `src/constants/timeline-lanes.ts`,
`src/constants/timeline.ts`, `src/lib/i18n/translations.ts`, `src/lib/event-summary.ts`,
`app.json`-branding, en daarna het echte `src/app/index.tsx`-hoofdscherm (met
`app/index.tsx` uit de Nuvo-repo ernaast als voorbeeld, niet blind kopiëren).

## Update 2026-09-21, later dezelfde sessie — emmer 3 geschreven, `tsc`/`eslint`/`expo-doctor` alle drie schoon

**Domeinmodel vastgelegd** (`src/constants/event-types.ts`): 6 event-typen, geen
wielgroepen (elk staat al op zichzelf) — `gedrag` (gratis, licht/matig/heftig-varianten),
`prikkel` (premium, geluid/licht/aanraking/geur/anders), `stemming` (premium, 5-punts-
schaal met `sentiment-*`-iconen), `medicatie` (premium, geen varianten — vrije notitie),
`slaap` (premium, duur-event, in tegenstelling tot Nuvo waar slaap juist het gratis type
was), `positief` (premium). Alle iconen (`report-problem`, `lightning-bolt`,
`ear-hearing`, `hand-back-right`, `flower`, `mood`, `sentiment-very-dissatisfied` t/m
`sentiment-very-satisfied`, `medication`, `bedtime`, `wb-sunny`, `star`) **geverifieerd
tegen de echte, geïnstalleerde `@expo/vector-icons`-glyph-map** vóór gebruik (zelfde
discipline als Nuvo's eigen iconen-geschiedenis, die ooit stilzwijgend verkeerde namen
had) — één kandidaat (`nose`) bleek niet te bestaan en is niet gebruikt.

**Tijdlijn-kolommen** (`src/constants/timeline-lanes.ts`): 4 lanes — `behavior`
(gedrag+prikkel), `mood` (stemming), `medication` (medicatie), `other` (slaap+positief,
dezelfde "waar laat je slaap nog niet-beslist"-vraag uit sectie 4 hiermee opgelost).

**i18n** (`src/lib/i18n/translations.ts`): alleen **NL is een echte vertaling** (conform
sectie 9, "Nederlands eerst"); EN/DE/ES/FR/PT zijn bewust 1-op-1 NL-aliassen, puur zodat
het ongewijzigd overgenomen `lib/i18n/index.tsx` (verwacht alle 6) compileert — **geen
echte vertaling, TODO zodra NL zich bewijst**, precies zoals besloten. Subscription-
copy (`benefit1/2/3`) aangepast aan Vindra's features (alle logboek-typen, rapporten
delen met school/behandelaar, sync tussen ouders/verzorgers) i.p.v. Nuvo's tekst.

**Belangrijke, onverwachte vondst: `wheel-arc.tsx` was tóch niet 100% domain-neutraal.**
Ondanks de eerdere aanname (18 generieke `EVENT_TYPES`-verwijzingen, geen hardcoded
strings) bleek er één regel te zitten die specifiek `activeKind === 'spit_up'` checkte
(voor Nuvo's koorts-temperatuurinvoer) — een niet-config-gedreven uitzondering op
verder overal config-gedreven code. **Enige bewuste aanpassing in een "pure engine"-
bestand tot nu toe**: `isFeverEntry` teruggebracht naar een simpele `false` met uitleg
in een comment; de rest van de temperatuur-machinerie (state/velden) blijft ongebruikt
maar aanwezig staan. Zie de bijgewerkte `reference_tracker_app_discovery_framework.md`
voor deze les, relevant voor élke toekomstige app die `wheel-arc.tsx` hergebruikt.

**Hergebruikt zonder enige wijziging** (bevestigt de architectuur-aanname): `db/schema.ts`/
`db/events.ts` — de kolommen `amount_ml`/`side`/`temperature_c` bestaan nog in de tabel
maar worden door geen enkel Vindra-event-type gebruikt (blijven permanent NULL, geen
migratie nodig — zelfde "laat een ongebruikte kolom gewoon staan"-precedent als Nuvo's
eigen `portion`-kolom). `kind`/`variant`/`note` dekken alles wat Vindra nodig heeft.

**Nog niet aangepakt, bekende vervolgstappen**:
- `src/app/index.tsx` — nog steeds de minimale placeholder, het echte hoofdscherm moet
  nog geschreven worden (met Nuvo's `app/index.tsx`, 811 regels, als voorbeeld ernaast).
- `children-settings-sheet.tsx`/`settings-rows.tsx` (bucket 2, ongewijzigd overgenomen)
  tonen vermoedelijk nog een "Temperatuur-eenheid"/"Volume-eenheid"-instellingenrij die
  voor Vindra zinloos is (niets gebruikt die velden) — cosmetische opruiming, geen
  blokkerend probleem, nog niet gedaan.
- `app.json` staat nog op het kale scaffold-default (naam "vindra" met kleine letter,
  geen eigen bundle-ID/icoon/kleurenschema) — branding/sectie 11 moet nog.
- `day-report-sheet.tsx`/`day-rating-sheet.tsx`/`lane-header.tsx`/`lane-summary-pills.tsx`
  zijn nog "referentie-alleen", niet gekopieerd — nodig zodra het echte hoofdscherm
  gebouwd wordt.

**Verificatie**: `npx tsc --noEmit`, `npx eslint . --no-cache` en `npx expo-doctor`
(21/21, na het installeren van de ontbrekende peer dependency `react-native-svg` voor
`react-native-qrcode-svg`) staan alle drie volledig schoon.

## Update 2026-09-21, zelfde sessie — het echte hoofdscherm staat er, project is functioneel compleet voor een eerste testrun

`src/app/index.tsx` bleek bij daadwerkelijk lezen **wél** vrijwel volledig generiek te
zijn (geen hardcoded event-kind-literals — alles via `EVENT_TYPES`/`TIMELINE_LANES`,
inclusief de complexe pinch-zoom/lang-druk-verslepen-gebaren) — de eerdere
"referentie-alleen, te verweven"-inschatting was te voorzichtig. Overgezet en, samen
met de schermen die het nodig heeft, geverifieerd:

- `src/app/index.tsx` — 1-op-1 overgenomen, geen wijzigingen nodig.
- `lane-header.tsx`, `lane-summary-pills.tsx` — 1-op-1, op één plek na:
  `lane-summary-pills.tsx`'s `SUMMARY_FORMATTERS`-mapping was hardcoded op Nuvo's
  lane-id's (`sleep`/`feeding`/`diaper`/`other`) — bijgewerkt naar Vindra's
  (`behavior`/`mood`/`medication`/`other`).
- `event-detail-sheet.tsx` — verwachtte `formatTemperature`/`formatVolume` uit
  `lib/event-summary.ts`, die ik eerder had weggelaten. Teruggezet als kleine, generieke
  functies (nooit aangeroepen voor Vindra's event-typen omdat `amount_ml`/
  `temperature_c` altijd NULL blijven, maar nu compileert het zonder het bestand zelf
  aan te hoeven passen).
- `day-picker-sheet.tsx` — 1-op-1, geen wijzigingen.
- `day-report-sheet.tsx` — **wel echt herschreven** (was al als "referentie-alleen"
  aangemerkt, klopte): Nuvo's "voeding"-uitsplitsing (fles/water/borstvoeding, met
  ml-totalen) vervangen door een "Gedrag"-uitsplitsing per ernst (licht/matig/heftig,
  met aantallen) — zelfde soort prominente rij, andere inhoud. Sleep-total-rij
  hergebruikt (kind `'sleep'` → `'slaap'`).
- `settings-sheet.tsx`, `child-switcher-sheet.tsx`, `wheel-settings-sheet.tsx` — 1-op-1,
  op de aangekondigde opruiming na: de "Temperatuur-eenheid"/"Volume-eenheid"-rijen
  verwijderd uit `settings-sheet.tsx` (zinloos, geen Vindra-event-type gebruikt ze) —
  `tempUnit`/`volumeUnit` blijven als ongebruikte state bestaan zodat `save()` niet
  hoefde te veranderen.

**Nog een "wheel-arc.tsx was niet 100% domain-neutraal"-vondst** (tweede van dit
type, zie ook eerder in dit logboek en de bijgewerkte
`reference_tracker_app_discovery_framework.md`): `activeKind === 'spit_up'` bleek een
losse, niet-config-gedreven check voor Nuvo's koorts-temperatuurinvoer. Teruggebracht
naar `const isFeverEntry = false;` met een uitlegcomment — enige aanpassing in dit
bestand.

**Eindstatus**: `npx tsc --noEmit` (alleen nog de bekende, onschuldige
`global.css`-template-quirk), `npx eslint . --no-cache` (0 fouten, 0 waarschuwingen) en
`npx expo-doctor` (21/21) staan alle drie schoon. Elk scherm dat de app nodig heeft om
te draaien (tijdlijn, wiel, instellingen, dagrapport, kind-wisselaar, dagcijfer,
dagkiezer) staat er en compileert.

**Nog open, écht pas te doen vanuit een interactieve shell**:
- `npx expo start` draaien en met Expo Go op de telefoon daadwerkelijk testen — nog
  geen enkele regel hiervan is op een toestel bevestigd.
- `app.json` staat nog op het kale scaffold-default (naam "vindra" met kleine letter,
  geen eigen bundle-ID/icoon/kleurenschema) — pas doen zodra er getest is dat de app
  sowieso draait, geen blokkerend probleem voor een eerste testrun.
- Een eigen, nieuw Supabase-project (voor partner-sync) en een nieuwe RevenueCat-app/
  entitlement — pas nodig zodra die features getest worden, niet voor een eerste
  "draait het wiel/de tijdlijn"-test.

## Update 2026-09-21 — eerste echte testrun op toestel, feedback verwerkt

Eerste keer dat Vindra op een fysiek toestel draaide. Screenshots gedeeld, feedback
verwerkt:

**Direct gefixt**:
- Onboardingbanner "Hoe heet je kindje?" → "Hoe heet je kind?" (het verkleinwoord
  "kindje" leest baby-specifiek; Vindra's doelgroep omvat ook oudere kinderen/tieners).
- Dagverslag-pillen (Medicatie/Stemming/Positief) tonen nu een tekstlabel naast het
  icoon+aantal i.p.v. alleen icoon+aantal.

**Onderzocht, geen bug gebleken**:
- Overlappende tijdlijn-stipjes en niet-leesbare prikkel-icoontjes: zelfde oorzaak,
  geen layout-bug. `DOT_SIZE`/`DOT_GAP`/`MIN_LANE_WIDTH` zijn identiek aan Nuvo, en
  Nuvo's "Voeding"-baan combineert al 5 kinds (meer dan Vindra's 2). Het label-onder-
  icoon-mechanisme (`showDetail = column === 0 && pixelsPerHour >= 90`, standaard-zoom
  is 110) bestaat al en werkt — bij een testburst (veel events snel na elkaar) belanden
  events in latere kolommen, die verliezen bewust hun label om de tijdlijn niet te
  overladen. Bij natuurlijker gebruikstempo zou dit zich niet zo voordoen.
- Het blauwe gloeiende tandwiel-icoon: Expo's eigen dev-menu-knop, geen Vindra-UI.

**Onderzoek gedaan (fork), twee besluiten genomen naar aanleiding daarvan** (beide
"Recommended"-optie gekozen door de gebruiker):

1. **"Gedrag" uitgebreid met ABC-methodiek-velden** — aanleiding/plek/wat-hielp,
   naast de bestaande ernst (licht/matig/heftig). Onderzoek wees uit dat dit de
   grootste inhoudelijke lacune was t.o.v. zowel de sterkste concurrent (Behavior
   Tracker ABC) als de klassieke ABC-methodiek die begeleiders gebruiken — zonder deze
   velden kan een rapport niet beantwoorden waar ouders een behandelaar mee benaderen
   ("wat triggert dit, en wat hielp?"). **Bewust niet in het snel-log-wiel zelf**
   (moet binnen 30 seconden blijven werken tijdens een moeilijk moment) — ingevuld via
   het bewerkscherm (`event-detail-sheet.tsx`), achteraf, met meer tijd/rust.
   - Nieuwe DB-migratie `CREATE_SCHEMA_V12` (`db/schema.ts`/`migrate.ts`): 3 nullable
     TEXT-kolommen (`antecedent`, `location`, `what_helped`) op de `event`-tabel.
   - `db/events.ts`: `EventRow`, `insertMomentEvent`, `importEventRow`,
     `applyRemoteEvent` (sync-roundtrip) en `updateEventEdit` bijgewerkt.
   - `event-detail-sheet.tsx`: 3 nieuwe, optionele tekstvelden, **alleen zichtbaar bij
     `event.kind === 'gedrag'`**.
   - Kleiner, optioneel gat uit hetzelfde onderzoek — Dunn's Sensory Profile-model
     (drempel + opzoeken-vs-vermijden) voor "Prikkel" — **nog niet doorgevoerd**, geen
     essentiële v1-toevoeging volgens het onderzoek.
2. **"Soft depth"-gloed getemperd over de hele app**, vóór er meer schermen op deze
   stijl gebouwd worden. Onderzoek naar UX-richtlijnen voor deze doelgroep: donker
   thema + gedempte kleuren per type blijven goed, maar de gelaagde gloed/gradiënt-
   intensiteit botst met richtlijnen voor neurodivergente gebruikers/verzorgers — juist
   relevant omdat ouders vaak loggen vlak ná of tijdens een moeilijk moment (onder
   stress telt visuele rust zwaarder). Systematisch getemperd (niet volledig
   verwijderd) over 14 bestanden: `wheel-button.tsx`, `wheel-badge.tsx`,
   `wheel-handle.tsx`, `inline-input-card.tsx`, `icon-button.tsx`, `primary-button.tsx`,
   `event-capsule.tsx`, `event-dot.tsx`, `lane-summary-pills.tsx`, `settings-rows.tsx`,
   `onboarding-name-banner.tsx`, `paywall-screen.tsx` — `shadowOpacity` grofweg
   gehalveerd tot een derde, `lighten()`-gradiëntcontrast van ~0,3 naar ~0,1-0,12, de
   glazige "gloss cap" op wielknoppen van 0,38 naar 0,14 alfa. De subtiele donkere
   paneel-achtergrondgradiënten (bv. `#212832`→`#171b21`) zijn **niet** aangepast — die
   zijn al gedempt, geen glans/gloed-probleem.

**Nog open, bewust niet nu al aangepakt**:
- Of het label-bij-eerste-kolom-mechanisme voldoende is voor deze doelgroep bij écht
  snel achter elkaar loggen (bv. tijdens een meltdown) — pas te beoordelen na meer
  natuurlijk gebruik, geen aanwijzing dat het nu al een probleem is.
- Sensory Profile-uitbreiding van "Prikkel" (drempel/opzoeken-vs-vermijden).

**Verificatie**: `npx tsc --noEmit` en `npx eslint . --no-cache` staan na alle
bovenstaande wijzigingen nog steeds volledig schoon.

## Update 2026-09-21 — backup naar GitHub + code-review-ronde

**Backup**: beide repo's (Nuvo en Vindra) stonden tot nu toe alleen lokaal — geen
git-remote, Vindra had zelfs nog geen eerste commit. Opgelost: eerste commit (`866d3fb`)
gemaakt, beide repo's als **private** GitHub-repo's aangemaakt onder `wmm1tm` en
gepusht (`github.com/wmm1tm/nuvo`, `github.com/wmm1tm/vindra`, branch hernoemd van
`master` naar `main`). Op een andere computer: gewoon clonen + `npm install`, geen
losse `.env`/geheimen buiten de repo. Expo/EAS-login en Apple-account blijven
handmatige stappen (accountsessies, geen bestanden).

**Code-review** (volledige codebase, want nog geen eerdere commit om tegen te diffen):
10 bevindingen, allemaal apart geverifieerd. Gefixt:
- `db/events.ts`: `importEventRow`/`applyRemoteEvent` misten `?? null` op de nieuwe
  ABC-velden — een oude back-up/sync-payload zonder die velden (`undefined` i.p.v.
  `null`) zou de hele rij stil laten falen bij elke poging.
- `lib/event-summary.ts`: `formatGroupBadge` liet het aantal Positief-momenten
  verdwijnen zodra er ook slaap-minuten in dezelfde ("Overig"-)baan zaten — Nuvo's
  gegroepeerde banen mixen nooit duur- met momentopname-typen, Vindra's "Overig" wel.
  Nu tonen beide (bv. "35m · 2×").
- `components/paywall/paywall-screen.tsx`: linkte per ongeluk naar **Nuvo's**
  privacybeleid (copy-pastefout uit de bucket-2-overname) — nu `null` + een duidelijke
  "nog niet beschikbaar"-melding i.p.v. de verkeerde app te tonen aan een betalende
  gebruiker.
- `components/timeline/event-detail-sheet.tsx`: `handleSave` had geen `.catch()` — een
  mislukte schrijfactie liet de modal stil openstaan, leek dan geen wijziging opgeslagen.
- `app/_layout.tsx`: verouderde comment beweerde "alleen slapen is gratis" (klopte voor
  Nuvo, niet voor Vindra — hier is "gedrag" het gratis type).

**Bewust niet gefixt, besproken en besloten**:
- Paywall valt terug op "volledig ontgrendeld" zonder RevenueCat-API-key — bewuste
  Nuvo-conventie, geen bug.
- Partner-sync checkt entitlement niet op het ontvangende toestel (zit al zo in Nuvo)
  — gebruiker koos "laten zoals het is", verdedigbaar als gezinsfunctie.
- Een premium duur-event (Slaap) kan niet via het wiel gestopt worden als het
  abonnement er middenin afloopt — kan in Nuvo niet gebeuren (daar is slaap het enige
  duur-type én gratis), hier wel doordat Slaap premium is. Gebruiker koos "later" —
  werkt al via het bewerkscherm als omweg, randgeval, niet blokkerend.

**Verificatie**: `npx tsc --noEmit` en `npx eslint . --no-cache` weer volledig schoon
na deze ronde fixes.
