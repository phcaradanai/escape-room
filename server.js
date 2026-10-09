const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const engine = require('./public/game-engine.js');
const {
    PLAYER_COLORS,
    ROOM_DECK,
    shuffleArray,
    isAdjacent,
    buildBoard
} = engine;

function executeSlide(room, type, index, direction) {
    if (!room || !room.game) return;
    const actor = room.game.players ? room.game.players[room.game.currentPlayerIndex] : null;
    const escapeResult = engine.checkEscapeSlide(room.game, type, index, direction, actor);
    engine.executeSlide(room.game, type, index, direction);
    const dir = parseInt(direction);
    addRoomLog(room, `Complex shifted: ${type} ${index + 1} shifted ${dir > 0 ? (type === 'row' ? 'right' : 'down') : (type === 'row' ? 'left' : 'up')}`, 'info');
    if (escapeResult) {
        room.game.escapeResult = escapeResult;
        endGame(room, escapeResult.victory, escapeResult.message);
    } else {
        checkWinCondition(room);
    }
}

function checkIllusionExit(room, fromRow, fromCol) {
    const didShift = engine.checkIllusionExit(room.game, fromRow, fromCol);
    if (didShift) {
        addRoomLog(room, `✨ The Illusion Room vanished after occupants left and shifted with a hidden chamber!`, 'warning');
    }
}

function checkWinCondition(room) {
    const result = engine.checkWinCondition(room.game);
    if (result && result.victory) {
        endGame(room, true, result.message);
    }
}

function getSanitizedGameState(room, forSocketId) {
    return engine.getSanitizedGameState(room.game, room.code, room.hostId, forSocketId);
}

function sanitizePlayerName(name, fallback = 'Player') {
    if (typeof name !== 'string') return fallback;
    const trimmed = name.trim();
    if (!trimmed) return fallback;
    return trimmed.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').slice(0, 16) || fallback;
}

