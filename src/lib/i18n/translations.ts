/** Eén simpel key-bestand per taal, zelfde patroon als Nuvo (zie SPEC.md §2 in de
 * Nuvo-repo) — geen vertaal-library, gewoon een getypt object per taal zodat een
 * ontbrekende of verkeerd getypte sleutel een TypeScript-fout geeft i.p.v. een lege
 * knop in productie.
 *
 * Alle 6 talen zijn nu echte, onafhankelijke vertalingen (2026-09-22) — niet meer
 * de 1-op-1 NL-aliassen van het oorspronkelijke besluit (PLAN.md sectie 9). `pt` is
 * Braziliaans Portugees (zie `LOCALE_TAGS.pt = 'pt-BR'` in `lib/i18n/index.tsx`). De
 * Sensory Profile-velden (`sensoryThreshold*`/`sensoryResponse*`) gebruiken in het
 * Engels Winnie Dunn's eigen bronterminologie ("sensory threshold", "sensory
 * seeking/avoiding") i.p.v. een letterlijke terugvertaling van het Nederlands. */

export interface Dictionary {
  common: {
    cancel: string;
    save: string;
    saved: string;
    close: string;
    note: string;
    today: string;
  };
  eventTypes: {
    gedrag: string;
    prikkel: string;
    stemming: string;
    medicatie: string;
    slaap: string;
    positief: string;
    overig: string;
    zelfverwonding: string;
    weglopen: string;
    stimmen: string;
    eten: string;
    zindelijkheid: string;
  };
  eventOptions: {
    gedragLicht: string;
    gedragMatig: string;
    gedragHeftig: string;
    prikkelGeluid: string;
    prikkelLicht: string;
    prikkelAanraking: string;
    prikkelGeur: string;
    stemming1: string;
    stemming2: string;
    stemming3: string;
    stemming4: string;
    stemming5: string;
    stimmenFladderen: string;
    stimmenGeluiden: string;
    stimmenWiegen: string;
    etenGeweigerd: string;
    etenNieuw: string;
    etenGegeten: string;
    zindelijkheidGeslaagd: string;
    zindelijkheidOngelukje: string;
    other: string;
  };
  wheel: {
    startSuffix: string;
    endSuffix: string;
    // Ongebruikt bij Vindra's event-typen (geen ml-hoeveelheden) — blijft in de
    // Dictionary omdat inline-input-card.tsx (pure engine) er nog naar verwijst.
    amountCaption: string;
    amountPlaceholder: (unit: string) => string;
    notePlaceholder: string;
    endTimeCaption: string;
    endOfDayCaption: string;
    sinceMidnightCaption: string;
    cancelLabel: string;
    doneLabel: string;
    hourPlaceholder: string;
    minutePlaceholder: string;
    expandWheelLabel: string;
    collapseWheelLabel: string;
    /** VoiceOver-uitleg bij de wielknop in het midden (tik vs. lang drukken). */
    hubHint: string;
  };
  settings: {
    title: string;
    sectionDisplay: string;
    sectionTimeUnits: string;
    sectionManage: string;
    sectionBackup: string;
    timeFormat: string;
    format24: string;
    format12: string;
    // Ongebruikt bij Vindra (geen temperatuurmetingen) — zelfde reden als amountCaption.
    temperature: string;
    volumeUnit: string;
    dayStart: string;
    dayStartHint: string;
    leftHanded: string;
    leftHandedHint: string;
    nightModeAuto: string;
    nightModeAutoHint: string;
    language: string;
    languageSystem: string;
    languageNl: string;
    languageEn: string;
    languageDe: string;
    languageEs: string;
    languageFr: string;
    languagePt: string;
    childrenButton: string;
    wheelButton: string;
    subscriptionButton: string;
    helpButton: string;
    replayIntroButton: string;
    swipeToOpenHint: string;
    sectionDanger: string;
    deleteDayButton: string;
    swipeToDeleteHint: string;
    deleteDayConfirmTitle: string;
    deleteDayConfirmMessage: (day: string) => string;
    deleteDayConfirmButton: string;
    deleteDayEmpty: string;
    deleteDayDone: (count: number) => string;
    exportTitle: string;
    exportHint: string;
    exportCsv: string;
    exportJson: string;
    importTitle: string;
    importHint: string;
    pickFile: string;
    confirmImport: string;
    importResult: (children: number, events: number, ratings: number) => string;
    importError: string;
    importInvalidFile: string;
    importMissingData: string;
  };
  wheelSettings: {
    title: string;
    hint: string;
    maxReachedTitle: string;
    maxReachedMessage: (max: number) => string;
  };
  children: {
    title: string;
    hint: string;
    addButton: string;
    namePlaceholder: string;
    birthDateLabel: string;
    dayPlaceholder: string;
    monthPlaceholder: string;
    yearPlaceholder: string;
    active: string;
    selectButton: string;
    editButton: string;
    editTitle: string;
    archiveButton: string;
    restoreButton: string;
    archivedSectionTitle: string;
    shareButton: string;
    deleteButton: string;
    deleteWarning: (name: string) => string;
    lastActiveWarning: string;
  };
  childShare: {
    title: string;
    shareTab: string;
    linkTab: string;
    shareHint: string;
    backupHint: string;
    saveAsPdf: string;
    linkHint: string;
    cameraPermissionHint: string;
    grantPermission: string;
    linkSuccess: (name: string) => string;
    linkError: string;
    linkNetworkError: string;
    scanAgain: string;
    notConfigured: string;
  };
  dayReport: {
    weekReport: string;
    dayReport: string;
    ratingSuffix: (rating: number) => string;
    dayRatings: string;
    behavior: string;
    other: string;
    overview: string;
    columnType: string;
    columnTime: string;
    columnDetails: string;
    columnNote: string;
    dayMode: string;
    weekMode: string;
    emptyWeek: string;
    emptyDay: string;
    export: string;
  };
  dayRating: {
    title: string;
  };
  dayPicker: {
    title: string;
  };
  eventDetail: {
    edit: string;
    delete: string;
    confirmDelete: string;
    time: string;
    end: string;
    nextDaySuffix: string;
    antecedentLabel: string;
    antecedentPlaceholder: string;
    locationLabel: string;
    locationPlaceholder: string;
    whatHelpedLabel: string;
    whatHelpedPlaceholder: string;
    saveErrorTitle: string;
    saveErrorMessage: string;
    sensoryThresholdLabel: string;
    sensoryThresholdHint: string;
    sensoryThresholdLow: string;
    sensoryThresholdHigh: string;
    sensoryResponseLabel: string;
    sensoryResponseSeeking: string;
    sensoryResponseAvoiding: string;
  };
  timeline: {
    laneBehavior: string;
    laneSensory: string;
    laneMood: string;
    laneCare: string;
    summaryBehavior: (value: string) => string;
    summarySensory: (value: string) => string;
    summaryMood: (value: string) => string;
    summaryCare: (value: string) => string;
    /** Onderregel van de lang-druk-banner: "sleep om te verplaatsen". */
    holdHint: string;
    /** Verschuiving tijdens slepen, bv. "+15 min". */
    holdDelta: (minutes: number) => string;
  };
  formats: {
    durationHour: string;
    durationMinute: string;
  };
  onboarding: {
    nameBannerTitle: string;
    skip: string;
    back: string;
    next: string;
    start: string;
    finish: string;
    welcomeTitle: string;
    welcomeBody: string;
    welcomeTagline: string;
    childTitle: string;
    childBody: string;
    childFootnote: string;
    rolesTitle: string;
    rolesBody: string;
    /** Getoond als de gekozen extra typen samen met de basis niet op het wiel passen. */
    rolesRoomNote: (max: number, labels: string) => string;
    rolesFootnote: string;
    /** Korte, neutrale omschrijving per conditie-specifiek type (defaultEnabled: false). */
    roleHints: {
      zelfverwonding: string;
      weglopen: string;
      stimmen: string;
      eten: string;
      zindelijkheid: string;
    };
    logTitle: string;
    logTap: string;
    logSecondLevel: string;
    logDetails: string;
    logMove: string;
    logHub: string;
    widgetTitle: string;
    widgetBody: string;
    widgetStep1: string;
    widgetStep2: string;
    widgetStep3: string;
    widgetFootnote: string;
    shareTitle: string;
    shareReport: string;
    sharePartner: string;
    sharePrivacy: string;
    shareNoDiagnosis: string;
  };
  help: {
    title: string;
    intro: string;
    wheelTitle: string;
    wheelBody: string;
    customizeTitle: string;
    customizeBody: string;
    reportTitle: string;
    reportBody: string;
    shareTitle: string;
    shareBody: string;
    privacyTitle: string;
    privacyBody: string;
  };
  subscription: {
    title: string;
    benefitIntro: string;
    benefit1: string;
    benefit2: string;
    benefit3: string;
    monthlyLabel: string;
    yearlyLabel: string;
    trialBadge: (days: number) => string;
    trialIntro: (days: number, price: string) => string;
    startTrialButton: string;
    subscribeButton: string;
    purchaseError: string;
    restoreButton: string;
    manageButton: string;
    loadingOfferings: string;
    loadError: string;
    retry: string;
    noOfferings: string;
    statusLoading: string;
    statusTrial: (daysLeft: number) => string;
    statusActiveUntil: (date: string) => string;
    statusNone: string;
    restoreSuccess: string;
    restoreNone: string;
    restoreError: string;
    termsDisclosure: string;
    termsOfUseLabel: string;
    privacyPolicyLabel: string;
  };
}

