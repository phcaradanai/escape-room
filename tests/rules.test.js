const test = require('node:test');
const assert = require('node:assert/strict');
const s = require('../server.js');
const engine = require('../public/game-engine.js');

test('TEST-01: Board initialization & Deck distribution', () => {
    const board = s.buildBoard();
    assert.strictEqual(board.length, 5, 'Board must have 5 rows');
    assert.strictEqual(board[0].length, 5, 'Board must have 5 cols');
    assert.strictEqual(board[2][2].type, 'central', 'Center cell must be Central Room');
    assert.strictEqual(board[2][2].revealed, true, 'Central room must start revealed');

    const flat = board.flat();
    const r25Count = flat.filter(c => c.type === 'room25').length;
    assert.strictEqual(r25Count, 1, 'Must have exactly 1 Room 25 on the board');

    const twinsCount = flat.filter(c => c.type === 'twins').length;
    assert(twinsCount === 0 || twinsCount === 2, 'Twins room must come in pair (0 or 2)');
});

test('TEST-02: Control row sliding and wrap-around', () => {
    const room = {
        game: {
            board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
                type: 'empty', revealed: false, row: r, col: c
            }))),
            players: [
                { id: 0, name: 'P1', row: 0, col: 0, alive: true },
                { id: 1, name: 'P2', row: 0, col: 4, alive: true }
            ],
            logs: []
        }
    };
    room.game.board[0][0].type = 'vortex';
    room.game.board[0][4].type = 'moving';

    // Slide row 0 to the right (direction +1)
    s.executeSlide(room, 'row', 0, 1);

    // Column indices should shift right by 1, wrapping around 4 -> 0
    assert.strictEqual(room.game.board[0][1].type, 'vortex', 'Vortex shifted from col 0 to 1');
    assert.strictEqual(room.game.board[0][0].type, 'moving', 'Moving shifted from col 4 to 0 (wrapped)');
    assert.strictEqual(room.game.players[0].col, 1, 'Player 1 moved with the tile to col 1');
    assert.strictEqual(room.game.players[1].col, 0, 'Player 2 wrapped with the tile to col 0');
});

test('TEST-03: Moving Chamber swaps position along with all occupants', () => {
    const room = {
        game: {
            board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
                type: 'empty', revealed: false, row: r, col: c
            }))),
            players: [
                { id: 0, name: 'Alice', row: 1, col: 1, alive: true },
                { id: 1, name: 'Bob', row: 1, col: 1, alive: true },
                { id: 2, name: 'Charlie', row: 3, col: 3, alive: true }
            ],
            logs: [],
            waitingForInput: null
        }
    };
    room.game.board[1][1] = { type: 'moving', revealed: true, row: 1, col: 1 };
    room.game.board[4][4] = { type: 'mortal', revealed: false, row: 4, col: 4 };

    // Call production executeMovingSwap
    const success = s.executeMovingSwap(room.game, room.game.players[0], 4, 4);
    assert.strictEqual(success, true, 'executeMovingSwap must succeed');

    assert.strictEqual(room.game.board[4][4].type, 'moving', 'Moving chamber at new position');
    assert.strictEqual(room.game.board[4][4].revealed, true, 'Moving chamber stays revealed');
    assert.strictEqual(room.game.board[1][1].type, 'mortal', 'Mortal chamber swapped back to old position');
    assert.strictEqual(room.game.board[1][1].revealed, false, 'Mortal chamber remains face-down');
    assert.strictEqual(room.game.players[0].row, 4, 'Alice moved with chamber');
    assert.strictEqual(room.game.players[1].row, 4, 'Bob moved with chamber');
    assert.strictEqual(room.game.players[2].row, 3, 'Charlie remained in his own room');
});

test('TEST-04: Illusion room exit shifts with a hidden room when vacated', () => {
    const room = {
        game: {
            board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
                type: 'empty', revealed: false, row: r, col: c
            }))),
            players: [
                { id: 0, name: 'Runner', row: 1, col: 1, alive: true } // already moved out of (0,0)
            ],
            logs: []
        }
    };
    room.game.board[0][0] = { type: 'illusion', revealed: true, row: 0, col: 0 };
    room.game.board[3][3] = { type: 'freezer', revealed: false, row: 3, col: 3 };

    s.checkIllusionExit(room, 0, 0);

    // Origin (0,0) should no longer be illusion and must be face-down
    assert.notStrictEqual(room.game.board[0][0].type, 'illusion', 'Illusion room must have vanished from (0,0)');
    assert.strictEqual(room.game.board[0][0].revealed, false, 'Origin room must now be face-down');

    // Exactly one illusion room must exist on board and be hidden
    const flat = room.game.board.flat();
    const illusionRoom = flat.find(c => c.type === 'illusion');
    assert(illusionRoom, 'An illusion room must still exist on the board');
    assert.strictEqual(illusionRoom.revealed, false, 'Shifted illusion room must be face-down');
});

