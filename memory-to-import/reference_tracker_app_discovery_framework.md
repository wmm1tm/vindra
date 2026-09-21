---
name: reference-tracker-app-discovery-framework
description: "Invulbaar framework om een nieuw trackingsapp-idee (portfolio-strategie, zie project-business-direction) te onderzoeken vóór het bouwen begint — zodat de daadwerkelijke bouwfase grotendeels config invullen is i.p.v. onderweg beslissen, richting ~1 week naar een dev build"
metadata:
  node_type: memory
  type: reference
  originSessionId: 22045124-78af-4613-80f9-9fec6921fe40
  modified: 2026-09-21T12:56:24.445Z
---

Bedoeld om vóór het bouwen van de **volgende** trackingsapp (zie de multi-app-portfolio-
ambitie in [[project-business-direction]]) helemaal ingevuld te zijn, zodat er tijdens de
bouwweek niet meer over kleine settings getwijfeld hoeft te worden. Elke sectie
correspondeert direct met een config-bestand of architectuurkeuze die Nuvo al heeft —
invullen = grotendeels een nieuwe `constants/event-types.ts`/`timeline-lanes.ts` kunnen
schrijven. **Let op**: dit bestand leeft in het geheugen van het Nuvo-project, laadt niet
automatisch mee naar een andere werkmap — bij het starten van een nieuw app-project
expliciet vragen om dit erbij te pakken.

## 0. Nieuw project opstarten (PowerShell)

**Herzien 2026-09-21** (was: "niet de Nuvo-repo kopiëren, apart en vers beginnen" —
die regel gold vóórdat Nuvo bewezen was). Nu Nuvo klaar is: nog steeds losse apps, eigen
repo per app, geen domain-switcher in één codebase — máár wel een **gerichte
bestandsextractie** bij het scaffolden, geen from-scratch rebuild. Codeonderzoek
(zie `NEXT_APP_VINDRA.md` in de BabyTracker-repo voor het volledige, uitgewerkte
voorbeeld) bevestigde dat de architectuur al scheidbaar is zoals sectie 2 hieronder
voorschrijft: componenten als `wheel-arc.tsx` verwijzen maar op een handvol plekken naar
domain-config, de rest is generieke gebaar-/lay-out-logica. Vanaf-nul-scaffolden liet
elke keer opnieuw tegen dezelfde, allang opgeloste lay-out-/safe-area-/gebaar-bugs
aanlopen (header-overflow, wiel-label-pivot, tijdlijn-marker-centrering, modal-in-modal).

**Aanpak per nieuwe app**: `create-expo-app` scaffolden zoals hieronder, dan een
bestand-voor-bestand-kopieerslag uit de meest recente/volwassen bestaande app in de
portfolio (niet per se Nuvo zelf als er inmiddels een nieuwere/betere staat), verdeeld
in drie emmers:
1. **Pure engine** (wiel-component, tijdlijn-rendering, settings-sheet-shell, kleur-/
   schaduw-utilities, tijd-utilities) — 1-op-1 kopiëren, geen edits verwacht.
2. **Herbruikbaar patroon** (sync/crypto/Supabase-laag, purchases/paywall-laag,
   db-schema-migratiepatroon, profiel-/i18n-mechanisme) — kopiëren, dan licht
   herbedraden (nieuw Supabase-project, nieuwe RevenueCat-entitlement, evt. naam-
   hernoeming als het domein geen "kind"-concept heeft).
3. **Vers schrijven** (event-typen-config, tijdlijn-kolommen-config, i18n-teksten,
   branding/app.json) — dit is precies sectie 1-10 van dit framework.
De hoofdscherm-orkestratie (`app/index.tsx`-equivalent) is per definitie uniek per app
(bindt alle domain-config aan elkaar) — als voorbeeld ernaast houden, niet blind
kopiëren.

```powershell
# 1. Nieuwe map + scaffold (default template = tabs/parallax, zelfde als Nuvo begon)
New-Item -ItemType Directory -Path "C:\Users\Wouter\Documents\<NieuweAppNaam>"
Set-Location "C:\Users\Wouter\Documents\<NieuweAppNaam>"
npx create-expo-app@latest .

# 2. Direct in Claude Code openen vanuit die map
claude
```

