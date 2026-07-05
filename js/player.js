// Player (Family) Management
const Player = {
    // Create a new player family
    create(id, familyName) {
        return {
            id: id,
            name: familyName,
            gold: GameConfig.startingGold,
            popularSupport: GameConfig.startingPopularSupport,
            auctoritas: GameConfig.startingAuctoritas,
            estates: [],
            generation: 1,
            paterfamilias: {
                name: null, // set by GameState after name pool init
                age: GameConfig.paterStartingAgeMin + Math.floor(Math.random() * (GameConfig.paterStartingAgeRange + 1)),
                traits: this.selectRandomTraits(GameConfig.maleTraits, 1)
            },
            wife: null,      // { name, fromFamily, traits } - assigned at setup
            mother: null,    // { name, fromFamily, traits } - assigned at setup
            children: [],
            betrothal: null, // { name, fromFamily, traits, tributeRate } - heir's promised bride
            hand: [],
            tributeRates: {
                toMother: GameConfig.defaultMotherTribute,
                toWife: GameConfig.defaultWifeTribute
            },
            actionTaken: false,
            cardPlayed: false,
            effects: []
        };
    },

    selectRandomTraits(traitList, count) {
        const shuffled = [...traitList].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    // --- Trait engine ---------------------------------------------------

    // How many women of the household (wife + mother) carry a trait.
    // Divine Favor doubles the effective count.
    femaleTraitCount(player, trait) {
        let count = 0;
        if (player.wife && player.wife.traits.includes(trait)) count++;
        if (player.mother && player.mother.traits.includes(trait)) count++;
        if (count > 0 && player.effects.some(e => e.type === 'divine_favor')) {
            count *= 2;
        }
        return count;
    },

    hasPaterTrait(player, trait) {
        return player.paterfamilias.traits.includes(trait);
    },

    // Calculate estate income for a player
    calculateEstateIncome(player) {
        let baseIncome = 0;
        player.estates.forEach(estate => {
            baseIncome += estate.yield;
        });

        let modifier = 1.0;
        modifier += this.femaleTraitCount(player, 'Financial Acumen') * GameConfig.traitModifiers.financialAcumen;
        if (this.hasPaterTrait(player, '+10% Estate Income')) {
            modifier += GameConfig.traitModifiers.estateIncomeBonus;
        }
        player.effects.forEach(effect => {
            if (effect.type === 'income_modifier') {
                modifier += effect.value;
            }
        });

        return Math.max(0, Math.floor(baseIncome * modifier));
    },

    // Apply per-turn trait effects (women drive the household)
    applyTraitEffects(player) {
        const savvy = this.femaleTraitCount(player, 'Political Savvy') * GameConfig.traitModifiers.politicalSavvy;
        const beloved = this.femaleTraitCount(player, 'Beloved by People') * GameConfig.traitModifiers.belovedByPeople;

        if (savvy > 0) player.auctoritas += savvy;
        if (beloved > 0) player.popularSupport += beloved;

        if (this.hasPaterTrait(player, '+1 Base Auctoritas')) player.auctoritas += 1;
        if (this.hasPaterTrait(player, '+1 Popular Support')) player.popularSupport += 1;
    },

    // Effective gold cost of a card after household discounts
    getCardCost(player, card) {
        const cost = Object.assign({}, card.cost);
        if (cost.gold) {
            if (card.type === 'intrigue') {
                cost.gold -= this.femaleTraitCount(player, 'Scheming') * GameConfig.traitModifiers.schemingCardDiscount;
            }
            if (card.type === 'religious') {
                cost.gold -= this.femaleTraitCount(player, 'Pious') * GameConfig.piousOmensDiscount;
            }
            cost.gold = Math.max(1, cost.gold);
        }
        return cost;
    },

    // --- Resource helpers -------------------------------------------------

    canAfford(player, cost) {
        if (cost.gold && player.gold < cost.gold) return false;
        if (cost.auctoritas && player.auctoritas < cost.auctoritas) return false;
        if (cost.popularSupport && player.popularSupport < cost.popularSupport) return false;
        return true;
    },

    payCost(player, cost) {
        if (cost.gold) player.gold -= cost.gold;
        if (cost.auctoritas) player.auctoritas -= cost.auctoritas;
        if (cost.popularSupport) player.popularSupport -= cost.popularSupport;
        this.clampResources(player);
    },

    addResources(player, resources) {
        if (resources.gold) player.gold += resources.gold;
        if (resources.auctoritas) player.auctoritas += resources.auctoritas;
        if (resources.popularSupport) player.popularSupport += resources.popularSupport;
        this.clampResources(player);
    },

    clampResources(player) {
        player.gold = Math.max(0, player.gold);
        player.auctoritas = Math.max(0, player.auctoritas);
        player.popularSupport = Math.max(0, player.popularSupport);
    },

    // --- Age and death ----------------------------------------------------

    deathChance(age) {
        for (const bracket of GameConfig.deathCurve) {
            if (age <= bracket.maxAge) return bracket.chance;
        }
        return 1.0;
    },

    checkDeath(player) {
        return Math.random() < this.deathChance(player.paterfamilias.age);
    },

    // Handle a paterfamilias death: the heir succeeds, and the family web
    // shifts a generation - the widow becomes the new pater's mother, her
    // family tie (and tribute rate) carries over, and the heir must find
    // a wife of his own.
    handleDeath(player, gameState) {
        const deadName = player.paterfamilias.name;
        GameState.log(`💀 ${deadName} of the ${player.name} has died at age ${player.paterfamilias.age}.`);

        const wasEmperor = gameState.state.emperorId === player.id;

        const heirs = player.children
            .filter(c => c.gender === 'male' && c.age >= GameConfig.heirMinimumAge)
            .sort((a, b) => b.age - a.age);

        if (heirs.length > 0) {
            const heir = heirs[0];

            // The widow becomes the dowager mother of the new generation
            if (player.wife) {
                player.mother = {
                    name: player.wife.name,
                    fromFamily: player.wife.fromFamily,
                    traits: player.wife.traits
                };
                player.tributeRates.toMother = player.tributeRates.toWife;
                const motherFamily = GameState.getPlayer(player.mother.fromFamily);
                GameState.log(`${player.mother.name} becomes the family's matriarch — tribute to the ${motherFamily ? motherFamily.name : '?'} continues at ${Math.round(player.tributeRates.toMother * 100)}%.`);
            } else {
                player.mother = null;
                player.tributeRates.toMother = 0;
            }
            player.wife = null;
            player.tributeRates.toWife = 0;

            player.paterfamilias = {
                name: heir.name,
                age: heir.age,
                traits: heir.traits
            };
            player.children = player.children.filter(c => c !== heir);
            player.generation++;

            GameState.log(`${heir.name}, age ${heir.age}, becomes paterfamilias of the ${player.name} (generation ${player.generation}).`);

            // A betrothal arranged in the old generation is honored now
            if (player.betrothal) {
                const bride = player.betrothal;
                player.wife = { name: bride.name, fromFamily: bride.fromFamily, traits: bride.traits };
                player.tributeRates.toWife = bride.tributeRate;
                player.betrothal = null;
                const brideFamily = GameState.getPlayer(bride.fromFamily);
                GameState.log(`⚭ The betrothal is honored: ${heir.name} marries ${bride.name} of the ${brideFamily ? brideFamily.name : '?'} (${Math.round(player.tributeRates.toWife * 100)}% tribute).`);
            } else {
                GameState.log(`${heir.name} is unmarried — a new marriage must be arranged.`);
            }
        } else {
            // No eligible heir: a distant relative takes over and the
            // carefully-built web of connections is severed.
            GameState.log(`⚠️ The ${player.name} has no heir of age! A distant relative, ${GameState.generateName('male')}, seizes control.`);
            GameState.log(`All marriage ties are severed — the family web must be rebuilt.`);

            player.paterfamilias = {
                name: GameState.generateName('male'),
                age: GameConfig.distantRelativeAge,
                traits: []
            };
            player.wife = null;
            player.mother = null;
            player.betrothal = null;
            player.tributeRates.toMother = 0;
            player.tributeRates.toWife = 0;
            player.generation++;

            player.auctoritas = Math.max(0, player.auctoritas - GameConfig.successionCrisisPenalty.auctoritas);
            player.popularSupport = Math.max(0, player.popularSupport - GameConfig.successionCrisisPenalty.popularSupport);
            player.effects.push({
                type: 'income_modifier',
                value: GameConfig.successionCrisisPenalty.incomeModifier,
                duration: GameConfig.successionCrisisPenalty.duration,
                name: 'Succession Crisis'
            });
        }

        if (wasEmperor) {
            Succession.triggerSuccession(gameState, 'death');
        }
    },

    // --- Children -----------------------------------------------------

    addChild(player, forcedGender) {
        const gender = forcedGender || (Math.random() < 0.5 ? 'male' : 'female');
        const name = GameState.generateName(gender);

        const pool = gender === 'female' ? GameConfig.femaleTraits : GameConfig.maleTraits;
        let traitCount = Math.random() < GameConfig.childTraitCountBonusChance ? 2 : 1;

        // Venus's blessing guarantees a gifted child
        if (player.effects.some(e => e.type === 'venus_blessing')) {
            traitCount = 2;
        }

        const child = {
            name: name,
            age: 0,
            gender: gender,
            traits: this.selectRandomTraits(pool, traitCount)
        };

        player.children.push(child);
        GameState.log(`👶 ${player.name}: a ${gender === 'male' ? 'son' : 'daughter'}, ${name}, is born${traitCount > 1 ? ' — a gifted child!' : '!'}`);
    },

    // Age children and roll for new births
    ageFamily(player) {
        player.children.forEach(child => child.age++);

        if (!player.wife) return;
        if (player.paterfamilias.age > GameConfig.maxFertilityAge) return;

        let fertilityChance = GameConfig.baseFertilityChance;
        if (this.femaleTraitCount(player, 'Fertile') > 0) {
            fertilityChance += GameConfig.fertileBonusChance * this.femaleTraitCount(player, 'Fertile');
        }
        player.effects.forEach(effect => {
            if (effect.type === 'fertility_boost') fertilityChance += effect.value;
        });

        if (Math.random() < fertilityChance) {
            this.addChild(player);
        }
    },

    // --- Turn upkeep ----------------------------------------------------

    updateEffects(player) {
        player.effects = player.effects.filter(effect => {
            if (effect.duration !== undefined) {
                effect.duration--;
                return effect.duration > 0;
            }
            return true;
        });
    },

    resetTurnFlags(player) {
        player.actionTaken = false;
        player.cardPlayed = false;
    },

    // Succession score: weighted blend of popularity and virtue
    calculateSuccessionScore(player, weights) {
        return (weights.popularity * player.popularSupport) +
               (weights.virtue * player.auctoritas);
    }
};
