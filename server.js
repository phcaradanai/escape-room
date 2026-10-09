const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Colors for players
const PLAYER_COLORS = [
    '#00d4ff', '#ff3e8e', '#00ff88', '#ffd700', '#ff8c00', '#8b5cf6', '#a855f7', '#ec4899'
];

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

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function buildBoard() {
    const board = [];
    for (let r = 0; r < 5; r++) {
        board[r] = [];
        for (let c = 0; c < 5; c++) {
            board[r][c] = null;
        }
    }

    board[2][2] = {
        type: 'central',
        revealed: true,
        row: 2,
        col: 2,
    };

    let deck = shuffleArray(ROOM_DECK).slice(0, 24);
    if (!deck.includes('room25')) {
        deck[deck.length - 1] = 'room25';
        deck = shuffleArray(deck);
    }

    // Ensure Twins always appear as a pair if present
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

// In-memory rooms: roomCode -> roomState
const rooms = new Map();

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return rooms.has(code) ? generateRoomCode() : code;
}

function getSanitizedGameState(room, forSocketId) {
    if (!room.game) return null;
    const g = room.game;
    const clientPlayer = g.players.find(p => p.socketId === forSocketId);

    // Deep copy board to mask hidden rooms unless peeked by this player
    const sanitizedBoard = g.board.map(row => row.map(cell => {
        const isRevealed = cell.revealed;
        const peekedByMe = clientPlayer && clientPlayer.peekedRooms && clientPlayer.peekedRooms.some(pr => pr.r === cell.row && (pr.c === cell.col || pr.col === cell.col));
        if (isRevealed || peekedByMe) {
            return {
                type: cell.type,
                revealed: isRevealed,
                peekedByMe: !isRevealed && peekedByMe,
                row: cell.row,
                col: cell.col
            };
        }
        return {
            type: 'hidden',
            revealed: false,
            peekedByMe: false,
            row: cell.row,
            col: cell.col
        };
    }));

    // Players list: hide secret roles if not player himself or in suspicion mode
    const sanitizedPlayers = g.players.map(p => {
        const isSelf = p.socketId === forSocketId;
        const showRole = (g.mode !== 'suspicion') || isSelf || g.gameOver;
        return {
            id: p.id,
            isSelf: isSelf,
            name: p.name,
            color: p.color,
            role: showRole ? p.role : 'hidden',
            alive: p.alive,
            row: p.row,
            col: p.col,
            frozen: p.frozen,
            trapped: p.trapped,
            // Only reveal actions programmed if already acted or if it's self
            actionsCount: p.actions.filter(Boolean).length,
            actions: isSelf ? p.actions : (g.phase === 'resolution' ? p.actions : [null, null]),
            hasActed: p.hasActed
        };
    });

    return {
        myPlayerId: g.players.find(p => p.socketId === forSocketId)?.id ?? null,
        roomCode: room.code,
        hostId: room.hostId,
        mode: g.mode,
        maxRounds: g.maxRounds,
        currentRound: g.currentRound,
        phase: g.phase, // 'programming' | 'resolution'
        currentPlayerIndex: g.currentPlayerIndex,
        currentActionIndex: g.currentActionIndex,
        waitingForInput: g.waitingForInput,
        pushTargetId: g.pushTargetId,
        board: sanitizedBoard,
        players: sanitizedPlayers,
        logs: g.logs.slice(-40),
        gameOver: g.gameOver,
        gameResult: g.gameResult
    };
}

function broadcastGameState(room) {
    room.players.forEach(p => {
        const state = getSanitizedGameState(room, p.socketId);
        io.to(p.socketId).emit('gameStateUpdate', state);
    });
}

function addRoomLog(room, message, type = 'info') {
    if (!room.game) return;
    room.game.logs.push({
        round: room.game.currentRound,
        message,
        type,
        time: Date.now()
    });
}

