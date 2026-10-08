/* ============================================
   ROOM 25 ULTIMATE - Digital Edition
   Game Engine
   ============================================ */

// ==================== CONSTANTS ====================
const PLAYER_COLORS = [
    '#00d4ff', '#ff3e8e', '#00ff88', '#ffd700', '#ff8c00', '#8b5cf6'
];

const ROOM_TYPES = {
    central:    { name: 'Central Room',    icon: '🏠', category: 'central', desc: 'Starting room. Safe zone — no pushing allowed here.' },
    room25:     { name: 'Room 25',         icon: '🚪', category: 'exit',    desc: 'THE EXIT! Get all prisoners here, then use Control to slide it out!' },
    empty:      { name: 'Empty Room',      icon: '⬜', category: 'safe',    desc: 'Nothing happens. A safe room.' },
    vision:     { name: 'Vision Chamber',  icon: '🔮', category: 'safe',    desc: 'Peek at any hidden room on the entire board.' },
    moving:     { name: 'Moving Chamber',  icon: '🔄', category: 'safe',    desc: 'Swap this room with any face-down room on the board.' },
    controlRoom:{ name: 'Control Chamber', icon: '🎛️', category: 'safe',    desc: 'Perform a free Control action immediately.' },
    vortex:     { name: 'Vortex Room',     icon: '🌀', category: 'warning', desc: 'Sends you back to the Central Room immediately.' },
    freezer:    { name: 'Freezer Room',    icon: '🧊', category: 'warning', desc: 'You lose your next action.' },
    dark:       { name: 'Dark Room',       icon: '🌑', category: 'warning', desc: 'You cannot use Peek from this room.' },
    mortal:     { name: 'Mortal Chamber',  icon: '💀', category: 'danger',  desc: 'INSTANT DEATH! Any character entering this room is killed.' },
    trapped:    { name: 'Trapped Room',    icon: '⚠️', category: 'danger',  desc: 'You must leave by your next action or you die!' },
    acid:       { name: 'Acid Bath',       icon: '☣️', category: 'danger',  desc: 'If 2+ players are here, one is eliminated!' },
    flooded:    { name: 'Flooded Room',    icon: '🌊', category: 'danger',  desc: 'If you stay here for 2 consecutive turns, you drown.' },
    twins:      { name: 'Twin Room',       icon: '👥', category: 'warning', desc: 'Creates a duplicate path. Confusing but not deadly.' },
    illusion:   { name: 'Illusion Room',   icon: '✨', category: 'warning', desc: 'This room appears safe but shifts after you leave.' },
};

// Room deck distribution (excluding central and room25 which are placed manually)
const ROOM_DECK = [
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
    'vision', 'vision',
    'moving', 'moving',
    'controlRoom', 'controlRoom',
    'vortex', 'vortex',
    'freezer', 'freezer',
    'dark', 'dark',
    'mortal', 'mortal',
    'trapped', 'trapped',
    'acid',
    'flooded',
    'twins',
    'illusion',
    'room25'
];
// That's 27 items but we only need 23 (25 - central - room25 placed). We'll shuffle and slice.
// Actually room25 is in the deck to be placed randomly. We need 24 rooms (25 - 1 central).

const ACTIONS = {
    peek:    { name: 'LOOK',    icon: '👁' },
    move:    { name: 'MOVE',    icon: '🏃' },
    push:    { name: 'PUSH',    icon: '👊' },
    control: { name: 'CONTROL', icon: '⚙' },
};

// ==================== GAME STATE ====================
let gameState = {
    mode: 'cooperative',        // cooperative | suspicion | competition
    maxRounds: 10,
    currentRound: 1,
    phase: 'programming',       // programming | resolution
    currentPlayerIndex: 0,
    currentActionIndex: 0,      // 0 or 1 (which of the 2 actions)
    players: [],
    board: [],                  // 5x5 array of room objects
    logs: [],
    previousScreen: 'screen-menu',
    waitingForInput: null,      // tracks what input the resolution phase needs
    selectedSlideType: null,
    selectedSlideIndex: null,
    escapedPlayers: [],
    gameOver: false,
};

// ==================== INITIALIZATION ====================

// Create menu particles
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (5 + Math.random() * 10) + 's';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.background = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
        container.appendChild(p);
    }
}

// Screen management
function showScreen(id) {
    if (id === 'screen-rules') {
        // Remember where we came from
        const current = document.querySelector('.screen.active');
        if (current) gameState.previousScreen = current.id;
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    if (id === 'screen-setup') {
        updatePlayerInputs();
    }
}

function goBack() {
    showScreen(gameState.previousScreen || 'screen-menu');
}

// ==================== SETUP ====================

let setupConfig = {
    mode: 'cooperative',
    playerCount: 4,
    maxRounds: 10,
    playerNames: [],
};

function selectMode(btn) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setupConfig.mode = btn.dataset.mode;
}

function setPlayerCount(n) {
    setupConfig.playerCount = n;
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.count-btn').forEach(b => {
        if (parseInt(b.textContent) === n) b.classList.add('active');
    });
    updatePlayerInputs();
}

function selectDifficulty(btn) {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setupConfig.maxRounds = parseInt(btn.dataset.diff);
}

function updatePlayerInputs() {
    const container = document.getElementById('player-inputs');
    container.innerHTML = '';
    for (let i = 0; i < setupConfig.playerCount; i++) {
        const div = document.createElement('div');
        div.className = 'player-input-group';
        div.innerHTML = `
            <div class="player-color-dot" style="background: ${PLAYER_COLORS[i]}"></div>
            <input type="text" placeholder="Player ${i + 1}" value="${setupConfig.playerNames[i] || ''}"
                   onchange="setupConfig.playerNames[${i}] = this.value">
        `;
        container.appendChild(div);
    }
}