export const nl: Dictionary = {
  common: {
    cancel: 'Annuleren',
    save: 'Opslaan',
    saved: 'Opgeslagen',
    close: 'Sluiten',
    note: 'Notitie',
    today: 'Vandaag',
  },
  eventTypes: {
    gedrag: 'Gedrag',
    prikkel: 'Prikkel',
    stemming: 'Stemming',
    medicatie: 'Medicatie',
    slaap: 'Slaap',
    positief: 'Positief moment',
    overig: 'Overig',
    zelfverwonding: 'Zelfverwonding',
    weglopen: 'Weglopen',
    stimmen: 'Stimmen',
    eten: 'Eten',
    zindelijkheid: 'Zindelijkheid',
  },
  eventOptions: {
    // Ernstschaal: "Ernstig" i.p.v. het informelere "Heftig" — sluit aan bij hoe
    // klinische ernstschalen dit doorgaans benoemen (licht/matig/ernstig).
    gedragLicht: 'Licht',
    gedragMatig: 'Matig',
    gedragHeftig: 'Ernstig',
    prikkelGeluid: 'Geluid',
    prikkelLicht: 'Licht',
    prikkelAanraking: 'Aanraking',
    prikkelGeur: 'Geur',
    // Neutrale valentie-schaal i.p.v. spreektaal ("naar"/"erg naar") — zelfde
    // register als een psychometrische 5-punts-stemmingsschaal.
    stemming1: 'Zeer negatief',
    stemming2: 'Negatief',
    stemming3: 'Neutraal',
    stemming4: 'Positief',
    stemming5: 'Zeer positief',
    stimmenFladderen: 'Handen fladderen',
    stimmenGeluiden: 'Geluiden maken',
    stimmenWiegen: 'Wiegen',
    etenGeweigerd: 'Geweigerd',
    etenNieuw: 'Nieuw geprobeerd',
    etenGegeten: 'Gegeten',
    zindelijkheidGeslaagd: 'Geslaagd',
    zindelijkheidOngelukje: 'Ongelukje',
    other: 'Anders',
  },
  wheel: {
    startSuffix: ' · start',
    endSuffix: ' · einde',
    amountCaption: 'Hoeveelheid',
    amountPlaceholder: (unit) => unit,
    notePlaceholder: 'Notitie',
    endTimeCaption: 'Eindtijd',
    endOfDayCaption: 'Einde dag',
    sinceMidnightCaption: 'Sinds middernacht',
    cancelLabel: 'Annuleren',
    doneLabel: 'Klaar',
    hourPlaceholder: 'uu',
    minutePlaceholder: 'mm',
    expandWheelLabel: 'Wiel tonen',
    collapseWheelLabel: 'Wiel verbergen',
    hubHint: 'Tik om het wiel te tonen of te verbergen. Houd ingedrukt om het wiel aan te passen.',
  },
  settings: {
    title: 'Instellingen',
    sectionDisplay: 'Weergave',
    sectionTimeUnits: 'Tijd & eenheden',
    sectionManage: 'Beheer',
    sectionBackup: 'Back-up',
    timeFormat: 'Tijdnotatie',
    format24: '24-uurs',
    format12: 'AM/PM',
    temperature: 'Temperatuur',
    volumeUnit: 'Volume-eenheid',
    dayStart: 'Dagstart (uur)',
    dayStartHint:
      'Vanaf welk uur een nieuwe dag telt voor de tellers op de wielknoppen. Standaard 00:00.',
    leftHanded: 'Linkshandig',
    leftHandedHint: 'Spiegelt het wiel naar de linkerkant van het scherm.',
    nightModeAuto: 'Nachtmodus automatisch',
    nightModeAutoHint: 'Schakelt vanzelf naar nachtmodus tussen 22:00 en 06:00.',
    language: 'Taal',
    languageSystem: 'Toestel',
    languageNl: 'Nederlands',
    languageEn: 'English',
    languageDe: 'Deutsch',
    languageEs: 'Español',
    languageFr: 'Français',
    languagePt: 'Português',
    childrenButton: 'Kinderen beheren…',
    wheelButton: 'Wiel aanpassen…',
    subscriptionButton: 'Abonnement',
    helpButton: 'Help',
    replayIntroButton: 'Intro opnieuw bekijken',
    swipeToOpenHint: 'Veeg naar links om te openen',
    sectionDanger: 'Gevarenzone',
    deleteDayButton: 'Verwijder alle events van deze dag',
    swipeToDeleteHint: 'Veeg naar links om te verwijderen',
    deleteDayConfirmTitle: 'Events verwijderen?',
    deleteDayConfirmMessage: (day) =>
      `Alle events van ${day} worden verwijderd. Dit kan niet ongedaan worden gemaakt.`,
    deleteDayConfirmButton: 'Verwijderen',
    deleteDayEmpty: 'Geen events om te verwijderen op deze dag.',
    deleteDayDone: (count) => `${count} event${count === 1 ? '' : 's'} verwijderd.`,
    exportTitle: 'Exporteren',
    exportHint: 'CSV voor een spreadsheet, JSON als volledige back-up (ook te gebruiken om te importeren).',
    exportCsv: 'CSV',
    exportJson: 'JSON-backup',
    importTitle: 'Importeren',
    importHint: 'Zet een eerder geëxporteerde JSON-back-up terug.',
    pickFile: 'Bestand kiezen…',
    confirmImport: 'Ja, importeren',
    importResult: (children, events, ratings) =>
      `Klaar: ${children} kind${children === 1 ? '' : 'eren'}, ${events} events en ${ratings} dagcijfers geïmporteerd.`,
    importError: 'Importeren mislukt.',
    importInvalidFile: 'Dit is geen geldig back-upbestand (kan het niet lezen als JSON).',
    importMissingData: 'Dit back-upbestand mist de verwachte gegevens.',
  },
  wheelSettings: {
    title: 'Wiel aanpassen',
    hint: 'Vink aan/uit welke knoppen in het wiel staan (ook minder gangbare, bv. bij een specifieke situatie), en versleep het handvat rechts om de volgorde aan te passen.',
    maxReachedTitle: 'Maximum bereikt',
    maxReachedMessage: (max) => `Het wiel toont maximaal ${max} knoppen tegelijk. Vink er eerst één uit voordat je deze aanzet.`,
  },
  children: {
    title: 'Kinderen',
    hint: 'Wissel van kind, of voeg er een toe. Elk kind heeft zijn eigen events en instellingen.',
    addButton: '+ Kind toevoegen',
    namePlaceholder: 'Naam',
    birthDateLabel: 'Geboortedatum',
    dayPlaceholder: 'dd',
    monthPlaceholder: 'mm',
    yearPlaceholder: 'jjjj',
    active: 'Actief',
    selectButton: 'Kies',
    editButton: 'Bewerken',
    editTitle: 'Kind bewerken',
    archiveButton: 'Archiveren',
    restoreButton: 'Terugzetten',
    archivedSectionTitle: 'Gearchiveerd',
    shareButton: 'Delen',
    deleteButton: 'Verwijderen',
    deleteWarning: (name) => `Alle gegevens van ${name} worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt.`,
    lastActiveWarning: 'Je kunt het laatste actieve kind niet archiveren — voeg eerst een ander kind toe.',
  },
  childShare: {
    title: 'Delen met partner/begeleider',
    shareTab: 'Delen',
    linkTab: 'Koppelen',
    shareHint:
      'Laat een andere ouder of begeleider deze code scannen om dit kind te volgen. Alles wat je hier logt, gaat versleuteld naar de server — alleen wie deze code scant, kan het lezen.',
    backupHint:
      'Bewaar deze code ook voor jezelf, bijvoorbeeld als PDF, als herstelcode. Raak je je toestel kwijt of zet je het terug naar fabrieksinstellingen, scan hem dan gewoon opnieuw via "Koppelen" om alles terug te krijgen.',
    saveAsPdf: 'Opslaan als PDF',
    linkHint: 'Scan de code die de ander op zijn/haar telefoon laat zien.',
    cameraPermissionHint: 'Nodig om de code te kunnen scannen.',
    grantPermission: 'Camera toestaan',
    linkSuccess: (name) => `${name} gekoppeld — geschiedenis wordt opgehaald.`,
    linkError: 'Deze code kon niet gelezen worden. Probeer het nog eens.',
    linkNetworkError: 'Koppelen mislukt — controleer je internetverbinding en probeer opnieuw.',
    scanAgain: 'Opnieuw scannen',
    notConfigured: 'Delen is nog niet beschikbaar in deze versie.',
  },
  dayReport: {
    weekReport: 'Weekverslag',
    dayReport: 'Dagverslag',
    ratingSuffix: (rating) => ` · Dagcijfer: ${rating}/10`,
    dayRatings: 'Dagcijfers',
    behavior: 'Gedrag & veiligheid',
    other: 'Overig',
    overview: 'Overzicht',
    columnType: 'Type',
    columnTime: 'Tijd',
    columnDetails: 'Details',
    columnNote: 'Notitie',
    dayMode: 'Dag',
    weekMode: 'Week',
    emptyWeek: 'Nog niets gelogd deze week.',
    emptyDay: 'Nog niets gelogd vandaag.',
    export: 'Exporteren',
  },
  dayRating: {
    title: 'Hoe ging vandaag?',
  },
  dayPicker: {
    title: 'Kies een dag',
  },
  eventDetail: {
    edit: 'Bewerken',
    delete: 'Verwijderen',
    confirmDelete: 'Ja, verwijderen',
    time: 'Tijd',
    end: 'Eind',
    nextDaySuffix: '(volgende dag)',
    antecedentLabel: 'Aanleiding',
    antecedentPlaceholder: 'Wat ging eraan vooraf? (optioneel)',
    // "Locatie" i.p.v. het informelere "Plek" — zelfde ABC-schema-veldnaam als in
    // professionele gedragsobservatie-formulieren (bv. UMCG's ABC-schema).
    locationLabel: 'Locatie',
    locationPlaceholder: 'Waar gebeurde dit? (optioneel)',
    whatHelpedLabel: 'Wat hielp',
    whatHelpedPlaceholder: 'Wat hielp om te kalmeren? (optioneel)',
    saveErrorTitle: 'Opslaan mislukt',
    saveErrorMessage: 'De wijziging kon niet worden opgeslagen. Probeer het nog eens.',
    // "Prikkeldrempel" is de vakterm uit de Nederlandse ergotherapie/sensorische-
    // informatieverwerking-praktijk (Winnie Dunn's model) — "Gevoeligheid" was een
    // eigen, minder herkenbare woordkeuze.
    sensoryThresholdLabel: 'Prikkeldrempel',
    sensoryThresholdHint: 'Een lage drempel merkt een prikkel snel op; bij een hoge drempel is er meer nodig voordat het opvalt.',
    sensoryThresholdLow: 'Lage drempel',
    sensoryThresholdHigh: 'Hoge drempel',
    // "Reactie" blijft als veldlabel, maar de twee opties volgen nu Dunn's eigen
    // terminologie voor actieve zelfregulatiestrategie (opzoeken vs. vermijden) i.p.v.
    // de losser geformuleerde "Zocht het juist op".
    sensoryResponseLabel: 'Reactie',
    sensoryResponseSeeking: 'Actief opzoekend',
    sensoryResponseAvoiding: 'Actief vermijdend',
  },
  timeline: {
    laneBehavior: 'Gedrag',
    laneSensory: 'Prikkel',
    laneMood: 'Stemming',
    laneCare: 'Zorg',
    summaryBehavior: (value) => `${value} gedrag`,
    summarySensory: (value) => `${value} prikkel`,
    summaryMood: (value) => `${value} stemming`,
    summaryCare: (value) => `${value} verzorging`,
    holdHint: 'sleep om te verplaatsen',
    holdDelta: (minutes) => `${minutes > 0 ? '+' : ''}${minutes} min`,
  },
  formats: {
    durationHour: 'u',
    durationMinute: 'm',
  },
  onboarding: {
    // Bewust "kind" i.p.v. Nuvo's "kindje" — dat verkleinwoord leest baby-specifiek,
    // maar Vindra's doelgroep omvat ook oudere kinderen/tieners (zie sessienotitie
    // 2026-09-21, feedback op een echte testrun).
    nameBannerTitle: 'Hoe heet je kind?',
    skip: 'Overslaan',
    back: 'Terug',
    next: 'Volgende',
    start: 'Beginnen',
    finish: 'Klaar',
    welcomeTitle: 'Welkom bij Vindra',
    welcomeBody: 'Een rustig logboek voor ouders van een neurodivergent kind. Leg gedrag, prikkels en stemming vast op het moment zelf, in een paar tikken.',
    welcomeTagline: 'En neem een helder overzicht mee naar school of behandelaar.',
    childTitle: 'Voor wie houd je het bij?',
    childBody: 'De naam blijft op je eigen toestel en staat alleen in de rapporten die je zelf deelt. De geboortedatum is optioneel.',
    childFootnote: 'Meer kinderen? Die voeg je later toe via Instellingen → Kinderen beheren.',
    rolesTitle: 'Wat speelt er bij je kind?',
    rolesBody: 'Het wiel heeft al een vaste basis, zoals gedrag, prikkels en stemming. Kies wat je daarnaast wilt kunnen bijhouden. Niets is verplicht.',
    rolesRoomNote: (max, labels) => `Het wiel heeft plek voor ${max} knoppen. Om ruimte te maken, laten we ${labels} voorlopig weg.`,
    rolesFootnote: 'Je kunt dit altijd aanpassen: houd de knop in het midden van het wiel ingedrukt, of ga naar Instellingen → Wiel aanpassen.',
    roleHints: {
      zelfverwonding: 'Momenten waarop je kind zichzelf pijn doet',
      weglopen: 'Wegrennen of ongemerkt vertrekken',
      stimmen: 'Fladderen, wiegen, geluiden: vaak zelfregulerend',
      eten: 'Geweigerd, iets nieuws geprobeerd, gegeten',
      zindelijkheid: 'Gelukt, of een ongelukje',
    },
    logTitle: 'Zo werkt loggen',
    logTap: 'Tik op een knop in het wiel en het moment staat erin, met de tijd van nu.',
    logSecondLevel: 'Soms volgt nog één korte keuze, zoals de ernst of het soort prikkel. Meer niet.',
    logDetails: 'Later rustig aanvullen? Tik op het event in de tijdlijn en vul de aanleiding, locatie en wat hielp in.',
    logMove: 'Klopt de tijd niet? Houd een event in de tijdlijn ingedrukt en versleep het.',
    logHub: 'Tik op de knop in het midden om het wiel weg te klappen. Houd hem ingedrukt om het wiel aan te passen.',
    widgetTitle: 'Loggen vanaf je beginscherm',
    widgetBody: 'Met de widget log je in één tik, zonder de app te openen. Handig als je je handen vol hebt.',
    widgetStep1: 'Houd een lege plek op je beginscherm ingedrukt.',
    widgetStep2: 'Tik op Wijzig (of + bovenin) en dan op Voeg widget toe.',
    widgetStep3: 'Zoek Vindra en kies een formaat.',
    widgetFootnote: 'Gedrag loggen kan altijd. De andere knoppen, en slaap starten en stoppen, horen bij het abonnement.',
    shareTitle: 'Delen, en je privacy',
    shareReport: 'Via het klembord-icoon maak je een dag- of weekoverzicht en exporteer je een PDF voor school of behandelaar.',
    sharePartner: 'Deel een kind met een andere ouder of begeleider via een QR-code. Jullie zien dezelfde tijdlijn, zonder account.',
    sharePrivacy: 'Alles blijft standaard op je eigen toestel, zonder account. Delen gaat end-to-end versleuteld.',
    shareNoDiagnosis: 'Vindra legt vast, maar stelt geen diagnose. Conclusies trek je samen met de mensen die je kind kennen.',
  },
  help: {
    title: 'Wat kan Vindra?',
    intro:
      'Een logboek voor ouders van een neurodivergent kind — snel vastleggen tijdens een moment, met een bruikbaar rapport voor school of behandelaar.',
    wheelTitle: 'Snel loggen',
    wheelBody:
      'Tik op een knop in het wiel om direct te loggen. Sommige types vragen daarna nog om een korte keuze (bv. de ernst) — dat is alles, geen extra stappen tijdens het moment zelf.',
    customizeTitle: 'Wiel aanpassen',
    customizeBody:
      'Via Instellingen → Wiel aanpassen zet je knoppen aan of uit en verander je de volgorde. Niet elk kind heeft dezelfde types nodig: Zelfverwonding, Weglopen, Stimmen, Eten en Zindelijkheid staan daarom standaard uit, maar zijn met één tik toe te voegen (maximaal 8 tegelijk). Snelste weg: houd de knop in het midden van het wiel even ingedrukt.',
    reportTitle: 'Rapport voor school of behandelaar',
    reportBody:
      'Via het klembord-icoon bekijk je een dag- of weekoverzicht en exporteer je een PDF — inclusief de aanleiding/locatie/wat-hielp-velden die je achteraf bij een event kunt invullen.',
    shareTitle: 'Delen met een andere ouder of begeleider',
    shareBody:
      'Via Instellingen → Kinderen beheren kun je een kind versleuteld delen — de ander ziet dezelfde tijdlijn, zonder dat er een account nodig is.',
    privacyTitle: 'Privacy',
    privacyBody:
      'Alles blijft standaard alleen op je eigen toestel. Delen gebeurt end-to-end versleuteld, en er wordt niets bijgehouden buiten wat jij zelf logt.',
  },
  subscription: {
    title: 'Vindra Premium',
    benefitIntro: 'Ontgrendel alle functies van Vindra:',
    benefit1: 'Alle logboek-typen: prikkels, stemming en medicatie naast gedrag',
    benefit2: 'Onbeperkt rapporten delen met school of behandelaar',
    benefit3: 'Versleutelde sync tussen ouders/verzorgers',
    monthlyLabel: 'Maandelijks',
    yearlyLabel: 'Jaarlijks',
    trialBadge: (days) => `eerste ${days} dagen gratis`,
    trialIntro: (days, price) => `${days} dagen gratis, daarna ${price} tenzij je binnen die periode opzegt.`,
    startTrialButton: 'Start gratis proefperiode',
    subscribeButton: 'Abonneren',
    purchaseError: 'Aankoop mislukt. Probeer het opnieuw.',
    restoreButton: 'Aankopen herstellen',
    manageButton: 'Beheer abonnement',
    loadingOfferings: 'Aanbiedingen laden…',
    loadError: 'Kan aanbiedingen niet laden.',
    retry: 'Opnieuw proberen',
    noOfferings: 'Nog geen abonnement beschikbaar.',
    statusLoading: 'Status laden…',
    statusTrial: (daysLeft) => `Nog ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagen'} gratis proefperiode`,
    statusActiveUntil: (date) => `Actief tot ${date}`,
    statusNone: 'Geen actief abonnement',
    restoreSuccess: 'Aankopen hersteld',
    restoreNone: 'Geen eerdere aankopen gevonden voor dit Apple-ID.',
    restoreError: 'Herstellen mislukt',
    termsDisclosure:
      'Abonnementen verlengen automatisch tenzij je minstens 24 uur vóór het einde van de lopende periode opzegt, via je Apple-ID-instellingen.',
    termsOfUseLabel: 'Gebruiksvoorwaarden',
    privacyPolicyLabel: 'Privacybeleid',
  },
};

