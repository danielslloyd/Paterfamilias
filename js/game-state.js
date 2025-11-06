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
        eventDeck: [], // Separate deck for event cards
        eventQueue: [], // Face-down event cards (5 at a time)
        eventDiscardPile: [], // Discarded event cards
        turnsSinceLastEvent: 0, // Track when to execute next event
        currentPlayerIndex: 0,
        dynastyCounter: {
            familyId: null,
            count: 0
        },
        gameLog: [],
        phase: 'setup', // setup, income, action, card, imperial, end
        militaryStrength: 100 // Empire-wide military strength - will be set by init()
    },

    // Initialize game state
    init(playerCount, playerNames) {
        this.state.turn = 1;
        this.state.counter = GameConfig.initialCounter;
        this.state.emperorId = null;
        this.state.taxRate = GameConfig.defaultTaxRate;
        this.state.players = [];
        this.state.currentPlayerIndex = 0;
        this.state.dynastyCounter = { familyId: null, count: 0 };
        this.state.gameLog = [];
        this.state.phase = 'income';
        this.state.militaryStrength = GameConfig.initialMilitaryStrength;
        this.state.eventDeck = [];
        this.state.eventQueue = [];
        this.state.eventDiscardPile = [];
        this.state.turnsSinceLastEvent = 0;

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

        // Initialize event deck
        this.initializeEventDeck();

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

            player.wife = {
                name: this.generateName('female'),
                fromFamily: wifeFamily,
                traits: this.selectRandomTraits(GameConfig.femaleTraits, 2)
            };

            player.mother = {
                name: this.generateName('female'),
                fromFamily: motherFamily,
                traits: this.selectRandomTraits(GameConfig.femaleTraits, 2)
            };
        });
    },

    // Generate random Roman names
    generateName(gender) {
        if (gender === 'male') {
            return GameConfig.maleNames[Math.floor(Math.random() * GameConfig.maleNames.length)];
        } else {
            return GameConfig.femaleNames[Math.floor(Math.random() * GameConfig.femaleNames.length)];
        }
    },

    // Select random traits
    selectRandomTraits(traitList, count) {
        const shuffled = [...traitList].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    // Initialize provinces
    initializeProvinces() {
        this.state.provinces = [];
        let estateId = 0;

        GameConfig.provinces.forEach((prov, idx) => {
            // Calculate estate count (Italia uses player count)
            const estateCount = prov.estateCount === null
                ? this.state.players.length * GameConfig.startingEstatesPerPlayer
                : prov.estateCount;

            const estates = [];
            for (let i = 0; i < estateCount; i++) {
                estates.push({
                    id: estateId++,
                    provinceId: idx,
                    ownerId: null,
                    yield: GameConfig.baseEstateYield
                });
            }

            this.state.provinces.push({
                id: idx,
                name: prov.name,
                estates: estates,
                conquered: prov.conquered,
                year: prov.year,
                conquestTurn: prov.conquered ? 0 : null
            });
        });
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

        // Distribute starting estates to each player
        this.state.players.forEach((player, idx) => {
            for (let i = 0; i < GameConfig.startingEstatesPerPlayer; i++) {
                const estate = estates[idx * GameConfig.startingEstatesPerPlayer + i];
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
            for (let i = 0; i < GameConfig.startingHandSize; i++) {
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

        if (this.state.cardDeck.length > 0 && player.hand.length < GameConfig.maxHandSize) {
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

        // Keep only last N entries
        if (this.state.gameLog.length > GameConfig.maxLogEntries) {
            this.state.gameLog = this.state.gameLog.slice(0, GameConfig.maxLogEntries);
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
        this.state.counter = Math.min(GameConfig.counterMaximum, this.state.counter + GameConfig.counterIncrementPerTurn);
        this.log(`Turn ${this.state.turn} begins`);

        // Check if we need to draw/execute an event card
        this.state.turnsSinceLastEvent++;
        if (this.state.turnsSinceLastEvent >= GameConfig.eventCardDrawFrequency) {
            this.drawAndExecuteEventCard();
            this.state.turnsSinceLastEvent = 0;
        }
    },

    // Check win condition
    checkWinCondition() {
        if (this.state.dynastyCounter.count >= GameConfig.dynastyWinThreshold) {
            const winner = this.getPlayer(this.state.dynastyCounter.familyId);
            this.log(`${winner.name} has won the game with ${GameConfig.dynastyWinThreshold} successive emperors!`);
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
    },

    // Calculate required military strength
    getRequiredMilitaryStrength() {
        const conqueredCount = this.state.provinces.filter(p => p.conquered).length;
        return conqueredCount * GameConfig.militaryRequirementPerProvince;
    },

    // Check for revolts
    checkForRevolts() {
        const required = this.getRequiredMilitaryStrength();
        const current = this.state.militaryStrength;

        if (current < required) {
            // Military is too weak - revolt in most recently conquered province
            const conqueredProvinces = this.state.provinces
                .filter(p => p.conquered && p.conquestTurn !== null)
                .sort((a, b) => b.conquestTurn - a.conquestTurn);

            if (conqueredProvinces.length > 1) { // Don't lose Italia
                const revoltProvince = conqueredProvinces[0];
                revoltProvince.conquered = false;
                revoltProvince.conquestTurn = null;

                // Free all estates in revolted province
                revoltProvince.estates.forEach(estate => {
                    if (estate.ownerId !== null) {
                        const owner = this.getPlayer(estate.ownerId);
                        owner.estates = owner.estates.filter(e => e.id !== estate.id);
                        estate.ownerId = null;
                    }
                });

                this.log(`⚠️ REVOLT! ${revoltProvince.name} has broken free from Roman control due to insufficient military strength!`);
                return true;
            }
        }
        return false;
    },

    // Attempt to conquer next province
    attemptConquest() {
        const unconquered = this.state.provinces.filter(p => !p.conquered);

        if (unconquered.length === 0) {
            this.log('All provinces have been conquered!');
            return false;
        }

        const nextProvince = unconquered[0];
        const required = this.getRequiredMilitaryStrength() + GameConfig.conquestExtraMilitaryRequired;

        if (this.state.militaryStrength >= required) {
            // Success!
            nextProvince.conquered = true;
            nextProvince.conquestTurn = this.state.turn;
            this.state.militaryStrength -= GameConfig.conquestMilitaryCost;

            this.log(`🏛️ CONQUEST! ${nextProvince.name} has been absorbed into the Roman Empire!`);
            this.log(`${nextProvince.estates.length} new estates are now available for distribution.`);
            return true;
        } else {
            this.log(`Failed to conquer ${nextProvince.name}. Need ${required} military strength (current: ${this.state.militaryStrength})`);
            return false;
        }
    },

    // Get military status summary
    getMilitaryStatus() {
        const required = this.getRequiredMilitaryStrength();
        const current = this.state.militaryStrength;
        const unconquered = this.state.provinces.filter(p => !p.conquered);
        const nextConquestRequired = required + GameConfig.conquestExtraMilitaryRequired;

        return {
            current: current,
            required: required,
            nextConquestRequired: nextConquestRequired,
            surplus: current - required,
            status: current >= required ? 'Stable' : 'At Risk',
            canConquer: current >= nextConquestRequired && unconquered.length > 0,
            nextProvince: unconquered.length > 0 ? unconquered[0].name : null
        };
    },

    // Initialize event deck
    initializeEventDeck() {
        this.state.eventDeck = createEventDeck();
        this.state.eventQueue = [];
        this.state.eventDiscardPile = [];

        // Fill the initial queue with face-down cards
        this.replenishEventQueue();

        this.log('Event deck initialized - the omens are set');
    },

    // Replenish event queue to maintain 5 cards
    replenishEventQueue() {
        while (this.state.eventQueue.length < GameConfig.eventCardQueueSize) {
            if (this.state.eventDeck.length === 0) {
                // Reshuffle discard pile into deck
                if (this.state.eventDiscardPile.length > 0) {
                    this.state.eventDeck = [...this.state.eventDiscardPile];
                    this.state.eventDiscardPile = [];
                    this.shuffleEventDeck();
                    this.log('Event deck reshuffled');
                } else {
                    // No more cards available
                    break;
                }
            }

            if (this.state.eventDeck.length > 0) {
                const card = this.state.eventDeck.pop();
                card.faceUp = false; // Cards start face-down
                this.state.eventQueue.push(card);
            }
        }
    },

    // Shuffle event deck
    shuffleEventDeck() {
        for (let i = this.state.eventDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.state.eventDeck[i], this.state.eventDeck[j]] =
                [this.state.eventDeck[j], this.state.eventDeck[i]];
        }
    },

    // Draw and execute the next event card from the queue
    drawAndExecuteEventCard() {
        if (this.state.eventQueue.length === 0) {
            this.log('No event cards available');
            return;
        }

        // Take the first card from the queue (FIFO)
        const eventCard = this.state.eventQueue.shift();
        eventCard.faceUp = true; // Reveal the card

        this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        this.log(`⚡ EVENT: ${eventCard.name}`);
        this.log(`${eventCard.description}`);
        this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Execute the event
        try {
            eventCard.execute(this.state);
        } catch (error) {
            console.error('Error executing event card:', error);
            this.log(`Error executing event: ${eventCard.name}`);
        }

        // Discard the event card
        this.state.eventDiscardPile.push(eventCard);

        // Replenish the queue
        this.replenishEventQueue();
    },

    // Read the omens - reveal upcoming event cards
    readOmens(playerId) {
        const player = this.getPlayer(playerId);

        // Check if player can afford it
        if (player.gold < GameConfig.readOmensCost) {
            return {
                success: false,
                message: `Not enough gold. Need ${GameConfig.readOmensCost} gold to read the omens.`
            };
        }

        // Pay the cost
        player.gold -= GameConfig.readOmensCost;

        // Reveal upcoming cards (temporarily)
        const revealedCards = [];
        const revealCount = Math.min(GameConfig.readOmensRevealCount, this.state.eventQueue.length);

        for (let i = 0; i < revealCount; i++) {
            if (this.state.eventQueue[i]) {
                this.state.eventQueue[i].faceUp = true;
                revealedCards.push({
                    position: i + 1,
                    name: this.state.eventQueue[i].name,
                    description: this.state.eventQueue[i].description,
                    type: this.state.eventQueue[i].type
                });
            }
        }

        this.log(`${player.name} pays ${GameConfig.readOmensCost} gold to read the omens and glimpses ${revealCount} future events`);

        return {
            success: true,
            message: `The omens reveal ${revealCount} upcoming events...`,
            cards: revealedCards
        };
    }
};