// ==================== GAME START ====================

function startGame() {
    // Build players
    const players = [];
    for (let i = 0; i < setupConfig.playerCount; i++) {
        const name = setupConfig.playerNames[i]?.trim() || `Player ${i + 1}`;
        let role = 'prisoner';
        if (setupConfig.mode === 'suspicion') {
            // 1 guard for 4-5 players, 2 guards for 6 players
            const guardCount = setupConfig.playerCount >= 6 ? 2 : 1;
            if (i < guardCount) role = 'guard'; // Will be shuffled
        }
        players.push({
            id: i,
            name: name,
            color: PLAYER_COLORS[i],
            role: role,
            alive: true,
            row: 2,
            col: 2,  // Start at central room
            actions: [null, null],
            frozen: false,     // freezer effect
            trapped: false,    // trapped room countdown
            trappedTurns: 0,
            floodedTurns: 0,   // flooded room counter
            hasActed: [false, false],
        });
    }

    // Shuffle roles for suspicion mode
    if (setupConfig.mode === 'suspicion') {
        const roles = players.map(p => p.role);
        shuffleArray(roles);
        players.forEach((p, i) => p.role = roles[i]);
    }

    // Build board
    const board = buildBoard();

    // Initialize game state
    gameState = {
        mode: setupConfig.mode,
        maxRounds: setupConfig.maxRounds,
        currentRound: 1,
        phase: 'programming',
        currentPlayerIndex: 0,
        currentActionIndex: 0,
        players: players,
        board: board,
        logs: [],
        previousScreen: 'screen-game',
        waitingForInput: null,
        selectedSlideType: null,
        selectedSlideIndex: null,
        escapedPlayers: [],
        gameOver: false,
    };

    addLog('Game started! Mode: ' + setupConfig.mode.toUpperCase(), 'info');
    addLog(`${players.length} players enter the Complex...`, 'info');

    showScreen('screen-game');
    renderGame();
    showTurnOverlay('ROUND 1', `Programming Phase\nAll players: secretly choose your 2 actions.`);
}

function buildBoard() {
    const board = [];
    // Create 5x5 empty grid
    for (let r = 0; r < 5; r++) {
        board[r] = [];
        for (let c = 0; c < 5; c++) {
            board[r][c] = null;
        }
    }

    // Place central room at (2,2)
    board[2][2] = {
        type: 'central',
        revealed: true,
        row: 2,
        col: 2,
    };

    // Shuffle deck and place rooms
    let deck = [...ROOM_DECK];
    shuffleArray(deck);
    // We need exactly 24 rooms (5x5 - 1 central)
    deck = deck.slice(0, 24);

    // Make sure room25 is in the deck
    if (!deck.includes('room25')) {
        deck[deck.length - 1] = 'room25';
        shuffleArray(deck);
    }

    let deckIdx = 0;
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (r === 2 && c === 2) continue; // Skip central
            board[r][c] = {
                type: deck[deckIdx],
                revealed: false,
                row: r,
                col: c,
            };
            deckIdx++;
        }
    }

    return board;
}

// ==================== RENDERING ====================

function renderGame() {
    renderBoard();
    renderPlayerList();
    renderActionPanel();
    updateHUD();
}

function renderBoard() {
    const boardEl = document.getElementById('game-board');
    boardEl.innerHTML = '';

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const room = gameState.board[r][c];
            const tile = document.createElement('div');
            tile.className = 'room-tile';
            tile.dataset.row = r;
            tile.dataset.col = c;

            if (room.revealed) {
                tile.classList.add('revealed');
                const info = ROOM_TYPES[room.type];
                tile.classList.add('room-' + info.category);
                tile.innerHTML = `
                    <div class="room-content">
                        <div class="room-icon">${info.icon}</div>
                        <div class="room-name">${info.name.toUpperCase()}</div>
                    </div>
                `;
            } else {
                tile.classList.add('face-down');
            }

            // Add player tokens
            const playersHere = gameState.players.filter(p => p.alive && p.row === r && p.col === c);
            if (playersHere.length > 0) {
                const tokensDiv = document.createElement('div');
                tokensDiv.className = 'player-tokens';
                playersHere.forEach(p => {
                    const token = document.createElement('div');
                    token.className = 'player-token';
                    if (p.id === gameState.currentPlayerIndex && gameState.phase === 'resolution') {
                        token.classList.add('active-token');
                    }
                    token.style.background = p.color;
                    token.textContent = p.name[0];
                    token.title = p.name;
                    tokensDiv.appendChild(token);
                });
                tile.appendChild(tokensDiv);
            }

            // Event listeners
            tile.addEventListener('click', () => onTileClick(r, c));
            tile.addEventListener('mouseenter', () => onTileHover(r, c));
            tile.addEventListener('mouseleave', () => clearRoomInfo());

            boardEl.appendChild(tile);
        }
    }
}

function renderPlayerList() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';

    gameState.players.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.style.borderLeftColor = p.color;

        if (idx === gameState.currentPlayerIndex && gameState.phase !== 'programming') {
            card.classList.add('active-player');
        }
        if (!p.alive) {
            card.classList.add('dead');
        }

        let statusText = p.alive ? `Room (${p.row + 1}, ${p.col + 1})` : '☠ ELIMINATED';
        if (p.frozen) statusText += ' ❄ FROZEN';
        if (p.trapped) statusText += ' ⚠ TRAPPED';

        let roleHtml = '';
        if (gameState.mode === 'suspicion') {
            // Only show role to the player themselves (in a real game you'd hide this)
            // For local multiplayer, we show it subtly
            roleHtml = `<div class="pc-role ${p.role}">${p.role.toUpperCase()}</div>`;
        }

        let actionsHtml = '';
        if (p.actions[0] || p.actions[1]) {
            actionsHtml = '<div class="pc-actions">';
            for (let a = 0; a < 2; a++) {
                if (p.actions[a]) {
                    const cls = p.hasActed[a] ? 'pc-action-token resolved' : 'pc-action-token';
                    actionsHtml += `<span class="${cls}">${ACTIONS[p.actions[a]].name}</span>`;
                }
            }
            actionsHtml += '</div>';
        }

        card.innerHTML = `
            <div class="pc-name" style="color: ${p.color}">${p.name}</div>
            <div class="pc-status">${statusText}</div>
            ${roleHtml}
            ${actionsHtml}
        `;
        list.appendChild(card);
    });
}

