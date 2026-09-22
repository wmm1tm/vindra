# App Store-listing

Status: wordt nu (2026-09-22) rechtstreeks ingevoerd in App Store Connect, sessie voor
sessie. Alleen **NL (primair) en EN** hieronder uitgewerkt voor v1 — zelfde afweging als
Nuvo (`APP_STORE_LISTING.md` in de BabyTracker-repo): DE/ES/FR/PT kunnen later zonder
nieuwe build toegevoegd worden (wel een nieuwe review-cyclus voor de vertaalde
metadata), pas doen zodra NL/EN aantoonbaar iets trekt. In-app zijn overigens al wél
alle 6 talen een echte vertaling (zie `lib/i18n/translations.ts`) — dat is losstaand van
deze App Store-metadata.

---

## NL (primair)

**Naam:** `Vindra – Gedragslogboek` (al vastgelegd, zie sectie "Naamgeving" in `PLAN.md`
— bewust een neutrale toevoeging achter de streep, geen "Autisme"/"ADHD" zichtbaar op
het beginscherm, die zoektermen horen in de onzichtbare keywords hieronder).

**Subtitle** (max. 30 tekens): `Gedrags- en prikkellogboek` (26 tekens)

**Promotietekst** (max. 170 tekens, los aan te passen zonder nieuwe review):
> Log gedrag, prikkels en stemming van je neurodivergente kind in seconden — en deel een
> duidelijk rapport met school of behandelaar. 7 dagen gratis.

**Beschrijving** (max. 4000 tekens):
> Vindra is een rustige, snelle manier om gedrag, prikkels en stemming van je
> neurodivergente kind bij te houden — precies op de momenten waarop dat het lastigst
> is om iets ingewikkelds open te slaan.
>
> Met het wiel log je in één tik wat er gebeurt: een moeilijk moment, een prikkel, een
> stemmingswisseling, medicatie of een positief moment. Achteraf, met meer rust, kun je
> er de aanleiding, locatie en wat hielp bij invullen — precies wat een behandelaar nodig
> heeft, zonder dat het tijdens het moment zelf in de weg zit.
>
> Wat Vindra anders maakt:
> • Het wiel — snel loggen met maximaal twee keuzeniveaus, ook conditie-specifieke typen
>   (zelfverwonding, weglopen, stimmen) die je zelf aan- of uitzet
> • Een overzichtelijke tijdlijn, ingedeeld op wat bij elkaar hoort — gedrag, prikkels,
>   stemming en verzorging elk in hun eigen kolom, ook als er veel op één moment gebeurt
> • Dag- en weekrapport als PDF, met een duidelijk overzicht van alle events — handig om
>   mee te nemen naar school of een behandelaar
> • Optionele ABC- en Sensory Profile-velden (aanleiding, locatie, wat hielp,
>   prikkeldrempel) — dezelfde begrippen die begeleiders en ergotherapeuten al gebruiken
> • Versleutelde sync tussen ouders/verzorgers — deel de tijdlijn veilig, zonder dat wij
>   ooit kunnen meelezen
> • Alles blijft standaard op je eigen toestel — geen account nodig, geen advertenties,
>   geen tracking
>
> Vindra registreert alleen wat jij zelf invoert. De app stelt geen diagnose, geeft geen
> medisch advies en herkent geen patronen automatisch — het overzicht en de duiding
> daarvan blijven aan jou en, als je dat wilt, een behandelaar.
>
> Proefperiode & abonnement:
> Vindra is 7 dagen gratis te proberen. Daarna kost een abonnement €5,99 per maand of
> €49,99 per jaar (loopt automatisch door, op te zeggen via je Apple-ID-instellingen).
> Gebruiksvoorwaarden: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

**Keywords** (max. 100 tekens, geen woorden die al in naam/subtitle staan) — **herzien
2026-09-22 na onderzoek naar waar ouders daadwerkelijk op zoeken** (zie hieronder):
`autisme,adhd,overprikkeld,meltdown,sensorisch,ergotherapie,abc schema,begeleider,dagrapport,pdf`
(95 tekens)

Onderbouwing (webonderzoek, niet uit eigen aanname):
- **"overprikkeld"** — het woord dat ouders in NL-bronnen (Balans, Sophi, autsider.net)
  zelf gebruiken, ander woord dan "prikkel" (al gedekt via de subtitle).
- **"abc schema"** — specifieke, herkenbare term uit UMCG/onderwijskennis.nl voor precies
  de ABC-gedragsobservatiemethode die Vindra al gebruikt — sterker dan een generieke term.
- **"begeleider"** — vervangt het bureaucratischere "zorgverlener": is al de term die
  Vindra's eigen copy gebruikt (help-scherm, beschrijving) voor wie je data mee deelt.
- **"meltdown"** — bevestigd als levende zoekterm: de sterkste directe concurrent
  ("Behavior Tracker ABC") gebruikt 'm letterlijk in zijn eigen listing.
- **"kind"** weggehaald — te generiek/verzadigd, geen onderscheidende waarde.

