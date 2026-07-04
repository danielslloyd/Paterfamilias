// Main Game Initialization and Loop
document.addEventListener('DOMContentLoaded', () => {
    showSetupModal();
});

function showSetupModal() {
    const setupModal = document.getElementById('setup-modal');
    const playerCountSelect = document.getElementById('player-count');
    const startButton = document.getElementById('btn-start-game');

    playerCountSelect.addEventListener('change', () => {
        generatePlayerNameInputs();
    });

    startButton.addEventListener('click', () => {
        startGame();
    });

    generatePlayerNameInputs();
    setupModal.style.display = 'flex';
}

function generatePlayerNameInputs() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    const container = document.getElementById('player-names-container');

    container.innerHTML = '';

    const familyNames = ['Julii', 'Cornelii', 'Claudii', 'Aemilii', 'Valerii', 'Octavii', 'Servilii'];

    for (let i = 0; i < playerCount; i++) {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = `Player ${i + 1} Family Name:`;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `player-name-${i}`;
        input.value = familyNames[i];
        input.placeholder = 'Enter family name';

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        container.appendChild(inputGroup);
    }
}

function startGame() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    const playerNames = [];

    for (let i = 0; i < playerCount; i++) {
        const name = document.getElementById(`player-name-${i}`).value.trim();
        if (!name) {
            alert(`Please enter a name for Player ${i + 1}`);
            return;
        }
        playerNames.push(name);
    }

    document.getElementById('setup-modal').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';

    GameState.init(playerCount, playerNames);
    UI.init();

    document.getElementById('game-container').style.display = 'block';
    UI.startTurn();
}

// Global access for inline onclick handlers and console debugging
window.UI = UI;
window.GameState = GameState;
window.Player = Player;
window.Actions = Actions;
window.Marriage = Marriage;
window.Succession = Succession;
window.CardDefinitions = CardDefinitions;
window.RomanMap = RomanMap;

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    const inSetup = document.getElementById('setup-modal').style.display !== 'none' &&
                    document.getElementById('setup-modal').style.display !== '';
    const gameStarted = GameState.state.players.length > 0 && GameState.state.phase !== 'setup';

    // Enter ends the turn (when no modal is open)
    if (e.key === 'Enter' && gameStarted && !inSetup &&
        document.getElementById('modal-overlay').style.display !== 'flex' &&
        document.activeElement.tagName !== 'INPUT') {
        const endTurnBtn = document.getElementById('btn-end-turn');
        if (!endTurnBtn.disabled) {
            endTurnBtn.click();
        }
    }

    // Ctrl+S saves
    if (e.key === 's' && e.ctrlKey && gameStarted) {
        e.preventDefault();
        GameState.save();
        alert('Game saved!');
    }

    // Ctrl+L loads
    if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        if (confirm('Load saved game? Current progress will be lost.')) {
            if (GameState.load()) {
                document.getElementById('setup-modal').style.display = 'none';
                document.getElementById('game-container').style.display = 'block';
                UI.render();
            } else {
                alert('No saved game found!');
            }
        }
    }
});

// Auto-save every 30 seconds
setInterval(() => {
    if (GameState.state.phase !== 'setup' && GameState.state.phase !== 'game_over') {
        GameState.save();
    }
}, 30000);

console.log('Paterfamilias initialized. Ctrl+S to save, Ctrl+L to load.');
