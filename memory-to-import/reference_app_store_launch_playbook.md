---
name: reference-app-store-launch-playbook
description: "Stap-voor-stap draaiboek + valkuilen voor het lanceren van een betaalde/abonnement-iOS-app via Expo/EAS + RevenueCat + App Store Connect — geleerd tijdens de Nuvo-lancering (2026-09-18) en bevestigd/aangevuld bij Vindra's eerste indiening (2026-09-22), herbruikbaar voor toekomstige apps"
metadata: 
  node_type: memory
  type: reference
  originSessionId: ff0ed0a6-8ee2-4d30-85e5-23a374b48fa3
  modified: 2026-09-22T00:00:00.000Z
---

Dit is een destillaat van de eerste echte App Store-lancering (Nuvo, 2026-09-18) — bedoeld
om bij een **volgende** app dezelfde stappen sneller en zonder de valkuilen te doorlopen.
Zie [[project-status]] voor de actuele Nuvo-specifieke voortgang; dit bestand is bewust
generiek/herbruikbaar. **Let op**: dit bestand leeft in het geheugen van het Nuvo-project.
Start je een nieuwe app in een andere werkmap, vraag dan expliciet om dit bestand erbij te
pakken/kopiëren, want het laadt niet automatisch mee naar een ander project.

## Eenmalig per Apple-developer-account (blijft staan voor élke volgende app)

- Apple Developer Program-lidmaatschap.
- **Paid Applications Agreement** + **Tax Forms** (W-8BEN voor een NL-individu: geen US
  TIN, Article 7/Business Profits @ 0%, "Income from the sale of applications" — geen
  fiscaal advies, wel de gangbare route; laat evt. door een boekhouder checken) +
  **Bank Account** — dit hele traject kan **tot ~24-48u kosten bij Apple** (identiteits-
  /adresverificatie, bank-verwerking). Start dit zo vroeg mogelijk, los van de rest.
- **DSA-trader-classificatie** (App Store Connect → Business): als je iets verkoopt
  (abonnement/IAP), ben je trader — je adres/telefoon/e-mail worden dan **openbaar**
  getoond op de productpagina.
- **In-App Purchase Key** (.p8, App Store Connect → Users and Access → Integrations →
  In-App Purchase) — voor RevenueCat/transactie-verificatie. Account-breed, herbruikbaar.
- **App Store Connect API-key** (zelfde Integrations-pagina, ander tabblad — vereist
  soms eerst "Request Access", meestal meteen goedgekeurd) — nodig voor RevenueCat om
  producten te kunnen valideren/importeren. Ook account-breed herbruikbaar, en apart van
  de In-App Purchase Key (twee verschillende sleuteltypes, licht verwarrend).
- **Vendor number** (App Store Connect → Business/Payments, 8 cijfers linksboven) — nodig
  in RevenueCat naast de API-key hierboven.

## Per nieuwe app — checklist in volgorde

1. **Check de app-naam vooraf op beschikbaarheid** vóórdat je merk/icoon/domeinnaam
   erop bouwt — App Store-namen moeten uniek zijn over de hele store. (Les: "Nuvo" kaal
   bleek al bezet, moest achteraf "Nuvo Baby Tracker" worden — de merknaam zelf/app.json
   `expo.name`/domeinnamen hoefden niet te veranderen, alleen het App Store-productnaam-
   veld, maar dit had voorkomen kunnen worden.)
2. **`app.json`**: bundle ID, `owner` + `extra.eas.projectId` (⚠️ deze twee laten Expo Go
   lokale opslag/SQLite resetten zodra ze toegevoegd worden — pas doen als je toch al naar
   een EAS-build overstapt, niet losstaand terwijl je nog in Expo Go test), en
   **`ios.supportsTablet: false` tenzij je écht iPad-getest hebt** (anders eist Apple een
   iPad-screenshot voor een layout die je nooit hebt gecontroleerd — zet dit vóór de
   allereerste productie-build, niet erna, want anders moet je opnieuw bouwen).
   `expo-dev-client` moet erbij voor een EAS-dev-build (Expo Go-only is dan voorbij).
3. **`eas build --profile development`** (interactief: Apple-login, certificaat +
   provisioning profile aanmaken, devices registreren via "Website"-optie als je geen
   Mac hebt) → **altijd in een eigen interactief terminalvenster**, nooit via een
   non-interactieve sandbox-tool (breekt op credential-prompts).
   - Eerste keer openen op het toestel: **Ontwikkelaarsmodus** aanzetten (Instellingen →
     Privacy en beveiliging), eenmalig per toestel.