function renderActionPanel() {
    const progPanel = document.getElementById('programming-panel');
    const resPanel = document.getElementById('resolution-panel');

    if (gameState.phase === 'programming') {
        progPanel.classList.remove('hidden');
        resPanel.classList.add('hidden');
        renderProgrammingPanel();
    } else {
        progPanel.classList.add('hidden');
        resPanel.classList.remove('hidden');
        renderResolutionPanel();
    }
}

function renderProgrammingPanel() {
    const player = gameState.players[gameState.currentPlayerIndex];

    // Update slots
    for (let i = 0; i < 2; i++) {
        const slot = document.getElementById(`action-slot-${i + 1}`);
        const val = slot.querySelector('.slot-value');
        if (player.actions[i]) {
            val.textContent = ACTIONS[player.actions[i]].name;
            slot.classList.add('filled');
        } else {
            val.textContent = '—';
            slot.classList.remove('filled');
        }
    }

    // Update confirm button
    const confirmBtn = document.getElementById('confirm-actions-btn');
    confirmBtn.disabled = !(player.actions[0] && player.actions[1]);

    // Update action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
    });
}

function renderResolutionPanel() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const actionIdx = gameState.currentActionIndex;
    const action = player.actions[actionIdx];

    document.getElementById('current-action-name').textContent =
        action ? ACTIONS[action].name : '—';

    // Hide all selectors
    document.getElementById('direction-selector').classList.add('hidden');
    document.getElementById('target-selector').classList.add('hidden');
    document.getElementById('slide-selector').classList.add('hidden');

    if (!gameState.waitingForInput) return;

    switch (gameState.waitingForInput) {
        case 'direction':
            document.getElementById('direction-selector').classList.remove('hidden');
            break;
        case 'push-target':
            showPushTargets();
            document.getElementById('target-selector').classList.remove('hidden');
            break;
        case 'push-direction':
            document.getElementById('direction-selector').classList.remove('hidden');
            break;
        case 'slide':
            document.getElementById('slide-selector').classList.remove('hidden');
            document.getElementById('slide-direction').classList.add('hidden');
            break;
        case 'peek-tile':
            // Handled by board highlight
            break;
        case 'vision-tile':
            // Handled by board highlight
            break;
    }
}

function updateHUD() {
    document.getElementById('round-number').textContent = gameState.currentRound;
    document.getElementById('max-rounds').textContent = gameState.maxRounds;
    document.getElementById('phase-name').textContent =
        gameState.phase === 'programming' ? 'PROGRAMMING' : 'RESOLUTION';

    const player = gameState.players[gameState.currentPlayerIndex];
    if (player) {
        const phaseDesc = gameState.phase === 'programming'
            ? `${player.name}: Choose 2 actions`
            : `${player.name}: Resolve action ${gameState.currentActionIndex + 1}`;
        document.getElementById('game-message').textContent = phaseDesc;
        document.getElementById('game-message').style.color = player.color;
    }
}

// ==================== ROOM INFO ON HOVER ====================

function onTileHover(row, col) {
    const room = gameState.board[row][col];
    const infoDiv = document.getElementById('room-info');

    if (!room.revealed) {
        infoDiv.innerHTML = `
            <div class="ri-name" style="color: var(--text-dim)">UNKNOWN ROOM</div>
            <div class="ri-type">FACE DOWN</div>
            <div class="ri-desc">This room hasn't been explored yet. Use LOOK to peek at it first!</div>
        `;
        return;
    }

    const info = ROOM_TYPES[room.type];
    const categoryColors = {
        safe: 'var(--room-safe)',
        warning: 'var(--room-warning)',
        danger: 'var(--room-danger)',
        exit: 'var(--room-exit)',
        central: 'var(--room-central)',
    };

    const playersHere = gameState.players.filter(p => p.alive && p.row === row && p.col === col);
    let playersText = '';
    if (playersHere.length > 0) {
        playersText = `<div style="margin-top:6px;font-size:0.75rem;color:var(--text-dim)">
            Players: ${playersHere.map(p => `<span style="color:${p.color}">${p.name}</span>`).join(', ')}
        </div>`;
    }

    infoDiv.innerHTML = `
        <div class="ri-name" style="color: ${categoryColors[info.category]}">${info.icon} ${info.name}</div>
        <div class="ri-type">${info.category.toUpperCase()}</div>
        <div class="ri-desc">${info.desc}</div>
        ${playersText}
    `;
}

function clearRoomInfo() {
    document.getElementById('room-info').innerHTML =
        '<p class="room-info-placeholder">Hover over a room to see details</p>';
}

// ==================== PROGRAMMING PHASE ====================

function selectAction(action) {
    const player = gameState.players[gameState.currentPlayerIndex];

    if (!player.actions[0]) {
        player.actions[0] = action;
    } else if (!player.actions[1]) {
        player.actions[1] = action;
    } else {
        // Replace second action
        player.actions[1] = action;
    }

    renderProgrammingPanel();
}

