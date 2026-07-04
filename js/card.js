// Card Definitions and Effects
// Each definition appears GameConfig.cardCopies times in the deck.
// Cards carry a defId so save/load can rehydrate their effect functions.
const CardDefinitions = {
    _definitions: null,

    getDefinitions() {
        if (this._definitions) return this._definitions;

        const defs = [];
        const add = (defId, name, type, cost, description, effect, needsTarget) => {
            defs.push({ defId, name, type, cost, description, effect, needsTarget: !!needsTarget });
        };

        // --- Military (5) ---
        add('launch_raid', 'Launch Raid', 'military', { gold: 8 },
            'Steal a random estate from a rival if your Support + Auctoritas matches theirs; otherwise lose 4 gold. Kin are protected — you cannot raid your wife\'s or mother\'s family.',
            this.launchRaid, true);

        add('sabotage_campaign', 'Sabotage Campaign', 'military', { gold: 6 },
            'Target a rival. Their next imperial campaign has +30% failure chance.',
            this.sabotageCampaign, true);

        add('raise_legion', 'Raise Legion', 'military', { gold: 10 },
            'Gain +2 Popular Support and add +12 to Rome\'s military strength.',
            this.raiseLegion, false);

        add('hire_mercenaries', 'Hire Mercenaries', 'military', { gold: 7 },
            'A private guard: +15 coup and raid defense for 3 turns, and +5 to Rome\'s military strength.',
            this.hireMercenaries, false);

        add('military_tribune', 'Military Tribune', 'military', { gold: 5 },
            'Appoint a son (14+) as tribune: +1 Auctoritas and +1 Popular Support per turn for 3 turns.',
            this.militaryTribune, false);

        // --- Political (5) ---
        add('bribe_senator', 'Bribe Senator', 'political', { gold: 8 },
            'Gain +3 Auctoritas. Target rival loses 1 Auctoritas.',
            this.bribeSenator, true);

        add('denounce_rival', 'Denounce Rival', 'political', { gold: 4 },
            'Target rival loses 2 Auctoritas — but if their Auctoritas exceeds yours, the denunciation backfires and you lose 1. Cannot target kin.',
            this.denounceRival, true);

        add('political_alliance', 'Political Alliance', 'political', { gold: 5 },
            'Form a pact with a rival: you both gain +1 Auctoritas per turn for 5 turns.',
            this.politicalAlliance, true);

        add('censors_report', 'Censor\'s Report', 'political', { gold: 7 },
            'Expose corruption: gain +2 Auctoritas, and every rival richer than you loses 1 Auctoritas.',
            this.censorsReport, false);

        add('senate_motion', 'Senate Motion', 'political', { gold: 6, auctoritas: 2 },
            'Move the Senate: gain +3 Auctoritas and shift the Popularity/Virtue counter 2 points in the direction of your choice.',
            this.senateMotion, false);

        // --- Intrigue (5) ---
        add('spread_rumors', 'Spread Rumors', 'intrigue', { gold: 6 },
            'Whispers of infidelity force a divorce upon the target — their tribute tie is severed and unmarried penalties apply. Cannot target kin.',
            this.spreadRumors, true);

        add('assassinate', 'Assassinate', 'intrigue', { gold: 12, popularSupport: 5 },
            'Attempt to kill the target paterfamilias (45% base; Scheming +15%, target\'s Influential women -15%). Failure exposes you. Striking kin costs impiety.',
            this.assassinate, true);

        add('blackmail', 'Blackmail', 'intrigue', { gold: 5 },
            'Requires higher Auctoritas than the target. They pay you 8 gold, or an estate, or lose 3 Auctoritas. Cannot target kin.',
            this.blackmail, true);

        add('poison', 'Poison', 'intrigue', { gold: 8 },
            'Slip poison into the target paterfamilias\'s cup — he ages 2 extra years this round. Striking kin costs impiety.',
            this.poison, true);

        add('betrothal_pact', 'Betrothal Pact', 'intrigue', { gold: 4 },
            'Promise your daughter (14+) to the target\'s heir. When their next paterfamilias succeeds, he marries her — binding their family to yours with a 10% tribute.',
            this.betrothalPact, true);

        // --- Economic (5) ---
        add('trade_monopoly', 'Trade Monopoly', 'economic', { gold: 10 },
            'Corner the trade of the empire\'s richest province: +3 gold per turn for 4 turns.',
            this.tradeMonopoly, false);

        add('debt_collection', 'Debt Collection', 'economic', { gold: 3 },
            'Call in family debts: a player who owes you tribute (your daughter is their wife or mother) pays you 6 gold.',
            this.debtCollection, true);

        add('estate_development', 'Estate Development', 'economic', { gold: 8 },
            'Improve up to 3 of your estates by +1 gold per turn. Permanent.',
            this.estateDevelopment, false);

        add('grain_dole', 'Grain Dole', 'economic', { gold: 6 },
            'Feed the people: gain +3 Popular Support. All other families gain +1.',
            this.grainDole, false);

        add('tax_farm', 'Tax Farm', 'economic', { gold: 5 },
            'Recover 50% of the next tax payment you make to the Emperor.',
            this.taxFarm, false);

        // --- Religious (5) ---
        add('sacrifice_venus', 'Sacrifice to Venus', 'religious', { gold: 5 },
            'Boost fertility: +30% chance of a child for 2 turns, and children born will be gifted (2 traits).',
            this.sacrificeToVenus, false);

        add('sacrifice_mars', 'Sacrifice to Mars', 'religious', { gold: 6 },
            'Honor the war god: gain +3 Popular Support and add +6 to Rome\'s military strength.',
            this.sacrificeToMars, false);

        add('divine_favor', 'Divine Favor', 'religious', { gold: 4 },
            'The gods smile on your household: your wife\'s and mother\'s traits act with double strength for 3 turns.',
            this.divineFavor, false);

        add('oracles_warning', 'Oracle\'s Warning', 'religious', { gold: 5 },
            'The Sibyl speaks: reveal the next 3 omens in the event queue and gain +2 Auctoritas.',
            this.oraclesWarning, false);

        add('religious_festival', 'Religious Festival', 'religious', { gold: 7 },
            'Host a festival: gain +2 Popular Support and +1 Auctoritas. Your kin families each gain +1 Popular Support.',
            this.religiousFestival, false);

        this._definitions = defs;
        return defs;
    },

    // Build the full deck (multiple copies of each definition)
    getAllCards() {
        const cards = [];
        let cardId = 0;
        for (let copy = 0; copy < GameConfig.cardCopies; copy++) {
            this.getDefinitions().forEach(def => {
                cards.push(Object.assign({ id: cardId++ }, def));
            });
        }
        return cards;
    },

    // Rebuild a serialized card's functions after loading a save
    rehydrate(card) {
        const def = this.getDefinitions().find(d => d.defId === card.defId);
        if (!def) return card;
        return Object.assign({ id: card.id }, def);
    },

    // Violence against kin is possible but impious
    applyImpiety(player, target) {
        if (GameState.areKin(player, target)) {
            Player.addResources(player, {
                auctoritas: -GameConfig.kinImpietyPenalty.auctoritas,
                popularSupport: -GameConfig.kinImpietyPenalty.popularSupport
            });
            GameState.log(`😱 Impiety! ${player.name} raised a hand against kin — -${GameConfig.kinImpietyPenalty.auctoritas} Auctoritas, -${GameConfig.kinImpietyPenalty.popularSupport} Support.`);
            return true;
        }
        return false;
    },

    // --- Effects ----------------------------------------------------------
    // Effects return false to indicate the card could not legally be played
    // (cost is refunded and the card stays in hand).

    launchRaid(player, target, gameState) {
        if (GameState.areKin(player, target)) {
            GameState.log(`${player.name} cannot raid kin — the family web protects the ${target.name}.`);
            return false;
        }
        if (target.estates.length === 0) {
            GameState.log(`The ${target.name} have no estates to raid!`);
            return false;
        }

        let defense = target.popularSupport + target.auctoritas;
        target.effects.forEach(e => { if (e.type === 'coup_defense') defense += e.value; });
        const attack = player.popularSupport + player.auctoritas;

        if (attack >= defense) {
            const idx = Math.floor(Math.random() * target.estates.length);
            const stolen = target.estates[idx];
            target.estates.splice(idx, 1);
            stolen.ownerId = player.id;
            player.estates.push(stolen);
            GameState.log(`⚔️ ${player.name} raided the ${target.name} and seized an estate!`);
        } else {
            player.gold = Math.max(0, player.gold - 4);
            GameState.log(`⚔️ ${player.name}'s raid on the ${target.name} was repelled — 4 gold lost.`);
        }
        return true;
    },

    sabotageCampaign(player, target, gameState) {
        target.effects.push({
            type: 'campaign_sabotage',
            value: 0.30,
            name: 'Sabotaged Campaign'
        });
        GameState.log(`🗡️ ${player.name} sabotaged the ${target.name}'s next military campaign!`);
        return true;
    },

    raiseLegion(player, target, gameState) {
        player.popularSupport += 2;
        gameState.state.militaryStrength += 12;
        GameState.log(`🛡️ ${player.name} raised a legion! +2 Support, Rome's military +12.`);
        return true;
    },

    hireMercenaries(player, target, gameState) {
        player.effects.push({
            type: 'coup_defense',
            value: 15,
            duration: 3,
            name: 'Hired Mercenaries'
        });
        gameState.state.militaryStrength += 5;
        GameState.log(`🛡️ ${player.name} hired a private guard (+15 defense, 3 turns). Rome's military +5.`);
        return true;
    },

    militaryTribune(player, target, gameState) {
        const son = player.children.find(c => c.gender === 'male' && c.age >= GameConfig.minimumMarriageAge);
        if (!son) {
            GameState.log(`${player.name} has no son of age (14+) to appoint as tribune.`);
            return false;
        }
        player.effects.push({
            type: 'per_turn_bonus',
            auctoritas: 1,
            popularSupport: 1,
            duration: 3,
            name: `Tribune ${son.name}`
        });
        GameState.log(`🎖️ ${son.name} of the ${player.name} serves as Military Tribune (+1/+1 per turn, 3 turns).`);
        return true;
    },

    bribeSenator(player, target, gameState) {
        player.auctoritas += 3;
        target.auctoritas = Math.max(0, target.auctoritas - 1);
        GameState.log(`🏛️ ${player.name} bribed senators: +3 Auctoritas; the ${target.name} lose 1.`);
        return true;
    },

    denounceRival(player, target, gameState) {
        if (GameState.areKin(player, target)) {
            GameState.log(`${player.name} cannot denounce kin — the scandal would stain both houses.`);
            return false;
        }
        if (target.auctoritas > player.auctoritas) {
            player.auctoritas = Math.max(0, player.auctoritas - 1);
            GameState.log(`🏛️ ${player.name}'s denunciation of the ${target.name} backfired! -1 Auctoritas.`);
        } else {
            target.auctoritas = Math.max(0, target.auctoritas - 2);
            GameState.log(`🏛️ ${player.name} denounced the ${target.name} before the Senate! They lose 2 Auctoritas.`);
        }
        return true;
    },

    politicalAlliance(player, target, gameState) {
        player.effects.push({
            type: 'per_turn_bonus', auctoritas: 1, duration: 5,
            name: `Alliance with ${target.name}`
        });
        target.effects.push({
            type: 'per_turn_bonus', auctoritas: 1, duration: 5,
            name: `Alliance with ${player.name}`
        });
        GameState.log(`🤝 The ${player.name} and the ${target.name} formed a political alliance (+1 Auctoritas per turn for 5 turns).`);
        return true;
    },

    censorsReport(player, target, gameState) {
        player.auctoritas += 2;
        gameState.state.players.forEach(p => {
            if (p.id !== player.id && p.gold > player.gold) {
                p.auctoritas = Math.max(0, p.auctoritas - 1);
                GameState.log(`📜 The Censor exposes the ${p.name}'s wealth — -1 Auctoritas.`);
            }
        });
        GameState.log(`📜 ${player.name} published a Censor's Report: +2 Auctoritas.`);
        return true;
    },

    senateMotion(player, target, gameState) {
        player.auctoritas += 3;
        player.pendingCounterShift = true; // UI will prompt for direction
        GameState.log(`🏛️ ${player.name} moved the Senate: +3 Auctoritas. Choose which way to bend Rome's institutions.`);
        return true;
    },

    spreadRumors(player, target, gameState) {
        if (GameState.areKin(player, target)) {
            GameState.log(`${player.name} cannot spread rumors about kin — the shame would touch your own house.`);
            return false;
        }
        if (!target.wife) {
            GameState.log(`The ${target.name} paterfamilias has no wife to slander.`);
            return false;
        }
        Marriage.dissolve(target, 'scandal');
        GameState.log(`🗡️ ${player.name} spread vicious rumors — the ${target.name} marriage is destroyed!`);
        return true;
    },

    assassinate(player, target, gameState) {
        CardDefinitions.applyImpiety(player, target);

        let chance = GameConfig.assassination.baseChance;
        if (Player.femaleTraitCount(player, 'Scheming') > 0) chance += GameConfig.assassination.schemingBonus;
        if (Player.femaleTraitCount(target, 'Influential') > 0) chance -= GameConfig.assassination.influentialDefense;

        const wasEmperor = gameState.state.emperorId === target.id;

        if (Math.random() < chance) {
            GameState.log(`🗡️ The blade finds its mark — ${target.paterfamilias.name} of the ${target.name} is assassinated!`);
            if (wasEmperor) {
                gameState.state.militaryStrength = Math.max(0, gameState.state.militaryStrength - GameConfig.assassination.emperorDeathMilitaryPenalty);
                GameState.log(`The murder of an Emperor shakes the legions (-${GameConfig.assassination.emperorDeathMilitaryPenalty} military).`);
                Succession.applyKinFallPenalty(gameState, target, player);
            }
            Player.handleDeath(target, gameState);
        } else {
            Player.addResources(player, {
                auctoritas: -GameConfig.assassination.failurePenalty.auctoritas,
                popularSupport: -GameConfig.assassination.failurePenalty.popularSupport
            });
            GameState.log(`🗡️ The assassin was caught! ${player.name} is exposed: -${GameConfig.assassination.failurePenalty.auctoritas} Auctoritas, -${GameConfig.assassination.failurePenalty.popularSupport} Support.`);
        }
        return true;
    },

    blackmail(player, target, gameState) {
        if (GameState.areKin(player, target)) {
            GameState.log(`${player.name} cannot blackmail kin — their secrets are your secrets.`);
            return false;
        }
        if (player.auctoritas <= target.auctoritas) {
            GameState.log(`${player.name} lacks the standing to blackmail the ${target.name} (need higher Auctoritas).`);
            return false;
        }

        if (target.gold >= 8) {
            target.gold -= 8;
            player.gold += 8;
            GameState.log(`🗡️ ${player.name} blackmailed the ${target.name} for 8 gold!`);
        } else if (target.estates.length > 0) {
            const estate = target.estates.shift();
            estate.ownerId = player.id;
            player.estates.push(estate);
            GameState.log(`🗡️ ${player.name} blackmailed the ${target.name} out of an estate!`);
        } else {
            target.auctoritas = Math.max(0, target.auctoritas - 3);
            GameState.log(`🗡️ ${player.name} blackmailed the penniless ${target.name} — they lose 3 Auctoritas.`);
        }
        return true;
    },

    poison(player, target, gameState) {
        CardDefinitions.applyImpiety(player, target);
        target.effects.push({
            type: 'accelerated_aging',
            value: 2,
            name: 'Poisoned'
        });
        GameState.log(`☠️ ${player.name} slipped poison to ${target.paterfamilias.name} — he will age 2 extra years this round.`);
        return true;
    },

    betrothalPact(player, target, gameState) {
        if (target.betrothal) {
            GameState.log(`The ${target.name} heir is already promised to another.`);
            return false;
        }
        const daughters = player.children.filter(c => c.gender === 'female' && c.age >= GameConfig.minimumMarriageAge);
        if (daughters.length === 0) {
            GameState.log(`${player.name} has no daughter of age (14+) to promise.`);
            return false;
        }
        const daughter = daughters[0];
        player.children = player.children.filter(c => c !== daughter);
        target.betrothal = {
            name: daughter.name,
            fromFamily: player.id,
            traits: daughter.traits,
            tributeRate: 0.10
        };
        player.popularSupport += 1;
        target.popularSupport += 1;
        GameState.log(`⚭ Betrothal Pact: ${daughter.name} of the ${player.name} is promised to the next ${target.name} paterfamilias. When he succeeds, tribute will flow to the ${player.name}.`);
        return true;
    },

    tradeMonopoly(player, target, gameState) {
        const conquered = gameState.state.provinces.filter(p => p.conquered);
        const richest = conquered.reduce((max, p) => p.estates.length > max.estates.length ? p : max, conquered[0]);
        player.effects.push({
            type: 'per_turn_gold',
            value: 3,
            duration: 4,
            name: `Monopoly: ${richest.name}`
        });
        GameState.log(`💰 ${player.name} cornered the trade of ${richest.name}: +3 gold per turn for 4 turns.`);
        return true;
    },

    debtCollection(player, target, gameState) {
        const owesPlayer = (target.wife && target.wife.fromFamily === player.id) ||
                           (target.mother && target.mother.fromFamily === player.id);
        if (!owesPlayer) {
            GameState.log(`The ${target.name} owe the ${player.name} no tribute — no debt to collect.`);
            return false;
        }
        const payment = Math.min(6, target.gold);
        target.gold -= payment;
        player.gold += payment;
        GameState.log(`💰 ${player.name} called in family debts: the ${target.name} pay ${payment} gold.`);
        return true;
    },

    estateDevelopment(player, target, gameState) {
        if (player.estates.length === 0) {
            GameState.log(`${player.name} has no estates to develop.`);
            return false;
        }
        const count = Math.min(3, player.estates.length);
        // Develop the lowest-yield estates first
        const sorted = [...player.estates].sort((a, b) => a.yield - b.yield);
        for (let i = 0; i < count; i++) sorted[i].yield += 1;
        GameState.log(`💰 ${player.name} developed ${count} estates (+${count} gold per turn, permanent).`);
        return true;
    },

    grainDole(player, target, gameState) {
        player.popularSupport += 3;
        gameState.state.players.forEach(p => {
            if (p.id !== player.id) p.popularSupport += 1;
        });
        GameState.log(`🌾 ${player.name} distributed grain: +3 Support (+1 to every other family).`);
        return true;
    },

    taxFarm(player, target, gameState) {
        player.effects.push({
            type: 'tax_refund',
            value: 0.50,
            name: 'Tax Farm'
        });
        GameState.log(`💰 ${player.name} set up a tax farm — 50% of the next tax payment will be recovered.`);
        return true;
    },

    sacrificeToVenus(player, target, gameState) {
        player.effects.push({ type: 'fertility_boost', value: 0.30, duration: 2, name: 'Venus\'s Favor' });
        player.effects.push({ type: 'venus_blessing', duration: 2, name: 'Venus\'s Blessing' });
        GameState.log(`⛪ ${player.name} sacrificed to Venus — fertility blooms, and children born will be gifted.`);
        return true;
    },

    sacrificeToMars(player, target, gameState) {
        player.popularSupport += 3;
        gameState.state.militaryStrength += 6;
        GameState.log(`⛪ ${player.name} sacrificed to Mars: +3 Support, Rome's military +6.`);
        return true;
    },

    divineFavor(player, target, gameState) {
        player.effects.push({
            type: 'divine_favor',
            duration: 3,
            name: 'Divine Favor'
        });
        GameState.log(`⛪ The gods favor the ${player.name} — the household's women act with double strength for 3 turns.`);
        return true;
    },

    oraclesWarning(player, target, gameState) {
        const queue = gameState.state.eventQueue;
        const revealCount = Math.min(GameConfig.readOmensRevealCount, queue.length);
        for (let i = 0; i < revealCount; i++) {
            queue[i].faceUp = true;
        }
        player.auctoritas += 2;
        GameState.log(`🔮 The Sibyl speaks to the ${player.name}: ${revealCount} omens revealed, +2 Auctoritas.`);
        return true;
    },

    religiousFestival(player, target, gameState) {
        player.popularSupport += 2;
        player.auctoritas += 1;
        GameState.getKinFamilyIds(player).forEach(id => {
            const kin = GameState.getPlayer(id);
            if (kin) {
                kin.popularSupport += 1;
                GameState.log(`  …the ${kin.name}, as kin, share the glory (+1 Support).`);
            }
        });
        GameState.log(`⛪ ${player.name} hosted a Religious Festival: +2 Support, +1 Auctoritas.`);
        return true;
    }
};