**EN keywords** (91 tekens, Name "Vindra – Behavior Log", Subtitle "Behavior & sensory
logbook"):
`autism,adhd,meltdown,aba,abc data,occupational therapy,caregiver,iep,elopement,stimming,pdf`
- **"aba"/"abc data"** — hoe concurrerende Engelstalige apps (ABC Data Pro, Behavior
  Tracker Pro) zichzelf indexeren.
- **"iep"** — Amerikaans equivalent van een NL "IB-gesprek"; ouders zoeken hier letterlijk
  op vóór zo'n schoolgesprek.
- **"elopement"/"stimming"** — de specifieke Engelse vakterm voor Vindra's eigen
  "weglopen"/"stimmen"-event-typen, geen generieke woorden.

**Categorie:** Gezondheid en fitness (primair) — Medisch als alternatief te overwegen,
maar Gezondheid en fitness sluit beter aan (geen medisch hulpmiddel, puur registratie) —
Lifestyle als optionele secundaire categorie.

**Leeftijdsclassificatie:** de 2026-vragenlijst-overhaul heeft een expliciete "medical or
wellness topics"-vraag — eerlijk beantwoorden, verwacht een hogere rating dan 4+ gezien
de gevoelige onderwerpen (zelfverwonding als event-type), geen reden voor afwijzing (zie
sessie-onderzoek in `PLAN.md`, "App Store-compliance zelfverwonding").

---

## EN

**Name:** `Vindra – Behavior Log`

**Subtitle** (max. 30 chars): `Behavior & sensory logbook` (27 chars)

**Promotional text** (max. 170 chars):
> Log behavior, sensory triggers and mood for your neurodivergent child in seconds —
> then share a clear report with school or a care provider. Free for 7 days.

**Description:**
> Vindra is a calm, fast way to track behavior, sensory triggers and mood for your
> neurodivergent child — right when it's hardest to open something complicated.
>
> With the wheel, you log what's happening in one tap: a difficult moment, a sensory
> trigger, a mood shift, medication, or a positive moment. Afterwards, with more time,
> you can fill in the antecedent, location and what helped — exactly what a care
> provider needs, without getting in the way during the moment itself.
>
> What makes Vindra different:
> • The wheel — log in seconds, with at most two levels of choices, including
>   condition-specific types (self-harm, elopement, stimming) you turn on yourself
> • A clear timeline, grouped by what belongs together — behavior, sensory, mood and
>   care each in their own column, even when a lot happens at once
> • Day and week reports as PDF, with a clear overview of every event — handy to bring
>   to school or a care provider
> • Optional ABC and Sensory Profile fields (antecedent, location, what helped, sensory
>   threshold) — the same concepts care providers and occupational therapists already use
> • Encrypted sync between parents/caregivers — share the timeline securely, with no way
>   for us to ever read it
> • Everything stays on your device by default — no account required, no ads, no tracking
>
> Vindra only records what you enter yourself. The app makes no diagnosis, gives no
> medical advice, and doesn't detect patterns automatically — the overview and its
> interpretation stay with you and, if you choose, a care provider.
>
> Free trial & subscription:
> Vindra is free to try for 7 days. After that, a subscription costs €5.99/month or
> €49.99/year (auto-renewing, cancel anytime in your Apple ID settings). Terms of Use:
> https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

**Keywords** (max. 100 chars):
`autism,adhd,meltdown,sensory,occupational therapy,caregiver,daily report,parents,pdf`
(86 chars)

**Category:** Health & Fitness (primary) — Lifestyle as optional secondary.

**Age rating:** same note as NL — expect higher than 4+ given the sensitive event types,
not a rejection reason.

---

## Beslissingen

- **Support-URL**: `https://wmm1tm.github.io/vindra-privacy/` — zelfde patroon als Nuvo
  (bestaande privacyverklaring hergebruikt, bevat al een echt contactadres). Geen aparte
  supportpagina.
- **Marketing-URL**: leeg voor v1, zelfde afweging als Nuvo.
- **Privacy Policy-veld** (App Privacy-pagina, los van Support-URL): ook
  `https://wmm1tm.github.io/vindra-privacy/`.
- **EULA**: Apple's standaard-EULA (geen custom Terms of Use) — link moet op **drie**
  plekken staan (Guideline 3.1.2(c), geleerd bij Nuvo's eigen afwijzing): in de paywall
  zelf (al aanwezig, zie `paywall-screen.tsx`), letterlijk in de App Description
  hierboven (al verwerkt), en impliciet via het EULA-tikpunt — check dit alle drie vóór
  indiening.

## Nog open

- Screenshots: 5 stuks al klaargezet deze sessie (zie chat-geschiedenis 2026-09-22),
  moeten nog in de listing zelf gecontroleerd worden op volgorde/kwaliteit.
- DE/ES/FR/PT App Store-metadata: nog niet opgesteld, pas doen zodra NL/EN aantoonbaar
  iets trekt (zelfde afweging als Nuvo).
- App Review Guideline 2.1 "Information Needed" — Nuvo kreeg dit bij de eerste indiening
  (weinig reviewgeschiedenis destijds). Nu er al een Nuvo-reviewgeschiedenis op dit
  account staat, is dit voor Vindra mogelijk minder waarschijnlijk, maar hou het
  antwoord-sjabloon in `BabyTracker/APP_STORE_LISTING.md` (sectie "Guideline 2.1") bij de
  hand voor het geval het terugkomt — vijf punten: doel/doelgroep, setup zonder account,
  externe diensten (RevenueCat/Supabase), regioverschillen (geen), gereguleerde sector
  (niet van toepassing, geen medisch hulpmiddel).