function isAdjacent(r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

// Resolution logic
function beginCurrentAction(room) {
    const g = room.game;
    if (g.gameOver) return;

    const player = g.players[g.currentPlayerIndex];
    if (!player || !player.alive) {
        advanceToNextAction(room);
        return;
    }

    const action = player.actions[g.currentActionIndex];

    if (player.frozen) {
        player.frozen = false;
        addRoomLog(room, `${player.name} is FROZEN and loses this action!`, 'warning');
        player.hasActed[g.currentActionIndex] = true;
        broadcastGameState(room);
        setTimeout(() => advanceToNextAction(room), 1500);
        return;
    }

    if (!action) {
        advanceToNextAction(room);
        return;
    }

    switch (action) {
        case 'peek':
            const currentRoom = g.board[player.row][player.col];
            if (currentRoom.type === 'dark') {
                addRoomLog(room, `${player.name} cannot LOOK from the Dark Room!`, 'warning');
                player.hasActed[g.currentActionIndex] = true;
                broadcastGameState(room);
                setTimeout(() => advanceToNextAction(room), 1500);
                return;
            }
            g.waitingForInput = {
                type: 'peek-tile',
                playerId: player.id,
                originRow: player.row,
                originCol: player.col
            };
            addRoomLog(room, `${player.name} is choosing an adjacent room to LOOK at.`, 'info');
            break;

        case 'move':
            g.waitingForInput = {
                type: 'move-tile',
                playerId: player.id,
                originRow: player.row,
                originCol: player.col
            };
            addRoomLog(room, `${player.name} is choosing where to MOVE.`, 'info');
            break;

        case 'push':
            const curTile = g.board[player.row][player.col];
            if (curTile.type === 'central') {
                addRoomLog(room, `${player.name} cannot PUSH in the Central Room!`, 'warning');
                player.hasActed[g.currentActionIndex] = true;
                broadcastGameState(room);
                setTimeout(() => advanceToNextAction(room), 1500);
                return;
            }
            const othersInRoom = g.players.filter(p => p.alive && p.id !== player.id && p.row === player.row && p.col === player.col);
            if (othersInRoom.length === 0) {
                addRoomLog(room, `${player.name} tried to PUSH, but no one is in the room!`, 'warning');
                player.hasActed[g.currentActionIndex] = true;
                broadcastGameState(room);
                setTimeout(() => advanceToNextAction(room), 1500);
                return;
            }
            if (othersInRoom.length === 1) {
                g.pushTargetId = othersInRoom[0].id;
                g.waitingForInput = {
                    type: 'push-dir',
                    playerId: player.id,
                    targetId: othersInRoom[0].id,
                    originRow: player.row,
                    originCol: player.col
                };
                addRoomLog(room, `${player.name} is choosing a direction to push ${othersInRoom[0].name}.`, 'warning');
            } else {
                g.waitingForInput = {
                    type: 'push-target',
                    playerId: player.id,
                    targets: othersInRoom.map(p => ({ id: p.id, name: p.name, color: p.color }))
                };
                addRoomLog(room, `${player.name} is choosing who to PUSH.`, 'warning');
            }
            break;

        case 'control':
            g.waitingForInput = {
                type: 'slide',
                playerId: player.id
            };
            addRoomLog(room, `${player.name} is using CONTROL to shift the Complex!`, 'info');
            break;
    }

    broadcastGameState(room);
}

function advanceToNextAction(room) {
    const g = room.game;
    if (g.gameOver) return;

    g.waitingForInput = null;
    g.pushTargetId = null;

    // Clear trapped if they moved out
    g.players.forEach(p => {
        if (p.alive && p.trapped) {
            const currentRoom = g.board[p.row][p.col];
            if (currentRoom.type !== 'trapped') {
                p.trapped = false;
                addRoomLog(room, `✓ ${p.name} escaped the Trapped Room!`, 'success');
            }
        }
    });

    // Check Trapped execution before advancing to next player's action sequence
    const currentPlayer = g.players[g.currentPlayerIndex];
    if (currentPlayer && currentPlayer.alive && currentPlayer.trapped) {
        let mustDie = false;
        if (currentPlayer.trappedRound !== undefined && currentPlayer.trappedActionIndex !== undefined) {
            const isNextAction = (g.currentRound > currentPlayer.trappedRound) ||
                                 (g.currentRound === currentPlayer.trappedRound && g.currentActionIndex > currentPlayer.trappedActionIndex);

            if (isNextAction) {
                // Determine if this is the end of the action *after* they were trapped
                const actionPassed = (g.currentRound - currentPlayer.trappedRound) * 2 + (g.currentActionIndex - currentPlayer.trappedActionIndex);
                if (actionPassed >= 1) {
                    mustDie = true;
                }
            }
        }

        if (mustDie) {
            currentPlayer.alive = false;
            currentPlayer.trapped = false;
            addRoomLog(room, `☠ ${currentPlayer.name} failed to escape the Trapped Room and was executed!`, 'danger');
            checkDeathWinLoss(room);
        }
    }

    if (g.gameOver) return;

    // Find next alive player for the current action index
    let nextPlayerIdx = g.currentPlayerIndex + 1;
    while (nextPlayerIdx < g.players.length && !g.players[nextPlayerIdx].alive) {
        nextPlayerIdx++;
    }

    if (nextPlayerIdx < g.players.length) {
        // Next player performs their current action
        g.currentPlayerIndex = nextPlayerIdx;
        broadcastGameState(room);
        setTimeout(() => beginCurrentAction(room), 1000);
        return;
    }

    // All players have performed the current action index
    if (g.currentActionIndex === 0) {
        // Switch to Action 2, start back with first alive player
        g.currentActionIndex = 1;
        let firstAlive = 0;
        while (firstAlive < g.players.length && !g.players[firstAlive].alive) {
            firstAlive++;
        }
        g.currentPlayerIndex = firstAlive;
        addRoomLog(room, `Action 1 complete! Resolving Action 2...`, 'info');
        broadcastGameState(room);
        setTimeout(() => beginCurrentAction(room), 1000);
    } else {
        // Both Action 1 and Action 2 have been completed by all players!
        endRound(room);
    }
}

function endRound(room) {
    const g = room.game;
    if (g.gameOver) return;

    // Resolve trapped / flooded status
    g.players.forEach(p => {
        if (!p.alive) return;
        if (curRoom.type === 'flooded') {
            p.floodedRounds = (p.floodedRounds || 0) + 1;
            if (p.floodedRounds >= 2) {
                p.alive = false;
                addRoomLog(room, `🌊 ${p.name} drowned in the Flooded Room after staying 2 consecutive rounds!`, 'danger');
                checkDeathWinLoss(room);
            } else {
                addRoomLog(room, `🌊 Water is rising in the Flooded Room! ${p.name} will drown if they stay another round!`, 'warning');
            }
        } else {
            p.floodedRounds = 0;
        }
        if (p.trapped) {
            p.trappedTurns = (p.trappedTurns || 0) + 1;
            if (p.trappedTurns >= 2) {
                p.alive = false;
                addRoomLog(room, `☠ ${p.name} failed to escape the Trapped Room and was executed!`, 'danger');
            }
        }
    });

    const aliveCount = g.players.filter(p => p.alive).length;
    if (aliveCount === 0) {
        endGame(room, false, 'All prisoners have perished!');
        return;
    }

    if (g.currentRound >= g.maxRounds) {
        endGame(room, false, 'Time ran out! The complex lockdown is permanent.');
        return;
    }

    // Advance round
    g.currentRound++;
    g.phase = 'programming';
    g.currentActionIndex = 0;
    let firstAlive = 0;
    while (firstAlive < g.players.length && !g.players[firstAlive].alive) firstAlive++;
    g.currentPlayerIndex = firstAlive;

    g.players.forEach(p => {
        p.actions = [null, null];
        p.hasActed = [false, false];
    });

    addRoomLog(room, `=== ROUND ${g.currentRound} PROGRAMMING PHASE ===`, 'info');
    broadcastGameState(room);
}

function triggerRoomEffect(room, player, targetRoom, isPushed = false) {
    const g = room.game;
    if (!player.alive) return;

    switch (targetRoom.type) {
        case 'mortal':
            player.alive = false;
            addRoomLog(room, `☠ ${player.name} stepped into the MORTAL CHAMBER and was destroyed!`, 'danger');
            checkDeathWinLoss(room);
            advanceToNextAction(room);
            break;

        case 'vortex':
            player.row = 2;
            player.col = 2;
            addRoomLog(room, `🌀 ${player.name} fell into a VORTEX and was transported back to the Central Room!`, 'warning');
            advanceToNextAction(room);
            break;

        case 'freezer':
            player.frozen = true;
            addRoomLog(room, `🧊 ${player.name} is FROZEN! They will lose their next action!`, 'warning');
            advanceToNextAction(room);
            break;

        case 'trapped':
            player.trapped = true;
            player.trappedRound = g.currentRound;
            player.trappedActionIndex = g.currentActionIndex;
            addRoomLog(room, `⚠️ ${player.name} entered a TRAPPED ROOM! Escape on next turn or be executed!`, 'danger');
            advanceToNextAction(room);
            break;

        case 'flooded':
            addRoomLog(room, `🌊 ${player.name} waded into the Flooded Room! Escape before round ends or drown!`, 'warning');
            advanceToNextAction(room);
            break;

        case 'acid':
            const playersHere = g.players.filter(p => p.alive && p.row === targetRoom.row && p.col === targetRoom.col);
            if (playersHere.length >= 2) {
                // One dissolves
                const victim = player;
                victim.alive = false;
                addRoomLog(room, `☣️ ACID BATH OVERFLOW! ${victim.name} was dissolved!`, 'danger');
                checkDeathWinLoss(room);
            } else {
                addRoomLog(room, `☣️ ${player.name} entered the Acid Bath. Dangerous if anyone else enters!`, 'warning');
            }
            advanceToNextAction(room);
            break;

        case 'room25':
            addRoomLog(room, `🚪 ${player.name} found ROOM 25! Use CONTROL when everyone is here at an edge to escape!`, 'success');
            advanceToNextAction(room);
            break;

        case 'controlRoom':
            addRoomLog(room, `🎛️ ${player.name} activated the Control Chamber! Bonus slide granted!`, 'success');
            g.waitingForInput = {
                type: 'slide',
                playerId: player.id,
                bonus: true
            };
            broadcastGameState(room);
            break;

        case 'vision':
            addRoomLog(room, `🔮 ${player.name} activated the Vision Chamber! Choose any hidden room to view.`, 'success');
            g.waitingForInput = {
                type: 'vision-tile',
                playerId: player.id
            };
            broadcastGameState(room);
            break;
        case 'moving':
            const hasHiddenMoving = g.board.flat().some(r => !r.revealed);
            if (hasHiddenMoving) {
                addRoomLog(room, `🔄 ${player.name} activated the Moving Chamber! Choose any hidden room to swap with.`, 'success');
                g.waitingForInput = {
                    type: 'moving-tile',
                    playerId: player.id
                };
                broadcastGameState(room);
            } else {
                addRoomLog(room, `🔄 ${player.name} entered Moving Chamber, but no hidden rooms remain to swap with.`, 'info');
                advanceToNextAction(room);
            }
            break;

        case 'illusion':
            addRoomLog(room, `✨ ${player.name} entered Illusion Room! The room has already shifted around you!`, 'warning');
            advanceToNextAction(room);
            break;

        case 'twins':
            let otherTwin = null;
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    const cell = g.board[r][c];
                    if (cell.type === 'twins' && (r !== targetRoom.row || c !== targetRoom.col)) {
                        otherTwin = cell;
                    }
                }
            }
            if (otherTwin) {
                player.row = otherTwin.row;
                player.col = otherTwin.col;
                otherTwin.revealed = true;
                addRoomLog(room, `👥 ${player.name} entered Twin Room and warped to the other Twin Room at (${otherTwin.row + 1}, ${otherTwin.col + 1})!`, 'warning');
            } else {
                addRoomLog(room, `👥 ${player.name} entered Twin Room, but the other twin is not on the board!`, 'warning');
            }
            advanceToNextAction(room);
            break;

        default:
            advanceToNextAction(room);
            break;
    }
}

