// Firebase Service - Handles all real-time database operations

class FirebaseService {
    constructor() {
        this.db = null;
        this.roomRef = null;
        this.playerId = null;
        this.roomCode = null;
        this.listeners = [];
        this.isHost = false;
        this.connected = false;
    }

    // Initialize Firebase
    init() {
        try {
            // Check if Firebase config is set
            if (firebaseConfig.apiKey === "YOUR_API_KEY") {
                console.warn('Firebase not configured. Please update js/config.js with your Firebase credentials.');
                return false;
            }

            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();

            // Monitor connection state
            this.db.ref('.info/connected').on('value', (snap) => {
                this.connected = snap.val() === true;
                this.onConnectionChange(this.connected);
            });

            // Generate unique player ID
            this.playerId = this.generatePlayerId();
            sessionStorage.setItem('playerId', this.playerId);

            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }

    // Generate unique player ID
    generatePlayerId() {
        const stored = sessionStorage.getItem('playerId');
        if (stored) return stored;
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Generate room code
    generateRoomCode() {
        const chars = gameConfig.roomCodeChars;
        let code = '';
        for (let i = 0; i < gameConfig.roomCodeLength; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Create a new room
    async createRoom(playerName) {
        const roomCode = this.generateRoomCode();
        const roomData = {
            code: roomCode,
            host: this.playerId,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            settings: {
                game: 'rps',
                bestOf: gameConfig.defaultRounds
            },
            players: {
                [this.playerId]: {
                    name: playerName || 'Player 1',
                    joinedAt: firebase.database.ServerValue.TIMESTAMP,
                    online: true,
                    isHost: true
                }
            },
            state: 'lobby', // lobby, playing, finished
            game: null
        };

        try {
            this.roomRef = this.db.ref('rooms/' + roomCode);
            await this.roomRef.set(roomData);
            this.roomCode = roomCode;
            this.isHost = true;

            // Set up presence
            this.setupPresence();

            return { success: true, roomCode };
        } catch (error) {
            console.error('Failed to create room:', error);
            return { success: false, error: error.message };
        }
    }

    // Join existing room
    async joinRoom(roomCode, playerName) {
        roomCode = roomCode.toUpperCase().trim();

        try {
            this.roomRef = this.db.ref('rooms/' + roomCode);
            const snapshot = await this.roomRef.once('value');

            if (!snapshot.exists()) {
                return { success: false, error: 'Room not found' };
            }

            const roomData = snapshot.val();

            // Check if room is full
            const playerCount = Object.keys(roomData.players || {}).length;
            if (playerCount >= 2) {
                // Check if current player is already in the room
                if (!roomData.players[this.playerId]) {
                    return { success: false, error: 'Room is full' };
                }
            }

            // Check room state
            if (roomData.state === 'playing') {
                return { success: false, error: 'Game already in progress' };
            }

            // Add player to room
            await this.roomRef.child('players/' + this.playerId).set({
                name: playerName || 'Player 2',
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                online: true,
                isHost: false
            });

            this.roomCode = roomCode;
            this.isHost = roomData.host === this.playerId;

            // Set up presence
            this.setupPresence();

            return { success: true, roomCode };
        } catch (error) {
            console.error('Failed to join room:', error);
            return { success: false, error: error.message };
        }
    }

    // Set up presence (online/offline detection)
    setupPresence() {
        if (!this.roomRef) return;

        const playerRef = this.roomRef.child('players/' + this.playerId);
        const onlineRef = playerRef.child('online');
        const lastSeenRef = playerRef.child('lastSeen');

        // When disconnected, set online to false
        onlineRef.onDisconnect().set(false);
        lastSeenRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);

        // Keep updating lastSeen while connected
        this.presenceInterval = setInterval(() => {
            if (this.connected) {
                lastSeenRef.set(firebase.database.ServerValue.TIMESTAMP);
            }
        }, 10000);
    }

    // Update game settings
    async updateSettings(settings) {
        if (!this.roomRef || !this.isHost) return false;

        try {
            await this.roomRef.child('settings').update(settings);
            return true;
        } catch (error) {
            console.error('Failed to update settings:', error);
            return false;
        }
    }

    // Start the game
    async startGame(settings) {
        if (!this.roomRef || !this.isHost) return false;

        try {
            const gameData = {
                type: settings.game || 'rps',
                bestOf: settings.bestOf || 3,
                currentRound: 1,
                scores: {},
                rounds: {},
                startedAt: firebase.database.ServerValue.TIMESTAMP
            };

            // Initialize scores for all players
            const snapshot = await this.roomRef.child('players').once('value');
            const players = snapshot.val();
            Object.keys(players).forEach(playerId => {
                gameData.scores[playerId] = 0;
            });

            await this.roomRef.update({
                state: 'playing',
                game: gameData
            });

            return true;
        } catch (error) {
            console.error('Failed to start game:', error);
            return false;
        }
    }

    // Submit player choice for current round
    async submitChoice(choice) {
        if (!this.roomRef) return false;

        try {
            const gameSnapshot = await this.roomRef.child('game').once('value');
            const game = gameSnapshot.val();
            const currentRound = game.currentRound;

            await this.roomRef.child(`game/rounds/${currentRound}/${this.playerId}`).set({
                choice: choice,
                submittedAt: firebase.database.ServerValue.TIMESTAMP
            });

            return true;
        } catch (error) {
            console.error('Failed to submit choice:', error);
            return false;
        }
    }

    // Advance to next round (host only)
    async nextRound() {
        if (!this.roomRef || !this.isHost) return false;

        try {
            const gameSnapshot = await this.roomRef.child('game').once('value');
            const game = gameSnapshot.val();

            await this.roomRef.child('game/currentRound').set(game.currentRound + 1);
            return true;
        } catch (error) {
            console.error('Failed to advance round:', error);
            return false;
        }
    }

    // Update score
    async updateScore(playerId, score) {
        if (!this.roomRef) return false;

        try {
            await this.roomRef.child(`game/scores/${playerId}`).set(score);
            return true;
        } catch (error) {
            console.error('Failed to update score:', error);
            return false;
        }
    }

    // End game
    async endGame(winner) {
        if (!this.roomRef) return false;

        try {
            await this.roomRef.update({
                state: 'finished',
                'game/winner': winner,
                'game/finishedAt': firebase.database.ServerValue.TIMESTAMP
            });
            return true;
        } catch (error) {
            console.error('Failed to end game:', error);
            return false;
        }
    }

    // Reset game (return to lobby)
    async resetGame() {
        if (!this.roomRef || !this.isHost) return false;

        try {
            await this.roomRef.update({
                state: 'lobby',
                game: null
            });
            return true;
        } catch (error) {
            console.error('Failed to reset game:', error);
            return false;
        }
    }

    // Subscribe to room changes
    onRoomUpdate(callback) {
        if (!this.roomRef) return;

        const listener = this.roomRef.on('value', (snapshot) => {
            callback(snapshot.val());
        });
        this.listeners.push({ ref: this.roomRef, event: 'value', listener });
    }

    // Subscribe to game changes only
    onGameUpdate(callback) {
        if (!this.roomRef) return;

        const gameRef = this.roomRef.child('game');
        const listener = gameRef.on('value', (snapshot) => {
            callback(snapshot.val());
        });
        this.listeners.push({ ref: gameRef, event: 'value', listener });
    }

    // Subscribe to player changes
    onPlayersUpdate(callback) {
        if (!this.roomRef) return;

        const playersRef = this.roomRef.child('players');
        const listener = playersRef.on('value', (snapshot) => {
            callback(snapshot.val());
        });
        this.listeners.push({ ref: playersRef, event: 'value', listener });
    }

    // Connection change callback
    onConnectionChange(connected) {
        // Override in app.js
    }

    // Leave room
    async leaveRoom() {
        if (this.roomRef && this.playerId) {
            try {
                await this.roomRef.child('players/' + this.playerId + '/online').set(false);
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        }

        // Clean up
        this.cleanup();
    }

    // Clean up listeners and intervals
    cleanup() {
        // Remove all listeners
        this.listeners.forEach(({ ref, event, listener }) => {
            ref.off(event, listener);
        });
        this.listeners = [];

        // Clear presence interval
        if (this.presenceInterval) {
            clearInterval(this.presenceInterval);
        }

        this.roomRef = null;
        this.roomCode = null;
        this.isHost = false;
    }

    // Get player ID
    getPlayerId() {
        return this.playerId;
    }

    // Get room code
    getRoomCode() {
        return this.roomCode;
    }

    // Check if host
    getIsHost() {
        return this.isHost;
    }
}

// Create global instance
window.firebaseService = new FirebaseService();
