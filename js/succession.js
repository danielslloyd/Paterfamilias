// Imperial Succession, Dynasty Tracking, and Coups
const Succession = {
    // Trigger succession when the Emperor dies or is deposed.
    // reason: 'death' | 'coup' | 'assassination' | 'acclamation'
    triggerSuccession(gameState, reason) {
        GameState.log('═══ IMPERIAL SUCCESSION ═══');

        const weights = GameState.getCounterWeights();
        const dynastyFamilyId = gameState.state.dynastyCounter.familyId;
        const scores = [];

        gameState.state.players.forEach(player => {
            let score = Player.calculateSuccessionScore(player, weights);
            const isDynasty = dynastyFamilyId === player.id;
            if (isDynasty) {
                score *= GameConfig.successionLegitimacyBonus;
            }
            const meetsThreshold = GameState.checkImperialThreshold(player.auctoritas);
            scores.push({ player, score, meetsThreshold });
            GameState.log(`${player.name}: score ${score.toFixed(1)}${isDynasty ? ' (dynastic legitimacy ×' + GameConfig.successionLegitimacyBonus + ')' : ''} — threshold ${meetsThreshold ? 'met' : 'NOT met'}`);
        });

        // Every succession shakes the empire
        const penalty = GameConfig.successionMilitaryPenalty;
        gameState.state.militaryStrength = Math.max(0, gameState.state.militaryStrength - penalty);
        GameState.log(`The legions stir uneasily during the transition (-${penalty} military strength).`);

        const validCandidates = scores.filter(s => s.meetsThreshold).sort((a, b) => b.score - a.score);

        if (validCandidates.length === 0) {
            // Interregnum: no one can claim the throne
            gameState.state.emperorId = null;
            gameState.state.dynastyCounter.familyId = null;
            gameState.state.dynastyCounter.count = 0;
            gameState.state.militaryStrength = Math.max(0, gameState.state.militaryStrength - (GameConfig.interregnumMilitaryPenalty - penalty));
            gameState.state.players.forEach(p => {
                p.popularSupport = Math.max(0, p.popularSupport - GameConfig.interregnumSupportPenalty);
            });
            GameState.log(`⚠️ INTERREGNUM! No family can claim the purple. The Republic is restored amid chaos — all lose ${GameConfig.interregnumSupportPenalty} Support, the legions fray.`);
            GameState.log('═══ SUCCESSION COMPLETE ═══');
            return null;
        }

        const winner = validCandidates[0].player;

        if (gameState.state.dynastyCounter.familyId === winner.id) {
            gameState.state.dynastyCounter.count++;
            GameState.log(`👑 The ${winner.name} dynasty continues! ${gameState.state.dynastyCounter.count} successive emperor(s).`);
        } else {
            gameState.state.dynastyCounter.familyId = winner.id;
            gameState.state.dynastyCounter.count = 1;
            GameState.log(`👑 A new dynasty: the ${winner.name} claim the purple. The old dynasty is broken.`);
        }

        gameState.state.emperorId = winner.id;
        GameState.log(`${winner.paterfamilias.name} of the ${winner.name} is Emperor of Rome!`);
        GameState.log('═══ SUCCESSION COMPLETE ═══');

        const winnerCheck = GameState.checkWinCondition();
        if (winnerCheck) {
            this.handleVictory(winnerCheck, gameState);
        }

        return winner;
    },

    // Kin families suffer when their emperor falls violently (tied fates)
    applyKinFallPenalty(gameState, fallenEmperor, exclude) {
        gameState.state.players.forEach(p => {
            if (p.id === fallenEmperor.id) return;
            if (exclude && p.id === exclude.id) return;
            if (GameState.areKin(p, fallenEmperor)) {
                p.popularSupport = Math.max(0, p.popularSupport - GameConfig.kinEmperorFallPenalty);
                GameState.log(`The ${p.name}, kin to the fallen Emperor, are tainted by his fall (-${GameConfig.kinEmperorFallPenalty} Support).`);
            }
        });
    },

    handleVictory(winner, gameState) {
        GameState.log('════════════════════════════════');
        GameState.log(`🏛️ GAME OVER — THE ${winner.name.toUpperCase()} WIN! 🏛️`);
        GameState.log(`${GameConfig.dynastyWinThreshold} successive emperors: a dynasty is founded that will rule for generations.`);
        GameState.log('Final standings:');
        gameState.state.players.forEach((player, idx) => {
            GameState.log(`${idx + 1}. ${player.name}: ${player.gold}g, ${player.estates.length} estates, ${player.popularSupport} Support, ${player.auctoritas} Auctoritas`);
        });
        gameState.state.phase = 'game_over';
    },

    // --- Coups --------------------------------------------------------------

    // Unseating an entrenched dynasty costs more
    getCoupCost(gameState) {
        return GameConfig.coup.cost +
               GameConfig.coup.costPerDynastyCount * Math.max(0, gameState.state.dynastyCounter.count - 1);
    },

    // Numbers shown to the plotter before committing
    getCoupOdds(plotter, gameState) {
        const emperor = GameState.getEmperor();
        if (!emperor) return null;
        const cfg = GameConfig.coup;

        let attack = plotter.auctoritas + Math.floor(plotter.popularSupport / 2) + cfg.attackBase;
        if (Player.femaleTraitCount(plotter, 'Scheming') > 0) attack += cfg.schemingBonus;

        let defense = emperor.popularSupport + Math.floor(emperor.auctoritas / 2) + Math.floor(emperor.gold / 5);
        if (Player.femaleTraitCount(emperor, 'Influential') > 0) defense += cfg.influentialDefense;
        emperor.effects.forEach(e => { if (e.type === 'coup_defense') defense += e.value; });

        // Kin rally to the emperor - the marriage web is his shield
        let kinDefenders = [];
        gameState.state.players.forEach(p => {
            if (p.id === emperor.id || p.id === plotter.id) return;
            if (GameState.areKin(p, emperor)) {
                defense += cfg.kinDefenseBonus;
                kinDefenders.push(p.name);
            }
        });

        const chance = Math.min(cfg.chanceMax, Math.max(cfg.chanceMin,
            cfg.chanceBase + (attack - defense) * cfg.chancePerPoint));

        return { attack, defense, chance, kinDefenders, againstKin: GameState.areKin(plotter, emperor) };
    },

    attemptCoup(plotter, gameState) {
        const emperor = GameState.getEmperor();
        if (!emperor) {
            GameState.log('There is no Emperor to overthrow!');
            return false;
        }
        if (plotter.id === emperor.id) {
            GameState.log('The Emperor cannot plot against himself!');
            return false;
        }

        const cfg = GameConfig.coup;
        const cost = this.getCoupCost(gameState);
        if (plotter.gold < cost) {
            GameState.log(`The ${plotter.name} cannot afford a coup (need ${cost} gold).`);
            return false;
        }

        const odds = this.getCoupOdds(plotter, gameState);
        plotter.gold -= cost;

        GameState.log('═══ COUP ATTEMPT ═══');
        GameState.log(`The ${plotter.name} move against Emperor ${emperor.paterfamilias.name}!`);
        if (odds.kinDefenders.length > 0) {
            GameState.log(`The Emperor's kin rally to him: ${odds.kinDefenders.join(', ')}.`);
        }

        // Plotting against your own kin is impious
        if (odds.againstKin) {
            Player.addResources(plotter, {
                auctoritas: -GameConfig.kinImpietyPenalty.auctoritas,
                popularSupport: -GameConfig.kinImpietyPenalty.popularSupport
            });
            GameState.log(`😱 Impiety! The ${plotter.name} plot against their own kin — -${GameConfig.kinImpietyPenalty.auctoritas} Auctoritas, -${GameConfig.kinImpietyPenalty.popularSupport} Support.`);
        }

        // Any coup attempt destabilizes the empire
        gameState.state.militaryStrength = Math.max(0, gameState.state.militaryStrength - cfg.militaryPenalty);
        GameState.log(`Soldiers turn on soldiers in the streets (-${cfg.militaryPenalty} military strength).`);

        const succeeded = Math.random() < odds.chance;

        if (!succeeded) {
            GameState.log(`The coup fails! Emperor ${emperor.paterfamilias.name} survives.`);
            GameState.log(`${plotter.paterfamilias.name} is executed for treason!`);

            plotter.gold = Math.max(0, plotter.gold - cfg.failurePenalty.gold);
            plotter.auctoritas = Math.max(0, plotter.auctoritas - cfg.failurePenalty.auctoritas);
            emperor.popularSupport += cfg.survivalSupportBonus;

            Player.handleDeath(plotter, gameState);
            GameState.log('═══ COUP FAILED ═══');
            return false;
        }

        GameState.log(`⚔️ The coup succeeds! Emperor ${emperor.paterfamilias.name} is overthrown and slain!`);
        this.applyKinFallPenalty(gameState, emperor, plotter);

        // handleDeath triggers succession since the victim held the throne.
        // The plotter is NOT guaranteed the purple — the succession formula decides.
        Player.handleDeath(emperor, gameState);
        GameState.log('═══ COUP COMPLETE ═══');
        return true;
    },

    checkDynastyProgress(gameState) {
        if (gameState.state.dynastyCounter.count === GameConfig.dynastyWinThreshold - 1) {
            const leadingFamily = GameState.getPlayer(gameState.state.dynastyCounter.familyId);
            GameState.log(`⚠️ The ${leadingFamily.name} have ${gameState.state.dynastyCounter.count} successive emperors — ONE MORE WINS THE GAME!`);
        }
    }
};