function confirmActions() {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (!player.actions[0] || !player.actions[1]) return;

    addLog(`${player.name} has programmed their actions.`, 'info');

    // Move to next player
    const nextIdx = getNextAlivePlayerIndex(gameState.currentPlayerIndex);

    if (nextIdx <= gameState.currentPlayerIndex || nextIdx >= gameState.players.length) {
        // All players have programmed — start resolution
        startResolutionPhase();
    } else {
        gameState.currentPlayerIndex = nextIdx;
        showTurnOverlay(
            `${gameState.players[nextIdx].name.toUpperCase()}`,
            `It's your turn to program 2 actions.\nDon't let others see your choices!`
        );
        renderGame();
    }
}

function startResolutionPhase() {
    gameState.phase = 'resolution';
    gameState.currentPlayerIndex = 0;
    gameState.currentActionIndex = 0;

    // Find first alive player
    while (gameState.currentPlayerIndex < gameState.players.length &&
           !gameState.players[gameState.currentPlayerIndex].alive) {
        gameState.currentPlayerIndex++;
    }

    addLog(`--- Round ${gameState.currentRound} Resolution Phase ---`, 'info');

    showTurnOverlay(
        'RESOLUTION PHASE',
        `Players will now resolve their actions in order.\n${gameState.players[gameState.currentPlayerIndex].name} goes first.`
    );

    beginCurrentAction();
}

// ==================== RESOLUTION PHASE ====================

function beginCurrentAction() {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (!player || !player.alive) {
        advanceToNextAction();
        return;
    }

    const action = player.actions[gameState.currentActionIndex];

    // Check frozen
    if (player.frozen) {
        player.frozen = false;
        addLog(`${player.name} is FROZEN and loses this action!`, 'warning');
        player.hasActed[gameState.currentActionIndex] = true;
        renderGame();
        setTimeout(() => advanceToNextAction(), 800);
        return;
    }

    switch (action) {
        case 'peek':
            startPeekAction();
            break;
        case 'move':
            startMoveAction();
            break;
        case 'push':
            startPushAction();
            break;
        case 'control':
            startControlAction();
            break;
    }

    renderGame();
}

// --- PEEK / LOOK ---
function startPeekAction() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const room = gameState.board[player.row][player.col];

    // Check if in Dark Room
    if (room.type === 'dark') {
        addLog(`${player.name} can't LOOK — they're in the Dark Room!`, 'warning');
        player.hasActed[gameState.currentActionIndex] = true;
        setTimeout(() => advanceToNextAction(), 800);
        return;
    }

    gameState.waitingForInput = 'peek-tile';
    setMessage(`${player.name}: Click an adjacent face-down room to LOOK at it`);
    highlightAdjacentTiles(player.row, player.col, 'peek');
    renderActionPanel();
}

// --- MOVE ---
function startMoveAction() {
    const player = gameState.players[gameState.currentPlayerIndex];
    gameState.waitingForInput = 'direction';
    setMessage(`${player.name}: Choose a direction to MOVE`);
    highlightAdjacentTiles(player.row, player.col, 'move');
    renderActionPanel();
}

// --- PUSH ---
function startPushAction() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const room = gameState.board[player.row][player.col];

    // Can't push in central room
    if (room.type === 'central') {
        addLog(`${player.name} can't PUSH in the Central Room!`, 'warning');
        player.hasActed[gameState.currentActionIndex] = true;
        setTimeout(() => advanceToNextAction(), 800);
        return;
    }

    // Find other players in same room
    const targets = gameState.players.filter(p =>
        p.alive && p.id !== player.id && p.row === player.row && p.col === player.col
    );

    if (targets.length === 0) {
        addLog(`${player.name} has no one to PUSH!`, 'warning');
        player.hasActed[gameState.currentActionIndex] = true;
        setTimeout(() => advanceToNextAction(), 800);
        return;
    }

    if (targets.length === 1) {
        gameState.pushTarget = targets[0];
        gameState.waitingForInput = 'push-direction';
        setMessage(`${player.name}: Choose direction to PUSH ${targets[0].name}`);
        highlightAdjacentTiles(player.row, player.col, 'push');
    } else {
        gameState.waitingForInput = 'push-target';
        setMessage(`${player.name}: Select who to PUSH`);
    }
    renderActionPanel();
}

function showPushTargets() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const targets = gameState.players.filter(p =>
        p.alive && p.id !== player.id && p.row === player.row && p.col === player.col
    );

    const container = document.getElementById('target-buttons');
    container.innerHTML = '';
    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'target-btn';
        btn.innerHTML = `<div class="player-color-dot" style="background:${t.color}"></div> ${t.name}`;
        btn.onclick = () => {
            gameState.pushTarget = t;
            gameState.waitingForInput = 'push-direction';
            setMessage(`${player.name}: Choose direction to PUSH ${t.name}`);
            highlightAdjacentTiles(player.row, player.col, 'push');
            renderActionPanel();
        };
        container.appendChild(btn);
    });
}

// --- CONTROL ---
function startControlAction() {
    gameState.waitingForInput = 'slide';
    gameState.selectedSlideType = null;
    gameState.selectedSlideIndex = null;
    const player = gameState.players[gameState.currentPlayerIndex];
    setMessage(`${player.name}: Select a row or column to slide`);
    renderActionPanel();
}

// ==================== INPUT HANDLERS ====================