function checkIllusionExit(room, fromRow, fromCol) {
    const g = room.game;
    const originRoom = g.board[fromRow][fromCol];
    if (!originRoom || originRoom.type !== 'illusion') return;

    // Check if any alive players remain in this illusion room
    const remaining = g.players.filter(p => p.alive && p.row === fromRow && p.col === fromCol);
    if (remaining.length > 0) return;

    // Find all hidden rooms (not central, not room25)
    const hiddenRooms = [];
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = g.board[r][c];
            if (!cell.revealed && cell.type !== 'central' && cell.type !== 'room25') {
                hiddenRooms.push({ r, c });
            }
        }
    }

    if (hiddenRooms.length > 0) {
        const target = hiddenRooms[Math.floor(Math.random() * hiddenRooms.length)];
        const targetRoom = g.board[target.r][target.c];

        const tempType = targetRoom.type;
        targetRoom.type = 'illusion';
        targetRoom.revealed = false;

        originRoom.type = tempType;
        originRoom.revealed = false;

        addRoomLog(room, `✨ The Illusion Room vanished after occupants left and shifted with a hidden chamber!`, 'warning');
    }
}

function checkDeathWinLoss(room) {
    const g = room.game;
    const aliveCount = g.players.filter(p => p.alive).length;
    if (aliveCount === 0) {
        endGame(room, false, 'All prisoners have been eliminated!');
        return;
    }
    if (g.mode === 'suspicion') {
        const alivePrisoners = g.players.filter(p => p.alive && p.role === 'prisoner');
        if (alivePrisoners.length === 0) {
            endGame(room, false, 'All prisoners eliminated! The Guards win!');
        }
    }
}

