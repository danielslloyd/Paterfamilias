// Game Configuration and Balance Parameters
// All game balance values are centralized here for easy tuning

const GameConfig = {
    // Paterfamilias and Succession
    maxPaterfamiliasTurns: 10, // Maximum turns as paterfamilias before automatic death
    deathProbabilityPerTurn: 0.10, // 10% chance per turn (when at cap)

    // Event Cards
    eventCardQueueSize: 5, // Number of face-down event cards visible in queue
    eventCardDrawFrequency: 1, // Draw and execute event card every N full turn cycles
    readOmensCost: 5, // Gold cost to peek at upcoming event cards
    readOmensRevealCount: 3, // Number of cards revealed when reading omens
    eventCardsPerDeck: 20, // Total event cards in the deck

    // Starting Values
    startingGold: 10,
    startingPopularSupport: 5,
    startingAuctoritas: 5,
    startingEstatesPerPlayer: 5,
    startingHandSize: 5,
    startingPaterfamiliasTurns: 0,

    // Income and Distribution
    incomeAccumulationThreshold: 10, // Gold must reach this before distribution
    baseEstateYield: 2, // Base gold per estate per turn

    // Taxes
    minTaxRate: 0.0,
    maxTaxRate: 0.5, // 50% maximum
    taxRateIncrement: 0.1, // Can only change in 10% increments
    defaultTaxRate: 0.1,
    taxPopularSupportPenaltyPerIncrement: 1, // Per 10% of tax, emperor loses 1 popular support per turn

    // Tributes
    defaultMotherTribute: 0.05,
    defaultWifeTribute: 0.05,

    // Marriage
    minimumMarriageAge: 14,
    unmarriedPenaltyPerTurn: 1, // Popular support loss per turn when unmarried

    // Children and Family
    baseFertilityChance: 0.15,
    fertileBonusChance: 0.15,
    maxFertilityAge: 60,
    childTraitCount: 1,
    childTraitCountBonusChance: 0.3, // 30% chance for 2 traits

    // Counter and Succession
    initialCounter: 1,
    counterMaximum: 100,
    counterIncrementPerTurn: 1,
    dynastyWinThreshold: 4, // Successive emperors needed to win

    // Military
    initialMilitaryStrength: 100,
    militaryRequirementPerProvince: 10,
    militaryDecayPerTurn: 1,
    conquestExtraMilitaryRequired: 20, // Extra military needed beyond maintenance
    conquestMilitaryCost: 10, // Military strength lost on successful conquest

    // Actions - Costs
    militaryContributionCost: 10,
    economicDevelopmentCost: 8,
    politicalManeuveringCost: 6,
    campaignCost: 20,
    counterInfluenceCost: 15,
    coupCost: 20,

    // Actions - Benefits
    militaryContributionAuctoritas: 2,
    militaryContributionPopularSupport: 1,
    militaryContributionStrength: 5,
    estateYieldImprovement: 1,
    politicalManeuveringAuctoritas: 3,
    campaignSuccessPopularSupport: 5,
    campaignPartialSuccessPopularSupport: 2,
    campaignPartialSuccessStrength: 5,
    campaignFailurePopularSupport: -5,
    campaignFailureStrength: -5,
    campaignBaseFailureChance: 0.30,
    counterInfluenceShift: 3,
    counterInfluenceVirtueBonus: 2,
    counterInfluencePopularityBonus: 2,

    // Coup Mechanics
    coupBonus: 20, // Bonus to plotter's offense
    coupSurvivalPopularSupportBonus: 3,
    coupFailurePenalty: {
        gold: 10,
        auctoritas: 5
    },

    // Card Limits
    maxHandSize: 10,
    maxLogEntries: 50,

    // Trait Effects
    traitModifiers: {
        financialAcumen: 0.10, // +10% estate income
        politicalSavvy: 1, // +1 auctoritas per turn
        belovedByPeople: 1, // +1 popular support per turn
        estateIncomeBonus: 0.10, // +10% estate income
        baseAuctoritas: 1, // +1 auctoritas per turn
        basePopularSupport: 1 // +1 popular support per turn
    },

    // Succession Crisis
    successionCrisisPenalty: {
        auctoritas: 5,
        popularSupport: 3,
        incomeModifier: -0.25,
        duration: 3
    },

    // Tax rate adjustments
    taxIncreasePopularSupportPenalty: 20, // Per point of tax increase
    taxDecreasePopularSupportBonus: 10, // Per point of tax decrease

    // Widow/remarriage
    minDistantRelativeAge: 25,
    maxDistantRelativeAgeVariance: 10,

    // Province data (historical)
    provinces: [
        { name: 'Italia', estateCount: null, conquered: true, year: 0 }, // estateCount set by player count
        { name: 'Sicilia', estateCount: 12, conquered: false, year: 241 },
        { name: 'Sardinia et Corsica', estateCount: 8, conquered: false, year: 238 },
        { name: 'Hispania Citerior', estateCount: 10, conquered: false, year: 197 },
        { name: 'Hispania Ulterior', estateCount: 14, conquered: false, year: 197 },
        { name: 'Macedonia', estateCount: 16, conquered: false, year: 146 },
        { name: 'Africa', estateCount: 18, conquered: false, year: 146 },
        { name: 'Asia', estateCount: 20, conquered: false, year: 133 },
        { name: 'Gallia Narbonensis', estateCount: 12, conquered: false, year: 121 },
        { name: 'Cilicia', estateCount: 10, conquered: false, year: 102 },
        { name: 'Creta et Cyrenaica', estateCount: 14, conquered: false, year: 74 },
        { name: 'Bithynia et Pontus', estateCount: 16, conquered: false, year: 74 },
        { name: 'Syria', estateCount: 18, conquered: false, year: 64 },
        { name: 'Gallia Comata', estateCount: 22, conquered: false, year: 50 },
        { name: 'Aegyptus', estateCount: 24, conquered: false, year: 30 },
        { name: 'Britannia', estateCount: 14, conquered: false, year: 43 },
        { name: 'Dacia', estateCount: 16, conquered: false, year: 106 }
    ],

    // Name pools
    maleNames: ['Marcus', 'Gaius', 'Lucius', 'Publius', 'Quintus', 'Titus', 'Sextus', 'Gnaeus', 'Aulus'],
    femaleNames: ['Julia', 'Cornelia', 'Claudia', 'Livia', 'Octavia', 'Aurelia', 'Valeria'],

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
    maleTraits: [
        '+1 Base Auctoritas',
        '+1 Popular Support',
        '+10% Estate Income',
        'Military Prowess'
    ]
};