**Daarna in die nieuwe Claude Code-sessie als eerste bericht**: vraag om
`reference_app_store_launch_playbook.md` en dit bestand
(`reference_tracker_app_discovery_framework.md`) op te halen uit
`C:\Users\Wouter\.claude\projects\C--Users-Wouter-Documents-BabyTracker\memory\` en in het
geheugen van het nieuwe project te zetten — geheugen is per werkmap gescoped, laadt niet
vanzelf mee.

**Dependencies — pas installeren zodra de bijbehorende sectie hieronder ingevuld is, niet
allemaal vooraf.** Via `npx expo install <pkg>` (niet los `npm install`, voor
SDK-versie-matching). Wat Nuvo per doel gebruikt, ter referentie:

| Doel | Package(s) | Wanneer nodig |
|---|---|---|
| Lokale database | `expo-sqlite` | Altijd — kern van het storage-plan |
| "Soft depth"-stijl (sectie 11) | `expo-linear-gradient` | Alleen als je die visuele stijl overneemt |
| Dagrapport als PDF | `expo-print`, `expo-sharing` | Alleen bij sectie 7 (dagrapport) |
| Backup export/import | `expo-document-picker`, `expo-file-system` | Bijna altijd handig, geen harde eis |
| Partner-sync-equivalent | `@supabase/supabase-js`, `expo-crypto`, `tweetnacl`, `tweetnacl-util`, `expo-camera` (QR scannen), `react-native-qrcode-svg` (QR tonen) | Alleen als sectie 8 dat aangeeft |
| Abonnement/IAP | `react-native-purchases` | Pas in de App Store-fase (zie het draaiboek), niet dag 1 |
| EAS dev-build | `expo-dev-client` | Pas zodra een native module (RevenueCat) nodig is — blijf tot dan gewoon in Expo Go |
| Gesture/animatie (wiel) | `react-native-gesture-handler`, `react-native-reanimated` | Staan al standaard in de create-expo-app-template |
| i18n | `expo-localization` | Alleen als sectie 9 meerdere talen vraagt |

## 1. Niche & doelgroep
- Voor wie is dit (rol, situatie)?
- Welk probleem lost het loggen op — wat doen ze nu (niks/Excel/papier/andere app)?
- Is dit onderwerp **gereguleerd** (medische claims, MDR-risico)? Welke claim bewust NIET
  maken? (Precedent: epilepsie-tracking als kandidaat-niche afgewezen om precies deze
  reden, zie [[project-business-direction]].)

## 2. Event-typen — wordt `EVENT_TYPES`
Eén rij per "ding dat je logt". Kolommen, 1-op-1 op `EventTypeConfig` in
`constants/event-types.ts`:

| kind | label | icoon-richting | kleur-richting | isDuration | hasSecondLevel | gratis/premium |
|---|---|---|---|---|---|---|

Kernvragen per rij:
- **isDuration**: zinvol begin/eind (start/stop-timer, zoals Nuvo's `sleep`), of een
  momentopname (zoals `diaper`)?
- **hasSecondLevel**: heeft dit varianten die apart onderscheiden moeten worden (zoals
  `diaper`: pee/poo/both/empty)? Zo ja, direct de losse varianten opsommen — wordt
  `SECOND_LEVEL_OPTIONS[kind]`, elke variant kan een eigen icoon/kleur krijgen via
  `getEventVisual()` (zodat bv. koorts er anders uitziet dan spugen, ook al vallen ze
  onder hetzelfde basistype).
- **Extra numeriek/tekstveld?** (zoals ml bij een fles, °C bij koorts) — apart noteren,
  dat is geen `SecondLevelOption`-variant maar een los ingevoerd veld.
- **gratis/premium**: welk ÉÉN type blijft gratis als hook (bij Nuvo: `sleep`, zelfstandig
  bruikbaar zonder de rest te ontgrendelen)? Rest achter het abonnement
  (`requiresPremium: true`).

## 3. Wiel-groepering — wordt `DEFAULT_WHEEL_ORDER`
Welke event-typen delen één wielknop met een sub-menu (Nuvo: "Voeding" =
bottle+water+nursing, "Vast voedsel" = fruit+food)? Noteer groepen + welk lid het
representatieve icoon/kleur van de groep levert (`wheelEntryRequiresPremium()`: een
groep is pas premium als *elk* lid dat is).

## 4. Tijdlijn-kolommen — wordt `TIMELINE_LANES`
Past de bestaande 4-kolommen-structuur (slaap/voeding/luier/overig), of heeft dit domein
een andere natuurlijke indeling? Hoeveel kolommen, welke labels, welke event-typen per
kolom — **elk event-type moet in precies één lane zitten** (`timeline-lanes.ts` gooit
zelf een build-time error als er eentje vergeten wordt, dus dit hoeft niet handmatig
gecontroleerd te worden, wel volledig ingevuld).

## 5. Profiel-niveau — wordt het `child`-equivalent
Is er een "meerdere X tegelijk"-behoefte (zoals meerdere kinderen)? Welke velden
definiëren een profiel (naam + geboortedatum-equivalent, of iets anders)?

## 6. Duur-events — quick-acties
Voor elk `isDuration`-type: welke snelkeuzes na het starten zijn zinvol (Nuvo's slaap:
"Einde dag"/"Sinds middernacht")? Niet elk duur-type heeft dit nodig.

## 7. Dagrapport / PDF
Welke totalen/samenvattingen zijn voor dit domein waardevol genoeg om bovenaan te tonen
(Nuvo: "8u slaap · 4 voeding · 3 luiers")?

## 8. Sync/delen
Is een partner-sync-equivalent nodig (meerdere zorgverleners/gebruikers rond hetzelfde
profiel)? Zo nee: bespaar de hele Supabase/encryptie-laag (`lib/sync.ts`/`lib/crypto.ts`/
`supabase/schema.sql`) — dat scheelt een volledige bouwfase.

## 9. Talen
Zelfde 6 (NL/EN/DE/ES/FR/PT-BR) of een ander doelmarkt-gestuurd setje?

## 10. Expliciet buiten scope (fase 1)
Wat NIET bouwen bij de eerste dev-build (widgets, extra platforms, etc.) — voorkomt
scope-kruip tijdens de bouwweek.

## 11. Visueel/design — geen los themabestand, dit zijn de echte, uit de code gehaalde tokens
`constants/theme.ts` is nog de **ongewijzigde Expo-starter** (light/dark `Colors`-object)
— dat is NIET de bron van waarheid voor hoe Nuvo er echt uitziet. De echte stijl staat
verspreid als losse constanten per component (bewust zo, geen openstaande opruimactie).
Onderstaande zijn de daadwerkelijke waarden, als startpunt om bewust over te nemen of van
af te wijken voor een nieuwe app:

- **Basisachtergrond**: `#12161c` (bijna-zwart navy), gebruikt in ~25 bestanden — dark-first,
  geen apart light-thema gebouwd.
