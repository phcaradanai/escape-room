const test = require('node:test');
const assert = require('node:assert/strict');
const { io: ioClient } = require('socket.io-client');
const http = require('http');
const s = require('../server.js');
const engine = require('../public/game-engine.js');

test('NET-01 [R01]: getPublicPlayers strips sessionToken from all player projections', () => {
    const rawPlayers = [
        { socketId: 's1', sessionToken: 'tok_secret1', name: 'Alice', color: '#00d4ff', ready: true, connected: true },
        { socketId: 's2', sessionToken: 'tok_secret2', name: 'Bob', color: '#ff3e8e', ready: false, connected: true }
    ];
    const publicPlayers = s.getPublicPlayers(rawPlayers, 's1');
    assert.strictEqual(publicPlayers.length, 2);
    publicPlayers.forEach(p => {
        assert.strictEqual(p.sessionToken, undefined, 'Public player MUST NOT contain sessionToken');
    });
    assert.strictEqual(publicPlayers[0].isHost, true);
    assert.strictEqual(publicPlayers[1].isHost, false);
});

test('NET-02 [R02]: sanitizePlayerName strips control characters and limits length', () => {
    assert.strictEqual(s.sanitizePlayerName('   Normal Name   '), 'Normal Name');
    assert.strictEqual(s.sanitizePlayerName('A'.repeat(50)), 'A'.repeat(16));
    assert.strictEqual(s.sanitizePlayerName('', 'Fallback'), 'Fallback');
    assert.strictEqual(s.sanitizePlayerName(null, 'Fallback'), 'Fallback');
    assert.strictEqual(s.sanitizePlayerName('<script>alert(1)</script>'), '<script>alert(1)');
});

test('NET-03 [R12]: getSanitizedGameState hides unrevealed actions of other players in resolution', () => {
    const game = {
        mode: 'cooperative',
        maxRounds: 10,
        currentRound: 1,
        phase: 'resolution',
        currentPlayerIndex: 0,
        currentActionIndex: 0,
        waitingForInput: { type: 'move-tile', playerId: 0 },
        pushTargetId: null,
        board: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ({
            type: 'empty', revealed: false, row: r, col: c
        }))),
        players: [
            { id: 0, socketId: 'sock_p0', name: 'P0', role: 'prisoner', alive: true, row: 2, col: 2, actions: ['move', 'peek'], hasActed: [false, false] },
            { id: 1, socketId: 'sock_p1', name: 'P1', role: 'prisoner', alive: true, row: 2, col: 2, actions: ['control', 'push'], hasActed: [false, false] }
        ],
        logs: [],
        gameOver: false,
        gameResult: null
    };

    // Client for P0
    const stateP0 = engine.getSanitizedGameState(game, 'TEST', 'sock_p0', 'sock_p0');
    // P0 should see their own programmed actions
    assert.deepStrictEqual(stateP0.players[0].actions, ['move', 'peek'], 'P0 sees their own actions');
    // P0 should NOT see P1 actions yet because P1 has not acted and is not current player
    assert.deepStrictEqual(stateP0.players[1].actions, [null, null], 'P0 MUST NOT see P1 unrevealed actions');

    // Client for P1
    const stateP1 = engine.getSanitizedGameState(game, 'TEST', 'sock_p0', 'sock_p1');
    // P1 sees P0 currently resolving Action 0
    assert.strictEqual(stateP1.players[0].actions[0], 'move', 'P1 sees P0 active action 0');
    // P1 MUST NOT see P0 Action 1
    assert.strictEqual(stateP1.players[0].actions[1], null, 'P1 MUST NOT see P0 future action 1');
    // P1 sees own actions
    assert.deepStrictEqual(stateP1.players[1].actions, ['control', 'push'], 'P1 sees own actions');
});

