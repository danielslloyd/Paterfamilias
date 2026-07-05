// UI Rendering and Updates
const UI = {
    selectedCardIndex: -1,
    pendingCard: null, // card awaiting target selection

    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.querySelectorAll('.action-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAction(e.currentTarget.dataset.action);
            });
        });

        document.querySelectorAll('.imperial-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleImperialAction(e.currentTarget.dataset.action);
            });
        });

        document.getElementById('btn-play-card').addEventListener('click', () => this.handlePlayCard());
        document.getElementById('btn-discard-card').addEventListener('click', () => this.handleDiscardCard());
        document.getElementById('btn-end-turn').addEventListener('click', () => this.handleEndTurn());
        document.getElementById('btn-read-omens').addEventListener('click', () => this.handleReadOmens());
        document.getElementById('btn-declare-emperor').addEventListener('click', () => this.handleDeclareEmperor());
        document.getElementById('btn-divorce').addEventListener('click', () => this.showDivorceDialog());
    },

    // --- Core actions ---------------------------------------------------

    handleAction(action) {
        if (GameState.state.phase === 'game_over') return;
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
                return; // dialog renders on its own schedule
            case 'plot-coup':
                this.showCoupDialog(player);
                return;
        }
        this.render();
    },

    handleDeclareEmperor() {
        const player = GameState.getCurrentPlayer();
        const threshold = GameState.getImperialThreshold();
        this.showModal(`
            <h2>👑 Claim the Purple?</h2>
            <p>${player.paterfamilias.name} stands ready to declare himself the first Emperor of Rome
            (Auctoritas ${player.auctoritas} ≥ threshold ${threshold}).</p>
            <p>The Emperor taxes every family, commands the legions, and begins the dynasty count —
            but wears a target on his back.</p>
            <button class="primary-btn" onclick="UI.confirmDeclareEmperor()">Declare!</button>
            <button onclick="UI.closeModal()">Not yet</button>
        `);
    },

    confirmDeclareEmperor() {
        Actions.declareEmperor(GameState.getCurrentPlayer(), GameState);
        this.closeModal();
        this.render();
    },

    // --- Coup ------------------------------------------------------------

    showCoupDialog(player) {
        const emperor = GameState.getEmperor();
        if (!emperor) return;
        if (player.actionTaken) {
            GameState.log(`The ${player.name} have already taken their action this turn.`);
            this.render();
            return;
        }
        const coupCost = Succession.getCoupCost(GameState);
        if (player.gold < coupCost) {
            GameState.log(`Plotting a coup requires ${coupCost} gold.`);
            this.render();
            return;
        }

        const odds = Succession.getCoupOdds(player, GameState);
        let html = `<h2>⚔️ Plot Against Emperor ${emperor.paterfamilias.name}?</h2>`;
        html += `<div class="coup-odds">
            <div>Your strength: <strong>${odds.attack}</strong></div>
            <div>Emperor's defense: <strong>${odds.defense}</strong></div>
            <div class="coup-chance">Estimated chance of success: <strong>${Math.round(odds.chance * 100)}%</strong></div>
        </div>`;
        if (odds.kinDefenders.length > 0) {
            html += `<p class="coup-warning">The Emperor's kin stand with him: ${odds.kinDefenders.join(', ')}.</p>`;
        }
        if (odds.againstKin) {
            html += `<p class="coup-warning">⚠️ The Emperor is YOUR KIN — plotting against him is impiety (-${GameConfig.kinImpietyPenalty.auctoritas} Auctoritas, -${GameConfig.kinImpietyPenalty.popularSupport} Support).</p>`;
        }
        html += `<p>Cost: ${coupCost} gold. <strong>If the coup fails, your paterfamilias dies.</strong>
            If it succeeds, the succession formula chooses the next Emperor — not necessarily you.</p>`;
        html += `<button class="danger-btn" onclick="UI.confirmCoup()">Unsheathe the Daggers</button>`;
        html += `<button onclick="UI.closeModal()">Stay Loyal</button>`;
        this.showModal(html);
    },

    confirmCoup() {
        const player = GameState.getCurrentPlayer();
        this.closeModal();
        Actions.plotCoup(player, GameState);
        this.checkVictoryAndRender();
    },

    // --- Divorce -----------------------------------------------------------

    showDivorceDialog() {
        const player = GameState.getCurrentPlayer();
        if (!player.wife) return;
        const cost = GameConfig.divorceCost;
        const wifeFamily = GameState.getPlayer(player.wife.fromFamily);
        this.showModal(`
            <h2>Divorce ${player.wife.name}?</h2>
            <p>She will return to the ${wifeFamily ? wifeFamily.name : '?'} and your tribute to them ends —
            but so do all kin benefits, and Rome will mutter.</p>
            <p>Cost: ${cost.gold} gold, ${cost.auctoritas} Auctoritas, ${cost.popularSupport} Support.
            You will suffer the unmarried penalty until you remarry.</p>
            <button class="danger-btn" onclick="UI.confirmDivorce()">Divorce Her</button>
            <button onclick="UI.closeModal()">Remain Married</button>
        `);
    },

    confirmDivorce() {
        Marriage.divorce(GameState.getCurrentPlayer(), GameState);
        this.closeModal();
        this.render();
    },

    // --- Imperial actions --------------------------------------------------

    handleImperialAction(action) {
        if (GameState.state.phase === 'game_over') return;
        const emperor = GameState.getEmperor();
        if (!emperor || emperor.id !== GameState.getCurrentPlayer().id) return;

        switch (action) {
            case 'set-tax-rate':
                this.showTaxRateDialog(emperor);
                break;
            case 'launch-campaign':
                this.showCampaignDialog(emperor);
                break;
            case 'distribute-estates':
                this.showDistributeEstatesDialog(emperor);
                break;
            case 'influence-counter':
                this.showInfluenceCounterDialog(emperor);
                break;
        }
    },

    showCampaignDialog(emperor) {
        const status = GameState.getMilitaryStatus();
        if (!status.nextProvince) {
            this.showModal(`<h2>Launch Campaign</h2><p>The whole known world already bows to Rome!</p><button onclick="UI.closeModal()">Close</button>`);
            return;
        }
        let failureChance = GameConfig.campaignBaseFailureChance;
        if (Player.hasPaterTrait(emperor, 'Military Prowess')) failureChance -= GameConfig.militaryProwessCampaignBonus;
        if (emperor.effects.some(e => e.type === 'campaign_sabotage')) failureChance += 0.30;

        this.showModal(`
            <h2>Launch Campaign: ${status.nextProvince}</h2>
            <p>Cost: ${GameConfig.campaignCost} gold. Success chance: ~${Math.round((1 - failureChance) * 100)}%.</p>
            <p>Legions: ${status.current} (need ${status.nextConquestRequired} to hold new territory
            ${status.canConquer ? '— <span class="good">sufficient!</span>' : '— <span class="bad">too weak: a victory will win glory but no land</span>'}).</p>
            <button class="primary-btn" onclick="UI.confirmCampaign()">March!</button>
            <button onclick="UI.closeModal()">Cancel</button>
        `);
    },

    confirmCampaign() {
        Actions.launchCampaign(GameState.getEmperor(), GameState);
        this.closeModal();
        this.render();
    },

    // --- Cards ---------------------------------------------------------------

    handlePlayCard() {
        if (this.selectedCardIndex === -1) return;

        const player = GameState.getCurrentPlayer();
        const card = player.hand[this.selectedCardIndex];
        if (!card) return;

        if (card.needsTarget) {
            this.showTargetSelectionDialog(card);
            return;
        }
        this.executeCardPlay(null);
    },

    executeCardPlay(targetPlayer) {
        const player = GameState.getCurrentPlayer();
        const played = Actions.playCard(player, this.selectedCardIndex, targetPlayer, GameState);
        this.selectedCardIndex = -1;

        // Senate Motion asks for a counter direction after resolving
        if (played && player.pendingCounterShift) {
            delete player.pendingCounterShift;
            this.showModal(`
                <h2>🏛️ The Senate Votes</h2>
                <p>Which way do you bend Rome's institutions?</p>
                <button onclick="UI.applySenateShift(1)">Toward Virtue (+2)</button>
                <button onclick="UI.applySenateShift(-1)">Toward Popularity (-2)</button>
            `);
            return;
        }
        this.checkVictoryAndRender();
    },

    applySenateShift(direction) {
        const state = GameState.state;
        state.counter = Math.max(1, Math.min(GameConfig.counterMaximum, state.counter + direction * 2));
        GameState.log(`The Senate shifts Rome ${direction > 0 ? 'toward Virtue' : 'toward Popularity'} (counter now ${state.counter}).`);
        this.closeModal();
        this.render();
    },

    showTargetSelectionDialog(card) {
        const currentPlayer = GameState.getCurrentPlayer();
        let html = `<h2>Select Target for ${card.name}</h2>`;

        GameState.state.players.forEach(player => {
            if (player.id !== currentPlayer.id) {
                const kin = GameState.areKin(currentPlayer, player);
                html += `<button class="target-btn" onclick="UI.selectTarget(${player.id})">
                    <span class="family-dot" style="background:${GameConfig.playerColors[player.id]}"></span>
                    ${player.name}${kin ? ' <span class="kin-tag">KIN</span>' : ''}
                </button>`;
            }
        });
        html += '<button onclick="UI.cancelTargetSelection()">Cancel</button>';
        this.showModal(html);
    },

    selectTarget(playerId) {
        this.closeModal();
        this.executeCardPlay(GameState.getPlayer(playerId));
    },

    cancelTargetSelection() {
        this.closeModal();
        this.render();
    },

    handleDiscardCard() {
        if (this.selectedCardIndex === -1) return;
        Actions.discardCard(GameState.getCurrentPlayer(), this.selectedCardIndex, GameState);
        this.selectedCardIndex = -1;
        this.render();
    },

    // --- Turn flow ---------------------------------------------------------

    handleEndTurn() {
        if (GameState.state.phase === 'game_over') return;
        const player = GameState.getCurrentPlayer();

        Actions.drawCards(player, GameConfig.cardsDrawnPerTurn);
        Actions.endTurn(player, GameState);
        Player.resetTurnFlags(player);
        this.selectedCardIndex = -1;

        if (this.checkVictory()) return;

        GameState.nextPlayer();
        this.startTurn();
    },

    startTurn() {
        if (GameState.state.phase === 'game_over') return;
        const player = GameState.getCurrentPlayer();

        Actions.processIncome(player, GameState);
        Succession.checkDynastyProgress(GameState);

        if (this.checkVictory()) return;

        this.render();
        this.showTurnBanner(player);
    },

    // Hot-seat handoff banner
    showTurnBanner(player) {
        const color = GameConfig.playerColors[player.id];
        const emperor = GameState.getEmperor();
        const isEmperor = emperor && emperor.id === player.id;
        this.showModal(`
            <div class="turn-banner" style="border-color:${color}">
                <h2 style="color:${color}">${player.name}</h2>
                <p>${isEmperor ? '👑 Emperor ' : ''}${player.paterfamilias.name}, age ${player.paterfamilias.age}</p>
                <button class="primary-btn" onclick="UI.closeModal()">Begin Turn</button>
            </div>
        `);
    },

    checkVictory() {
        const winner = GameState.checkWinCondition();
        if (winner) {
            if (GameState.state.phase !== 'game_over') {
                Succession.handleVictory(winner, GameState);
            }
            this.render();
            this.showVictoryScreen(winner);
            return true;
        }
        return false;
    },

    checkVictoryAndRender() {
        if (!this.checkVictory()) this.render();
    },

    // --- Rendering -----------------------------------------------------------

    render() {
        this.renderHeader();
        this.renderBalanceBar();
        this.renderPlayersTopBar();
        this.renderPlayerPanel();
        this.renderObligations();
        this.renderEffects();
        this.renderActionButtons();
        this.renderEventQueue();
        this.renderHand();
        this.renderImperialSection();
        this.renderMilitaryStatus();
        this.renderMap();
        this.renderGameLog();
        this.updateCardControls();
    },

    renderHeader() {
        document.getElementById('turn-display').textContent = `Turn: ${GameState.state.turn}`;

        const emperor = GameState.getEmperor();
        document.getElementById('emperor-display').textContent =
            emperor ? `👑 Emperor: ${emperor.paterfamilias.name} of the ${emperor.name}` : '🏛️ The Republic';

        document.getElementById('threshold-display').textContent =
            `Imperial threshold: ${GameState.getImperialThreshold()} Auctoritas`;
    },

    renderBalanceBar() {
        const counter = GameState.state.counter;
        document.getElementById('balance-marker').style.left = `calc(${counter}% - 2px)`;
        const weights = GameState.getCounterWeights();
        document.getElementById('counter-value').textContent =
            `${Math.round(weights.popularity * 100)}% / ${Math.round(weights.virtue * 100)}%`;
    },

    renderPlayersTopBar() {
        const currentPlayer = GameState.getCurrentPlayer();
        const topBar = document.getElementById('players-top-bar');
        topBar.innerHTML = '';

        GameState.state.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.style.borderTopColor = GameConfig.playerColors[player.id];

            if (player.id === currentPlayer.id) playerCard.classList.add('current-turn');
            const isEmperor = GameState.state.emperorId === player.id;
            if (isEmperor) playerCard.classList.add('is-emperor');

            const wifeFamily = player.wife ? GameState.getPlayer(player.wife.fromFamily) : null;
            const motherFamily = player.mother ? GameState.getPlayer(player.mother.fromFamily) : null;

            const ties = [];
            if (wifeFamily) ties.push(`⚭ <span style="color:${GameConfig.playerColors[wifeFamily.id]}">${wifeFamily.name}</span>`);
            if (motherFamily) ties.push(`♀ <span style="color:${GameConfig.playerColors[motherFamily.id]}">${motherFamily.name}</span>`);

            const sons = player.children.filter(c => c.gender === 'male').length;
            const daughters = player.children.filter(c => c.gender === 'female').length;

            playerCard.innerHTML = `
                <div class="player-card-header">
                    <span>${player.name}${isEmperor ? ' 👑' : ''}</span>
                </div>
                <div class="player-card-resources">
                    ${player.gold}g | S:${player.popularSupport} | V:${player.auctoritas} | E:${player.estates.length}
                </div>
                <div class="player-card-family">
                    ${player.paterfamilias.name} (${player.paterfamilias.age})${player.wife ? '' : ' <span class="unmarried-tag">unwed</span>'}
                    · ${sons}♂ ${daughters}♀
                </div>
                <div class="player-card-ties">${ties.join(' &nbsp; ') || '<span class="bad">no ties</span>'}</div>
            `;
            topBar.appendChild(playerCard);
        });
    },

    traitBadges(traits, isFemale) {
        const info = isFemale ? GameConfig.femaleTraitInfo : GameConfig.maleTraitInfo;
        return traits.map(t =>
            `<span class="trait-badge" title="${info[t] || t}">${t}</span>`
        ).join(' ');
    },

    renderPlayerPanel() {
        const player = GameState.getCurrentPlayer();

        const nameEl = document.getElementById('current-player-name');
        nameEl.textContent = player.name;
        nameEl.style.color = GameConfig.playerColors[player.id];

        document.getElementById('player-gold').textContent = player.gold;
        document.getElementById('player-popularity').textContent = player.popularSupport;
        document.getElementById('player-virtue').textContent = player.auctoritas;
        document.getElementById('player-estates').textContent = player.estates.length;
        document.getElementById('player-income').textContent = Player.calculateEstateIncome(player);

        const pf = player.paterfamilias;
        document.getElementById('paterfamilias-info').innerHTML = `
            <strong>Paterfamilias:</strong> ${pf.name}, age ${pf.age}
            <span class="death-risk" title="Chance of death this turn">(${Math.round(Player.deathChance(pf.age) * 100)}% ☠)</span>
            <br>${this.traitBadges(pf.traits, false) || '<small>no traits</small>'}
        `;

        const wifeInfo = document.getElementById('wife-info');
        if (player.wife) {
            const wifeFamily = GameState.getPlayer(player.wife.fromFamily);
            wifeInfo.innerHTML = `
                <strong>Wife:</strong> ${player.wife.name}
                <span class="family-ref" style="color:${GameConfig.playerColors[wifeFamily.id]}">of the ${wifeFamily.name}</span>
                <br>${this.traitBadges(player.wife.traits, true)}
            `;
        } else {
            wifeInfo.innerHTML = `<strong>Wife:</strong> <span class="bad">Unmarried! (-${GameConfig.unmarriedPenaltyPerTurn} Support/turn)</span>`;
        }

        const motherInfo = document.getElementById('mother-info');
        if (player.mother) {
            const motherFamily = GameState.getPlayer(player.mother.fromFamily);
            motherInfo.innerHTML = `
                <strong>Mother:</strong> ${player.mother.name}
                <span class="family-ref" style="color:${GameConfig.playerColors[motherFamily.id]}">of the ${motherFamily.name}</span>
                <br>${this.traitBadges(player.mother.traits, true)}
            `;
        } else {
            motherInfo.innerHTML = '<strong>Mother:</strong> <small>none (ties severed)</small>';
        }

        const childrenInfo = document.getElementById('children-info');
        let childrenHTML = '<strong>Children:</strong>';
        if (player.children.length > 0) {
            childrenHTML += '<ul>';
            [...player.children].sort((a, b) => b.age - a.age).forEach(child => {
                const heir = child.gender === 'male' && child.age >= GameConfig.heirMinimumAge;
                const marriageable = child.gender === 'female' && child.age >= GameConfig.minimumMarriageAge;
                childrenHTML += `<li>${child.gender === 'male' ? '♂' : '♀'} ${child.name} (${child.age})
                    ${heir ? '<span class="heir-tag">heir</span>' : ''}
                    ${marriageable ? '<span class="bride-tag">marriageable</span>' : ''}
                    <br><small>${this.traitBadges(child.traits, child.gender === 'female')}</small></li>`;
            });
            childrenHTML += '</ul>';
        } else {
            childrenHTML += ' <span class="bad">none — the line is in danger!</span>';
        }
        if (player.betrothal) {
            const bFam = GameState.getPlayer(player.betrothal.fromFamily);
            childrenHTML += `<div class="betrothal-note">⚭ Heir betrothed to ${player.betrothal.name} of the ${bFam ? bFam.name : '?'}</div>`;
        }
        childrenInfo.innerHTML = childrenHTML;

        const successionCount = document.getElementById('succession-count');
        if (GameState.state.dynastyCounter.familyId !== null) {
            const dynastyFamily = GameState.getPlayer(GameState.state.dynastyCounter.familyId);
            successionCount.innerHTML = `
                <strong style="color:${GameConfig.playerColors[dynastyFamily.id]}">${dynastyFamily.name}:</strong>
                ${GameState.state.dynastyCounter.count} / ${GameConfig.dynastyWinThreshold} successive emperors
            `;
        } else {
            successionCount.innerHTML = 'No dynasty established yet';
        }
    },

    // The web of obligations: who you pay, who pays you, kin benefits
    renderObligations() {
        const player = GameState.getCurrentPlayer();
        const el = document.getElementById('obligations-info');
        let html = '';

        const income = Player.calculateEstateIncome(player);

        // Outgoing
        html += '<div class="obligation-group"><strong>You owe:</strong><ul>';
        let owesAny = false;
        if (GameState.state.emperorId !== null && GameState.state.emperorId !== player.id) {
            const emperor = GameState.getEmperor();
            html += `<li>${Math.round(GameState.state.taxRate * 100)}% tax → <span style="color:${GameConfig.playerColors[emperor.id]}">${emperor.name}</span> (Emperor)</li>`;
            owesAny = true;
        }
        if (player.mother && player.tributeRates.toMother > 0) {
            const fam = GameState.getPlayer(player.mother.fromFamily);
            html += `<li>${Math.round(player.tributeRates.toMother * 100)}% tribute → <span style="color:${GameConfig.playerColors[fam.id]}">${fam.name}</span> (mother ${player.mother.name})</li>`;
            owesAny = true;
        }
        if (player.wife && player.tributeRates.toWife > 0) {
            const fam = GameState.getPlayer(player.wife.fromFamily);
            html += `<li>${Math.round(player.tributeRates.toWife * 100)}% tribute → <span style="color:${GameConfig.playerColors[fam.id]}">${fam.name}</span> (wife ${player.wife.name})</li>`;
            owesAny = true;
        }
        if (!owesAny) html += '<li><small>nothing — free of the web</small></li>';
        html += '</ul></div>';

        // Incoming
        html += '<div class="obligation-group"><strong>Owed to you:</strong><ul>';
        let receivesAny = false;
        GameState.state.players.forEach(other => {
            if (other.id === player.id) return;
            if (other.wife && other.wife.fromFamily === player.id && other.tributeRates.toWife > 0) {
                html += `<li>${Math.round(other.tributeRates.toWife * 100)}% from <span style="color:${GameConfig.playerColors[other.id]}">${other.name}</span> (${other.wife.name}'s marriage)</li>`;
                receivesAny = true;
            }
            if (other.mother && other.mother.fromFamily === player.id && other.tributeRates.toMother > 0) {
                html += `<li>${Math.round(other.tributeRates.toMother * 100)}% from <span style="color:${GameConfig.playerColors[other.id]}">${other.name}</span> (${other.mother.name}, matriarch)</li>`;
                receivesAny = true;
            }
        });
        if (!receivesAny) html += '<li><small>no one — marry off your daughters!</small></li>';
        html += '</ul></div>';

        // Kin status
        const emperor = GameState.getEmperor();
        if (emperor && emperor.id !== player.id && GameState.areKin(player, emperor)) {
            html += `<div class="kin-note">👑 You are kin to the Emperor: +${GameConfig.kinEmperorSupportPerTurn} Support/turn, and you rally to his defense in coups.</div>`;
        }

        el.innerHTML = html;
    },

    renderEffects() {
        const player = GameState.getCurrentPlayer();
        const el = document.getElementById('effects-info');
        if (player.effects.length === 0) {
            el.innerHTML = '<small>none</small>';
            return;
        }
        el.innerHTML = player.effects.map(e =>
            `<div class="effect-entry">${e.name}${e.duration !== undefined ? ` <small>(${e.duration} turns)</small>` : ''}</div>`
        ).join('');
    },

    renderActionButtons() {
        const player = GameState.getCurrentPlayer();
        const gameOver = GameState.state.phase === 'game_over';

        document.querySelectorAll('.action-btn[data-action]').forEach(btn => {
            btn.disabled = player.actionTaken || gameOver;
        });

        // Marriage only when unmarried and brides exist
        const marriageBtn = document.querySelector('[data-action="marriage-negotiation"]');
        if (player.wife) {
            marriageBtn.disabled = true;
            marriageBtn.title = 'Already married';
        } else {
            marriageBtn.title = 'Negotiate a marriage with another family.';
        }

        // Coup only during Empire, when not the emperor
        const coupBtn = document.getElementById('btn-plot-coup');
        const emperor = GameState.getEmperor();
        const coupPossible = emperor && emperor.id !== player.id;
        coupBtn.style.display = coupPossible ? 'inline-block' : 'none';
        if (coupPossible) {
            const coupCost = Succession.getCoupCost(GameState);
            coupBtn.disabled = player.actionTaken || player.gold < coupCost || gameOver;
            coupBtn.textContent = `⚔️ Plot Coup (${coupCost}g)`;
        }

        // Declare emperor (free action, Republic only)
        const declareBtn = document.getElementById('btn-declare-emperor');
        const canDeclare = !gameOver && GameState.state.emperorId === null && GameState.checkImperialThreshold(player.auctoritas);
        declareBtn.style.display = canDeclare ? 'inline-block' : 'none';

        // Divorce (free action, married only)
        const divorceBtn = document.getElementById('btn-divorce');
        divorceBtn.style.display = (!gameOver && player.wife) ? 'inline-block' : 'none';

        document.getElementById('action-status').textContent =
            player.actionTaken ? '(action taken)' : '(choose one)';

        document.getElementById('btn-end-turn').disabled = gameOver;
    },

    renderEventQueue() {
        const queueDisplay = document.getElementById('event-queue-display');
        queueDisplay.innerHTML = '';

        const queue = GameState.state.eventQueue;
        if (queue.length === 0) {
            queueDisplay.innerHTML = '<p class="no-events">No omens in the queue</p>';
            return;
        }

        const queueContainer = document.createElement('div');
        queueContainer.className = 'event-queue-container';

        queue.forEach((eventCard, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'event-card';

            if (eventCard.faceUp) {
                cardElement.classList.add('face-up');
                cardElement.innerHTML = `
                    <div class="event-card-header">${index + 1}</div>
                    <div class="event-card-name">${eventCard.name}</div>
                    <div class="event-card-type">${eventCard.type === 'empire_wide' ? '🌍' : '🎯'}</div>
                `;
                cardElement.title = eventCard.description;
            } else {
                cardElement.classList.add('face-down');
                cardElement.innerHTML = `
                    <div class="event-card-header">${index + 1}</div>
                    <div class="event-card-back">?</div>
                `;
                cardElement.title = 'Face down — read the omens to reveal';
            }
            queueContainer.appendChild(cardElement);
        });
        queueDisplay.appendChild(queueContainer);

        const player = GameState.getCurrentPlayer();
        const omensBtn = document.getElementById('btn-read-omens');
        const cost = Math.max(1, GameConfig.readOmensCost - Player.femaleTraitCount(player, 'Pious') * GameConfig.piousOmensDiscount);
        omensBtn.textContent = `🔮 Read the Omens (${cost} Gold)`;
        omensBtn.disabled = player.gold < cost || GameState.state.phase === 'game_over';
    },

    handleReadOmens() {
        const player = GameState.getCurrentPlayer();
        if (Actions.readOmens(player, GameState)) {
            this.showOmensRevealedDialog();
        }
        this.render();
    },

    showOmensRevealedDialog() {
        const queue = GameState.state.eventQueue;
        const revealCount = Math.min(GameConfig.readOmensRevealCount, queue.length);

        let html = '<h2>🔮 The Omens Revealed</h2><div class="revealed-omens">';
        for (let i = 0; i < revealCount; i++) {
            if (queue[i]) {
                html += `
                    <div class="revealed-omen">
                        <strong>${i + 1}. ${queue[i].name}</strong>
                        <p>${queue[i].description}</p>
                    </div>`;
            }
        }
        html += '</div><button class="primary-btn" onclick="UI.closeModal()">Close</button>';
        this.showModal(html);
    },

    renderHand() {
        const player = GameState.getCurrentPlayer();
        const handContainer = document.getElementById('hand-cards');
        handContainer.innerHTML = '';

        const cardIcons = {
            military: '⚔️', political: '🏛️', intrigue: '🗡️',
            economic: '💰', religious: '⛪'
        };

        player.hand.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            if (index === this.selectedCardIndex) cardDiv.classList.add('selected');

            const cost = Player.getCardCost(player, card);
            if (!Player.canAfford(player, cost)) cardDiv.classList.add('unaffordable');

            const costParts = [];
            if (cost.gold) {
                const discounted = card.cost.gold && cost.gold < card.cost.gold;
                costParts.push(discounted ? `<s>${card.cost.gold}</s> ${cost.gold} Gold` : `${cost.gold} Gold`);
            }
            if (cost.auctoritas) costParts.push(`${cost.auctoritas} Auctoritas`);
            if (cost.popularSupport) costParts.push(`${cost.popularSupport} Support`);

            cardDiv.innerHTML = `
                <div class="card-header">
                    <span class="card-type-icon">${cardIcons[card.type] || '📜'}</span>
                    <strong>${card.name}</strong>
                </div>
                <div class="card-cost">${costParts.join(', ') || 'Free'}</div>
                <div class="card-description">${card.description}</div>
            `;
            cardDiv.addEventListener('click', () => {
                this.selectedCardIndex = (this.selectedCardIndex === index) ? -1 : index;
                this.render();
            });
            handContainer.appendChild(cardDiv);
        });
    },

    updateCardControls() {
        const player = GameState.getCurrentPlayer();
        const gameOver = GameState.state.phase === 'game_over';
        document.getElementById('btn-play-card').disabled =
            this.selectedCardIndex === -1 || player.cardPlayed || gameOver;
        document.getElementById('btn-discard-card').disabled =
            this.selectedCardIndex === -1 || gameOver;
    },

    renderImperialSection() {
        const player = GameState.getCurrentPlayer();
        const emperor = GameState.getEmperor();
        document.getElementById('imperial-section').style.display =
            (emperor && emperor.id === player.id) ? 'block' : 'none';
    },

    renderMilitaryStatus() {
        const militaryInfo = document.getElementById('military-info');
        const status = GameState.getMilitaryStatus();
        const statusClass = status.status === 'Stable' ? 'military-stable' : 'military-at-risk';

        let html = `
            <div class="military-bar-track" title="Legion strength vs. what the empire needs">
                <div class="military-bar-fill ${status.surplus < 0 ? 'military-bar-low' : ''}"
                     style="width:${Math.min(100, Math.round(status.current / Math.max(status.nextConquestRequired, 1) * 100))}%"></div>
                <div class="military-bar-required" style="left:${Math.min(100, Math.round(status.required / Math.max(status.nextConquestRequired, 1) * 100))}%"></div>
            </div>
            <div><strong>Strength:</strong> ${status.current} / <strong>needed:</strong> ${status.required}
                <span class="${statusClass}">(${status.status})</span></div>
        `;
        if (status.nextProvince) {
            html += `<div class="next-conquest"><strong>Next conquest:</strong> ${status.nextProvince}
                (need ${status.nextConquestRequired})${status.canConquer ? ' <span class="good">✓ ready</span>' : ''}</div>`;
        } else {
            html += `<div class="next-conquest">The known world is Roman.</div>`;
        }
        html += `<div class="military-hint"><small>Weak legions cause revolts. Coups and successions drain them. Contributions are a gift to all of Rome — and to whoever wears the purple.</small></div>`;
        militaryInfo.innerHTML = html;
    },

    renderMap() {
        RomanMap.render('empire-map-container', GameState.state, () => {
            this.renderProvinceDetail();
            this.renderMap();
        });
        this.renderMapLegend();
        this.renderProvinceDetail();
    },

    renderMapLegend() {
        const legend = document.getElementById('map-legend');
        let html = '';
        GameState.state.players.forEach(p => {
            html += `<span class="legend-item"><span class="family-dot" style="background:${GameConfig.playerColors[p.id]}"></span>${p.name}</span>`;
        });
        html += `<span class="legend-item"><span class="legend-swatch legend-unconquered"></span>Unconquered</span>`;
        html += `<span class="legend-item"><span class="legend-swatch legend-next"></span>Next target</span>`;
        legend.innerHTML = html;
    },

    renderProvinceDetail() {
        const el = document.getElementById('province-detail');
        const id = RomanMap.selectedProvinceId;
        if (id === null || id === undefined) {
            el.innerHTML = '<small>Click a province for details.</small>';
            return;
        }
        const province = GameState.state.provinces.find(p => p.id === id);
        if (!province) { el.innerHTML = ''; return; }

        let html = `<strong>${province.name}</strong> <small>(${province.yearLabel})</small><br>`;
        if (province.conquered) {
            const counts = {};
            let unowned = 0;
            province.estates.forEach(e => {
                if (e.ownerId === null) unowned++;
                else counts[e.ownerId] = (counts[e.ownerId] || 0) + 1;
            });
            html += `${province.estates.length} estates:`;
            html += '<ul>';
            Object.keys(counts).forEach(ownerId => {
                const owner = GameState.getPlayer(parseInt(ownerId));
                html += `<li><span class="family-dot" style="background:${GameConfig.playerColors[owner.id]}"></span>${owner.name}: ${counts[ownerId]}</li>`;
            });
            if (unowned > 0) html += `<li>Undistributed: ${unowned}</li>`;
            html += '</ul>';
        } else {
            html += `<span class="bad">Unconquered</span> — ${province.estates.length} estates await Rome's legions.`;
        }
        el.innerHTML = html;
    },

    renderGameLog() {
        const logMessages = document.getElementById('log-messages');
        logMessages.innerHTML = '';
        GameState.state.gameLog.slice(0, 15).forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = `[T${entry.turn}] ${entry.message}`;
            logMessages.appendChild(logEntry);
        });
    },

    // --- Marriage negotiation (hot-seat, two-sided) -------------------------

    showMarriageDialog(player) {
        const eligible = Marriage.getEligibleFamilies(player, GameState);

        if (player.wife) {
            this.showModal(`<h2>Marriage Negotiation</h2><p>You are already married.</p><button onclick="UI.closeModal()">Close</button>`);
            return;
        }
        if (eligible.length === 0) {
            this.showModal(`<h2>Marriage Negotiation</h2>
                <p>No family has a marriageable daughter for you (14+, not your own family, not your mother's family).</p>
                <p><small>Daughters come of age as turns pass — or another family may offer a Betrothal Pact.</small></p>
                <button onclick="UI.closeModal()">Close</button>`);
            return;
        }

        let html = '<h2>Marriage Negotiation</h2><p>Choose a bride. Her traits serve your household for a generation — and her family collects your tribute.</p>';
        eligible.forEach(option => {
            html += `<div class="marriage-option">
                <h3><span class="family-dot" style="background:${GameConfig.playerColors[option.player.id]}"></span>${option.player.name}</h3>`;
            option.daughters.forEach((daughter, dIdx) => {
                const dowry = Marriage.getDowry(player, daughter);
                html += `<button class="bride-btn" onclick="UI.openNegotiation(${option.player.id}, ${dIdx})">
                    ${daughter.name} (${daughter.age}) — ${daughter.traits.join(', ')} <small>· dowry ${dowry}g</small>
                </button>`;
            });
            html += `</div>`;
        });
        html += '<button onclick="UI.closeModal()">Cancel</button>';
        this.showModal(html);
    },

    openNegotiation(familyId, daughterIdx) {
        const player = GameState.getCurrentPlayer();
        const targetFamily = GameState.getPlayer(familyId);
        const daughters = targetFamily.children.filter(c => c.gender === 'female' && c.age >= GameConfig.minimumMarriageAge);
        const daughter = daughters[daughterIdx];
        if (!daughter) { this.closeModal(); return; }

        this.negotiation = { familyId, daughterName: daughter.name };

        const dowry = Marriage.getDowry(player, daughter);
        const min = Math.round(GameConfig.tributeRateMin * 100);
        const max = Math.round(GameConfig.tributeRateMax * 100);
        const step = Math.round(GameConfig.tributeRateStep * 100);

        let options = '';
        for (let r = min; r <= max; r += step) {
            options += `<option value="${r}" ${r === 10 ? 'selected' : ''}>${r}%</option>`;
        }

        this.showModal(`
            <h2>Negotiate for ${daughter.name}</h2>
            <p>Of the ${targetFamily.name} — traits: <strong>${daughter.traits.join(', ')}</strong></p>
            <p>Dowry (paid now): <strong>${dowry} gold</strong>${player.gold < dowry ? ' <span class="bad">(you cannot afford this!)</span>' : ''}</p>
            <div class="form-group">
                <label>Offered tribute (% of your income, every turn, to the ${targetFamily.name} — and to be inherited by your heir's mother-tie):</label>
                <select id="tribute-offer">${options}</select>
            </div>
            <button class="primary-btn" ${player.gold < dowry ? 'disabled' : ''} onclick="UI.submitProposal()">Propose</button>
            <button onclick="UI.closeModal()">Cancel</button>
        `);
    },

    submitProposal() {
        const rate = parseInt(document.getElementById('tribute-offer').value) / 100;
        this.negotiation.tributeRate = rate;

        const player = GameState.getCurrentPlayer();
        const targetFamily = GameState.getPlayer(this.negotiation.familyId);

        // Hand the seat to the other player for a decision
        this.showModal(`
            <div class="handoff-note">Pass the seat to <strong style="color:${GameConfig.playerColors[targetFamily.id]}">${targetFamily.name}</strong></div>
            <h2>A Proposal from the ${player.name}</h2>
            <p>${player.paterfamilias.name} asks for the hand of <strong>${this.negotiation.daughterName}</strong>, offering:</p>
            <ul>
                <li>Dowry now: <strong>${this.currentDowry()} gold</strong></li>
                <li>Tribute: <strong>${Math.round(this.negotiation.tributeRate * 100)}%</strong> of their income, every turn</li>
                <li>Kinship: your families become kin — shared festivals, coup loyalty, imperial favor</li>
            </ul>
            <button class="primary-btn" onclick="UI.acceptProposal(false)">Accept</button>
            <button onclick="UI.counterProposal()">Demand ${Math.min(Math.round(GameConfig.tributeRateMax * 100), Math.round(this.negotiation.tributeRate * 100) + 5)}%</button>
            <button class="danger-btn" onclick="UI.declineProposal()">Refuse</button>
        `);
    },

    currentDowry() {
        const targetFamily = GameState.getPlayer(this.negotiation.familyId);
        const daughter = targetFamily.children.find(c => c.name === this.negotiation.daughterName);
        return daughter ? Marriage.getDowry(GameState.getCurrentPlayer(), daughter) : GameConfig.baseDowry;
    },

    counterProposal() {
        const player = GameState.getCurrentPlayer();
        const targetFamily = GameState.getPlayer(this.negotiation.familyId);
        const counter = Math.min(GameConfig.tributeRateMax, this.negotiation.tributeRate + 0.05);
        this.negotiation.counterRate = counter;

        this.showModal(`
            <div class="handoff-note">Back to <strong style="color:${GameConfig.playerColors[player.id]}">${player.name}</strong></div>
            <h2>The ${targetFamily.name} Demand More</h2>
            <p>They will give ${this.negotiation.daughterName}'s hand for <strong>${Math.round(counter * 100)}%</strong> tribute (instead of ${Math.round(this.negotiation.tributeRate * 100)}%).</p>
            <button class="primary-btn" onclick="UI.acceptProposal(true)">Agree to ${Math.round(counter * 100)}%</button>
            <button class="danger-btn" onclick="UI.declineProposal()">Walk Away</button>
        `);
    },

    acceptProposal(useCounterRate) {
        const player = GameState.getCurrentPlayer();
        const targetFamily = GameState.getPlayer(this.negotiation.familyId);
        const daughter = targetFamily.children.find(c => c.name === this.negotiation.daughterName);
        const rate = useCounterRate ? this.negotiation.counterRate : this.negotiation.tributeRate;

        if (daughter && Marriage.concludeMarriage(player, targetFamily, daughter, rate, GameState)) {
            player.actionTaken = true; // a concluded marriage is the core action
        }
        this.negotiation = null;
        this.closeModal();
        this.render();
    },

    declineProposal() {
        const player = GameState.getCurrentPlayer();
        const targetFamily = GameState.getPlayer(this.negotiation.familyId);
        GameState.log(`The ${targetFamily.name} refuse the ${player.name}'s marriage proposal.`);
        this.negotiation = null;
        this.closeModal();
        this.render();
    },

    // --- Imperial dialogs ------------------------------------------------------

    showTaxRateDialog(emperor) {
        const current = Math.round(GameState.state.taxRate * 100);
        this.showModal(`
            <h2>Set Tax Rate</h2>
            <p>Current rate: ${current}%. Raising taxes angers the people (one-time hit and an ongoing drain); lowering them buys love.</p>
            <input type="range" id="tax-slider" min="0" max="50" step="10" value="${current}">
            <p>New rate: <span id="tax-value">${current}</span>%</p>
            <button class="primary-btn" onclick="UI.confirmTaxRate()">Confirm</button>
            <button onclick="UI.closeModal()">Cancel</button>
        `);
        document.getElementById('tax-slider').addEventListener('input', (e) => {
            document.getElementById('tax-value').textContent = e.target.value;
        });
    },

    confirmTaxRate() {
        const newRate = parseInt(document.getElementById('tax-slider').value) / 100;
        Actions.setTaxRate(GameState.getEmperor(), newRate, GameState);
        this.closeModal();
        this.render();
    },

    showDistributeEstatesDialog(emperor) {
        const provincesWithLand = GameState.state.provinces.filter(p =>
            p.conquered && p.estates.some(e => e.ownerId === null)
        );

        if (provincesWithLand.length === 0) {
            this.showModal(`<h2>Distribute Estates</h2><p>No undistributed estates in the empire.</p><button onclick="UI.closeModal()">Close</button>`);
            return;
        }

        const province = provincesWithLand[0];
        const unowned = province.estates.filter(e => e.ownerId === null).length;
        this.distribution = { provinceId: province.id, total: unowned, alloc: {} };
        GameState.state.players.forEach(p => { this.distribution.alloc[p.id] = 0; });

        this.renderDistributionModal();
    },

    renderDistributionModal() {
        const dist = this.distribution;
        const province = GameState.state.provinces.find(p => p.id === dist.provinceId);
        const allocated = Object.values(dist.alloc).reduce((a, b) => a + b, 0);
        const remaining = dist.total - allocated;

        let html = `<h2>Distribute Estates: ${province.name}</h2>
            <p>${dist.total} estates to grant. Patronage buys friends — or feeds your own coffers.
            <strong>Remaining: ${remaining}</strong></p>`;

        GameState.state.players.forEach(p => {
            html += `<div class="dist-row">
                <span class="family-dot" style="background:${GameConfig.playerColors[p.id]}"></span>
                <span class="dist-name">${p.name}${p.id === GameState.state.emperorId ? ' (you)' : ''}</span>
                <button onclick="UI.adjustDistribution(${p.id}, -1)" ${dist.alloc[p.id] <= 0 ? 'disabled' : ''}>−</button>
                <span class="dist-count">${dist.alloc[p.id]}</span>
                <button onclick="UI.adjustDistribution(${p.id}, 1)" ${remaining <= 0 ? 'disabled' : ''}>+</button>
            </div>`;
        });

        html += `<button class="primary-btn" ${allocated === 0 ? 'disabled' : ''} onclick="UI.confirmDistribution()">Grant Estates</button>`;
        html += `<button onclick="UI.closeModal()">Cancel</button>`;
        this.showModal(html);
    },

    adjustDistribution(playerId, delta) {
        this.distribution.alloc[playerId] = Math.max(0, this.distribution.alloc[playerId] + delta);
        this.renderDistributionModal();
    },

    confirmDistribution() {
        Actions.distributeEstates(GameState.getEmperor(), this.distribution.provinceId, this.distribution.alloc, GameState);
        this.distribution = null;
        this.closeModal();
        this.render();
    },

    showInfluenceCounterDialog(emperor) {
        this.showModal(`
            <h2>Influence Rome's Institutions</h2>
            <p>Cost: ${GameConfig.counterInfluenceCost} gold. Shift the succession rules toward your strength.</p>
            <button onclick="UI.influenceCounter('up')">Toward Virtue (+${GameConfig.counterInfluenceShift}) — +${GameConfig.counterInfluenceVirtueBonus} Auctoritas, -${GameConfig.counterInfluencePopularityBonus} Support</button><br>
            <button onclick="UI.influenceCounter('down')">Toward Popularity (-${GameConfig.counterInfluenceShift}) — +${GameConfig.counterInfluencePopularityBonus} Support, -1 Auctoritas</button><br>
            <button onclick="UI.closeModal()">Cancel</button>
        `);
    },

    influenceCounter(direction) {
        Actions.influenceCounter(GameState.getEmperor(), direction, GameState);
        this.closeModal();
        this.render();
    },

    showVictoryScreen(winner) {
        this.showModal(`
            <h1>🏛️ VICTORY 🏛️</h1>
            <h2 style="color:${GameConfig.playerColors[winner.id]}">The ${winner.name} rule Rome!</h2>
            <p>${GameConfig.dynastyWinThreshold} successive emperors — a dynasty for the ages.</p>
            <button class="primary-btn" onclick="location.reload()">New Game</button>
        `);
    },

    showModal(html) {
        document.getElementById('modal-content').innerHTML = html;
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    }
};