function getPublicPlayers(players, hostId) {
    if (!Array.isArray(players)) return [];
    return players.map((p, idx) => ({
        id: (typeof p.id === 'number') ? p.id : idx,
        socketId: p.socketId,
        name: p.name,
        color: p.color,
        ready: Boolean(p.ready),
        connected: Boolean(p.connected),
        isHost: Boolean(p.socketId === hostId)
    }));
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


function broadcastGameState(room) {
    if (!room || !room.players || !Array.isArray(room.players)) return;
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


// Resolution logic
function beginCurrentAction(room) {
    if (!room || !room.game) return;
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
    if (!room || !room.game) return;
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
        if (firstAlive >= g.players.length) {
            endGame(room, false, 'All prisoners have been eliminated!');
            return;
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
    if (!room || !room.game) return;
    const g = room.game;
    if (g.gameOver) return;
    // Resolve trapped / flooded status
    g.players.forEach(p => {
        if (!p.alive) return;
        const curRoom = g.board[p.row][p.col];
        if (curRoom && curRoom.type === 'flooded') {
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

    const timeout = engine.getTimeLimitResult(
        g,
        'Time ran out! The complex lockdown is permanent.'
    );
    if (timeout) {
        endGame(room, timeout.victory, timeout.message);
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
    if (!room || !room.game || !player) return;
    const g = room.game;
    if (g.gameOver || !player.alive) return;
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


function checkDeathWinLoss(room) {
    if (!room || !room.game) return;
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

function endGame(room, victory, message) {
    if (!room || !room.game) return;
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

    socket.on('createRoom', (payload) => {
        if (!payload || typeof payload !== 'object') {
            socket.emit('errorMsg', 'Invalid request payload');
            return;
        }
        const { playerName, mode, difficulty } = payload;
        const validatedMode = (mode === 'cooperative' || mode === 'suspicion' || mode === 'competition') ? mode : 'cooperative';
        const parsedDiff = parseInt(difficulty, 10);
        const validatedDifficulty = [6, 7, 8, 10].includes(parsedDiff) ? parsedDiff : 10;
        const safeName = sanitizePlayerName(playerName, 'Player 1');
        const code = generateRoomCode();
        const token = 'tok_' + Math.random().toString(36).slice(2, 10);
        const room = {
            code,
            hostId: socket.id,
            mode: validatedMode,
            difficulty: validatedDifficulty,
            players: [
                {
                    socketId: socket.id,
                    sessionToken: token,
                    name: safeName,
                    color: PLAYER_COLORS[0],
                    ready: true,
                    connected: true
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
            sessionToken: token,
            players: getPublicPlayers(room.players, room.hostId),
            mode: room.mode,
            difficulty: room.difficulty,
            inGame: false
        });
    });

    socket.on('joinRoom', (payload) => {
        if (!payload || typeof payload !== 'object') {
            socket.emit('errorMsg', 'Invalid request payload');
            return;
        }
        const { playerName, roomCode, sessionToken } = payload;
        if (typeof roomCode !== 'string') {
            socket.emit('errorMsg', 'Invalid room code');
            return;
        }
        const code = roomCode.toUpperCase().trim();
        if (!/^[A-Z0-9]{4}$/.test(code)) {
            socket.emit('errorMsg', 'Room code must be 4 characters');
            return;
        }
        const room = rooms.get(code);
        if (!room) {
            socket.emit('errorMsg', 'Room not found!');
            return;
        }

        // Reconnect Check: player reconnecting with existing session token
        if (typeof sessionToken === 'string' && sessionToken.startsWith('tok_')) {
            const existingPlayer = room.players.find(p => p.sessionToken === sessionToken);
            if (existingPlayer) {
                const wasHost = room.hostId === existingPlayer.socketId;
                existingPlayer.socketId = socket.id;
                existingPlayer.connected = true;
                currentRoomCode = code;
                socket.join(code);

                const isHost = wasHost;
                if (isHost) room.hostId = socket.id;

                socket.emit('roomJoined', {
                    roomCode: code,
                    isHost: (room.hostId === socket.id),
                    sessionToken: sessionToken,
                    players: getPublicPlayers(room.players, room.hostId),
                    mode: room.mode,
                    difficulty: room.difficulty,
                    inGame: Boolean(room.game)
                });

                io.to(code).emit('lobbyUpdate', {
                    players: getPublicPlayers(room.players, room.hostId),
                    hostId: room.hostId,
                    mode: room.mode,
                    difficulty: room.difficulty
                });

                if (room.game) {
                    const gamePlayer = room.game.players.find(p => p.id === existingPlayer.id || p.name === existingPlayer.name);
                    if (gamePlayer) {
                        gamePlayer.socketId = socket.id;
                        addRoomLog(room, `📶 ${existingPlayer.name} reconnected to the complex!`, 'info');
                    }
                    broadcastGameState(room);
                }
                return;
            }
            socket.emit('errorMsg', 'Session unavailable');
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

        const token = 'tok_' + Math.random().toString(36).slice(2, 10);
        const playerColor = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length];
        const safeName = sanitizePlayerName(playerName, `Player ${room.players.length + 1}`);
        const newPlayer = {
            socketId: socket.id,
            sessionToken: token,
            name: safeName,
            color: playerColor,
            ready: false,
            connected: true
        };

        room.players.push(newPlayer);
        currentRoomCode = code;
        socket.join(code);

        socket.emit('roomJoined', {
            roomCode: code,
            isHost: false,
            sessionToken: token,
            players: getPublicPlayers(room.players, room.hostId),
            mode: room.mode,
            difficulty: room.difficulty,
            inGame: false
        });

        io.to(code).emit('lobbyUpdate', {
            players: getPublicPlayers(room.players, room.hostId),
            hostId: room.hostId,
            mode: room.mode,
            difficulty: room.difficulty
        });
    });

    socket.on('rematchRoom', () => {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        if (room.hostId !== socket.id) {
            socket.emit('errorMsg', 'Only the room host can trigger a rematch');
            return;
        }
        if (!room.game || !room.game.gameOver) {
            socket.emit('errorMsg', 'Cannot rematch while game is in progress');
            return;
        }
        room.game = null;
        io.to(room.code).emit('rematchTriggered');
        io.to(room.code).emit('lobbyUpdate', {
            players: getPublicPlayers(room.players, room.hostId),
            hostId: room.hostId,
            mode: room.mode,
            difficulty: room.difficulty
        });
    });

    socket.on('updateLobbySettings', (payload) => {
        if (!payload || typeof payload !== 'object') return;
        const room = rooms.get(currentRoomCode);
        if (!room || room.hostId !== socket.id) return;
        const { mode, difficulty } = payload;
        if (mode === 'cooperative' || mode === 'suspicion' || mode === 'competition') {
            room.mode = mode;
        }
        const parsedDiff = parseInt(difficulty, 10);
        if ([6, 7, 8, 10].includes(parsedDiff)) {
            room.difficulty = parsedDiff;
        }
        io.to(room.code).emit('lobbyUpdate', {
            players: getPublicPlayers(room.players, room.hostId),
            hostId: room.hostId,
            mode: room.mode,
            difficulty: room.difficulty
        });
    });

    socket.on('startOnlineGame', () => {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const isHost = (room.hostId === socket.id);
        if (!isHost) {
            socket.emit('errorMsg', 'Only the room host can start the game');
            return;
        }
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

        io.to(room.code).emit('gameStarted');
        broadcastGameState(room);
    });

    socket.on('submitProgramming', (payload, acknowledge) => {
        const respond = (accepted, reason = null) => {
            if (typeof acknowledge === 'function') acknowledge({ accepted, reason });
        };

        if (!payload || typeof payload !== 'object' || !Array.isArray(payload.actions)) {
            respond(false, 'invalidProgramming');
            return;
        }
        const room = rooms.get(currentRoomCode);
        if (!room || !room.game || room.game.phase !== 'programming') {
            respond(false, 'programmingPhaseEnded');
            return;
        }

        const player = room.game.players.find(p => p.socketId === socket.id);
        if (!player || !player.alive) {
            respond(false, 'playerUnavailable');
            return;
        }

        const allowedActions = ['peek', 'move', 'push', 'control'];
        const actions = payload.actions;
        if (actions.length !== 2 || !actions.every(a => allowedActions.includes(a))) {
            respond(false, 'invalidProgramming');
            return;
        }

        const curTile = room.game.board[player.row][player.col];
        if (curTile && curTile.type === 'central' && actions.includes('push')) {
            respond(false, 'cannotPushCentral');
            return;
        }

        player.actions = [actions[0], actions[1]];
        addRoomLog(room, `${player.name} locked in their actions.`, 'info');
        respond(true);

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
        if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;
        const room = rooms.get(currentRoomCode);
        if (!room || !room.game || room.game.phase !== 'resolution') return;
        const g = room.game;
        const player = g.players[g.currentPlayerIndex];
        if (!player || !player.alive || player.socketId !== socket.id) return;
        if (!g.waitingForInput) return;

        const expectedInput = g.waitingForInput;
        if (expectedInput.playerId !== undefined && expectedInput.playerId !== player.id) return;

        if (data.type === 'peek') {
            if (expectedInput.type !== 'peek-tile') return;
            const { row, col } = data;
            if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 4 || col < 0 || col > 4) return;
            if (!isAdjacent(player.row, player.col, row, col)) return;
            const targetTile = g.board[row][col];
            if (!targetTile || targetTile.revealed) return;

            // Atomically consume waitingForInput
            g.waitingForInput = null;
            if (!player.peekedRooms) player.peekedRooms = [];
            player.peekedRooms.push({ r: row, c: col });

            addRoomLog(room, `${player.name} peeked at an adjacent room.`, 'info');
            player.hasActed[g.currentActionIndex] = true;
            broadcastGameState(room);
            setTimeout(() => advanceToNextAction(room), 1000);
        } else if (data.type === 'move') {
            if (expectedInput.type !== 'move-tile') return;
            const { row, col } = data;
            if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 4 || col < 0 || col > 4) return;
            if (!isAdjacent(player.row, player.col, row, col)) return;

            // Atomically consume waitingForInput
            g.waitingForInput = null;
            const originRow = player.row;
            const originCol = player.col;
            player.row = row;
            player.col = col;
            const roomCell = g.board[row][col];
            roomCell.revealed = true;
            player.hasActed[g.currentActionIndex] = true;

            addRoomLog(room, `${player.name} moved to (${row + 1}, ${col + 1}): ${roomCell.type.toUpperCase()}`, 'info');
            broadcastGameState(room);
            setTimeout(() => {
                checkIllusionExit(room, originRow, originCol);
                triggerRoomEffect(room, player, roomCell);
            }, 800);
        } else if (data.type === 'pushSelectTarget') {
            if (expectedInput.type !== 'push-target') return;
            const target = g.players.find(p => p.id === data.targetId);
            if (!target || !target.alive || target.id === player.id || target.row !== player.row || target.col !== player.col) return;
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
            if (expectedInput.type !== 'push-dir') return;
            const target = g.players.find(p => p.id === g.pushTargetId);
            const { row, col } = data;
            if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 4 || col < 0 || col > 4) return;
            if (!target || !target.alive || !isAdjacent(player.row, player.col, row, col)) return;

            // Atomically consume waitingForInput
            g.waitingForInput = null;
            g.pushTargetId = null;

            const originRow = target.row;
            const originCol = target.col;
            target.row = row;
            target.col = col;
            const roomCell = g.board[row][col];
            roomCell.revealed = true;
            player.hasActed[g.currentActionIndex] = true;

            addRoomLog(room, `${player.name} PUSHED ${target.name} into (${row + 1}, ${col + 1})!`, 'warning');
            broadcastGameState(room);
            setTimeout(() => {
                checkIllusionExit(room, originRow, originCol);
                triggerRoomEffect(room, target, roomCell, true);
            }, 800);
        } else if (data.type === 'slide') {
            if (expectedInput.type !== 'slide') return;
            const { slideType, index, direction } = data;
            if (slideType !== 'row' && slideType !== 'col') return;
            const idx = parseInt(index, 10);
            if (idx < 0 || idx > 4 || idx === 2) {
                // Central row/column cannot be slid
                return;
            }
            const dir = parseInt(direction, 10);
            if (dir !== -1 && dir !== 1) return;

            // Atomically consume waitingForInput
            g.waitingForInput = null;
            player.hasActed[g.currentActionIndex] = true;

            executeSlide(room, slideType, idx, dir);
            broadcastGameState(room);
            setTimeout(() => {
                advanceToNextAction(room);
            }, 800);
        } else if (data.type === 'visionPeek') {
            if (expectedInput.type !== 'vision-tile') return;
            const { row, col } = data;
            if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 4 || col < 0 || col > 4) return;
            const targetTile = g.board[row][col];
            if (!targetTile || targetTile.revealed) return;

            // Atomically consume waitingForInput
            g.waitingForInput = null;
            if (!player.peekedRooms) player.peekedRooms = [];
            player.peekedRooms.push({ r: row, c: col, col: col });

            addRoomLog(room, `${player.name} used Vision Chamber to peek secretly at (${row + 1}, ${col + 1})!`, 'success');
            broadcastGameState(room);
            setTimeout(() => advanceToNextAction(room), 1000);
        } else if (data.type === 'movingSwap') {
            if (expectedInput.type !== 'moving-tile') return;
            const { row, col } = data;
            if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 4 || col < 0 || col > 4) return;
            if (row === player.row && col === player.col) return;
            const targetRoom = g.board[row][col];
            if (!targetRoom || targetRoom.revealed) return;

            // Atomically consume waitingForInput
            g.waitingForInput = null;
            const ok = engine.executeMovingSwap(g, player, row, col);
            if (ok) {
                addRoomLog(room, `🔄 ${player.name} and occupants moved with the Moving Chamber to (${row + 1}, ${col + 1})!`, 'success');
            }
            broadcastGameState(room);
            setTimeout(() => advanceToNextAction(room), 1000);
        }
    });

    socket.on('disconnect', () => {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        const playerInRoom = room.players.find(p => p.socketId === socket.id);
        if (playerInRoom) {
            playerInRoom.connected = false;
        }

        const allDisconnected = room.players.every(p => !p.connected);
        if (allDisconnected) {
            setTimeout(() => {
                const checkRoom = rooms.get(currentRoomCode);
                if (checkRoom && checkRoom.players.every(p => !p.connected)) {
                    rooms.delete(currentRoomCode);
                }
            }, 60000);
        } else {
            if (room.hostId === socket.id) {
                const nextConnected = room.players.find(p => p.connected);
                if (nextConnected) room.hostId = nextConnected.socketId;
            }
            if (room.game) {
                const gamePlayer = room.game.players.find(p => p.socketId === socket.id);
                if (gamePlayer) {
                    addRoomLog(room, `⚠️ ${gamePlayer.name} temporarily disconnected. Waiting for reconnection...`, 'warning');
                }
                broadcastGameState(room);
            } else {
                io.to(room.code).emit('lobbyUpdate', {
                    players: getPublicPlayers(room.players, room.hostId),
                    hostId: room.hostId,
                    mode: room.mode,
                    difficulty: room.difficulty
                });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
if (require.main === module || process.env.AUTO_START === 'true') {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Room 25 Online Server running at http://localhost:${PORT}`);
    });
}

module.exports = {
    app,
    server,
    io,
    rooms,
    PLAYER_COLORS,
    ROOM_DECK,
    buildBoard,
    getSanitizedGameState,
    sanitizePlayerName,
    getPublicPlayers,
    advanceToNextAction,
    endRound,
    triggerRoomEffect,
    checkIllusionExit,
    executeSlide,
    checkWinCondition,
    checkDeathWinLoss,
    endGame,
    shuffleArray,
    executeMovingSwap: engine.executeMovingSwap,
    executeCharacterAbility: engine.executeCharacterAbility
};