function onTileClick(row, col) {
    if (gameState.gameOver) return;

    const input = gameState.waitingForInput;
    if (!input) return;

    const player = gameState.players[gameState.currentPlayerIndex];

    if (input === 'peek-tile') {
        // Must be adjacent and face-down
        if (!isAdjacent(player.row, player.col, row, col)) return;
        const room = gameState.board[row][col];
        if (room.revealed) return;

        // Peek at the room (show privately)
        const info = ROOM_TYPES[room.type];
        showPeekModal(room);
        addLog(`${player.name} peeked at (${row + 1},${col + 1})`, 'info');
        player.hasActed[gameState.currentActionIndex] = true;
        gameState.waitingForInput = null;
        clearHighlights();
        // Don't reveal it on the board!
        return;
    }

    if (input === 'direction') {
        // Move: must be adjacent
        if (!isAdjacent(player.row, player.col, row, col)) return;
        executeMove(player, row, col);
        return;
    }

    if (input === 'push-direction') {
        // Push target to adjacent tile
        if (!isAdjacent(player.row, player.col, row, col)) return;
        executePush(gameState.pushTarget, row, col);
        return;
    }

    if (input === 'vision-tile') {
        // Vision chamber: peek at any hidden room
        const room = gameState.board[row][col];
        if (room.revealed) return;
        showPeekModal(room);
        addLog(`${player.name} used Vision Chamber to peek at (${row + 1},${col + 1})`, 'success');
        gameState.waitingForInput = null;
        clearHighlights();
        checkBonusRoomDone();
        return;
    }

    if (input === 'moving-tile') {
        // Moving chamber: swap with any hidden room
        const room = gameState.board[row][col];
        if (room.revealed) return;

        const playerRoom = gameState.board[player.row][player.col];
        // Swap positions
        const tempType = playerRoom.type;
        const tempRevealed = playerRoom.revealed;
        playerRoom.type = room.type;
        playerRoom.revealed = room.revealed;
        room.type = tempType;
        room.revealed = tempRevealed;
        // Player moves with their room — actually in the board game, the player stays
        // and the rooms swap. Let's keep player in place.

        addLog(`${player.name} used Moving Chamber to swap rooms!`, 'success');
        gameState.waitingForInput = null;
        clearHighlights();
        renderBoard();
        checkBonusRoomDone();
        return;
    }
}

function selectDirection(dir) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const input = gameState.waitingForInput;

    let targetRow = player.row;
    let targetCol = player.col;

    switch (dir) {
        case 'up': targetRow--; break;
        case 'down': targetRow++; break;
        case 'left': targetCol--; break;
        case 'right': targetCol++; break;
    }

    if (targetRow < 0 || targetRow > 4 || targetCol < 0 || targetCol > 4) {
        setMessage('Cannot move outside the complex!');
        return;
    }

    if (input === 'direction') {
        executeMove(player, targetRow, targetCol);
    } else if (input === 'push-direction') {
        executePush(gameState.pushTarget, targetRow, targetCol);
    }
}

