// Card Definitions and Effects
const CardDefinitions = {
    // Get all cards in the deck
    getAllCards() {
        const cards = [];
        let cardId = 0;

        // Military Cards (5)
        cards.push(this.createCard(cardId++, 'Launch Raid', 'military',
            { gold: 8 },
            'Target a province controlled by another player. Steal 1 estate from that province. Risk: If target has higher military strength, lose 5 gold instead.',
            this.launchRaid
        ));

        cards.push(this.createCard(cardId++, 'Sabotage Campaign', 'military',
            { gold: 6 },
            'Target an opponent. Their next military campaign has +30% failure chance.',
            this.sabotageCampaign
        ));

        cards.push(this.createCard(cardId++, 'Raise Legion', 'military',
            { gold: 10 },
            'Gain +2 Popular Support and boost Rome\'s military strength by 10%. Makes all campaigns more likely to succeed for 3 turns.',
            this.raiseLegion
        ));

        cards.push(this.createCard(cardId++, 'Hire Mercenaries', 'military',
            { gold: 7 },
            'Immediately gain +15% military strength for your family only. Duration: 2 turns.',
            this.hireMercenaries
        ));

        cards.push(this.createCard(cardId++, 'Military Tribune', 'military',
            { gold: 5 },
            'Appoint one of your sons as tribune. Gain +1 Auctoritas and +1 Popular Support per turn for 3 turns.',
            this.militaryTribune
        ));

        // Political Cards (5)
        cards.push(this.createCard(cardId++, 'Bribe Senator', 'political',
            { gold: 8 },
            'Gain +3 Auctoritas immediately. Choose one opponent to lose -1 Auctoritas.',
            this.bribeSenator
        ));

        cards.push(this.createCard(cardId++, 'Denounce Rival', 'political',
            { gold: 4 },
            'Target opponent loses -2 Auctoritas. Risk: If target has higher Auctoritas than you, you lose -1 Auctoritas instead.',
            this.denounceRival
        ));

        cards.push(this.createCard(cardId++, 'Political Alliance', 'political',
            { gold: 5 },
            'Propose alliance with another player. If accepted, both gain +1 Auctoritas per turn until one breaks it.',
            this.politicalAlliance
        ));

        cards.push(this.createCard(cardId++, 'Censor\'s Report', 'political',
            { gold: 7 },
            'Force all players to reveal their current Gold, Popular Support, and Auctoritas. Gain +2 Auctoritas.',
            this.censorsReport
        ));

        cards.push(this.createCard(cardId++, 'Senate Motion', 'political',
            { gold: 6, auctoritas: 2 },
            'Propose a vote affecting all players. Each player votes yes/no. Majority wins.',
            this.senateMotion
        ));

        // Intrigue Cards (5)
        cards.push(this.createCard(cardId++, 'Spread Rumors', 'intrigue',
            { gold: 6 },
            'Force a divorce between target player and their wife. Target suffers unmarried penalties until remarriage.',
            this.spreadRumors
        ));

        cards.push(this.createCard(cardId++, 'Assassinate', 'intrigue',
            { gold: 12, popularSupport: 5 },
            'Attempt to kill target paterfamilias. 50% success chance. Failure: Lose -5 Auctoritas, -10 Popular Support.',
            this.assassinate
        ));

        cards.push(this.createCard(cardId++, 'Blackmail', 'intrigue',
            { gold: 5 },
            'Target must choose: Pay you 8 Gold OR give you 1 estate OR lose -3 Auctoritas. Requires higher Auctoritas.',
            this.blackmail
        ));

        cards.push(this.createCard(cardId++, 'Poison', 'intrigue',
            { gold: 8 },
            'Target opponent\'s paterfamilias ages 2 turns instead of 1 on their next turn. Can trigger early death.',
            this.poison
        ));

        cards.push(this.createCard(cardId++, 'Forge Alliance', 'intrigue',
            { gold: 4 },
            'Arrange a marriage between your daughter and target player\'s son. Creates new connection if both agree.',
            this.forgeAlliance
        ));

        // Economic Cards (5)
        cards.push(this.createCard(cardId++, 'Trade Monopoly', 'economic',
            { gold: 10 },
            'Choose one province. Gain +1 Gold per estate in that province (even if you don\'t own them). Duration: 4 turns.',
            this.tradeMonopoly
        ));

        cards.push(this.createCard(cardId++, 'Debt Collection', 'economic',
            { gold: 3 },
            'Target opponent must pay you 6 Gold immediately. Can only target players who owe you tribute (mother/wife families).',
            this.debtCollection
        ));

        cards.push(this.createCard(cardId++, 'Estate Development', 'economic',
            { gold: 8 },
            'Choose up to 3 of your estates. Each produces +1 Gold per turn. Permanent.',
            this.estateDevelopment
        ));

        cards.push(this.createCard(cardId++, 'Grain Dole', 'economic',
            { gold: 6 },
            'Spend gold to feed the people. Gain +3 Popular Support. All other players gain +1 Popular Support.',
            this.grainDole
        ));

        cards.push(this.createCard(cardId++, 'Tax Farm', 'economic',
            { gold: 7 },
            'Gain +50% of the taxes you pay back to yourself next turn. One-time effect.',
            this.taxFarm
        ));

        // Religious Cards (5)
        cards.push(this.createCard(cardId++, 'Sacrifice to Venus', 'religious',
            { gold: 5 },
            'Boost fertility. Gain +30% chance of child this turn and next turn. Children born have +1 trait.',
            this.sacrificeToVenus
        ));

        cards.push(this.createCard(cardId++, 'Sacrifice to Mars', 'religious',
            { gold: 6 },
            'Choose one: Gain +3 Popular Support OR boost Rome\'s military strength by 5% for 2 turns.',
            this.sacrificeToMars
        ));

        cards.push(this.createCard(cardId++, 'Divine Favor', 'religious',
            { gold: 4 },
            'Choose one character trait to activate with double effectiveness for 3 turns.',
            this.divineFavor
        ));

        cards.push(this.createCard(cardId++, 'Oracle\'s Warning', 'religious',
            { gold: 5 },
            'Block one opponent\'s card play this turn. Play as a reaction.',
            this.oraclesWarning
        ));

        cards.push(this.createCard(cardId++, 'Religious Festival', 'religious',
            { gold: 7 },
            'Host a festival. Gain +2 Popular Support and +1 Auctoritas. All connected players gain +1 Popular Support.',
            this.religiousFestival
        ));

        return cards;
    },

    createCard(id, name, type, cost, description, effect) {
        return {
            id: id,
            name: name,
            type: type,
            cost: cost,
            description: description,
            effect: effect
        };
    },

    // Card Effect Functions

    launchRaid(player, target, gameState) {
        if (!target || target.estates.length === 0) {
            GameState.log(`${player.name} cannot raid ${target.name} - no estates to steal!`);
            return;
        }

        // Simple military strength comparison (based on gold)
        const playerStrength = player.gold;
        const targetStrength = target.gold;

        if (playerStrength >= targetStrength) {
            // Success - steal an estate
            const stolenEstate = target.estates[0];
            stolenEstate.ownerId = player.id;
            target.estates.shift();
            player.estates.push(stolenEstate);
            GameState.log(`${player.name} successfully raided ${target.name} and stole an estate!`);
        } else {
            // Failure - lose gold
            player.gold = Math.max(0, player.gold - 5);
            GameState.log(`${player.name}'s raid on ${target.name} failed! Lost 5 gold.`);
        }
    },

    sabotageCampaign(player, target, gameState) {
        target.effects.push({
            type: 'campaign_sabotage',
            value: 0.30,
            duration: 99, // Until next campaign
            name: 'Sabotaged Campaign'
        });
        GameState.log(`${player.name} sabotaged ${target.name}'s next military campaign!`);
    },

    raiseLegion(player, target, gameState) {
        player.popularSupport += 2;
        gameState.state.militaryStrength += 15;

        gameState.state.players.forEach(p => {
            p.effects.push({
                type: 'rome_military_boost',
                value: 0.10,
                duration: 3,
                name: 'Raised Legion'
            });
        });

        GameState.log(`${player.name} raised a legion! Popular support increased, Rome grows stronger (+15 military).`);
    },

    hireMercenaries(player, target, gameState) {
        player.effects.push({
            type: 'military_strength',
            value: 0.15,
            duration: 2,
            name: 'Hired Mercenaries'
        });
        GameState.log(`${player.name} hired mercenaries to bolster their military strength!`);
    },

    militaryTribune(player, target, gameState) {
        player.effects.push({
            type: 'per_turn_bonus',
            auctoritas: 1,
            popularSupport: 1,
            duration: 3,
            name: 'Military Tribune'
        });
        GameState.log(`${player.name} appointed a son as Military Tribune!`);
    },

    bribeSenator(player, target, gameState) {
        player.auctoritas += 3;
        if (target) {
            target.auctoritas = Math.max(0, target.auctoritas - 1);
            GameState.log(`${player.name} bribed senators! Gained influence, ${target.name} lost some.`);
        } else {
            GameState.log(`${player.name} bribed senators! Gained +3 Auctoritas.`);
        }
    },

    denounceRival(player, target, gameState) {
        if (!target) {
            GameState.log(`${player.name} must select a target to denounce!`);
            return;
        }

        if (target.auctoritas > player.auctoritas) {
            player.auctoritas = Math.max(0, player.auctoritas - 1);
            GameState.log(`${player.name} denounced ${target.name} but it backfired! Lost 1 Auctoritas.`);
        } else {
            target.auctoritas = Math.max(0, target.auctoritas - 2);
            GameState.log(`${player.name} successfully denounced ${target.name}! Target lost 2 Auctoritas.`);
        }
    },

    politicalAlliance(player, target, gameState) {
        if (!target) {
            GameState.log(`${player.name} must select a target for alliance!`);
            return;
        }

        // Both players get bonus
        player.effects.push({
            type: 'per_turn_bonus',
            auctoritas: 1,
            duration: 99, // Until broken
            name: `Alliance with ${target.name}`
        });

        target.effects.push({
            type: 'per_turn_bonus',
            auctoritas: 1,
            duration: 99,
            name: `Alliance with ${player.name}`
        });

        GameState.log(`${player.name} and ${target.name} formed a political alliance!`);
    },

    censorsReport(player, target, gameState) {
        player.auctoritas += 2;

        let report = `${player.name} revealed all player resources:\n`;
        gameState.state.players.forEach(p => {
            report += `${p.name}: ${p.gold} Gold, ${p.popularSupport} Support, ${p.auctoritas} Virtue\n`;
        });

        GameState.log(report);
    },

    senateMotion(player, target, gameState) {
        // Simplified - just log it for now
        GameState.log(`${player.name} proposed a Senate Motion! (Voting system TBD)`);
        player.auctoritas += 1; // Small bonus for participation
    },

    spreadRumors(player, target, gameState) {
        if (!target || !target.wife) {
            GameState.log(`${player.name} cannot spread rumors about ${target.name} - no wife!`);
            return;
        }

        target.wife = null;
        target.effects.push({
            type: 'unmarried_penalty',
            value: true,
            duration: 99, // Until remarriage
            name: 'Divorced - Unmarried Penalty'
        });

        GameState.log(`${player.name} spread vicious rumors! ${target.name} is now divorced.`);
    },

    assassinate(player, target, gameState) {
        if (!target) {
            GameState.log(`${player.name} must select an assassination target!`);
            return;
        }

        const success = Math.random() < 0.5;

        if (success) {
            GameState.log(`${player.name} successfully assassinated ${target.paterfamilias.name}!`);
            Player.handleDeath(target, gameState);
        } else {
            player.auctoritas = Math.max(0, player.auctoritas - 5);
            player.popularSupport = Math.max(0, player.popularSupport - 10);
            GameState.log(`${player.name}'s assassination attempt failed and was exposed! Major penalties.`);
        }
    },

    blackmail(player, target, gameState) {
        if (!target) {
            GameState.log(`${player.name} must select a blackmail target!`);
            return;
        }

        if (player.auctoritas <= target.auctoritas) {
            GameState.log(`${player.name} cannot blackmail ${target.name} - insufficient Auctoritas!`);
            return;
        }

        // Simplified: Target automatically chooses based on what they can afford
        if (target.gold >= 8) {
            target.gold -= 8;
            player.gold += 8;
            GameState.log(`${player.name} blackmailed ${target.name} for 8 gold!`);
        } else if (target.estates.length > 0) {
            const estate = target.estates[0];
            estate.ownerId = player.id;
            target.estates.shift();
            player.estates.push(estate);
            GameState.log(`${player.name} blackmailed ${target.name} and took an estate!`);
        } else {
            target.auctoritas = Math.max(0, target.auctoritas - 3);
            GameState.log(`${player.name} blackmailed ${target.name}, who lost 3 Auctoritas!`);
        }
    },

    poison(player, target, gameState) {
        if (!target) {
            GameState.log(`${player.name} must select a poison target!`);
            return;
        }

        target.effects.push({
            type: 'accelerated_aging',
            value: 1, // Ages 1 extra turn
            duration: 1,
            name: 'Poisoned'
        });

        GameState.log(`${player.name} poisoned ${target.paterfamilias.name}! They will age rapidly.`);
    },

    forgeAlliance(player, target, gameState) {
        if (!target) {
            GameState.log(`${player.name} must select a target for marriage alliance!`);
            return;
        }

        // Check if player has daughters
        const daughters = player.children.filter(c => c.gender === 'female' && c.age >= GameConfig.minimumMarriageAge);
        const sons = target.children.filter(c => c.gender === 'male' && c.age >= GameConfig.minimumMarriageAge);

        if (daughters.length === 0 || sons.length === 0) {
            GameState.log(`${player.name} cannot forge alliance - no eligible children!`);
            return;
        }

        GameState.log(`${player.name} proposed marriage alliance with ${target.name}! (Marriage system will handle this)`);
    },

    tradeMonopoly(player, target, gameState) {
        if (gameState.state.provinces.length === 0) return;

        const province = gameState.state.provinces[0]; // Simplified: Use first province
        const estateCount = province.estates.length;

        player.effects.push({
            type: 'trade_monopoly',
            provinceId: province.id,
            value: estateCount,
            duration: 4,
            name: `Trade Monopoly: ${province.name}`
        });

        GameState.log(`${player.name} established a trade monopoly in ${province.name}!`);
    },

    debtCollection(player, target, gameState) {
        if (!target) {
            GameState.log(`${player.name} must select a debt collection target!`);
            return;
        }

        // Check if target owes tribute
        const owesPlayer = (target.wife && target.wife.fromFamily === player.id) ||
                          (target.mother && target.mother.fromFamily === player.id);

        if (!owesPlayer) {
            GameState.log(`${player.name} cannot collect debt from ${target.name} - no tribute owed!`);
            return;
        }

        const payment = Math.min(6, target.gold);
        target.gold -= payment;
        player.gold += payment;

        GameState.log(`${player.name} collected ${payment} gold debt from ${target.name}!`);
    },

    estateDevelopment(player, target, gameState) {
        const estatesToDevelop = Math.min(3, player.estates.length);

        for (let i = 0; i < estatesToDevelop; i++) {
            player.estates[i].yield += 1;
        }

        GameState.log(`${player.name} developed ${estatesToDevelop} estates! Permanent income increase.`);
    },

    grainDole(player, target, gameState) {
        player.popularSupport += 3;

        gameState.state.players.forEach(p => {
            if (p.id !== player.id) {
                p.popularSupport += 1;
            }
        });

        GameState.log(`${player.name} distributed grain to the people! Everyone benefits.`);
    },

    taxFarm(player, target, gameState) {
        player.effects.push({
            type: 'tax_refund',
            value: 0.50,
            duration: 1,
            name: 'Tax Farm'
        });

        GameState.log(`${player.name} set up a tax farm! Will recover 50% of next tax payment.`);
    },

    sacrificeToVenus(player, target, gameState) {
        player.effects.push({
            type: 'fertility_boost',
            value: 0.30,
            duration: 2,
            name: 'Sacrifice to Venus'
        });

        GameState.log(`${player.name} sacrificed to Venus! Fertility increased.`);
    },

    sacrificeToMars(player, target, gameState) {
        // Boost popular support and military strength
        player.popularSupport += 3;
        gameState.state.militaryStrength += 8;
        GameState.log(`${player.name} sacrificed to Mars! Gained popular support and military strength.`);
    },

    divineFavor(player, target, gameState) {
        player.effects.push({
            type: 'divine_favor',
            value: 2.0, // Double effectiveness
            duration: 3,
            name: 'Divine Favor'
        });

        GameState.log(`${player.name} gained Divine Favor! Traits are doubly effective.`);
    },

    oraclesWarning(player, target, gameState) {
        // Reactive card - simplified for now
        GameState.log(`${player.name} invoked the Oracle's Warning! (Reaction system TBD)`);
    },

    religiousFestival(player, target, gameState) {
        player.popularSupport += 2;
        player.auctoritas += 1;

        // Give bonus to connected families
        gameState.state.players.forEach(p => {
            if ((player.wife && player.wife.fromFamily === p.id) ||
                (player.mother && player.mother.fromFamily === p.id)) {
                p.popularSupport += 1;
            }
        });

        GameState.log(`${player.name} held a Religious Festival! Connected families benefit.`);
    }
};