// Placeholder-aliassen — nog geen echte vertaling, zie bestandsheader.
export const en: Dictionary = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    saved: 'Saved',
    close: 'Close',
    note: 'Note',
    today: 'Today',
  },
  eventTypes: {
    gedrag: 'Behavior',
    prikkel: 'Sensory input',
    stemming: 'Mood',
    medicatie: 'Medication',
    slaap: 'Sleep',
    positief: 'Positive moment',
    overig: 'Other',
    zelfverwonding: 'Self-harm',
    weglopen: 'Elopement',
    stimmen: 'Stimming',
    eten: 'Eating',
    zindelijkheid: 'Toileting',
  },
  eventOptions: {
    gedragLicht: 'Mild',
    gedragMatig: 'Moderate',
    gedragHeftig: 'Severe',
    prikkelGeluid: 'Sound',
    prikkelLicht: 'Light',
    prikkelAanraking: 'Touch',
    prikkelGeur: 'Smell',
    stemming1: 'Very negative',
    stemming2: 'Negative',
    stemming3: 'Neutral',
    stemming4: 'Positive',
    stemming5: 'Very positive',
    stimmenFladderen: 'Hand flapping',
    stimmenGeluiden: 'Making sounds',
    stimmenWiegen: 'Rocking',
    etenGeweigerd: 'Refused',
    etenNieuw: 'Tried something new',
    etenGegeten: 'Ate',
    zindelijkheidGeslaagd: 'Success',
    zindelijkheidOngelukje: 'Accident',
    other: 'Other',
  },
  wheel: {
    startSuffix: ' · start',
    endSuffix: ' · end',
    amountCaption: 'Amount',
    amountPlaceholder: (unit) => unit,
    notePlaceholder: 'Note',
    endTimeCaption: 'End time',
    endOfDayCaption: 'End of day',
    sinceMidnightCaption: 'Since midnight',
    cancelLabel: 'Cancel',
    doneLabel: 'Done',
    hourPlaceholder: 'hh',
    minutePlaceholder: 'mm',
    expandWheelLabel: 'Show wheel',
    collapseWheelLabel: 'Hide wheel',
    hubHint: 'Tap to show or hide the wheel. Hold to customize the wheel.',
  },
  settings: {
    title: 'Settings',
    sectionDisplay: 'Display',
    sectionTimeUnits: 'Time & units',
    sectionManage: 'Manage',
    sectionBackup: 'Backup',
    timeFormat: 'Time format',
    format24: '24-hour',
    format12: 'AM/PM',
    temperature: 'Temperature',
    volumeUnit: 'Volume unit',
    dayStart: 'Day start (hour)',
    dayStartHint: 'From which hour a new day counts for the counters on the wheel buttons. Default is 00:00.',
    leftHanded: 'Left-handed',
    leftHandedHint: 'Mirrors the wheel to the left side of the screen.',
    nightModeAuto: 'Automatic night mode',
    nightModeAutoHint: 'Switches to night mode automatically between 10 PM and 6 AM.',
    language: 'Language',
    languageSystem: 'Device',
    languageNl: 'Nederlands',
    languageEn: 'English',
    languageDe: 'Deutsch',
    languageEs: 'Español',
    languageFr: 'Français',
    languagePt: 'Português',
    childrenButton: 'Manage children…',
    wheelButton: 'Customize wheel…',
    subscriptionButton: 'Subscription',
    helpButton: 'Help',
    replayIntroButton: 'Replay the intro',
    swipeToOpenHint: 'Swipe left to open',
    sectionDanger: 'Danger zone',
    deleteDayButton: 'Delete all events for this day',
    swipeToDeleteHint: 'Swipe left to delete',
    deleteDayConfirmTitle: 'Delete events?',
    deleteDayConfirmMessage: (day) => `All events for ${day} will be deleted. This cannot be undone.`,
    deleteDayConfirmButton: 'Delete',
    deleteDayEmpty: 'No events to delete on this day.',
    deleteDayDone: (count) => `${count} event${count === 1 ? '' : 's'} deleted.`,
    exportTitle: 'Export',
    exportHint: 'CSV for a spreadsheet, JSON as a full backup (also usable for importing).',
    exportCsv: 'CSV',
    exportJson: 'JSON backup',
    importTitle: 'Import',
    importHint: 'Restore a previously exported JSON backup.',
    pickFile: 'Choose file…',
    confirmImport: 'Yes, import',
    importResult: (children, events, ratings) =>
      `Done: imported ${children} ${children === 1 ? 'child' : 'children'}, ${events} events, and ${ratings} day ratings.`,
    importError: 'Import failed.',
    importInvalidFile: "This isn't a valid backup file (couldn't read it as JSON).",
    importMissingData: 'This backup file is missing the expected data.',
  },
  wheelSettings: {
    title: 'Customize wheel',
    hint: 'Turn wheel buttons on or off (including less common ones, e.g. for a specific situation), and drag the handle on the right to reorder them.',
    maxReachedTitle: 'Maximum reached',
    maxReachedMessage: (max) => `The wheel shows a maximum of ${max} buttons at once. Turn one off first before enabling this one.`,
  },
  children: {
    title: 'Children',
    hint: 'Switch child, or add a new one. Each child has their own events and settings.',
    addButton: '+ Add child',
    namePlaceholder: 'Name',
    birthDateLabel: 'Date of birth',
    dayPlaceholder: 'dd',
    monthPlaceholder: 'mm',
    yearPlaceholder: 'yyyy',
    active: 'Active',
    selectButton: 'Select',
    editButton: 'Edit',
    editTitle: 'Edit child',
    archiveButton: 'Archive',
    restoreButton: 'Restore',
    archivedSectionTitle: 'Archived',
    shareButton: 'Share',
    deleteButton: 'Delete',
    deleteWarning: (name) => `All of ${name}'s data will be permanently deleted. This cannot be undone.`,
    lastActiveWarning: "You can't archive the last active child — add another child first.",
  },
  childShare: {
    title: 'Share with partner/caregiver',
    shareTab: 'Share',
    linkTab: 'Link',
    shareHint:
      'Have another parent or caregiver scan this code to follow this child. Everything you log here is sent to the server encrypted — only whoever scans this code can read it.',
    backupHint:
      'Keep this code for yourself too, for example as a PDF, as a recovery code. If you lose your device or factory-reset it, just scan it again via "Link" to get everything back.',
    saveAsPdf: 'Save as PDF',
    linkHint: 'Scan the code the other person shows on their phone.',
    cameraPermissionHint: 'Needed to scan the code.',
    grantPermission: 'Allow camera',
    linkSuccess: (name) => `${name} linked — retrieving history.`,
    linkError: 'This code could not be read. Please try again.',
    linkNetworkError: 'Linking failed — check your internet connection and try again.',
    scanAgain: 'Scan again',
    notConfigured: "Sharing isn't available yet in this version.",
  },
  dayReport: {
    weekReport: 'Week report',
    dayReport: 'Day report',
    ratingSuffix: (rating) => ` · Day rating: ${rating}/10`,
    dayRatings: 'Day ratings',
    behavior: 'Behavior & safety',
    other: 'Other',
    overview: 'Overview',
    columnType: 'Type',
    columnTime: 'Time',
    columnDetails: 'Details',
    columnNote: 'Note',
    dayMode: 'Day',
    weekMode: 'Week',
    emptyWeek: 'Nothing logged this week yet.',
    emptyDay: 'Nothing logged today yet.',
    export: 'Export',
  },
  dayRating: {
    title: 'How did today go?',
  },
  dayPicker: {
    title: 'Choose a day',
  },
  eventDetail: {
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Yes, delete',
    time: 'Time',
    end: 'End',
    nextDaySuffix: '(next day)',
    antecedentLabel: 'Antecedent',
    antecedentPlaceholder: 'What happened right before? (optional)',
    locationLabel: 'Location',
    locationPlaceholder: 'Where did this happen? (optional)',
    whatHelpedLabel: 'What helped',
    whatHelpedPlaceholder: 'What helped them calm down? (optional)',
    saveErrorTitle: 'Save failed',
    saveErrorMessage: 'The change could not be saved. Please try again.',
    sensoryThresholdLabel: 'Sensory threshold',
    sensoryThresholdHint: "A low threshold notices a sensory input quickly; a high threshold needs more before it's noticed.",
    sensoryThresholdLow: 'Low threshold',
    sensoryThresholdHigh: 'High threshold',
    sensoryResponseLabel: 'Response',
    sensoryResponseSeeking: 'Sensory seeking',
    sensoryResponseAvoiding: 'Sensory avoiding',
  },
  timeline: {
    laneBehavior: 'Behavior',
    laneSensory: 'Sensory',
    laneMood: 'Mood',
    laneCare: 'Care',
    summaryBehavior: (value) => `${value} behavior`,
    summarySensory: (value) => `${value} sensory`,
    summaryMood: (value) => `${value} mood`,
    summaryCare: (value) => `${value} care`,
    holdHint: 'drag to move',
    holdDelta: (minutes) => `${minutes > 0 ? '+' : ''}${minutes} min`,
  },
  formats: {
    durationHour: 'h',
    durationMinute: 'm',
  },
  onboarding: {
    nameBannerTitle: "What's your child's name?",
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    start: "Let's start",
    finish: 'Done',
    welcomeTitle: 'Welcome to Vindra',
    welcomeBody: 'A calm logbook for parents of a neurodivergent child. Capture behavior, sensory input and mood in the moment, in just a few taps.',
    welcomeTagline: 'And bring a clear overview to school or a care provider.',
    childTitle: 'Who are you keeping track for?',
    childBody: 'The name stays on your own device and only appears in reports you choose to share. The birth date is optional.',
    childFootnote: 'More than one child? Add them later under Settings → Manage children.',
    rolesTitle: 'What plays a role for your child?',
    rolesBody: 'The wheel already has a fixed base, such as behavior, sensory input and mood. Choose what else you would like to track. Nothing is required.',
    rolesRoomNote: (max, labels) => `The wheel has room for ${max} buttons. To make space, ${labels} will be left off for now.`,
    rolesFootnote: 'You can change this any time: hold the button in the middle of the wheel, or go to Settings → Customize wheel.',
    roleHints: {
      zelfverwonding: 'Moments when your child hurts themselves',
      weglopen: 'Running off or leaving without telling anyone',
      stimmen: 'Flapping, rocking, sounds: often self-regulating',
      eten: 'Refused, tried something new, ate',
      zindelijkheid: 'Went well, or an accident',
    },
    logTitle: 'How logging works',
    logTap: 'Tap a button on the wheel and the moment is saved, with the current time.',
    logSecondLevel: 'Sometimes one quick choice follows, like severity or the kind of sensory input. That is all.',
    logDetails: 'Want to add more later, when things are calm? Tap the event on the timeline to fill in the antecedent, location and what helped.',
    logMove: 'Wrong time? Press and hold an event on the timeline and drag it.',
    logHub: 'Tap the button in the middle to fold the wheel away. Hold it to customize the wheel.',
    widgetTitle: 'Log from your home screen',
    widgetBody: 'The widget logs in one tap, without opening the app. Handy when your hands are full.',
    widgetStep1: 'Touch and hold an empty spot on your home screen.',
    widgetStep2: 'Tap Edit (or + at the top), then Add Widget.',
    widgetStep3: 'Search for Vindra and pick a size.',
    widgetFootnote: 'Logging behavior is always free. The other buttons, and starting and stopping sleep, come with the subscription.',
    shareTitle: 'Sharing, and your privacy',
    shareReport: 'Tap the clipboard icon for a day or week overview, and export a PDF for school or a care provider.',
    sharePartner: 'Share a child with another parent or caregiver using a QR code. You both see the same timeline, no account needed.',
    sharePrivacy: 'Everything stays on your own device by default, without an account. Sharing is end-to-end encrypted.',
    shareNoDiagnosis: 'Vindra records, it does not diagnose. You draw conclusions together with the people who know your child.',
  },
  help: {
    title: 'What can Vindra do?',
    intro:
      'A logbook for parents of a neurodivergent child — log quickly in the moment, with a report you can actually use for school or a care provider.',
    wheelTitle: 'Quick logging',
    wheelBody:
      "Tap a button on the wheel to log instantly. Some types then ask for one quick choice (e.g. severity) — that's it, no extra steps in the moment itself.",
    customizeTitle: 'Customize the wheel',
    customizeBody:
      'Under Settings → Customize wheel you can turn buttons on or off and change their order. Not every child needs the same types: Self-harm, Elopement, Stimming, Eating, and Toileting are off by default, but can be added with one tap (up to 8 at once). Quickest way: press and hold the button in the middle of the wheel.',
    reportTitle: 'Report for school or a care provider',
    reportBody:
      "Tap the clipboard icon to see a day or week overview and export a PDF — including the antecedent/location/what-helped fields you can fill in for an event afterward.",
    shareTitle: 'Share with another parent or caregiver',
    shareBody:
      'Under Settings → Manage children you can share a child encrypted — the other person sees the same timeline, no account needed.',
    privacyTitle: 'Privacy',
    privacyBody:
      'Everything stays on your own device by default. Sharing is end-to-end encrypted, and nothing is tracked beyond what you log yourself.',
  },
  subscription: {
    title: 'Vindra Premium',
    benefitIntro: "Unlock all of Vindra's features:",
    benefit1: 'Every logbook type: sensory input, mood, and medication alongside behavior',
    benefit2: 'Unlimited report sharing with school or a care provider',
    benefit3: 'Encrypted sync between parents/caregivers',
    monthlyLabel: 'Monthly',
    yearlyLabel: 'Yearly',
    trialBadge: (days) => `first ${days} days free`,
    trialIntro: (days, price) => `${days} days free, then ${price} unless you cancel within that period.`,
    startTrialButton: 'Start free trial',
    subscribeButton: 'Subscribe',
    purchaseError: 'Purchase failed. Please try again.',
    restoreButton: 'Restore purchases',
    manageButton: 'Manage subscription',
    loadingOfferings: 'Loading offers…',
    loadError: "Couldn't load offers.",
    retry: 'Try again',
    noOfferings: 'No subscription available yet.',
    statusLoading: 'Loading status…',
    statusTrial: (daysLeft) => `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left in your free trial`,
    statusActiveUntil: (date) => `Active until ${date}`,
    statusNone: 'No active subscription',
    restoreSuccess: 'Purchases restored',
    restoreNone: 'No previous purchases found for this Apple ID.',
    restoreError: 'Restore failed',
    termsDisclosure:
      'Subscriptions renew automatically unless you cancel at least 24 hours before the end of the current period, via your Apple ID settings.',
    termsOfUseLabel: 'Terms of Use',
    privacyPolicyLabel: 'Privacy Policy',
  },
};
export const de: Dictionary = {
  common: {
    cancel: 'Abbrechen',
    save: 'Speichern',
    saved: 'Gespeichert',
    close: 'Schließen',
    note: 'Notiz',
    today: 'Heute',
  },
  eventTypes: {
    gedrag: 'Verhalten',
    prikkel: 'Reiz',
    stemming: 'Stimmung',
    medicatie: 'Medikation',
    slaap: 'Schlaf',
    positief: 'Schöner Moment',
    overig: 'Sonstiges',
    zelfverwonding: 'Selbstverletzung',
    weglopen: 'Weglaufen',
    stimmen: 'Stimming',
    eten: 'Essen',
    zindelijkheid: 'Sauberkeitstraining',
  },
  eventOptions: {
    gedragLicht: 'Leicht',
    gedragMatig: 'Mittel',
    gedragHeftig: 'Schwer',
    prikkelGeluid: 'Geräusch',
    prikkelLicht: 'Licht',
    prikkelAanraking: 'Berührung',
    prikkelGeur: 'Geruch',
    stemming1: 'Sehr negativ',
    stemming2: 'Negativ',
    stemming3: 'Neutral',
    stemming4: 'Positiv',
    stemming5: 'Sehr positiv',
    stimmenFladderen: 'Mit den Händen flattern',
    stimmenGeluiden: 'Geräusche machen',
    stimmenWiegen: 'Wiegen',
    etenGeweigerd: 'Verweigert',
    etenNieuw: 'Neu probiert',
    etenGegeten: 'Gegessen',
    zindelijkheidGeslaagd: 'Geklappt',
    zindelijkheidOngelukje: 'Missgeschick',
    other: 'Anderes',
  },
  wheel: {
    startSuffix: ' · Start',
    endSuffix: ' · Ende',
    amountCaption: 'Menge',
    amountPlaceholder: (unit) => unit,
    notePlaceholder: 'Notiz',
    endTimeCaption: 'Endzeit',
    endOfDayCaption: 'Tagesende',
    sinceMidnightCaption: 'Seit Mitternacht',
    cancelLabel: 'Abbrechen',
    doneLabel: 'Fertig',
    hourPlaceholder: 'ss',
    minutePlaceholder: 'mm',
    expandWheelLabel: 'Rad anzeigen',
    collapseWheelLabel: 'Rad ausblenden',
    hubHint: 'Tippen zeigt oder verbirgt das Rad. Gedrückt halten, um das Rad anzupassen.',
  },
  settings: {
    title: 'Einstellungen',
    sectionDisplay: 'Anzeige',
    sectionTimeUnits: 'Zeit & Einheiten',
    sectionManage: 'Verwalten',
    sectionBackup: 'Backup',
    timeFormat: 'Zeitformat',
    format24: '24-Stunden',
    format12: 'AM/PM',
    temperature: 'Temperatur',
    volumeUnit: 'Volumeneinheit',
    dayStart: 'Tagesbeginn (Stunde)',
    dayStartHint: 'Ab welcher Stunde ein neuer Tag für die Zähler auf den Rad-Buttons zählt. Standard ist 00:00.',
    leftHanded: 'Linkshändig',
    leftHandedHint: 'Spiegelt das Rad auf die linke Bildschirmseite.',
    nightModeAuto: 'Nachtmodus automatisch',
    nightModeAutoHint: 'Wechselt automatisch zwischen 22:00 und 6:00 Uhr in den Nachtmodus.',
    language: 'Sprache',
    languageSystem: 'Gerät',
    languageNl: 'Nederlands',
    languageEn: 'English',
    languageDe: 'Deutsch',
    languageEs: 'Español',
    languageFr: 'Français',
    languagePt: 'Português',
    childrenButton: 'Kinder verwalten…',
    wheelButton: 'Rad anpassen…',
    subscriptionButton: 'Abonnement',
    helpButton: 'Hilfe',
    replayIntroButton: 'Einführung erneut ansehen',
    swipeToOpenHint: 'Nach links wischen zum Öffnen',
    sectionDanger: 'Gefahrenzone',
    deleteDayButton: 'Alle Ereignisse dieses Tages löschen',
    swipeToDeleteHint: 'Nach links wischen zum Löschen',
    deleteDayConfirmTitle: 'Ereignisse löschen?',
    deleteDayConfirmMessage: (day) => `Alle Ereignisse vom ${day} werden gelöscht. Das kann nicht rückgängig gemacht werden.`,
    deleteDayConfirmButton: 'Löschen',
    deleteDayEmpty: 'Keine Ereignisse an diesem Tag zu löschen.',
    deleteDayDone: (count) => `${count} Ereignis${count === 1 ? '' : 'se'} gelöscht.`,
    exportTitle: 'Exportieren',
    exportHint: 'CSV für eine Tabelle, JSON als vollständiges Backup (auch zum Importieren nutzbar).',
    exportCsv: 'CSV',
    exportJson: 'JSON-Backup',
    importTitle: 'Importieren',
    importHint: 'Ein zuvor exportiertes JSON-Backup wiederherstellen.',
    pickFile: 'Datei wählen…',
    confirmImport: 'Ja, importieren',
    importResult: (children, events, ratings) =>
      `Fertig: ${children} Kind${children === 1 ? '' : 'er'}, ${events} Ereignisse und ${ratings} Tagesbewertungen importiert.`,
    importError: 'Import fehlgeschlagen.',
    importInvalidFile: 'Das ist keine gültige Backup-Datei (konnte nicht als JSON gelesen werden).',
    importMissingData: 'Dieser Backup-Datei fehlen die erwarteten Daten.',
  },
  wheelSettings: {
    title: 'Rad anpassen',
    hint: 'Aktiviere oder deaktiviere Buttons im Rad (auch weniger gängige, z. B. für eine bestimmte Situation), und ziehe den Griff rechts, um die Reihenfolge zu ändern.',
    maxReachedTitle: 'Maximum erreicht',
    maxReachedMessage: (max) => `Das Rad zeigt maximal ${max} Buttons gleichzeitig. Deaktiviere zuerst einen, bevor du diesen aktivierst.`,
  },
  children: {
    title: 'Kinder',
    hint: 'Wechsle das Kind oder füge ein neues hinzu. Jedes Kind hat seine eigenen Ereignisse und Einstellungen.',
    addButton: '+ Kind hinzufügen',
    namePlaceholder: 'Name',
    birthDateLabel: 'Geburtsdatum',
    dayPlaceholder: 'tt',
    monthPlaceholder: 'mm',
    yearPlaceholder: 'jjjj',
    active: 'Aktiv',
    selectButton: 'Auswählen',
    editButton: 'Bearbeiten',
    editTitle: 'Kind bearbeiten',
    archiveButton: 'Archivieren',
    restoreButton: 'Wiederherstellen',
    archivedSectionTitle: 'Archiviert',
    shareButton: 'Teilen',
    deleteButton: 'Löschen',
    deleteWarning: (name) => `Alle Daten von ${name} werden dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden.`,
    lastActiveWarning: 'Du kannst das letzte aktive Kind nicht archivieren — füge zuerst ein anderes Kind hinzu.',
  },
  childShare: {
    title: 'Mit Partner/Betreuer teilen',
    shareTab: 'Teilen',
    linkTab: 'Verknüpfen',
    shareHint:
      'Lass einen anderen Elternteil oder Betreuer diesen Code scannen, um dieses Kind zu verfolgen. Alles, was du hier einträgst, wird verschlüsselt an den Server gesendet — nur wer diesen Code scannt, kann es lesen.',
    backupHint:
      'Bewahre diesen Code auch für dich selbst auf, zum Beispiel als PDF, als Wiederherstellungscode. Verlierst du dein Gerät oder setzt es auf Werkseinstellungen zurück, scanne ihn einfach erneut über "Verknüpfen", um alles zurückzubekommen.',
    saveAsPdf: 'Als PDF speichern',
    linkHint: 'Scanne den Code, den die andere Person auf ihrem Telefon zeigt.',
    cameraPermissionHint: 'Wird benötigt, um den Code zu scannen.',
    grantPermission: 'Kamera erlauben',
    linkSuccess: (name) => `${name} verknüpft — Verlauf wird abgerufen.`,
    linkError: 'Dieser Code konnte nicht gelesen werden. Bitte versuche es erneut.',
    linkNetworkError: 'Verknüpfen fehlgeschlagen — überprüfe deine Internetverbindung und versuche es erneut.',
    scanAgain: 'Erneut scannen',
    notConfigured: 'Teilen ist in dieser Version noch nicht verfügbar.',
  },
  dayReport: {
    weekReport: 'Wochenbericht',
    dayReport: 'Tagesbericht',
    ratingSuffix: (rating) => ` · Tagesbewertung: ${rating}/10`,
    dayRatings: 'Tagesbewertungen',
    behavior: 'Verhalten & Sicherheit',
    other: 'Sonstiges',
    overview: 'Übersicht',
    columnType: 'Typ',
    columnTime: 'Zeit',
    columnDetails: 'Details',
    columnNote: 'Notiz',
    dayMode: 'Tag',
    weekMode: 'Woche',
    emptyWeek: 'Diese Woche noch nichts protokolliert.',
    emptyDay: 'Heute noch nichts protokolliert.',
    export: 'Exportieren',
  },
  dayRating: {
    title: 'Wie war heute?',
  },
  dayPicker: {
    title: 'Tag auswählen',
  },
  eventDetail: {
    edit: 'Bearbeiten',
    delete: 'Löschen',
    confirmDelete: 'Ja, löschen',
    time: 'Zeit',
    end: 'Ende',
    nextDaySuffix: '(nächster Tag)',
    antecedentLabel: 'Auslöser',
    antecedentPlaceholder: 'Was ist unmittelbar davor passiert? (optional)',
    locationLabel: 'Ort',
    locationPlaceholder: 'Wo ist das passiert? (optional)',
    whatHelpedLabel: 'Was geholfen hat',
    whatHelpedPlaceholder: 'Was hat beim Beruhigen geholfen? (optional)',
    saveErrorTitle: 'Speichern fehlgeschlagen',
    saveErrorMessage: 'Die Änderung konnte nicht gespeichert werden. Bitte versuche es erneut.',
    sensoryThresholdLabel: 'Reizschwelle',
    sensoryThresholdHint: 'Bei einer niedrigen Schwelle fällt ein Reiz schnell auf; bei einer hohen Schwelle braucht es mehr, bevor er bemerkt wird.',
    sensoryThresholdLow: 'Niedrige Schwelle',
    sensoryThresholdHigh: 'Hohe Schwelle',
    sensoryResponseLabel: 'Reaktion',
    sensoryResponseSeeking: 'Reizsuchend',
    sensoryResponseAvoiding: 'Reizvermeidend',
  },
  timeline: {
    laneBehavior: 'Verhalten',
    laneSensory: 'Reize',
    laneMood: 'Stimmung',
    laneCare: 'Pflege',
    summaryBehavior: (value) => `${value} Verhalten`,
    summarySensory: (value) => `${value} Reize`,
    summaryMood: (value) => `${value} Stimmung`,
    summaryCare: (value) => `${value} Pflege`,
    holdHint: 'ziehen zum Verschieben',
    holdDelta: (minutes) => `${minutes > 0 ? '+' : ''}${minutes} Min.`,
  },
  formats: {
    durationHour: 'Std',
    durationMinute: 'Min',
  },
  onboarding: {
    nameBannerTitle: 'Wie heißt dein Kind?',
    skip: 'Überspringen',
    back: 'Zurück',
    next: 'Weiter',
    start: "Los geht's",
    finish: 'Fertig',
    welcomeTitle: 'Willkommen bei Vindra',
    welcomeBody: 'Ein ruhiges Logbuch für Eltern eines neurodivergenten Kindes. Halte Verhalten, Reize und Stimmung direkt im Moment fest, mit wenigen Tipps.',
    welcomeTagline: 'Und nimm eine klare Übersicht mit zur Schule oder zum Therapeuten.',
    childTitle: 'Für wen führst du das Logbuch?',
    childBody: 'Der Name bleibt auf deinem eigenen Gerät und erscheint nur in Berichten, die du selbst teilst. Das Geburtsdatum ist freiwillig.',
    childFootnote: 'Mehrere Kinder? Die fügst du später unter Einstellungen → Kinder verwalten hinzu.',
    rolesTitle: 'Was spielt bei deinem Kind eine Rolle?',
    rolesBody: 'Das Rad hat schon eine feste Grundausstattung, etwa Verhalten, Reize und Stimmung. Wähle, was du zusätzlich festhalten möchtest. Nichts davon ist Pflicht.',
    rolesRoomNote: (max, labels) => `Das Rad hat Platz für ${max} Buttons. Um Platz zu schaffen, lassen wir ${labels} vorerst weg.`,
    rolesFootnote: 'Das kannst du jederzeit ändern: Halte den Button in der Mitte des Rads gedrückt, oder geh zu Einstellungen → Rad anpassen.',
    roleHints: {
      zelfverwonding: 'Momente, in denen dein Kind sich selbst wehtut',
      weglopen: 'Davonlaufen oder unbemerkt weggehen',
      stimmen: 'Flattern, Schaukeln, Geräusche: oft selbstregulierend',
      eten: 'Abgelehnt, Neues probiert, gegessen',
      zindelijkheid: 'Hat geklappt, oder ein kleines Missgeschick',
    },
    logTitle: 'So funktioniert das Protokollieren',
    logTap: 'Tippe auf einen Button im Rad, und der Moment ist gespeichert, mit der aktuellen Uhrzeit.',
    logSecondLevel: 'Manchmal folgt noch eine kurze Auswahl, etwa der Schweregrad oder die Art des Reizes. Mehr nicht.',
    logDetails: 'Später in Ruhe ergänzen? Tippe in der Zeitleiste auf das Ereignis und trage Auslöser, Ort und Was geholfen hat ein.',
    logMove: 'Uhrzeit stimmt nicht? Halte ein Ereignis in der Zeitleiste gedrückt und verschiebe es.',
    logHub: 'Tippe auf den Button in der Mitte, um das Rad einzuklappen. Halte ihn gedrückt, um das Rad anzupassen.',
    widgetTitle: 'Erfassen vom Home-Bildschirm',
    widgetBody: 'Das Widget erfasst mit einem Tipp, ohne die App zu öffnen. Praktisch, wenn du die Hände voll hast.',
    widgetStep1: 'Halte eine freie Stelle auf deinem Home-Bildschirm gedrückt.',
    widgetStep2: 'Tippe auf Bearbeiten (oder + oben) und dann auf Widget hinzufügen.',
    widgetStep3: 'Suche nach Vindra und wähle eine Größe.',
    widgetFootnote: 'Verhalten erfassen ist immer kostenlos. Die anderen Tasten sowie Schlaf starten und beenden gehören zum Abo.',
    shareTitle: 'Teilen, und deine Privatsphäre',
    shareReport: 'Über das Klemmbrett-Symbol erstellst du eine Tages- oder Wochenübersicht und exportierst ein PDF für Schule oder Therapeut.',
    sharePartner: 'Teile ein Kind per QR-Code mit einem anderen Elternteil oder Betreuer. Ihr seht dieselbe Zeitleiste, ganz ohne Konto.',
    sharePrivacy: 'Standardmäßig bleibt alles auf deinem eigenen Gerät, ohne Konto. Geteilt wird Ende-zu-Ende-verschlüsselt.',
    shareNoDiagnosis: 'Vindra hält fest, stellt aber keine Diagnose. Schlüsse ziehst du gemeinsam mit den Menschen, die dein Kind kennen.',
  },
  help: {
    title: 'Was kann Vindra?',
    intro:
      'Ein Logbuch für Eltern eines neurodivergenten Kindes — schnell im Moment festhalten, mit einem Bericht, der für Schule oder Therapeut wirklich nützlich ist.',
    wheelTitle: 'Schnell protokollieren',
    wheelBody:
      "Tippe auf einen Button im Rad, um sofort zu protokollieren. Manche Typen fragen danach noch kurz nach (z. B. dem Schweregrad) — das war's, keine weiteren Schritte im Moment selbst.",
    customizeTitle: 'Rad anpassen',
    customizeBody:
      'Unter Einstellungen → Rad anpassen aktivierst oder deaktivierst du Buttons und änderst ihre Reihenfolge. Nicht jedes Kind braucht dieselben Typen: Selbstverletzung, Weglaufen, Stimming, Essen und Sauberkeitstraining sind daher standardmäßig deaktiviert, lassen sich aber mit einem Tipp hinzufügen (maximal 8 gleichzeitig). Am schnellsten: Halte den Button in der Mitte des Rads kurz gedrückt.',
    reportTitle: 'Bericht für Schule oder Therapeut',
    reportBody:
      'Über das Klemmbrett-Symbol siehst du eine Tages- oder Wochenübersicht und exportierst ein PDF — inklusive der Auslöser-/Ort-/Was-geholfen-hat-Felder, die du nachträglich bei einem Ereignis ausfüllen kannst.',
    shareTitle: 'Mit einem anderen Elternteil oder Betreuer teilen',
    shareBody:
      'Unter Einstellungen → Kinder verwalten kannst du ein Kind verschlüsselt teilen — die andere Person sieht dieselbe Zeitleiste, ohne dass ein Konto nötig ist.',
    privacyTitle: 'Datenschutz',
    privacyBody:
      'Standardmäßig bleibt alles nur auf deinem eigenen Gerät. Teilen erfolgt Ende-zu-Ende-verschlüsselt, und es wird nichts erfasst außer dem, was du selbst protokollierst.',
  },
  subscription: {
    title: 'Vindra Premium',
    benefitIntro: 'Schalte alle Funktionen von Vindra frei:',
    benefit1: 'Alle Logbuch-Typen: Reize, Stimmung und Medikation neben Verhalten',
    benefit2: 'Unbegrenztes Teilen von Berichten mit Schule oder Therapeut',
    benefit3: 'Verschlüsselte Synchronisierung zwischen Eltern/Betreuern',
    monthlyLabel: 'Monatlich',
    yearlyLabel: 'Jährlich',
    trialBadge: (days) => `erste ${days} Tage gratis`,
    trialIntro: (days, price) => `${days} Tage gratis, danach ${price}, außer du kündigst innerhalb dieses Zeitraums.`,
    startTrialButton: 'Kostenlose Testphase starten',
    subscribeButton: 'Abonnieren',
    purchaseError: 'Kauf fehlgeschlagen. Bitte versuche es erneut.',
    restoreButton: 'Käufe wiederherstellen',
    manageButton: 'Abonnement verwalten',
    loadingOfferings: 'Angebote werden geladen…',
    loadError: 'Angebote konnten nicht geladen werden.',
    retry: 'Erneut versuchen',
    noOfferings: 'Noch kein Abonnement verfügbar.',
    statusLoading: 'Status wird geladen…',
    statusTrial: (daysLeft) => `Noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'} kostenlose Testphase`,
    statusActiveUntil: (date) => `Aktiv bis ${date}`,
    statusNone: 'Kein aktives Abonnement',
    restoreSuccess: 'Käufe wiederhergestellt',
    restoreNone: 'Keine früheren Käufe für diese Apple-ID gefunden.',
    restoreError: 'Wiederherstellen fehlgeschlagen',
    termsDisclosure:
      'Abonnements verlängern sich automatisch, außer du kündigst mindestens 24 Stunden vor Ende des laufenden Zeitraums über deine Apple-ID-Einstellungen.',
    termsOfUseLabel: 'Nutzungsbedingungen',
    privacyPolicyLabel: 'Datenschutzerklärung',
  },
};
export const es: Dictionary = {
  common: {
    cancel: 'Cancelar',
    save: 'Guardar',
    saved: 'Guardado',
    close: 'Cerrar',
    note: 'Nota',
    today: 'Hoy',
  },
  eventTypes: {
    gedrag: 'Conducta',
    prikkel: 'Estímulo sensorial',
    stemming: 'Estado de ánimo',
    medicatie: 'Medicación',
    slaap: 'Sueño',
    positief: 'Momento positivo',
    overig: 'Otro',
    zelfverwonding: 'Autolesión',
    weglopen: 'Fuga',
    stimmen: 'Autoestimulación',
    eten: 'Alimentación',
    zindelijkheid: 'Control de esfínteres',
  },
  eventOptions: {
    gedragLicht: 'Leve',
    gedragMatig: 'Moderado',
    gedragHeftig: 'Grave',
    prikkelGeluid: 'Sonido',
    prikkelLicht: 'Luz',
    prikkelAanraking: 'Tacto',
    prikkelGeur: 'Olor',
    stemming1: 'Muy negativo',
    stemming2: 'Negativo',
    stemming3: 'Neutral',
    stemming4: 'Positivo',
    stemming5: 'Muy positivo',
    stimmenFladderen: 'Aleteo de manos',
    stimmenGeluiden: 'Hacer sonidos',
    stimmenWiegen: 'Balanceo',
    etenGeweigerd: 'Rechazado',
    etenNieuw: 'Probó algo nuevo',
    etenGegeten: 'Comió',
    zindelijkheidGeslaagd: 'Logrado',
    zindelijkheidOngelukje: 'Accidente',
    other: 'Otro',
  },
  wheel: {
    startSuffix: ' · inicio',
    endSuffix: ' · fin',
    amountCaption: 'Cantidad',
    amountPlaceholder: (unit) => unit,
    notePlaceholder: 'Nota',
    endTimeCaption: 'Hora de fin',
    endOfDayCaption: 'Fin del día',
    sinceMidnightCaption: 'Desde medianoche',
    cancelLabel: 'Cancelar',
    doneLabel: 'Listo',
    hourPlaceholder: 'hh',
    minutePlaceholder: 'mm',
    expandWheelLabel: 'Mostrar rueda',
    collapseWheelLabel: 'Ocultar rueda',
    hubHint: 'Toca para mostrar u ocultar la rueda. Mantén pulsado para personalizarla.',
  },
  settings: {
    title: 'Ajustes',
    sectionDisplay: 'Pantalla',
    sectionTimeUnits: 'Hora y unidades',
    sectionManage: 'Gestionar',
    sectionBackup: 'Copia de seguridad',
    timeFormat: 'Formato de hora',
    format24: '24 horas',
    format12: 'AM/PM',
    temperature: 'Temperatura',
    volumeUnit: 'Unidad de volumen',
    dayStart: 'Inicio del día (hora)',
    dayStartHint: 'A partir de qué hora cuenta un nuevo día para los contadores de los botones de la rueda. Por defecto, las 00:00.',
    leftHanded: 'Zurdo',
    leftHandedHint: 'Refleja la rueda hacia el lado izquierdo de la pantalla.',
    nightModeAuto: 'Modo nocturno automático',
    nightModeAutoHint: 'Cambia automáticamente al modo nocturno entre las 22:00 y las 6:00.',
    language: 'Idioma',
    languageSystem: 'Dispositivo',
    languageNl: 'Nederlands',
    languageEn: 'English',
    languageDe: 'Deutsch',
    languageEs: 'Español',
    languageFr: 'Français',
    languagePt: 'Português',
    childrenButton: 'Gestionar niños…',
    wheelButton: 'Personalizar rueda…',
    subscriptionButton: 'Suscripción',
    helpButton: 'Ayuda',
    replayIntroButton: 'Ver la introducción otra vez',
    swipeToOpenHint: 'Desliza hacia la izquierda para abrir',
    sectionDanger: 'Zona de peligro',
    deleteDayButton: 'Eliminar todos los eventos de este día',
    swipeToDeleteHint: 'Desliza hacia la izquierda para eliminar',
    deleteDayConfirmTitle: '¿Eliminar eventos?',
    deleteDayConfirmMessage: (day) => `Se eliminarán todos los eventos del ${day}. Esta acción no se puede deshacer.`,
    deleteDayConfirmButton: 'Eliminar',
    deleteDayEmpty: 'No hay eventos que eliminar este día.',
    deleteDayDone: (count) => `${count} evento${count === 1 ? '' : 's'} eliminado${count === 1 ? '' : 's'}.`,
    exportTitle: 'Exportar',
    exportHint: 'CSV para una hoja de cálculo, JSON como copia de seguridad completa (también sirve para importar).',
    exportCsv: 'CSV',
    exportJson: 'Copia JSON',
    importTitle: 'Importar',
    importHint: 'Restaura una copia de seguridad JSON exportada anteriormente.',
    pickFile: 'Elegir archivo…',
    confirmImport: 'Sí, importar',
    importResult: (children, events, ratings) =>
      `Listo: se importaron ${children} niño${children === 1 ? '' : 's'}, ${events} eventos y ${ratings} valoraciones diarias.`,
    importError: 'Error al importar.',
    importInvalidFile: 'Este no es un archivo de copia de seguridad válido (no se pudo leer como JSON).',
    importMissingData: 'A este archivo de copia de seguridad le faltan los datos esperados.',
  },
  wheelSettings: {
    title: 'Personalizar rueda',
    hint: 'Activa o desactiva los botones de la rueda (incluidos los menos habituales, por ejemplo para una situación concreta), y arrastra el tirador de la derecha para cambiar el orden.',
    maxReachedTitle: 'Máximo alcanzado',
    maxReachedMessage: (max) => `La rueda muestra un máximo de ${max} botones a la vez. Desactiva uno antes de activar este.`,
  },
  children: {
    title: 'Niños',
    hint: 'Cambia de niño o añade uno nuevo. Cada niño tiene sus propios eventos y ajustes.',
    addButton: '+ Añadir niño',
    namePlaceholder: 'Nombre',
    birthDateLabel: 'Fecha de nacimiento',
    dayPlaceholder: 'dd',
    monthPlaceholder: 'mm',
    yearPlaceholder: 'aaaa',
    active: 'Activo',
    selectButton: 'Seleccionar',
    editButton: 'Editar',
    editTitle: 'Editar niño',
    archiveButton: 'Archivar',
    restoreButton: 'Restaurar',
    archivedSectionTitle: 'Archivado',
    shareButton: 'Compartir',
    deleteButton: 'Eliminar',
    deleteWarning: (name) => `Todos los datos de ${name} se eliminarán permanentemente. Esta acción no se puede deshacer.`,
    lastActiveWarning: 'No puedes archivar al último niño activo — añade primero otro niño.',
  },
  childShare: {
    title: 'Compartir con pareja/cuidador',
    shareTab: 'Compartir',
    linkTab: 'Vincular',
    shareHint:
      'Deja que otro padre/madre o cuidador escanee este código para seguir a este niño. Todo lo que registres aquí se envía cifrado al servidor — solo quien escanee este código puede leerlo.',
    backupHint:
      'Guarda este código también para ti, por ejemplo como PDF, como código de recuperación. Si pierdes tu dispositivo o lo restableces a los valores de fábrica, vuelve a escanearlo mediante "Vincular" para recuperarlo todo.',
    saveAsPdf: 'Guardar como PDF',
    linkHint: 'Escanea el código que la otra persona muestra en su teléfono.',
    cameraPermissionHint: 'Necesaria para escanear el código.',
    grantPermission: 'Permitir cámara',
    linkSuccess: (name) => `${name} vinculado — obteniendo historial.`,
    linkError: 'No se pudo leer este código. Inténtalo de nuevo.',
    linkNetworkError: 'Error al vincular — comprueba tu conexión a internet e inténtalo de nuevo.',
    scanAgain: 'Escanear de nuevo',
    notConfigured: 'Compartir todavía no está disponible en esta versión.',
  },
  dayReport: {
    weekReport: 'Informe semanal',
    dayReport: 'Informe diario',
    ratingSuffix: (rating) => ` · Valoración del día: ${rating}/10`,
    dayRatings: 'Valoraciones diarias',
    behavior: 'Conducta y seguridad',
    other: 'Otro',
    overview: 'Resumen',
    columnType: 'Tipo',
    columnTime: 'Hora',
    columnDetails: 'Detalles',
    columnNote: 'Nota',
    dayMode: 'Día',
    weekMode: 'Semana',
    emptyWeek: 'Aún no se ha registrado nada esta semana.',
    emptyDay: 'Aún no se ha registrado nada hoy.',
    export: 'Exportar',
  },
  dayRating: {
    title: '¿Cómo fue el día de hoy?',
  },
  dayPicker: {
    title: 'Elige un día',
  },
  eventDetail: {
    edit: 'Editar',
    delete: 'Eliminar',
    confirmDelete: 'Sí, eliminar',
    time: 'Hora',
    end: 'Fin',
    nextDaySuffix: '(día siguiente)',
    antecedentLabel: 'Antecedente',
    antecedentPlaceholder: '¿Qué pasó justo antes? (opcional)',
    locationLabel: 'Ubicación',
    locationPlaceholder: '¿Dónde ocurrió esto? (opcional)',
    whatHelpedLabel: 'Qué ayudó',
    whatHelpedPlaceholder: '¿Qué ayudó a calmarse? (opcional)',
    saveErrorTitle: 'Error al guardar',
    saveErrorMessage: 'No se pudo guardar el cambio. Inténtalo de nuevo.',
    sensoryThresholdLabel: 'Umbral sensorial',
    sensoryThresholdHint: 'Un umbral bajo detecta un estímulo rápidamente; un umbral alto necesita más para notarlo.',
    sensoryThresholdLow: 'Umbral bajo',
    sensoryThresholdHigh: 'Umbral alto',
    sensoryResponseLabel: 'Respuesta',
    sensoryResponseSeeking: 'Búsqueda sensorial',
    sensoryResponseAvoiding: 'Evitación sensorial',
  },
  timeline: {
    laneBehavior: 'Conducta',
    laneSensory: 'Estímulos',
    laneMood: 'Ánimo',
    laneCare: 'Cuidados',
    summaryBehavior: (value) => `${value} conducta`,
    summarySensory: (value) => `${value} estímulos`,
    summaryMood: (value) => `${value} estado de ánimo`,
    summaryCare: (value) => `${value} cuidados`,
    holdHint: 'arrastra para mover',
    holdDelta: (minutes) => `${minutes > 0 ? '+' : ''}${minutes} min`,
  },
  formats: {
    durationHour: 'h',
    durationMinute: 'm',
  },
  onboarding: {
    nameBannerTitle: '¿Cómo se llama tu hijo/a?',
    skip: 'Omitir',
    back: 'Atrás',
    next: 'Siguiente',
    start: 'Empezar',
    finish: 'Listo',
    welcomeTitle: 'Te damos la bienvenida a Vindra',
    welcomeBody: 'Un diario tranquilo para padres de un niño neurodivergente. Registra la conducta, los estímulos sensoriales y el estado de ánimo en el momento, con solo unos toques.',
    welcomeTagline: 'Y lleva un resumen claro al colegio o al terapeuta.',
    childTitle: '¿Para quién llevas el registro?',
    childBody: 'El nombre se queda en tu propio dispositivo y solo aparece en los informes que tú decidas compartir. La fecha de nacimiento es opcional.',
    childFootnote: '¿Más de un niño? Añádelos más tarde en Ajustes → Gestionar niños.',
    rolesTitle: '¿Qué es relevante para tu hijo/a?',
    rolesBody: 'La rueda ya tiene una base fija, como la conducta, los estímulos sensoriales y el estado de ánimo. Elige qué más quieres poder registrar. Nada es obligatorio.',
    rolesRoomNote: (max, labels) => `La rueda tiene espacio para ${max} botones. Para hacer sitio, de momento dejamos fuera ${labels}.`,
    rolesFootnote: 'Puedes cambiarlo cuando quieras: mantén pulsado el botón del centro de la rueda, o ve a Ajustes → Personalizar rueda.',
    roleHints: {
      zelfverwonding: 'Momentos en que tu hijo/a se hace daño a sí mismo/a',
      weglopen: 'Salir corriendo o irse sin avisar',
      stimmen: 'Aletear, balancearse, hacer sonidos: a menudo autorregulador',
      eten: 'Rechazó, probó algo nuevo, comió',
      zindelijkheid: 'Salió bien, o un pequeño accidente',
    },
    logTitle: 'Así funciona el registro',
    logTap: 'Toca un botón de la rueda y el momento queda guardado, con la hora actual.',
    logSecondLevel: 'A veces sigue una elección rápida, como la gravedad o el tipo de estímulo. Nada más.',
    logDetails: '¿Quieres completarlo más tarde, con calma? Toca el evento en la línea de tiempo y añade el antecedente, la ubicación y qué ayudó.',
    logMove: '¿La hora no es correcta? Mantén pulsado un evento en la línea de tiempo y arrástralo.',
    logHub: 'Toca el botón del centro para plegar la rueda. Mantenlo pulsado para personalizarla.',
    widgetTitle: 'Registra desde tu pantalla de inicio',
    widgetBody: 'El widget registra con un toque, sin abrir la app. Práctico cuando tienes las manos ocupadas.',
    widgetStep1: 'Mantén pulsado un espacio vacío de tu pantalla de inicio.',
    widgetStep2: 'Toca Editar (o + arriba) y luego Añadir widget.',
    widgetStep3: 'Busca Vindra y elige un tamaño.',
    widgetFootnote: 'Registrar conductas siempre es gratis. Los demás botones, e iniciar y detener el sueño, forman parte de la suscripción.',
    shareTitle: 'Compartir, y tu privacidad',
    shareReport: 'Con el icono del portapapeles creas un resumen diario o semanal y exportas un PDF para el colegio o el terapeuta.',
    sharePartner: 'Comparte un niño con otro padre, madre o cuidador mediante un código QR. La otra persona ve la misma línea de tiempo, sin necesidad de cuenta.',
    sharePrivacy: 'Por defecto, todo se queda en tu propio dispositivo, sin cuenta. Compartir se hace con cifrado de extremo a extremo.',
    shareNoDiagnosis: 'Vindra registra, pero no diagnostica. Las conclusiones las sacas tú junto con las personas que conocen a tu hijo/a.',
  },
  help: {
    title: '¿Qué puede hacer Vindra?',
    intro:
      'Un diario para padres de un niño neurodivergente — registra rápidamente en el momento, con un informe realmente útil para el colegio o el terapeuta.',
    wheelTitle: 'Registro rápido',
    wheelBody:
      'Toca un botón de la rueda para registrar al instante. Algunos tipos piden después una elección rápida (por ejemplo, la gravedad) — eso es todo, sin pasos adicionales en el momento.',
    customizeTitle: 'Personalizar la rueda',
    customizeBody:
      'En Ajustes → Personalizar rueda puedes activar o desactivar botones y cambiar su orden. No todos los niños necesitan los mismos tipos: Autolesión, Fuga, Autoestimulación, Alimentación y Control de esfínteres están desactivados por defecto, pero se pueden añadir con un toque (máximo 8 a la vez). Lo más rápido: mantén pulsado el botón del centro de la rueda.',
    reportTitle: 'Informe para el colegio o el terapeuta',
    reportBody:
      'Con el icono del portapapeles ves un resumen diario o semanal y exportas un PDF — incluidos los campos de antecedente/ubicación/qué ayudó que puedes rellenar después en un evento.',
    shareTitle: 'Compartir con otro padre/madre o cuidador',
    shareBody:
      'En Ajustes → Gestionar niños puedes compartir un niño de forma cifrada — la otra persona ve la misma línea de tiempo, sin necesidad de una cuenta.',
    privacyTitle: 'Privacidad',
    privacyBody:
      'Por defecto, todo permanece solo en tu propio dispositivo. Compartir se hace cifrado de extremo a extremo, y no se registra nada más allá de lo que tú mismo anotas.',
  },
  subscription: {
    title: 'Vindra Premium',
    benefitIntro: 'Desbloquea todas las funciones de Vindra:',
    benefit1: 'Todos los tipos de registro: estímulos, estado de ánimo y medicación además de conducta',
    benefit2: 'Compartir informes sin límites con el colegio o el terapeuta',
    benefit3: 'Sincronización cifrada entre padres/cuidadores',
    monthlyLabel: 'Mensual',
    yearlyLabel: 'Anual',
    trialBadge: (days) => `primeros ${days} días gratis`,
    trialIntro: (days, price) => `${days} días gratis, después ${price} a menos que canceles dentro de ese período.`,
    startTrialButton: 'Iniciar prueba gratuita',
    subscribeButton: 'Suscribirse',
    purchaseError: 'Error en la compra. Inténtalo de nuevo.',
    restoreButton: 'Restaurar compras',
    manageButton: 'Gestionar suscripción',
    loadingOfferings: 'Cargando ofertas…',
    loadError: 'No se pudieron cargar las ofertas.',
    retry: 'Reintentar',
    noOfferings: 'Todavía no hay ninguna suscripción disponible.',
    statusLoading: 'Cargando estado…',
    statusTrial: (daysLeft) => `${daysLeft} ${daysLeft === 1 ? 'día restante' : 'días restantes'} de prueba gratuita`,
    statusActiveUntil: (date) => `Activo hasta ${date}`,
    statusNone: 'Sin suscripción activa',
    restoreSuccess: 'Compras restauradas',
    restoreNone: 'No se encontraron compras anteriores para este ID de Apple.',
    restoreError: 'Error al restaurar',
    termsDisclosure:
      'Las suscripciones se renuevan automáticamente a menos que canceles al menos 24 horas antes del final del período actual, desde los ajustes de tu ID de Apple.',
    termsOfUseLabel: 'Condiciones de uso',
    privacyPolicyLabel: 'Política de privacidad',
  },
};
export const fr: Dictionary = {
  common: {
    cancel: 'Annuler',
    save: 'Enregistrer',
    saved: 'Enregistré',
    close: 'Fermer',
    note: 'Note',
    today: "Aujourd'hui",
  },
  eventTypes: {
    gedrag: 'Comportement',
    prikkel: 'Stimulus sensoriel',
    stemming: 'Humeur',
    medicatie: 'Médicament',
    slaap: 'Sommeil',
    positief: 'Moment positif',
    overig: 'Autre',
    zelfverwonding: 'Automutilation',
    weglopen: 'Fugue',
    stimmen: 'Autostimulation',
    eten: 'Alimentation',
    zindelijkheid: 'Propreté',
  },
  eventOptions: {
    gedragLicht: 'Léger',
    gedragMatig: 'Modéré',
    gedragHeftig: 'Sévère',
    prikkelGeluid: 'Son',
    prikkelLicht: 'Lumière',
    prikkelAanraking: 'Toucher',
    prikkelGeur: 'Odeur',
    stemming1: 'Très négatif',
    stemming2: 'Négatif',
    stemming3: 'Neutre',
    stemming4: 'Positif',
    stemming5: 'Très positif',
    stimmenFladderen: 'Battements des mains',
    stimmenGeluiden: 'Faire des bruits',
    stimmenWiegen: 'Balancement',
    etenGeweigerd: 'Refusé',
    etenNieuw: 'A essayé quelque chose de nouveau',
    etenGegeten: 'Mangé',
    zindelijkheidGeslaagd: 'Réussi',
    zindelijkheidOngelukje: 'Petit accident',
    other: 'Autre',
  },
  wheel: {
    startSuffix: ' · début',
    endSuffix: ' · fin',
    amountCaption: 'Quantité',
    amountPlaceholder: (unit) => unit,
    notePlaceholder: 'Note',
    endTimeCaption: 'Heure de fin',
    endOfDayCaption: 'Fin de journée',
    sinceMidnightCaption: 'Depuis minuit',
    cancelLabel: 'Annuler',
    doneLabel: 'Terminé',
    hourPlaceholder: 'hh',
    minutePlaceholder: 'mm',
    expandWheelLabel: 'Afficher la roue',
    collapseWheelLabel: 'Masquer la roue',
    hubHint: 'Appuie pour afficher ou masquer la roue. Maintiens pour personnaliser la roue.',
  },
  settings: {
    title: 'Réglages',
    sectionDisplay: 'Affichage',
    sectionTimeUnits: 'Heure et unités',
    sectionManage: 'Gérer',
    sectionBackup: 'Sauvegarde',
    timeFormat: "Format de l'heure",
    format24: '24 heures',
    format12: 'AM/PM',
    temperature: 'Température',
    volumeUnit: 'Unité de volume',
    dayStart: 'Début de journée (heure)',
    dayStartHint: 'À partir de quelle heure une nouvelle journée compte pour les compteurs sur les boutons de la roue. Par défaut, 00h00.',
    leftHanded: 'Gaucher',
    leftHandedHint: "Reflète la roue vers le côté gauche de l'écran.",
    nightModeAuto: 'Mode nuit automatique',
    nightModeAutoHint: 'Passe automatiquement en mode nuit entre 22h00 et 6h00.',
    language: 'Langue',
    languageSystem: 'Appareil',
    languageNl: 'Nederlands',
    languageEn: 'English',
    languageDe: 'Deutsch',
    languageEs: 'Español',
    languageFr: 'Français',
    languagePt: 'Português',
    childrenButton: 'Gérer les enfants…',
    wheelButton: 'Personnaliser la roue…',
    subscriptionButton: 'Abonnement',
    helpButton: 'Aide',
    replayIntroButton: "Revoir l'introduction",
    swipeToOpenHint: 'Glisser vers la gauche pour ouvrir',
    sectionDanger: 'Zone de danger',
    deleteDayButton: 'Supprimer tous les événements de ce jour',
    swipeToDeleteHint: 'Glisser vers la gauche pour supprimer',
    deleteDayConfirmTitle: 'Supprimer les événements ?',
    deleteDayConfirmMessage: (day) => `Tous les événements du ${day} seront supprimés. Cette action est irréversible.`,
    deleteDayConfirmButton: 'Supprimer',
    deleteDayEmpty: 'Aucun événement à supprimer ce jour-là.',
    deleteDayDone: (count) => `${count} événement${count === 1 ? '' : 's'} supprimé${count === 1 ? '' : 's'}.`,
    exportTitle: 'Exporter',
    exportHint: 'CSV pour un tableur, JSON comme sauvegarde complète (utilisable aussi pour importer).',
    exportCsv: 'CSV',
    exportJson: 'Sauvegarde JSON',
    importTitle: 'Importer',
    importHint: 'Restaure une sauvegarde JSON précédemment exportée.',
    pickFile: 'Choisir un fichier…',
    confirmImport: 'Oui, importer',
    importResult: (children, events, ratings) =>
      `Terminé : ${children} enfant${children === 1 ? '' : 's'}, ${events} événements et ${ratings} évaluations quotidiennes importés.`,
    importError: "Échec de l'importation.",
    importInvalidFile: "Ce n'est pas un fichier de sauvegarde valide (impossible de le lire comme du JSON).",
    importMissingData: 'Il manque les données attendues dans ce fichier de sauvegarde.',
  },
  wheelSettings: {
    title: 'Personnaliser la roue',
    hint: 'Active ou désactive les boutons de la roue (y compris les moins courants, par exemple pour une situation particulière), et fais glisser la poignée à droite pour changer leur ordre.',
    maxReachedTitle: 'Maximum atteint',
    maxReachedMessage: (max) => `La roue affiche au maximum ${max} boutons à la fois. Désactive d'abord un bouton avant d'activer celui-ci.`,
  },
  children: {
    title: 'Enfants',
    hint: "Change d'enfant, ou ajoutes-en un. Chaque enfant a ses propres événements et réglages.",
    addButton: '+ Ajouter un enfant',
    namePlaceholder: 'Prénom',
    birthDateLabel: 'Date de naissance',
    dayPlaceholder: 'jj',
    monthPlaceholder: 'mm',
    yearPlaceholder: 'aaaa',
    active: 'Actif',
    selectButton: 'Choisir',
    editButton: 'Modifier',
    editTitle: "Modifier l'enfant",
    archiveButton: 'Archiver',
    restoreButton: 'Restaurer',
    archivedSectionTitle: 'Archivé',
    shareButton: 'Partager',
    deleteButton: 'Supprimer',
    deleteWarning: (name) => `Toutes les données de ${name} seront définitivement supprimées. Cette action est irréversible.`,
    lastActiveWarning: "Tu ne peux pas archiver le dernier enfant actif — ajoute d'abord un autre enfant.",
  },
  childShare: {
    title: 'Partager avec un partenaire/accompagnant',
    shareTab: 'Partager',
    linkTab: 'Lier',
    shareHint:
      "Fais scanner ce code par un autre parent ou accompagnant pour qu'il puisse suivre cet enfant. Tout ce que tu enregistres ici est envoyé chiffré au serveur — seule la personne qui scanne ce code peut le lire.",
    backupHint:
      'Conserve aussi ce code pour toi, par exemple en PDF, comme code de récupération. Si tu perds ton appareil ou le réinitialises, scanne-le simplement à nouveau via "Lier" pour tout récupérer.',
    saveAsPdf: 'Enregistrer en PDF',
    linkHint: "Scanne le code que l'autre personne affiche sur son téléphone.",
    cameraPermissionHint: 'Nécessaire pour scanner le code.',
    grantPermission: "Autoriser l'appareil photo",
    linkSuccess: (name) => `${name} lié — récupération de l'historique en cours.`,
    linkError: "Ce code n'a pas pu être lu. Réessaie.",
    linkNetworkError: 'Échec de la liaison — vérifie ta connexion internet et réessaie.',
    scanAgain: 'Scanner à nouveau',
    notConfigured: "Le partage n'est pas encore disponible dans cette version.",
  },
  dayReport: {
    weekReport: 'Rapport hebdomadaire',
    dayReport: 'Rapport journalier',
    ratingSuffix: (rating) => ` · Note du jour : ${rating}/10`,
    dayRatings: 'Notes du jour',
    behavior: 'Comportement et sécurité',
    other: 'Autre',
    overview: "Vue d'ensemble",
    columnType: 'Type',
    columnTime: 'Heure',
    columnDetails: 'Détails',
    columnNote: 'Note',
    dayMode: 'Jour',
    weekMode: 'Semaine',
    emptyWeek: "Rien n'a encore été enregistré cette semaine.",
    emptyDay: "Rien n'a encore été enregistré aujourd'hui.",
    export: 'Exporter',
  },
  dayRating: {
    title: "Comment s'est passée la journée ?",
  },
  dayPicker: {
    title: 'Choisir un jour',
  },
  eventDetail: {
    edit: 'Modifier',
    delete: 'Supprimer',
    confirmDelete: 'Oui, supprimer',
    time: 'Heure',
    end: 'Fin',
    nextDaySuffix: '(jour suivant)',
    antecedentLabel: 'Antécédent',
    antecedentPlaceholder: "Que s'est-il passé juste avant ? (facultatif)",
    locationLabel: 'Lieu',
    locationPlaceholder: "Où cela s'est-il passé ? (facultatif)",
    whatHelpedLabel: 'Ce qui a aidé',
    whatHelpedPlaceholder: "Qu'est-ce qui a aidé à se calmer ? (facultatif)",
    saveErrorTitle: "Échec de l'enregistrement",
    saveErrorMessage: "La modification n'a pas pu être enregistrée. Réessaie.",
    sensoryThresholdLabel: 'Seuil sensoriel',
    sensoryThresholdHint: 'Un seuil bas repère vite un stimulus ; un seuil élevé a besoin de plus pour le remarquer.',
    sensoryThresholdLow: 'Seuil bas',
    sensoryThresholdHigh: 'Seuil élevé',
    sensoryResponseLabel: 'Réaction',
    sensoryResponseSeeking: 'Recherche sensorielle',
    sensoryResponseAvoiding: 'Évitement sensoriel',
  },
  timeline: {
    laneBehavior: 'Conduite',
    laneSensory: 'Stimuli',
    laneMood: 'Humeur',
    laneCare: 'Soins',
    summaryBehavior: (value) => `${value} comportement`,
    summarySensory: (value) => `${value} stimuli`,
    summaryMood: (value) => `${value} humeur`,
    summaryCare: (value) => `${value} soins`,
    holdHint: 'glisser pour déplacer',
    holdDelta: (minutes) => `${minutes > 0 ? '+' : ''}${minutes} min`,
  },
  formats: {
    durationHour: 'h',
    durationMinute: 'min',
  },
  onboarding: {
    nameBannerTitle: "Comment s'appelle ton enfant ?",
    skip: 'Passer',
    back: 'Retour',
    next: 'Suivant',
    start: 'Commencer',
    finish: 'Terminé',
    welcomeTitle: 'Bienvenue dans Vindra',
    welcomeBody: "Un journal apaisant pour les parents d'un enfant neurodivergent. Note le comportement, les stimuli sensoriels et l'humeur sur le moment, en quelques touches.",
    welcomeTagline: "Et apporte un aperçu clair à l'école ou au thérapeute.",
    childTitle: 'Pour qui tiens-tu ce journal ?',
    childBody: "Le prénom reste sur ton propre appareil et n'apparaît que dans les rapports que tu choisis de partager. La date de naissance est facultative.",
    childFootnote: 'Plusieurs enfants ? Ajoute-les plus tard dans Réglages → Gérer les enfants.',
    rolesTitle: "Qu'est-ce qui compte pour ton enfant ?",
    rolesBody: "La roue a déjà une base fixe, comme le comportement, les stimuli sensoriels et l'humeur. Choisis ce que tu veux suivre en plus. Rien n'est obligatoire.",
    rolesRoomNote: (max, labels) => `La roue a de la place pour ${max} boutons. Pour faire de la place, nous laissons ${labels} de côté pour l'instant.`,
    rolesFootnote: 'Tu peux changer cela à tout moment : maintiens le bouton au centre de la roue, ou va dans Réglages → Personnaliser la roue.',
    roleHints: {
      zelfverwonding: 'Moments où ton enfant se fait du mal',
      weglopen: "Partir en courant ou s'éloigner sans prévenir",
      stimmen: 'Battre des mains, se balancer, faire des sons : souvent autorégulateur',
      eten: 'Refusé, nouvel aliment goûté, mangé',
      zindelijkheid: 'Réussi, ou un petit accident',
    },
    logTitle: 'Comment enregistrer',
    logTap: "Appuie sur un bouton de la roue et le moment est enregistré, avec l'heure actuelle.",
    logSecondLevel: "Parfois, un choix rapide suit, comme la gravité ou le type de stimulus. C'est tout.",
    logDetails: "Compléter plus tard, au calme ? Appuie sur l'événement dans la chronologie et renseigne l'antécédent, le lieu et ce qui a aidé.",
    logMove: "L'heure n'est pas la bonne ? Maintiens un événement dans la chronologie et fais-le glisser.",
    logHub: 'Appuie sur le bouton au centre pour replier la roue. Maintiens-le pour personnaliser la roue.',
    widgetTitle: 'Noter depuis l’écran d’accueil',
    widgetBody: 'Le widget enregistre d’un toucher, sans ouvrir l’app. Pratique quand vous avez les mains prises.',
    widgetStep1: 'Maintenez le doigt sur un espace vide de l’écran d’accueil.',
    widgetStep2: 'Touchez Modifier (ou + en haut), puis Ajouter un widget.',
    widgetStep3: 'Cherchez Vindra et choisissez une taille.',
    widgetFootnote: 'Noter un comportement est toujours gratuit. Les autres boutons, ainsi que démarrer et arrêter le sommeil, font partie de l’abonnement.',
    shareTitle: 'Partage et confidentialité',
    shareReport: "L'icône presse-papiers crée un aperçu journalier ou hebdomadaire et exporte un PDF pour l'école ou le thérapeute.",
    sharePartner: 'Partage un enfant avec un autre parent ou accompagnant grâce à un code QR. Vous voyez la même chronologie, sans compte.',
    sharePrivacy: 'Par défaut, tout reste sur ton propre appareil, sans compte. Le partage est chiffré de bout en bout.',
    shareNoDiagnosis: 'Vindra enregistre, mais ne pose pas de diagnostic. Les conclusions, tu les tires avec les personnes qui connaissent ton enfant.',
  },
  help: {
    title: 'Que peut faire Vindra ?',
    intro:
      "Un journal pour les parents d'un enfant neurodivergent — enregistre rapidement sur le moment, avec un rapport vraiment utile pour l'école ou le thérapeute.",
    wheelTitle: 'Enregistrement rapide',
    wheelBody:
      "Appuie sur un bouton de la roue pour enregistrer instantanément. Certains types demandent ensuite un choix rapide (par exemple la gravité) — c'est tout, aucune étape supplémentaire sur le moment.",
    customizeTitle: 'Personnaliser la roue',
    customizeBody:
      "Dans Réglages → Personnaliser la roue, tu actives ou désactives des boutons et changes leur ordre. Chaque enfant n'a pas besoin des mêmes types: Automutilation, Fugue, Autostimulation, Alimentation et Propreté sont donc désactivés par défaut, mais s'ajoutent en un tapotement (maximum 8 à la fois). Le plus rapide : maintiens le bouton au centre de la roue.",
    reportTitle: "Rapport pour l'école ou le thérapeute",
    reportBody:
      "L'icône presse-papiers affiche un aperçu journalier ou hebdomadaire et exporte un PDF — avec les champs antécédent/lieu/ce qui a aidé que tu peux remplir après coup sur un événement.",
    shareTitle: 'Partager avec un autre parent ou accompagnant',
    shareBody:
      "Dans Réglages → Gérer les enfants, tu peux partager un enfant de façon chiffrée — l'autre personne voit la même chronologie, sans besoin de compte.",
    privacyTitle: 'Confidentialité',
    privacyBody:
      "Par défaut, tout reste uniquement sur ton propre appareil. Le partage se fait chiffré de bout en bout, et rien n'est suivi en dehors de ce que tu enregistres toi-même.",
  },
  subscription: {
    title: 'Vindra Premium',
    benefitIntro: 'Débloque toutes les fonctionnalités de Vindra :',
    benefit1: 'Tous les types de journal : stimuli, humeur et médicaments en plus du comportement',
    benefit2: "Partage illimité de rapports avec l'école ou le thérapeute",
    benefit3: 'Synchronisation chiffrée entre parents/accompagnants',
    monthlyLabel: 'Mensuel',
    yearlyLabel: 'Annuel',
    trialBadge: (days) => `${days} premiers jours gratuits`,
    trialIntro: (days, price) => `${days} jours gratuits, puis ${price} sauf annulation pendant cette période.`,
    startTrialButton: "Démarrer l'essai gratuit",
    subscribeButton: "S'abonner",
    purchaseError: "Échec de l'achat. Réessaie.",
    restoreButton: 'Restaurer les achats',
    manageButton: "Gérer l'abonnement",
    loadingOfferings: 'Chargement des offres…',
    loadError: 'Impossible de charger les offres.',
    retry: 'Réessayer',
    noOfferings: 'Aucun abonnement disponible pour le moment.',
    statusLoading: 'Chargement du statut…',
    statusTrial: (daysLeft) => `Il te reste ${daysLeft} ${daysLeft === 1 ? 'jour' : 'jours'} d'essai gratuit`,
    statusActiveUntil: (date) => `Actif jusqu'au ${date}`,
    statusNone: 'Aucun abonnement actif',
    restoreSuccess: 'Achats restaurés',
    restoreNone: 'Aucun achat antérieur trouvé pour cet identifiant Apple.',
    restoreError: 'Échec de la restauration',
    termsDisclosure:
      "Les abonnements se renouvellent automatiquement sauf annulation au moins 24 heures avant la fin de la période en cours, via les réglages de ton identifiant Apple.",
    termsOfUseLabel: "Conditions d'utilisation",
    privacyPolicyLabel: 'Politique de confidentialité',
  },
};
export const pt: Dictionary = {
  common: {
    cancel: 'Cancelar',
    save: 'Salvar',
    saved: 'Salvo',
    close: 'Fechar',
    note: 'Nota',
    today: 'Hoje',
  },
  eventTypes: {
    gedrag: 'Comportamento',
    prikkel: 'Estímulo sensorial',
    stemming: 'Humor',
    medicatie: 'Medicação',
    slaap: 'Sono',
    positief: 'Momento positivo',
    overig: 'Outro',
    zelfverwonding: 'Automutilação',
    weglopen: 'Fuga',
    stimmen: 'Autoestimulação',
    eten: 'Alimentação',
    zindelijkheid: 'Controle de esfíncteres',
  },
  eventOptions: {
    gedragLicht: 'Leve',
    gedragMatig: 'Moderado',
    gedragHeftig: 'Grave',
    prikkelGeluid: 'Som',
    prikkelLicht: 'Luz',
    prikkelAanraking: 'Toque',
    prikkelGeur: 'Cheiro',
    stemming1: 'Muito negativo',
    stemming2: 'Negativo',
    stemming3: 'Neutro',
    stemming4: 'Positivo',
    stemming5: 'Muito positivo',
    stimmenFladderen: 'Balançar as mãos',
    stimmenGeluiden: 'Fazer sons',
    stimmenWiegen: 'Balanço do corpo',
    etenGeweigerd: 'Recusou',
    etenNieuw: 'Experimentou algo novo',
    etenGegeten: 'Comeu',
    zindelijkheidGeslaagd: 'Conseguiu',
    zindelijkheidOngelukje: 'Acidente',
    other: 'Outro',
  },
  wheel: {
    startSuffix: ' · início',
    endSuffix: ' · fim',
    amountCaption: 'Quantidade',
    amountPlaceholder: (unit) => unit,
    notePlaceholder: 'Nota',
    endTimeCaption: 'Hora de término',
    endOfDayCaption: 'Fim do dia',
    sinceMidnightCaption: 'Desde a meia-noite',
    cancelLabel: 'Cancelar',
    doneLabel: 'Concluído',
    hourPlaceholder: 'hh',
    minutePlaceholder: 'mm',
    expandWheelLabel: 'Mostrar roda',
    collapseWheelLabel: 'Ocultar roda',
    hubHint: 'Toque para mostrar ou ocultar a roda. Mantenha pressionado para personalizá-la.',
  },
  settings: {
    title: 'Configurações',
    sectionDisplay: 'Exibição',
    sectionTimeUnits: 'Hora e unidades',
    sectionManage: 'Gerenciar',
    sectionBackup: 'Backup',
    timeFormat: 'Formato de hora',
    format24: '24 horas',
    format12: 'AM/PM',
    temperature: 'Temperatura',
    volumeUnit: 'Unidade de volume',
    dayStart: 'Início do dia (hora)',
    dayStartHint: 'A partir de qual hora um novo dia conta para os contadores nos botões da roda. O padrão é 00:00.',
    leftHanded: 'Canhoto',
    leftHandedHint: 'Espelha a roda para o lado esquerdo da tela.',
    nightModeAuto: 'Modo noturno automático',
    nightModeAutoHint: 'Muda automaticamente para o modo noturno entre 22h e 6h.',
    language: 'Idioma',
    languageSystem: 'Dispositivo',
    languageNl: 'Nederlands',
    languageEn: 'English',
    languageDe: 'Deutsch',
    languageEs: 'Español',
    languageFr: 'Français',
    languagePt: 'Português',
    childrenButton: 'Gerenciar crianças…',
    wheelButton: 'Personalizar roda…',
    subscriptionButton: 'Assinatura',
    helpButton: 'Ajuda',
    replayIntroButton: 'Ver a introdução de novo',
    swipeToOpenHint: 'Deslize para a esquerda para abrir',
    sectionDanger: 'Zona de perigo',
    deleteDayButton: 'Excluir todos os eventos deste dia',
    swipeToDeleteHint: 'Deslize para a esquerda para excluir',
    deleteDayConfirmTitle: 'Excluir eventos?',
    deleteDayConfirmMessage: (day) => `Todos os eventos de ${day} serão excluídos. Isso não pode ser desfeito.`,
    deleteDayConfirmButton: 'Excluir',
    deleteDayEmpty: 'Não há eventos para excluir neste dia.',
    deleteDayDone: (count) => `${count} evento${count === 1 ? '' : 's'} excluído${count === 1 ? '' : 's'}.`,
    exportTitle: 'Exportar',
    exportHint: 'CSV para uma planilha, JSON como backup completo (também usável para importar).',
    exportCsv: 'CSV',
    exportJson: 'Backup JSON',
    importTitle: 'Importar',
    importHint: 'Restaura um backup JSON exportado anteriormente.',
    pickFile: 'Escolher arquivo…',
    confirmImport: 'Sim, importar',
    importResult: (children, events, ratings) =>
      `Concluído: ${children} criança${children === 1 ? '' : 's'}, ${events} eventos e ${ratings} avaliações diárias importados.`,
    importError: 'Falha ao importar.',
    importInvalidFile: 'Este não é um arquivo de backup válido (não foi possível lê-lo como JSON).',
    importMissingData: 'Este arquivo de backup não tem os dados esperados.',
  },
  wheelSettings: {
    title: 'Personalizar roda',
    hint: 'Ative ou desative botões da roda (inclusive os menos comuns, por exemplo para uma situação específica), e arraste a alça à direita para reordená-los.',
    maxReachedTitle: 'Máximo atingido',
    maxReachedMessage: (max) => `A roda mostra no máximo ${max} botões ao mesmo tempo. Desative um antes de ativar este.`,
  },
  children: {
    title: 'Crianças',
    hint: 'Troque de criança ou adicione uma nova. Cada criança tem seus próprios eventos e configurações.',
    addButton: '+ Adicionar criança',
    namePlaceholder: 'Nome',
    birthDateLabel: 'Data de nascimento',
    dayPlaceholder: 'dd',
    monthPlaceholder: 'mm',
    yearPlaceholder: 'aaaa',
    active: 'Ativo',
    selectButton: 'Selecionar',
    editButton: 'Editar',
    editTitle: 'Editar criança',
    archiveButton: 'Arquivar',
    restoreButton: 'Restaurar',
    archivedSectionTitle: 'Arquivado',
    shareButton: 'Compartilhar',
    deleteButton: 'Excluir',
    deleteWarning: (name) => `Todos os dados de ${name} serão excluídos permanentemente. Isso não pode ser desfeito.`,
    lastActiveWarning: 'Você não pode arquivar a última criança ativa — adicione outra criança primeiro.',
  },
  childShare: {
    title: 'Compartilhar com parceiro/cuidador',
    shareTab: 'Compartilhar',
    linkTab: 'Vincular',
    shareHint:
      'Peça a outro pai/mãe ou cuidador para escanear este código e acompanhar esta criança. Tudo o que você registra aqui é enviado criptografado ao servidor — só quem escanear este código consegue lê-lo.',
    backupHint:
      'Guarde este código também para você, por exemplo como PDF, como código de recuperação. Se perder o aparelho ou restaurá-lo para o padrão de fábrica, basta escaneá-lo novamente em "Vincular" para recuperar tudo.',
    saveAsPdf: 'Salvar como PDF',
    linkHint: 'Escaneie o código que a outra pessoa mostra no telefone dela.',
    cameraPermissionHint: 'Necessária para escanear o código.',
    grantPermission: 'Permitir câmera',
    linkSuccess: (name) => `${name} vinculado(a) — recuperando histórico.`,
    linkError: 'Não foi possível ler este código. Tente novamente.',
    linkNetworkError: 'Falha ao vincular — verifique sua conexão com a internet e tente novamente.',
    scanAgain: 'Escanear novamente',
    notConfigured: 'O compartilhamento ainda não está disponível nesta versão.',
  },
  dayReport: {
    weekReport: 'Relatório semanal',
    dayReport: 'Relatório diário',
    ratingSuffix: (rating) => ` · Avaliação do dia: ${rating}/10`,
    dayRatings: 'Avaliações diárias',
    behavior: 'Comportamento e segurança',
    other: 'Outro',
    overview: 'Visão geral',
    columnType: 'Tipo',
    columnTime: 'Hora',
    columnDetails: 'Detalhes',
    columnNote: 'Nota',
    dayMode: 'Dia',
    weekMode: 'Semana',
    emptyWeek: 'Nada registrado ainda esta semana.',
    emptyDay: 'Nada registrado ainda hoje.',
    export: 'Exportar',
  },
  dayRating: {
    title: 'Como foi o dia de hoje?',
  },
  dayPicker: {
    title: 'Escolha um dia',
  },
  eventDetail: {
    edit: 'Editar',
    delete: 'Excluir',
    confirmDelete: 'Sim, excluir',
    time: 'Hora',
    end: 'Fim',
    nextDaySuffix: '(dia seguinte)',
    antecedentLabel: 'Antecedente',
    antecedentPlaceholder: 'O que aconteceu logo antes? (opcional)',
    locationLabel: 'Local',
    locationPlaceholder: 'Onde isso aconteceu? (opcional)',
    whatHelpedLabel: 'O que ajudou',
    whatHelpedPlaceholder: 'O que ajudou a acalmar? (opcional)',
    saveErrorTitle: 'Falha ao salvar',
    saveErrorMessage: 'A alteração não pôde ser salva. Tente novamente.',
    sensoryThresholdLabel: 'Limiar sensorial',
    sensoryThresholdHint: 'Um limiar baixo percebe um estímulo rapidamente; um limiar alto precisa de mais para perceber.',
    sensoryThresholdLow: 'Limiar baixo',
    sensoryThresholdHigh: 'Limiar alto',
    sensoryResponseLabel: 'Resposta',
    sensoryResponseSeeking: 'Busca sensorial',
    sensoryResponseAvoiding: 'Esquiva sensorial',
  },
  timeline: {
    laneBehavior: 'Conduta',
    laneSensory: 'Estímulos',
    laneMood: 'Humor',
    laneCare: 'Cuidados',
    summaryBehavior: (value) => `${value} comportamento`,
    summarySensory: (value) => `${value} estímulos`,
    summaryMood: (value) => `${value} humor`,
    summaryCare: (value) => `${value} cuidados`,
    holdHint: 'arraste para mover',
    holdDelta: (minutes) => `${minutes > 0 ? '+' : ''}${minutes} min`,
  },
  formats: {
    durationHour: 'h',
    durationMinute: 'min',
  },
  onboarding: {
    nameBannerTitle: 'Qual é o nome do seu filho(a)?',
    skip: 'Pular',
    back: 'Voltar',
    next: 'Próximo',
    start: 'Começar',
    finish: 'Concluir',
    welcomeTitle: 'Boas-vindas ao Vindra',
    welcomeBody: 'Um diário tranquilo para pais de uma criança neurodivergente. Registre comportamento, estímulos sensoriais e humor no momento, com poucos toques.',
    welcomeTagline: 'E leve um resumo claro para a escola ou o terapeuta.',
    childTitle: 'Para quem você vai registrar?',
    childBody: 'O nome fica no seu próprio aparelho e só aparece nos relatórios que você decidir compartilhar. A data de nascimento é opcional.',
    childFootnote: 'Mais de uma criança? Adicione depois em Configurações → Gerenciar crianças.',
    rolesTitle: 'O que é relevante para o seu filho(a)?',
    rolesBody: 'A roda já tem uma base fixa, como comportamento, estímulos sensoriais e humor. Escolha o que mais você quer poder registrar. Nada é obrigatório.',
    rolesRoomNote: (max, labels) => `A roda tem espaço para ${max} botões. Para abrir espaço, deixamos ${labels} de fora por enquanto.`,
    rolesFootnote: 'Você pode mudar isso quando quiser: mantenha pressionado o botão no centro da roda, ou vá em Configurações → Personalizar roda.',
    roleHints: {
      zelfverwonding: 'Momentos em que a criança se machuca',
      weglopen: 'Sair correndo ou ir embora sem avisar',
      stimmen: 'Agitar as mãos, balançar o corpo, fazer sons: muitas vezes autorregulador',
      eten: 'Recusou, experimentou algo novo, comeu',
      zindelijkheid: 'Deu certo, ou um escape',
    },
    logTitle: 'Como funciona o registro',
    logTap: 'Toque em um botão da roda e o momento fica salvo, com o horário atual.',
    logSecondLevel: 'Às vezes vem uma escolha rápida, como a gravidade ou o tipo de estímulo. Só isso.',
    logDetails: 'Quer completar depois, com calma? Toque no evento na linha do tempo e preencha o antecedente, o local e o que ajudou.',
    logMove: 'Horário errado? Mantenha pressionado um evento na linha do tempo e arraste.',
    logHub: 'Toque no botão do centro para recolher a roda. Mantenha pressionado para personalizá-la.',
    widgetTitle: 'Registre pela tela de início',
    widgetBody: 'O widget registra com um toque, sem abrir o app. Prático quando você está com as mãos ocupadas.',
    widgetStep1: 'Toque e segure um espaço vazio na tela de início.',
    widgetStep2: 'Toque em Editar (ou + no topo) e depois em Adicionar widget.',
    widgetStep3: 'Procure Vindra e escolha um tamanho.',
    widgetFootnote: 'Registrar comportamentos é sempre grátis. Os outros botões, e iniciar e parar o sono, fazem parte da assinatura.',
    shareTitle: 'Compartilhar, e a sua privacidade',
    shareReport: 'No ícone de prancheta você cria um resumo diário ou semanal e exporta um PDF para a escola ou o terapeuta.',
    sharePartner: 'Compartilhe uma criança com outro pai, mãe ou cuidador por meio de um QR code. Vocês veem a mesma linha do tempo, sem conta.',
    sharePrivacy: 'Por padrão, tudo fica no seu próprio aparelho, sem conta. O compartilhamento é criptografado de ponta a ponta.',
    shareNoDiagnosis: 'O Vindra registra, mas não faz diagnóstico. As conclusões você tira junto com as pessoas que conhecem a criança.',
  },
  help: {
    title: 'O que o Vindra pode fazer?',
    intro:
      'Um diário para pais de uma criança neurodivergente — registre rapidamente no momento, com um relatório realmente útil para a escola ou o terapeuta.',
    wheelTitle: 'Registro rápido',
    wheelBody:
      'Toque em um botão da roda para registrar instantaneamente. Alguns tipos pedem depois uma escolha rápida (por exemplo, a gravidade) — é só isso, sem etapas extras no momento.',
    customizeTitle: 'Personalizar a roda',
    customizeBody:
      'Em Configurações → Personalizar roda, você ativa ou desativa botões e muda a ordem deles. Nem toda criança precisa dos mesmos tipos: por isso Automutilação, Fuga, Autoestimulação, Alimentação e Controle de esfíncteres vêm desativados por padrão, mas podem ser adicionados com um toque (no máximo 8 de uma vez). O jeito mais rápido: mantenha pressionado o botão no centro da roda.',
    reportTitle: 'Relatório para a escola ou o terapeuta',
    reportBody:
      'No ícone de prancheta você vê um resumo diário ou semanal e exporta um PDF — incluindo os campos de antecedente/local/o que ajudou que você pode preencher depois em um evento.',
    shareTitle: 'Compartilhar com outro pai/mãe ou cuidador',
    shareBody:
      'Em Configurações → Gerenciar crianças você pode compartilhar uma criança de forma criptografada — a outra pessoa vê a mesma linha do tempo, sem precisar de conta.',
    privacyTitle: 'Privacidade',
    privacyBody:
      'Por padrão, tudo permanece só no seu próprio aparelho. O compartilhamento é criptografado de ponta a ponta, e nada é registrado além do que você mesmo(a) anota.',
  },
  subscription: {
    title: 'Vindra Premium',
    benefitIntro: 'Desbloqueie todos os recursos do Vindra:',
    benefit1: 'Todos os tipos de registro: estímulos, humor e medicação além do comportamento',
    benefit2: 'Compartilhamento ilimitado de relatórios com a escola ou o terapeuta',
    benefit3: 'Sincronização criptografada entre pais/cuidadores',
    monthlyLabel: 'Mensal',
    yearlyLabel: 'Anual',
    trialBadge: (days) => `primeiros ${days} dias grátis`,
    trialIntro: (days, price) => `${days} dias grátis, depois ${price} a menos que você cancele dentro desse período.`,
    startTrialButton: 'Iniciar teste grátis',
    subscribeButton: 'Assinar',
    purchaseError: 'Falha na compra. Tente novamente.',
    restoreButton: 'Restaurar compras',
    manageButton: 'Gerenciar assinatura',
    loadingOfferings: 'Carregando ofertas…',
    loadError: 'Não foi possível carregar as ofertas.',
    retry: 'Tentar novamente',
    noOfferings: 'Nenhuma assinatura disponível ainda.',
    statusLoading: 'Carregando status…',
    statusTrial: (daysLeft) => (daysLeft === 1 ? `Falta 1 dia de teste grátis` : `Faltam ${daysLeft} dias de teste grátis`),
    statusActiveUntil: (date) => `Ativo até ${date}`,
    statusNone: 'Nenhuma assinatura ativa',
    restoreSuccess: 'Compras restauradas',
    restoreNone: 'Nenhuma compra anterior encontrada para este Apple ID.',
    restoreError: 'Falha ao restaurar',
    termsDisclosure:
      'As assinaturas são renovadas automaticamente, a menos que você cancele pelo menos 24 horas antes do fim do período atual, nas configurações do seu Apple ID.',
    termsOfUseLabel: 'Termos de uso',
    privacyPolicyLabel: 'Política de privacidade',
  },
};
