// Main Application Controller

class App {
    constructor() {
        this.currentScreen = 'landing';
        this.playerName = 'Player';
        this.players = {};
        this.gameState = null;
        this.opponentId = null;

        this.init();
    }

    init() {
        // Initialize Firebase
        const firebaseReady = firebaseService.init();

        if (!firebaseReady) {
            this.showConfigurationGuide();
            return;
        }

        // Set up connection status callback
        firebaseService.onConnectionChange = (connected) => {
            this.updateConnectionStatus(connected);
        };

        // Bind UI events
        this.bindEvents();

        // Check for room code in URL
        this.checkUrlRoomCode();

        // Get player name from storage
        this.playerName = localStorage.getItem('playerName') || 'Player';
    }

    showConfigurationGuide() {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="screen active" style="text-align: left; max-width: 600px;">
                <h1 class="title" style="text-align: center;">Setup Required</h1>
                <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
                    To enable multiplayer functionality, you need to configure Firebase:
                </p>
                <ol style="line-height: 2; color: var(--text-primary);">
                    <li>Go to <a href="https://console.firebase.google.com/" target="_blank" style="color: var(--primary-color);">Firebase Console</a></li>
                    <li>Create a new project (free tier is sufficient)</li>
                    <li>Go to <strong>Build → Realtime Database</strong> and create a database</li>
                    <li>Set database rules to allow read/write (for testing):
                        <pre style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin: 0.5rem 0; overflow-x: auto;">
{
  "rules": {
    ".read": true,
    ".write": true
  }
}</pre>
                    </li>
                    <li>Go to <strong>Project Settings → Your apps → Add app (Web)</strong></li>
                    <li>Copy the config values to <code style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px;">js/config.js</code></li>
                    <li>Refresh this page</li>
                </ol>
                <p style="margin-top: 1.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                    Note: For production, set proper security rules to protect your database.
                </p>
            </div>
        `;
    }

    bindEvents() {
        // Landing screen
        document.getElementById('btn-create-room').addEventListener('click', () => this.createRoom());
        document.getElementById('btn-join-room').addEventListener('click', () => this.toggleJoinForm());
        document.getElementById('btn-submit-join').addEventListener('click', () => this.joinRoom());
        document.getElementById('room-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });

        // Lobby screen
        document.getElementById('btn-copy-code').addEventListener('click', () => this.copyRoomCode());
        document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());
        document.getElementById('btn-leave-room').addEventListener('click', () => this.leaveRoom());
        document.getElementById('rounds-select').addEventListener('change', (e) => this.updateSettings({ bestOf: parseInt(e.target.value) }));

        // Game screen - choice buttons
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', () => this.makeChoice(btn.dataset.choice));
        });
        document.getElementById('btn-next-round').addEventListener('click', () => this.nextRound());

        // Game over screen
        document.getElementById('btn-play-again').addEventListener('click', () => this.playAgain());
        document.getElementById('btn-back-lobby').addEventListener('click', () => this.backToLobby());
    }

    checkUrlRoomCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        if (roomCode) {
            document.getElementById('room-code-input').value = roomCode;
            this.toggleJoinForm(true);
        }
    }

    // Screen management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId + '-screen').classList.add('active');
        this.currentScreen = screenId;
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Connection status
    updateConnectionStatus(connected) {
        const status = document.getElementById('connection-status');
        const text = status.querySelector('.status-text');

        status.classList.remove('connected', 'disconnected');

        if (connected) {
            status.classList.add('connected');
            text.textContent = 'Connected';
        } else {
            status.classList.add('disconnected');
            text.textContent = 'Disconnected';
        }
    }

    // Room management
    async createRoom() {
        const name = this.promptPlayerName();
        if (!name) return;

        const result = await firebaseService.createRoom(name);

        if (result.success) {
            this.setupRoomListeners();
            this.showScreen('lobby');
            document.getElementById('room-code-display').textContent = result.roomCode;

            // Update URL with room code
            const url = new URL(window.location);
            url.searchParams.set('room', result.roomCode);
            window.history.replaceState({}, '', url);

            this.showToast('Room created! Share the code with your teammate.', 'success');
        } else {
            this.showToast('Failed to create room: ' + result.error, 'error');
        }
    }

    toggleJoinForm(show) {
        const form = document.getElementById('join-form');
        if (show === undefined) {
            form.classList.toggle('hidden');
        } else {
            form.classList.toggle('hidden', !show);
        }

        if (!form.classList.contains('hidden')) {
            document.getElementById('room-code-input').focus();
        }
    }

    async joinRoom() {
        const roomCode = document.getElementById('room-code-input').value.trim();
        if (!roomCode) {
            this.showToast('Please enter a room code', 'error');
            return;
        }

        const name = this.promptPlayerName();
        if (!name) return;

        const result = await firebaseService.joinRoom(roomCode, name);

        if (result.success) {
            this.setupRoomListeners();
            this.showScreen('lobby');
            document.getElementById('room-code-display').textContent = result.roomCode;

            // Update URL with room code
            const url = new URL(window.location);
            url.searchParams.set('room', result.roomCode);
            window.history.replaceState({}, '', url);

            this.showToast('Joined room successfully!', 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    }

    promptPlayerName() {
        const stored = localStorage.getItem('playerName');
        const name = prompt('Enter your name:', stored || 'Player');

        if (name && name.trim()) {
            this.playerName = name.trim();
            localStorage.setItem('playerName', this.playerName);
            return this.playerName;
        }

        return stored || 'Player';
    }

    setupRoomListeners() {
        // Listen for room updates
        firebaseService.onRoomUpdate((room) => {
            if (!room) {
                this.showToast('Room was closed', 'error');
                this.leaveRoom();
                return;
            }

            this.updatePlayers(room.players);
            this.updateLobbyUI(room);

            // Handle state changes
            if (room.state === 'playing' && this.currentScreen !== 'game') {
                this.gameState = room.game;
                this.startGameUI(room);
            } else if (room.state === 'playing') {
                this.updateGameUI(room);
            } else if (room.state === 'lobby' && this.currentScreen === 'gameover') {
                this.showScreen('lobby');
            }
        });
    }

    updatePlayers(players) {
        this.players = players;
        const myId = firebaseService.getPlayerId();
        const playerIds = Object.keys(players);

        // Find opponent
        this.opponentId = playerIds.find(id => id !== myId);

        // Update lobby UI
        const slot1 = document.getElementById('player1-slot');
        const slot2 = document.getElementById('player2-slot');

        // Player 1 (current user)
        const myPlayer = players[myId];
        if (myPlayer) {
            slot1.querySelector('.player-name').textContent = myPlayer.name + ' (You)';
            slot1.classList.add('connected', 'you');
        }

        // Player 2 (opponent)
        if (this.opponentId && players[this.opponentId]) {
            const opponent = players[this.opponentId];
            slot2.querySelector('.player-name').textContent = opponent.name;
            slot2.classList.toggle('connected', opponent.online);
        } else {
            slot2.querySelector('.player-name').textContent = 'Waiting...';
            slot2.classList.remove('connected');
        }
    }

    updateLobbyUI(room) {
        const isHost = firebaseService.getIsHost();
        const startBtn = document.getElementById('btn-start-game');
        const roundsSelect = document.getElementById('rounds-select');

        // Enable start button only for host when 2 players
        const playerCount = Object.keys(room.players).filter(id => room.players[id].online).length;
        startBtn.disabled = !isHost || playerCount < 2;

        // Only host can change settings
        roundsSelect.disabled = !isHost;

        if (room.settings) {
            roundsSelect.value = room.settings.bestOf;
        }
    }

    async updateSettings(settings) {
        await firebaseService.updateSettings(settings);
    }

    copyRoomCode() {
        const code = firebaseService.getRoomCode();
        const url = window.location.origin + window.location.pathname + '?room=' + code;

        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback - just copy the code
            navigator.clipboard.writeText(code).then(() => {
                this.showToast('Room code copied!', 'success');
            });
        });
    }

    async startGame() {
        const settings = {
            game: 'rps',
            bestOf: parseInt(document.getElementById('rounds-select').value)
        };

        const success = await firebaseService.startGame(settings);
        if (!success) {
            this.showToast('Failed to start game', 'error');
        }
    }

    startGameUI(room) {
        rpsGame.resetGame();
        this.showScreen('game');

        const myId = firebaseService.getPlayerId();
        const myName = this.players[myId]?.name || 'You';
        const opponentName = this.players[this.opponentId]?.name || 'Opponent';

        // Update labels
        document.getElementById('p1-label').textContent = myName;
        document.getElementById('p2-label').textContent = opponentName;
        document.getElementById('score-p1-name').textContent = myName;
        document.getElementById('score-p2-name').textContent = opponentName;

        // Reset UI
        this.resetRoundUI(room.game);
    }

    updateGameUI(room) {
        const game = room.game;
        if (!game) return;

        this.gameState = game;
        const myId = firebaseService.getPlayerId();
        const currentRound = game.currentRound;

        // Update scores
        document.getElementById('score-p1').textContent = game.scores[myId] || 0;
        document.getElementById('score-p2').textContent = game.scores[this.opponentId] || 0;

        // Update round info
        document.getElementById('current-round').textContent = currentRound;
        document.getElementById('total-rounds').textContent = game.bestOf;

        // Check for round submissions
        const roundData = game.rounds?.[currentRound];
        if (roundData) {
            const myChoice = roundData[myId]?.choice;
            const opponentChoice = roundData[this.opponentId]?.choice;

            // Update status indicators
            document.getElementById('p1-status').textContent = myChoice ? 'Ready!' : '';
            document.getElementById('p1-status').classList.toggle('ready', !!myChoice);
            document.getElementById('p2-status').textContent = opponentChoice ? 'Ready!' : 'Choosing...';
            document.getElementById('p2-status').classList.toggle('ready', !!opponentChoice);

            // If both have chosen, reveal
            if (myChoice && opponentChoice) {
                this.revealChoices(myId, myChoice, this.opponentId, opponentChoice, game);
            }
        }
    }

    async makeChoice(choice) {
        // Check if already chose
        if (rpsGame.getMyChoice()) return;

        rpsGame.setMyChoice(choice);

        // Update UI immediately
        const buttons = document.querySelectorAll('.choice-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.choice === choice);
            btn.disabled = true;
        });

        document.getElementById('p1-choice').classList.add('selected');
        document.getElementById('p1-choice').querySelector('.choice-emoji').textContent = rpsGame.getEmoji(choice);
        document.getElementById('p1-status').textContent = 'Ready!';
        document.getElementById('p1-status').classList.add('ready');

        // Submit to Firebase
        await firebaseService.submitChoice(choice);
    }

    revealChoices(myId, myChoice, opponentId, opponentChoice, game) {
        // Disable buttons during reveal
        document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = true);

        // Show choices
        const p1ChoiceEl = document.getElementById('p1-choice');
        const p2ChoiceEl = document.getElementById('p2-choice');

        p1ChoiceEl.querySelector('.choice-emoji').textContent = rpsGame.getEmoji(myChoice);
        p2ChoiceEl.querySelector('.choice-emoji').textContent = rpsGame.getEmoji(opponentChoice);

        // Process result
        const result = rpsGame.processRound(myId, myChoice, opponentId, opponentChoice, myId);

        // Add visual feedback
        setTimeout(() => {
            p1ChoiceEl.classList.remove('selected');
            p2ChoiceEl.classList.remove('selected');

            if (result.myResult === 'win') {
                p1ChoiceEl.classList.add('winner');
                p2ChoiceEl.classList.add('loser');
            } else if (result.myResult === 'lose') {
                p1ChoiceEl.classList.add('loser');
                p2ChoiceEl.classList.add('winner');
            }

            // Show result text
            const resultDisplay = document.getElementById('result-display');
            const resultText = document.getElementById('result-text');
            resultDisplay.classList.remove('hidden');
            resultText.textContent = result.resultText;
            resultText.className = result.myResult;

            // Add to history
            rpsGame.addToHistory(game.currentRound, myChoice, opponentChoice, result.myResult);

            // Update score if host
            if (firebaseService.getIsHost() && result.winnerId) {
                const newScore = (game.scores[result.winnerId] || 0) + 1;
                firebaseService.updateScore(result.winnerId, newScore);

                // Check for match winner
                const updatedScores = { ...game.scores, [result.winnerId]: newScore };
                const matchWinner = rpsGame.checkMatchWinner(updatedScores, game.bestOf);

                if (matchWinner) {
                    setTimeout(() => {
                        firebaseService.endGame(matchWinner);
                        this.showGameOver(matchWinner, updatedScores, game.bestOf);
                    }, 1500);
                    return;
                }
            }

            // Show next round button (host only)
            if (firebaseService.getIsHost()) {
                document.getElementById('game-actions').classList.remove('hidden');
                document.getElementById('choice-buttons').classList.add('hidden');
            }
        }, gameConfig.revealDelay);
    }

    async nextRound() {
        await firebaseService.nextRound();
        this.resetRoundUI(this.gameState);
    }

    resetRoundUI(game) {
        rpsGame.resetRound();

        // Reset choices display
        document.getElementById('p1-choice').querySelector('.choice-emoji').textContent = '❓';
        document.getElementById('p2-choice').querySelector('.choice-emoji').textContent = '❓';
        document.getElementById('p1-choice').classList.remove('selected', 'winner', 'loser');
        document.getElementById('p2-choice').classList.remove('selected', 'winner', 'loser');

        // Reset status
        document.getElementById('p1-status').textContent = '';
        document.getElementById('p1-status').classList.remove('ready');
        document.getElementById('p2-status').textContent = 'Choosing...';
        document.getElementById('p2-status').classList.remove('ready');

        // Hide result
        document.getElementById('result-display').classList.add('hidden');

        // Reset buttons
        const buttons = document.querySelectorAll('.choice-btn');
        buttons.forEach(btn => {
            btn.classList.remove('selected');
            btn.disabled = false;
        });

        // Show choice buttons, hide next round button
        document.getElementById('choice-buttons').classList.remove('hidden');
        document.getElementById('game-actions').classList.add('hidden');

        // Update round number
        if (game) {
            document.getElementById('current-round').textContent = game.currentRound;
        }
    }

    showGameOver(winnerId, scores, bestOf) {
        this.showScreen('gameover');

        const myId = firebaseService.getPlayerId();
        const myName = this.players[myId]?.name || 'You';
        const opponentName = this.players[this.opponentId]?.name || 'Opponent';

        // Update names
        document.getElementById('final-p1-name').textContent = myName;
        document.getElementById('final-p2-name').textContent = opponentName;

        // Update score
        document.getElementById('final-score').textContent = `${scores[myId] || 0} - ${scores[this.opponentId] || 0}`;

        // Winner announcement
        const announcement = document.getElementById('winner-announcement');
        announcement.classList.remove('you-win', 'you-lose', 'draw');

        if (winnerId === myId) {
            announcement.textContent = '🎉 You Win! 🎉';
            announcement.classList.add('you-win');
        } else if (winnerId === this.opponentId) {
            announcement.textContent = opponentName + ' Wins!';
            announcement.classList.add('you-lose');
        } else {
            announcement.textContent = "It's a Draw!";
            announcement.classList.add('draw');
        }

        // Build history
        this.buildHistoryUI();

        // Only host can initiate play again
        document.getElementById('btn-play-again').style.display = firebaseService.getIsHost() ? 'block' : 'none';
        document.getElementById('btn-back-lobby').style.display = firebaseService.getIsHost() ? 'block' : 'none';
    }

    buildHistoryUI() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        const history = rpsGame.getHistory();
        history.forEach(round => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="history-round">Round ${round.round}</span>
                <span class="history-choices">
                    ${rpsGame.getEmoji(round.myChoice)} vs ${rpsGame.getEmoji(round.opponentChoice)}
                </span>
                <span class="history-result ${round.result}">${round.result.toUpperCase()}</span>
            `;
            historyList.appendChild(item);
        });
    }

    async playAgain() {
        await firebaseService.startGame({
            game: 'rps',
            bestOf: this.gameState?.bestOf || 3
        });
    }

    async backToLobby() {
        await firebaseService.resetGame();
        rpsGame.resetGame();
        this.showScreen('lobby');
    }

    async leaveRoom() {
        await firebaseService.leaveRoom();

        // Clear URL
        const url = new URL(window.location);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url);

        // Reset UI
        this.showScreen('landing');
        document.getElementById('join-form').classList.add('hidden');
        document.getElementById('room-code-input').value = '';

        this.showToast('Left the room', 'info');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
