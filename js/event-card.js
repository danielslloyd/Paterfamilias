// Event Card Definitions
// Events are drawn from a separate deck; one executes every full round.
// Cards are identified by id so save/load can rehydrate execute functions.

const EventCardType = {
    EMPIRE_WIDE: 'empire_wide',
    TARGETED: 'targeted'
};

// --- Estate helpers (keep player.estates and province.estates in sync) ----

function eventAwardEstate(gameState, player) {
    // Find an unowned estate in a conquered province (newest first for flavor)
    const provinces = gameState.provinces.filter(p => p.conquered).reverse();
    for (const province of provinces) {
        const estate = province.estates.find(e => e.ownerId === null);
        if (estate) {
            estate.ownerId = player.id;
            player.estates.push(estate);
            return province.name;
        }
    }
    return null;
}

function eventSeizeEstate(gameState, player) {
    if (player.estates.length === 0) return null;
    const idx = Math.floor(Math.random() * player.estates.length);
    const estate = player.estates[idx];
    player.estates.splice(idx, 1);
    estate.ownerId = null;
    const province = gameState.provinces.find(p => p.id === estate.provinceId);
    return province ? province.name : 'a province';
}

function eventLog(gameState, message) {
    gameState.gameLog.unshift({ turn: gameState.turn, message: message, timestamp: Date.now() });
}