test('TEST-05: Flooded Room mechanics and endRound execution', () => {
    const room = {
        game: {
            currentRound: 1,
            maxRounds: 8,
            board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
                type: 'empty', revealed: true, row: r, col: c
            }))),
            players: [
                { id: 0, name: 'Swimmer', row: 1, col: 1, alive: true, floodedRounds: 0, actions: [null, null], hasActed: [false, false] }
            ],
            logs: [],
            gameOver: false
        }
    };
    room.game.board[1][1].type = 'flooded';

    // Round 1 ends
    s.endRound(room);
    assert.strictEqual(room.game.players[0].alive, true, 'Swimmer must survive round 1');
    assert.strictEqual(room.game.players[0].floodedRounds, 1, 'Swimmer flooded counter incremented to 1');

    // Round 2 ends while still in flooded room
    s.endRound(room);
    assert.strictEqual(room.game.players[0].alive, false, 'Swimmer drowned after 2 consecutive rounds');
    assert.strictEqual(room.game.gameOver, true, 'Game ends when all prisoners die');
});

test('TEST-06 [R07]: Room 25 requires outward ejection after all survivors reach the edge', () => {
    const room = {
        code: 'TEST',
        players: [],
        game: {
            mode: 'cooperative',
            board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
                type: 'empty', revealed: true, row: r, col: c
            }))),
            players: [
                { id: 0, name: 'Alice', role: 'prisoner', row: 0, col: 1, alive: true },
                { id: 1, name: 'Bob', role: 'prisoner', row: 0, col: 1, alive: true }
            ],
            currentPlayerIndex: 0,
            currentActionIndex: 0,
            logs: [],
            gameOver: false,
            gameResult: null
        }
    };
    room.game.board[0][1] = { type: 'room25', revealed: true, row: 0, col: 1 };

    // Moving Room 25 from column 2 to the edge is not an escape.
    s.executeSlide(room, 'row', 0, -1);
    assert.strictEqual(room.game.board[0][0].type, 'room25', 'First slide must carry Room 25 to the edge');
    assert.strictEqual(room.game.players.every(p => p.row === 0 && p.col === 0), true, 'Both survivors move with Room 25');
    assert.strictEqual(room.game.gameOver, false, 'Reaching the edge alone must not end the game');

    // A second outward slide ejects Room 25 and wins for every surviving prisoner.
    s.executeSlide(room, 'row', 0, -1);
    assert.strictEqual(room.game.gameOver, true, 'Outward ejection must end the game');
    assert.strictEqual(room.game.gameResult.victory, true, 'Outward ejection must be victory');
    assert.deepStrictEqual(room.game.gameResult.survivors, ['Alice', 'Bob']);
});

test('TEST-07: Fog of War and Sanitized Game State', () => {
    const room = {
        code: 'ABCD',
        hostId: 'sock1',
        game: {
            mode: 'suspicion',
            maxRounds: 10,
            currentRound: 1,
            phase: 'programming',
            currentPlayerIndex: 0,
            currentActionIndex: 0,
            board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
                type: 'mortal', revealed: false, row: r, col: c
            }))),
            players: [
                { id: 0, socketId: 'sock1', name: 'Alice', role: 'guard', color: '#fff', alive: true, row: 2, col: 2, actions: ['move', 'push'], hasActed: [false, false], peekedRooms: [{ r: 0, c: 0 }] },
                { id: 1, socketId: 'sock2', name: 'Bob', role: 'prisoner', color: '#000', alive: true, row: 2, col: 2, actions: ['peek', 'move'], hasActed: [false, false], peekedRooms: [] }
            ],
            logs: [],
            gameOver: false
        }
    };

    // Sanitize state for Bob ('sock2')
    const bobState = s.getSanitizedGameState(room, 'sock2');

    // 1. Bob must not see unrevealed tiles unless peeked by him
    assert.strictEqual(bobState.board[0][0].type, 'hidden', 'Bob must see (0,0) as hidden even though Alice peeked at it');
    assert.strictEqual(bobState.board[0][0].peekedByMe, false, 'Bob did not peek at (0,0)');

    // 2. Bob must not see Alice secret role (guard) in suspicion mode
    const aliceInBobState = bobState.players.find(p => p.id === 0);
    assert.strictEqual(aliceInBobState.role, 'hidden', 'Alice role must be masked to Bob in suspicion mode');

    // 3. Bob must not see Alice programmed actions during programming phase
    assert.deepStrictEqual(aliceInBobState.actions, [null, null], 'Alice secret actions must be masked during programming');
});