function executeSlide(room, type, index, direction) {
    const g = room.game;
    const dir = parseInt(direction);
    const board = g.board;

    if (type === 'row') {
        const row = board[index];
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
        g.players.forEach(p => {
            if (p.alive && p.row === index) {
                p.col = (p.col + dir + 5) % 5;
            }
        });
        for (let c = 0; c < 5; c++) row[c].row = index;
    } else {
        if (dir > 0) {
            const last = board[4][index];
            for (let r = 4; r > 0; r--) {
                board[r][index] = board[r - 1][index];
                board[r][index].row = r;
            }
            board[0][index] = last;
            board[0][index].row = 0;
        } else {
            const first = board[0][index];
            for (let r = 0; r < 4; r++) {
                board[r][index] = board[r + 1][index];
                board[r][index].row = r;
            }
            board[4][index] = first;
            board[4][index].row = 4;
        }
        g.players.forEach(p => {
            if (p.alive && p.col === index) {
                p.row = (p.row + dir + 5) % 5;
            }
        });
        for (let r = 0; r < 5; r++) board[r][index].col = index;
    }

    addRoomLog(room, `Complex shifted: ${type} ${index + 1} shifted ${dir > 0 ? (type === 'row' ? 'right' : 'down') : (type === 'row' ? 'left' : 'up')}`, 'info');

    // Win check
    checkWinCondition(room);
}

