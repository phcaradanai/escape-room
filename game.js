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
    'twins', 'twins',
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

function playSound(type) {
    if (typeof sfx === 'undefined' || !sfx || sfx.muted) return;
    try {
        if (typeof sfx[type] === 'function') sfx[type]();
    } catch (e) {}
}

function toggleAudio() {
    if (typeof sfx === 'undefined') return;
    setSoundMuted(!sfx.muted);
}

// ==================== GAME STATE ====================
let gameState = {
    mode: 'cooperative',        // cooperative | suspicion | competition
    maxRounds: 8,
    currentRound: 1,
    phase: 'programming',       // programming | resolution
    currentPlayerIndex: 0,
    selectedActionSlot: 0,
    currentActionIndex: 0,      // 0 or 1 (which of the 2 actions)
    players: [],
    board: [],                  // 5x5 array of room objects
    logs: [],
    escapedPlayers: [],
    gameOver: false,
    privateRoleVisible: false,
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
    const target = document.getElementById(id);
    if (!target) return;

    if (id === 'screen-rules') {
        const current = document.querySelector('.screen.active');
        if (current) gameState.previousScreen = current.id;
    }

    const current = document.querySelector('.screen.active');
    const screenChanged = !current || current.id !== id;
    if (screenChanged) {
        document.querySelectorAll('.modal, .turn-overlay, .gameover-overlay').forEach(dialog => {
            if (!dialog.classList.contains('hidden')) Room25UI.closeDialog(dialog, { restoreFocus: false });
        });
    }

    document.querySelectorAll('.screen').forEach(screen => {
        const isActive = screen === target;
        screen.classList.toggle('active', isActive);
        screen.setAttribute('aria-hidden', String(!isActive));
    });

    if (id === 'screen-setup') updatePlayerInputs();
    if (screenChanged) {
        const heading = [...target.querySelectorAll('h1, h2')].find(element => element.getClientRects().length > 0);
        const focusTarget = heading || target;
        if (!focusTarget.hasAttribute('tabindex')) focusTarget.tabIndex = -1;
        focusTarget.focus({ preventScroll: true });
    }
}

function goBack() {
    showScreen(gameState.previousScreen || 'screen-menu');
}

// ==================== SETUP ====================

let setupConfig = {
    mode: 'cooperative',
    playerCount: 4,
    maxRounds: 8,
    playerNames: [],
};

