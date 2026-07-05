// Game State Management
const GameState = {
    state: {
        turn: 1,
        counter: 1,
        emperorId: null,
        taxRate: 0.10,
        players: [],
        provinces: [],
        cardDeck: [],
        discardPile: [],
        eventDeck: [],
        eventQueue: [],
        eventDiscardPile: [],
        turnsSinceLastEvent: 0,
        currentPlayerIndex: 0,
        dynastyCounter: { familyId: null, count: 0 },
        usedNames: [],
        gameLog: [],
        phase: 'setup',
        militaryStrength: 60
    },

    init(playerCount, playerNames) {
        this.state.turn = 1;
        this.state.counter = GameConfig.initialCounter;
        this.state.emperorId = null;
        this.state.taxRate = GameConfig.defaultTaxRate;
        this.state.players = [];
        this.state.currentPlayerIndex = 0;
        this.state.dynastyCounter = { familyId: null, count: 0 };
        this.state.usedNames = [];
        this.state.gameLog = [];
        this.state.phase = 'income';
        this.state.militaryStrength = GameConfig.initialMilitaryStrength;
        this.state.eventDeck = [];
        this.state.eventQueue = [];
        this.state.eventDiscardPile = [];
        this.state.turnsSinceLastEvent = 0;
        this.state.discardPile = [];

        for (let i = 0; i < playerCount; i++) {
            const player = Player.create(i, playerNames[i]);
            player.paterfamilias.name = this.generateName('male');
            this.state.players.push(player);
        }

        this.assignWivesAndMothers();
        this.createStartingChildren();
        this.initializeProvinces();
        this.distributeStartingEstates();
        this.initializeCardDeck();
        this.dealInitialCards();
        this.initializeEventDeck();

        this.log(`The game begins: ${playerCount} great families vie for the destiny of Rome.`);
        this.log(`Study your marriage ties — your fate is bound to your kin.`);
    },

    // Wives and mothers come from other families, weaving the web of
    // obligations. With 3 players this always forms a complete triangle.
    assignWivesAndMothers() {
        const playerCount = this.state.players.length;

        this.state.players.forEach((player, idx) => {
            const others = [];
            for (let i = 0; i < playerCount; i++) {
                if (i !== idx) others.push(i);
            }
            const wifeFamily = others[Math.floor(Math.random() * others.length)];
            const motherCandidates = others.filter(i => i !== wifeFamily);
            const motherFamily = motherCandidates[Math.floor(Math.random() * motherCandidates.length)];

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

    // Each family starts with a son and a daughter approaching adulthood,
    // so succession and marriage politics begin early.
    createStartingChildren() {
        this.state.players.forEach(player => {
            const sonAge = GameConfig.startingSonAgeMin + Math.floor(Math.random() * (GameConfig.startingSonAgeRange + 1));
            const daughterAge = GameConfig.startingDaughterAgeMin + Math.floor(Math.random() * (GameConfig.startingDaughterAgeRange + 1));

            player.children.push({
                name: this.generateName('male'),
                age: sonAge,
                gender: 'male',
                traits: this.selectRandomTraits(GameConfig.maleTraits, Math.random() < GameConfig.childTraitCountBonusChance ? 2 : 1)
            });
            player.children.push({
                name: this.generateName('female'),
                age: daughterAge,
                gender: 'female',
                traits: this.selectRandomTraits(GameConfig.femaleTraits, Math.random() < GameConfig.childTraitCountBonusChance ? 2 : 1)
            });
        });
    },

    // --- Kinship helpers (the family web) ---------------------------------

    // Family ids this player is tied to through wife and mother
    getKinFamilyIds(player) {
        const ids = [];
        if (player.wife && player.wife.fromFamily !== player.id) ids.push(player.wife.fromFamily);
        if (player.mother && player.mother.fromFamily !== player.id && !ids.includes(player.mother.fromFamily)) {
            ids.push(player.mother.fromFamily);
        }
        return ids;
    },

    // Two families are kin if either's wife/mother comes from the other
    areKin(a, b) {
        if (!a || !b || a.id === b.id) return false;
        return this.getKinFamilyIds(a).includes(b.id) || this.getKinFamilyIds(b).includes(a.id);
    },

    // --- Names --------------------------------------------------------------

    generateName(gender) {
        const pool = gender === 'male' ? GameConfig.maleNames : GameConfig.femaleNames;
        const available = pool.filter(n => !this.state.usedNames.includes(n));
        let name;
        if (available.length > 0) {
            name = available[Math.floor(Math.random() * available.length)];
        } else {
            // Pool exhausted: reuse with an epithet
            const base = pool[Math.floor(Math.random() * pool.length)];
            name = `${base} the Younger`;
            if (this.state.usedNames.includes(name)) {
                name = `${base} ${['Minor', 'Novus', 'Secundus', 'Tertius'][Math.floor(Math.random() * 4)]}`;
            }
        }
        this.state.usedNames.push(name);
        // Free old names once the ledger gets long
        if (this.state.usedNames.length > 60) {
            this.state.usedNames = this.state.usedNames.slice(-30);
        }
        return name;
    },

    selectRandomTraits(traitList, count) {
        const shuffled = [...traitList].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    // --- Provinces ------------------------------------------------------------

    initializeProvinces() {
        this.state.provinces = [];
        let estateId = 0;

        GameConfig.provinces.forEach((prov, idx) => {
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
                yearLabel: prov.yearLabel,
                conquestTurn: prov.conquered ? 0 : null
            });
        });
    },

    distributeStartingEstates() {
        const italia = this.state.provinces[0];
        const estates = [...italia.estates];

        for (let i = estates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [estates[i], estates[j]] = [estates[j], estates[i]];
        }

        this.state.players.forEach((player, idx) => {
            for (let i = 0; i < GameConfig.startingEstatesPerPlayer; i++) {
                const estate = estates[idx * GameConfig.startingEstatesPerPlayer + i];
                estate.ownerId = player.id;
                player.estates.push(estate);
            }
        });
    },

    // --- Cards -------------------------------------------------------------

    initializeCardDeck() {
        this.state.cardDeck = CardDefinitions.getAllCards();
        this.shuffleDeck();
    },

    shuffleDeck() {
        for (let i = this.state.cardDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.state.cardDeck[i], this.state.cardDeck[j]] =
                [this.state.cardDeck[j], this.state.cardDeck[i]];
        }
    },

    dealInitialCards() {
        this.state.players.forEach(player => {
            for (let i = 0; i < GameConfig.startingHandSize; i++) {
                this.drawCard(player.id);
            }
        });
    },

    drawCard(playerId) {
        const player = this.getPlayer(playerId);

        if (this.state.cardDeck.length === 0) {
            this.state.cardDeck = [...this.state.discardPile];
            this.state.discardPile = [];
            this.shuffleDeck();
            if (this.state.cardDeck.length > 0) this.log('The card deck is reshuffled.');
        }

        if (this.state.cardDeck.length > 0 && player.hand.length < GameConfig.maxHandSize) {
            const card = this.state.cardDeck.pop();
            player.hand.push(card);
        }
    },

    // --- Lookups --------------------------------------------------------------

    getPlayer(playerId) {
        return this.state.players.find(p => p.id === playerId);
    },

    getCurrentPlayer() {
        return this.state.players[this.state.currentPlayerIndex];
    },

    getEmperor() {
        if (this.state.emperorId === null) return null;
        return this.getPlayer(this.state.emperorId);
    },

    log(message) {
        this.state.gameLog.unshift({
            turn: this.state.turn,
            message: message,
            timestamp: Date.now()
        });
        if (this.state.gameLog.length > GameConfig.maxLogEntries) {
            this.state.gameLog = this.state.gameLog.slice(0, GameConfig.maxLogEntries);
        }
    },

    // --- Counter and succession math ---------------------------------------

    getCounterWeights() {
        const counter = this.state.counter;
        return {
            popularity: (100 - counter) / 100,
            virtue: counter / 100
        };
    },

    // Auctoritas needed to claim or hold the throne. The floor prevents
    // trivially-early emperors; late game the counter drives it up.
    getImperialThreshold() {
        return Math.max(GameConfig.imperialMinAuctoritas, Math.ceil(this.state.counter * 0.5));
    },

    checkImperialThreshold(auctoritas) {
        return auctoritas >= this.getImperialThreshold();
    },

    // --- Turn flow ----------------------------------------------------------

    nextPlayer() {
        this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
        if (this.state.currentPlayerIndex === 0) {
            this.nextTurn();
        }
    },

    nextTurn() {
        this.state.turn++;
        this.state.counter = Math.min(GameConfig.counterMaximum, this.state.counter + GameConfig.counterIncrementPerTurn);
        this.log(`— Turn ${this.state.turn} begins —`);

        // If the Republic drags on too long, the Senate forces the issue
        if (this.state.emperorId === null && this.state.counter >= GameConfig.senateAcclamationCounter) {
            const eligible = this.state.players
                .filter(p => this.checkImperialThreshold(p.auctoritas))
                .sort((a, b) => b.auctoritas - a.auctoritas);
            if (eligible.length > 0) {
                const chosen = eligible[0];
                this.state.emperorId = chosen.id;
                this.state.dynastyCounter.familyId = chosen.id;
                this.state.dynastyCounter.count = 1;
                this.log(`👑 The Senate, desperate for order, acclaims ${chosen.paterfamilias.name} of the ${chosen.name} as Emperor!`);
            }
        }

        this.state.turnsSinceLastEvent++;
        if (this.state.turnsSinceLastEvent >= GameConfig.eventCardDrawFrequency) {
            this.drawAndExecuteEventCard();
            this.state.turnsSinceLastEvent = 0;
        }
    },

    checkWinCondition() {
        if (this.state.dynastyCounter.count >= GameConfig.dynastyWinThreshold) {
            return this.getPlayer(this.state.dynastyCounter.familyId);
        }
        return null;
    },

    // --- Save / Load -------------------------------------------------------
    // Cards and events carry functions that JSON drops; rehydrate on load.

    save() {
        try {
            localStorage.setItem('romanDynastyGame', JSON.stringify(this.state));
            this.log('Game saved.');
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    },

    load() {
        try {
            const saved = localStorage.getItem('romanDynastyGame');
            if (saved) {
                this.state = JSON.parse(saved);
                this.rehydrate();
                this.log('Game loaded.');
                return true;
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        return false;
    },

    rehydrate() {
        const fixCards = arr => arr.map(c => CardDefinitions.rehydrate(c));
        this.state.cardDeck = fixCards(this.state.cardDeck || []);
        this.state.discardPile = fixCards(this.state.discardPile || []);
        this.state.players.forEach(p => { p.hand = fixCards(p.hand || []); });

        const fixEvents = arr => arr.map(c => rehydrateEventCard(c));
        this.state.eventDeck = fixEvents(this.state.eventDeck || []);
        this.state.eventQueue = fixEvents(this.state.eventQueue || []);
        this.state.eventDiscardPile = fixEvents(this.state.eventDiscardPile || []);
        if (!this.state.usedNames) this.state.usedNames = [];
    },

    // --- Military and conquest -----------------------------------------------

    getRequiredMilitaryStrength() {
        const conqueredCount = this.state.provinces.filter(p => p.conquered).length;
        return conqueredCount * GameConfig.militaryRequirementPerProvince;
    },

    checkForRevolts() {
        const required = this.getRequiredMilitaryStrength();
        const current = this.state.militaryStrength;

        if (current < required) {
            const conqueredProvinces = this.state.provinces
                .filter(p => p.conquered && p.conquestTurn !== null && p.conquestTurn > 0)
                .sort((a, b) => b.conquestTurn - a.conquestTurn);

            if (conqueredProvinces.length > 0) {
                const revoltProvince = conqueredProvinces[0];
                revoltProvince.conquered = false;
                revoltProvince.conquestTurn = null;

                const losses = {};
                revoltProvince.estates.forEach(estate => {
                    if (estate.ownerId !== null) {
                        const owner = this.getPlayer(estate.ownerId);
                        owner.estates = owner.estates.filter(e => e.id !== estate.id);
                        losses[owner.name] = (losses[owner.name] || 0) + 1;
                        estate.ownerId = null;
                    }
                });

                this.log(`🔥 REVOLT! ${revoltProvince.name} breaks free — the legions are too weak (${current}/${required}) to hold it!`);
                Object.keys(losses).forEach(name => {
                    this.log(`  The ${name} lose ${losses[name]} estate(s) in the uprising.`);
                });
                return true;
            }
        }
        return false;
    },

    // Conquest proceeds in historical order (the provinces array)
    attemptConquest() {
        const nextProvince = this.state.provinces.find(p => !p.conquered);
        if (!nextProvince) return false;

        const required = this.getRequiredMilitaryStrength() + GameConfig.conquestExtraMilitaryRequired;

        if (this.state.militaryStrength >= required) {
            nextProvince.conquered = true;
            nextProvince.conquestTurn = this.state.turn;
            this.state.militaryStrength -= GameConfig.conquestMilitaryCost;

            this.log(`🏛️ CONQUEST! ${nextProvince.name} (${nextProvince.yearLabel}) falls to Rome — ${nextProvince.estates.length} estates await distribution.`);
            return true;
        }
        return false;
    },

    getMilitaryStatus() {
        const required = this.getRequiredMilitaryStrength();
        const current = this.state.militaryStrength;
        const nextProvince = this.state.provinces.find(p => !p.conquered);
        const nextConquestRequired = required + GameConfig.conquestExtraMilitaryRequired;

        return {
            current: current,
            required: required,
            nextConquestRequired: nextConquestRequired,
            surplus: current - required,
            status: current >= required ? 'Stable' : 'At Risk',
            canConquer: current >= nextConquestRequired && !!nextProvince,
            nextProvince: nextProvince ? nextProvince.name : null
        };
    },

    // --- Event deck ---------------------------------------------------------

    initializeEventDeck() {
        this.state.eventDeck = createEventDeck();
        this.state.eventQueue = [];
        this.state.eventDiscardPile = [];
        this.replenishEventQueue();
        this.log('The omens are cast — fate\'s queue is set.');
    },

    replenishEventQueue() {
        while (this.state.eventQueue.length < GameConfig.eventCardQueueSize) {
            if (this.state.eventDeck.length === 0) {
                if (this.state.eventDiscardPile.length > 0) {
                    this.state.eventDeck = shuffleArray(this.state.eventDiscardPile);
                    this.state.eventDiscardPile = [];
                    this.log('The event deck is reshuffled.');
                } else {
                    break;
                }
            }
            if (this.state.eventDeck.length > 0) {
                const card = this.state.eventDeck.pop();
                card.faceUp = false;
                this.state.eventQueue.push(card);
            }
        }
    },

    drawAndExecuteEventCard() {
        if (this.state.eventQueue.length === 0) return;

        const eventCard = this.state.eventQueue.shift();
        eventCard.faceUp = true;

        this.log(`⚡ EVENT: ${eventCard.name} — ${eventCard.description}`);

        try {
            eventCard.execute(this.state);
        } catch (error) {
            console.error('Error executing event card:', error);
            this.log(`(The event ${eventCard.name} fizzles mysteriously.)`);
        }

        this.state.eventDiscardPile.push(eventCard);
        this.replenishEventQueue();
    },

    readOmens(playerId) {
        const player = this.getPlayer(playerId);
        let cost = GameConfig.readOmensCost;
        cost = Math.max(1, cost - Player.femaleTraitCount(player, 'Pious') * GameConfig.piousOmensDiscount);

        if (player.gold < cost) {
            return { success: false, message: `Not enough gold — reading the omens costs ${cost}.` };
        }

        player.gold -= cost;

        const revealedCards = [];
        const revealCount = Math.min(GameConfig.readOmensRevealCount, this.state.eventQueue.length);

        for (let i = 0; i < revealCount; i++) {
            this.state.eventQueue[i].faceUp = true;
            revealedCards.push({
                position: i + 1,
                name: this.state.eventQueue[i].name,
                description: this.state.eventQueue[i].description,
                type: this.state.eventQueue[i].type
            });
        }

        this.log(`🔮 The ${player.name} pay ${cost} gold to read the omens.`);
        return { success: true, cards: revealedCards };
    }
};