function checkWinCondition(room) {
    const g = room.game;
    let r25 = null;
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (g.board[r][c].type === 'room25') {
                r25 = g.board[r][c];
            }
        }
    }
    if (!r25 || !r25.revealed) return;

    const isEdge = (r25.row === 0 || r25.row === 4 || r25.col === 0 || r25.col === 4);
    if (!isEdge) return;

    const alive = g.players.filter(p => p.alive);
    const onR25 = alive.filter(p => p.row === r25.row && p.col === r25.col);

    if (g.mode === 'cooperative' || g.mode === 'suspicion') {
        const prisoners = alive.filter(p => p.role !== 'guard');
        const prisonersOnR25 = prisoners.filter(p => p.row === r25.row && p.col === r25.col);
        if (prisoners.length > 0 && prisonersOnR25.length === prisoners.length) {
            endGame(room, true, 'All surviving prisoners successfully escaped through Room 25!');
        }
    } else if (g.mode === 'competition') {
        if (onR25.length > 0) {
            const names = onR25.map(p => p.name).join(', ');
            endGame(room, true, `${names} escaped through Room 25! Victory!`);
        }
    }
}

function endGame(room, victory, message) {
    const g = room.game;
    g.gameOver = true;
    g.gameResult = {
        victory,
        message,
        survivors: g.players.filter(p => p.alive).map(p => p.name),
        casualties: g.players.filter(p => !p.alive).map(p => p.name)
    };
    addRoomLog(room, victory ? `🎉 ESCAPED! ${message}` : `💀 GAME OVER: ${message}`, victory ? 'success' : 'danger');
    broadcastGameState(room);
}