const EventCardDefinitions = [
    // --- Empire-Wide Events ---
    {
        id: 'plague',
        name: 'Plague Strikes the Empire',
        type: EventCardType.EMPIRE_WIDE,
        description: 'A deadly plague sweeps the provinces. All families lose 3 popular support and suffer -25% income for 2 turns.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                player.popularSupport = Math.max(0, player.popularSupport - 3);
                player.effects.push({ type: 'income_modifier', value: -0.25, duration: 2, name: 'Plague' });
            });
        }
    },
    {
        id: 'barbarian_invasion',
        name: 'Barbarian Invasion',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Barbarians breach the frontier! Military strength falls — the more the empire holds, the harder the blow.',
        execute: (gameState) => {
            const provinces = gameState.provinces.filter(p => p.conquered).length;
            const damage = 12 + provinces * 2;
            gameState.militaryStrength = Math.max(0, gameState.militaryStrength - damage);
            eventLog(gameState, `The frontier burns: Rome's military strength falls by ${damage}.`);
        }
    },
    {
        id: 'economic_boom',
        name: 'Economic Prosperity',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Trade flourishes. Every family gains 1.5 gold per estate it holds.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                const bonus = Math.floor(player.estates.length * 1.5);
                player.gold += bonus;
                eventLog(gameState, `The ${player.name} gain ${bonus} gold from booming trade.`);
            });
        }
    },
    {
        id: 'famine',
        name: 'Famine in the Provinces',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Crop failures bring hunger. All estate income -40% for 2 turns.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                player.effects.push({ type: 'income_modifier', value: -0.40, duration: 2, name: 'Famine' });
            });
        }
    },
    {
        id: 'military_triumph',
        name: 'Military Triumph',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Victories on the frontier: military +20, every family +1 popular support.',
        execute: (gameState) => {
            gameState.militaryStrength += 20;
            gameState.players.forEach(player => { player.popularSupport += 1; });
        }
    },
    {
        id: 'senate_crisis',
        name: 'Senate Crisis',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Political infighting paralyzes the Senate. All families lose 2 auctoritas.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                player.auctoritas = Math.max(0, player.auctoritas - 2);
            });
        }
    },
    {
        id: 'religious_festival',
        name: 'Grand Religious Festival',
        type: EventCardType.EMPIRE_WIDE,
        description: 'The empire honors the gods: every family gains +2 popular support and +1 auctoritas.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                player.popularSupport += 2;
                player.auctoritas += 1;
            });
        }
    },
    {
        id: 'tax_revolt',
        name: 'Tax Revolt',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Provincial unrest over taxation forces the tax rate down by 20 points.',
        execute: (gameState) => {
            const oldRate = gameState.taxRate;
            gameState.taxRate = Math.max(0, gameState.taxRate - 0.2);
            eventLog(gameState, `Tax revolt! The rate falls from ${Math.round(oldRate * 100)}% to ${Math.round(gameState.taxRate * 100)}%.`);
        }
    },
    {
        id: 'praetorian_restlessness',
        name: 'Praetorian Restlessness',
        type: EventCardType.EMPIRE_WIDE,
        description: 'The Emperor\'s guard grumbles for a donative. He pays 10 gold or loses 5 popular support. In a Republic, the idle soldiery drains the legions instead.',
        execute: (gameState) => {
            if (gameState.emperorId !== null) {
                const emperor = gameState.players.find(p => p.id === gameState.emperorId);
                if (emperor.gold >= 10) {
                    emperor.gold -= 10;
                    eventLog(gameState, `Emperor ${emperor.paterfamilias.name} pays the Praetorians a 10 gold donative.`);
                } else {
                    emperor.popularSupport = Math.max(0, emperor.popularSupport - 5);
                    eventLog(gameState, `Emperor ${emperor.paterfamilias.name} cannot pay the guard — the streets whisper (-5 Support).`);
                }
            } else {
                gameState.militaryStrength = Math.max(0, gameState.militaryStrength - 5);
                eventLog(gameState, `With no Emperor to command them, the soldiery idles (-5 military).`);
            }
        }
    },

    // --- Family-Web Events ---
    {
        id: 'domus_scandal',
        name: 'Scandal in the Domus',
        type: EventCardType.TARGETED,
        description: 'A married household is engulfed in scandal — the family AND the wife\'s family each lose 3 popular support. Shame travels the marriage web.',
        execute: (gameState) => {
            const married = gameState.players.filter(p => p.wife);
            if (married.length === 0) {
                eventLog(gameState, `With no marriages to slander, the gossips fall silent.`);
                return;
            }
            const victim = married[Math.floor(Math.random() * married.length)];
            victim.popularSupport = Math.max(0, victim.popularSupport - 3);
            const inLaws = gameState.players.find(p => p.id === victim.wife.fromFamily);
            if (inLaws) {
                inLaws.popularSupport = Math.max(0, inLaws.popularSupport - 3);
                eventLog(gameState, `Scandal touches ${victim.wife.name}! The ${victim.name} and her kin the ${inLaws.name} each lose 3 Support.`);
            }
        }
    },
    {
        id: 'matrona_honored',
        name: 'A Matron Honored',
        type: EventCardType.TARGETED,
        description: 'The city celebrates its most virtuous matron: the family with the most female traits in its household gains +3 support and +2 auctoritas.',
        execute: (gameState) => {
            const traitCount = p => (p.wife ? p.wife.traits.length : 0) + (p.mother ? p.mother.traits.length : 0);
            const honored = gameState.players.reduce((max, p) => traitCount(p) > traitCount(max) ? p : max);
            honored.popularSupport += 3;
            honored.auctoritas += 2;
            eventLog(gameState, `The women of the ${honored.name} are honored before all Rome: +3 Support, +2 Auctoritas.`);
        }
    },
    {
        id: 'dowry_dispute',
        name: 'Dowry Dispute',
        type: EventCardType.TARGETED,
        description: 'A tribute payment is contested: the family paying the highest wife-tribute rate withholds it — they keep the gold but lose 2 auctoritas for the insult.',
        execute: (gameState) => {
            const paying = gameState.players.filter(p => p.wife && p.tributeRates.toWife > 0);
            if (paying.length === 0) {
                eventLog(gameState, `No tribute flows, so nothing can be disputed.`);
                return;
            }
            const disputant = paying.reduce((max, p) => p.tributeRates.toWife > max.tributeRates.toWife ? p : max);
            disputant.effects.push({ type: 'tribute_holiday', duration: 2, name: 'Dowry Dispute' });
            disputant.auctoritas = Math.max(0, disputant.auctoritas - 2);
            eventLog(gameState, `The ${disputant.name} withhold their wife-tribute for 2 turns (-2 Auctoritas for the insult).`);
        }
    },

    // --- Targeted Events (by player metrics) ---
    {
        id: 'virtuous_reward',
        name: 'Divine Favor for the Virtuous',
        type: EventCardType.TARGETED,
        description: 'The gods smile upon the most virtuous family: +12 gold, +2 popular support.',
        execute: (gameState) => {
            const mostVirtuous = gameState.players.reduce((max, p) => p.auctoritas > max.auctoritas ? p : max);
            mostVirtuous.gold += 12;
            mostVirtuous.popularSupport += 2;
            eventLog(gameState, `The gods favor the ${mostVirtuous.name} (most virtuous): +12 gold, +2 Support.`);
        }
    },
    {
        id: 'popular_reward',
        name: 'Popular Acclaim',
        type: EventCardType.TARGETED,
        description: 'The people rally behind their favorite family, granting them an estate (or 10 gold if none are free).',
        execute: (gameState) => {
            const mostPopular = gameState.players.reduce((max, p) => p.popularSupport > max.popularSupport ? p : max);
            const provinceName = eventAwardEstate(gameState, mostPopular);
            if (provinceName) {
                eventLog(gameState, `The people press an estate in ${provinceName} upon the ${mostPopular.name} (most popular).`);
            } else {
                mostPopular.gold += 10;
                eventLog(gameState, `The people shower the ${mostPopular.name} with gifts: +10 gold.`);
            }
        }
    },
    {
        id: 'virtuous_punishment',
        name: 'Scandal of the Dishonorable',
        type: EventCardType.TARGETED,
        description: 'The least virtuous family faces public disgrace: -8 gold, -3 popular support.',
        execute: (gameState) => {
            const leastVirtuous = gameState.players.reduce((min, p) => p.auctoritas < min.auctoritas ? p : min);
            leastVirtuous.gold = Math.max(0, leastVirtuous.gold - 8);
            leastVirtuous.popularSupport = Math.max(0, leastVirtuous.popularSupport - 3);
            eventLog(gameState, `Disgrace falls on the ${leastVirtuous.name} (least virtuous): -8 gold, -3 Support.`);
        }
    },
    {
        id: 'popular_punishment',
        name: 'Mob Fury',
        type: EventCardType.TARGETED,
        description: 'An angry mob burns an estate of the least popular family (or costs them 3 auctoritas if they have none).',
        execute: (gameState) => {
            const leastPopular = gameState.players.reduce((min, p) => p.popularSupport < min.popularSupport ? p : min);
            const provinceName = eventSeizeEstate(gameState, leastPopular);
            if (provinceName) {
                eventLog(gameState, `The mob burns a ${leastPopular.name} estate in ${provinceName}!`);
            } else {
                leastPopular.auctoritas = Math.max(0, leastPopular.auctoritas - 3);
                eventLog(gameState, `The mob jeers the landless ${leastPopular.name}: -3 Auctoritas.`);
            }
        }
    },
    {
        id: 'wealth_taxation',
        name: 'Extraordinary Taxation',
        type: EventCardType.TARGETED,
        description: 'The wealthiest family must contribute 30% of its gold to the treasury and loses 1 auctoritas.',
        execute: (gameState) => {
            const richest = gameState.players.reduce((max, p) => p.gold > max.gold ? p : max);
            const tax = Math.floor(richest.gold * 0.3);
            richest.gold -= tax;
            richest.auctoritas = Math.max(0, richest.auctoritas - 1);
            eventLog(gameState, `The ${richest.name} (wealthiest) surrender ${tax} gold to the treasury.`);
        }
    },
    {
        id: 'poverty_aid',
        name: 'Imperial Aid',
        type: EventCardType.TARGETED,
        description: 'The struggling are lifted up: the poorest family gains 12 gold and 1 popular support.',
        execute: (gameState) => {
            const poorest = gameState.players.reduce((min, p) => p.gold < min.gold ? p : min);
            poorest.gold += 12;
            poorest.popularSupport += 1;
            eventLog(gameState, `Aid reaches the ${poorest.name} (poorest): +12 gold, +1 Support.`);
        }
    },
    {
        id: 'estate_seizure',
        name: 'Estate Seizure',
        type: EventCardType.TARGETED,
        description: 'The family with the most estates loses one to confiscation (or pays 8 gold if they hold 5 or fewer).',
        execute: (gameState) => {
            const mostEstates = gameState.players.reduce((max, p) => p.estates.length > max.estates.length ? p : max);
            if (mostEstates.estates.length > 5) {
                const provinceName = eventSeizeEstate(gameState, mostEstates);
                eventLog(gameState, `An estate of the ${mostEstates.name} in ${provinceName} is confiscated!`);
            } else {
                mostEstates.gold = Math.max(0, mostEstates.gold - 8);
                eventLog(gameState, `The ${mostEstates.name} pay 8 gold to keep their lands.`);
            }
        }
    },
    {
        id: 'political_opportunity',
        name: 'Political Opportunity',
        type: EventCardType.TARGETED,
        description: 'The most influential family (support + auctoritas) gains +3 auctoritas and +8 gold.',
        execute: (gameState) => {
            const score = p => p.auctoritas + p.popularSupport;
            const mostInfluential = gameState.players.reduce((max, p) => score(p) > score(max) ? p : max);
            mostInfluential.auctoritas += 3;
            mostInfluential.gold += 8;
            eventLog(gameState, `Opportunity favors the ${mostInfluential.name}: +3 Auctoritas, +8 gold.`);
        }
    },
    {
        id: 'marriage_pressure',
        name: 'The Censor Frowns',
        type: EventCardType.TARGETED,
        description: 'Rome expects its leading men to marry. Every unmarried paterfamilias loses 2 auctoritas.',
        execute: (gameState) => {
            const unmarried = gameState.players.filter(p => !p.wife);
            if (unmarried.length === 0) {
                eventLog(gameState, `Every paterfamilias is properly married — the Censor is satisfied.`);
                return;
            }
            unmarried.forEach(p => {
                p.auctoritas = Math.max(0, p.auctoritas - 2);
                eventLog(gameState, `The Censor rebukes the unmarried ${p.name}: -2 Auctoritas.`);
            });
        }
    },
    {
        id: 'succession_rumors',
        name: 'Whispers of Succession',
        type: EventCardType.TARGETED,
        description: 'All Rome wonders who will rule next. The family with the highest succession score gains +2 support; the Emperor grows nervous (-1 support).',
        execute: (gameState) => {
            const weights = {
                popularity: (100 - gameState.counter) / 100,
                virtue: gameState.counter / 100
            };
            const score = p => weights.popularity * p.popularSupport + weights.virtue * p.auctoritas;
            const candidates = gameState.players.filter(p => p.id !== gameState.emperorId);
            if (candidates.length === 0) return;
            const favorite = candidates.reduce((max, p) => score(p) > score(max) ? p : max);
            favorite.popularSupport += 2;
            eventLog(gameState, `The crowds toast the ${favorite.name} as heirs-apparent to the purple (+2 Support).`);
            if (gameState.emperorId !== null) {
                const emperor = gameState.players.find(p => p.id === gameState.emperorId);
                emperor.popularSupport = Math.max(0, emperor.popularSupport - 1);
                eventLog(gameState, `Emperor ${emperor.paterfamilias.name} hears the whispers (-1 Support).`);
            }
        }
    },
    {
        id: 'diplomatic_triumph',
        name: 'Diplomatic Triumph',
        type: EventCardType.TARGETED,
        description: 'The most virtuous non-imperial family secures favorable terms: +10 gold, +2 auctoritas.',
        execute: (gameState) => {
            const candidates = gameState.players.filter(p => p.id !== gameState.emperorId);
            if (candidates.length === 0) return;
            const diplomat = candidates.reduce((max, p) => p.auctoritas > max.auctoritas ? p : max);
            diplomat.gold += 10;
            diplomat.auctoritas += 2;
            eventLog(gameState, `The ${diplomat.name} negotiate a triumph abroad: +10 gold, +2 Auctoritas.`);
        }
    }
];

// Create and shuffle the event deck
function createEventDeck() {
    const deck = EventCardDefinitions.map(card => Object.assign({}, card, { faceUp: false }));
    return shuffleArray(deck);
}

// Rebuild a serialized event card's execute function after loading a save
function rehydrateEventCard(card) {
    const def = EventCardDefinitions.find(d => d.id === card.id);
    if (!def) return card;
    return Object.assign({}, def, { faceUp: !!card.faceUp });
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
