// Firebase Configuration
// IMPORTANT: Replace these values with your own Firebase project credentials
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Go to Project Settings > General > Your apps > Add app (Web)
// 4. Copy the firebaseConfig values here

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Game Configuration
const gameConfig = {
    // Room code settings
    roomCodeLength: 6,
    roomCodeChars: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Removed confusing chars (0, O, 1, I)

    // Timeouts (in milliseconds)
    roomExpiry: 3600000, // 1 hour - rooms expire after this
    playerTimeout: 30000, // 30 seconds - player considered disconnected
    revealDelay: 500, // Delay before revealing choices

    // Game settings
    defaultRounds: 3,
    maxRounds: 7
};

// Export for use in other modules
window.firebaseConfig = firebaseConfig;
window.gameConfig = gameConfig;