// Socket handlers
io.on('connection', (socket) => {
    let currentRoomCode = null;

    socket.on('createRoom', ({ playerName, mode, difficulty }) => {
        const code = generateRoomCode();
        const room = {
            code,
            hostId: socket.id,
            mode: mode || 'cooperative',
            difficulty: parseInt(difficulty) || 10,
            players: [
                {
                    socketId: socket.id,
                    name: playerName.trim() || 'Player 1',
                    color: PLAYER_COLORS[0],
                    ready: true
                }
            ],
            game: null
        };
        rooms.set(code, room);
        currentRoomCode = code;
        socket.join(code);
        socket.emit('roomJoined', {
            roomCode: code,
            isHost: true,
            players: room.players,
            mode: room.mode,
            difficulty: room.difficulty
        });
    });

    socket.on('joinRoom', ({ playerName, roomCode }) => {
        const code = roomCode.toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
            socket.emit('errorMsg', 'Room not found!');
            return;
        }
        if (room.game) {
            socket.emit('errorMsg', 'Game already in progress!');
            return;
        }
        if (room.players.length >= 8) {
            socket.emit('errorMsg', 'Room is full (max 8 players)!');
            return;
        }

        const playerColor = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length];
        const newPlayer = {
            socketId: socket.id,
            name: playerName.trim() || `Player ${room.players.length + 1}`,
            color: playerColor,
            ready: false
        };

        room.players.push(newPlayer);
        currentRoomCode = code;
        socket.join(code);

        socket.emit('roomJoined', {
            roomCode: code,
            isHost: false,
            players: room.players,
            mode: room.mode,
            difficulty: room.difficulty
        });

        io.to(code).emit('lobbyUpdate', {
            players: room.players,
            hostId: room.hostId,
            mode: room.mode,
            difficulty: room.difficulty
        });
    });

    socket.on('updateLobbySettings', ({ mode, difficulty }) => {
        const room = rooms.get(currentRoomCode);
        if (!room || room.hostId !== socket.id) return;
        if (mode) room.mode = mode;
        if (difficulty) room.difficulty = parseInt(difficulty);
        io.to(room.code).emit('lobbyUpdate', {
            players: room.players,
            hostId: room.hostId,
            mode: room.mode,
            difficulty: room.difficulty
        });
    });

    socket.on('startOnlineGame', () => {
        const room = rooms.get(currentRoomCode);
        if (!room || room.hostId !== socket.id) return;
        if (room.players.length < 1) {
            socket.emit('errorMsg', 'Need at least 1 player to test/play!');
            return;
        }

        // Initialize game
        const players = room.players.map((p, idx) => {
            let role = 'prisoner';
            return {
                id: idx,
                socketId: p.socketId,
                name: p.name,
                color: p.color,
                role,
                alive: true,
                row: 2,
                col: 2,
                actions: [null, null],
                hasActed: [false, false],
                frozen: false,
                trapped: false,
                trappedTurns: 0,
                floodedTurns: 0,
                peekedRooms: []
            };
        });

        // Suspicion role assignment
        if (room.mode === 'suspicion') {
            const guardCount = players.length >= 6 ? 2 : 1;
            const roles = [];
            for (let i = 0; i < players.length; i++) {
                roles.push(i < guardCount ? 'guard' : 'prisoner');
            }
            const shuffledRoles = shuffleArray(roles);
            players.forEach((p, idx) => p.role = shuffledRoles[idx]);
        }

        room.game = {
            mode: room.mode,
            maxRounds: room.difficulty,
            currentRound: 1,
            phase: 'programming',
            currentPlayerIndex: 0,
            currentActionIndex: 0,
            waitingForInput: null,
            pushTargetId: null,
            players: players,
            board: buildBoard(),
            logs: [],
            gameOver: false,
            gameResult: null
        };

        addRoomLog(room, `Game started in ${room.mode.toUpperCase()} mode!`, 'info');
        addRoomLog(room, `Round 1 Programming Phase: Select your 2 hidden actions.`, 'info');

        broadcastGameState(room);
    });

    socket.on('submitProgramming', ({ actions }) => {
        const room = rooms.get(currentRoomCode);
        if (!room || !room.game || room.game.phase !== 'programming') return;

        const player = room.game.players.find(p => p.socketId === socket.id);
        if (!player || !player.alive) return;

        const curTile = room.game.board[player.row][player.col];
        if (curTile && curTile.type === 'central' && actions && actions.includes('push')) {
            socket.emit('gameAlert', { type: 'danger', message: 'Cannot PUSH while in Central Room!' });
            return;
        }

        player.actions = actions;
        addRoomLog(room, `${player.name} locked in their actions.`, 'info');

        // Check if all alive players programmed
        const alivePlayers = room.game.players.filter(p => p.alive);
        const allDone = alivePlayers.every(p => p.actions[0] && p.actions[1]);

        if (allDone) {
            room.game.phase = 'resolution';
            room.game.currentActionIndex = 0;
            let firstAlive = 0;
            while (firstAlive < room.game.players.length && !room.game.players[firstAlive].alive) firstAlive++;
            room.game.currentPlayerIndex = firstAlive;

            addRoomLog(room, `All actions chosen! Resolving Action 1...`, 'info');
            broadcastGameState(room);
            setTimeout(() => beginCurrentAction(room), 1200);
        } else {
            broadcastGameState(room);
        }
    });

    socket.on('playerActionInput', (data) => {
        const room = rooms.get(currentRoomCode);
        if (!room || !room.game || room.game.phase !== 'resolution') return;
        const g = room.game;
        const player = g.players[g.currentPlayerIndex];
        if (!player || player.socketId !== socket.id) return;

        if (data.type === 'peek') {
            const { row, col } = data;
            if (!isAdjacent(player.row, player.col, row, col)) return;
            const targetTile = g.board[row][col];
            if (!player.peekedRooms) player.peekedRooms = [];
            player.peekedRooms.push({ r: row, c: col });

            addRoomLog(room, `${player.name} peeked at an adjacent room.`, 'info');
            player.hasActed[g.currentActionIndex] = true;
            g.waitingForInput = null;
            broadcastGameState(room);
            setTimeout(() => advanceToNextAction(room), 1000);
        } else if (data.type === 'move') {
            const { row, col } = data;
            if (!isAdjacent(player.row, player.col, row, col)) return;
            const originRow = player.row;
            const originCol = player.col;
            player.row = row;
            player.col = col;
            const roomCell = g.board[row][col];
            roomCell.revealed = true;
            player.hasActed[g.currentActionIndex] = true;
            g.waitingForInput = null;

            addRoomLog(room, `${player.name} moved to (${row + 1}, ${col + 1}): ${roomCell.type.toUpperCase()}`, 'info');
            broadcastGameState(room);
            setTimeout(() => {
                checkIllusionExit(room, originRow, originCol);
                triggerRoomEffect(room, player, roomCell);
            }, 800);
        } else if (data.type === 'pushSelectTarget') {
            const target = g.players.find(p => p.id === data.targetId);
            if (!target || target.row !== player.row || target.col !== player.col) return;
            g.pushTargetId = target.id;
            g.waitingForInput = {
                type: 'push-dir',
                playerId: player.id,
                targetId: target.id,
                originRow: player.row,
                originCol: player.col
            };
            broadcastGameState(room);
        } else if (data.type === 'pushExecute') {
            const target = g.players.find(p => p.id === g.pushTargetId);
            const { row, col } = data;
            if (!target || !isAdjacent(player.row, player.col, row, col)) return;
            const originRow = target.row;
            const originCol = target.col;
            target.row = row;
            target.col = col;
            const roomCell = g.board[row][col];
            roomCell.revealed = true;
            player.hasActed[g.currentActionIndex] = true;
            g.waitingForInput = null;
            g.pushTargetId = null;

            addRoomLog(room, `${player.name} PUSHED ${target.name} into (${row + 1}, ${col + 1})!`, 'warning');
            broadcastGameState(room);
            setTimeout(() => {
                checkIllusionExit(room, originRow, originCol);
                triggerRoomEffect(room, target, roomCell, true);
            }, 800);
        } else if (data.type === 'slide') {
            const { slideType, index, direction } = data;
            if ((slideType === 'row' || slideType === 'col') && index === 2) {
                // Central row/column cannot be slid
                return;
            }
            player.hasActed[g.currentActionIndex] = true;
            const wasBonus = g.waitingForInput && g.waitingForInput.bonus;
            g.waitingForInput = null;

            executeSlide(room, slideType, index, direction);
            broadcastGameState(room);
            setTimeout(() => {
                if (wasBonus) {
                    advanceToNextAction(room);
                } else {
                    advanceToNextAction(room);
                }
            }, 800);
        } else if (data.type === 'visionPeek') {
            const { row, col } = data;
            const targetTile = g.board[row][col];
            if (!player.peekedRooms) player.peekedRooms = [];
            player.peekedRooms.push({ r: row, c: col, col: col });

            addRoomLog(room, `${player.name} used Vision Chamber to peek secretly at (${row + 1}, ${col + 1})!`, 'success');
            g.waitingForInput = null;
            broadcastGameState(room);
            setTimeout(() => advanceToNextAction(room), 1000);
        } else if (data.type === 'movingSwap') {
            const { row, col } = data;
            const targetRoom = g.board[row][col];
            if (!targetRoom || targetRoom.revealed) return;

            const oldRow = player.row;
            const oldCol = player.col;
            const playerRoom = g.board[oldRow][oldCol];

            // Swap room types and revealed state
            const targetType = targetRoom.type;
            const targetRevealed = targetRoom.revealed;

            targetRoom.type = playerRoom.type;
            targetRoom.revealed = playerRoom.revealed;

            playerRoom.type = targetType;
            playerRoom.revealed = targetRevealed;

            // Update any peeked rooms tracking if players peeked at this room
            g.players.forEach(p => {
                if (p.peekedRooms) {
                    p.peekedRooms.forEach(pr => {
                        const rMatch = pr.r;
                        const cMatch = (pr.c !== undefined) ? pr.c : pr.col;
                        if (rMatch === row && cMatch === col) {
                            pr.r = oldRow;
                            if (pr.c !== undefined) pr.c = oldCol;
                            if (pr.col !== undefined) pr.col = oldCol;
                        } else if (rMatch === oldRow && cMatch === oldCol) {
                            pr.r = row;
                            if (pr.c !== undefined) pr.c = col;
                            if (pr.col !== undefined) pr.col = col;
                        }
                    });
                }
            });

            // ALL players who were in the Moving Chamber travel with it to the new position
            g.players.forEach(p => {
                if (p.alive && p.row === oldRow && p.col === oldCol) {
                    p.row = row;
                    p.col = col;
                }
            });

            addRoomLog(room, `🔄 ${player.name} and occupants moved with the Moving Chamber to (${row + 1}, ${col + 1})!`, 'success');
            g.waitingForInput = null;
            broadcastGameState(room);
            setTimeout(() => advanceToNextAction(room), 1000);
        }
    });

    socket.on('disconnect', () => {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        room.players = room.players.filter(p => p.socketId !== socket.id);
        if (room.players.length === 0) {
            rooms.delete(currentRoomCode);
        } else {
            if (room.hostId === socket.id) {
                room.hostId = room.players[0].socketId;
            }
            if (room.game) {
                const gamePlayer = room.game.players.find(p => p.socketId === socket.id);
                if (gamePlayer) {
                    gamePlayer.alive = false;
                    addRoomLog(room, `${gamePlayer.name} disconnected.`, 'danger');
                    checkDeathWinLoss(room);
                }
                broadcastGameState(room);
            } else {
                io.to(room.code).emit('lobbyUpdate', {
                    players: room.players,
                    hostId: room.hostId,
                    mode: room.mode,
                    difficulty: room.difficulty
                });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Room 25 Online Server running at http://localhost:${PORT}`);
});