function selectMode(btn) {
    document.querySelectorAll('.mode-btn').forEach(button => {
        const selected = button === btn;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    setupConfig.mode = btn.dataset.mode;
}

function setPlayerCount(n) {
    setupConfig.playerCount = n;
    document.querySelectorAll('.count-btn').forEach(button => {
        const selected = parseInt(button.textContent, 10) === n;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    updatePlayerInputs();
}

function selectDifficulty(btn) {
    document.querySelectorAll('.diff-btn').forEach(button => {
        const selected = button === btn;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    setupConfig.maxRounds = parseInt(btn.dataset.diff, 10);
}

function updatePlayerInputs() {
    const container = document.getElementById('player-inputs');
    container.innerHTML = '';
    for (let i = 0; i < setupConfig.playerCount; i++) {
        const div = document.createElement('div');
        div.className = 'player-input-group';
        div.innerHTML = `
            <div class="player-color-dot" style="background: ${PLAYER_COLORS[i]}" aria-hidden="true"></div>
            <input type="text" aria-label="Player ${i + 1} name" autocomplete="off" placeholder="Player ${i + 1}" value="${setupConfig.playerNames[i] || ''}"
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

    gameState = {
        mode: setupConfig.mode,
        maxRounds: setupConfig.maxRounds,
        currentRound: 1,
        phase: 'programming',
        currentPlayerIndex: 0,
        selectedActionSlot: 0,
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
        privateRoleVisible: false,
    };

    addLog('Game started! Mode: ' + setupConfig.mode.toUpperCase(), 'info');
    addLog(`${players.length} players enter the Complex...`, 'info');

    showScreen('screen-game');
    renderGame();
    showTurnOverlay('ROUND 1', `Programming Phase\nAll players: secretly choose your 2 actions.`);
}

function buildBoard() {
    if (typeof Room25Engine !== 'undefined') {
        return Room25Engine.buildBoard();
    }
    const board = [];
    for (let r = 0; r < 5; r++) {
        board[r] = [];
        for (let c = 0; c < 5; c++) {
            board[r][c] = null;
        }
    }
    board[2][2] = { type: 'central', revealed: true, row: 2, col: 2 };
    let deck = shuffleArray(ROOM_DECK).slice(0, 24);
    if (!deck.includes('room25')) {
        deck[deck.length - 1] = 'room25';
        deck = shuffleArray(deck);
    }
    const twinsCount = deck.filter(t => t === 'twins').length;
    if (twinsCount === 1) {
        const emptyIdx = deck.findIndex(t => t === 'empty');
        if (emptyIdx !== -1) deck[emptyIdx] = 'twins';
    }
    let deckIdx = 0;
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (r === 2 && c === 2) continue;
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
    const activeTile = boardEl.contains(document.activeElement)
        ? document.activeElement.closest('.room-tile')
        : null;
    const activeRow = activeTile ? Number(activeTile.dataset.row) : null;
    const activeCol = activeTile ? Number(activeTile.dataset.col) : null;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const focusRow = activeRow ?? (currentPlayer ? currentPlayer.row : 2);
    const focusCol = activeCol ?? (currentPlayer ? currentPlayer.col : 2);

    boardEl.setAttribute('role', 'group');
    boardEl.setAttribute('aria-label', 'Room board, 5 rows by 5 columns');
    if (!boardEl.dataset.keyboardNavigation) {
        boardEl.addEventListener('keydown', event => {
            const tile = event.target.closest('.room-tile');
            if (!tile) return;

            const row = Number(tile.dataset.row);
            const col = Number(tile.dataset.col);
            const offsets = {
                ArrowUp: [-1, 0],
                ArrowDown: [1, 0],
                ArrowLeft: [0, -1],
                ArrowRight: [0, 1],
            };

            if (offsets[event.key]) {
                const [rowOffset, colOffset] = offsets[event.key];
                const next = boardEl.querySelector(
                    `.room-tile[data-row="${row + rowOffset}"][data-col="${col + colOffset}"]`
                );
                if (next) {
                    event.preventDefault();
                    next.focus();
                }
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                tile.click();
            }
        });
        boardEl.dataset.keyboardNavigation = 'true';
    }

    boardEl.innerHTML = '';

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const room = gameState.board[r][c];
            const tile = document.createElement('div');
            tile.className = 'room-tile';
            tile.dataset.row = r;
            tile.dataset.col = c;
            tile.setAttribute('role', 'button');
            tile.tabIndex = (r === focusRow && c === focusCol) ? 0 : -1;

            const svgArt = (typeof Room25Art !== 'undefined') ? Room25Art.getRoomSvg(room.type) : '';
            const hiddenSvgArt = (typeof Room25Art !== 'undefined') ? Room25Art.getRoomSvg('hidden') : '';

            if (room.revealed) {
                tile.classList.add('revealed');
                const info = ROOM_TYPES[room.type] || { category: 'safe', name: room.type };
                tile.classList.add('room-' + info.category);
                tile.innerHTML = `
                    <div class="room-art-bg" aria-hidden="true">${svgArt}</div>
                    <div class="room-content">
                        <div class="room-name">${info.name.toUpperCase()}</div>
                    </div>
                `;
            } else {
                tile.classList.add('face-down');
                tile.innerHTML = `
                    <div class="room-art-bg" aria-hidden="true">${hiddenSvgArt}</div>
                `;
            }

            const playersHere = gameState.players.filter(p => p.alive && p.row === r && p.col === c);
            const roomName = room.revealed
                ? (ROOM_TYPES[room.type] || { name: room.type }).name
                : 'Unexplored room';
            const occupants = playersHere.length ? `; ${playersHere.map(p => p.name).join(', ')}` : '';
            tile.setAttribute('aria-label', `${roomName}, row ${r + 1}, column ${c + 1}${occupants}`);

            if (playersHere.length > 0) {
                const isCrowded = playersHere.length > 4;
                const currentPlayer = isCrowded
                    ? playersHere.find(p => p.id === gameState.currentPlayerIndex)
                    : null;
                const visiblePlayers = isCrowded
                    ? [currentPlayer, ...playersHere.filter(p => p !== currentPlayer)].filter(Boolean).slice(0, 3)
                    : playersHere;
                const tokensDiv = document.createElement('div');
                tokensDiv.className = isCrowded ? 'player-tokens player-tokens-crowded' : 'player-tokens';
                tokensDiv.setAttribute('aria-hidden', 'true');
                visiblePlayers.forEach(p => {
                    const token = document.createElement('div');
                    token.className = 'player-token';
                    if (p.id === gameState.currentPlayerIndex && gameState.phase === 'resolution') {
                        token.classList.add('active-token');
                    }
                    token.style.setProperty('--token-color', p.color);
                    const charIndex = p.id % (typeof Room25Art !== 'undefined' ? Room25Art.CHARACTERS.length : 6);
                    const charData = (typeof Room25Art !== 'undefined') ? Room25Art.CHARACTERS[charIndex] : null;
                    if (charData && charData.avatarSvg) {
                        const wrap = document.createElement('div');
                        wrap.className = 'token-svg-wrap';
                        wrap.innerHTML = charData.avatarSvg;
                        token.appendChild(wrap);
                    } else {
                        token.style.background = p.color;
                        token.textContent = p.name[0];
                    }
                    token.title = p.name;
                    tokensDiv.appendChild(token);
                });
                if (isCrowded) {
                    const overflow = document.createElement('span');
                    overflow.className = 'player-token-overflow';
                    overflow.textContent = `+${playersHere.length - visiblePlayers.length}`;
                    overflow.setAttribute('aria-hidden', 'true');
                    tokensDiv.appendChild(overflow);
                }
                tile.appendChild(tokensDiv);
            }

            tile.addEventListener('click', () => onTileClick(r, c));
            tile.addEventListener('mouseenter', () => onTileHover(r, c));
            tile.addEventListener('mouseleave', () => clearRoomInfo());
            tile.addEventListener('focus', () => onTileHover(r, c));
            tile.addEventListener('blur', () => clearRoomInfo());
            boardEl.appendChild(tile);
            if (activeTile && r === activeRow && c === activeCol) {
                tile.focus({ preventScroll: true });
            }
        }
    }
    renderWaitingInputHighlights();
}

function renderPlayerList() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';

    gameState.players.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.setAttribute('role', 'listitem');
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
            if (gameState.gameOver || !p.alive) {
                roleHtml = `<div class="pc-role ${p.role}">${p.role.toUpperCase()}</div>`;
            } else if (
                idx === gameState.currentPlayerIndex &&
                gameState.phase === 'programming'
            ) {
                const isRoleVisible = gameState.privateRoleVisible;
                const roleText = isRoleVisible
                    ? `<span class="pc-role ${p.role} private-role">YOUR ROLE: ${p.role.toUpperCase()}</span>`
                    : '';
                const buttonText = isRoleVisible ? 'HIDE' : 'SHOW';
                const buttonLabel = isRoleVisible ? 'Hide your role' : 'Show your role';
                roleHtml = `
                    <div class="private-role-control">
                        ${roleText}
                        <button type="button"
                            class="private-role-toggle"
                            aria-label="${buttonLabel}"
                            aria-pressed="${isRoleVisible}">${buttonText}</button>
                    </div>
                `;
            } else {
                roleHtml = '<div class="pc-role hidden">ROLE: HIDDEN</div>';
            }
        }

        let actionsHtml = '';
        if (p.actions[0] || p.actions[1]) {
            actionsHtml = '<div class="pc-actions">';
            for (let a = 0; a < 2; a++) {
                if (p.actions[a]) {
                    const isRevealed = p.hasActed[a] || (idx === gameState.currentPlayerIndex && a === gameState.currentActionIndex && gameState.phase === 'resolution');
                    if (isRevealed) {
                        const cls = p.hasActed[a] ? 'pc-action-token resolved' : 'pc-action-token';
                        actionsHtml += `<span class="${cls}">${ACTIONS[p.actions[a]].name}</span>`;
                    } else if (gameState.phase === 'resolution') {
                        actionsHtml += `<span class="pc-action-token hidden">?</span>`;
                    }
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
        const roleToggle = card.querySelector('.private-role-toggle');
        if (roleToggle) {
            roleToggle.addEventListener('click', togglePrivateRoleVisibility);
        }
        list.appendChild(card);
    });
}

function togglePrivateRoleVisibility() {
    if (
        gameState.mode !== 'suspicion' ||
        gameState.phase !== 'programming' ||
        gameState.gameOver ||
        !gameState.players[gameState.currentPlayerIndex]?.alive
    ) {
        return;
    }

    gameState.privateRoleVisible = !gameState.privateRoleVisible;
    renderPlayerList();
    document.querySelector('#player-list .private-role-toggle')?.focus({ preventScroll: true });
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
        const selected = gameState.selectedActionSlot === i;
        const hasAction = Boolean(player.actions[i]);
        const clearButton = slot.closest('.action-slot-group').querySelector('.slot-clear');
        slot.classList.toggle('selected', selected);
        slot.setAttribute('aria-pressed', String(selected));
        if (hasAction) {
            val.textContent = ACTIONS[player.actions[i]].name;
            slot.classList.add('filled');
        } else {
            val.textContent = '—';
            slot.classList.remove('filled');
        }
        clearButton.classList.toggle('hidden', !hasAction);
        clearButton.disabled = !hasAction;
    }

    // Update confirm button
    const confirmBtn = document.getElementById('confirm-actions-btn');
    confirmBtn.disabled = !(player.actions[0] && player.actions[1]);

    // Update action buttons with restriction checks
    const curTile = (player && gameState.board) ? gameState.board[player.row][player.col] : null;
    const inCentral = (curTile && curTile.type === 'central');
    const inDark = (curTile && curTile.type === 'dark');

    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.classList.remove('selected');
        const act = btn.dataset.action;
        if (act === 'push' && inCentral) {
            btn.disabled = true;
            btn.classList.add('disabled-action');
            btn.title = "Cannot PUSH in Central Room (Safe Zone)";
            let badge = btn.querySelector('.action-restriction-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'action-restriction-badge';
                btn.appendChild(badge);
            }
            badge.textContent = 'NO PUSH';
            badge.style.display = 'block';
        } else if (act === 'peek' && inDark) {
            btn.disabled = true;
            btn.classList.add('disabled-action');
            btn.title = "Cannot LOOK while inside Dark Room";
            let badge = btn.querySelector('.action-restriction-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'action-restriction-badge';
                btn.appendChild(badge);
            }
            badge.textContent = 'NO LOOK';
            badge.style.display = 'block';
        } else {
            btn.disabled = false;
            btn.classList.remove('disabled-action');
            btn.removeAttribute('title');
            const badge = btn.querySelector('.action-restriction-badge');
            if (badge) badge.style.display = 'none';
        }
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
    const playersHere = gameState.players.filter(p => p.alive && p.row === row && p.col === col);

    if (!room.revealed) {
        infoDiv.innerHTML = `
            <div class="ri-name" style="color: var(--text-dim)">UNKNOWN ROOM</div>
            <div class="ri-type">FACE DOWN</div>
            <div class="ri-desc">This room hasn't been explored yet. Use LOOK to peek at it first!</div>
        `;
        appendRoomOccupants(infoDiv, playersHere);
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
    infoDiv.innerHTML = `
        <div class="ri-name" style="color: ${categoryColors[info.category]}">${info.icon} ${info.name}</div>
        <div class="ri-type">${info.category.toUpperCase()}</div>
        <div class="ri-desc">${info.desc}</div>
    `;
    appendRoomOccupants(infoDiv, playersHere);
}

function appendRoomOccupants(infoDiv, playersHere) {
    if (!playersHere.length) return;

    const section = document.createElement('div');
    section.className = 'room-info-occupants';
    if (playersHere.length > 4) {
        const button = document.createElement('button');
        const list = document.createElement('ul');
        button.type = 'button';
        button.className = 'room-occupants-toggle';
        button.textContent = `View ${playersHere.length} players`;
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'room-occupant-list');
        list.id = 'room-occupant-list';
        list.className = 'room-occupant-list';
        list.hidden = true;
        playersHere.forEach(player => {
            const item = document.createElement('li');
            item.textContent = player.name;
            list.appendChild(item);
        });
        button.addEventListener('click', () => {
            const expanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', String(!expanded));
            list.hidden = expanded;
        });
        section.append(button, list);
    } else {
        const summary = document.createElement('p');
        summary.className = 'room-occupants-summary';
        summary.textContent = `Players: ${playersHere.map(player => player.name).join(', ')}`;
        section.appendChild(summary);
    }
    infoDiv.appendChild(section);
}

function clearRoomInfo() {
    const infoDiv = document.getElementById('room-info');
    setTimeout(() => {
        if (infoDiv.matches(':hover, :focus-within') || document.querySelector('.room-tile:hover, .room-tile:focus')) {
            return;
        }
        infoDiv.innerHTML = '<p class="room-info-placeholder">Hover over a room to see details</p>';
    }, 400);
}

// ==================== PROGRAMMING PHASE ====================

function selectActionSlot(index) {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (gameState.phase !== 'programming' || !player) return;
    gameState.selectedActionSlot = index;
    playSound('click');
    renderProgrammingPanel();
}

function clearActionSlot(index) {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (gameState.phase !== 'programming' || !player || !player.actions[index]) return;
    player.actions[index] = null;
    gameState.selectedActionSlot = index;
    playSound('click');
    renderProgrammingPanel();
    document.getElementById(`action-slot-${index + 1}`).focus({ preventScroll: true });
}

function selectAction(action) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const curTile = (player && gameState.board) ? gameState.board[player.row][player.col] : null;
    if (!player || gameState.phase !== 'programming') return;
    if (action === 'push' && curTile && curTile.type === 'central') {
        playSound('error');
        addLog(`${player.name} cannot PUSH in Central Room (Safe Zone)!`, 'warning');
        setMessage('Cannot PUSH in Central Room (Safe Zone)!');
        return;
    }
    if (action === 'peek' && curTile && curTile.type === 'dark') {
        playSound('error');
        addLog(`${player.name} cannot LOOK while inside Dark Room!`, 'warning');
        setMessage('Cannot LOOK while inside Dark Room!');
        return;
    }

    let slotIndex = gameState.selectedActionSlot;
    if (slotIndex === null || slotIndex === undefined) {
        slotIndex = player.actions.indexOf(null);
    }
    if (slotIndex < 0) {
        setMessage('Select an action slot before replacing an action.');
        return;
    }

    playSound('click');
    player.actions[slotIndex] = action;
    gameState.selectedActionSlot = player.actions.indexOf(null);
    if (gameState.selectedActionSlot < 0) gameState.selectedActionSlot = null;
    renderProgrammingPanel();
}
function confirmActions() {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (!player.actions[0] || !player.actions[1]) return;

    playSound('lockIn');
    addLog(`${player.name} has programmed their actions.`, 'info');

    // Move to next player
    const nextIdx = getNextAlivePlayerIndex(gameState.currentPlayerIndex);

    if (nextIdx <= gameState.currentPlayerIndex || nextIdx >= gameState.players.length) {
        // All players have programmed — start resolution
        startResolutionPhase();
    } else {
        gameState.currentPlayerIndex = nextIdx;
        gameState.selectedActionSlot = 0;
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
    if (!input) {
        onTileHover(row, col);
        return;
    }

    const player = gameState.players[gameState.currentPlayerIndex];

    if (input === 'peek-tile') {
        // Must be adjacent and face-down
        if (!isAdjacent(player.row, player.col, row, col)) return;
        const room = gameState.board[row][col];
        if (room.revealed) return;

        // Peek at the room (show privately)
        const info = ROOM_TYPES[room.type];
        playSound('peek');
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
        playSound('peek');
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
        playSound('slide');

        const oldRow = player.row;
        const oldCol = player.col;
        const playerRoom = gameState.board[oldRow][oldCol];

        // Swap room types and revealed state
        const targetType = room.type;
        const targetRevealed = room.revealed;

        room.type = playerRoom.type; // 'moving'
        room.revealed = playerRoom.revealed; // true (revealed)

        playerRoom.type = targetType;
        playerRoom.revealed = targetRevealed; // stays false (unrevealed)

        // ALL players in the Moving Chamber travel with it to the new position
        gameState.players.forEach(p => {
            if (p.alive && p.row === oldRow && p.col === oldCol) {
                p.row = row;
                p.col = col;
            }
        });

        addLog(`🔄 ${player.name} and occupants moved with the Moving Chamber to (${row + 1}, ${col + 1})!`, 'success');
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

    const originRow = player.row;
    const originCol = player.col;

    // Move player
    player.row = targetRow;
    player.col = targetCol;

    // Reveal room
    const room = gameState.board[targetRow][targetCol];
    const wasHidden = !room.revealed;
    room.revealed = true;
    playSound('move');
    if (wasHidden) playSound('reveal');

    addLog(`${player.name} moved to (${targetRow + 1},${targetCol + 1})`, 'info');

    player.hasActed[gameState.currentActionIndex] = true;

    // Animate
    renderBoard();

    if (wasHidden) {
        const tile = getTileElement(targetRow, targetCol);
        if (tile) tile.classList.add('room-reveal');
    }

    // Trigger room effect and check illusion exit
    setTimeout(() => {
        checkIllusionExit(originRow, originCol);
        triggerRoomEffect(player, room);
    }, 400);
}

function executePush(target, targetRow, targetCol) {
    clearHighlights();
    gameState.waitingForInput = null;

    const player = gameState.players[gameState.currentPlayerIndex];

    const originRow = target.row;
    const originCol = target.col;

    // Move target
    target.row = targetRow;
    target.col = targetCol;

    // Reveal room
    const room = gameState.board[targetRow][targetCol];
    const wasHidden = !room.revealed;
    room.revealed = true;
    playSound('push');
    if (wasHidden) playSound('reveal');

    addLog(`${player.name} pushed ${target.name} to (${targetRow + 1},${targetCol + 1})!`, 'warning');

    player.hasActed[gameState.currentActionIndex] = true;

    renderBoard();

    if (wasHidden) {
        const tile = getTileElement(targetRow, targetCol);
        if (tile) tile.classList.add('room-reveal');
    }

    // Trigger effect on pushed player and check illusion exit
    setTimeout(() => {
        checkIllusionExit(originRow, originCol);
        triggerRoomEffect(target, room);
    }, 400);
}

function executeSlide(type, index, direction) {
    gameState.waitingForInput = null;
    const player = gameState.players[gameState.currentPlayerIndex];

    playSound('slide');
    addLog(`${player.name} used CONTROL to slide ${type} ${index + 1} ${direction > 0 ? (type === 'row' ? 'right' : 'down') : (type === 'row' ? 'left' : 'up')}`, 'info');

    let escapeResult = null;
    if (typeof Room25Engine !== 'undefined') {
        escapeResult = Room25Engine.checkEscapeSlide(gameState, type, index, direction, player);
        Room25Engine.executeSlide(gameState, type, index, direction);
    } else {
        if (type === 'row') slideRow(index, direction);
        else slideCol(index, direction);
    }

    player.hasActed[gameState.currentActionIndex] = true;

    if (escapeResult) {
        endGame(escapeResult.victory, escapeResult.message);
        return;
    }

    renderGame();
    setTimeout(() => advanceToNextAction(), 600);
}

function slideRow(rowIdx, dir) {
    if (typeof Room25Engine !== 'undefined') {
        Room25Engine.executeSlide(gameState, 'row', rowIdx, dir);
        return;
    }
    const board = gameState.board;
    const row = board[rowIdx];
    if (dir > 0) {
        const last = row[4];
        for (let c = 4; c > 0; c--) {
            row[c] = row[c - 1];
            row[c].col = c;
        }
        row[0] = last;
        row[0].col = 0;
    } else {
        const first = row[0];
        for (let c = 0; c < 4; c++) {
            row[c] = row[c + 1];
            row[c].col = c;
        }
        row[4] = first;
        row[4].col = 4;
    }
    gameState.players.forEach(p => {
        if (p.alive && p.row === rowIdx) {
            p.col += dir;
            if (p.col < 0) p.col = 4;
            if (p.col > 4) p.col = 0;
        }
    });
    for (let c = 0; c < 5; c++) row[c].row = rowIdx;
}

function slideCol(colIdx, dir) {
    if (typeof Room25Engine !== 'undefined') {
        Room25Engine.executeSlide(gameState, 'col', colIdx, dir);
        return;
    }
    const board = gameState.board;
    if (dir > 0) {
        const last = board[4][colIdx];
        for (let r = 4; r > 0; r--) {
            board[r][colIdx] = board[r - 1][colIdx];
            board[r][colIdx].row = r;
        }
        board[0][colIdx] = last;
        board[0][colIdx].row = 0;
    } else {
        const first = board[0][colIdx];
        for (let r = 0; r < 4; r++) {
            board[r][colIdx] = board[r + 1][colIdx];
            board[r][colIdx].row = r;
        }
        board[4][colIdx] = first;
        board[4][colIdx].row = 4;
    }
    gameState.players.forEach(p => {
        if (p.alive && p.col === colIdx) {
            p.row += dir;
            if (p.row < 0) p.row = 4;
            if (p.row > 4) p.row = 0;
        }
    });
    for (let r = 0; r < 5; r++) board[r][colIdx].col = colIdx;
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
            playSound('turnAlert');
            player.trapped = true;
            player.trappedRound = gameState.currentRound;
            player.trappedActionIndex = gameState.currentActionIndex;
            player.trappedTurns = 0;
            addLog(`${player.name} is TRAPPED! Must escape on their next action or die!`, 'danger');
            setMessage(`${player.name} is TRAPPED! They must escape on next action!`);
            advanceToNextAction();
            break;

        case 'acid':
            // If 2+ players, one dies
            handleAcidBath(player, room);
            break;

        case 'flooded':
            playSound('water');
            addLog(`🌊 ${player.name} enters the Flooded Room. Stay 2 consecutive rounds and you'll drown!`, 'warning');
            advanceToNextAction();
            break;

        case 'vortex':
            // Send back to central
            playSound('vortex');
            player.row = 2;
            player.col = 2;
            addLog(`${player.name} was caught in a VORTEX! Sent back to Central Room!`, 'warning');
            renderBoard();
            advanceToNextAction();
            break;

        case 'freezer':
            player.frozen = true;
            playSound('freeze');
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
            playSound('room25');
            addLog(`${player.name} found ROOM 25! THE EXIT!`, 'success');
            setMessage(`ROOM 25 FOUND! Use Control to slide it off the board to escape!`);
            advanceToNextAction();
            break;

        case 'twins':
            let otherTwin = null;
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    const cell = gameState.board[r][c];
                    if (cell.type === 'twins' && (r !== room.row || c !== room.col)) {
                        otherTwin = cell;
                    }
                }
            }
            if (otherTwin) {
                player.row = otherTwin.row;
                player.col = otherTwin.col;
                otherTwin.revealed = true;
                addLog(`👥 ${player.name} entered Twin Room and warped to the other Twin Room at (${otherTwin.row + 1}, ${otherTwin.col + 1})!`, 'warning');
                renderBoard();
            } else {
                addLog(`👥 ${player.name} entered Twin Room.`, 'info');
            }
            advanceToNextAction();
            break;

        case 'illusion':
            addLog(`✨ ${player.name} enters the Illusion Room. It will vanish when everyone leaves!`, 'warning');
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
        killPlayer(victim, 'was dissolved in the Acid Bath!', 'acid');
    } else {
        addLog(`${enteringPlayer.name} enters the Acid Bath. Dangerous if someone else joins!`, 'warning');
        advanceToNextAction();
    }
}


function checkIllusionExit(fromRow, fromCol) {
    const originRoom = gameState.board[fromRow][fromCol];
    if (!originRoom || originRoom.type !== 'illusion') return;

    // Check if any alive players remain in this room
    const remaining = gameState.players.filter(p => p.alive && p.row === fromRow && p.col === fromCol);
    if (remaining.length > 0) return;

    const hiddenRooms = [];
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = gameState.board[r][c];
            if (!cell.revealed && cell.type !== 'central' && cell.type !== 'room25') {
                hiddenRooms.push({ r, c });
            }
        }
    }

    if (hiddenRooms.length > 0) {
        const target = hiddenRooms[Math.floor(Math.random() * hiddenRooms.length)];
        const targetRoom = gameState.board[target.r][target.c];

        const tempType = targetRoom.type;
        targetRoom.type = 'illusion';
        targetRoom.revealed = false;

        originRoom.type = tempType;
        originRoom.revealed = false;

        addLog(`✨ The Illusion Room vanished after occupants left and shifted with a hidden room!`, 'warning');
        renderBoard();
    }
}
function killPlayer(player, reason, soundType = 'death') {
    playSound(soundType);
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

    if (gameState.gameOver) return;

    // Find next alive player for the current action index (Action 1 for all players, then Action 2)
    let nextIdx = gameState.currentPlayerIndex + 1;
    while (nextIdx < gameState.players.length && !gameState.players[nextIdx].alive) {
        nextIdx++;
    }

    if (nextIdx < gameState.players.length) {
        // Next player performs their current action index
        gameState.currentPlayerIndex = nextIdx;
        renderGame();
        setTimeout(() => beginCurrentAction(), 400);
        return;
    }

    // All players have performed the current action index
    if (gameState.currentActionIndex === 0) {
        // Switch to Action 2, start back with first alive player
        gameState.currentActionIndex = 1;
        let firstAlive = 0;
        while (firstAlive < gameState.players.length && !gameState.players[firstAlive].alive) {
            firstAlive++;
        }
        gameState.currentPlayerIndex = firstAlive;
        addLog(`--- Resolving Action 2 ---`, 'info');
        renderGame();
        setTimeout(() => beginCurrentAction(), 400);
    } else {
        // Both Action 1 and Action 2 have been completed by all players!
        endRound();
    }
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
    // Check flooded & trapped — players who didn't leave
    gameState.players.forEach(p => {
        if (!p.alive) return;
        const curRoom = gameState.board[p.row][p.col];
        if (curRoom.type === 'flooded') {
            p.floodedTurns = (p.floodedTurns || 0) + 1;
            if (p.floodedTurns >= 2) {
                killPlayer(p, 'drowned in the Flooded Room!', 'water');
            } else {
                addLog(`🌊 Water is rising in the Flooded Room! ${p.name} will drown next round!`, 'warning');
            }
        } else {
            p.floodedTurns = 0;
        }

        if (p.trapped) {
            p.trappedTurns++;
            if (p.trappedTurns >= 2) {
                killPlayer(p, 'failed to escape the Trapped Room and was executed!');
                p.trapped = false;
            }
        }
    });

    const timeout = Room25Engine.getTimeLimitResult(
        gameState,
        'Time ran out! The complex has sealed itself forever.'
    );
    if (timeout) {
        endGame(timeout.victory, timeout.message);
        return;
    }

    // Advance round
    gameState.currentRound++;
    gameState.phase = 'programming';
    gameState.currentPlayerIndex = 0;
    gameState.currentActionIndex = 0;
    gameState.selectedActionSlot = 0;

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
                p.trappedRound = undefined;
                p.trappedActionIndex = undefined;
                addLog(`${p.name} escaped the Trapped Room!`, 'success');
            }
        }
    });

    // Check Trapped execution: must leave by the end of their next action
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer && currentPlayer.alive && currentPlayer.trapped) {
        if (currentPlayer.trappedRound !== undefined && currentPlayer.trappedActionIndex !== undefined) {
            const actionsPassed = (gameState.currentRound - currentPlayer.trappedRound) * 2 + (gameState.currentActionIndex - currentPlayer.trappedActionIndex);
            if (actionsPassed >= 1) {
                killPlayer(currentPlayer, 'failed to escape the Trapped Room and was executed!');
                currentPlayer.trapped = false;
            }
        }
    }
}