4. **RevenueCat**: entitlement aanmaken, offering + packages (Monthly/Annual-*type*,
   niet zelf de product-ID nodig te noemen), **daarna een "App Store"-app toevoegen**
   (naast de default Test Store) met de In-App Purchase Key + de App Store Connect
   API-key + vendor number van hierboven. Nieuwe producten (Store: App Store, zelfde
   Product ID als in App Store Connect) aanmaken en **twee losse stappen** niet
   overslaan: koppel het product aan (a) de **entitlement** én (b) de **offering/package**
   — dat laatste gaat *niet* automatisch en heeft geen knop op de productpagina zelf,
   moet via de offering/package-kant.
5. **App Store Connect — app-record aanmaken** (Apps → Add Apps): naam, SKU, bundle-ID,
   primary language, category.
6. **App Information**: subtitle, category, Age Ratings (nieuwe multi-step
   vragenlijst — voor een simpele logboek-app meestal overal "None"/"No", 4+ als
   uitkomst), **Regulated Medical Device-verklaring** (verplicht als categorie Health &
   Fitness is, ook al is er niks medisch), **DAC7-compliance** (verplicht als je iets
   verkoopt; "personal services" is meestal "No" voor een software-abonnement).
7. **App Privacy**: vragenlijst per data-type (Linked to identity? Tracking?
   Purpose?) — en **vergeet niet op "Publish" te klikken**, los van het invullen zelf.
   Ook een apart **"Privacy Policy URL"-veld** hier (naast een eventuele "Support URL"
   elders) moet ingevuld zijn. **Dit veld zit op de App Privacy-pagina zelf** (Trust &
   Safety-sectie in het linkermenu), niet op de versie-specifieke App Store-pagina
   (daar staan alleen Support URL/Marketing URL).
   - **RevenueCat vereist expliciet "Analytics" + "App Functionality" als purpose bij
     "Purchases"** (Purchase History) — dit staat in hun eigen "Apple App Privacy"-
     documentatie en geldt voor *elke* RevenueCat-integratie, ongeacht welke SDK-calls
     je zelf gebruikt (het dekt hun eigen dashboard: Customer History/Charts/
     Experiments). Een privacyverklaring die "geen analytics" claimt klopt dan niet
     meer letterlijk — nuanceer naar "geen eigen analytics, RevenueCat gebruikt
     aankoopgegevens wel voor hun eigen geaggregeerde abonnementsstatistieken".
     Omgekeerd: **"Usage Data"/"Product Interaction" hoort je NIET te declareren
     vanwege RevenueCat alleen** — dat is enkel nodig als er een aparte analytics-SDK
     (Mixpanel/Firebase/PostHog/Amplitude) in de app zit. Check dit tegen de
     daadwerkelijke `package.json`-dependencies i.p.v. het voor de zekerheid overal
     aan te vinken.
