/** Eén simpel key-bestand per taal, zelfde patroon als Nuvo (zie SPEC.md §2 in de
 * Nuvo-repo) — geen vertaal-library, gewoon een getypt object per taal zodat een
 * ontbrekende of verkeerd getypte sleutel een TypeScript-fout geeft i.p.v. een lege
 * knop in productie.
 *
 * Alleen `nl` is een echte vertaling (besloten 2026-09-21, zie PLAN.md sectie 9:
 * "Nederlands eerst — sterkste voordeel uit het onderzoek"). De overige 5 talen zijn
 * nog een 1-op-1 alias van `nl`, puur zodat `lib/i18n/index.tsx` (ongewijzigd
 * overgenomen uit Nuvo, verwacht alle 6) compileert en niemand een lege/undefined
 * tekst ziet — geen echte vertaling, TODO zodra EN aantoonbaar nodig is. */

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
    laneMood: string;
    laneMedication: string;
    laneOther: string;
    summaryBehavior: (value: string) => string;
    summaryMood: (value: string) => string;
    summaryMedication: (value: string) => string;
    summaryOther: (value: string) => string;
  };
  formats: {
    durationHour: string;
    durationMinute: string;
  };
  onboarding: {
    nameBannerTitle: string;
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
    privacyPolicyMissingTitle: string;
    privacyPolicyMissingMessage: string;
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
    behavior: 'Gedrag/Prikkels',
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
    laneBehavior: 'Gedrag/Prikkels',
    laneMood: 'Stemming',
    laneMedication: 'Medicatie',
    laneOther: 'Overig',
    summaryBehavior: (value) => `${value} gedrag/prikkels`,
    summaryMood: (value) => `${value} stemming`,
    summaryMedication: (value) => `${value} medicatie`,
    summaryOther: (value) => `${value} overig`,
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
    privacyPolicyMissingTitle: 'Nog niet beschikbaar',
    privacyPolicyMissingMessage: 'Het privacybeleid van Vindra is nog niet gepubliceerd.',
  },
};

// Placeholder-aliassen — nog geen echte vertaling, zie bestandsheader.
export const en: Dictionary = nl;
export const de: Dictionary = nl;
export const es: Dictionary = nl;
export const fr: Dictionary = nl;
export const pt: Dictionary = nl;
