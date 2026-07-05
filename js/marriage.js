// Marriage Negotiation System
// Marriages knit the family web: the groom's family pays a dowry and an
// ongoing tribute; when the groom's heir succeeds, the wife becomes the
// dowager mother and her family tie persists into the next generation.
const Marriage = {
    isValidMarriage(player, targetFamily) {
        if (player.id === targetFamily.id) {
            return { valid: false, reason: 'Cannot marry within your own family' };
        }
        if (player.mother && player.mother.fromFamily === targetFamily.id) {
            return { valid: false, reason: 'Cannot marry your mother\'s family' };
        }
        if (player.wife) {
            return { valid: false, reason: 'Already married' };
        }
        return { valid: true };
    },

    // Families with marriageable daughters that this player could wed
    getEligibleFamilies(player, gameState) {
        const eligible = [];
        if (player.wife) return eligible;

        gameState.state.players.forEach(targetPlayer => {
            const validation = this.isValidMarriage(player, targetPlayer);
            if (validation.valid) {
                const daughters = targetPlayer.children.filter(c =>
                    c.gender === 'female' && c.age >= GameConfig.minimumMarriageAge
                );
                if (daughters.length > 0) {
                    eligible.push({ player: targetPlayer, daughters });
                }
            }
        });
        return eligible;
    },

    // Dowry the groom pays the bride's family
    getDowry(player, daughter) {
        let dowry = GameConfig.baseDowry;
        // A bride with more traits commands a higher price
        dowry += Math.max(0, daughter.traits.length - 1) * 2;
        return dowry;
    },

    // Conclude a marriage that both sides have agreed to
    concludeMarriage(player, targetFamily, daughter, tributeRate, gameState) {
        const dowry = this.getDowry(player, daughter);

        if (player.gold < dowry) {
            GameState.log(`The ${player.name} cannot pay the ${dowry} gold dowry.`);
            return false;
        }

        player.gold -= dowry;
        targetFamily.gold += dowry;

        targetFamily.children = targetFamily.children.filter(c => c !== daughter);
        player.wife = {
            name: daughter.name,
            fromFamily: targetFamily.id,
            traits: daughter.traits
        };
        player.tributeRates.toWife = tributeRate;

        GameState.log(`⚭ ${player.paterfamilias.name} of the ${player.name} marries ${daughter.name} of the ${targetFamily.name}!`);
        GameState.log(`Dowry of ${dowry} gold paid; ${Math.round(tributeRate * 100)}% tribute will flow to the ${targetFamily.name} each turn.`);
        return true;
    },

    // Dissolve a marriage (divorce or scandal). The wife returns to her
    // family as a marriageable daughter — women never die in this game.
    dissolve(player, reason) {
        if (!player.wife) return false;

        const wife = player.wife;
        const wifeFamily = GameState.getPlayer(wife.fromFamily);

        player.wife = null;
        player.tributeRates.toWife = 0;

        if (wifeFamily) {
            wifeFamily.children.push({
                name: wife.name,
                age: 20,
                gender: 'female',
                traits: wife.traits
            });
            GameState.log(`${wife.name} returns to the ${wifeFamily.name} household.`);
        }

        if (reason === 'divorce') {
            GameState.log(`The ${player.name} paterfamilias divorces ${wife.name}. The tribute tie to the ${wifeFamily ? wifeFamily.name : '?'} is severed.`);
        }
        return true;
    },

    // Voluntary divorce: costly, but frees you to re-negotiate the web
    divorce(player, gameState) {
        if (!player.wife) {
            GameState.log(`The ${player.name} paterfamilias is not married.`);
            return false;
        }
        const cost = GameConfig.divorceCost;
        if (player.gold < cost.gold) {
            GameState.log(`A divorce requires ${cost.gold} gold for the settlement.`);
            return false;
        }

        player.gold -= cost.gold;
        player.auctoritas = Math.max(0, player.auctoritas - cost.auctoritas);
        player.popularSupport = Math.max(0, player.popularSupport - cost.popularSupport);

        this.dissolve(player, 'divorce');
        GameState.log(`Rome mutters at the scandal: -${cost.auctoritas} Auctoritas, -${cost.popularSupport} Support.`);
        return true;
    },

    getMarriageStatus(player) {
        if (!player.wife) {
            return { married: false };
        }
        return {
            married: true,
            wife: player.wife,
            tributeRate: player.tributeRates.toWife
        };
    }
};
