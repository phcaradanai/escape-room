(function (root, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else {
        root.Room25Engine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

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

    function isAdjacent(r1, c1, r2, c2) {
        return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
    }

    function buildBoard(customDeck) {
        const board = [];
        for (let r = 0; r < 5; r++) {
            board[r] = [];
            for (let c = 0; c < 5; c++) {
                board[r][c] = null;
            }
        }

        board[2][2] = {
            id: 'tile_central',
            type: 'central',
            revealed: true,
            row: 2,
            col: 2
        };

        let deck = customDeck ? [...customDeck] : shuffleArray(ROOM_DECK).slice(0, 24);
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
                    id: `tile_${r}_${c}`,
                    type: deck[deckIdx],
                    revealed: false,
                    row: r,
                    col: c
                };
                deckIdx++;
            }
        }
        return board;
    }

    function executeSlide(game, type, index, direction) {
        const dir = parseInt(direction);
        const board = game.board;

        if (type === 'row') {
            if (dir > 0) {
                const last = board[index][4];
                for (let c = 4; c > 0; c--) {
                    board[index][c] = board[index][c - 1];
                    board[index][c].col = c;
                }
                board[index][0] = last;
                board[index][0].col = 0;
            } else {
                const first = board[index][0];
                for (let c = 0; c < 4; c++) {
                    board[index][c] = board[index][c + 1];
                    board[index][c].col = c;
                }
                board[index][4] = first;
                board[index][4].col = 4;
            }
            if (game.players) {
                game.players.forEach(p => {
                    if (p.alive && p.row === index) {
                        p.col = (p.col + dir + 5) % 5;
                    }
                    if (p.peekedRooms && Array.isArray(p.peekedRooms)) {
                        p.peekedRooms.forEach(pr => {
                            const cMatch = (pr.c !== undefined) ? pr.c : pr.col;
                            if (pr.r === index) {
                                const newCol = (cMatch + dir + 5) % 5;
                                pr.c = newCol;
                                if (pr.col !== undefined) pr.col = newCol;
                            }
                        });
                    }
                });
            }
            for (let c = 0; c < 5; c++) board[index][c].row = index;
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
            if (game.players) {
                game.players.forEach(p => {
                    if (p.alive && p.col === index) {
                        p.row = (p.row + dir + 5) % 5;
                    }
                    if (p.peekedRooms && Array.isArray(p.peekedRooms)) {
                        p.peekedRooms.forEach(pr => {
                            const cMatch = (pr.c !== undefined) ? pr.c : pr.col;
                            if (cMatch === index) {
                                pr.r = (pr.r + dir + 5) % 5;
                            }
                        });
                    }
                });
            }
            for (let r = 0; r < 5; r++) board[r][index].col = index;
        }
    }

    function checkIllusionExit(game, fromRow, fromCol) {
        const originRoom = game.board[fromRow][fromCol];
        if (!originRoom || originRoom.type !== 'illusion') return false;

        const remaining = game.players.filter(p => p.alive && p.row === fromRow && p.col === fromCol);
        if (remaining.length > 0) return false;

        const hiddenRooms = [];
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const cell = game.board[r][c];
                if (!cell.revealed && cell.type !== 'central' && cell.type !== 'room25') {
                    hiddenRooms.push({ r, c });
                }
            }
        }

        if (hiddenRooms.length > 0) {
            const target = hiddenRooms[Math.floor(Math.random() * hiddenRooms.length)];
            const targetRoom = game.board[target.r][target.c];

            const tempType = targetRoom.type;
            targetRoom.type = 'illusion';
            targetRoom.revealed = false;

            originRoom.type = tempType;
            originRoom.revealed = false;
            return true;
        }
        return false;
    }

    function executeMovingSwap(game, player, targetRow, targetCol) {
        if (!game || !game.board || !player) return false;
        const oldRow = player.row;
        const oldCol = player.col;
        if (targetRow === oldRow && targetCol === oldCol) return false;
        if (targetRow < 0 || targetRow > 4 || targetCol < 0 || targetCol > 4) return false;

        const targetRoom = game.board[targetRow] && game.board[targetRow][targetCol];
        const playerRoom = game.board[oldRow] && game.board[oldRow][oldCol];
        if (!targetRoom || !playerRoom || targetRoom.revealed) return false;

        const tempType = targetRoom.type;
        const tempRevealed = targetRoom.revealed;
        const tempId = targetRoom.id;

        targetRoom.type = playerRoom.type;
        targetRoom.revealed = playerRoom.revealed;
        targetRoom.id = playerRoom.id;

        playerRoom.type = tempType;
        playerRoom.revealed = tempRevealed;
        playerRoom.id = tempId;

        if (game.players) {
            // Remap peek coordinates
            game.players.forEach(p => {
                if (p.peekedRooms) {
                    p.peekedRooms.forEach(pr => {
                        const cMatch = (pr.c !== undefined) ? pr.c : pr.col;
                        if (pr.r === targetRow && cMatch === targetCol) {
                            pr.r = oldRow;
                            if (pr.c !== undefined) pr.c = oldCol;
                            if (pr.col !== undefined) pr.col = oldCol;
                        } else if (pr.r === oldRow && cMatch === oldCol) {
                            pr.r = targetRow;
                            if (pr.c !== undefined) pr.c = targetCol;
                            if (pr.col !== undefined) pr.col = targetCol;
                        }
                    });
                }
            });

            // Occupants travel with the moving chamber
            game.players.forEach(p => {
                if (p.alive && p.row === oldRow && p.col === oldCol) {
                    p.row = targetRow;
                    p.col = targetCol;
                }
            });
        }

        return true;
    }

    function executeCharacterAbility(game, player, data) {
        if (!game || !player || !player.alive || player.abilityUsed) {
            return { success: false, reason: 'Ability already used or unavailable' };
        }

        const charId = player.characterId || (player.character && player.character.id);
        switch (charId) {
            case 'alice': {
                const { row, col } = data || {};
                if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 4 || col < 0 || col > 4) {
                    return { success: false, reason: 'Invalid coordinates' };
                }
                const isDiagonal = Math.abs(player.row - row) === 1 && Math.abs(player.col - col) === 1;
                if (!isDiagonal) return { success: false, reason: 'Alice can only peek diagonally' };
                const target = game.board[row][col];
                if (!target || target.revealed) return { success: false, reason: 'Tile already revealed' };
                if (!player.peekedRooms) player.peekedRooms = [];
                player.peekedRooms.push({ r: row, c: col });
                player.abilityUsed = true;
                return { success: true, ability: 'diagonalPeek', target: { row, col } };
            }
            case 'frank': {
                const { targetId, row, col } = data || {};
                const target = game.players.find(p => p.id === targetId);
                if (!target || !target.alive || target.row !== player.row || target.col !== player.col) {
                    return { success: false, reason: 'Target not in same room' };
                }
                const dist = Math.abs(player.row - row) + Math.abs(player.col - col);
                const isStraight = (player.row === row || player.col === col);
                if (dist !== 2 || !isStraight) return { success: false, reason: 'Frank power push must be 2 tiles straight' };
                target.row = row;
                target.col = col;
                const roomCell = game.board[row][col];
                roomCell.revealed = true;
                player.abilityUsed = true;
                return { success: true, ability: 'powerPush', targetPlayer: target, roomCell };
            }
            case 'kevin': {
                const { row, col } = data || {};
                const dist = Math.abs(player.row - row) + Math.abs(player.col - col);
                const isStraight = (player.row === row || player.col === col);
                if (dist !== 2 || !isStraight) return { success: false, reason: 'Kevin long jump must be 2 tiles straight' };
                player.row = row;
                player.col = col;
                const roomCell = game.board[row][col];
                roomCell.revealed = true;
                player.abilityUsed = true;
                return { success: true, ability: 'longJump', roomCell };
            }
            case 'jennifer': {
                const { allyId, row, col } = data || {};
                if (!isAdjacent(player.row, player.col, row, col)) return { success: false, reason: 'Must be adjacent tile' };
                const ally = game.players.find(p => p.id === allyId);
                if (!ally || !ally.alive || ally.row !== player.row || ally.col !== player.col) {
                    return { success: false, reason: 'Ally must be in same room' };
                }
                player.row = row;
                player.col = col;
                ally.row = row;
                ally.col = col;
                const roomCell = game.board[row][col];
                roomCell.revealed = true;
                player.abilityUsed = true;
                return { success: true, ability: 'escort', ally, roomCell };
            }
            case 'emmy': {
                if (!player.actions || player.actions.length < 2) return { success: false, reason: 'Not enough actions' };
                const temp = player.actions[0];
                player.actions[0] = player.actions[1];
                player.actions[1] = temp;
                player.abilityUsed = true;
                return { success: true, ability: 'mindSwap', actions: player.actions };
            }
            case 'bruce': {
                const { slideType, index, direction } = data || {};
                const dir = parseInt(direction, 10);
                const idx = parseInt(index, 10);
                if (slideType !== 'row' && slideType !== 'col') return { success: false, reason: 'Invalid slide type' };
                if (idx === 2) return { success: false, reason: 'Cannot slide central row/col' };
                executeSlide(game, slideType, idx, dir);
                executeSlide(game, slideType, idx, dir);
                player.abilityUsed = true;
                return { success: true, ability: 'doubleShift' };
            }
            default:
                return { success: false, reason: 'Unknown character ability' };
        }
    }

    function checkEscapeSlide(game, type, index, direction, actor) {
        let r25 = null;
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                if (game.board[r][c] && game.board[r][c].type === 'room25') {
                    r25 = game.board[r][c];
                }
            }
        }
        if (!r25 || !r25.revealed) return null;

        const dir = parseInt(direction, 10);
        const idx = parseInt(index, 10);

        // Slide must push Room 25 OUTWARD from an edge per RULES §6
        let isOutwardPush = false;
        if (type === 'row' && idx === r25.row) {
            if (r25.col === 0 && dir === -1) isOutwardPush = true; // Left off board
            else if (r25.col === 4 && dir === 1) isOutwardPush = true; // Right off board
        } else if (type === 'col' && idx === r25.col) {
            if (r25.row === 0 && dir === -1) isOutwardPush = true; // Up off board
            else if (r25.row === 4 && dir === 1) isOutwardPush = true; // Down off board
        }

        if (!isOutwardPush) return null;

        // The actor using CONTROL must be inside Room 25 per RULES §6
        if (actor && (actor.row !== r25.row || actor.col !== r25.col)) {
            return null;
        }

        const alive = game.players.filter(p => p.alive);
        if (game.mode === 'cooperative') {
            const allInR25 = alive.every(p => p.row === r25.row && p.col === r25.col);
            if (allInR25 && alive.length > 0) {
                return {
                    victory: true,
                    message: 'All surviving prisoners successfully pushed Room 25 out of the Complex and escaped!'
                };
            }
        } else if (game.mode === 'suspicion') {
            const prisoners = alive.filter(p => p.role === 'prisoner');
            const guards = alive.filter(p => p.role === 'guard');
            const allPrisonersIn = prisoners.length > 0 && prisoners.every(p => p.row === r25.row && p.col === r25.col);
            const anyGuardIn = guards.some(p => p.row === r25.row && p.col === r25.col);

            if (allPrisonersIn) {
                if (anyGuardIn) {
                    return {
                        victory: false,
                        message: 'A hidden Guard escaped with the prisoners! The Guards win!'
                    };
                }
                return {
                    victory: true,
                    message: 'All surviving prisoners successfully escaped without the Guards!'
                };
            }
        } else if (game.mode === 'competition') {
            const occupants = alive.filter(p => p.row === r25.row && p.col === r25.col);
            if (occupants.length > 0) {
                const names = occupants.map(p => p.name).join(', ');
                return {
                    victory: true,
                    message: `${names} escaped through Room 25! Victory!`
                };
            }
        }
        return null;
    }

    function checkWinCondition(game) {
        if (!game || !game.escapeResult) return null;
        return game.escapeResult;
    }
    function getTimeLimitResult(game, fallbackMessage) {
        if (!game ||
            !Number.isFinite(game.currentRound) ||
            !Number.isFinite(game.maxRounds) ||
            game.currentRound < game.maxRounds
        ) {
            return null;
        }
        if (game.mode === 'suspicion') {
            return {
                victory: false,
                message: 'Time ran out! The Guards win because no prisoners escaped.'
            };
        }
        return { victory: false, message: fallbackMessage };
    }


    function getSanitizedGameState(game, roomCode, hostId, forSocketId) {
        if (!game) return null;
        const clientPlayer = game.players.find(p => p.socketId === forSocketId);

        const sanitizedBoard = game.board.map(row => row.map(cell => {
            const isRevealed = cell.revealed;
            const peekedByMe = clientPlayer && clientPlayer.peekedRooms && clientPlayer.peekedRooms.some(
                pr => pr.r === cell.row && (pr.c === cell.col || pr.col === cell.col)
            );
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

        const sanitizedPlayers = game.players.map(p => {
            const isSelf = p.socketId === forSocketId;
            const showRole = (game.mode !== 'suspicion') || isSelf || game.gameOver;

            let actions = [null, null];
            if (isSelf) {
                actions = p.actions ? [...p.actions] : [null, null];
            } else if (game.phase === 'resolution') {
                const a1Revealed = Boolean(
                    (p.hasActed && p.hasActed[0]) ||
                    (p.id === game.currentPlayerIndex && game.currentActionIndex === 0)
                );
                const a2Revealed = Boolean(
                    (p.hasActed && p.hasActed[1]) ||
                    (p.id === game.currentPlayerIndex && game.currentActionIndex === 1)
                );
                actions = [
                    a1Revealed ? (p.actions ? p.actions[0] : null) : null,
                    a2Revealed ? (p.actions ? p.actions[1] : null) : null
                ];
            }

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
                actionsCount: p.actions ? p.actions.filter(Boolean).length : 0,
                actions: actions,
                hasActed: p.hasActed
            };
        });
        return {
            myPlayerId: game.players.find(p => p.socketId === forSocketId)?.id ?? null,
            roomCode: roomCode || null,
            hostId: hostId || null,
            mode: game.mode,
            maxRounds: game.maxRounds,
            currentRound: game.currentRound,
            phase: game.phase,
            currentPlayerIndex: game.currentPlayerIndex,
            currentActionIndex: game.currentActionIndex,
            waitingForInput: game.waitingForInput,
            pushTargetId: game.pushTargetId,
            board: sanitizedBoard,
            players: sanitizedPlayers,
            logs: game.logs ? game.logs.slice(-40) : [],
            gameOver: game.gameOver,
            gameResult: game.gameResult
        };
    }

    return {
        PLAYER_COLORS,
        ROOM_DECK,
        shuffleArray,
        isAdjacent,
        buildBoard,
        executeSlide,
        checkIllusionExit,
        checkEscapeSlide,
        checkWinCondition,
        executeMovingSwap,
        getTimeLimitResult,
        executeCharacterAbility,
        getSanitizedGameState
    };
}));