test('TEST-08 [R07]: Outward slide ejection triggers escape; inward or unrelated slide does not', () => {
    const makeGame = (mode = 'cooperative') => ({
        mode,
        board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
            type: 'empty', revealed: true, row: r, col: c
        }))),
        players: [
            { id: 0, name: 'Alice', role: 'prisoner', row: 0, col: 0, alive: true },
            { id: 1, name: 'Bob', role: 'prisoner', row: 0, col: 0, alive: true }
        ],
        logs: [],
        gameOver: false
    });

    // 1. Unrelated row slide (row 1) does not escape
    const game1 = makeGame();
    game1.board[0][0] = { type: 'room25', revealed: true, row: 0, col: 0 };
    const resUnrelated = engine.checkEscapeSlide(game1, 'row', 1, -1, game1.players[0]);
    assert.strictEqual(resUnrelated, null, 'Unrelated row 1 slide must not trigger escape');

    // 2. Inward slide on row 0 (direction +1 / right) does not escape (pushes Room 25 towards center)
    const game2 = makeGame();
    game2.board[0][0] = { type: 'room25', revealed: true, row: 0, col: 0 };
    const resInward = engine.checkEscapeSlide(game2, 'row', 0, 1, game2.players[0]);
    assert.strictEqual(resInward, null, 'Inward row 0 slide must not trigger escape');

    // 3. Outward slide on row 0 (direction -1 / left off board) triggers escape!
    const game3 = makeGame();
    game3.board[0][0] = { type: 'room25', revealed: true, row: 0, col: 0 };
    const resOutward = engine.checkEscapeSlide(game3, 'row', 0, -1, game3.players[0]);
    assert.ok(resOutward, 'Outward slide must trigger escape');
    assert.strictEqual(resOutward.victory, true, 'Escape must be victory');

    // 4. If a prisoner is missing from Room 25, outward slide does not escape
    const game4 = makeGame();
    game4.board[0][0] = { type: 'room25', revealed: true, row: 0, col: 0 };
    game4.players[1].row = 2; // Bob is left behind
    const resMissing = engine.checkEscapeSlide(game4, 'row', 0, -1, game4.players[0]);
    assert.strictEqual(resMissing, null, 'Outward slide with missing prisoner must not escape');
});

test('TEST-09 [R08]: Private peek knowledge remaps with sliding tiles', () => {
    const game = {
        board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
            id: `tile_${r}_${c}`, type: 'empty', revealed: false, row: r, col: c
        }))),
        players: [
            { id: 0, socketId: 's0', name: 'Alice', role: 'prisoner', row: 2, col: 2, alive: true, peekedRooms: [{ r: 0, c: 0 }] }
        ],
        logs: []
    };
    game.board[0][0].type = 'vision';
    game.board[0][4].type = 'mortal';

    // Slide row 0 to the right (+1)
    engine.executeSlide(game, 'row', 0, 1);

    // Tile that was at (0,0) [vision] is now at (0,1)
    assert.strictEqual(game.board[0][1].type, 'vision');
    // Tile that was at (0,4) [mortal] wrapped around to (0,0)
    assert.strictEqual(game.board[0][0].type, 'mortal');

    // Alice's peekedRooms MUST have shifted to col 1!
    assert.strictEqual(game.players[0].peekedRooms[0].c, 1, 'Peeked coordinate c must shift to 1');

    // Sanitized state for Alice: (0,1) [vision] must be revealed/peeked, but (0,0) [mortal] must be hidden!
    const sanitized = engine.getSanitizedGameState(game, 'CODE', 'host', 's0');
    assert.strictEqual(sanitized.board[0][1].peekedByMe, true, 'Alice still knows the vision room at its new position');
    assert.strictEqual(sanitized.board[0][1].type, 'vision', 'Vision room visible to Alice');
    assert.strictEqual(sanitized.board[0][0].peekedByMe, false, 'Mortal room wrapped into (0,0) must NOT be known to Alice');
    assert.strictEqual(sanitized.board[0][0].type, 'hidden', 'Mortal room must remain hidden');
});