// ==================== WIN/LOSE CONDITIONS ====================


function endGame(victory, message) {
    if (gameState.gameOver) return;
    gameState.gameOver = true;
    playSound(victory ? 'victory' : 'error');
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

    Room25UI.openDialog(overlay, {
        initialFocus: () => overlay.querySelector('button'),
        focusFallback: () => document.querySelector('#screen-game'),
    });
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

function renderWaitingInputHighlights() {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (!player || !player.alive) return;

    switch (gameState.waitingForInput) {
        case 'peek-tile':
            highlightAdjacentTiles(player.row, player.col, 'peek');
            break;
        case 'direction':
            highlightAdjacentTiles(player.row, player.col, 'move');
            break;
        case 'push-direction':
            highlightAdjacentTiles(player.row, player.col, 'push');
            break;
        case 'vision-tile':
        case 'moving-tile':
            highlightAllHiddenTiles();
            break;
    }
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

    Room25UI.openDialog(modal, {
        initialFocus: () => modal.querySelector('button'),
        restoreTarget: () => document.querySelector('#game-board .room-tile[tabindex="0"]'),
    });
}

function closePeekModal() {
    Room25UI.closeDialog(document.getElementById('peek-modal'));
    const display = document.getElementById('peek-room-display');
    display.className = 'peek-room-display';
    display.replaceChildren();
    document.getElementById('peek-room-desc').textContent = '';
    if (!gameState.bonusAction) {
        advanceToNextAction();
    } else {
        checkBonusRoomDone();
    }
}


// Turn Overlay
function showTurnOverlay(title, text) {
    gameState.privateRoleVisible = false;
    const overlay = document.getElementById('turn-overlay');
    document.getElementById('turn-overlay-title').textContent = title;
    document.getElementById('turn-overlay-text').textContent = text;
    Room25UI.openDialog(overlay, {
        initialFocus: () => overlay.querySelector('button'),
        restoreTarget: () => document.querySelector('#game-board .room-tile[tabindex="0"]'),
    });
}

function dismissOverlay() {
    Room25UI.closeDialog(document.getElementById('turn-overlay'));
    gameState.privateRoleVisible = true;
    if (gameState.mode === 'suspicion' && gameState.phase === 'programming') {
        renderPlayerList();
    }
}

// Game Log
let gameLogPreviousFocus = null;
function toggleGameLog() {
    const log = document.getElementById('game-log');
    if (log.classList.contains('hidden')) {
        gameLogPreviousFocus = document.activeElement;
        log.classList.remove('hidden');
        log.querySelector('button').focus({ preventScroll: true });
    } else {
        log.classList.add('hidden');
        const menu = gameLogPreviousFocus?.closest('[data-hud-overflow-menu]');
        const restoreTarget = menu && !menu.open ? menu.querySelector('summary') : gameLogPreviousFocus;
        if (restoreTarget && restoreTarget.isConnected) {
            restoreTarget.focus({ preventScroll: true });
        }
        gameLogPreviousFocus = null;
    }
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
    const modal = document.getElementById('quit-confirm-modal');
    if (!modal) return;
    Room25UI.openDialog(modal, {
        initialFocus: () => modal.querySelector('.quit-cancel-btn'),
        onEscape: closeQuitConfirmation,
    });
}

function closeQuitConfirmation() {
    Room25UI.closeDialog(document.getElementById('quit-confirm-modal'));
}

function quitToMenu() {
    Room25UI.closeDialog(document.getElementById('quit-confirm-modal'), { restoreFocus: false });
    showScreen('screen-menu');
}

// ==================== ROOM EFFECTS & RESTRICTIONS GUIDE MODAL ====================
let currentRoomGuideTab = 'rules';

function openRoomGuideModal(tab = 'rules') {
    currentRoomGuideTab = tab;
    document.querySelectorAll('.rg-tab').forEach(button => {
        const selected = button.dataset.tab === tab;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    renderRoomGuideContent();
    const modal = document.getElementById('modal-room-guide');
    if (modal) {
        Room25UI.openDialog(modal, {
            initialFocus: () => modal.querySelector('.room-guide-close-btn'),
            onEscape: closeRoomGuideModal,
        });
    }
}

function closeRoomGuideModal() {
    Room25UI.closeDialog(document.getElementById('modal-room-guide'));
}

function switchRoomGuideTab(tab) {
    currentRoomGuideTab = tab;
    document.querySelectorAll('.rg-tab').forEach(button => {
        const selected = button.dataset.tab === tab;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    renderRoomGuideContent();
}

function renderRoomGuideContent() {
    const body = document.getElementById('room-guide-body');
    if (!body) return;

    if (currentRoomGuideTab === 'rules') {
        body.innerHTML = `
            <div class="rg-rules-container">
                <div class="rg-rule-card highlight-warning">
                    <div class="rg-rule-card-header">
                        <span class="rg-rule-action-icon">👊</span>
                        <span class="rg-rule-action-title">PUSH ACTION</span>
                        <span class="rg-rule-badge-prohibited">RESTRICTED IN CENTRAL</span>
                    </div>
                    <ul class="rg-rule-list">
                        <li><strong>Critical Restriction:</strong> PUSH is strictly forbidden in Central Room (Safe Zone). The PUSH button is disabled while you are in this room.</li>
                        <li>Must have another prisoner in your room to push them.</li>
                        <li>Target is pushed into an adjacent chamber (N/S/E/W). If face-down, it is revealed immediately and victim triggers its hazard.</li>
                    </ul>
                </div>

                <div class="rg-rule-card">
                    <div class="rg-rule-card-header">
                        <span class="rg-rule-action-icon">👁</span>
                        <span class="rg-rule-action-title">LOOK (PEEK) ACTION</span>
                        <span class="rg-rule-badge-prohibited" style="border-color:#ffd700;color:#ffd700;background:rgba(255,215,0,0.15);">RESTRICTED IN DARK ROOM</span>
                    </div>
                    <ul class="rg-rule-list">
                        <li><strong>Critical Restriction:</strong> LOOK is impossible while inside Dark Room. Button is disabled.</li>
                        <li>Inspect 1 adjacent face-down room secretly without moving.</li>
                    </ul>
                </div>

                <div class="rg-rule-card">
                    <div class="rg-rule-card-header">
                        <span class="rg-rule-action-icon">⚙</span>
                        <span class="rg-rule-action-title">CONTROL (SLIDE) ACTION</span>
                    </div>
                    <ul class="rg-rule-list">
                        <li><strong>Row/Column Lock:</strong> Row 3 and Column 3 are fixed and cannot be shifted due to the central room.</li>
                        <li>Shift other rows or columns; rooms wrap around and occupants move with them.</li>
                    </ul>
                </div>

                <div class="rg-rule-card">
                    <div class="rg-rule-card-header">
                        <span class="rg-rule-action-icon">🏃</span>
                        <span class="rg-rule-action-title">MOVE ACTION</span>
                    </div>
                    <ul class="rg-rule-list">
                        <li>Step into an adjacent room. Unexplored rooms are revealed immediately.</li>
                        <li>Hazards trigger upon entry. Entering Mortal Chamber results in instant death!</li>
                    </ul>
                </div>
            </div>
        `;
        return;
    }

    const keys = Object.keys(ROOM_TYPES);
    let filteredKeys = keys;
    if (currentRoomGuideTab === 'safe') {
        filteredKeys = keys.filter(k => ROOM_TYPES[k].category === 'safe');
    } else if (currentRoomGuideTab === 'warning') {
        filteredKeys = keys.filter(k => ROOM_TYPES[k].category === 'warning');
    } else if (currentRoomGuideTab === 'danger') {
        filteredKeys = keys.filter(k => ROOM_TYPES[k].category === 'danger');
    } else if (currentRoomGuideTab === 'special') {
        filteredKeys = keys.filter(k => ROOM_TYPES[k].category === 'central' || ROOM_TYPES[k].category === 'exit');
    }

    const restrictions = {
        central: '🚫 No PUSH allowed (Safe Zone)',
        room25: '🏁 Must slide off edge to escape',
        empty: '✅ Safe room',
        vision: '🔮 Unlimited peek anywhere',
        moving: '🔄 Swap with any hidden tile',
        controlRoom: '⚙ Free Control action',
        vortex: '🌀 Teleport to Central',
        freezer: '🧊 Lose next action',
        dark: '🚫 Cannot LOOK while inside',
        mortal: '💀 Instant Death upon entry',
        trapped: '⚠️ Must leave next turn or die',
        acid: '☣️ 2+ players: 1 player dies',
        flooded: '🌊 Drown after 2 rounds',
        twins: '👥 Teleports to twin chamber',
        illusion: '✨ Shifts position after exit'
    };

    let cardsHtml = '<div class="rg-room-grid">';
    filteredKeys.forEach(k => {
        const item = ROOM_TYPES[k];
        const cat = item.category;
        const catLabel = cat.toUpperCase();
        const rest = restrictions[k];
        const isProhibited = rest && rest.includes('No ');
        cardsHtml += `
            <div class="rg-room-card cat-${cat}">
                <div class="rg-card-top">
                    <div class="rg-card-identity">
                        <span class="rg-card-icon">${item.icon}</span>
                        <span class="rg-card-name">${item.name}</span>
                    </div>
                    <span class="rg-category-badge ${cat}">${catLabel}</span>
                </div>
                ${rest ? `<div class="rg-restriction-callout ${isProhibited ? 'prohibited' : ''}">⚡ ${rest}</div>` : ''}
                <div class="rg-card-desc">${item.desc}</div>
            </div>
        `;
    });
    cardsHtml += '</div>';

    body.innerHTML = cardsHtml;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeRoomGuideModal();
    }
});

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
