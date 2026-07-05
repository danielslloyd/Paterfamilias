// Game Configuration and Balance Parameters
// All game balance values are centralized here for easy tuning

const GameConfig = {
    // Paterfamilias Age and Death
    paterStartingAgeMin: 38,       // Youngest possible starting paterfamilias
    paterStartingAgeRange: 8,      // + random(0..range)
    heirMinimumAge: 16,            // Son must be this old to inherit as paterfamilias
    emperorExtraAging: 1,          // "The purple weighs heavy" - emperor ages extra per turn
    distantRelativeAge: 32,        // Age of emergency heir when no son exists
    deathCurve: [                  // Chance of natural death per turn, by age bracket
        { maxAge: 49, chance: 0.02 },
        { maxAge: 59, chance: 0.06 },
        { maxAge: 69, chance: 0.14 },
        { maxAge: 79, chance: 0.28 },
        { maxAge: 999, chance: 0.60 }
    ],

    // Event Cards
    eventCardQueueSize: 5,         // Number of face-down event cards visible in queue
    eventCardDrawFrequency: 1,     // Draw and execute event card every N full turn cycles
    readOmensCost: 5,              // Gold cost to peek at upcoming event cards
    readOmensRevealCount: 3,       // Number of cards revealed when reading omens
    piousOmensDiscount: 2,         // Gold discount on omens/religious cards per Pious woman

    // Starting Values
    startingGold: 12,
    startingPopularSupport: 5,
    startingAuctoritas: 5,
    startingEstatesPerPlayer: 5,
    startingHandSize: 5,
    startingSonAgeMin: 13,         // Guaranteed starting son age 13..17
    startingSonAgeRange: 4,
    startingDaughterAgeMin: 11,    // Guaranteed starting daughter age 11..15
    startingDaughterAgeRange: 4,

    // Income
    baseEstateYield: 3,            // Base gold per estate per turn

    // Taxes
    minTaxRate: 0.0,
    maxTaxRate: 0.5,               // 50% maximum
    taxRateIncrement: 0.1,         // Can only change in 10% increments
    defaultTaxRate: 0.1,
    taxPopularSupportPenaltyPerIncrement: 1, // Per 10% of tax, emperor loses 1 popular support per round

    // Tributes (the family-obligation web)
    defaultMotherTribute: 0.05,    // Initial mothers were married a generation ago at 5%
    defaultWifeTribute: 0.10,      // Initial wives were married at 10%
    tributeRateMin: 0.05,          // Negotiable floor
    tributeRateMax: 0.25,          // Negotiable ceiling
    tributeRateStep: 0.05,
    tributeMinimum: 1,             // If any tribute is owed, at least 1 gold flows

    // Marriage
    minimumMarriageAge: 14,
    unmarriedPenaltyPerTurn: 1,    // Popular support loss per turn when unmarried
    baseDowry: 6,                  // Gold paid to the bride's family on marriage
    divorceCost: { gold: 5, auctoritas: 2, popularSupport: 2 },

    // Kinship (tied fates)
    kinEmperorSupportPerTurn: 1,   // Popular support per turn while a kin family holds the throne
    kinEmperorFallPenalty: 2,      // Support lost by kin when their emperor falls violently
    kinImpietyPenalty: { auctoritas: 5, popularSupport: 3 }, // Cost of violence against kin

    // Children and Family
    baseFertilityChance: 0.20,
    fertileBonusChance: 0.15,
    maxFertilityAge: 60,           // Paterfamilias too old to sire children past this
    childTraitCountBonusChance: 0.3, // 30% chance for 2 traits

    // Counter and Succession
    initialCounter: 1,
    counterMaximum: 100,
    counterIncrementPerTurn: 1,
    dynastyWinThreshold: 4,        // Successive emperors needed to win
    imperialMinAuctoritas: 30,     // Floor for the imperial threshold (prevents turn-1 emperors)
    senateAcclamationCounter: 40,  // If still a Republic at this counter, Senate acclaims an emperor
    successionLegitimacyBonus: 1.25, // Score multiplier for the reigning dynasty's family
    successionMilitaryPenalty: 5,  // Legions destabilized by any succession
    interregnumMilitaryPenalty: 15, // Worse when no one can claim the throne
    interregnumSupportPenalty: 2,  // Everyone suffers in the chaos

    // Military (the collective good)
    initialMilitaryStrength: 60,
    militaryRequirementPerProvince: 10,
    militaryBaseDecayPerRound: 1,
    militaryDecayPerProvincesHeld: 3, // +1 decay per this many provinces held (empire strain)
    conquestExtraMilitaryRequired: 20, // Surplus needed beyond maintenance to campaign
    conquestMilitaryCost: 10,      // Military strength lost on successful conquest

    // Actions - Costs
    militaryContributionCost: 8,
    economicDevelopmentCost: 8,
    politicalManeuveringCost: 6,
    campaignCost: 20,
    counterInfluenceCost: 15,

    // Actions - Benefits
    militaryContributionAuctoritas: 2,
    militaryContributionPopularSupport: 1,
    militaryContributionStrength: 6,
    militaryProwessContributionBonus: 3, // Extra strength if pater has Military Prowess
    estateYieldImprovement: 1,
    politicalManeuveringAuctoritas: 3,
    campaignSuccessPopularSupport: 5,
    campaignPartialSuccessPopularSupport: 2,
    campaignPartialSuccessStrength: 6,
    campaignFailurePopularSupport: -4,
    campaignFailureStrength: -6,
    campaignBaseFailureChance: 0.30,
    militaryProwessCampaignBonus: 0.10, // Failure chance reduction with Military Prowess
    counterInfluenceShift: 3,
    counterInfluenceVirtueBonus: 2,
    counterInfluencePopularityBonus: 2,

    // Coup Mechanics
    coup: {
        cost: 25,                  // Base gold to plot a coup (a core action)
        costPerDynastyCount: 10,   // Entrenched dynasties are costlier to unseat
        attackBase: 15,            // Conspirator's edge of surprise
        schemingBonus: 15,         // If plotter's household has a Scheming woman
        kinDefenseBonus: 10,       // Each family tied to the emperor rallies to him
        influentialDefense: 10,    // If emperor's household has an Influential woman
        militaryPenalty: 10,       // Legions destabilized whenever a coup is attempted
        chanceBase: 0.15,          // Success chance = base + (attack - defense) * perPoint
        chancePerPoint: 0.02,
        chanceMin: 0.05,
        chanceMax: 0.90,
        survivalSupportBonus: 3,   // Emperor gains support for surviving
        failurePenalty: { gold: 10, auctoritas: 5 }
    },

    // Assassination (card)
    assassination: {
        baseChance: 0.45,
        schemingBonus: 0.15,       // Plotter's household Scheming
        influentialDefense: 0.15,  // Target's household Influential
        failurePenalty: { auctoritas: 5, popularSupport: 8 },
        emperorDeathMilitaryPenalty: 10
    },

    // Card Limits
    maxHandSize: 8,
    cardsDrawnPerTurn: 2,
    cardCopies: 2,                 // Copies of each card definition in the deck
    maxLogEntries: 60,

    // Trait Effects
    traitModifiers: {
        financialAcumen: 0.20,     // +20% estate income per Financial Acumen woman
        estateIncomeBonus: 0.10,   // Pater trait: +10% estate income
        politicalSavvy: 1,         // +1 auctoritas per turn per Political Savvy woman
        belovedByPeople: 1,        // +1 popular support per turn per Beloved woman
        schemingCardDiscount: 2    // Intrigue cards cost 2 less per Scheming woman
    },

    // Succession Crisis (no eligible heir)
    successionCrisisPenalty: {
        auctoritas: 5,
        popularSupport: 3,
        incomeModifier: -0.25,
        duration: 3
    },

    // Tax rate adjustments (one-time on change)
    taxIncreasePopularSupportPenalty: 20, // Per point of tax increase
    taxDecreasePopularSupportBonus: 10,   // Per point of tax decrease

    // Provinces in historical order of conquest.
    // Year label shows when Rome historically acquired each.
    provinces: [
        { name: 'Italia', estateCount: null, conquered: true, yearLabel: 'From the start' },
        { name: 'Sicilia', estateCount: 6, conquered: false, yearLabel: '241 BC' },
        { name: 'Sardinia et Corsica', estateCount: 4, conquered: false, yearLabel: '238 BC' },
        { name: 'Hispania Citerior', estateCount: 6, conquered: false, yearLabel: '197 BC' },
        { name: 'Hispania Ulterior', estateCount: 8, conquered: false, yearLabel: '197 BC' },
        { name: 'Macedonia', estateCount: 8, conquered: false, yearLabel: '146 BC' },
        { name: 'Africa', estateCount: 10, conquered: false, yearLabel: '146 BC' },
        { name: 'Asia', estateCount: 12, conquered: false, yearLabel: '133 BC' },
        { name: 'Gallia Narbonensis', estateCount: 6, conquered: false, yearLabel: '121 BC' },
        { name: 'Cilicia', estateCount: 5, conquered: false, yearLabel: '102 BC' },
        { name: 'Creta et Cyrenaica', estateCount: 6, conquered: false, yearLabel: '74 BC' },
        { name: 'Bithynia et Pontus', estateCount: 8, conquered: false, yearLabel: '74 BC' },
        { name: 'Syria', estateCount: 10, conquered: false, yearLabel: '64 BC' },
        { name: 'Gallia Comata', estateCount: 12, conquered: false, yearLabel: '50 BC' },
        { name: 'Aegyptus', estateCount: 14, conquered: false, yearLabel: '30 BC' },
        { name: 'Britannia', estateCount: 6, conquered: false, yearLabel: 'AD 43' },
        { name: 'Dacia', estateCount: 8, conquered: false, yearLabel: 'AD 106' }
    ],

    // Family display colors (index = player id)
    playerColors: ['#c0392b', '#2980b9', '#27ae60', '#8e44ad'],

    // Name pools
    maleNames: ['Marcus', 'Gaius', 'Lucius', 'Publius', 'Quintus', 'Titus', 'Sextus', 'Gnaeus', 'Aulus', 'Decimus', 'Spurius', 'Manius', 'Numerius', 'Servius', 'Tiberius', 'Appius'],
    femaleNames: ['Julia', 'Cornelia', 'Claudia', 'Livia', 'Octavia', 'Aurelia', 'Valeria', 'Antonia', 'Domitia', 'Fulvia', 'Agrippina', 'Faustina', 'Plotina', 'Sabina', 'Marcella', 'Tullia'],

    // Trait pools
    femaleTraits: [
        'Financial Acumen',
        'Political Savvy',
        'Beloved by People',
        'Fertile',
        'Pious',
        'Influential',
        'Scheming'
    ],
    femaleTraitInfo: {
        'Financial Acumen': '+20% estate income for the household',
        'Political Savvy': '+1 Auctoritas per turn',
        'Beloved by People': '+1 Popular Support per turn',
        'Fertile': '+15% chance of a child each turn',
        'Pious': 'Religious cards and Reading the Omens cost 2 less gold',
        'Influential': '+10 coup defense; assassins against this household are 15% less likely to succeed',
        'Scheming': 'Intrigue cards cost 2 less; +15 coup attack; +15% assassination success'
    },
    maleTraits: [
        '+1 Base Auctoritas',
        '+1 Popular Support',
        '+10% Estate Income',
        'Military Prowess'
    ],
    maleTraitInfo: {
        '+1 Base Auctoritas': '+1 Auctoritas per turn',
        '+1 Popular Support': '+1 Popular Support per turn',
        '+10% Estate Income': '+10% estate income',
        'Military Prowess': 'Stronger military contributions; imperial campaigns 10% less likely to fail'
    }
};