- **Tekst**: `#ECEDEE` (primair), `#8B95A1` (gedempt/secundair).
- **Accentkleur** (knoppen/actieve staat, gradient): `#F0C077` → `#E3A857` (amber).
- **Kaart-/paneelachtergrond** (gradient): `#212832` → `#171b21`.
- **Border radius**: 8px voor knoppen/chips/inputs, 12px voor kaarten/planopties.
- **"Soft depth"-stijl**: gelaagde, gekleurde schaduw + glansrand i.p.v. platte kleuren —
  via `lib/color.ts` (`lighten`/`darken`/`withAlpha`, RN kent geen CSS `color-mix()`) +
  `expo-linear-gradient` (Expo Go-compatibel, geen dev-build nodig). Zie
  [[project-status]] (2026-09-15-update) voor het volledige traject van dit ontwerp.
- **Iconen**: MaterialIcons + MaterialCommunityIcons via een eigen `<EventIcon>`-wrapper
  (`components/ui/event-icon.tsx`) die tussen de twee sets kiest per icoon — geen los
  icoonpakket geïnstalleerd.
- **Font**: systeemfont (San Francisco op iOS via `system-ui`) — een custom font
  (Manrope) is verkend maar bewust NIET doorgevoerd in de RN-app.
- **Wiel-afmetingen** (`wheel-arc.tsx`): `RADIUS = 210`, `RADIUS_STEP = 100` per
  extra keuzeniveau — schermformaat-onafhankelijke constanten, niet responsief herschaald.
- **Tijdlijn**: `TIMELINE_HORIZONTAL_PADDING = 16`, minimale kolombreedte 60px, kolombreedte
  = beschikbare breedte / aantal lanes (responsief, voorkomt overlap op smalle toestellen).
- **Nachtmodus** (los van dark mode zelf, die er al standaard is): venster 22:00-06:00,
  apart concept — zie [[project-status]].
- **Visuele referentie**: de App Store-screenshots (1242×2688, geresized via een
  PowerShell/System.Drawing-scriptje, zie [[reference-app-store-launch-playbook]] punt 8)
  zijn de meest up-to-date visuele snapshot van hoe de app er in productie uitziet —
  handig om erbij te pakken als er visueel vergeleken moet worden, deze memory bevat zelf
  geen afbeeldingen.

## Hoe dit framework te gebruiken
1. Bij een nieuw idee: dit bestand kopiëren/erbij pakken, secties 1-10 samen invullen
   (gesprek of los document).
2. Sectie 11 (visueel) pas relevant zodra branding/richting voor de nieuwe app gekozen is
   — kan bewust 1-op-1 overgenomen worden (snelste pad) of bewust afwijken (eigen
   merkidentiteit), maar dan als expliciete keuze, niet als toevallige onderweg-beslissing.
3. Met 1-10 ingevuld: `constants/event-types.ts` en `constants/timeline-lanes.ts` zijn in
   feite al geschreven, op TypeScript-syntax na — de rest van de architectuur (wiel-
   gebaar, SQLite-schema met `PRAGMA user_version`-migraties, dagrapport-PDF,
   RevenueCat-paywall-patroon) is generiek en wordt hergebruikt, niet opnieuw ontworpen.