test('NET-04 [R01, R03, R04]: Socket client live validation and permission enforcement', async (t) => {
    // Start temporary test server instance on loopback with ephemeral port
    const testServer = http.createServer(s.app);
    s.io.attach(testServer);
    await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
    const port = testServer.address().port;
    const url = `http://127.0.0.1:${port}`;

    const clients = [];
    function createClient() {
        const c = ioClient(url, { transports: ['websocket'], forceNew: true });
        clients.push(c);
        return c;
    }

    const hostClient = createClient();
    const guestClient = createClient();

    t.after(async () => {
        for (const c of clients) {
            c.removeAllListeners();
            c.disconnect();
        }
        if (roomCode) s.rooms.delete(roomCode);
        s.io.close();
        await new Promise(r => testServer.close(r));
    });

    await new Promise((res) => hostClient.once('connect', res));
    await new Promise((res) => guestClient.once('connect', res));

    // 1. R03: Malformed payload to createRoom does NOT crash server
    hostClient.emit('createRoom', null);
    hostClient.emit('createRoom', {});
    await new Promise((r) => setTimeout(r, 100));

    // 2. Host creates room
    let roomCode = null;
    let hostToken = null;
    const roomJoinedPromise = new Promise((resolve) => {
        hostClient.once('roomJoined', (data) => {
            roomCode = data.roomCode;
            hostToken = data.sessionToken;
            resolve(data);
        });
    });
    hostClient.emit('createRoom', { playerName: 'HostPlayer', mode: 'cooperative', difficulty: 10 });
    const hostRoomData = await roomJoinedPromise;

    assert.ok(roomCode, 'Room code generated');
    assert.ok(hostToken, 'Host session token generated');
    // Verify host received players list without any sessionToken exposed
    hostRoomData.players.forEach(p => {
        assert.strictEqual(p.sessionToken, undefined, 'sessionToken must not be in players list');
    });

    // 3. Guest joins room
    const guestJoinedPromise = new Promise((resolve) => {
        guestClient.once('roomJoined', resolve);
    });
    guestClient.emit('joinRoom', { playerName: '<img src=x onerror=1>Guest', roomCode });
    const guestRoomData = await guestJoinedPromise;

    // Verify guest does NOT receive host's sessionToken
    assert.strictEqual(guestRoomData.players[0].name, 'HostPlayer');
    assert.strictEqual(guestRoomData.players[0].sessionToken, undefined, 'Guest MUST NOT see host sessionToken');
    assert.strictEqual(guestRoomData.players[1].sessionToken, undefined, 'Guest MUST NOT see guest sessionToken in player projection');
    assert.notStrictEqual(guestRoomData.sessionToken, hostToken, 'Guest token is distinct from host');

    // 4. R01: Guest attempts to start game (MUST BE REJECTED)
    let guestErrorMsg = null;
    guestClient.once('errorMsg', (msg) => { guestErrorMsg = msg; });
    guestClient.emit('startOnlineGame');
    await new Promise((r) => setTimeout(r, 150));
    assert.strictEqual(guestErrorMsg, 'Only the room host can start the game');

    // 5. Host starts game
    const gameStartedPromise = new Promise((resolve) => {
        hostClient.once('gameStarted', resolve);
    });
    hostClient.emit('startOnlineGame');
    await gameStartedPromise;

    // 6. R03: Malformed submitProgramming payload
    hostClient.emit('submitProgramming', { actions: ['invalidAction', 'move'] });
    hostClient.emit('submitProgramming', null);
    await new Promise((r) => setTimeout(r, 100));

    // Valid programming
    hostClient.emit('submitProgramming', { actions: ['move', 'peek'] });
    guestClient.emit('submitProgramming', { actions: ['peek', 'move'] });

    // Wait for resolution phase to begin
    await new Promise((resolve) => {
        const handler = (state) => {
            if (state.phase === 'resolution' && state.waitingForInput) {
                hostClient.off('gameStateUpdate', handler);
                resolve(state);
            }
        };
        hostClient.on('gameStateUpdate', handler);
    });

    // 7. R04: Unsolicited / forged input test
    // Suppose waitingForInput is move-tile for player 0.
    // If player 0 sends visionPeek or movingSwap, it MUST be ignored!
    const roomObj = s.rooms.get(roomCode);
    assert.ok(roomObj && roomObj.game, 'Game active');
    const expectedType = roomObj.game.waitingForInput.type;
    assert.strictEqual(expectedType, 'move-tile', 'Game is waiting for move-tile');

    // Try forging visionPeek
    hostClient.emit('playerActionInput', { type: 'visionPeek', row: 0, col: 0 });
    await new Promise((r) => setTimeout(r, 100));
    // Verify waitingForInput was NOT consumed and player has not moved
    assert.ok(roomObj.game.waitingForInput, 'Mismatched visionPeek input must be rejected');
    assert.strictEqual(roomObj.game.waitingForInput.type, 'move-tile', 'Waiting type still move-tile');

    // Try valid move
    hostClient.emit('playerActionInput', { type: 'move', row: 2, col: 1 });
    await new Promise((r) => setTimeout(r, 100));
    // Verify waitingForInput was consumed
    assert.strictEqual(roomObj.game.waitingForInput, null, 'Valid move consumed waitingForInput atomically');

    // 8. R05: Rematch while game in progress MUST be rejected
    let rematchError = null;
    hostClient.once('errorMsg', (msg) => { rematchError = msg; });
    hostClient.emit('rematchRoom');
    await new Promise((r) => setTimeout(r, 100));
    assert.strictEqual(rematchError, 'Cannot rematch while game is in progress');
    assert.ok(roomObj.game, 'Game still exists, not wiped by premature rematch');

    // 9. R06: Guest disconnects and reconnects with same sessionToken
    guestClient.disconnect();
    await new Promise((r) => setTimeout(r, 100));

    // Reconnecting socket with guest's sessionToken
    const reconnectedGuest = createClient();
    await new Promise((res) => reconnectedGuest.once('connect', res));
    let reconnectedState = null;
    const reconnectedPromise = new Promise((resolve) => {
        reconnectedGuest.once('gameStateUpdate', (state) => {
            reconnectedState = state;
            resolve(state);
        });
    });

    reconnectedGuest.emit('joinRoom', {
        playerName: 'Guest',
        roomCode: roomCode,
        sessionToken: guestRoomData.sessionToken
    });

    await reconnectedPromise;
    assert.ok(reconnectedState, 'Reconnected guest received gameStateUpdate');
    assert.strictEqual(reconnectedState.players[1].name, s.sanitizePlayerName('<img src=x onerror=1>Guest'));
    reconnectedGuest.disconnect();
});
