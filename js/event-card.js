// Event Card Definitions
// Event cards are drawn from a separate deck and affect the entire empire or specific players

const EventCardType = {
    EMPIRE_WIDE: 'empire_wide',
    TARGETED: 'targeted'
};

const EventCardDefinitions = [
    // Empire-Wide Events
    {
        id: 'plague',
        name: 'Plague Strikes the Empire',
        type: EventCardType.EMPIRE_WIDE,
        description: 'A deadly plague sweeps through the provinces. All families lose popular support and suffer reduced income.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                player.popularSupport = Math.max(0, player.popularSupport - 3);
                player.effects.push({
                    type: 'income_modifier',
                    value: -0.25,
                    duration: 2,
                    name: 'Plague'
                });
            });
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: ${EventCardDefinitions.find(c => c.id === 'plague').name} - All families lose 3 popular support and suffer -25% income for 2 turns`
            });
        }
    },
    {
        id: 'barbarian_invasion',
        name: 'Barbarian Invasion',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Barbarians breach the frontier! Military strength reduced dramatically.',
        execute: (gameState) => {
            gameState.militaryStrength = Math.max(0, gameState.militaryStrength - 30);
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Barbarian Invasion - Empire military strength reduced by 30`
            });
        }
    },
    {
        id: 'economic_boom',
        name: 'Economic Prosperity',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Trade flourishes across the empire. All families receive bonus income.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                const bonus = Math.floor(player.estates.length * 1.5);
                player.gold += bonus;
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `${player.name} receives ${bonus} gold from the economic boom`
                });
            });
        }
    },
    {
        id: 'famine',
        name: 'Famine in the Provinces',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Crop failures lead to widespread hunger. Estate yields reduced temporarily.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                player.effects.push({
                    type: 'income_modifier',
                    value: -0.40,
                    duration: 3,
                    name: 'Famine'
                });
            });
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Famine - All estate income reduced by 40% for 3 turns`
            });
        }
    },
    {
        id: 'military_triumph',
        name: 'Military Triumph',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Recent victories bolster the legions. Military strength increased.',
        execute: (gameState) => {
            gameState.militaryStrength += 25;
            gameState.players.forEach(player => {
                player.popularSupport += 1;
            });
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Military Triumph - Empire military +25, all families +1 popular support`
            });
        }
    },
    {
        id: 'senate_crisis',
        name: 'Senate Crisis',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Political infighting paralyzes the Senate. All families lose auctoritas.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                player.auctoritas = Math.max(0, player.auctoritas - 2);
            });
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Senate Crisis - All families lose 2 auctoritas`
            });
        }
    },
    {
        id: 'religious_festival',
        name: 'Grand Religious Festival',
        type: EventCardType.EMPIRE_WIDE,
        description: 'The empire celebrates the gods with great feasts and games.',
        execute: (gameState) => {
            gameState.players.forEach(player => {
                player.popularSupport += 2;
                player.auctoritas += 1;
            });
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Grand Religious Festival - All families +2 popular support, +1 auctoritas`
            });
        }
    },
    {
        id: 'tax_revolt',
        name: 'Tax Revolt',
        type: EventCardType.EMPIRE_WIDE,
        description: 'Provincial unrest over taxation. Tax rate temporarily reduced.',
        execute: (gameState) => {
            const oldRate = gameState.taxRate;
            gameState.taxRate = Math.max(0, gameState.taxRate - 0.2);
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Tax Revolt - Tax rate reduced from ${Math.round(oldRate * 100)}% to ${Math.round(gameState.taxRate * 100)}%`
            });
        }
    },

    // Targeted Events (Based on Player Metrics)
    {
        id: 'virtuous_reward',
        name: 'Divine Favor for the Virtuous',
        type: EventCardType.TARGETED,
        description: 'The gods smile upon the most virtuous family.',
        execute: (gameState) => {
            const mostVirtuous = gameState.players.reduce((max, p) =>
                p.auctoritas > max.auctoritas ? p : max
            );
            mostVirtuous.gold += 15;
            mostVirtuous.popularSupport += 2;
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Divine Favor - ${mostVirtuous.name} (most virtuous) receives 15 gold and 2 popular support`
            });
        }
    },
    {
        id: 'popular_reward',
        name: 'Popular Acclaim',
        type: EventCardType.TARGETED,
        description: 'The people rally behind their favorite family.',
        execute: (gameState) => {
            const mostPopular = gameState.players.reduce((max, p) =>
                p.popularSupport > max.popularSupport ? p : max
            );
            // Award an estate from a random conquered province
            const conqueredProvinces = gameState.provinces.filter(p => p.conquered && p.name !== 'Italia');
            if (conqueredProvinces.length > 0) {
                const randomProvince = conqueredProvinces[Math.floor(Math.random() * conqueredProvinces.length)];
                mostPopular.estates.push({
                    province: randomProvince.name,
                    yield: GameConfig.baseEstateYield
                });
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Popular Acclaim - ${mostPopular.name} (most popular) awarded estate in ${randomProvince.name}`
                });
            } else {
                mostPopular.gold += 10;
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Popular Acclaim - ${mostPopular.name} (most popular) receives 10 gold`
                });
            }
        }
    },
    {
        id: 'virtuous_punishment',
        name: 'Scandal of the Dishonorable',
        type: EventCardType.TARGETED,
        description: 'The least virtuous family faces public disgrace.',
        execute: (gameState) => {
            const leastVirtuous = gameState.players.reduce((min, p) =>
                p.auctoritas < min.auctoritas ? p : min
            );
            leastVirtuous.gold = Math.max(0, leastVirtuous.gold - 10);
            leastVirtuous.popularSupport = Math.max(0, leastVirtuous.popularSupport - 3);
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Scandal - ${leastVirtuous.name} (least virtuous) loses 10 gold and 3 popular support`
            });
        }
    },
    {
        id: 'popular_punishment',
        name: 'Mob Fury',
        type: EventCardType.TARGETED,
        description: 'An angry mob targets the least popular family.',
        execute: (gameState) => {
            const leastPopular = gameState.players.reduce((min, p) =>
                p.popularSupport < min.popularSupport ? p : min
            );
            // Lose a random estate
            if (leastPopular.estates.length > 0) {
                const lostEstate = leastPopular.estates.pop();
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Mob Fury - ${leastPopular.name} (least popular) loses estate in ${lostEstate.province}`
                });
            } else {
                leastPopular.auctoritas = Math.max(0, leastPopular.auctoritas - 3);
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Mob Fury - ${leastPopular.name} (least popular) loses 3 auctoritas`
                });
            }
        }
    },
    {
        id: 'wealth_taxation',
        name: 'Extraordinary Taxation',
        type: EventCardType.TARGETED,
        description: 'The wealthiest family is forced to contribute to the treasury.',
        execute: (gameState) => {
            const richest = gameState.players.reduce((max, p) =>
                p.gold > max.gold ? p : max
            );
            const tax = Math.floor(richest.gold * 0.3);
            richest.gold -= tax;
            richest.auctoritas = Math.max(0, richest.auctoritas - 1);
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Extraordinary Taxation - ${richest.name} (wealthiest) pays ${tax} gold and loses 1 auctoritas`
            });
        }
    },
    {
        id: 'poverty_aid',
        name: 'Imperial Aid',
        type: EventCardType.TARGETED,
        description: 'The empire aids its struggling families.',
        execute: (gameState) => {
            const poorest = gameState.players.reduce((min, p) =>
                p.gold < min.gold ? p : min
            );
            poorest.gold += 12;
            poorest.popularSupport += 1;
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Imperial Aid - ${poorest.name} (poorest) receives 12 gold and 1 popular support`
            });
        }
    },
    {
        id: 'estate_seizure',
        name: 'Estate Seizure',
        type: EventCardType.TARGETED,
        description: 'The family with the most estates faces seizure of property.',
        execute: (gameState) => {
            const mostEstates = gameState.players.reduce((max, p) =>
                p.estates.length > max.estates.length ? p : max
            );
            if (mostEstates.estates.length > 5) {
                const seized = mostEstates.estates.splice(0, 2);
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Estate Seizure - ${mostEstates.name} loses 2 estates (${seized[0].province}, ${seized[1].province})`
                });
            } else {
                mostEstates.gold = Math.max(0, mostEstates.gold - 8);
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Estate Seizure - ${mostEstates.name} pays 8 gold instead of losing estates`
                });
            }
        }
    },
    {
        id: 'political_opportunity',
        name: 'Political Opportunity',
        type: EventCardType.TARGETED,
        description: 'The most influential family gains political advantage.',
        execute: (gameState) => {
            const mostInfluential = gameState.players.reduce((max, p) => {
                const influence = p.auctoritas + p.popularSupport;
                const maxInfluence = max.auctoritas + max.popularSupport;
                return influence > maxInfluence ? p : max;
            });
            mostInfluential.auctoritas += 3;
            mostInfluential.gold += 8;
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Political Opportunity - ${mostInfluential.name} (most influential) gains 3 auctoritas and 8 gold`
            });
        }
    },
    {
        id: 'marriage_alliance',
        name: 'Advantageous Marriage Proposal',
        type: EventCardType.TARGETED,
        description: 'A prestigious marriage alliance is offered to an unmarried paterfamilias.',
        execute: (gameState) => {
            const unmarried = gameState.players.filter(p => !p.wife);
            if (unmarried.length > 0) {
                const lucky = unmarried[Math.floor(Math.random() * unmarried.length)];
                lucky.auctoritas += 2;
                lucky.popularSupport += 2;
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Advantageous Marriage - ${lucky.name} gains 2 auctoritas and 2 popular support`
                });
            } else {
                // All married, give bonus to random player
                const random = gameState.players[Math.floor(Math.random() * gameState.players.length)];
                random.gold += 5;
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Advantageous Marriage - No unmarried families. ${random.name} receives 5 gold`
                });
            }
        }
    },
    {
        id: 'succession_crisis',
        name: 'Succession Crisis',
        type: EventCardType.TARGETED,
        description: 'A prominent family faces internal succession disputes.',
        execute: (gameState) => {
            // Target family with most children
            const mostChildren = gameState.players.reduce((max, p) =>
                p.children.length > max.children.length ? p : max
            );
            mostChildren.auctoritas = Math.max(0, mostChildren.auctoritas - 2);
            mostChildren.effects.push({
                type: 'income_modifier',
                value: -0.20,
                duration: 2,
                name: 'Succession Crisis'
            });
            gameState.gameLog.push({
                turn: gameState.turn,
                message: `EVENT: Succession Crisis - ${mostChildren.name} loses 2 auctoritas and suffers -20% income for 2 turns`
            });
        }
    },
    {
        id: 'diplomatic_triumph',
        name: 'Diplomatic Triumph',
        type: EventCardType.TARGETED,
        description: 'A skilled negotiator secures favorable terms for the empire.',
        execute: (gameState) => {
            // Reward player with highest auctoritas who is not emperor
            const candidates = gameState.players.filter(p => p.id !== gameState.emperorId);
            if (candidates.length > 0) {
                const diplomat = candidates.reduce((max, p) =>
                    p.auctoritas > max.auctoritas ? p : max
                );
                diplomat.gold += 12;
                diplomat.auctoritas += 2;
                diplomat.popularSupport += 1;
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Diplomatic Triumph - ${diplomat.name} gains 12 gold, 2 auctoritas, and 1 popular support`
                });
            } else {
                gameState.gameLog.push({
                    turn: gameState.turn,
                    message: `EVENT: Diplomatic Triumph - No effect (only emperor present)`
                });
            }
        }
    }
];

// Function to create and shuffle the event deck
function createEventDeck() {
    const deck = [];
    EventCardDefinitions.forEach(card => {
        deck.push({ ...card, faceUp: false });
    });
    return shuffleArray(deck);
}

// Helper function to shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
