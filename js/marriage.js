// Marriage Negotiation System
const Marriage = {
    // Check if marriage is valid
    isValidMarriage(player, targetFamily) {
        // Cannot marry own family
        if (player.id === targetFamily.id) {
            return { valid: false, reason: 'Cannot marry own family' };
        }

        // Cannot marry mother's family
        if (player.mother && player.mother.fromFamily === targetFamily.id) {
            return { valid: false, reason: 'Cannot marry mother\'s family' };
        }

        // Cannot marry wife's family (for remarriage check)
        if (player.wife && player.wife.fromFamily === targetFamily.id) {
            return { valid: false, reason: 'Already married to this family' };
        }

        // Player must be unmarried to marry
        if (player.wife) {
            return { valid: false, reason: 'Already married' };
        }

        return { valid: true };
    },

    // Get eligible families for marriage
    getEligibleFamilies(player, gameState) {
        const eligible = [];

        // Player must be unmarried
        if (player.wife) {
            return eligible;
        }

        gameState.state.players.forEach(targetPlayer => {
            const validation = this.isValidMarriage(player, targetPlayer);
            if (validation.valid) {
                // Get available daughters (unmarried daughters of marriageable age)
                const daughters = targetPlayer.children.filter(c =>
                    c.gender === 'female' && c.age >= GameConfig.minimumMarriageAge
                );

                if (daughters.length > 0) {
                    eligible.push({
                        player: targetPlayer,
                        daughters: daughters
                    });
                }
            }
        });

        return eligible;
    },

    // Propose marriage
    proposeMarriage(player, targetFamily, daughterIndex, tributeOffer, gameState) {
        const validation = this.isValidMarriage(player, targetFamily);
        if (!validation.valid) {
            GameState.log(`${player.name} cannot marry ${targetFamily.name}: ${validation.reason}`);
            return false;
        }

        const daughters = targetFamily.children.filter(c => c.gender === 'female' && c.age >= GameConfig.minimumMarriageAge);

        if (daughterIndex < 0 || daughterIndex >= daughters.length) {
            GameState.log(`Invalid daughter selection`);
            return false;
        }

        const daughter = daughters[daughterIndex];

        // Create marriage proposal object
        const proposal = {
            proposer: player,
            targetFamily: targetFamily,
            daughter: daughter,
            tributeRate: tributeOffer, // Proposed tribute rate to wife's family
            status: 'pending'
        };

        GameState.log(`${player.name} proposed marriage to ${daughter.name} of ${targetFamily.name}, offering ${Math.floor(tributeOffer * 100)}% tribute`);

        return proposal;
    },

    // Accept marriage proposal
    acceptMarriage(proposal, counterTributeRate, gameState) {
        const player = proposal.proposer;
        const targetFamily = proposal.targetFamily;
        const daughter = proposal.daughter;

        // Remove daughter from children and make her the wife
        targetFamily.children = targetFamily.children.filter(c => c.name !== daughter.name);

        player.wife = {
            name: daughter.name,
            fromFamily: targetFamily.id,
            traits: daughter.traits
        };

        player.tributeRates.toWife = proposal.tributeRate;

        // Remove unmarried penalty if present
        player.effects = player.effects.filter(e => e.type !== 'unmarried_penalty');

        GameState.log(`${player.name} married ${daughter.name} of ${targetFamily.name}! Tribute rate: ${Math.floor(proposal.tributeRate * 100)}%`);

        return true;
    },

    // Auto-accept with AI logic (for non-interactive turns)
    autoAcceptMarriage(proposal) {
        // Simple AI: Accept if tribute rate is reasonable (>= 5%)
        return proposal.tributeRate >= 0.05;
    },

    // Divorce
    divorce(player, gameState) {
        if (!player.wife) {
            GameState.log(`${player.name} is not married!`);
            return false;
        }

        const wifeName = player.wife.name;
        const wifeFamily = GameState.getPlayer(player.wife.fromFamily);

        player.wife = null;
        player.tributeRates.toWife = 0;

        // Add unmarried penalty
        player.effects.push({
            type: 'unmarried_penalty',
            value: true,
            duration: 99, // Until remarriage
            name: 'Divorced - Unmarried Penalty'
        });

        GameState.log(`${player.name} divorced ${wifeName} of ${wifeFamily.name}! Unmarried penalties apply.`);

        return true;
    },

    // Remarriage (remove unmarried penalty once married)
    removeUnmarriedPenalty(player) {
        player.effects = player.effects.filter(e => e.type !== 'unmarried_penalty');
    },

    // Get marriage status summary
    getMarriageStatus(player) {
        if (!player.wife) {
            return {
                married: false,
                hasUnmarriedPenalty: player.effects.some(e => e.type === 'unmarried_penalty')
            };
        }

        return {
            married: true,
            wife: player.wife,
            tributeRate: player.tributeRates.toWife
        };
    },

    // Calculate marriage desirability score
    calculateDesirability(player) {
        let score = 0;

        // Wealth
        score += player.gold / 10;

        // Estates
        score += player.estates.length * 2;

        // Popular Support
        score += player.popularSupport;

        // Auctoritas
        score += player.auctoritas;

        return score;
    },

    // Get best marriage match (AI helper)
    getBestMatch(player, gameState) {
        const eligible = this.getEligibleFamilies(player, gameState);

        if (eligible.length === 0) {
            return null;
        }

        // Sort by desirability
        eligible.sort((a, b) => {
            const scoreA = this.calculateDesirability(a.player);
            const scoreB = this.calculateDesirability(b.player);
            return scoreB - scoreA;
        });

        return eligible[0];
    }
};
