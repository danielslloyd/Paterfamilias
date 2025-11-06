// Core Turn Actions
const Actions = {
    // Phase 1: Income & Obligations
    processIncome(player, gameState) {
        const income = Player.calculateEstateIncome(player);
        player.accumulatedIncome += income;

        // Apply trade monopoly bonuses to accumulated income
        player.effects.forEach(effect => {
            if (effect.type === 'trade_monopoly') {
                player.accumulatedIncome += effect.value;
            }
        });

        // Apply per-turn bonuses from effects
        player.effects.forEach(effect => {
            if (effect.type === 'per_turn_bonus') {
                if (effect.auctoritas) player.auctoritas += effect.auctoritas;
                if (effect.popularSupport) player.popularSupport += effect.popularSupport;
            }
        });

        GameState.log(`${player.name} earned ${income} gold from estates (accumulated: ${player.accumulatedIncome})`);

        // Check if accumulated income reaches threshold for distribution
        if (player.accumulatedIncome >= GameConfig.incomeAccumulationThreshold) {
            this.distributeIncome(player, gameState);
        }

        // Apply trait effects
        Player.applyTraitEffects(player);
    },

    // Distribute accumulated income
    distributeIncome(player, gameState) {
        const totalIncome = player.accumulatedIncome;
        let remaining = totalIncome;

        // 1. Emperor gets tax
        if (gameState.state.emperorId !== null && gameState.state.emperorId !== player.id) {
            const emperor = GameState.getEmperor();
            const taxAmount = Math.floor(totalIncome * gameState.state.taxRate);
            emperor.gold += taxAmount;
            remaining -= taxAmount;
            GameState.log(`${player.name} paid ${taxAmount} gold in taxes to ${emperor.name}`);
        }

        // 2. Mother's family gets tribute
        if (player.mother && remaining > 0) {
            const motherPlayer = GameState.getPlayer(player.mother.fromFamily);
            const tributeAmount = Math.floor(totalIncome * player.tributeRates.toMother);
            const actualTribute = Math.min(tributeAmount, remaining);
            motherPlayer.gold += actualTribute;
            remaining -= actualTribute;
            GameState.log(`${player.name} paid ${actualTribute} gold tribute to ${motherPlayer.name} (mother's family)`);
        }

        // 3. Wife's family gets tribute
        if (player.wife && remaining > 0) {
            const wifePlayer = GameState.getPlayer(player.wife.fromFamily);
            const tributeAmount = Math.floor(totalIncome * player.tributeRates.toWife);
            const actualTribute = Math.min(tributeAmount, remaining);
            wifePlayer.gold += actualTribute;
            remaining -= actualTribute;
            GameState.log(`${player.name} paid ${actualTribute} gold tribute to ${wifePlayer.name} (wife's family)`);
        }

        // 4. Player keeps what's left
        if (remaining > 0) {
            player.gold += remaining;
            GameState.log(`${player.name} received ${remaining} gold`);
        }

        // Reset accumulated income
        player.accumulatedIncome = 0;
    },

    // Tax penalty for emperor (each 10% of tax decreases popular support by 1 every turn)
    applyTaxPenalty(gameState) {
        if (gameState.state.emperorId === null) {
            return; // No taxes during Republic
        }

        const emperor = GameState.getEmperor();
        const taxIncrements = Math.floor(gameState.state.taxRate / GameConfig.taxRateIncrement);
        const penalty = taxIncrements * GameConfig.taxPopularSupportPenaltyPerIncrement;

        if (penalty > 0) {
            emperor.popularSupport = Math.max(0, emperor.popularSupport - penalty);
            GameState.log(`Emperor ${emperor.name} loses ${penalty} popular support due to ${Math.floor(gameState.state.taxRate * 100)}% tax rate`);
        }
    },

    // Apply unmarried penalty
    applyUnmarriedPenalty(player) {
        if (!player.wife) {
            player.popularSupport = Math.max(0, player.popularSupport - GameConfig.unmarriedPenaltyPerTurn);
            GameState.log(`${player.name} suffers unmarried penalty: -${GameConfig.unmarriedPenaltyPerTurn} Popular Support`);
        }
    },

    // Phase 2: Core Actions
    contributeToMilitary(player) {
        if (player.actionTaken) {
            GameState.log(`${player.name} has already taken an action this turn!`);
            return false;
        }

        const cost = GameConfig.militaryContributionCost;
        if (player.gold < cost) {
            GameState.log(`${player.name} cannot afford to contribute to military (need ${cost} gold)`);
            return false;
        }

        player.gold -= cost;
        player.auctoritas += GameConfig.militaryContributionAuctoritas;
        player.popularSupport += GameConfig.militaryContributionPopularSupport;
        GameState.state.militaryStrength += GameConfig.militaryContributionStrength;
        player.actionTaken = true;

        GameState.log(`${player.name} contributed to Rome's military! +${GameConfig.militaryContributionAuctoritas} Auctoritas, +${GameConfig.militaryContributionPopularSupport} Popular Support, +${GameConfig.militaryContributionStrength} Military Strength`);
        return true;
    },

    economicDevelopment(player) {
        if (player.actionTaken) {
            GameState.log(`${player.name} has already taken an action this turn!`);
            return false;
        }

        const cost = GameConfig.economicDevelopmentCost;
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
        randomEstate.yield += GameConfig.estateYieldImprovement;

        player.actionTaken = true;

        GameState.log(`${player.name} developed an estate! Permanent income increased by ${GameConfig.estateYieldImprovement}.`);
        return true;
    },

    politicalManeuvering(player) {
        if (player.actionTaken) {
            GameState.log(`${player.name} has already taken an action this turn!`);
            return false;
        }

        const cost = GameConfig.politicalManeuveringCost;
        if (player.gold < cost) {
            GameState.log(`${player.name} cannot afford political maneuvering (need ${cost} gold)`);
            return false;
        }

        player.gold -= cost;
        player.auctoritas += GameConfig.politicalManeuveringAuctoritas;
        player.actionTaken = true;

        GameState.log(`${player.name} engaged in political maneuvering! +${GameConfig.politicalManeuveringAuctoritas} Auctoritas`);
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

        // Round to nearest increment (10%)
        newRate = Math.round(newRate / GameConfig.taxRateIncrement) * GameConfig.taxRateIncrement;

        // Clamp to valid range
        newRate = Math.max(GameConfig.minTaxRate, Math.min(GameConfig.maxTaxRate, newRate));

        const oldRate = gameState.state.taxRate;

        if (newRate === oldRate) {
            GameState.log(`Tax rate unchanged at ${Math.floor(newRate * 100)}%`);
            return true;
        }

        gameState.state.taxRate = newRate;

        // Adjust popularity based on tax change (immediate one-time effect)
        if (newRate > oldRate) {
            const penalty = Math.floor((newRate - oldRate) * GameConfig.taxIncreasePopularSupportPenalty);
            emperor.popularSupport -= penalty;
            GameState.log(`Emperor ${emperor.name} raised taxes to ${Math.floor(newRate * 100)}%! Popular support decreased by ${penalty}.`);
        } else if (newRate < oldRate) {
            const bonus = Math.floor((oldRate - newRate) * GameConfig.taxDecreasePopularSupportBonus);
            emperor.popularSupport += bonus;
            GameState.log(`Emperor ${emperor.name} lowered taxes to ${Math.floor(newRate * 100)}%! Popular support increased by ${bonus}.`);
        }

        return true;
    },

    launchCampaign(emperor, gameState) {
        if (gameState.state.emperorId !== emperor.id) {
            GameState.log(`${emperor.name} is not the Emperor!`);
            return false;
        }

        const cost = GameConfig.campaignCost;
        if (emperor.gold < cost) {
            GameState.log(`Emperor ${emperor.name} cannot afford to launch a campaign (need ${cost} gold)`);
            return false;
        }

        emperor.gold -= cost;

        // Check for sabotage
        let failureChance = GameConfig.campaignBaseFailureChance;
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
                emperor.popularSupport += GameConfig.campaignSuccessPopularSupport;
                GameState.log(`Emperor ${emperor.name} gains +${GameConfig.campaignSuccessPopularSupport} Popular Support!`);
                GameState.log(`Emperor must now distribute the new estates.`);
            } else {
                // Campaign successful but couldn't conquer (insufficient military)
                emperor.popularSupport += GameConfig.campaignPartialSuccessPopularSupport;
                gameState.state.militaryStrength += GameConfig.campaignPartialSuccessStrength;
                GameState.log(`Campaign successful! Rome's military strengthened but no new territory conquered.`);
            }
        } else {
            emperor.popularSupport += GameConfig.campaignFailurePopularSupport; // This is negative
            gameState.state.militaryStrength += GameConfig.campaignFailureStrength; // This is negative
            GameState.log(`Campaign failed! Emperor ${emperor.name} loses ${-GameConfig.campaignFailurePopularSupport} Popular Support, ${-GameConfig.campaignFailureStrength} Military Strength.`);
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

        const cost = GameConfig.counterInfluenceCost;
        if (emperor.gold < cost) {
            GameState.log(`Emperor ${emperor.name} cannot afford to influence the counter (need ${cost} gold)`);
            return false;
        }

        emperor.gold -= cost;

        if (direction === 'up') {
            gameState.state.counter = Math.min(GameConfig.counterMaximum, gameState.state.counter + GameConfig.counterInfluenceShift);
            emperor.auctoritas += GameConfig.counterInfluenceVirtueBonus;
            emperor.popularSupport -= GameConfig.counterInfluencePopularityBonus;
            GameState.log(`Emperor ${emperor.name} promoted virtuous institutions! Counter moved toward virtue.`);
        } else {
            gameState.state.counter = Math.max(1, gameState.state.counter - GameConfig.counterInfluenceShift);
            emperor.popularSupport += GameConfig.counterInfluencePopularityBonus;
            emperor.auctoritas -= 1;
            GameState.log(`Emperor ${emperor.name} enacted populist reforms! Counter moved toward popularity.`);
        }

        return true;
    },

    // Phase 5: End of Turn
    endTurn(player, gameState) {
        // Increment turns as paterfamilias
        player.paterfamilias.turnsAsPaterfamilias++;

        // Age family and check for births
        Player.ageFamily(player);

        // Check for death
        if (Player.checkDeath(player)) {
            Player.handleDeath(player, gameState);
        }

        // Apply unmarried penalty
        this.applyUnmarriedPenalty(player);

        // Update effects
        Player.updateEffects(player);

        // Military decay and tax penalties (once per round - last player)
        if (gameState.state.currentPlayerIndex === gameState.state.players.length - 1) {
            gameState.state.militaryStrength = Math.max(0, gameState.state.militaryStrength - GameConfig.militaryDecayPerTurn);

            // Check for revolts due to weak military
            GameState.checkForRevolts();

            // Apply emperor tax penalty (once per turn)
            this.applyTaxPenalty(gameState);
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
