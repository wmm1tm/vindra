# Vindra — gedrags-/prikkellogboek voor neurodivergente kinderen

> **Noot 2026-09-22:** de hieronder genoemde `reference_app_store_launch_playbook.md` en
> `reference_tracker_app_discovery_framework.md` zijn samengevoegd in
> `C:\Users\Wouter\Documents\App Launch Playbook\` (`App Store Launch Playbook.md`,
> `Nieuwe App Framework.md`, `Website en Landingspagina.md`). Verwijzingen hieronder zijn historisch.

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

## Update 2026-09-21 — Dunn's Sensory Profile-uitbreiding voor "Prikkel" alsnog gebouwd

Het eerder als "optioneel, niet essentieel voor v1" bestempelde punt uit het look-and-
feel-/tracking-onderzoek: op verzoek alsnog gebouwd, zelfde patroon als de ABC-velden
bij Gedrag (sectie hierboven) — twee onafhankelijke, optionele classificaties, **niet**
in het snel-log-wiel maar achteraf in te vullen via `event-detail-sheet.tsx`, alleen
zichtbaar bij `event.kind === 'prikkel'`:

- **Gevoeligheid/drempel** (`sensory_threshold`): "Merkte het meteen" (laag) vs. "Had
  er veel voor nodig" (hoog).
- **Reactie** (`sensory_response`): "Zocht het juist op" (opzoekend) vs. "Vermeed het"
  (vermijdend).

Technisch identiek stramien als V12: nieuwe migratie `CREATE_SCHEMA_V13` (2 nullable
TEXT-kolommen op `event`), `db/events.ts` (`EventRow`, `insertMomentEvent`,
`importEventRow`, `applyRemoteEvent` mét `?? null`-fallback, `updateEventEdit`) en de
UI in `event-detail-sheet.tsx` (pill-selectors, toggle aan/uit per keuze i.p.v. verplicht
één optie). `DATABASE_VERSION` nu 13.

**Verificatie**: `npx tsc --noEmit` en `npx eslint . --no-cache` volledig schoon.

## Update 2026-09-21 — event-typen uitgebreid naar Nuvo's eigen wielomvang (8), catalogus nu 12

Op verzoek: onderzoek naar wat professionals/andere apps in dit vakgebied loggen
(ABA-metrics: frequentie/duur/latentie/intensiteit — grotendeels al gedekt — plus
specifieke gedragscategorieën die Guiding Growth/ClarityDTX apart bijhouden), Nuvo's
eigen wiel als ijkpunt genomen (8 knoppen na groepering: feeding, solid_food, diaper,
sleep, spit_up, vitamin_d, bath, **custom**), en het ontbrekende "Overig"-vangnet-type
alsnog toegevoegd.

**Nieuw `defaultEnabled`-mechanisme** op `WheelEntry` (`constants/event-types.ts`):
staat een type standaard aan op een vers wiel, of moet het via "Wiel aanpassen"
handmatig aangezet worden? `resolveWheelOrder(null)` filtert er nu op i.p.v. altijd de
volledige `DEFAULT_WHEEL_ORDER` terug te geven. Nieuwe `MAX_ACTIVE_WHEEL_ENTRIES = 8`
(Nuvo's eigen plafond — de boog-geometrie in `lib/wheel-geometry.ts` is nooit met meer
getest) wordt hard afgedwongen, zowel in `resolveWheelOrder` (kapt een te lange
opgeslagen lijst af) als in `wheel-settings-sheet.tsx` (blokkeert het aanvinken van een
9e knop met een duidelijke melding).

**6 nieuwe event-typen** (`EVENT_TYPES`), waarvan er 1 standaard aan staat en 5 standaard uit:
- **Overig** (`defaultEnabled` ontbreekt = standaard aan) — het ontbrekende vangnet-type,
  1-op-1 Nuvo's `custom`: direct loggen, geen tweede keuzelaag.
- **Zelfverwonding** (uit) — ernst licht/matig/heftig, hergebruikt dezelfde variant-
  id's/labels als Gedrag. Krijgt ook de ABC-velden (aanleiding/plek/wat hielp) in
  `event-detail-sheet.tsx`, zelfde klinische relevantie als Gedrag.
- **Weglopen** (uit) — momentopname, geen tweede keuzelaag, krijgt ook de ABC-velden.
- **Stimmen** (uit) — handen fladderen/geluiden maken/wiegen/anders. Bewust neutrale
  framing (geen "probleem"-toon) — stimmen is vaak zelfregulerend, niet per se negatief.
- **Eten** (uit) — geweigerd/nieuw geprobeerd/gegeten, voor eetselectiviteit.
- **Zindelijkheid** (uit) — geslaagd/ongelukje.

Alle iconen vooraf geverifieerd tegen de echte glyph-map (zelfde discipline als eerder).
**Tijdlijn-kolommen** (`timeline-lanes.ts`) uitgebreid: de drie behavior-achtige nieuwe
typen bij "Gedrag/Prikkels", de drie overige bij "Overig" — een lane moet elk `EventKind`
dekken, ook als het wiel het (nog) niet toont, anders gooit de runtime-check in
`timeline-lanes.ts` een `Error` bij het opstarten.

**Volgorde op het wiel** (array-volgorde = positie op de boog, zie
`lib/wheel-geometry.ts`): gedrag (gratis anker) → prikkel → zelfverwonding/weglopen/
stimmen (gedrag-cluster) → stemming → medicatie → slaap → eten/zindelijkheid
("overige"-cluster) → positief → **overig laatst** (zelfde afsluitende positie als
Nuvo's `custom`).

**Wat bewust niet is gedaan**: `Weglopen` en de andere momentopname-typen kregen geen
Sensory-Profile- of ABC-velden waar dat niet evident zinvol is (bv. Stimmen/Eten/
Zindelijkheid) — alleen Gedrag/Zelfverwonding/Weglopen (allemaal "iets ging mis, wat
ging eraan vooraf"-achtige gebeurtenissen) en Prikkel (Sensory Profile) kregen de
uitgebreide velden.

**Verificatie**: `npx tsc --noEmit`, `npx eslint . --no-cache` schoon, en een losse
Node-check dat alle 12 `EventKind`s precies één keer in `TIMELINE_LANES` voorkomen
(de runtime-`throw`-check zelf kan pas bij het daadwerkelijk opstarten van de app
gecontroleerd worden, dat is nog niet gebeurd op een toestel).

## Update 2026-09-21 — terminologie afgestemd op het werkveld (NL ergotherapie/gedragstherapie)

Op verzoek: alle klinisch-relevante tekst (event-opties, ABC-/Sensory-Profile-velden)
nagelopen op vakjargon i.p.v. spreektaal. Onderzocht wat de daadwerkelijke Nederlandse
praktijktermen zijn (ergotherapie/sensorische-informatieverwerking, ABC-
gedragsobservatie) i.p.v. zelf iets te verzinnen:

- **Stemmingsschaal**: "Erg naar/Naar/Neutraal/Goed/Erg goed" (spreektaal) →
  **"Zeer negatief/Negatief/Neutraal/Positief/Zeer positief"** — standaard
  psychometrisch-neutrale valentie-schaal.
- **Ernstschaal**: "Heftig" → **"Ernstig"** (gedrag én zelfverwonding, delen dezelfde
  Dictionary-sleutel) — sluit aan bij hoe klinische ernstschalen dit benoemen
  (licht/matig/ernstig).
- **Sensory Profile-veld "Gevoeligheid"** → **"Prikkeldrempel"** — dit is letterlijk de
  Nederlandse vakterm uit Winnie Dunn's sensorisch-profiel-model, bevestigd via
  ergotherapie-bronnen (Sensonate, Buromare). De pil-knoppen zelf zijn kort/klinisch
  ("Lage drempel"/"Hoge drempel"), met een aparte uitlegregel eronder voor ouders die de
  term nog niet kennen.
- **Sensory Profile-veld "Reactie"**: "Zocht het juist op" → **"Actief opzoekend"**/
  "Vermeed het" → **"Actief vermijdend"** — volgt Dunn's eigen terminologie voor
  "actieve zelfregulatiestrategie" (opzoeken vs. vermijden), i.p.v. losse eigen
  formulering.
- **ABC-veld "Plek"** → **"Locatie"** — zelfde veldnaam als in professionele
  gedragsobservatie-formulieren (bv. UMCG's eigen ABC-schema-document).

**Bewust ongewijzigd gelaten, met onderbouwing**: "Zindelijkheid"-optie "Ongelukje" (in
pediatrische zindelijkheidstraining is juist zachte, niet-beschamende taal een bewust
klinisch principe, geen te casual woordkeuze); "Stimmen" (in de hedendaagse NL-
autismegemeenschap en -praktijk een geaccepteerde, neutrale term — het formelere
alternatief "zelfstimulerend gedrag" is stijver, niet per se "beter"); "Positief moment"
(duidelijk en niet onprofessioneel, geen sterkere vakterm nodig voor een korte
knoplabel).

**Verificatie**: `npx tsc --noEmit` en `npx eslint . --no-cache` schoon.

## Update 2026-09-21 — help-scherm toegevoegd (?-icoon in de header)

Nieuw, Vindra-specifiek (geen Nuvo-equivalent — Nuvo's feature-set is kleiner/
vanzelfsprekender): een `?`-icoon naast de ster in de header opent `HelpSheet`
(`components/help/help-sheet.tsx`), met vijf korte secties — snel loggen, wiel
aanpassen (incl. de max-8/conditie-specifieke-typen-uitleg), rapport-export,
delen met een andere ouder/begeleider, en privacy. Vooral bedoeld om het "Wiel
aanpassen"-concept (typen die je zelf aan/uit zet) vindbaar te maken — dat is minder
vanzelfsprekend te ontdekken dan de rest van de app.

Header telt nu 6 knoppen i.p.v. 5 (?, ster, klembord, wissel, nacht, instellingen) —
zelfde overflow-mechanisme (`headerTitleShrink`) vangt dit op zoals het al voor 5 deed,
maar de titelkolom wordt wel krapper. Nog niet op een toestel bevestigd of dit visueel
prettig blijft.

**Verificatie**: `npx tsc --noEmit` en `npx eslint . --no-cache` schoon.

## Update 2026-09-22 — App Store-compliance zelfverwonding, privacybeleid gepubliceerd, branding afgerond

**Vraag**: is het `zelfverwonding`-event-type (sectie hierboven, uitbreidingsronde
2026-09-21) een probleem voor Apple's App Store-richtlijnen? Onderzocht (live
richtlijnen opgezocht, niet uit trainingsdata): **nee**, de betreffende richtlijnen
(1.1.2, 1.4) richten zich op content die zelfbeschadiging **aanmoedigt/portretteert**,
niet op een privé-registratie-instrument voor een ouder achteraf. Wel drie reële,
gerelateerde eisen bevestigd:
1. Verplicht privacybeleid + expliciete consent vóór dataverzameling (5.1.1) — met
   name relevant omdat het om gevoelige gezondheids-/gedragsdata van een kind gaat.
2. Nooit gebruiken voor marketing/advertising/data-mining (5.1.2/5.1.3) — al zo,
   geen analytics-SDK anders dan RevenueCat's eigen aankoopstatistieken.
3. Nieuwe (2026) age-rating-vragenlijst heeft een expliciete "medical or wellness
   topics"-vraag — eerlijk invullen bij indiening, verwacht een hogere rating dan 4+,
   geen afwijzingsreden.

**Privacybeleid gebouwd en gepubliceerd**, zelfde traject als Nuvo (zie
`reference_app_store_launch_playbook.md`): losse statische repo
`github.com/wmm1tm/vindra-privacy` (lokaal naast deze repo op
`C:\Users\Wouter\Documents\vindra-privacy`), 1-op-1 dezelfde pagina-stijl als
`nuvo-privacy` maar met Vindra's eigen datamodel (alle 12 event-typen, ABC-/Sensory
Profile-velden, een expliciete regel dat de app geen diagnose stelt of automatisch
patronen herkent). Contact-e-mail hergebruikt (`wmtmbu@proton.me`, zelfde als Nuvo).
Gepubliceerd via GitHub Pages (Deploy from branch → main → /root), live op
`https://wmm1tm.github.io/vindra-privacy/`. **`gh` (GitHub CLI) staat niet
geïnstalleerd** op deze machine — de gebruiker heeft de lege repo zelf via de
GitHub-website aangemaakt en Pages zelf aangezet, ik heb gepusht (git-credentials
via credential manager werken al, geen `gh` voor nodig).

