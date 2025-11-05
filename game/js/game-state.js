// Game State Management
const GameState = {
    // Game state object
    state: {
        turn: 1,
        counter: 1, // Virtue/Popularity counter (1-100)
        emperorId: null, // null during Republic, playerId when Empire
        taxRate: 0.10,
        players: [],
        provinces: [],
        cardDeck: [],
        discardPile: [],
        currentPlayerIndex: 0,
        dynastyCounter: {
            familyId: null,
            count: 0
        },
        gameLog: [],
        phase: 'setup' // setup, income, action, card, imperial, end
    },

    // Initialize game state
    init(playerCount, playerNames) {
        this.state.turn = 1;
        this.state.counter = 1;
        this.state.emperorId = null;
        this.state.taxRate = 0.10;
        this.state.players = [];
        this.state.currentPlayerIndex = 0;
        this.state.dynastyCounter = { familyId: null, count: 0 };
        this.state.gameLog = [];
        this.state.phase = 'income';

        // Create players
        for (let i = 0; i < playerCount; i++) {
            const player = Player.create(i, playerNames[i]);
            this.state.players.push(player);
        }

        // Assign wives and mothers (ensuring no conflicts)
        this.assignWivesAndMothers();

        // Initialize provinces
        this.initializeProvinces();

        // Distribute starting estates
        this.distributeStartingEstates();

        // Initialize card deck
        this.initializeCardDeck();

        // Deal initial cards to all players
        this.dealInitialCards();

        this.log(`Game started with ${playerCount} players!`);
        this.log('The Republic begins. Will you rise to become Emperor?');
    },

    // Assign wives and mothers to all players
    assignWivesAndMothers() {
        const playerCount = this.state.players.length;

        // For each player, assign wife and mother from different families
        this.state.players.forEach((player, idx) => {
            // Assign wife from a different family (not own, not mother's)
            const possibleWifeFamilies = [];
            for (let i = 0; i < playerCount; i++) {
                if (i !== idx) {
                    possibleWifeFamilies.push(i);
                }
            }
            const wifeFamily = possibleWifeFamilies[Math.floor(Math.random() * possibleWifeFamilies.length)];

            // Assign mother from a different family (not own, not wife's)
            const possibleMotherFamilies = [];
            for (let i = 0; i < playerCount; i++) {
                if (i !== idx && i !== wifeFamily) {
                    possibleMotherFamilies.push(i);
                }
            }
            const motherFamily = possibleMotherFamilies[Math.floor(Math.random() * possibleMotherFamilies.length)];

            // Generate random traits
            const femaleTraits = [
                'Financial Acumen', 'Political Savvy', 'Beloved by People',
                'Fertile', 'Pious', 'Influential', 'Scheming'
            ];

            player.wife = {
                name: this.generateName('female'),
                fromFamily: wifeFamily,
                traits: this.selectRandomTraits(femaleTraits, 2)
            };

            player.mother = {
                name: this.generateName('female'),
                fromFamily: motherFamily,
                traits: this.selectRandomTraits(femaleTraits, 2)
            };
        });
    },

    // Generate random Roman names
    generateName(gender) {
        const maleFirstNames = ['Marcus', 'Gaius', 'Lucius', 'Publius', 'Quintus', 'Titus', 'Sextus'];
        const femaleFirstNames = ['Julia', 'Cornelia', 'Claudia', 'Livia', 'Octavia', 'Aurelia', 'Valeria'];

        if (gender === 'male') {
            return maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)];
        } else {
            return femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)];
        }
    },

    // Select random traits
    selectRandomTraits(traitList, count) {
        const shuffled = [...traitList].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    // Initialize provinces
    initializeProvinces() {
        this.state.provinces = [
            {
                id: 0,
                name: 'Italia',
                estates: [],
                conquered: true
            }
        ];

        // Create estates for Italia (5 per player)
        const estateCount = this.state.players.length * 5;
        for (let i = 0; i < estateCount; i++) {
            this.state.provinces[0].estates.push({
                id: i,
                provinceId: 0,
                ownerId: null,
                yield: 2 // base gold per turn
            });
        }
    },

    // Distribute starting estates
    distributeStartingEstates() {
        const italia = this.state.provinces[0];
        const estates = [...italia.estates];

        // Shuffle estates
        for (let i = estates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [estates[i], estates[j]] = [estates[j], estates[i]];
        }

        // Distribute 5 estates to each player
        this.state.players.forEach((player, idx) => {
            for (let i = 0; i < 5; i++) {
                const estate = estates[idx * 5 + i];
                estate.ownerId = player.id;
                player.estates.push(estate);
            }
        });
    },

    // Initialize card deck
    initializeCardDeck() {
        this.state.cardDeck = [...CardDefinitions.getAllCards()];
        this.shuffleDeck();
    },

    // Shuffle deck
    shuffleDeck() {
        for (let i = this.state.cardDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.state.cardDeck[i], this.state.cardDeck[j]] =
                [this.state.cardDeck[j], this.state.cardDeck[i]];
        }
    },

    // Deal initial cards
    dealInitialCards() {
        this.state.players.forEach(player => {
            for (let i = 0; i < 5; i++) {
                this.drawCard(player.id);
            }
        });
    },

    // Draw a card for a player
    drawCard(playerId) {
        const player = this.getPlayer(playerId);

        if (this.state.cardDeck.length === 0) {
            // Reshuffle discard pile into deck
            this.state.cardDeck = [...this.state.discardPile];
            this.state.discardPile = [];
            this.shuffleDeck();
            this.log('Card deck reshuffled');
        }

        if (this.state.cardDeck.length > 0 && player.hand.length < 10) {
            const card = this.state.cardDeck.pop();
            player.hand.push(card);
        }
    },

    // Get player by ID
    getPlayer(playerId) {
        return this.state.players.find(p => p.id === playerId);
    },

    // Get current player
    getCurrentPlayer() {
        return this.state.players[this.state.currentPlayerIndex];
    },

    // Get Emperor
    getEmperor() {
        if (this.state.emperorId === null) return null;
        return this.getPlayer(this.state.emperorId);
    },

    // Add to game log
    log(message) {
        const logEntry = {
            turn: this.state.turn,
            message: message,
            timestamp: Date.now()
        };
        this.state.gameLog.unshift(logEntry);

        // Keep only last 50 entries
        if (this.state.gameLog.length > 50) {
            this.state.gameLog = this.state.gameLog.slice(0, 50);
        }
    },

    // Calculate counter weights
    getCounterWeights() {
        const counter = this.state.counter;
        return {
            popularity: (100 - counter) / 100,
            virtue: counter / 100
        };
    },

    // Check imperial threshold
    checkImperialThreshold(auctoritas) {
        return auctoritas >= (this.state.counter * 0.5);
    },

    // Advance to next player
    nextPlayer() {
        this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;

        // If we've cycled through all players, increment turn
        if (this.state.currentPlayerIndex === 0) {
            this.nextTurn();
        }
    },

    // Advance to next turn
    nextTurn() {
        this.state.turn++;
        this.state.counter = Math.min(100, this.state.counter + 1);
        this.log(`Turn ${this.state.turn} begins`);
    },

    // Check win condition
    checkWinCondition() {
        if (this.state.dynastyCounter.count >= 4) {
            const winner = this.getPlayer(this.state.dynastyCounter.familyId);
            this.log(`${winner.name} has won the game with 4 successive emperors!`);
            return winner;
        }
        return null;
    },

    // Save game state to localStorage
    save() {
        try {
            localStorage.setItem('romanDynastyGame', JSON.stringify(this.state));
            this.log('Game saved');
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    },

    // Load game state from localStorage
    load() {
        try {
            const saved = localStorage.getItem('romanDynastyGame');
            if (saved) {
                this.state = JSON.parse(saved);
                this.log('Game loaded');
                return true;
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        return false;
    }
};
