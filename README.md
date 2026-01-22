# Mini Games - Multiplayer Rock Paper Scissors

A real-time multiplayer mini-game platform starting with Rock Paper Scissors. Play with your teammates from any device!

## Features

- **Real-time multiplayer** - Play with teammates instantly
- **Room system** - Create or join rooms with shareable codes/links
- **Score tracking** - Track wins across rounds
- **Best of N** - Configurable match length (1, 3, 5, or 7 rounds)
- **Game history** - Review each round after the match
- **Mobile-friendly** - Works on any device

## Quick Setup

### 1. Create Firebase Project (Free)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** and follow the wizard
3. Go to **Build → Realtime Database**
4. Click **Create Database**
5. Choose your region and **Start in test mode**

### 2. Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click the **Web** icon (`</>`)
4. Register your app (any name works)
5. Copy the `firebaseConfig` values

### 3. Update Config File

Open `js/config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### 4. Deploy to GitHub Pages

1. Push this folder to your GitHub repository
2. Go to **Settings → Pages**
3. Set source to your main branch
4. Your game will be live at `https://yourusername.github.io/minigame/`

## How to Play

1. **Create a room** - One player creates a room
2. **Share the link** - Copy and share the room link/code with your teammate
3. **Join** - Teammate enters the room code or clicks the link
4. **Start game** - Host clicks "Start Game" when both players are ready
5. **Play** - Choose rock, paper, or scissors each round
6. **Win** - First to win majority of rounds wins the match!

## Project Structure

```
minigame/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # All styles
├── js/
│   ├── config.js       # Firebase & game configuration
│   ├── firebase-service.js  # Real-time database service
│   ├── game-rps.js     # Rock Paper Scissors logic
│   └── app.js          # Main application controller
└── README.md           # This file
```

## Security Note

For testing, the Firebase database is in open mode. For production:

1. Go to **Firebase Console → Realtime Database → Rules**
2. Update rules to secure your data:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['code', 'host', 'players', 'state'])"
      }
    }
  }
}
```

## Adding More Games

The platform is designed to support multiple mini-games. To add a new game:

1. Create a new game logic file (e.g., `js/game-tictactoe.js`)
2. Add game card to the lobby in `index.html`
3. Add game screen HTML
4. Handle game state in `app.js`

## License

MIT - Feel free to use and modify!