`paywall-screen.tsx`: `PRIVACY_POLICY_URL` wijst nu naar de echte URL (was `null` met
een "nog niet beschikbaar"-Alert-fallback sinds de code-review-fix van 2026-09-21).
Die fallback + de nu ongebruikte i18n-sleutels (`privacyPolicyMissingTitle/Message`)
en de `Alert`-import zijn verwijderd.

**Branding afgerond** (sectie 11, was bewust nog open): gebruiker koos "zelfde
kleurenschema als Nuvo" (`#12161c` donker + `#E3A857` amber) en een **kompas**-
beeldconcept (verwijst naar "Vindra" = Oudnoors voor "vinden"). Geen tool voor
beeldgeneratie beschikbaar in deze sessie, dus zelf een SVG-kompasglyph ontworpen
(ring + kite-vormige naald + spil, evenzo vlakke stijl als Nuvo's baby-silhouet) en
gerenderd met `sharp` (geïnstalleerd in de scratchpad, niet in het project zelf —
op deze machine staat geen ImageMagick/Inkscape/Python voor SVG-rasterisatie).
Vervangen: `icon.png`, `splash-icon.png`, `android-icon-{foreground,background,
monochrome}.png`, `favicon.png` (allemaal nog Expo-scaffold-default). `ios.icon`-
verwijzing naar de ongebruikte Icon Composer-map (`assets/expo.icon`) verwijderd —
Vindra gebruikt nu, net als Nuvo, gewoon de vlakke `icon.png` overal. Adaptive-icon-
achtergrond en splash-config in `app.json` van Expo-scaffold-blauw naar `#12161c`.
**Bundle-ID/package**: `com.woutertm.vindra` (iOS + Android), zelfde
`com.woutertm.<appnaam>`-conventie als Nuvo.

**Nog niet bevestigd op een toestel/simulator** — gebruiker was bezig met
`npx expo start` + Expo Go toen deze sessie werd afgesloten ("alles lijkt te doen").
Geen bekende problemen, gewoon nog niet expliciet geverifieerd dat het nieuwe icoon
er in Expo Go/op een build goed uitziet (Expo Go toont sowieso zijn eigen icoon, niet
het custom icoon — dat is pas zichtbaar in een development build of TestFlight).

**Verificatie**: `npx expo-doctor` (21/21), `npx tsc --noEmit` en
`npx eslint . --no-cache` alle drie schoon.

### Wat nog open staat (ongewijzigd/aangevuld t.o.v. eerdere logs)
- Icoon/branding echt op een toestel bekijken (development build of TestFlight,
  niet Expo Go).
- EN/DE/ES/FR/PT blijven NL-aliassen, geen echte vertaling.
- Nog geen EAS-build of App Store-indiening gedaan voor Vindra.

## Update 2026-09-22 (later dezelfde sessie) — eigen Supabase-project + RevenueCat-entitlement

**Supabase**: eigen project aangemaakt (`bcgwcfaszlmxveaqwzrh`, regio London, los van
Nuvo), `supabase/schema.sql` gedraaid (header-comment ook meteen van "BabyTracker" naar
"Vindra" gecorrigeerd — copy-pasteartefact). `app.json` `extra.supabaseUrl`/
`extra.supabaseAnonKey` ingevuld → `isSyncConfigured` in `lib/supabase.ts` staat aan.
**Bijvangst**: `expo-camera` stond wel als dependency (voor de QR-scan bij partner-delen)
maar had geen config-plugin-entry in `app.json` — geen permissietekst, zou bij een
native build stuklopen of Apple's generieke fallback tonen. Toegevoegd, zelfde
Nederlandse omschrijving als Nuvo.

**RevenueCat**: nieuw, eigen project `Vindra` (project-ID `projfde1932e`), entitlement
`vindra_premium`, offering met Monthly + Yearly packages (Lifetime-suggestie van de
wizard bewust overgeslagen — `paywall-screen.tsx` kent alleen `monthly`/`annual` uit een
offering, een Lifetime-package zou stilzwijgend genegeerd worden). Nog geen App Store
Connect/Play Console-app gekoppeld, dus voorlopig draait alles op de gedeelde
**Test Store**-key (`test_...`) voor zowel iOS als Android in `app.json`
`extra.revenuecatIosApiKey`/`revenuecatAndroidApiKey` — zelfde tussenstap als Nuvo ooit
had, iOS wordt later geüpgraded naar een echte `appl_`-key zodra er App Store Connect-
IAP-producten bestaan.

**Twee losse, echte bugs gevonden en gefixt tijdens het opruimen rond dit werk**:
- `lib/purchases.ts`: `ENTITLEMENT_ID` was nog letterlijk `'nuvo_premium'` (copy-paste-
  artefact) — moest vóór het aanmaken in RevenueCat gecorrigeerd worden naar
  `'vindra_premium'`, want de entitlement-identifier kan daarna niet meer wijzigen.
- `lib/backup.ts`: geëxporteerde back-up-/CSV-bestanden heetten nog `nuvo-events-*.csv`/
  `nuvo-backup-*.json` — gebruiker zou dus Nuvo-benoemde bestanden krijgen bij het
  exporteren vanuit Vindra. Hernoemd naar `vindra-events-*`/`vindra-backup-*`.

**Verificatie**: `npx expo-doctor` (21/21) en `npx tsc --noEmit` schoon na elke stap.

### Wat nog open staat
- RevenueCat upgraden naar echte App Store/Play Store-apps zodra er App Store Connect-
  IAP-producten bestaan (Monthly/Yearly, prijzen/proefperiode instellen).
- Nog geen App Store-indiening gedaan voor Vindra.

## Update 2026-09-22 (weer later dezelfde sessie) — echte vertalingen, nieuw kleurenpalet, EAS development build, banen-herindeling

**Vertalingen**: alle 6 talen (`nl`/`en`/`de`/`es`/`fr`/`pt`) zijn nu echte, onafhankelijke
vertalingen i.p.v. NL-aliassen (was bewust uitgesteld, zie sectie 9 — gebruiker besloot
dit nu toch te doen, voor alle 5 talen tegelijk, niet alleen EN). `pt` is Braziliaans
Portugees (`pt-BR`, matcht `lib/i18n/index.tsx`'s bestaande locale-tag). De Sensory
Profile-velden gebruiken in het Engels Winnie Dunn's eigen bronterminologie ("sensory
threshold", "sensory seeking/avoiding") i.p.v. een letterlijke terugvertaling van het
Nederlands. Twee losse grammaticabugs gevonden en gefixt tijdens het vertalen zelf
(Spaans `1 día restante` i.p.v. `restantes`, Portugees `Falta 1 dia` i.p.v. `Faltam`).
Nog te verifiëren door een moedertaalspreker: Duitse Sensory-Profile-termen
("Reizschwelle"/"reizsuchend"/"reizvermeidend") en het Spaans/Portugese "Fuga" voor
`weglopen` (dekt de lading maar korter dan de volledige klinische term uit de
vakliteratuur).

**Kleurenpalet**: gebruiker liet buiten deze sessie om (Canva AI, met screenshots van de
app als referentie) een nieuwe stijlrichting uitwerken — "Schemering met saliegroen":
achtergrond `#12171C`, kaarten `#1C252A`/`#242E33`, amber-accent `#D6A866` (was
`#E3A857`), saliegroen `#91B39B` en gedempt blauw `#879BC2` als ondersteunende kleuren,
warm wit `#F1EEE7` als primaire tekstkleur. UI-principe: amber blijft voorbehouden aan
actieve staten/primaire acties/de nu-lijn; de rest wordt zachter. Toegepast in 32
bestanden. Saliegroen kreeg een concrete rol op de twee zuiver decoratieve iconen
(help-bolletjes, onboarding-babygezicht); saliegroen en het gedempt blauw kregen later
óók een functionele rol als tijdlijn-baankleur (zie hieronder) — geen losstaande
kleuren meer, maar hergebruikt. `assets/images/icon.png` en de overige app-icoonbestanden
zijn bewust **niet** meegenomen in deze paswerkronde (apart, al eerder afgerond).

**EAS development build**: nodig omdat het toevoegen van de echte RevenueCat-key (vorige
sessie-update) `isPurchasesConfigured` op `true` zette — daarvoor viel de app terug op
"alles ontgrendeld" zonder key, dus was dit nooit eerder zichtbaar. `react-native-
purchases` heeft native code die Expo Go niet kan draaien (zie `AGENTS.md`), dus zonder
development build bleef de paywall permanent op "niet ontgrendeld" hangen, zonder manier
om ooit te kunnen kopen. Opgezet: `eas login` (bestaand account, ook gebruikt voor Nuvo —
projecten zijn volledig los via hun eigen `projectId`/bundle-ID), `eas build:configure`
(nieuw EAS-project `@wmm1/Vindra`, `eas.json` aangemaakt), toestel geregistreerd via de
"Website"-optie (geen Mac beschikbaar), eerste `eas build --profile development --
platform ios` gedraaid (voegde vanzelf `expo-dev-client` toe, standaard-encryptie-
verklaring `Y`/exempt beantwoord — zelfde als Nuvo's `ITSAppUsesNonExemptEncryption:
false`, nog niet expliciet in `app.json` gezet), distributiecertificaat hergebruikt
(gedeeld met Nuvo, certificaten horen bij het Apple-account/team, niet bij één app).
**Geverifieerd op toestel**: paywall laadt aanbiedingen (in USD — verwacht, RevenueCat's
Test Store kent geen App Store Connect-regioprijzen), test-aankoop via Test Store
voltooid, entitlement herkend, app ontgrendeld.

**Tijdlijn-banen herzien** (`constants/timeline-lanes.ts`): de oude indeling (4 banen,
"Gedrag/Prikkels" en "Overig" elk met 5 event-typen) werd onoverzichtelijk zodra meerdere
van die typen kort na elkaar gelogd worden — precies wat er gebeurt tijdens een echte
crisis (gedrag+prikkel+zelfverwonding+weglopen+stimmen realistisch allemaal binnen
enkele minuten). Blijft op 4 kolommen (een 5e zou op het kleinste ondersteunde toestel,
iPhone SE, niet meer zonder horizontaal scrollen passen — `eventsAreaWidth`/
`MIN_LANE_WIDTH` laat dat niet toe), maar herverdeeld op betekenis:
- **Gedrag** (`behavior`): gedrag, zelfverwonding, weglopen — exact dezelfde groep die al
  de ABC-velden deelt in `event-detail-sheet.tsx`.
- **Prikkel** (`sensory`, nieuwe lane-id): prikkel, stimmen — de sensorische familie.
- **Stemming** (`mood`): stemming, positief — het emotioneel-welzijn-signaal.
- **Verzorging** (`care`, vervangt de oude `medication`+`other`): medicatie, slaap, eten,
  zindelijkheid, overig — grootste groep (5), maar bewust de typen met het laagste
  risico dat ze allemaal binnen enkele minuten samen gelogd worden.

Saliegroen en het gedempt blauw uit het nieuwe kleurenpalet werden hergebruikt als
baankleur voor Stemming resp. Prikkel — geen losse eenmalige kleurkeuze meer.

**Dagrapport/weekrapport meegenomen in dezelfde herziening** (`day-report-sheet.tsx`):
- De prominente uitsplitsing bovenaan (was alleen gedrag, per ernst) geldt nu voor de
  hele Gedrag-baan: gedrag én zelfverwonding delen dezelfde ernstschaal en krijgen beide
  een rij (onderscheiden via `getEventVisual`'s eigen icoon/kleur per type, geen aparte
  subkopjes — bespaart verticale ruimte in de 320px-brede kaart), weglopen krijgt een
  plat totaal (geen ernst-variant).
- De resterende, niet-prominente cijfer-chips volgen nu de volgorde van de tijdlijn-lanes
  (`TIMELINE_LANES`) i.p.v. willekeurige volgorde.
- Weekmodus toont nu dag-per-dag-koppen in de app zelf (`groupEventsByDay`), zoals de
  PDF-export dat via `buildReportHtml`'s `grouped`-modus al langer deed — was voorheen een
  platte lijst van 7 dagen door elkaar met alleen een weekdag-achtervoegsel per rij.

**Overig**: help-scherm-scroll-bug gefixt (`list`-style had `flex: 1` nodig i.p.v.
niets, en de kaart zelf mocht geen `Pressable` meer zijn — een ScrollView binnen een
tap-swallowing Pressable-wrapper werd nooit scrollbaar; zelfde structuur als
`SettingsSheetShell`'s `dismissArea`-aanpak toegepast). Help verplaatst van een
header-icoon naar een rij in Instellingen → Beheer (gebruiker vond het header-icoon
de bovenste banner vervuilen). Acht ongebruikte Expo-scaffold-restjes opgeruimd
(`react-logo*`, `expo-badge*`, `logo-glow.png`, `tutorial-web.png`, `tabIcons/`).

**Verificatie**: `npx tsc --noEmit`, `npx eslint . --no-cache` en `npx expo-doctor`
(21/21) alle drie schoon na elke stap.

### Wat nog open staat
- RevenueCat upgraden naar echte App Store/Play Store-apps zodra er App Store Connect-
  IAP-producten bestaan (Monthly/Yearly, prijzen/proefperiode instellen).
- Duitse Sensory-Profile-termen en Spaans/Portugese "Fuga" (weglopen) nog niet door een
  moedertaalspreker bevestigd.
- Nog geen App Store-indiening gedaan voor Vindra.

(`ITSAppUsesNonExemptEncryption: false` bleek al in `app.json` te staan — de EAS-build-
wizard had dat zelf teruggeschreven na de interactieve vraag. `app.json`'s eigen
`backgroundColor`-velden (adaptive icon/splash) stonden nog wél op de oude `#12161c`
i.p.v. `#12171C` — de kleur-fork was gescoped tot `src/`, dit was blijven liggen, nu
ook gefixt.)

## Update 2026-09-22 (weer later dezelfde sessie) — App Store Connect volledig doorlopen, eerste indiening staat op "Waiting for Review"

**RevenueCat omgezet van Test Store naar de echte App Store-producten**: App Store
Connect API-key + In-App Purchase Key + vendor-nummer aangemaakt (App Store Connect →
Users and Access → Integrations), gekoppeld in RevenueCat's app-instellingen, de
`vindra_premium`-entitlement en de Monthly/Yearly-packages gekoppeld aan
`com.woutertm.vindra.premium.{monthly,yearly}` naast de bestaande Test Store-koppeling
(een package kan één product per store bevatten, dus de Test Store-koppeling hoefde niet
weg). `app.json` `extra.revenuecatIosApiKey` nu de echte `appl_...`-key. Prijzen tonen
zich pas correct zodra Apple de producten na indiening daadwerkelijk verwerkt heeft
("Missing Metadata" tot die tijd, normaal/verwacht).

**App Store Connect, stap voor stap doorlopen**:
- App geregistreerd (`com.woutertm.vindra`), subscription-groep + Monthly/Yearly-
  abonnementen aangemaakt, prijs **€5,99/€49,99** (zelfde punt als Nuvo, al gevalideerd
  in dezelfde productcategorie).
- Review-screenshot voor de subscriptions: een telefoon-screenshot bleek een vierkant
  1024×1024-beeld te moeten zijn zonder alphakanaal — gegenereerd met `sharp`
  (scratchpad, zelfde patroon als het app-icoon eerder) via `fit: 'contain'` +
  achtergrondkleur-opvulling, en als JPEG (niet PNG) om het alphakanaal-probleem te
  omzeilen. **Bijvangst-fout**: het bestand landde eerst per ongeluk in het "Image
  (Optional)"-veld (win-back/promotie) i.p.v. "Review Information → Screenshot" — apart,
  gelijk-ogend veld, opgelost door het ook in het juiste veld te uploaden.
- 5 app-screenshots (dagverslag, tijdlijn druk, tijdlijn rustig, instellingen, wiel
  aanpassen) uit echte telefoon-schermafbeeldingen omgezet naar het vereiste
  1284×2778-formaat, zelfde `sharp`-aanpak.
- **App Store-listing** (`APP_STORE_LISTING.md`, nieuw bestand — NL+EN, zelfde opzet als
  Nuvo's eigen bestand in de BabyTracker-repo): subtitle, promotietekst, beschrijving,
  categorie (Health & Fitness), support-URL (privacybeleid hergebruikt). **Keywords apart
  onderzocht** (fork, webonderzoek i.p.v. aanname) — "overprikkeld" (het woord dat
  ouders zelf gebruiken, ipv "prikkel" dat al in de subtitle zit), "abc schema"
  (herkenbare UMCG-term), "begeleider" (Vindra's eigen woordkeuze), "meltdown"
  (bevestigd als levende term via de sterkste concurrent-app "Behavior Tracker ABC").
- **Age Ratings**: alles op "No"/"None" behalve wat feitelijk van toepassing is —
  resultaat 4+, met de kanttekening dat dit een tool vóór ouders is, geen content die
  aan een kind getoond wordt (zelfverwonding is een label in een instellingenmenu, geen
  weergegeven content).
- **Regulated Medical Device**: Nee, gedeclareerd.
- **App Privacy-vragenlijst**: alleen "User ID" en "Purchases" aangevinkt (RevenueCat),
  beide met purpose "Analytics" + "App Functionality" (RevenueCat's eigen vereiste
  combinatie, ongeacht SDK-gebruik), beide "niet gekoppeld aan identiteit" (geen accounts
  in Vindra) en "niet voor tracking". Geen enkel ander datatype aangevinkt — de
  versleutelde partner-sync-data via Supabase is voor ons/Supabase onleesbare ciphertext,
  gekoppeld aan een willekeurige `sync_id` zonder accountkoppeling, dus inhoudelijk geen
  "verzamelde data" in de zin die Apple's vragenlijst bedoelt.
- **Pricing and Availability**: bleek, exact zoals `reference_app_store_launch_playbook.md`
  al waarschuwde, **niet automatisch goed te staan** — Tier 0/Free moest expliciet
  gekozen worden, Apple Silicon Mac-beschikbaarheid stond aan en is uitgezet (niet
  getest op macOS).
- **Herroepingsrecht (EU) uitgezocht** (webonderzoek, niet uit aanname): bij App
  Store-abonnementen is **Apple zelf de contractuele verkopende partij**, niet de
  developer — een gebruiker herroept bij Apple, niet bij Vindra. Al gedekt door de
  bestaande EULA-link, geen aparte disclosure nodig in onze eigen listing.
- **Eerste "Add for Review"-poging mislukte** met een generieke foutmelding, gevolgd door
  een duidelijkere lijst ontbrekende items: Content Rights Information (op App
  Information: "bevat geen content van derden"), een apart **Privacy Policy URL-veld**
  op de App Privacy-pagina zelf (ander veld dan de Support URL, zelfde valkuil als Nuvo
  destijds bij Guideline 3.1.2(c) — zie `BabyTracker/APP_STORE_LISTING.md`), de App
  Privacy-vragenlijst die nog niet echt gepubliceerd bleek, en een niet-opgeslagen
  primary category. Na het afwerken van die vier: indiening gelukt.

**Productie-build**: `eas build --profile production --platform ios` (nieuw Apple
Distribution-certificaat/provisioning profile, App Store-type i.p.v. het ad-hoc
development-profiel), eerste poging liep tegen een tijdelijke 503 van Expo's
build-service aan (niet ons probleem, gewoon opnieuw geprobeerd, werkte meteen).
`eas submit --profile production --platform ios --latest` daarna geüpload naar App
Store Connect — stond een tijd lang in Expo's gratis-tier-wachtrij (geen storing, gewoon
een gedeelde, niet-geprioriteerde rij).

**Eindstatus van deze sessie**: **Vindra – Gedragslogboek staat op "iOS 1.0 Waiting for
Review"** bij Apple. Verificatie (`tsc`/`eslint`/`expo-doctor`) bleef doorlopend schoon,
alle app.json-/db-wijzigingen (echte RevenueCat-key, `DEFAULT_CHILD_NAME` 'Baby'→'Kind'-
fix, `APP_STORE_LISTING.md`) staan gecommit.

### Wat nog open staat
- Wachten op Apple's beoordeling (meestal een paar uur tot 1-2 dagen) — mogelijk
  Guideline 2.1 "Information Needed" als Apple toch meer info wil, ook al heeft dit
  account al Nuvo-reviewgeschiedenis; antwoord-sjabloon staat klaar in
  `APP_STORE_LISTING.md`.
- DE/ES/FR/PT App Store-metadata (los van de al-complete in-app-vertalingen) — pas doen
  zodra NL/EN aantoonbaar iets trekt.
- Duitse Sensory-Profile-termen en Spaans/Portugese "Fuga" (weglopen) nog niet door een
  moedertaalspreker bevestigd.

## Update 2026-09-24: intro bij de eerste start + wielknop in het midden (voor een toekomstige update, op branch `feature/onboarding-wheel-hub`)

**Niet in 1.0** (die ligt bij Apple): alles hieronder staat alleen op de branch
`feature/onboarding-wheel-hub`, niet gemerged, niet gepusht. Overgenomen uit Ebbly (dat
van Vindra is afgeleid), in Vindra's eigen kleuren en toon. Nog niet op een toestel getest.

**Wielknop in het midden** (`components/wheel/wheel-hub.tsx`, vervangt het smalle
randhandvat `wheel-handle.tsx`): ronde knop op de hoogte van het draaipunt, donker met
amber rand en een neutraal regelaar-icoon (`tune-variant`). Tik = wiel in/uitklappen,
horizontaal vegen werkt zoals het oude handvat, lang drukken (380 ms) = stevige tik, knop
veert, het wiel wiebelt kort en "Wiel aanpassen" opent als eigen Modal
(`WheelSettingsSheet nested={false}`). VoiceOver-hint in alle 6 talen. De Help-tekst bij
"Wiel aanpassen" noemt het lang drukken nu ook.

**Intro** (`components/onboarding/`): volledig scherm, 5 stappen met stipjes,
Overslaan/Terug/Volgende. (1) welkom, (2) naam + optionele geboortedatum van het kind (zelfde
`renameChild`/`updateChildBirthDate` als de naambanner; de banner blijft als vangnet als deze
stap overgeslagen wordt), (3) "wat speelt er bij je kind?": de 5 typen met
`defaultEnabled: false` (zelfverwonding, weglopen, stimmen, eten, zindelijkheid) aan te
vinken, met een korte neutrale omschrijving (zelfverwonding: "momenten waarop je kind
zichzelf pijn doet", bewust niet beschrijvend). Past het niet onder
`MAX_ACTIVE_WHEEL_ENTRIES` (8, basis is al 7), dan maken basisknoppen plaats in de volgorde
Overig → Positief moment → Slaap → Medicatie, en de stap zegt letterlijk welke
(`lib/onboarding-wheel.ts`). Gedrag/Prikkel/Stemming blijven altijd. (4) hoe loggen werkt
(tik, tweede keuze, achteraf aanleiding/locatie/wat hielp, lang drukken om te verslepen, de
wielknop), (5) rapport, versleuteld delen, privacy en "Vindra stelt geen diagnose" (zelfde
MDR-grens als sectie 1). Daarna, zonder abonnement, de bestaande `PaywallScreen` met
sluitknop (3.1.2-links ongewijzigd). Alleen wat met "Volgende" bevestigd is wordt opgeslagen;
bij opnieuw bekijken wordt het wiel alleen herschreven als je de keuze in stap 3 wijzigt.

**Opslag, afwijking van Ebbly**: de vlag staat als `onboarding_done` in de bestaande
`app_state`-tabel (toestelniveau), niet als kolom op `child`. Instellingen zijn in Vindra
per kind, dus een kolom zou de intro opnieuw tonen bij elk nieuw, via QR gekoppeld of uit
back-up teruggezet kind. Geen schemawijziging nodig. **Bestaande gebruikers** (al events, of
een kind met een eigen naam) zien de intro na de update niet: `db/onboarding.ts` legt de
vlag dan bij de eerste keer lezen stil vast. `PreferencesProvider` heeft nu een
`loaded`-vlag, zodat de intro niet even opflitst.

**Instellingen**: nieuwe veegrij "Intro opnieuw bekijken" (sluit eerst Instellingen, zet de
vlag na 350 ms terug: twee native Modals tegelijk faalt op iOS stil).

**Verificatie**: `npx tsc --noEmit` en `npm run lint` schoon (na het wissen van een
verouderde lint-cache in `.expo/cache/eslint`, die ook op `main` een vals
`import/no-unresolved` gaf). `npx expo-doctor`: 20/21, alleen 6 patch-versies achter
(`expo`, `expo-router`, `@expo/ui`, `expo-glass-effect`, `expo-linking`, `expo-sharing`),
al zo op `main`. Bewust niet in deze branch bijgewerkt; doe `npx expo install --fix` als
losse commit bij de volgende build.

## Update 2026-09-24 (avond): design 2.0, widget en gelijktrekken met Nuvo, versie 1.1.0 (branch `feature/design-2`)

Afgetakt van `feature/onboarding-wheel-hub` (bevat dus ook de intro en de wielhub). Niet
naar `main` zolang 1.0 in review is; builden kan vanaf deze branch.

**Design 2.0** (voorstel goedgekeurd door gebruiker, canvas
https://claude.ai/artifact/Ayu8zuwdMtrWzPLZbK2aKh): Ebbly's design 2.0 overgenomen in
Vindra's eigen kleuren, Material-iconen en systeemfont. Wielknoppen met donkere kern,
gekleurde ring en naam eronder; teller als rondje in de hoek; bredere boog vanaf 7 knoppen;
tegels op de tijdlijn met pulsringen bij vasthouden; kolomkoppen als getinte pillen die
krimpen tot ze passen (NL "Verzorging" → "Zorg", ES "Ánimo", FR "Conduite", PT "Conduta");
nu-lijn als pil onder de events; banner onder de kolomkoppen zolang je een event vasthoudt.
Eén knop voor de gloed in `src/constants/design.ts`: `GLOW = 0.35`, `SHINE = false`
(gedempter dan Ebbly: je opent Vindra vaak midden in een moeilijk moment). In nachtmodus
gaat de gloed uit (`GlowProvider` in `src/lib/glow-context.tsx`). Geen Ebbly-iconen,
mijlpalen, tellers of weekkaart.

**Intro**: in de 2.0-stijl (ringknoppen, gloed op de gekozen rollen) en een nieuwe stap over
de widget, nu 6 stappen.

**Widget** (`src/widgets/quick-log-widget.tsx`, `src/lib/widget-sync.ts`, plugin
`expo-widgets` in `app.json`): de eerste knoppen van je wiel die je mag loggen. Momenten
met één tik; de slaapknop start een slaap ("sinds 21:40") en stopt hem met een tweede tik.
De app verwerkt de tikken op volgorde bij openen/terugkomen, slaat een start over als er al
een slaap loopt en een stop zonder lopende slaap, synct de nieuwe rijen met de partner, en
zet de echte stand terug in de widget. Zonder abonnement alleen Gedrag (zoals in de app),
met een regel "Meer knoppen met een abonnement". Werkt niet in Expo Go (lui geladen, dus
geen crash). Nieuw per event-type: `widgetSymbol` (SF Symbol).

**Gelijkgetrokken met Nuvo**: `isKnownEventKind`-filter in `db/events.ts` (onbekende typen
van een nieuwere partner-versie crashen de app niet meer); help-scherm in de gedeelde
Instellingen-shell i.p.v. een eigen Modal, met de onderwerpen tijd markeren, bewerken/
verslepen en de kopbalk; eigen sectie "Hulp" bovenaan Instellingen (sleutel
`replayOnboarding`); privacylink op de paywall naar `vindra.nl/nl/privacy/` of
`/en/privacy/`. Expo-pakketten bijgewerkt (`expo install --fix`).

**Nog open**
- **`eas.json` mist `submit.production.ios.ascAppId`**: het App Store-ID van Vindra (getal
  in de App Store Connect-URL) moet de gebruiker nog doorgeven. Zonder dat loopt
  `eas build --auto-submit` / `eas submit` vast.
- Proefperiode niet zichtbaar op de paywall: de code is gelijk aan Nuvo, dus het zit in de
  winkelinstelling (Introductory Offer per abonnement in App Store Connect, en of de
  RevenueCat-offering naar die producten wijst).
- Toesteltest (TestFlight) van alles hierboven, vooral de widget: toevoegen aan het
  beginscherm, moment loggen, slaap starten/stoppen met de app dicht, daarna app openen.
- De eerste build met de widget maakt een extra target `ExpoWidgetsTarget`
  (`com.woutertm.vindra.ExpoWidgetsTarget`, App Group `group.com.woutertm.vindra`); EAS
  vraagt eenmalig om daarvoor een provisioning profile te maken: Y.