8. **Screenshots**: check de exacte pixel-eisen (bv. 1242×2688 voor 6.5") tegen wat je
   toestel daadwerkelijk produceert — bij een mismatch schalen + opvullen met de eigen
   app-achtergrondkleur (geen uitrekken/vervormen) via een klein PowerShell/System.Drawing-
   scriptje, niet met de hand. **Nooit een screenshot met een écht werkende/permanente QR-
   code of ander geheim publiceren** (les: partner-sync-deelscherm bewust overgeslagen).
9. **Subscriptions** (Monetization → Subscriptions): eerst een **Subscription Group**
   aanmaken + Display Name and Description ervoor, dan per abonnement: Product ID (moet
   exact matchen met RevenueCat), duur, **Availability + prijs is een aparte stap die je
   makkelijk kunt missen** (leidt tot "Missing Metadata" in RevenueCat terwijl de andere
   subscription al "Ready to Submit" is — controleer dit als de statussen tussen twee
   subscriptions verschillen), Display Name/Description (**max 55 tekens**, korter dan
   de subtitle-limiet), **Introductory Offer** (free trial) los instellen per subscription,
   en een **Review Information-screenshot** (kan een bestaande App Store-screenshot zijn,
   hoeft geen letterlijke paywall-foto te zijn) — zonder die laatste blijft de status op
   "Missing Metadata" staan.
10. **Pricing and Availability**: **expliciet een prijs kiezen, ook voor een gratis app**
    (Tier 0/"Free" moet je actief selecteren, staat niet automatisch goed) + base country
    op je eigen markt zetten. Check ook **Apple Silicon Mac- en Apple Vision Pro-
    beschikbaarheid** — die vakjes kunnen **standaard aangevinkt staan**, uitzetten als
    je daar niet op getest hebt.
11. **Sandbox Tester-account** (Users and Access → Sandbox → Testers): e-mailadres hoeft
    niet echt te bestaan, moet alleen nog niet als Apple-ID geregistreerd zijn.
    **Let op**: de RevenueCat-entitlement-status hangt aan een lokale, anonieme
    RevenueCat-gebruikers-ID op het toestel, **niet** aan welk sandbox-account je
    toevallig gebruikt — voor een "nooit geabonneerd"-test moet je de hele app
    verwijderen+herinstalleren (kost ook je lokale testdata), niet alleen inloggen met
    een ander sandbox-account.
12. **Productie-build + submit**: `eas build --profile production` (nieuw Apple
    Distribution-certificaat/provisioning profile, andere dan bij development) →
    `eas submit --profile production` (EAS genereert zelf een eigen App Store Connect
    API-key hiervoor — rol **APP_MANAGER** i.p.v. ADMIN is genoeg, least-privilege).
    Na Apple's verwerking (5-10 min, mail-notificatie): build koppelen op de
    "Prepare for Submission"-pagina.
13. **"Draft Submission"-flow**: app-versie + subscription group worden **samen**
    ingediend (niet los) — de eerste keer geeft Apple een duidelijke checklist van wat
    nog ontbreekt vóór "Submit for Review" klikbaar wordt (screenshot-formaten,
    Privacy Policy URL, prijs-tier, etc.) — gewoon die lijst puntje voor puntje afwerken.
14. **App Review**: geen invloed op te hebben, duurt ergens tussen een paar uur en 1-2
    dagen. "Automatically release this version" (vs. handmatig) is een vrije keuze, geen
    goed/fout.
15. **Verwacht bij een nieuw/onbekend developer-account: Guideline 2.1 "Information
    Needed"** — status toont "Rejected" in App Store Connect, maar dit is **geen**
    inhoudelijke afwijzing (geen bug/beleidsprobleem), gewoon Apple's standaardverzoek
    om meer context bij weinig reviewgeschiedenis. Gevraagd: een **schermopname op een
    fysiek toestel** (moet de gebruiker zelf maken — dekt de typische flow + het bereiken
    van betaalde content, dus laat een geblokkeerd premium-onderdeel + de paywall zien)
    plus 5 tekstpunten (doel/doelgroep, setup/toegang zonder account, externe diensten
    zoals RevenueCat/Supabase, regioverschillen, gereguleerde-sector-verklaring) — in
    zowel de Reply-box als de Notes van "App Review Information" plakken. Na een
    compleet antwoord gaat de app terug de reviewrij in.
16. **Een schermopname voor Apple (bv. bij punt 15) test je op de TestFlight-build zelf,
    niet op de dev-client-build** — representatiever (geen Expo-dev-UI), en **let op: de
    aankoop-testflow verschilt structureel tussen de twee**:
    - **Dev-client-build** (Apple Development-certificaat): test-aankopen gaan via een
      losse **Sandbox Tester-account**, ingesteld op het toestel onder **Instellingen →
      Ontwikkelaar → Sandbox Apple-account** (dit menu-pad zelf is ook al verplaatst t.o.v.
      oudere iOS-versies — was eerder Instellingen → App Store → Sandbox-account).
    - **TestFlight-build** (Apple Distribution-certificaat): test-aankopen gaan via je
      **eigen, echte Apple-ID/wachtwoord** (niet de sandbox-tester!) — het
      bevestigingsschermpje toont expliciet "Bètatesters hoeven niet te betalen voor deze
      aankoop", dus nooit een echte afschrijving, ondanks het echte account. Een
      sandbox-tester-wachtwoord invullen op dát schermpje werkt dus nooit — logisch
      verwarrend als je niet weet dat dit een ander mechanisme is dan sandbox-testen.
    - Prijzen/valuta die de app zelf ophaalt (bv. via `Purchases.getOfferings()`) kunnen
      op een TestFlight-build een andere valuta tonen dan het uiteindelijke
      koop-bevestigingsschermpje (die laatste is leidend/correct, gebaseerd op je eigen
      accountregio) — een cosmetisch inconsistentie-momentje, niet blokkerend voor een
      opname/functionele test.
    - **Sandbox/TestFlight-abonnementen lopen versneld, maar niet zo snel als Apple's
      officiële versnellingstabel suggereert**: een proefperiode van 1 week duurt in
      testmodus ongeveer 3-5 echte minuten (klopte, bevestigd), maar een **jaarabonnement
      bleek bij Nuvo in de praktijk een paar dagen te duren, niet de ~1 uur die Apple's
      documentatie als versnelde sandbox-duur noemt** (2026-09-20, TestFlight-build met
      eigen Apple-ID, niet een losse sandbox-tester — mogelijk verschilt de versnelling
      tussen een sandbox-tester-account en een TestFlight-beta-aankoop via een echt
      Apple-ID, niet geverifieerd). Ga dus niet uit van ~1 uur voor een jaarabonnement-
      reset; reken op meerdere dagen, of gebruik i.p.v. wachten **Instellingen → App Store
      → Sandbox-account** op het toestel om het testabonnement direct te beëindigen.
      Na afloop (gewacht of geforceerd): app volledig afsluiten+heropenen triggert een
      verse RevenueCat-check — daarna tonen premium-events weer een slot-icoon en biedt
      de paywall opnieuw de proefperiode aan, dat is dan de correcte "niet-geabonneerd"-
      staat voor een Apple-schermopname.
    - Een testaankoop via TestFlight verschijnt **niet** in Instellingen → [Apple-ID] →
      Abonnementen — geen actie nodig om 'm daar op te zeggen, hoort er sowieso niet
      tussen te staan.
    - **Indienen van het antwoord bij een 2.1-verzoek**: de schermopname hoeft alleen bij
      de **Reply** in het Apple-berichtenvenster (Resolution Center) — dát is wat
      daadwerkelijk resubmit triggert. Het losse **"Attachment"-veld** bij App Review
      Information/Notes is een apart, optioneel algemeen bijlage-veld (bv. voor een
      demo-instructie-PDF); niet nodig om de video daar nogmaals aan toe te voegen, en de
      rode "bestandstype niet ondersteund"-hint die daar standaard staat is geen echte
      fout. De 5 tekstpunten wél op **twee plekken** plakken: in de Reply zelf én in de
      Notes van App Review Information (dat laatste is puur referentie, triggert zelf
      geen nieuwe review) — na het plakken in Notes is **"Save" voldoende, "Update
      Review" hoeft niet** (dat knopje is voor losse metadata-wijzigingen buiten een
      Apple-bericht om; de Reply zelf heeft de app al terug de wachtrij in gezet).

