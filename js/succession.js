// Imperial Succession Logic
const Succession = {
    // Trigger succession when Emperor dies or is deposed
    triggerSuccession(gameState) {
        GameState.log('=== IMPERIAL SUCCESSION BEGINS ===');

        const weights = GameState.getCounterWeights();
        const scores = [];

        // Calculate succession scores for all players
        gameState.state.players.forEach(player => {
            const score = Player.calculateSuccessionScore(player, weights);
            const meetsThreshold = GameState.checkImperialThreshold(player.auctoritas);

            scores.push({
                player: player,
                score: score,
                meetsThreshold: meetsThreshold
            });

            GameState.log(`${player.name}: Score = ${score.toFixed(2)} (${player.popularSupport} Pop × ${weights.popularity.toFixed(2)} + ${player.auctoritas} Virtue × ${weights.virtue.toFixed(2)}) - Threshold: ${meetsThreshold ? 'Yes' : 'No'}`);
        });

        // Filter candidates who meet threshold
        const validCandidates = scores.filter(s => s.meetsThreshold);

        if (validCandidates.length === 0) {
            // No one meets threshold - Republic is restored
            gameState.state.emperorId = null;
            gameState.state.dynastyCounter.familyId = null;
            gameState.state.dynastyCounter.count = 0;
            GameState.log('No candidate meets the imperial threshold! The Republic is restored.');
            GameState.log('=== SUCCESSION COMPLETE ===');
            return null;
        }

        // Sort by score descending
        validCandidates.sort((a, b) => b.score - a.score);

        const winner = validCandidates[0].player;
        const oldEmperorId = gameState.state.emperorId;

        // Check dynasty continuation
        if (gameState.state.dynastyCounter.familyId === winner.id) {
            // Same family - increment counter
            gameState.state.dynastyCounter.count++;
            GameState.log(`${winner.name} continues their dynasty! Successive emperors: ${gameState.state.dynastyCounter.count}`);
        } else {
            // Different family - reset counter
            gameState.state.dynastyCounter.familyId = winner.id;
            gameState.state.dynastyCounter.count = 1;
            GameState.log(`${winner.name} starts a new dynasty! Previous dynasty broken.`);
        }

        gameState.state.emperorId = winner.id;
        GameState.log(`${winner.name} becomes the new Emperor with a score of ${validCandidates[0].score.toFixed(2)}!`);
        GameState.log('=== SUCCESSION COMPLETE ===');

        // Check win condition
        const winnerCheck = GameState.checkWinCondition();
        if (winnerCheck) {
            this.handleVictory(winnerCheck, gameState);
        }

        return winner;
    },

    // Handle game victory
    handleVictory(winner, gameState) {
        GameState.log('');
        GameState.log('========================================');
        GameState.log(`🏛️ GAME OVER - ${winner.name.toUpperCase()} WINS! 🏛️`);
        GameState.log('========================================');
        GameState.log(`${winner.name} has established a dynasty with ${GameConfig.dynastyWinThreshold} successive emperors!`);
        GameState.log(`The ${winner.name} family will rule Rome for generations to come.`);
        GameState.log('');

        // Show final scores
        GameState.log('Final Standings:');
        gameState.state.players.forEach((player, idx) => {
            GameState.log(`${idx + 1}. ${player.name}: Gold ${player.gold}, Estates ${player.estates.length}, Support ${player.popularSupport}, Virtue ${player.auctoritas}`);
        });

        gameState.state.phase = 'game_over';
    },

    // Launch a coup attempt
    attemptCoup(plotter, gameState) {
        const emperor = GameState.getEmperor();

        if (!emperor) {
            GameState.log('There is no Emperor to overthrow!');
            return false;
        }

        if (plotter.id === emperor.id) {
            GameState.log('The Emperor cannot launch a coup against themselves!');
            return false;
        }

        const cost = GameConfig.coupCost;
        if (plotter.gold < cost) {
            GameState.log(`${plotter.name} cannot afford to launch a coup (need ${cost} gold)`);
            return false;
        }

        plotter.gold -= cost;

        GameState.log('=== COUP ATTEMPT ===');
        GameState.log(`${plotter.name} attempts to overthrow Emperor ${emperor.name}!`);

        // Stage 1: Does Emperor survive?
        const emperorDefense = emperor.popularSupport + (emperor.gold / 10);
        const plotterOffense = plotter.auctoritas + (plotter.gold / 10) + GameConfig.coupBonus;

        const emperorSurvives = emperorDefense > plotterOffense;

        if (emperorSurvives) {
            // Coup failed
            GameState.log(`The coup failed! Emperor ${emperor.name} survived.`);
            GameState.log(`${plotter.paterfamilias.name} is executed for treason!`);

            // Plotter's paterfamilias dies
            Player.handleDeath(plotter, gameState);

            plotter.gold = Math.max(0, plotter.gold - GameConfig.coupFailurePenalty.gold);
            plotter.auctoritas = Math.max(0, plotter.auctoritas - GameConfig.coupFailurePenalty.auctoritas);

            emperor.popularSupport += GameConfig.coupSurvivalPopularSupportBonus;

            GameState.log('=== COUP FAILED ===');
            return false;
        } else {
            // Coup succeeded - Emperor dies
            GameState.log(`The coup succeeded! Emperor ${emperor.name} is overthrown and killed!`);

            // Emperor dies
            Player.handleDeath(emperor, gameState);

            // Trigger succession (Emperor is already dead, so succession will choose new one)
            // Note: handleDeath already triggers succession if player was Emperor

            GameState.log('=== COUP SUCCEEDED ===');
            return true;
        }
    },

    // Check if any player is close to winning
    checkDynastyProgress(gameState) {
        if (gameState.state.dynastyCounter.count >= GameConfig.dynastyWinThreshold - 1) {
            const leadingFamily = GameState.getPlayer(gameState.state.dynastyCounter.familyId);
            GameState.log(`⚠️ WARNING: ${leadingFamily.name} has ${gameState.state.dynastyCounter.count} successive emperors! One more to win!`);
        }
    }
};
