// Rock Paper Scissors Game Logic

class RPSGame {
    constructor() {
        this.choices = ['rock', 'paper', 'scissors'];
        this.emojis = {
            rock: '✊',
            paper: '✋',
            scissors: '✌️',
            unknown: '❓'
        };
        this.myChoice = null;
        this.roundHistory = [];
    }

    // Determine winner between two choices
    // Returns: 1 if choice1 wins, -1 if choice2 wins, 0 if draw
    getWinner(choice1, choice2) {
        if (choice1 === choice2) return 0;

        const wins = {
            rock: 'scissors',
            paper: 'rock',
            scissors: 'paper'
        };

        return wins[choice1] === choice2 ? 1 : -1;
    }

    // Get emoji for a choice
    getEmoji(choice) {
        return this.emojis[choice] || this.emojis.unknown;
    }

    // Process round result
    processRound(player1Id, player1Choice, player2Id, player2Choice, myPlayerId) {
        const result = this.getWinner(player1Choice, player2Choice);

        let winnerId = null;
        let resultText = '';
        let myResult = '';

        if (result === 0) {
            resultText = "It's a draw!";
            myResult = 'draw';
        } else if (result === 1) {
            winnerId = player1Id;
            if (player1Id === myPlayerId) {
                resultText = 'You win this round!';
                myResult = 'win';
            } else {
                resultText = 'Opponent wins this round!';
                myResult = 'lose';
            }
        } else {
            winnerId = player2Id;
            if (player2Id === myPlayerId) {
                resultText = 'You win this round!';
                myResult = 'win';
            } else {
                resultText = 'Opponent wins this round!';
                myResult = 'lose';
            }
        }

        return {
            winnerId,
            resultText,
            myResult,
            player1Choice,
            player2Choice
        };
    }

    // Add round to history
    addToHistory(roundNum, myChoice, opponentChoice, result) {
        this.roundHistory.push({
            round: roundNum,
            myChoice,
            opponentChoice,
            result
        });
    }

    // Get round history
    getHistory() {
        return this.roundHistory;
    }

    // Clear history
    clearHistory() {
        this.roundHistory = [];
    }

    // Check if someone has won the match (best of N)
    checkMatchWinner(scores, bestOf) {
        const winsNeeded = Math.ceil(bestOf / 2);

        for (const [playerId, score] of Object.entries(scores)) {
            if (score >= winsNeeded) {
                return playerId;
            }
        }

        return null;
    }

    // Set current player's choice
    setMyChoice(choice) {
        this.myChoice = choice;
    }

    // Get current player's choice
    getMyChoice() {
        return this.myChoice;
    }

    // Reset for new round
    resetRound() {
        this.myChoice = null;
    }

    // Reset for new game
    resetGame() {
        this.myChoice = null;
        this.roundHistory = [];
    }
}

// Create global instance
window.rpsGame = new RPSGame();
