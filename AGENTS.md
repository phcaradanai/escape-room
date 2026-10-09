# Repository Guidelines

## Project Overview
Room 25 Ultimate Digital Edition is a web-based adaptation of the sci-fi board game *Room 25*. Players coordinate or bluff across a modular 5x5 prison grid to locate the exit ("Room 25") and escape while dodging lethal hazards, shifting rooms, and hidden guards. The repository provides two distinct modes:
1. **Authoritative Online Multiplayer**: A Node.js + Express + Socket.IO server enforcing game rules, fog-of-war tile visibility, and secret role concealing.
2. **Local Standalone Hotseat**: A single-device, client-only browser application for local pass-and-play.

## Architecture & Data Flow
The application follows a server-authoritative architecture for online play and an in-memory client engine for standalone play:

```
[Browser Client (public/online-game.js)]
        │  ▲
        │  │ Socket.IO events (JSON over WebSocket)
        ▼  │
[Express / HTTP Server (server.js)]
        │
   [Room Manager (rooms Map)]
        │
   [Authoritative Game Engine]
        ├─ Action validation & execution (peek, move, push, slide)
        ├─ Room hazard triggers & resolution
        └─ State Sanitizer (getSanitizedGameState)
              ├─ Masks unrevealed tiles unless peeked privately
              ├─ Masks unrevealed programming actions
              └─ Conceals hidden guard roles in suspicion mode
```

### Key Modules
- **Game Server (`server.js`)**: Coordinates rooms (`Map<string, Room>`), player lifecycle, room code generation (4-character alphanumeric excluding ambiguous characters), action queues, and sanitized client projection.
- **Online Client (`public/online-game.js`)**: Manages lobby screens, modal dialogs, bilingual localization, dynamic DOM grid rendering, and client-side Socket.IO dispatch.
- **Audio Engine (`public/sfx.js`)**: Zero-dependency Web Audio API synthesizer (`SoundFxManager`) producing real-time procedural sound effects for alerts, clicks, slides, and hazards without external audio files.
- **Standalone Engine (`game.js`)**: Independent client-side game state engine running standalone pass-and-play in `index.html`.

## Key Directories
- `/`: Server entry point (`server.js`), standalone offline game files (`index.html`, `game.js`, `styles.css`), Windows tunnel launcher script (`start-tunnel.bat`), and bundled Cloudflare binary (`cloudflared.exe`).
- `/public`: Static web assets served by Express for online multiplayer:
  - `public/index.html`: Online lobby and game interface markup.
  - `public/online-game.js`: Multiplayer frontend logic and Socket.IO client interface.
  - `public/styles.css`: Sci-fi themed styling, neon animations, and responsive layout.
  - `public/sfx.js`: Procedural Web Audio API sound generator.

## Development Commands
No build, transpilation, or bundling step is required. Assets are plain HTML, CSS, and CommonJS/vanilla JavaScript.

- **Install Dependencies**:
  ```bash
  npm install
  ```
- **Run Online Server (Local)**:
  ```bash
  node server.js
  ```
  Starts HTTP and WebSocket server on `http://localhost:3000` (or `PORT` environment variable).
- **Run Online Server with Custom Port**:
  ```bash
  PORT=8080 node server.js
  ```
  On Windows PowerShell:
  ```powershell
  $env:PORT=8080; node server.js
  ```
- **Run with Cloudflare Tunnel (Windows)**:
  ```cmd
  start-tunnel.bat
  ```
  Launches `node server.js` in a dedicated console window and starts `cloudflared.exe tunnel --url http://localhost:3000` creating an ephemeral public URL (`*.trycloudflare.com`).
- **Run Cloudflare Tunnel Manually**:
  ```bash
  cloudflared tunnel --url http://localhost:3000
  ```
- **Run Standalone Local Game**:
  Open root `index.html` directly in any modern browser (or serve via any static file server, e.g. `npx serve .`).

## Code Conventions & Common Patterns
- **Module System**: CommonJS (`require` / `module.exports`) on backend `server.js`; vanilla browser scripts (global namespace / IIFE patterns) on the frontend.
- **Naming Conventions**:
  - Constants: `UPPER_SNAKE_CASE` (e.g., `PLAYER_COLORS`, `ROOM_DECK`, `ROOM_TYPES`).
  - Functions & Variables: `camelCase` (e.g., `buildBoard`, `getSanitizedGameState`, `advanceToNextAction`).
  - DOM Elements: `kebab-case` IDs (e.g., `#screen-menu`, `#board-grid`, `#current-player-name`).
- **State Management & Fog-of-War Pattern**:
  - The server holds complete truth: full board matrix (`5x5`), real player identities (e.g., `role: 'guard' | 'prisoner'`), and programmed actions.
  - Never broadcast raw `room.game` to clients. Always transform through `getSanitizedGameState(room, socketId)` before emitting `gameStateUpdate`.
  - Client state in `online-game.js` is replaced or reconciled upon each `gameStateUpdate` event.
- **Asynchronous Logic & Timers**:
  - Sequential turn resolutions and hazard animations rely on `setTimeout` delays (typically 800ms–1500ms) to allow clients to visualize transitions.
  - Handlers in `server.js` clear or validate `g.waitingForInput` before processing subsequent socket inputs.
- **Client Localization Pattern**:
  - Uses `data-i18n="key"` attributes in HTML and an in-memory dictionary `TRANSLATIONS[lang][key]` in `public/online-game.js`. Call `setLanguage('th' | 'en')` to trigger DOM text updates.

## Important Files
- `server.js`: Authoritative backend, Express static route, Socket.IO handlers, game mechanics, and room states.
- `public/index.html`: Client template for online multiplayer lobbies, modals, and board interface.
- `public/online-game.js`: Client-side state handler, Socket.IO client, input listener, and DOM renderer.
- `public/sfx.js`: Procedural Web Audio API sound generator.
- `start-tunnel.bat`: Automation script to spin up the local server and start the Cloudflare tunnel.
- `game.js`: Client-side standalone hotseat game engine (non-networked).
- `package.json`: Project manifest declaring dependencies (`express`, `socket.io`, `socket.io-client`).

## Runtime/Tooling Preferences
- **Runtime**: Node.js (Node 18+ or 20+ LTS recommended). CommonJS runtime.
- **Package Manager**: `npm` (lockfile version 3 present).
- **Zero Build Tooling**: Do not add complex bundlers (Webpack, Vite) unless requested. Plain JS/CSS files are served directly.
- **Zero External Audio Assets**: SFX must remain generated procedurally via the Web Audio API in `public/sfx.js` to preserve offline portability.

## Testing & QA
- **Current State**: No automated test framework (Jest/Vitest/Mocha) or CI/CD pipelines currently exist. `npm test` is a stub.
- **Manual Verification Procedure**:
  1. Start server with `node server.js`.
  2. Open two or more distinct browser sessions (e.g., standard window and incognito window) at `http://localhost:3000`.
  3. Create a room from window A; record the 4-character room code.
  4. Join the room from window B with the code.
  5. Select distinct characters, set ready state, and start game.
  6. Exercise Programming Phase (lock 2 actions) and Resolution Phase (verify tile peeking, moving, pushing, and sliding).
  7. Verify state isolation: check that window B cannot view window A's hidden role or unrevealed private peeks.
