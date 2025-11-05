// UI Rendering and Updates
const UI = {
    selectedCardIndex: -1,
    selectedTargetPlayer: null,

    // Initialize UI
    init() {
        this.bindEvents();
        this.render();
    },

    // Bind event listeners
    bindEvents() {
        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleAction(action);
            });
        });

        // Imperial buttons
        document.querySelectorAll('.imperial-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleImperialAction(action);
            });
        });

        // Card controls
        document.getElementById('btn-play-card').addEventListener('click', () => {
            this.handlePlayCard();
        });

        document.getElementById('btn-discard-card').addEventListener('click', () => {
            this.handleDiscardCard();
        });

        // End turn button
        document.getElementById('btn-end-turn').addEventListener('click', () => {
            this.handleEndTurn();
        });
    },

    // Handle core actions
    handleAction(action) {
        const player = GameState.getCurrentPlayer();

        switch (action) {
            case 'contribute-military':
                Actions.contributeToMilitary(player);
                break;
            case 'economic-development':
                Actions.economicDevelopment(player);
                break;
            case 'political-maneuvering':
                Actions.politicalManeuvering(player);
                break;
            case 'marriage-negotiation':
                this.showMarriageDialog(player);
                break;
        }

        this.render();
    },

    // Handle imperial actions
    handleImperialAction(action) {
        const emperor = GameState.getEmperor();
        if (!emperor || emperor.id !== GameState.getCurrentPlayer().id) {
            return;
        }

        switch (action) {
            case 'set-tax-rate':
                this.showTaxRateDialog(emperor);
                break;
            case 'launch-campaign':
                Actions.launchCampaign(emperor, GameState);
                break;
            case 'distribute-estates':
                this.showDistributeEstatesDialog(emperor);
                break;
            case 'influence-counter':
                this.showInfluenceCounterDialog(emperor);
                break;
        }

        this.render();
    },

    // Handle card play
    handlePlayCard() {
        if (this.selectedCardIndex === -1) {
            alert('Please select a card to play');
            return;
        }

        const player = GameState.getCurrentPlayer();
        const card = player.hand[this.selectedCardIndex];

        // Check if card needs a target
        const needsTarget = ['military', 'political', 'intrigue'].includes(card.type);

        if (needsTarget && !this.selectedTargetPlayer) {
            this.showTargetSelectionDialog(card);
            return;
        }

        Actions.playCard(player, this.selectedCardIndex, this.selectedTargetPlayer, GameState);
        this.selectedCardIndex = -1;
        this.selectedTargetPlayer = null;
        this.render();
    },

    // Handle card discard
    handleDiscardCard() {
        if (this.selectedCardIndex === -1) {
            alert('Please select a card to discard');
            return;
        }

        const player = GameState.getCurrentPlayer();
        Actions.discardCard(player, this.selectedCardIndex, GameState);
        this.selectedCardIndex = -1;
        this.render();
    },

    // Handle end turn
    handleEndTurn() {
        const player = GameState.getCurrentPlayer();

        // Check if mandatory discard is done
        if (!player.cardDiscarded && player.hand.length > 0) {
            alert('You must discard a card before ending your turn!');
            return;
        }

        // Draw 2 cards
        Actions.drawCards(player, 2);

        // End turn processing
        Actions.endTurn(player, GameState);

        // Reset turn flags
        Player.resetTurnFlags(player);

        // Check win condition
        const winner = GameState.checkWinCondition();
        if (winner) {
            this.showVictoryScreen(winner);
            return;
        }

        // Move to next player
        GameState.nextPlayer();

        // Start next player's turn
        this.startTurn();
    },

    // Start a new turn for current player
    startTurn() {
        const player = GameState.getCurrentPlayer();

        // Check if player needs a child (temporary mechanic)
        const hasSon = player.children.some(c => c.gender === 'male');
        const hasDaughter = player.children.some(c => c.gender === 'female');

        if (!hasSon || !hasDaughter) {
            // Determine which gender is needed
            const neededGender = !hasSon ? 'male' : 'female';
            const name = GameState.generateName(neededGender);

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

            const traits = neededGender === 'female'
                ? GameState.selectRandomTraits(femaleTraits, Math.random() < 0.3 ? 2 : 1)
                : GameState.selectRandomTraits(maleTraits, Math.random() < 0.3 ? 2 : 1);

            const child = {
                name: name,
                age: 0,
                gender: neededGender,
                traits: traits
            };

            player.children.push(child);
            GameState.log(`${player.name}: A ${neededGender} child, ${name}, is born! (Ensuring family succession)`);
        }

        // Process income
        Actions.processIncome(player);
        Actions.processTaxes(player, GameState);
        Actions.processTribute(player, GameState);

        // Check dynasty progress
        Succession.checkDynastyProgress(GameState);

        this.render();
    },

    // Main render function
    render() {
        this.renderHeader();
        this.renderBalanceBar();
        this.renderPlayersTopBar();
        this.renderPlayerPanel();
        this.renderActionButtons();
        this.renderHand();
        this.renderImperialSection();
        this.renderMilitaryStatus();
        this.renderProvinces();
        this.renderGameLog();
        this.updateCardControls();
    },

    // Render header
    renderHeader() {
        document.getElementById('turn-display').textContent = `Turn: ${GameState.state.turn}`;

        const emperor = GameState.getEmperor();
        document.getElementById('emperor-display').textContent =
            emperor ? `Emperor: ${emperor.name}` : 'Republic';
    },

    // Render balance bar
    renderBalanceBar() {
        const counter = GameState.state.counter;
        const percentage = counter; // counter is 1-100

        const marker = document.getElementById('balance-marker');
        // Position marker (subtract half its width for centering)
        marker.style.left = `calc(${percentage}% - 2px)`;
    },

    // Render players top bar
    renderPlayersTopBar() {
        const currentPlayer = GameState.getCurrentPlayer();
        const topBar = document.getElementById('players-top-bar');
        topBar.innerHTML = '';

        GameState.state.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';

            if (player.id === currentPlayer.id) {
                playerCard.classList.add('current-turn');
            }

            const isEmperor = GameState.state.emperorId === player.id;
            if (isEmperor) {
                playerCard.classList.add('is-emperor');
            }

            // Determine wife's family
            let wifeFamily = null;
            if (player.wife && player.wife.fromFamily !== undefined) {
                wifeFamily = GameState.state.players[player.wife.fromFamily];
            }

            // Build children icons
            let childrenHTML = '';
            if (player.id !== currentPlayer.id) {
                // For non-current players, show compact child icons
                const sons = player.children.filter(c => c.gender === 'male');
                const daughters = player.children.filter(c => c.gender === 'female');

                if (sons.length > 0 || daughters.length > 0) {
                    childrenHTML = '<div class="children-icons">';
                    sons.forEach(() => childrenHTML += '<span class="child-icon">♂</span>');
                    daughters.forEach(() => childrenHTML += '<span class="child-icon">♀</span>');
                    childrenHTML += '</div>';
                }
            }

            playerCard.innerHTML = `
                <div class="player-card-header">
                    <span>${player.name}${isEmperor ? ' 👑' : ''}</span>
                </div>
                <div class="player-card-resources">
                    G:${player.gold} | S:${player.popularSupport} | V:${player.auctoritas} | E:${player.estates.length}
                </div>
                <div class="player-card-family">
                    ${player.paterfamilias.name} (${player.paterfamilias.age})
                    ${wifeFamily ? `<span class="marriage-indicator">⚭ ${wifeFamily.name}</span>` : ''}
                    ${childrenHTML}
                </div>
            `;

            topBar.appendChild(playerCard);
        });
    },

    // Render player panel
    renderPlayerPanel() {
        const player = GameState.getCurrentPlayer();

        document.getElementById('current-player-name').textContent = player.name;
        document.getElementById('player-gold').textContent = player.gold;
        document.getElementById('player-popularity').textContent = player.popularSupport;
        document.getElementById('player-virtue').textContent = player.auctoritas;
        document.getElementById('player-estates').textContent = player.estates.length;

        // Paterfamilias
        const pfInfo = document.getElementById('paterfamilias-info');
        pfInfo.innerHTML = `
            <strong>Paterfamilias:</strong> ${player.paterfamilias.name} (Age ${player.paterfamilias.age})
            <br><small>${player.paterfamilias.traits.join(', ')}</small>
        `;

        // Wife
        const wifeInfo = document.getElementById('wife-info');
        if (player.wife) {
            const wifeFamily = GameState.getPlayer(player.wife.fromFamily);
            wifeInfo.innerHTML = `
                <strong>Wife:</strong> ${player.wife.name} (from ${wifeFamily.name})
                <br><small>${player.wife.traits.join(', ')}</small>
            `;
        } else {
            wifeInfo.innerHTML = '<strong>Wife:</strong> <span style="color: red;">Unmarried!</span>';
        }

        // Mother
        const motherInfo = document.getElementById('mother-info');
        if (player.mother) {
            const motherFamily = GameState.getPlayer(player.mother.fromFamily);
            motherInfo.innerHTML = `
                <strong>Mother:</strong> ${player.mother.name} (from ${motherFamily.name})
                <br><small>${player.mother.traits.join(', ')}</small>
            `;
        } else {
            motherInfo.innerHTML = '<strong>Mother:</strong> None';
        }

        // Children
        const childrenInfo = document.getElementById('children-info');
        if (player.children.length > 0) {
            let childrenHTML = '<strong>Children:</strong><ul>';
            player.children.forEach(child => {
                childrenHTML += `<li>${child.name} (${child.age}, ${child.gender}) - ${child.traits.join(', ') || 'No traits'}</li>`;
            });
            childrenHTML += '</ul>';
            childrenInfo.innerHTML = childrenHTML;
        } else {
            childrenInfo.innerHTML = '<strong>Children:</strong> None';
        }

        // Dynasty progress
        const successionCount = document.getElementById('succession-count');
        if (GameState.state.dynastyCounter.familyId !== null) {
            const dynastyFamily = GameState.getPlayer(GameState.state.dynastyCounter.familyId);
            successionCount.innerHTML = `
                <strong>${dynastyFamily.name}:</strong> ${GameState.state.dynastyCounter.count} / 4 successive emperors
            `;
        } else {
            successionCount.innerHTML = 'No dynasty established yet';
        }
    },

    // Render action buttons
    renderActionButtons() {
        const player = GameState.getCurrentPlayer();

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.disabled = player.actionTaken;
        });
    },

    // Render hand
    renderHand() {
        const player = GameState.getCurrentPlayer();
        const handContainer = document.getElementById('hand-cards');
        handContainer.innerHTML = '';

        player.hand.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            if (index === this.selectedCardIndex) {
                cardDiv.classList.add('selected');
            }

            const canAfford = Player.canAfford(player, card.cost);
            if (!canAfford) {
                cardDiv.classList.add('unaffordable');
            }

            const cardIcons = {
                military: '⚔️',
                political: '🏛️',
                intrigue: '🗡️',
                economic: '💰',
                religious: '⛪'
            };

            cardDiv.innerHTML = `
                <div class="card-header">
                    <span class="card-type-icon">${cardIcons[card.type] || '📜'}</span>
                    <strong>${card.name}</strong>
                </div>
                <div class="card-type">${card.type.charAt(0).toUpperCase() + card.type.slice(1)}</div>
                <div class="card-cost">
                    ${card.cost.gold ? `${card.cost.gold} Gold` : ''}
                    ${card.cost.auctoritas ? `, ${card.cost.auctoritas} Virtue` : ''}
                    ${card.cost.popularSupport ? `, ${card.cost.popularSupport} Support` : ''}
                </div>
                <div class="card-description">${card.description}</div>
            `;

            cardDiv.addEventListener('click', () => {
                this.selectedCardIndex = index;
                this.render();
            });

            handContainer.appendChild(cardDiv);
        });
    },

    // Update card controls
    updateCardControls() {
        const player = GameState.getCurrentPlayer();

        const playBtn = document.getElementById('btn-play-card');
        const discardBtn = document.getElementById('btn-discard-card');

        // Play button is enabled if card is selected and not yet played
        playBtn.disabled = this.selectedCardIndex === -1 || player.cardPlayed;

        // Discard button is only enabled if:
        // 1. A card is selected
        // 2. Card has not been discarded yet
        // 3. A card has already been played this turn (enforcing play>discard order)
        discardBtn.disabled = this.selectedCardIndex === -1 || player.cardDiscarded || !player.cardPlayed;
    },

    // Render imperial section
    renderImperialSection() {
        const player = GameState.getCurrentPlayer();
        const emperor = GameState.getEmperor();
        const imperialSection = document.getElementById('imperial-section');

        if (emperor && emperor.id === player.id) {
            imperialSection.style.display = 'block';
        } else {
            imperialSection.style.display = 'none';
        }
    },

    // Render military status
    renderMilitaryStatus() {
        const militaryInfo = document.getElementById('military-info');
        const status = GameState.getMilitaryStatus();

        const statusClass = status.status === 'Stable' ? 'military-stable' : 'military-at-risk';

        let html = `
            <div><strong>Current:</strong> ${status.current}</div>
            <div><strong>Required:</strong> ${status.required}</div>
            <div><strong>Status:</strong> <span class="${statusClass}">${status.status}</span></div>
        `;

        if (status.nextProvince) {
            html += `
                <hr style="border-color: #555; margin: 8px 0;">
                <div style="font-size: 0.85em;">
                    <strong>Next Province:</strong> ${status.nextProvince}<br>
                    <strong>Required:</strong> ${status.nextConquestRequired}
                    ${status.canConquer ? '<br><span style="color: #90EE90;">✓ Can conquer!</span>' : ''}
                </div>
            `;
        }

        militaryInfo.innerHTML = html;
    },


    // Render provinces
    renderProvinces() {
        const provincesList = document.getElementById('provinces-list');
        provincesList.innerHTML = '';

        GameState.state.provinces.forEach(province => {
            const provinceDiv = document.createElement('div');
            provinceDiv.className = province.conquered ? 'province conquered' : 'province unconquered';

            if (province.conquered) {
                const estateBreakdown = {};
                province.estates.forEach(estate => {
                    if (estate.ownerId !== null) {
                        const owner = GameState.getPlayer(estate.ownerId);
                        estateBreakdown[owner.name] = (estateBreakdown[owner.name] || 0) + 1;
                    } else {
                        estateBreakdown['Unowned'] = (estateBreakdown['Unowned'] || 0) + 1;
                    }
                });

                let breakdownHTML = '';
                Object.keys(estateBreakdown).forEach(ownerName => {
                    const count = estateBreakdown[ownerName];
                    breakdownHTML += `<div>${ownerName}: ${count}</div>`;
                });

                provinceDiv.innerHTML = `
                    <div class="province-header">✓ ${province.name}</div>
                    <div style="font-size: 0.8em; color: #aaa;">${province.estates.length} estates</div>
                    <div class="estate-distribution">${breakdownHTML}</div>
                `;
            } else {
                provinceDiv.innerHTML = `
                    <div class="province-header">○ ${province.name}</div>
                    <div style="font-size: 0.8em; color: #888;">${province.estates.length} estates (unconquered)</div>
                `;
            }

            provincesList.appendChild(provinceDiv);
        });
    },

    // Render game log
    renderGameLog() {
        const logMessages = document.getElementById('log-messages');
        logMessages.innerHTML = '';

        GameState.state.gameLog.slice(0, 10).forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = `[Turn ${entry.turn}] ${entry.message}`;
            logMessages.appendChild(logEntry);
        });
    },

    // Show marriage dialog
    showMarriageDialog(player) {
        const eligible = Marriage.getEligibleFamilies(player, GameState);

        if (eligible.length === 0) {
            alert('No eligible families for marriage!');
            return;
        }

        let html = '<h2>Marriage Negotiation</h2>';
        html += '<p>Select a family and daughter:</p>';

        eligible.forEach((option, idx) => {
            html += `<div class="marriage-option">`;
            html += `<h3>${option.player.name}</h3>`;

            option.daughters.forEach((daughter, dIdx) => {
                html += `<button onclick="UI.selectMarriage(${option.player.id}, ${dIdx})">
                    ${daughter.name} (Age ${daughter.age}) - ${daughter.traits.join(', ')}
                </button>`;
            });

            html += `</div>`;
        });

        html += '<button onclick="UI.closeModal()">Cancel</button>';

        this.showModal(html);
    },

    // Select marriage
    selectMarriage(familyId, daughterIdx) {
        const player = GameState.getCurrentPlayer();
        const targetFamily = GameState.getPlayer(familyId);

        // Simplified: Auto-accept with 5% tribute
        const proposal = Marriage.proposeMarriage(player, targetFamily, daughterIdx, 0.05, GameState);

        if (proposal) {
            Marriage.acceptMarriage(proposal, 0.05, GameState);
        }

        this.closeModal();
        this.render();
    },

    // Show target selection dialog
    showTargetSelectionDialog(card) {
        let html = `<h2>Select Target for ${card.name}</h2>`;

        const currentPlayer = GameState.getCurrentPlayer();

        GameState.state.players.forEach(player => {
            if (player.id !== currentPlayer.id) {
                html += `<button onclick="UI.selectTarget(${player.id})">${player.name}</button>`;
            }
        });

        html += '<button onclick="UI.closeModal()">Cancel</button>';

        this.showModal(html);
    },

    // Select target
    selectTarget(playerId) {
        this.selectedTargetPlayer = GameState.getPlayer(playerId);
        this.closeModal();
        this.handlePlayCard();
    },

    // Show tax rate dialog
    showTaxRateDialog(emperor) {
        let html = '<h2>Set Tax Rate</h2>';
        html += `<p>Current rate: ${Math.floor(GameState.state.taxRate * 100)}%</p>`;
        html += '<input type="range" id="tax-slider" min="0" max="50" value="' + Math.floor(GameState.state.taxRate * 100) + '">';
        html += '<p>New rate: <span id="tax-value">' + Math.floor(GameState.state.taxRate * 100) + '</span>%</p>';
        html += '<button onclick="UI.confirmTaxRate()">Confirm</button>';
        html += '<button onclick="UI.closeModal()">Cancel</button>';

        this.showModal(html);

        document.getElementById('tax-slider').addEventListener('input', (e) => {
            document.getElementById('tax-value').textContent = e.target.value;
        });
    },

    // Confirm tax rate
    confirmTaxRate() {
        const emperor = GameState.getEmperor();
        const newRate = parseInt(document.getElementById('tax-slider').value) / 100;
        Actions.setTaxRate(emperor, newRate, GameState);
        this.closeModal();
        this.render();
    },

    // Show distribute estates dialog
    showDistributeEstatesDialog(emperor) {
        const unownedProvinces = GameState.state.provinces.filter(p =>
            p.estates.some(e => e.ownerId === null)
        );

        if (unownedProvinces.length === 0) {
            alert('No unowned estates to distribute!');
            return;
        }

        let html = '<h2>Distribute Estates</h2>';
        html += '<p>This feature is simplified - estates will be auto-distributed.</p>';
        html += '<button onclick="UI.autoDistributeEstates()">Auto-Distribute</button>';
        html += '<button onclick="UI.closeModal()">Cancel</button>';

        this.showModal(html);
    },

    // Auto-distribute estates
    autoDistributeEstates() {
        const emperor = GameState.getEmperor();
        const province = GameState.state.provinces.find(p =>
            p.estates.some(e => e.ownerId === null)
        );

        if (province) {
            const unowned = province.estates.filter(e => e.ownerId === null);
            const perPlayer = Math.floor(unowned.length / GameState.state.players.length);

            const distribution = {};
            GameState.state.players.forEach(player => {
                distribution[player.id] = perPlayer;
            });

            Actions.distributeEstates(emperor, province.id, distribution, GameState);
        }

        this.closeModal();
        this.render();
    },

    // Show influence counter dialog
    showInfluenceCounterDialog(emperor) {
        let html = '<h2>Influence the Counter</h2>';
        html += '<p>Choose direction to shift the Empire:</p>';
        html += '<button onclick="UI.influenceCounter(\'up\')">Toward Virtue (+3, cost 15g, +2V, -2S)</button><br>';
        html += '<button onclick="UI.influenceCounter(\'down\')">Toward Popularity (-3, cost 15g, +2S, -1V)</button><br>';
        html += '<button onclick="UI.closeModal()">Cancel</button>';

        this.showModal(html);
    },

    // Influence counter
    influenceCounter(direction) {
        const emperor = GameState.getEmperor();
        Actions.influenceCounter(emperor, direction, GameState);
        this.closeModal();
        this.render();
    },

    // Show victory screen
    showVictoryScreen(winner) {
        let html = '<h1>🏛️ VICTORY! 🏛️</h1>';
        html += `<h2>${winner.name} has won the game!</h2>`;
        html += `<p>The ${winner.name} family has established a dynasty with 4 successive emperors!</p>`;
        html += '<button onclick="location.reload()">New Game</button>';

        this.showModal(html);
    },

    // Show modal
    showModal(html) {
        const modal = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        content.innerHTML = html;
        modal.style.display = 'flex';
    },

    // Close modal
    closeModal() {
        const modal = document.getElementById('modal-overlay');
        modal.style.display = 'none';
    }
};
