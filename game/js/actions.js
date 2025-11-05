// Core Turn Actions
const Actions = {
    // Phase 1: Income & Obligations
    processIncome(player) {
        const income = Player.calculateEstateIncome(player);
        player.gold += income;

        // Apply trade monopoly bonuses
        player.effects.forEach(effect => {
            if (effect.type === 'trade_monopoly') {
                player.gold += effect.value;
            }
        });

        // Apply per-turn bonuses from effects
        player.effects.forEach(effect => {
            if (effect.type === 'per_turn_bonus') {
                if (effect.auctoritas) player.auctoritas += effect.auctoritas;
                if (effect.popularSupport) player.popularSupport += effect.popularSupport;
            }
        });

        GameState.log(`${player.name} collected ${income} gold from estates`);

        // Apply trait effects
        Player.applyTraitEffects(player);
    },

    processTaxes(player, gameState) {
        if (gameState.state.emperorId === null) {
            return; // No taxes during Republic
        }

        const emperor = GameState.getEmperor();
        if (emperor.id === player.id) {
            return; // Emperor doesn't pay taxes to self
        }

        const taxAmount = Math.floor(player.gold * gameState.state.taxRate);
        player.gold -= taxAmount;
        emperor.gold += taxAmount;

        // Check for tax refund effect
        let refund = 0;
        player.effects.forEach(effect => {
            if (effect.type === 'tax_refund') {
                refund = Math.floor(taxAmount * effect.value);
                player.gold += refund;
            }
        });

        if (refund > 0) {
            GameState.log(`${player.name} paid ${taxAmount} gold in taxes (recovered ${refund} from tax farm)`);
        } else {
            GameState.log(`${player.name} paid ${taxAmount} gold in taxes to ${emperor.name}`);
        }
    },

    processTribute(player, gameState) {
        // Pay tribute to mother's family
        if (player.mother) {
            const motherPlayer = GameState.getPlayer(player.mother.fromFamily);
            const tributeAmount = Math.floor(player.gold * player.tributeRates.toMother);
            player.gold -= tributeAmount;
            motherPlayer.gold += tributeAmount;
            GameState.log(`${player.name} paid ${tributeAmount} gold tribute to ${motherPlayer.name} (mother's family)`);
        }

        // Pay tribute to wife's family
        if (player.wife) {
            const wifePlayer = GameState.getPlayer(player.wife.fromFamily);
            const tributeAmount = Math.floor(player.gold * player.tributeRates.toWife);
            player.gold -= tributeAmount;
            wifePlayer.gold += tributeAmount;
            GameState.log(`${player.name} paid ${tributeAmount} gold tribute to ${wifePlayer.name} (wife's family)`);
        }

        // Apply unmarried penalty
        const hasUnmarriedPenalty = player.effects.some(e => e.type === 'unmarried_penalty');
        if (!player.wife || hasUnmarriedPenalty) {
            player.popularSupport = Math.max(0, player.popularSupport - 1);
            GameState.log(`${player.name} suffers unmarried penalty: -1 Popular Support`);
        }
    },

    // Phase 2: Core Actions
    contributeToMilitary(player) {
        if (player.actionTaken) {
            GameState.log(`${player.name} has already taken an action this turn!`);
            return false;
        }

        const cost = 10;
        if (player.gold < cost) {
            GameState.log(`${player.name} cannot afford to contribute to military (need ${cost} gold)`);
            return false;
        }

        player.gold -= cost;
        player.auctoritas += 2;
        player.popularSupport += 1;
        GameState.state.militaryStrength += 5;
        player.actionTaken = true;

        GameState.log(`${player.name} contributed to Rome's military! +2 Auctoritas, +1 Popular Support, +5 Military Strength`);
        return true;
    },

    economicDevelopment(player) {
        if (player.actionTaken) {
            GameState.log(`${player.name} has already taken an action this turn!`);
            return false;
        }

        const cost = 8;
        if (player.gold < cost) {
            GameState.log(`${player.name} cannot afford economic development (need ${cost} gold)`);
            return false;
        }

        if (player.estates.length === 0) {
            GameState.log(`${player.name} has no estates to develop!`);
            return false;
        }

        player.gold -= cost;

        // Improve one random estate
        const randomEstate = player.estates[Math.floor(Math.random() * player.estates.length)];
        randomEstate.yield += 1;

        player.actionTaken = true;

        GameState.log(`${player.name} developed an estate! Permanent income increased.`);
        return true;
    },

    politicalManeuvering(player) {
        if (player.actionTaken) {
            GameState.log(`${player.name} has already taken an action this turn!`);
            return false;
        }

        const cost = 6;
        if (player.gold < cost) {
            GameState.log(`${player.name} cannot afford political maneuvering (need ${cost} gold)`);
            return false;
        }

        player.gold -= cost;
        player.auctoritas += 3;
        player.actionTaken = true;

        GameState.log(`${player.name} engaged in political maneuvering! +3 Auctoritas`);
        return true;
    },

    marriageNegotiation(player) {
        if (player.actionTaken) {
            GameState.log(`${player.name} has already taken an action this turn!`);
            return false;
        }

        // This will open a UI for marriage negotiation
        player.actionTaken = true;
        GameState.log(`${player.name} initiated marriage negotiations`);
        return true;
    },

    // Phase 3: Card Actions
    playCard(player, cardIndex, targetPlayer, gameState) {
        if (player.cardPlayed) {
            GameState.log(`${player.name} has already played a card this turn!`);
            return false;
        }

        if (cardIndex < 0 || cardIndex >= player.hand.length) {
            GameState.log(`Invalid card index`);
            return false;
        }

        const card = player.hand[cardIndex];

        // Check if player can afford the card
        if (!Player.canAfford(player, card.cost)) {
            GameState.log(`${player.name} cannot afford to play ${card.name}`);
            return false;
        }

        // Pay the cost
        Player.payCost(player, card.cost);

        // Apply the card effect
        if (card.effect) {
            card.effect(player, targetPlayer, gameState);
        }

        // Remove card from hand and add to discard
        player.hand.splice(cardIndex, 1);
        gameState.state.discardPile.push(card);
        player.cardPlayed = true;

        GameState.log(`${player.name} played ${card.name}`);
        return true;
    },

    discardCard(player, cardIndex, gameState) {
        if (player.cardDiscarded) {
            GameState.log(`${player.name} has already discarded a card this turn!`);
            return false;
        }

        if (cardIndex < 0 || cardIndex >= player.hand.length) {
            GameState.log(`Invalid card index`);
            return false;
        }

        const card = player.hand[cardIndex];
        player.hand.splice(cardIndex, 1);
        gameState.state.discardPile.push(card);
        player.cardDiscarded = true;

        GameState.log(`${player.name} discarded ${card.name}`);
        return true;
    },

    drawCards(player, count) {
        for (let i = 0; i < count; i++) {
            GameState.drawCard(player.id);
        }
    },

    // Phase 4: Imperial Actions
    setTaxRate(emperor, newRate, gameState) {
        if (gameState.state.emperorId !== emperor.id) {
            GameState.log(`${emperor.name} is not the Emperor!`);
            return false;
        }

        newRate = Math.max(0, Math.min(0.50, newRate));
        const oldRate = gameState.state.taxRate;
        gameState.state.taxRate = newRate;

        // Adjust popularity based on tax change
        if (newRate > oldRate) {
            emperor.popularSupport -= Math.floor((newRate - oldRate) * 20);
            GameState.log(`Emperor ${emperor.name} raised taxes to ${Math.floor(newRate * 100)}%! Popular support decreased.`);
        } else if (newRate < oldRate) {
            emperor.popularSupport += Math.floor((oldRate - newRate) * 10);
            GameState.log(`Emperor ${emperor.name} lowered taxes to ${Math.floor(newRate * 100)}%! Popular support increased.`);
        }

        return true;
    },

    launchCampaign(emperor, gameState) {
        if (gameState.state.emperorId !== emperor.id) {
            GameState.log(`${emperor.name} is not the Emperor!`);
            return false;
        }

        const cost = 20;
        if (emperor.gold < cost) {
            GameState.log(`Emperor ${emperor.name} cannot afford to launch a campaign (need ${cost} gold)`);
            return false;
        }

        emperor.gold -= cost;

        // Check for sabotage
        let failureChance = 0.30; // Base 30% failure
        emperor.effects.forEach(effect => {
            if (effect.type === 'campaign_sabotage') {
                failureChance += effect.value;
                // Remove the sabotage effect
                effect.duration = 0;
            }
        });

        const success = Math.random() > failureChance;

        if (success) {
            // Attempt to conquer the next province
            const conquered = GameState.attemptConquest();

            if (conquered) {
                emperor.popularSupport += 5;
                GameState.log(`Emperor ${emperor.name} gains +5 Popular Support!`);
                GameState.log(`Emperor must now distribute the new estates.`);
            } else {
                // Campaign successful but couldn't conquer (insufficient military)
                emperor.popularSupport += 2;
                gameState.state.militaryStrength += 5;
                GameState.log(`Campaign successful! Rome's military strengthened but no new territory conquered.`);
            }
        } else {
            emperor.popularSupport -= 5;
            gameState.state.militaryStrength -= 5;
            GameState.log(`Campaign failed! Emperor ${emperor.name} loses 5 Popular Support, -5 Military Strength.`);
        }

        return success;
    },

    distributeEstates(emperor, provinceId, distributions, gameState) {
        if (gameState.state.emperorId !== emperor.id) {
            GameState.log(`${emperor.name} is not the Emperor!`);
            return false;
        }

        const province = gameState.state.provinces.find(p => p.id === provinceId);
        if (!province) {
            GameState.log(`Province not found!`);
            return false;
        }

        const unownedEstates = province.estates.filter(e => e.ownerId === null);

        // Distribute estates according to distributions object
        // distributions = { playerId: count, ... }
        Object.keys(distributions).forEach(playerId => {
            const count = distributions[playerId];
            const player = GameState.getPlayer(parseInt(playerId));

            for (let i = 0; i < count && unownedEstates.length > 0; i++) {
                const estate = unownedEstates.pop();
                estate.ownerId = player.id;
                player.estates.push(estate);
            }

            GameState.log(`Emperor ${emperor.name} granted ${count} estates to ${player.name}`);
        });

        return true;
    },

    influenceCounter(emperor, direction, gameState) {
        if (gameState.state.emperorId !== emperor.id) {
            GameState.log(`${emperor.name} is not the Emperor!`);
            return false;
        }

        const cost = 15;
        if (emperor.gold < cost) {
            GameState.log(`Emperor ${emperor.name} cannot afford to influence the counter (need ${cost} gold)`);
            return false;
        }

        emperor.gold -= cost;

        if (direction === 'up') {
            gameState.state.counter = Math.min(100, gameState.state.counter + 3);
            emperor.auctoritas += 2;
            emperor.popularSupport -= 2;
            GameState.log(`Emperor ${emperor.name} promoted virtuous institutions! Counter moved toward virtue.`);
        } else {
            gameState.state.counter = Math.max(1, gameState.state.counter - 3);
            emperor.popularSupport += 2;
            emperor.auctoritas -= 1;
            GameState.log(`Emperor ${emperor.name} enacted populist reforms! Counter moved toward popularity.`);
        }

        return true;
    },

    // Phase 5: End of Turn
    endTurn(player, gameState) {
        // Age the paterfamilias
        let ageIncrease = 1;

        // Check for accelerated aging (poison)
        player.effects.forEach(effect => {
            if (effect.type === 'accelerated_aging') {
                ageIncrease += effect.value;
            }
        });

        player.paterfamilias.age += ageIncrease;

        // Age family and check for births
        Player.ageFamily(player);

        // Check for death
        if (Player.checkDeath(player)) {
            Player.handleDeath(player, gameState);
        }

        // Update effects
        Player.updateEffects(player);

        // Military decay (1 point per turn if we're the last player of the round)
        if (gameState.state.currentPlayerIndex === gameState.state.players.length - 1) {
            gameState.state.militaryStrength = Math.max(0, gameState.state.militaryStrength - 1);

            // Check for revolts due to weak military
            GameState.checkForRevolts();
        }

        // Check if player can become first Emperor
        if (gameState.state.emperorId === null && GameState.checkImperialThreshold(player.auctoritas)) {
            if (player.auctoritas === Math.max(...gameState.state.players.map(p => p.auctoritas))) {
                gameState.state.emperorId = player.id;
                gameState.state.dynastyCounter.familyId = player.id;
                gameState.state.dynastyCounter.count = 1;
                GameState.log(`${player.name} has crossed the imperial threshold and becomes the First Emperor!`);
                GameState.log(`Dynasty counter: ${player.name} - 1 successive emperor`);
            }
        }
    }
};
