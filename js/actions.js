// Core Turn Actions
const Actions = {
    // --- Phase 1: Income & Obligations -------------------------------------
    // Income flows every turn: estates yield gold, then the web takes its
    // share — Emperor's tax, mother's family, wife's family — before the
    // player keeps the rest.
    processIncome(player, gameState) {
        const income = Player.calculateEstateIncome(player);
        let remaining = income;
        const parts = [];

        // 1. Emperor's tax
        if (income > 0 && gameState.state.emperorId !== null && gameState.state.emperorId !== player.id) {
            const emperor = GameState.getEmperor();
            let taxAmount = Math.floor(income * gameState.state.taxRate);
            if (taxAmount > 0) {
                emperor.gold += taxAmount;
                remaining -= taxAmount;
                parts.push(`${taxAmount}g tax to Emperor ${emperor.paterfamilias.name}`);

                // Tax Farm: recover half of the payment
                const refundEffect = player.effects.find(e => e.type === 'tax_refund');
                if (refundEffect) {
                    const refund = Math.floor(taxAmount * refundEffect.value);
                    if (refund > 0) {
                        player.gold += refund;
                        parts.push(`${refund}g recovered via tax farm`);
                    }
                    player.effects = player.effects.filter(e => e !== refundEffect);
                }
            }
        }

        // 2. Tribute to mother's family
        remaining -= this.payTribute(player, player.mother, player.tributeRates.toMother, income, remaining, 'mother', parts, gameState);

        // 3. Tribute to wife's family
        const holiday = player.effects.some(e => e.type === 'tribute_holiday');
        if (!holiday) {
            remaining -= this.payTribute(player, player.wife, player.tributeRates.toWife, income, remaining, 'wife', parts, gameState);
        } else if (player.wife) {
            parts.push('wife-tribute withheld (dowry dispute)');
        }

        // 4. Player keeps the rest
        if (remaining > 0) {
            player.gold += remaining;
        }

        if (income > 0) {
            const detail = parts.length > 0 ? ` (${parts.join('; ')})` : '';
            GameState.log(`💰 The ${player.name} earn ${income}g from estates, keeping ${Math.max(0, remaining)}g${detail}.`);
        } else if (player.estates.length === 0) {
            GameState.log(`The ${player.name} hold no estates — no income this turn.`);
        }

        // Per-turn gold effects (trade monopolies etc.)
        player.effects.forEach(effect => {
            if (effect.type === 'per_turn_gold') {
                player.gold += effect.value;
                GameState.log(`💰 ${effect.name}: +${effect.value}g to the ${player.name}.`);
            }
        });

        // Per-turn stat bonuses from effects (tribunes, alliances)
        player.effects.forEach(effect => {
            if (effect.type === 'per_turn_bonus') {
                if (effect.auctoritas) player.auctoritas += effect.auctoritas;
                if (effect.popularSupport) player.popularSupport += effect.popularSupport;
            }
        });

        // Basking in imperial glory: kin of the reigning Emperor gain standing
        const emperor = GameState.getEmperor();
        if (emperor && emperor.id !== player.id && GameState.areKin(player, emperor)) {
            player.popularSupport += GameConfig.kinEmperorSupportPerTurn;
            GameState.log(`👑 As kin of the Emperor, the ${player.name} gain +${GameConfig.kinEmperorSupportPerTurn} Support.`);
        }

        // Household trait effects (the women earn their keep)
        Player.applyTraitEffects(player);
    },

    // Pay one tribute obligation. Returns gold actually paid.
    payTribute(player, relation, rate, income, remaining, label, parts, gameState) {
        if (!relation || rate <= 0 || income <= 0 || remaining <= 0) return 0;
        const recipient = GameState.getPlayer(relation.fromFamily);
        if (!recipient) return 0;

        // Tribute is a real obligation: at least 1 gold flows if any is owed
        let amount = Math.max(GameConfig.tributeMinimum, Math.floor(income * rate));
        amount = Math.min(amount, remaining);
        if (amount <= 0) return 0;

        recipient.gold += amount;
        parts.push(`${amount}g to the ${recipient.name} (${label} ${relation.name})`);
        return amount;
    },

    // Emperor's standing tax burden (once per round)
    applyTaxPenalty(gameState) {
        if (gameState.state.emperorId === null) return;
        const emperor = GameState.getEmperor();
        const taxIncrements = Math.round(gameState.state.taxRate / GameConfig.taxRateIncrement);
        const penalty = taxIncrements * GameConfig.taxPopularSupportPenaltyPerIncrement;
        if (penalty > 0) {
            emperor.popularSupport = Math.max(0, emperor.popularSupport - penalty);
            GameState.log(`Emperor ${emperor.paterfamilias.name} bears the resentment of ${Math.round(gameState.state.taxRate * 100)}% taxes (-${penalty} Support).`);
        }
    },

    applyUnmarriedPenalty(player) {
        if (!player.wife) {
            player.popularSupport = Math.max(0, player.popularSupport - GameConfig.unmarriedPenaltyPerTurn);
            GameState.log(`The ${player.name} paterfamilias remains unmarried — Rome disapproves (-${GameConfig.unmarriedPenaltyPerTurn} Support).`);
        }
    },

    // --- Phase 2: Core Actions ----------------------------------------------
    contributeToMilitary(player) {
        if (player.actionTaken) return this.alreadyActed(player);
        const cost = GameConfig.militaryContributionCost;
        if (player.gold < cost) {
            GameState.log(`Need ${cost} gold to contribute to the military.`);
            return false;
        }

        player.gold -= cost;
        player.auctoritas += GameConfig.militaryContributionAuctoritas;
        player.popularSupport += GameConfig.militaryContributionPopularSupport;

        let strength = GameConfig.militaryContributionStrength;
        if (Player.hasPaterTrait(player, 'Military Prowess')) {
            strength += GameConfig.militaryProwessContributionBonus;
        }
        GameState.state.militaryStrength += strength;
        player.actionTaken = true;

        GameState.log(`🛡️ The ${player.name} contribute to Rome's legions: +${GameConfig.militaryContributionAuctoritas} Auctoritas, +${GameConfig.militaryContributionPopularSupport} Support, military +${strength}.`);
        return true;
    },

    economicDevelopment(player) {
        if (player.actionTaken) return this.alreadyActed(player);
        const cost = GameConfig.economicDevelopmentCost;
        if (player.gold < cost) {
            GameState.log(`Need ${cost} gold for economic development.`);
            return false;
        }
        if (player.estates.length === 0) {
            GameState.log(`The ${player.name} have no estates to develop!`);
            return false;
        }

        player.gold -= cost;
        const estate = [...player.estates].sort((a, b) => a.yield - b.yield)[0];
        estate.yield += GameConfig.estateYieldImprovement;
        player.actionTaken = true;

        GameState.log(`💰 The ${player.name} develop an estate: +${GameConfig.estateYieldImprovement} gold per turn, permanent.`);
        return true;
    },

    politicalManeuvering(player) {
        if (player.actionTaken) return this.alreadyActed(player);
        const cost = GameConfig.politicalManeuveringCost;
        if (player.gold < cost) {
            GameState.log(`Need ${cost} gold for political maneuvering.`);
            return false;
        }

        player.gold -= cost;
        player.auctoritas += GameConfig.politicalManeuveringAuctoritas;
        player.actionTaken = true;

        GameState.log(`🏛️ The ${player.name} work the Senate: +${GameConfig.politicalManeuveringAuctoritas} Auctoritas.`);
        return true;
    },

    // Declare yourself the first Emperor (Republic only, threshold met)
    declareEmperor(player, gameState) {
        if (gameState.state.emperorId !== null) {
            GameState.log('Rome already has an Emperor!');
            return false;
        }
        if (!GameState.checkImperialThreshold(player.auctoritas)) {
            GameState.log(`The ${player.name} lack the Auctoritas to claim the purple (need ${GameState.getImperialThreshold()}).`);
            return false;
        }

        gameState.state.emperorId = player.id;
        gameState.state.dynastyCounter.familyId = player.id;
        gameState.state.dynastyCounter.count = 1;
        player.popularSupport += 2;

        GameState.log('════════════════════════════════');
        GameState.log(`👑 ${player.paterfamilias.name} of the ${player.name} declares himself the FIRST EMPEROR OF ROME!`);
        GameState.log(`The Republic is dead. Dynasty count: 1 of ${GameConfig.dynastyWinThreshold}.`);
        GameState.log('════════════════════════════════');
        return true;
    },

    // Plot a coup (a core action; Empire only)
    plotCoup(player, gameState) {
        if (player.actionTaken) return this.alreadyActed(player);
        const result = Succession.attemptCoup(player, gameState);
        player.actionTaken = true;
        return result;
    },

    alreadyActed(player) {
        GameState.log(`The ${player.name} have already taken their action this turn.`);
        return false;
    },

    // --- Phase 3: Card Actions ----------------------------------------------
    playCard(player, cardIndex, targetPlayer, gameState) {
        if (player.cardPlayed) {
            GameState.log(`The ${player.name} have already played a card this turn.`);
            return false;
        }
        if (cardIndex < 0 || cardIndex >= player.hand.length) return false;

        const card = player.hand[cardIndex];
        const cost = Player.getCardCost(player, card);

        if (!Player.canAfford(player, cost)) {
            GameState.log(`Cannot afford to play ${card.name}.`);
            return false;
        }

        Player.payCost(player, cost);

        // Effects may refuse (illegal target etc.) - refund and keep the card
        const result = card.effect ? card.effect(player, targetPlayer, gameState) : true;
        if (result === false) {
            Player.addResources(player, cost);
            return false;
        }

        player.hand.splice(cardIndex, 1);
        gameState.state.discardPile.push(card);
        player.cardPlayed = true;
        return true;
    },

    discardCard(player, cardIndex, gameState) {
        if (cardIndex < 0 || cardIndex >= player.hand.length) return false;
        const card = player.hand[cardIndex];
        player.hand.splice(cardIndex, 1);
        gameState.state.discardPile.push(card);
        GameState.log(`The ${player.name} discard ${card.name}.`);
        return true;
    },

    drawCards(player, count) {
        for (let i = 0; i < count; i++) {
            GameState.drawCard(player.id);
        }
    },

    readOmens(player, gameState) {
        const result = GameState.readOmens(player.id);
        if (!result.success) {
            GameState.log(result.message);
            return false;
        }
        return true;
    },

    // --- Phase 4: Imperial Actions --------------------------------------------
    setTaxRate(emperor, newRate, gameState) {
        if (gameState.state.emperorId !== emperor.id) return false;

        newRate = Math.round(newRate / GameConfig.taxRateIncrement) * GameConfig.taxRateIncrement;
        newRate = Math.max(GameConfig.minTaxRate, Math.min(GameConfig.maxTaxRate, newRate));
        const oldRate = gameState.state.taxRate;
        if (Math.abs(newRate - oldRate) < 0.001) return true;

        gameState.state.taxRate = newRate;

        if (newRate > oldRate) {
            const penalty = Math.round((newRate - oldRate) * GameConfig.taxIncreasePopularSupportPenalty);
            emperor.popularSupport = Math.max(0, emperor.popularSupport - penalty);
            GameState.log(`👑 Emperor ${emperor.paterfamilias.name} raises taxes to ${Math.round(newRate * 100)}% (-${penalty} Support).`);
        } else {
            const bonus = Math.round((oldRate - newRate) * GameConfig.taxDecreasePopularSupportBonus);
            emperor.popularSupport += bonus;
            GameState.log(`👑 Emperor ${emperor.paterfamilias.name} lowers taxes to ${Math.round(newRate * 100)}% (+${bonus} Support).`);
        }
        return true;
    },

    launchCampaign(emperor, gameState) {
        if (gameState.state.emperorId !== emperor.id) return false;

        const cost = GameConfig.campaignCost;
        if (emperor.gold < cost) {
            GameState.log(`A campaign requires ${cost} gold.`);
            return false;
        }

        const target = gameState.state.provinces.find(p => !p.conquered);
        if (!target) {
            GameState.log('The whole world already bows to Rome!');
            return false;
        }

        emperor.gold -= cost;

        let failureChance = GameConfig.campaignBaseFailureChance;
        if (Player.hasPaterTrait(emperor, 'Military Prowess')) {
            failureChance -= GameConfig.militaryProwessCampaignBonus;
        }
        // Consume sabotage
        const sabotage = emperor.effects.find(e => e.type === 'campaign_sabotage');
        if (sabotage) {
            failureChance += sabotage.value;
            emperor.effects = emperor.effects.filter(e => e !== sabotage);
            GameState.log(`Saboteurs dog the campaign preparations...`);
        }

        const success = Math.random() > failureChance;

        if (success) {
            const conquered = GameState.attemptConquest();
            if (conquered) {
                emperor.popularSupport += GameConfig.campaignSuccessPopularSupport;
                GameState.log(`👑 Emperor ${emperor.paterfamilias.name} triumphs (+${GameConfig.campaignSuccessPopularSupport} Support)! The new estates await distribution.`);
            } else {
                emperor.popularSupport += GameConfig.campaignPartialSuccessPopularSupport;
                gameState.state.militaryStrength += GameConfig.campaignPartialSuccessStrength;
                GameState.log(`The campaign succeeds in the field but the legions are too thin to hold ${target.name}. Military +${GameConfig.campaignPartialSuccessStrength}, +${GameConfig.campaignPartialSuccessPopularSupport} Support.`);
            }
        } else {
            emperor.popularSupport = Math.max(0, emperor.popularSupport + GameConfig.campaignFailurePopularSupport);
            gameState.state.militaryStrength = Math.max(0, gameState.state.militaryStrength + GameConfig.campaignFailureStrength);
            GameState.log(`⚠️ The campaign against ${target.name} fails! ${-GameConfig.campaignFailurePopularSupport} Support and ${-GameConfig.campaignFailureStrength} military lost.`);
        }
        return success;
    },

    distributeEstates(emperor, provinceId, distributions, gameState) {
        if (gameState.state.emperorId !== emperor.id) return false;

        const province = gameState.state.provinces.find(p => p.id === provinceId);
        if (!province) return false;

        const unownedEstates = province.estates.filter(e => e.ownerId === null);
        let granted = 0;

        Object.keys(distributions).forEach(playerId => {
            const count = distributions[playerId];
            if (count <= 0) return;
            const player = GameState.getPlayer(parseInt(playerId));
            let given = 0;
            for (let i = 0; i < count && unownedEstates.length > 0; i++) {
                const estate = unownedEstates.pop();
                estate.ownerId = player.id;
                player.estates.push(estate);
                given++;
                granted++;
            }
            if (given > 0) {
                GameState.log(`👑 Emperor ${emperor.paterfamilias.name} grants ${given} estate(s) in ${province.name} to the ${player.name}.`);
            }
        });
        return granted > 0;
    },

    influenceCounter(emperor, direction, gameState) {
        if (gameState.state.emperorId !== emperor.id) return false;

        const cost = GameConfig.counterInfluenceCost;
        if (emperor.gold < cost) {
            GameState.log(`Influencing Rome's institutions costs ${cost} gold.`);
            return false;
        }

        emperor.gold -= cost;

        if (direction === 'up') {
            gameState.state.counter = Math.min(GameConfig.counterMaximum, gameState.state.counter + GameConfig.counterInfluenceShift);
            emperor.auctoritas += GameConfig.counterInfluenceVirtueBonus;
            emperor.popularSupport = Math.max(0, emperor.popularSupport - GameConfig.counterInfluencePopularityBonus);
            GameState.log(`👑 The Emperor strengthens Rome's institutions — the counter shifts toward Virtue.`);
        } else {
            gameState.state.counter = Math.max(1, gameState.state.counter - GameConfig.counterInfluenceShift);
            emperor.popularSupport += GameConfig.counterInfluencePopularityBonus;
            emperor.auctoritas = Math.max(0, emperor.auctoritas - 1);
            GameState.log(`👑 The Emperor enacts populist reforms — the counter shifts toward Popularity.`);
        }
        return true;
    },

    // --- Phase 5: End of Turn ---------------------------------------------------
    endTurn(player, gameState) {
        // The paterfamilias ages - emperors age faster
        let aging = 1;
        if (gameState.state.emperorId === player.id) {
            aging += GameConfig.emperorExtraAging;
        }
        // Poison ages its victim
        const poisonEffects = player.effects.filter(e => e.type === 'accelerated_aging');
        poisonEffects.forEach(e => { aging += e.value; });
        player.effects = player.effects.filter(e => e.type !== 'accelerated_aging');

        player.paterfamilias.age += aging;
        if (aging > 1) {
            GameState.log(`${player.paterfamilias.name} ages ${aging} years this round${gameState.state.emperorId === player.id ? ' (the purple weighs heavy)' : ''}.`);
        }

        // Children age and births occur
        Player.ageFamily(player);

        // Death check
        if (Player.checkDeath(player)) {
            Player.handleDeath(player, gameState);
        }

        this.applyUnmarriedPenalty(player);
        Player.updateEffects(player);

        // Once per round (after the last player): empire upkeep
        if (gameState.state.currentPlayerIndex === gameState.state.players.length - 1) {
            const provinces = gameState.state.provinces.filter(p => p.conquered).length;
            const decay = GameConfig.militaryBaseDecayPerRound + Math.floor(provinces / GameConfig.militaryDecayPerProvincesHeld);
            gameState.state.militaryStrength = Math.max(0, gameState.state.militaryStrength - decay);

            GameState.checkForRevolts();
            this.applyTaxPenalty(gameState);
        }
    }
};
