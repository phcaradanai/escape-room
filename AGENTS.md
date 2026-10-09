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
- **Shared Engine (`public/game-engine.js`)**: Universal Module Definition (UMD) engine holding single-source truth for board generation, room distribution, sliding, illusion shifts, win checking, and sanitized projections.
- **Game Server (`server.js`)**: Express + Socket.IO server utilizing `public/game-engine.js` for authoritative room simulations, player sessions, reconnection grace periods, and state broadcasting.
- **Art & Characters (`public/game-art.js`)**: Procedural SVG artwork library for all 15 room types, 6 characters roster, and avatar tokens.
- **Online Client (`public/online-game.js`)**: Manages lobby screens, modal dialogs, bilingual localization, dynamic DOM grid rendering, 3D card flips, directional slide animations, and Socket.IO dispatch.
- **Audio Engine (`public/sfx.js`)**: Zero-dependency Web Audio API synthesizer (`SoundFxManager`) producing real-time procedural sound effects for alerts, clicks, slides, vortexes, freezes, acid, water surges, and hazards.
- **Standalone Engine (`game.js`)**: In-memory pass-and-play controller in `index.html` utilizing `public/game-engine.js` and `public/game-art.js`.
## Key Directories
- `/`: Server entry point (`server.js`), standalone offline game files (`index.html`, `game.js`), Windows tunnel launcher script (`start-tunnel.bat`), and bundled Cloudflare binary (`cloudflared.exe`). Both game modes load the canonical stylesheet from `/public/styles.css`.
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
- **Run Automated Test Suite**:
  ```bash
  npm test
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
- **Automated Test Suite**: Node.js native test runner (`node:test`); `npm test` runs `node --test` and discovers test files.
- **Coverage**:
  - `NET-01`–`NET-04`: public player projection, nickname sanitization, action privacy, and Socket.IO validation/permission enforcement.
  - `TEST-01`: Board initialization, center placement, deck distribution, Room 25 presence, and twin pairing.
  - `TEST-02`: Row and column sliding (Control) with wrap-around mechanics.
  - `TEST-03`: Moving Chamber position swapping and occupant travel.
  - `TEST-04`: Illusion room shifting upon player exit.
  - `TEST-05`: Flooded room turn counters and drowning resolution at `endRound`.
  - `TEST-06` [R07]: Production slide path does not win by merely reaching the edge; outward Room 25 ejection wins with all surviving prisoners aboard.
  - `TEST-07`: Fog of War and sanitized state projection.
  - `TEST-08` [R07]: Outward Room 25 ejection triggers escape; inward and unrelated slides do not.
  - `TEST-09` [R08]: Private peek knowledge remaps with sliding tiles.
  - `TEST-10` [R13]: Ultimate character ability validation and execution.
  - `TEST-11`: Suspicion awards its time-limit outcome to the Guards; other modes keep their timeout message.
