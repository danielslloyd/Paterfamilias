// Player Class and Management
const Player = {
    // Create a new player
    create(id, familyName) {
        const maleTraits = [
            '+1 Base Auctoritas',
            '+1 Popular Support',
            '+10% Estate Income',
            'Military Prowess'
        ];

        return {
            id: id,
            name: familyName,
            gold: 10,
            popularSupport: 5,
            auctoritas: 5,
            estates: [],
            paterfamilias: {
                name: this.generatePaterfamiliasName(),
                age: 30,
                traits: this.selectRandomTraits(maleTraits, 1)
            },
            wife: null, // Will be assigned later
            mother: null, // Will be assigned later
            children: [],
            hand: [],
            tributeRates: {
                toMother: 0.05,
                toWife: 0.05
            },
            actionTaken: false, // Track if core action taken this turn
            cardPlayed: false, // Track if card played this turn
            cardDiscarded: false, // Track if card discarded this turn
            effects: [] // Temporary effects (from cards, etc.)
        };
    },

    generatePaterfamiliasName() {
        const names = ['Marcus', 'Gaius', 'Lucius', 'Publius', 'Quintus', 'Titus', 'Sextus', 'Gnaeus', 'Aulus'];
        return names[Math.floor(Math.random() * names.length)];
    },

    selectRandomTraits(traitList, count) {
        const shuffled = [...traitList].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    // Calculate estate income for a player
    calculateEstateIncome(player) {
        let baseIncome = 0;

        // Calculate base income from all estates
        player.estates.forEach(estate => {
            baseIncome += estate.yield;
        });

        // Apply trait modifiers
        let modifier = 1.0;

        // Check paterfamilias traits
        if (player.paterfamilias.traits.includes('+10% Estate Income')) {
            modifier += 0.10;
        }

        // Check wife traits
        if (player.wife && player.wife.traits.includes('Financial Acumen')) {
            modifier += 0.10;
        }

        // Check mother traits
        if (player.mother && player.mother.traits.includes('Financial Acumen')) {
            modifier += 0.10;
        }

        // Apply temporary effects
        player.effects.forEach(effect => {
            if (effect.type === 'income_modifier') {
                modifier += effect.value;
            }
        });

        return Math.floor(baseIncome * modifier);
    },

    // Apply trait effects per turn
    applyTraitEffects(player) {
        // Wife traits
        if (player.wife) {
            if (player.wife.traits.includes('Political Savvy')) {
                player.auctoritas += 1;
            }
            if (player.wife.traits.includes('Beloved by People')) {
                player.popularSupport += 1;
            }
        }

        // Mother traits
        if (player.mother) {
            if (player.mother.traits.includes('Political Savvy')) {
                player.auctoritas += 1;
            }
            if (player.mother.traits.includes('Beloved by People')) {
                player.popularSupport += 1;
            }
        }

        // Paterfamilias traits
        if (player.paterfamilias.traits.includes('+1 Base Auctoritas')) {
            player.auctoritas += 1;
        }
        if (player.paterfamilias.traits.includes('+1 Popular Support')) {
            player.popularSupport += 1;
        }
    },

    // Check if player can afford a cost
    canAfford(player, cost) {
        if (cost.gold && player.gold < cost.gold) return false;
        if (cost.auctoritas && player.auctoritas < cost.auctoritas) return false;
        if (cost.popularSupport && player.popularSupport < cost.popularSupport) return false;
        return true;
    },

    // Pay a cost
    payCost(player, cost) {
        if (cost.gold) player.gold -= cost.gold;
        if (cost.auctoritas) player.auctoritas -= cost.auctoritas;
        if (cost.popularSupport) player.popularSupport -= cost.popularSupport;
    },

    // Add resources to player
    addResources(player, resources) {
        if (resources.gold) player.gold += resources.gold;
        if (resources.auctoritas) player.auctoritas += resources.auctoritas;
        if (resources.popularSupport) player.popularSupport += resources.popularSupport;

        // Ensure resources don't go negative
        player.gold = Math.max(0, player.gold);
        player.auctoritas = Math.max(0, player.auctoritas);
        player.popularSupport = Math.max(0, player.popularSupport);
    },

    // Calculate death probability based on age
    calculateDeathProbability(age) {
        if (age <= 50) return 0.02;
        if (age <= 60) return 0.05;
        if (age <= 70) return 0.10;
        return 0.20;
    },

    // Check for death
    checkDeath(player) {
        const probability = this.calculateDeathProbability(player.paterfamilias.age);
        return Math.random() < probability;
    },

    // Handle death and succession
    handleDeath(player, gameState) {
        GameState.log(`${player.paterfamilias.name} of ${player.name} has died at age ${player.paterfamilias.age}`);

        // Find a son to succeed
        const sons = player.children.filter(child => child.gender === 'male' && child.age >= 18);

        if (sons.length > 0) {
            // Choose the oldest son (or random if multiple same age)
            sons.sort((a, b) => b.age - a.age);
            const heir = sons[0];

            player.paterfamilias.name = heir.name;
            player.paterfamilias.age = heir.age;
            player.paterfamilias.traits = heir.traits;

            // Remove heir from children
            player.children = player.children.filter(child => child.name !== heir.name);

            GameState.log(`${heir.name} becomes the new paterfamilias of ${player.name}`);
        } else {
            // No sons available - create a distant relative with penalties
            GameState.log(`${player.name} has no eligible heir! A distant relative takes control with penalties.`);

            player.paterfamilias.name = Player.generatePaterfamiliasName();
            player.paterfamilias.age = 25 + Math.floor(Math.random() * 10);
            player.paterfamilias.traits = [];

            // Apply penalties
            player.auctoritas = Math.max(0, player.auctoritas - 5);
            player.popularSupport = Math.max(0, player.popularSupport - 3);

            // Add negative effect for 3 turns
            player.effects.push({
                type: 'income_modifier',
                value: -0.25,
                duration: 3,
                name: 'Succession Crisis'
            });
        }

        // If player was Emperor, trigger succession
        if (gameState.state.emperorId === player.id) {
            Succession.triggerSuccession(gameState);
        }
    },

    // Add a child
    addChild(player) {
        const gender = Math.random() < 0.5 ? 'male' : 'female';
        const name = GameState.generateName(gender);

        const femaleTraits = [
            'Financial Acumen', 'Political Savvy', 'Beloved by People',
            'Fertile', 'Pious', 'Influential', 'Scheming'
        ];
        const maleTraits = [
            '+1 Base Auctoritas',
            '+1 Popular Support',
            '+10% Estate Income',
            'Military Prowess'
        ];

        const traits = gender === 'female'
            ? GameState.selectRandomTraits(femaleTraits, Math.random() < 0.3 ? 2 : 1)
            : GameState.selectRandomTraits(maleTraits, Math.random() < 0.3 ? 2 : 1);

        const child = {
            name: name,
            age: 0,
            gender: gender,
            traits: traits
        };

        player.children.push(child);
        GameState.log(`${player.name}: A ${gender} child, ${name}, is born!`);
    },

    // Age children and check for births
    ageFamily(player) {
        // Age children
        player.children.forEach(child => {
            child.age++;
        });

        // Check for new births
        let fertilityChance = 0.15; // Base 15% chance per turn

        if (player.wife && player.wife.traits.includes('Fertile')) {
            fertilityChance += 0.15;
        }

        // Check temporary effects
        player.effects.forEach(effect => {
            if (effect.type === 'fertility_boost') {
                fertilityChance += effect.value;
            }
        });

        if (Math.random() < fertilityChance && player.paterfamilias.age < 60) {
            this.addChild(player);
        }
    },

    // Update temporary effects
    updateEffects(player) {
        player.effects = player.effects.filter(effect => {
            if (effect.duration !== undefined) {
                effect.duration--;
                return effect.duration > 0;
            }
            return true;
        });
    },

    // Reset turn-based flags
    resetTurnFlags(player) {
        player.actionTaken = false;
        player.cardPlayed = false;
        player.cardDiscarded = false;
    },

    // Calculate succession score
    calculateSuccessionScore(player, weights) {
        return (weights.popularity * player.popularSupport) +
               (weights.virtue * player.auctoritas);
    }
};