function selectSlide(type, index) {
    gameState.selectedSlideType = type;
    gameState.selectedSlideIndex = index;

    // Highlight selected button
    document.querySelectorAll('.slide-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    // Show direction
    const dirDiv = document.getElementById('slide-direction');
    dirDiv.classList.remove('hidden');

    const btn1 = document.getElementById('slide-dir-1');
    const btn2 = document.getElementById('slide-dir-2');
    if (type === 'row') {
        btn1.textContent = '← LEFT';
        btn2.textContent = '→ RIGHT';
    } else {
        btn1.textContent = '↑ UP';
        btn2.textContent = '↓ DOWN';
    }
}

function confirmSlide(direction) {
    if (gameState.selectedSlideType === null) return;
    executeSlide(gameState.selectedSlideType, gameState.selectedSlideIndex, direction);
}

// ==================== ACTION EXECUTION ====================

function executeMove(player, targetRow, targetCol) {
    clearHighlights();
    gameState.waitingForInput = null;

    // Move player
    player.row = targetRow;
    player.col = targetCol;

    // Reveal room
    const room = gameState.board[targetRow][targetCol];
    const wasHidden = !room.revealed;
    room.revealed = true;

    addLog(`${player.name} moved to (${targetRow + 1},${targetCol + 1})`, 'info');

    player.hasActed[gameState.currentActionIndex] = true;

    // Animate
    renderBoard();

    if (wasHidden) {
        const tile = getTileElement(targetRow, targetCol);
        if (tile) tile.classList.add('room-reveal');
    }

    // Trigger room effect
    setTimeout(() => {
        triggerRoomEffect(player, room);
    }, 400);
}

function executePush(target, targetRow, targetCol) {
    clearHighlights();
    gameState.waitingForInput = null;

    const player = gameState.players[gameState.currentPlayerIndex];

    // Move target
    target.row = targetRow;
    target.col = targetCol;

    // Reveal room
    const room = gameState.board[targetRow][targetCol];
    const wasHidden = !room.revealed;
    room.revealed = true;

    addLog(`${player.name} pushed ${target.name} to (${targetRow + 1},${targetCol + 1})!`, 'warning');

    player.hasActed[gameState.currentActionIndex] = true;

    renderBoard();

    if (wasHidden) {
        const tile = getTileElement(targetRow, targetCol);
        if (tile) tile.classList.add('room-reveal');
    }

    // Trigger effect on pushed player
    setTimeout(() => {
        triggerRoomEffect(target, room);
    }, 400);
}

function executeSlide(type, index, direction) {
    gameState.waitingForInput = null;
    const player = gameState.players[gameState.currentPlayerIndex];

    addLog(`${player.name} used CONTROL to slide ${type} ${index + 1} ${direction > 0 ? (type === 'row' ? 'right' : 'down') : (type === 'row' ? 'left' : 'up')}`, 'info');

    if (type === 'row') {
        slideRow(index, direction);
    } else {
        slideCol(index, direction);
    }

    player.hasActed[gameState.currentActionIndex] = true;

    // Check if room25 was slid off the board (win condition!)
    checkWinBySlide();

    renderGame();
    setTimeout(() => advanceToNextAction(), 600);
}

function slideRow(rowIdx, dir) {
    const board = gameState.board;
    const row = board[rowIdx];

    if (dir > 0) {
        // Slide right: last element wraps to first
        const last = row[4];
        for (let c = 4; c > 0; c--) {
            row[c] = row[c - 1];
            row[c].col = c;
        }
        row[0] = last;
        row[0].col = 0;
    } else {
        // Slide left: first element wraps to last
        const first = row[0];
        for (let c = 0; c < 4; c++) {
            row[c] = row[c + 1];
            row[c].col = c;
        }
        row[4] = first;
        row[4].col = 4;
    }

    // Move players in this row
    gameState.players.forEach(p => {
        if (p.alive && p.row === rowIdx) {
            p.col += dir;
            if (p.col < 0) p.col = 4;
            if (p.col > 4) p.col = 0;
        }
    });

    // Update row references
    for (let c = 0; c < 5; c++) {
        row[c].row = rowIdx;
    }
}

function slideCol(colIdx, dir) {
    const board = gameState.board;

    if (dir > 0) {
        // Slide down: last element wraps to first
        const last = board[4][colIdx];
        for (let r = 4; r > 0; r--) {
            board[r][colIdx] = board[r - 1][colIdx];
            board[r][colIdx].row = r;
        }
        board[0][colIdx] = last;
        board[0][colIdx].row = 0;
    } else {
        // Slide up: first element wraps to last
        const first = board[0][colIdx];
        for (let r = 0; r < 4; r++) {
            board[r][colIdx] = board[r + 1][colIdx];
            board[r][colIdx].row = r;
        }
        board[4][colIdx] = first;
        board[4][colIdx].row = 4;
    }

    // Move players in this column
    gameState.players.forEach(p => {
        if (p.alive && p.col === colIdx) {
            p.row += dir;
            if (p.row < 0) p.row = 4;
            if (p.row > 4) p.row = 0;
        }
    });

    // Update col references
    for (let r = 0; r < 5; r++) {
        board[r][colIdx].col = colIdx;
    }
}

// ==================== ROOM EFFECTS ====================

function triggerRoomEffect(player, room) {
    if (!player.alive) return;

    const type = room.type;
    const info = ROOM_TYPES[type];

    switch (type) {
        case 'central':
        case 'empty':
            // Safe, nothing happens
            advanceToNextAction();
            break;

        case 'mortal':
            // Instant death
            killPlayer(player, 'was destroyed by the Mortal Chamber!');
            break;

        case 'trapped':
            // Must leave by next action
            player.trapped = true;
            player.trappedTurns = 0;
            addLog(`${player.name} is TRAPPED! Must escape before next turn!`, 'danger');
            setMessage(`${player.name} is TRAPPED! They must leave soon or die!`);
            advanceToNextAction();
            break;

        case 'acid':
            // If 2+ players, one dies
            handleAcidBath(player, room);
            break;

        case 'flooded':
            player.floodedTurns = (player.floodedTurns || 0) + 1;
            if (player.floodedTurns >= 2) {
                killPlayer(player, 'drowned in the Flooded Room!');
            } else {
                addLog(`${player.name} enters the Flooded Room. Stay too long and you'll drown!`, 'warning');
                advanceToNextAction();
            }
            break;

        case 'vortex':
            // Send back to central
            player.row = 2;
            player.col = 2;
            addLog(`${player.name} was caught in a VORTEX! Sent back to Central Room!`, 'warning');
            renderBoard();
            advanceToNextAction();
            break;

        case 'freezer':
            player.frozen = true;
            addLog(`${player.name} is FROZEN! They lose their next action!`, 'warning');
            advanceToNextAction();
            break;

        case 'dark':
            addLog(`${player.name} enters the Dark Room. LOOK action is disabled here.`, 'info');
            advanceToNextAction();
            break;

        case 'vision':
            // Let player peek at any hidden room
            gameState.waitingForInput = 'vision-tile';
            gameState.bonusAction = true;
            setMessage(`${player.name}: Vision Chamber! Click any face-down room to secretly peek.`);
            highlightAllHiddenTiles();
            renderActionPanel();
            break;

        case 'controlRoom':
            // Free control action
            gameState.waitingForInput = 'slide';
            gameState.bonusAction = true;
            gameState.selectedSlideType = null;
            gameState.selectedSlideIndex = null;
            setMessage(`${player.name}: Control Chamber! Slide a row or column for free.`);
            renderActionPanel();
            break;

        case 'moving':
            // Swap with any hidden room
            const hasHidden = gameState.board.flat().some(r => !r.revealed);
            if (hasHidden) {
                gameState.waitingForInput = 'moving-tile';
                gameState.bonusAction = true;
                setMessage(`${player.name}: Moving Chamber! Click any face-down room to swap with.`);
                highlightAllHiddenTiles();
                renderActionPanel();
            } else {
                addLog('No hidden rooms to swap with.', 'info');
                advanceToNextAction();
            }
            break;

        case 'room25':
            addLog(`${player.name} found ROOM 25! THE EXIT!`, 'success');
            setMessage(`ROOM 25 FOUND! Use Control to slide it off the board to escape!`);
            advanceToNextAction();
            break;

        case 'twins':
        case 'illusion':
            addLog(`${player.name} enters the ${info.name}. ${info.desc}`, 'info');
            advanceToNextAction();
            break;

        default:
            advanceToNextAction();
    }
}

function handleAcidBath(enteringPlayer, room) {
    const playersHere = gameState.players.filter(p =>
        p.alive && p.row === room.row && p.col === room.col
    );

    if (playersHere.length >= 2) {
        // In competitive/suspicion, the entering player might be the victim
        // In cooperative, random victim
        let victim;
        if (gameState.mode === 'cooperative') {
            // Last player to enter is the victim
            victim = enteringPlayer;
        } else {
            // Random among those present
            victim = playersHere[Math.floor(Math.random() * playersHere.length)];
        }
        killPlayer(victim, 'was dissolved in the Acid Bath!');
    } else {
        addLog(`${enteringPlayer.name} enters the Acid Bath. Dangerous if someone else joins!`, 'warning');
        advanceToNextAction();
    }
}

function killPlayer(player, reason) {
    player.alive = false;
    addLog(`☠ ${player.name} ${reason}`, 'danger');
    setMessage(`☠ ${player.name} ${reason}`);

    // Flash effect
    const tile = getTileElement(player.row, player.col);
    if (tile) tile.classList.add('death-flash');

    renderBoard();
    renderPlayerList();

    // Check if all players are dead
    const aliveCount = gameState.players.filter(p => p.alive).length;
    if (aliveCount === 0) {
        setTimeout(() => endGame(false, 'All prisoners have been eliminated!'), 1000);
        return;
    }

    // In suspicion mode, check if all prisoners are dead (guards win)
    if (gameState.mode === 'suspicion') {
        const alivePrisoners = gameState.players.filter(p => p.alive && p.role === 'prisoner');
        if (alivePrisoners.length === 0) {
            setTimeout(() => endGame(false, 'All prisoners are dead! The Guards win!'), 1000);
            return;
        }
    }

    setTimeout(() => advanceToNextAction(), 1200);
}

function checkBonusRoomDone() {
    // After bonus room actions (vision, moving, control room), advance
    gameState.bonusAction = false;
    renderBoard();
    advanceToNextAction();
}

// ==================== ACTION FLOW CONTROL ====================

function advanceToNextAction() {
    if (gameState.gameOver) return;

    const player = gameState.players[gameState.currentPlayerIndex];
    if (player) player.hasActed[gameState.currentActionIndex] = true;

    // Check trapped players
    checkTrappedPlayers();

    gameState.waitingForInput = null;
    clearHighlights();

    // Try next action for current player
    if (gameState.currentActionIndex === 0) {
        gameState.currentActionIndex = 1;
        renderGame();
        if (gameState.players[gameState.currentPlayerIndex]?.alive) {
            setTimeout(() => beginCurrentAction(), 400);
        } else {
            setTimeout(() => advanceToNextPlayer(), 400);
        }
        return;
    }

    // Current player done, go to next player
    advanceToNextPlayer();
}

function advanceToNextPlayer() {
    if (gameState.gameOver) return;

    const nextIdx = getNextAlivePlayerIndex(gameState.currentPlayerIndex);

    if (nextIdx === -1 || nextIdx <= gameState.currentPlayerIndex) {
        // All players have acted — end of round
        endRound();
        return;
    }

    gameState.currentPlayerIndex = nextIdx;
    gameState.currentActionIndex = 0;

    renderGame();
    setTimeout(() => beginCurrentAction(), 400);
}

function endRound() {
    if (gameState.gameOver) return;

    // Reset flooded counters for players who moved
    gameState.players.forEach(p => {
        if (p.alive) {
            const room = gameState.board[p.row][p.col];
            if (room.type !== 'flooded') {
                p.floodedTurns = 0;
            }
        }
    });

    // Check trapped — players who didn't leave die
    gameState.players.forEach(p => {
        if (p.alive && p.trapped) {
            p.trappedTurns++;
            if (p.trappedTurns >= 2) {
                killPlayer(p, 'failed to escape the Trapped Room and was executed!');
                p.trapped = false;
            }
        }
    });

    // Check time limit
    if (gameState.currentRound >= gameState.maxRounds) {
        endGame(false, 'Time ran out! The complex has sealed itself forever.');
        return;
    }

    // Advance round
    gameState.currentRound++;
    gameState.phase = 'programming';
    gameState.currentPlayerIndex = 0;
    gameState.currentActionIndex = 0;

    // Reset player actions
    gameState.players.forEach(p => {
        p.actions = [null, null];
        p.hasActed = [false, false];
    });

    // Find first alive player
    while (gameState.currentPlayerIndex < gameState.players.length &&
           !gameState.players[gameState.currentPlayerIndex].alive) {
        gameState.currentPlayerIndex++;
    }

    addLog(`--- Round ${gameState.currentRound} Programming Phase ---`, 'info');

    showTurnOverlay(
        `ROUND ${gameState.currentRound}`,
        `Programming Phase begins.\n${gameState.players[gameState.currentPlayerIndex].name}: Choose your 2 actions.`
    );

    renderGame();
}

function checkTrappedPlayers() {
    // If player moved out of trapped room, clear the flag
    gameState.players.forEach(p => {
        if (p.alive && p.trapped) {
            const room = gameState.board[p.row][p.col];
            if (room.type !== 'trapped') {
                p.trapped = false;
                p.trappedTurns = 0;
                addLog(`${p.name} escaped the Trapped Room!`, 'success');
            }
        }
    });
}

// ==================== WIN/LOSE CONDITIONS ====================

function checkWinBySlide() {
    // Check if room25 is at an edge position and was just slid
    // In the board game, winning = all prisoners in room25 + control to slide it off
    // We simulate: if control slides room25 off the edge, check who's on it

    // Find room25
    let room25Pos = null;
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (gameState.board[r][c].type === 'room25') {
                room25Pos = { row: r, col: c };
            }
        }
    }

    if (!room25Pos) {
        // Room 25 was slid off! Check who escaped
        const escapees = gameState.players.filter(p => p.alive);
        // Actually room25 wraps around, so let's handle this differently
        // In the real game, you slide room25 to an edge, then one more control to eject it
        return;
    }

    // Alternative win check: if room25 is at any edge and all alive prisoners are on it
    if (room25Pos && gameState.board[room25Pos.row][room25Pos.col].revealed) {
        const isEdge = room25Pos.row === 0 || room25Pos.row === 4 ||
                       room25Pos.col === 0 || room25Pos.col === 4;

        if (isEdge) {
            const alivePlayers = gameState.players.filter(p => p.alive);
            const playersOnRoom25 = alivePlayers.filter(p =>
                p.row === room25Pos.row && p.col === room25Pos.col
            );

            if (gameState.mode === 'cooperative' || gameState.mode === 'suspicion') {
                // All alive prisoners must be on room25
                const prisoners = alivePlayers.filter(p => p.role !== 'guard');
                const prisonersOnR25 = prisoners.filter(p =>
                    p.row === room25Pos.row && p.col === room25Pos.col
                );

                if (prisonersOnR25.length === prisoners.length && prisoners.length > 0) {
                    endGame(true, 'All prisoners escaped through Room 25! FREEDOM!');
                }
            } else if (gameState.mode === 'competition') {
                if (playersOnRoom25.length > 0) {
                    const winners = playersOnRoom25.map(p => p.name).join(', ');
                    endGame(true, `${winners} escaped through Room 25!`);
                }
            }
        }
    }
}

