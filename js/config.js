// Firebase Configuration
// IMPORTANT: Replace these values with your own Firebase project credentials
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Go to Project Settings > General > Your apps > Add app (Web)
// 4. Copy the firebaseConfig values here

const firebaseConfig = {
    apiKey: "AIzaSyAjI0lmgXJCLfDhajzPny1ywLzCTD0BD6s",
    authDomain: "minigame-rps.firebaseapp.com",
    databaseURL: "https://minigame-rps-default-rtdb.firebaseio.com",
    projectId: "minigame-rps",
    storageBucket: "minigame-rps.firebasestorage.app",
    messagingSenderId: "490572283160",
    appId: "1:490572283160:web:23200637bb3dfb07ceb26d",
    measurementId: "G-GDC3F5E2L8"
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
