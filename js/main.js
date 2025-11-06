// Main Game Initialization and Loop
document.addEventListener('DOMContentLoaded', () => {
    // Show setup modal
    showSetupModal();
});

// Show setup modal
function showSetupModal() {
    const setupModal = document.getElementById('setup-modal');
    const playerCountSelect = document.getElementById('player-count');
    const playerNamesContainer = document.getElementById('player-names-container');
    const startButton = document.getElementById('btn-start-game');

    // Generate player name inputs
    playerCountSelect.addEventListener('change', () => {
        generatePlayerNameInputs();
    });

    startButton.addEventListener('click', () => {
        startGame();
    });

    // Initial generation
    generatePlayerNameInputs();

    setupModal.style.display = 'flex';
}

// Generate player name input fields
function generatePlayerNameInputs() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    const container = document.getElementById('player-names-container');

    container.innerHTML = '';

    const familyNames = [
        'Julia', 'Cornelia', 'Claudia', 'Aemilia',
        'Valeria', 'Octavia', 'Servilia'
    ];

    for (let i = 0; i < playerCount; i++) {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = `Player ${i + 1} Family Name:`;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `player-name-${i}`;
        input.value = `${familyNames[i]} Familia`;
        input.placeholder = 'Enter family name';

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        container.appendChild(inputGroup);
    }
}

// Start the game
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

    // Hide setup modal
    document.getElementById('setup-modal').style.display = 'none';

    // Hide game container initially
    document.getElementById('game-container').style.display = 'none';

    // Initialize game
    GameState.init(playerCount, playerNames);

    // Initialize UI
    UI.init();

    // Show game container
    document.getElementById('game-container').style.display = 'block';

    // Start first turn
    UI.startTurn();
}

// Helper functions for global access
window.UI = UI;
window.GameState = GameState;
window.Player = Player;
window.Actions = Actions;
window.Marriage = Marriage;
window.Succession = Succession;
window.CardDefinitions = CardDefinitions;

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press 'Enter' to end turn
    if (e.key === 'Enter' && !document.querySelector('.modal')) {
        const endTurnBtn = document.getElementById('btn-end-turn');
        if (!endTurnBtn.disabled) {
            endTurnBtn.click();
        }
    }

    // Press 'S' to save game
    if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        GameState.save();
        alert('Game saved!');
    }

    // Press 'L' to load game
    if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        if (confirm('Load saved game? Current progress will be lost.')) {
            if (GameState.load()) {
                UI.render();
                alert('Game loaded!');
            } else {
                alert('No saved game found!');
            }
        }
    }
});

// Auto-save every 30 seconds
setInterval(() => {
    if (GameState.state.phase !== 'setup') {
        GameState.save();
    }
}, 30000);

console.log('Roman Dynasty Game initialized!');
console.log('Press Ctrl+S to save, Ctrl+L to load');