function endGame(victory, message) {
    gameState.gameOver = true;

    const overlay = document.getElementById('gameover-overlay');
    const content = overlay.querySelector('.gameover-content');
    const title = document.getElementById('gameover-title');
    const text = document.getElementById('gameover-text');
    const stats = document.getElementById('gameover-stats');

    if (victory) {
        content.className = 'gameover-content victory';
        title.textContent = 'ESCAPED!';
        title.style.color = '';
    } else {
        content.className = 'gameover-content defeat';
        title.textContent = 'GAME OVER';
        title.style.color = 'var(--accent-red)';
    }

    text.textContent = message;

    const alive = gameState.players.filter(p => p.alive).length;
    const dead = gameState.players.length - alive;

    stats.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${gameState.currentRound}</div>
            <div class="stat-label">ROUNDS</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${alive}</div>
            <div class="stat-label">SURVIVORS</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${dead}</div>
            <div class="stat-label">CASUALTIES</div>
        </div>
    `;

    overlay.classList.remove('hidden');
    addLog(victory ? '🎉 VICTORY!' : '💀 DEFEAT!', victory ? 'success' : 'danger');
    addLog(message, 'info');
}

// ==================== UI HELPERS ====================

function highlightAdjacentTiles(row, col, type) {
    clearHighlights();
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    directions.forEach(([dr, dc]) => {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < 5 && c >= 0 && c < 5) {
            const tile = getTileElement(r, c);
            if (tile) {
                if (type === 'peek' && gameState.board[r][c].revealed) return;
                tile.classList.add(`highlight-${type}`);
            }
        }
    });
}

function highlightAllHiddenTiles() {
    clearHighlights();
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (!gameState.board[r][c].revealed) {
                const tile = getTileElement(r, c);
                if (tile) tile.classList.add('highlight-peek');
            }
        }
    }
}

function clearHighlights() {
    document.querySelectorAll('.room-tile').forEach(tile => {
        tile.classList.remove('highlight-move', 'highlight-peek', 'highlight-push');
    });
}

function getTileElement(row, col) {
    return document.querySelector(`.room-tile[data-row="${row}"][data-col="${col}"]`);
}

function isAdjacent(r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function getNextAlivePlayerIndex(currentIdx) {
    for (let i = currentIdx + 1; i < gameState.players.length; i++) {
        if (gameState.players[i].alive) return i;
    }
    return -1;
}

function setMessage(msg) {
    document.getElementById('game-message').textContent = msg;
}

// Peek Modal
function showPeekModal(room) {
    const modal = document.getElementById('peek-modal');
    const display = document.getElementById('peek-room-display');
    const desc = document.getElementById('peek-room-desc');
    const info = ROOM_TYPES[room.type];

    const categoryClasses = {
        safe: 'room-safe',
        warning: 'room-warning',
        danger: 'room-danger',
        exit: 'room-exit',
        central: 'room-central',
    };

    display.className = `peek-room-display ${categoryClasses[info.category] || ''}`;
    display.innerHTML = `
        <div class="room-icon">${info.icon}</div>
        <div class="room-name">${info.name.toUpperCase()}</div>
    `;
    desc.textContent = info.desc;

    modal.classList.remove('hidden');
}

function closePeekModal() {
    document.getElementById('peek-modal').classList.add('hidden');

    // If this was a regular peek, advance action
    if (!gameState.bonusAction) {
        advanceToNextAction();
    } else {
        checkBonusRoomDone();
    }
}

// Turn Overlay
function showTurnOverlay(title, text) {
    const overlay = document.getElementById('turn-overlay');
    document.getElementById('turn-overlay-title').textContent = title;
    document.getElementById('turn-overlay-text').textContent = text;
    overlay.classList.remove('hidden');
}

function dismissOverlay() {
    document.getElementById('turn-overlay').classList.add('hidden');
}

// Game Log
function toggleGameLog() {
    const log = document.getElementById('game-log');
    log.classList.toggle('hidden');
}

function addLog(message, type = 'info') {
    gameState.logs.push({ message, type, round: gameState.currentRound });

    const entries = document.getElementById('log-entries');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[R${gameState.currentRound}] ${message}`;
    entries.appendChild(entry);
    entries.scrollTop = entries.scrollHeight;
}

// Quit
function confirmQuit() {
    if (confirm('Are you sure you want to quit the current game?')) {
        showScreen('screen-menu');
    }
}

// ==================== UTILITIES ====================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    updatePlayerInputs();
});