17. **Een afgewezen versie opnieuw indienen met een nieuwe build, stap voor stap (2026-09-20,
    Nuvo's 3.1.2(c)-ronde, build 3→6)**: App Store Connect heeft hiervoor **drie losse
    knoppen/plekken die je makkelijk door elkaar haalt**:
    - Op de **"iOS App Version 1.0"-pagina** (metadata: Description/Keywords/Build/App
      Review Information) staat het **Build**-blok. De huidige build vervangen kan **niet**
      door op het buildnúmmer te klikken — dat opent alleen een read-only detailpagina van
      die build (Test Information/Build Metadata). Je moet in plaats daarvan het kleine
      **"✕"-icoontje op de build-kaart** gebruiken om de huidige build los te koppelen, dan
      verschijnt een **"+"-knop** die de picker met alle TestFlight-verwerkte builds opent.
    - Na het kiezen van een nieuwe build verandert de versie-status van "Rejected" naar
      **"Prepare for Submission"**. Klik dan **"Save"**, gevolgd door **"Update Review"**
      (rechtsboven op diezelfde pagina) — dat knopje heet hier zo omdat het een bestaande
      review-thread bijwerkt, niet "Submit for Review" (dat label is alleen voor een
      gloednieuwe, eerste indiening van een app die nog nooit is ingediend).
    - Dat zet de status op **"Ready for Review"**, maar dit is nog geen echte resubmissie.
      Ga naar de aparte **"App Review"-sidebarpagina** (submissies-overzicht, niet de
      metadata-pagina) en klik daar op **"Resubmit to App Review"** — pas dát triggert de
      daadwerkelijke herbeoordeling. Status wordt dan "Waiting for Review".
    - **Verwarrings-valkuil**: "App Review" in het linkermenu is de **inzendingen-
      trackerpagina** (submissie-historie/status), *niet* dezelfde plek als het
      **"App Review Information"-blok** (Sign-In/Contact/Notes) — dat laatste zit
      verderop ónderaan de metadata-pagina zelf (na Build/Included Assets/Game Center),
      geen eigen sidebar-item.
    - **Het Notes-veld blijft bewerkbaar terwijl de status "Waiting for Review" is**
      (ASC toont dan een blauw bannertje: "You can edit some information while your
      version is waiting for review. To submit a new build, you must remove this version
      from review.") — dus de 3.1.2-bevestigingstekst achteraf nog toevoegen aan Notes kon
      gewoon met een simpele "Save", geen nieuwe resubmit-cyclus nodig. Een build wisselen
      terwijl de status al "Waiting for Review" is, kan dus **niet** zonder eerst expliciet
      "remove this version from review" te klikken (ander risico dan de Notes-toevoeging).

## Werkafspraken / valkuilen, los van de App Store zelf

- **Elk `eas`/Apple-interactief commando in een eigen terminalvenster van de gebruiker**,
  nooit via een non-interactieve sandbox-Bash-tool — die breekt stil op credential-
  prompts/2FA/keuzemenu's.
- **Een `fork`-subagent kan een grote meerdere-bestanden-taak stil laten mislukken** (0
  tool-calls, wél een overtuigend "klaar"-verhaal) — controleer na een subagent-taak altijd
  met `git status`/een diff of er echt iets veranderd is, vertrouw niet blind op het
  rapport. Bij twijfel: gewoon zelf direct doen i.p.v. nogmaals delegeren.
- Na een `expo install --fix` (patch-versies) altijd de lopende Metro-dev-server
  herstarten (soms met `--clear`) — een oude server op poort 8081 kan blijven hangen en
  moet dan eerst gekilld worden (`netstat`/`Stop-Process`).
- **Een los/floating sluitknop (bv. bovenaan een volledig-scherm-modal zoals een paywall)
  moet altijd `useSafeAreaInsets()` gebruiken voor de top-offset, nooit een vaste
  `paddingTop`-waarde** — anders komt-ie op een TestFlight-build (die een extra
  "◀ TestFlight"-balk boven de normale statusbalk toont, wat het veilige gebied
  vergroot) onbereikbaar hoog in de hoek te staan, buiten het tikbare gebied. Op een
  gewone App Store-installatie is dit risico kleiner maar niet nul (notch/Dynamic
  Island). Concreet gevonden+gefixt in Nuvo's `paywall-screen.tsx`.
- **Een abonnement-paywall moet zelf (niet alleen de App Store-listingtekst) de
  auto-verlengingsvoorwaarden + een werkende EULA-/privacybeleid-link tonen** (Apple
  Guideline 3.1.2) — duur en prijs stonden bij Nuvo al zichtbaar via de plan-knoppen, maar
  de auto-verlening-disclosure en de twee links ontbraken en zijn een bekende, aparte
  afwijzingsreden los van andere problemen. Geen eigen Terms of Use nodig: linken naar
  Apple's standaard-EULA (`https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`
  — **let op: `internet-services` met streepje, niet `internetservices` aan elkaar**;
  die laatste vorm circuleert in veel oudere documentatie/voorbeelden en gaf bij Nuvo
  een 404 (ontdekt 2026-09-20 toen de gebruiker de link vanuit de paywall testte en op
  Apple's not-found-pagina uitkwam — Apple had de URL-structuur op enig moment gewijzigd,
  geen eigen bug) — dezelfde die App Store Connect zelf toepast als er geen custom EULA
  is ingesteld) is voldoende. Check dit vóór de eerste submissie, niet pas als Apple
  ernaar vraagt, en **test de link écht door 'm aan te tikken**, vertrouw niet op "de
  URL staat er toch" alleen.
  - **Guideline 3.1.2(c) is strenger dan alleen "in de app"**: Apple wil de EULA-/
    privacybeleid-links op **drie** plekken tegelijk, niet één. (1) In de paywall zelf
    (hierboven). (2) De EULA-link **letterlijk als tekst in de App Description**
    (App Store Connect → versie-pagina) — als je Apple's standaard-EULA gebruikt volstaat
    gewoon de kale URL ergens in de beschrijvingstekst plakken. (3) Een apart
    **"Privacy Policy URL"-veld** — dat zit op de **App Privacy-pagina** (Trust &
    Safety-sectie in het linkermenu), niet op de versie-pagina zelf (daar staan alleen
    Support URL/Marketing URL, geen Privacy Policy-veld). Mis je (2) of (3), dan komt
    exact deze 3.1.2(c)-afwijzing terug ook al staat de paywall zelf al goed.
  - **De proefperiode moet ook zíchtbaar zijn vóórdat de gebruiker op "Abonneren" tikt**,
    niet alleen de auto-verlengingsvoorwaarden erna — een paywall die alleen prijs +
    "verlengt automatisch tenzij..." toont, zonder "eerste N dagen gratis" ergens vóór de
    koopknop, is een eigen, onafhankelijk afwijzingsrisico (nooit bij Nuvo concreet
    afgewezen op dit punt, wel proactief gefixt na een kritische zelf-review). Lees de
    proefperiode-lengte bij voorkeur dynamisch uit RevenueCat's `product.introPrice`
    (`price === 0` → gratis periode, `periodUnit`/`periodNumberOfUnits` geeft de lengte) —
    dan klopt de tekst vanzelf als de proefperiode ooit verandert of per plan verschilt,
    i.p.v. de lengte hard te coderen.
  - **RevenueCat vereist "Analytics" + "App Functionality" als purpose bij "Purchases"**
    in de App Privacy-vragenlijst (zie punt 7 hierboven voor de volledige uitleg) — dit
    hoort inhoudelijk bij dezelfde 3.1.2(c)-categorie afwijzingen, check het in dezelfde
    beurt als de links hierboven.
- **Een paywall/koopscherm met een `onClose`-knop moet zichzelf automatisch sluiten na
  een geslaagde aankoop** (`Purchases.purchasePackage(...).then(() => onClose?.())`) —
  zonder die auto-sluit-stap loopt een gebruiker na het afronden van de aankoop vast op
  een scherm dat niet meer weg te tikken is (zelfde sessie: dit + de sluitknop-bug
  hierboven kwamen tegelijk aan het licht doordat de combinatie een echte impasse gaf
  tijdens het maken van de Apple-schermopname).
- **`Purchases.purchasePackage(...).catch(() => {})` stil laten falen is een UX-bug, geen
  neutrale keuze** — een reviewer/gebruiker die de native aankoopsheet annuleert hoort
  niets te zien (dat is normaal gedrag), maar een écht mislukte aankoop (netwerk, geweigerde
  betaling) hoort wel een foutmelding te tonen, anders lijkt de knop kapot. Onderscheid
  maken via `error.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR` (geïmporteerd
  vanuit `react-native-purchases`). Zelfde soort bug bij "Restore Purchases": die
  `resolve`t altijd, ook zonder iets te herstellen — check
  `customerInfo.entitlements.active[ENTITLEMENT_ID]` om een eerlijke "niets gevonden"-
  melding te tonen i.p.v. altijd "hersteld" te claimen.
- **`eas`/`eas-cli` staat niet automatisch in het PATH van een nieuw PowerShell-venster**,
  ook al is het eerder in de sessie geïnstalleerd/gebruikt — gebruik `npx eas-cli <command>`
  i.p.v. kaal `eas <command>` als dat "not recognized" geeft, dat werkt zonder installatie.
- **ASO-keywords tot op de laatste teken exact opvullen**: reken de char-budgetten (max
  100 per taal, komma's tellen mee) van tevoren uit met een klein scriptje i.p.v. handmatig
  tellen — bij Nuvo kwamen de berekende resterende-tekens-getallen (bv. "12", "9", "0")
  bij het invullen in App Store Connect exact overeen met de teller die ASC zelf toont,
  een goede snelle sanity-check dat de string klopt vóórdat je 'm plakt. Kies de laatste
  toe te voegen keyword(s) op een échte, niet-misleidende functie van de app (bv.
  "temperatuur/fever/temperatur" toegevoegd omdat de app daadwerkelijk temperatuur/koorts
  logt) i.p.v. lukraak een woord dat toevallig past. Herhaal nooit woorden die al in
  naam/subtitle staan (die worden al apart geïndexeerd door Apple's zoekalgoritme).
- **Bij meertalige App Store-listings: hardcoded prijzen in de Description-tekst (bv.
  "€5,99/maand") kloppen alleen letterlijk voor talen/landen die ook in euro's betalen.**
  Een Portugese listing gericht op Brazilië (reais, niet euro's) of een Engelse listing die
  ook UK-gebruikers bereikt (ponden) toont dan een bedrag dat de koper nooit exact zo
  betaalt — de daadwerkelijke afschrijving via StoreKit klopt sowieso altijd (Apple toont
  de lokale prijs vóór bevestiging), dit raakt alleen de marketingtekst. Geen keiharde
  regel om dit op te lossen (weeg consistentie-met-andere-talen vs. valuta-neutrale
  formulering per geval), maar wel iets om bewust te benoemen/aan de gebruiker voor te
  leggen bij het opstellen van een listing voor een niet-Eurozone-markt, niet stilzwijgend
  hetzelfde patroon kopiëren.
- **Bij het kiezen van een volgende taal om aan toe te voegen**: prioriteer op combinatie
  van store-bereik (aantal landen/gebruikers waar die taal dominant is) en of de in-app-
  vertaling al bestaat (dan is een nieuwe listing alleen nog metadata-werk, geen code/build
  nodig). Voor Nuvo geadviseerd or­de: Spaans (grootste gecombineerde markt, Spanje + heel
  Latijns-Amerika) > Braziliaans-Portugees (Brazilië is op zichzelf al een van de grootste
  App Store-markten) > Frans (kleiner bereik: Frankrijk + Quebec).
- **EAS Build gratis plan: 15 iOS + 15 Android-builds per maand**, reset maandelijks, met
  lagere wachtrij-prioriteit dan betaalde plannen (Starter ~$19/mnd, Production ~$199/mnd).
  Relevant om in gedachten te houden rond een afwijzingsronde: elke fix-en-opnieuw-submitten-
  cyclus kost een build, dus bij meerdere afwijzingsrondes in dezelfde maand kan dit gaan
  meetellen (bron: [Expo billing-docs](https://docs.expo.dev/billing/plans/), controleer bij
  twijfel het actuele verbruik op expo.dev → account → Billing/Usage).

## Update 2026-09-22 — tweede lancering (Vindra), nieuwe/bevestigde lessen

Meeste van bovenstaand draaiboek klopte 1-op-1 bij een tweede, onafhankelijke app onder
hetzelfde Apple-account (certificaat/provisioning-hergebruik werkte precies zoals
verwacht, zie hieronder). Dit zijn de écht nieuwe punten:

- **RevenueCat: een package houdt één product per store tegelijk aan** — je hoeft de
  bestaande **Test Store**-koppeling in een package niet te verwijderen om er ook de
  echte **App Store**-koppeling aan toe te voegen. Beide staan gewoon naast elkaar in
  dezelfde package (`$rc_monthly`/`$rc_annual`), en RevenueCat kiest zelf de juiste
  op basis van welke SDK/build er draait. Handig: zo blijft Test Store-testen mogelijk
  ook nadat de app live staat.
- **Subscription review-screenshot vs. het "Image (Optional)"-veld zijn twee aparte,
  gelijk-ogende upload-vakken** op dezelfde subscription-pagina — de eerste (verplicht
  voor het eerste abonnement in een groep, "Review Information → Screenshot") is voor
  Apple's reviewers, de tweede (1024×1024, "Image (Optional)") is voor win-back-
  aanbiedingen/App Store-promotie. Een bestand kan per ongeluk in de verkeerde landen —
  controleer expliciet welk vak het bestand toont.
  - Dat "Review Information → Screenshot"-veld **weigert een PNG met alphakanaal**
    ("Images can't contain alpha channels or transparencies"), ook al is de afbeelding
    zelf ondoorzichtig. Los op door als **JPEG** te exporteren (nooit alpha) i.p.v. PNG,
    of expliciet te flattenen tegen een achtergrondkleur vóór het opslaan. Een telefoon-
    screenshot omzetten naar het vereiste 1024×1024-vierkant + geen alpha lukt in één
    stap met Node + `sharp` (`.flatten({background}).resize(1024,1024,{fit:'contain',
    background}).jpeg()`), sneller/preciezer dan een PowerShell/System.Drawing-scriptje.
- **Age Ratings-vragenlijst is september 2026 volledig herbouwd** (categorieën nu:
  In-App Controls, Capabilities, Mature Themes, Medical or Wellness, Sexuality or
  Nudity, Violence, Chance-Based Activities) — voor een simpele logboek-/trackerapp
  zonder social/UGC/advertenties: overal "No"/"None", behalve wat feitelijk van
  toepassing is. Voor een app die gevoelige gezondheids-/gedragsonderwerpen bevat maar
  zelf geen diagnose/behandeladvies geeft: "Medical or Treatment Information" = **None**
  (geeft geen diagnoses/behandeling), "Health or Wellness Topics" = **No** als de app
  ook geen zelfzorg-/leefstijladvíezen geeft (puur registratie, geen aanbevelingen) —
  scheelt een hogere rating als dat onderscheid daadwerkelijk klopt voor de app.
  Resultaat kan alsnog prima 4+ zijn voor een tool die vólwassenen gebruiken (ouders/
  verzorgers), ook als de onderwerpen zelf gevoelig zijn — de rating gaat over getoonde
  content, niet over het onderwerp van een instellingenlabel dat een kind nooit ziet.
- **"Content Rights Information" (App Information-pagina) is een verplicht,
  makkelijk-over-het-hoofd-te-zien blokje** dat nergens in de hoofd-checklist stond —
  Apple blokkeert "Add for Review" hierop als het nog niet expliciet ingevuld is
  ("No, does not contain, show, or access third-party content" voor een app zonder
  licenties van derden).
- **"Add for Review" geeft bij ontbrekende velden eerst een vage generieke foutmelding**
  ("An unexpected error was encountered..."); gewoon nog een keer klikken laat Apple
  daarna de échte, specifieke checklist tonen (Content Rights, Privacy Policy URL,
  category, etc.) — niet meteen paniekeren bij die eerste vage melding, gewoon
  opnieuw proberen.
- **EU-herroepingsrecht bij App Store-abonnementen is Apple's verantwoordelijkheid, niet
  de developer's** (uitgezocht via webonderzoek, niet aangenomen) — Apple is de
  contractuele verkopende partij bij een In-App Purchase-transactie, een gebruiker
  herroept bij Apple, niet bij de app-ontwikkelaar. Voldoende gedekt door de bestaande
  EULA-link (zie 3.1.2(c) hierboven), geen aparte "14/7 dagen herroepbaar"-tekst nodig
  in de eigen listing/paywall.
- **`eas build`/`eas submit` kunnen tijdelijke, niet-code-gerelateerde storingen geven**:
  een `503 Service Unavailable` bij het indienen van een build-verzoek (na succesvolle
  upload) loste vanzelf op door hetzelfde commando gewoon opnieuw te draaien. En
  `eas submit` kan lang (tot 30+ min) in een **"Free Tier Queue"** blijven staan — geen
  storing, gewoon een gedeelde, niet-geprioriteerde wachtrij voor het gratis plan; geen
  actie nodig, gewoon afwachten (of eventueel het account naar een betaald plan
  upgraden als wachttijden een terugkerend probleem worden).
- **App Store Server Notifications instellen loont**: RevenueCat's eigen webhook-URL
  (te vinden in de RevenueCat-app-instellingen, "Apple Server Notification URL") plakken
  bij zowel **Production Server URL** als **Sandbox Server URL** op de App Information-
  pagina — zorgt dat RevenueCat direct van verlengingen/opzeggingen/restituties hoort
  i.p.v. alleen te wachten tot de app zelf weer opent. Kost een paar seconden, geen
  reden om over te slaan.
- **ASO-keywordonderzoek loont als échte research, niet als brainstorm/letterlijke
  vertaling** — een fork die daadwerkelijk webzoekopdrachten deed naar waar de
  doelgroep zelf naar zoekt (forums, concurrerende app-listings, vakterminologie van
  professionals in het veld) vond woorden die een eigen aanname gemist had (bv. het
  woord dat ouders zelf gebruiken i.p.v. een net iets te klinische/eigen formulering,
  en een specifieke vakterm die een directe concurrent-app al zichtbaar gebruikt in
  zijn eigen listing — sterk signaal dat het een levende zoekterm is).