test('TEST-10 [R13]: Ultimate Character Abilities validation and execution', () => {
    const makeGame = () => ({
        board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
            type: 'empty', revealed: false, row: r, col: c
        }))),
        players: [
            { id: 0, characterId: 'alice', name: 'Alice', alive: true, row: 2, col: 2, actions: ['move', 'peek'] },
            { id: 1, characterId: 'frank', name: 'Frank', alive: true, row: 2, col: 2, actions: ['peek', 'push'] },
            { id: 2, characterId: 'kevin', name: 'Kevin', alive: true, row: 2, col: 2, actions: ['move', 'move'] },
            { id: 3, characterId: 'jennifer', name: 'Jennifer', alive: true, row: 2, col: 2, actions: ['push', 'move'] },
            { id: 4, characterId: 'emmy', name: 'Emmy', alive: true, row: 2, col: 2, actions: ['move', 'control'] },
            { id: 5, characterId: 'bruce', name: 'Bruce', alive: true, row: 0, col: 0, actions: ['control', 'move'] }
        ],
        logs: []
    });

    // 1. Alice: Diagonal Peek
    const gAlice = makeGame();
    const failOrthogonal = engine.executeCharacterAbility(gAlice, gAlice.players[0], { row: 2, col: 3 });
    assert.strictEqual(failOrthogonal.success, false, 'Orthogonal peek must fail for Alice diagonal ability');
    const okDiagonal = engine.executeCharacterAbility(gAlice, gAlice.players[0], { row: 1, col: 1 });
    assert.strictEqual(okDiagonal.success, true, 'Diagonal peek must succeed for Alice');
    assert.strictEqual(gAlice.players[0].abilityUsed, true);
    const failUsedAgain = engine.executeCharacterAbility(gAlice, gAlice.players[0], { row: 3, col: 3 });
    assert.strictEqual(failUsedAgain.success, false, 'Second ability use must fail');

    // 2. Frank: Power Push (distance 2 straight)
    const gFrank = makeGame();
    const okFrank = engine.executeCharacterAbility(gFrank, gFrank.players[1], { targetId: 0, row: 0, col: 2 });
    assert.strictEqual(okFrank.success, true, 'Frank power push 2 tiles straight must succeed');
    assert.strictEqual(gFrank.players[0].row, 0, 'Target moved 2 tiles up');
    assert.strictEqual(gFrank.board[0][2].revealed, true, 'Target room revealed');

    // 3. Kevin: Long Jump (distance 2 straight)
    const gKevin = makeGame();
    const okKevin = engine.executeCharacterAbility(gKevin, gKevin.players[2], { row: 2, col: 4 });
    assert.strictEqual(okKevin.success, true, 'Kevin long jump 2 tiles straight must succeed');
    assert.strictEqual(gKevin.players[2].col, 4, 'Kevin jumped to col 4');

    // 4. Jennifer: Escort (move ally in same room along)
    const gJennifer = makeGame();
    const okJennifer = engine.executeCharacterAbility(gJennifer, gJennifer.players[3], { allyId: 0, row: 2, col: 3 });
    assert.strictEqual(okJennifer.success, true, 'Jennifer escort must succeed');
    assert.strictEqual(gJennifer.players[3].col, 3, 'Jennifer moved to col 3');
    assert.strictEqual(gJennifer.players[0].col, 3, 'Escorted ally moved to col 3');

    // 5. Emmy: Mind Swap (swap action 1 and action 2)
    const gEmmy = makeGame();
    assert.deepStrictEqual(gEmmy.players[4].actions, ['move', 'control']);
    const okEmmy = engine.executeCharacterAbility(gEmmy, gEmmy.players[4], {});
    assert.strictEqual(okEmmy.success, true, 'Emmy mind swap must succeed');
    assert.deepStrictEqual(gEmmy.players[4].actions, ['control', 'move'], 'Actions swapped');

    // 6. Bruce: Double Shift (slide 2 steps)
    const gBruce = makeGame();
    gBruce.board[0][0].type = 'vortex';
    const okBruce = engine.executeCharacterAbility(gBruce, gBruce.players[5], { slideType: 'row', index: 0, direction: 1 });
    assert.strictEqual(okBruce.success, true, 'Bruce double shift must succeed');
    assert.strictEqual(gBruce.board[0][2].type, 'vortex', 'Tile shifted 2 steps right from 0 to 2');
});

test('TEST-11: Suspicion awards time-limit outcome to the Guards', () => {
    const fallback = 'Time ran out! The complex is sealed.';

    assert.strictEqual(
        engine.getTimeLimitResult({ mode: 'suspicion', currentRound: 5, maxRounds: 6 }, fallback),
        null,
        'The guard outcome must not fire before the final round'
    );
    assert.deepStrictEqual(
        engine.getTimeLimitResult({ mode: 'suspicion', currentRound: 6, maxRounds: 6 }, fallback),
        {
            victory: false,
            message: 'Time ran out! The Guards win because no prisoners escaped.'
        }
    );
    assert.deepStrictEqual(
        engine.getTimeLimitResult({ mode: 'cooperative', currentRound: 6, maxRounds: 6 }, fallback),
        { victory: false, message: fallback },
        'Other modes retain their existing timeout message'
    );
});
