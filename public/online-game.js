/* ========================================================
   ROOM 25 ULTIMATE - ONLINE CLIENT
   Synchronized device-to-device multiplayer via Socket.io
   With English & Thai (ภาษาไทย) Localization
   ======================================================== */

const socket = io();

// ==================== LOCALIZATION DICTIONARIES ====================
let currentLang = localStorage.getItem('room25_lang') || 'th'; // Default to Thai

const I18N = {
    en: {
        gameTitle: "ROOM 25",
        gameSubtitle: "ULTIMATE ONLINE",
        tagline: "REAL-TIME MULTIPLAYER COMPLEX",
        playerCodename: "PLAYER CODENAME",
        createRoom: "CREATE ROOM",
        joinRoom: "JOIN ROOM",
        rules: "RULES",
        clientFooter: "ONLINE CLIENT · DEVICE-TO-DEVICE PLAY · HIDDEN ACTIONS",
        hostTitle: "HOST NEW COMPLEX",
        gameMode: "GAME MODE",
        coopMode: "COOP",
        suspicionMode: "SUSPICION",
        competitionMode: "COMPETITION",
        roundsDifficulty: "ROUNDS (DIFFICULTY)",
        easy: "10 (EASY)",
        normal: "8 (NORMAL)",
        hard: "6 (HARD)",
        cancel: "CANCEL",
        create: "CREATE",
        joinTitle: "ENTER ROOM CODE",
        joinBtn: "JOIN",
        lobbyTitle: "COMPLEX LOBBY",
        roomCodeLabel: "ROOM CODE:",
        copyInviteLink: "📋 COPY INVITE LINK",
        connectedPlayers: "CONNECTED PRISONERS",
        playersHere: "PLAYERS HERE",
        viewPlayers: "VIEW PLAYERS",
        settings: "SETTINGS",
        launchExp: "LAUNCH EXPERIMENT",
        waitingHost: "Waiting for the host to launch the game...",
        you: "(YOU)",
        round: "ROUND",
        phase: "PHASE",
        programmingPhase: "PROGRAMMING",
        resolutionPhase: "RESOLUTION",
        myControls: "MY CONTROLS",
        action1: "ACTION 1",
        action2: "ACTION 2",
        clearAction1: "Clear action 1",
        clearAction2: "Clear action 2",
        selectSlotToReplace: "Choose an action slot before replacing a programmed action.",
        lockInBtn: "LOCK IN SECRET ACTIONS",
        actionsLocked: "Actions locked! Waiting for others...",
        resolvingAction: "RESOLVING ACTION",
        selectShift: "SELECT ROW OR COL TO SHIFT",
        rows: "ROWS",
        cols: "COLS",
        direction: "DIRECTION",
        left: "◀ LEFT",
        right: "▶ RIGHT",
        up: "▲ UP",
        down: "▼ DOWN",
        selectPushTarget: "SELECT PLAYER TO PUSH",
        roomIntel: "ROOM INTEL",
        hoverIntel: "Hover over revealed rooms for data",
        complexLogs: "COMPLEX LOGS",
        returnToLobby: "RETURN TO LOBBY",
        rematchButton: "REMATCH",
        escaped: "ESCAPED!",
        gameOver: "GAME OVER",
        survivors: "SURVIVORS",
        casualties: "CASUALTIES",
        role: "ROLE",
        prisoner: "PRISONER",
        guard: "GUARD",
        lookAction: "LOOK",
        moveAction: "MOVE",
        pushAction: "PUSH",
        controlAction: "CONTROL",
        chooseTwoActions: "PROGRAMMING PHASE: Choose your 2 secret actions!",
        waitingOthers: "Actions locked in. Awaiting other prisoners...",
        yourTurn: "⚡ YOUR TURN: Resolving",
        turnOf: "'s Turn",
        clickMovePrompt: "👉 Click an adjacent chamber on the board to MOVE.",
        clickPeekPrompt: "👁 Click an adjacent hidden chamber to secretly LOOK.",
        clickPushPrompt: "👉 Click an adjacent chamber to push the victim into.",
        clickControlPrompt: "⚙ CONTROL: Choose a row or column to shift:",
        clickVisionPrompt: "🔮 Vision Chamber: Click ANY face-down chamber on the grid to inspect it.",
        clickMovingPrompt: "🔄 Moving Chamber: Click ANY face-down chamber to swap positions with this room.",
        pushWhoPrompt: "👊 Pick which player to push:",
        unexploredRoom: "UNEXPLORED ROOM",
        unexploredDesc: "Use LOOK or peeking actions to reveal this chamber before stepping in!",
        peekedTag: "(PEEKED)",
        rulesTitle: "RULES & SURVIVAL",
        back: "← BACK",
        ruleSection1Title: "ONLINE ROOM SYSTEM",
        ruleSection1Desc: "Every player connects on their own device via a Room Code or URL. You can secretly program actions and private peeks without other players seeing your screen!",
        ruleSection2Title: "GAMEPLAY LOOP",
        ruleSection2Desc: "1. Programming: Every prisoner secretly locks in 2 actions (Look, Move, Push, Control) on their own device.\n2. Resolution: Actions resolve one-by-one in turn order. Room hazards and traps trigger in real-time.",
        ruleSection3Title: "WINNING CONDITIONS",
        ruleSection3Desc: "Locate Room 25, assemble your survivors inside when it is positioned along an outer border, and trigger Control to eject the chamber into the outside world!",
        roomGuideBtn: "ROOM GUIDE",
        languageThai: "Switch language to Thai",
        languageEnglish: "Switch language to English",
        moreGameControls: "More game controls",
        soundLabel: "Sound",
        languagePicker: "Choose language",
        gameLogShort: "Log",
        roomGuideShort: "Guide",
        soundMuted: "Sound muted; activate to unmute",
        soundEnabled: "Sound on; activate to mute",
        gameLog: "Open game log",
        invalidPayload: "The request was invalid. Please try again.",
        invalidRoomCode: "Enter a valid four-character room code.",
        roomCodeLength: "Room code must be four characters.",
        roomNotFound: "Room not found. Check the code and try again.",
        gameAlreadyStarted: "This game is already in progress.",
        roomFull: "This room is full (maximum 8 players).",
        hostOnlyRematch: "Only the host can request a rematch.",
        rematchInProgress: "A rematch is only available after the game ends.",
        submittingActions: "Sending actions; waiting for server confirmation.",
        invalidProgramming: "The server rejected these actions. Choose two valid actions again.",
        programmingPhaseEnded: "The planning phase ended before the server accepted these actions.",
        playerUnavailable: "Your player is no longer active in this room.",
        programmingTimeout: "No server confirmation received. Check your connection, then try again.",
        connectionLost: "Connection lost. Automatically trying to reconnect.",
        reconnecting: "Trying to reconnect...",
        rejoiningRoom: "Rejoining your room...",
        syncingGameState: "Room found; syncing the game state...",
        connectionRecovered: "Connection restored. Your room state is current.",
        reconnectFailed: "Reconnect attempts failed. Check your connection and reload to try again.",
        sessionUnavailable: "This saved room session is unavailable. Join again with a valid room code or invite link.",
        hostOnlyStart: "Only the host can start the game.",
        needOnePlayer: "At least one connected player is required.",
        roomGuideTitle: "ROOM EFFECTS & GAME RESTRICTIONS",
        tabActionRules: "📌 ACTION RULES",
        tabAllRooms: "🌐 ALL ROOMS",
        tabSafeRooms: "🟢 SAFE",
        tabWarningRooms: "🟡 WARNING",
        tabDangerRooms: "🔴 DANGER",
        tabSpecialRooms: "🏠🚪 SPECIAL",
        viewRoomEffects: "View All Room Effects & Restrictions",
        closeGuide: "UNDERSTOOD (CLOSE)",
        cannotPushCentral: "Cannot PUSH in Central Room (Safe Zone)!",
        cannotPeekDark: "Cannot LOOK while inside Dark Room!",
        noPushBadge: "No Push",
        noPeekBadge: "No Look",
        rulePushTitle: "PUSH",
        rulePush1: "Pushing is strictly prohibited in the Central Room (Starting Chamber) because it is a permanent Safe Zone. The PUSH button is disabled while you are here.",
        rulePush2: "Another living player must be in your current room. If you are alone, you cannot push anyone.",
        rulePush3: "Pushes target 1 adjacent chamber (N/S/E/W). If that chamber is face-down, it is revealed immediately and the victim suffers its effects.",
        rulePeekTitle: "LOOK (PEEK)",
        rulePeek1: "Looking is impossible while inside a Dark Room due to total lack of visibility.",
        rulePeek2: "You may only peek at adjacent, face-down chambers (unless using Vision Chamber).",
        rulePeek3: "Peeked intelligence is private to you alone. Other players will not see the chamber's identity.",
        ruleControlTitle: "CONTROL (SLIDE)",
        ruleControl1: "Row 3 (horizontal center) and Column 3 (vertical center) are permanently locked and cannot be shifted due to the fixed Central Room.",
        ruleControl2: "Other rows and columns wrap around the complex. Any players on shifting rooms move along with them.",
        ruleMoveTitle: "MOVE",
        ruleMove1: "Move 1 step into an adjacent chamber.",
        ruleMove2: "Face-down rooms are revealed immediately upon entry. Lethal hazards (such as Mortal Chamber) eliminate you instantly.",
    },
    th: {
        gameTitle: "ROOM 25",
        gameSubtitle: "ห้องมรณะ 25 ออนไลน์",
        tagline: "เขาวงกตห้องมรณะ เรียลไทม์มัลติเพลเยอร์",
        playerCodename: "ชื่อผู้เล่น / โค้ดเนม",
        createRoom: "สร้างห้องเกม",
        joinRoom: "เข้าร่วมห้อง",
        rules: "คู่มือการเล่น",
        clientFooter: "ระบบออนไลน์ข้ามเครื่อง · แยกหน้าจออิสระ · วางแผนลับเฉพาะคุณ",
        hostTitle: "ตั้งค่าสร้างห้องแข่งขันใหม่",
        gameMode: "โหมดการเล่น",
        coopMode: "ร่วมมือ (COOP)",
        suspicionMode: "จับคนทรยศ (SUSPICION)",
        competitionMode: "เอาชีวิตรอดเดี่ยว (COMPETITION)",
        roundsDifficulty: "จำนวนรอบ (ความยาก)",
        easy: "10 รอบ (ง่าย)",
        normal: "8 รอบ (ปกติ)",
        hard: "6 รอบ (ยาก)",
        cancel: "ยกเลิก",
        create: "ยืนยันสร้างห้อง",
        joinTitle: "ใส่รหัสห้อง 4 หลัก",
        joinBtn: "เข้าห้อง",
        lobbyTitle: "ห้องพักรอผู้เข้าแข่งขัน",
        roomCodeLabel: "รหัสห้อง:",
        connectedPlayers: "ผู้เล่นที่เชื่อมต่อ",
        playersHere: "ผู้เล่นในห้องนี้",
        viewPlayers: "ดูรายชื่อผู้เล่น",
        settings: "การตั้งค่า",
        launchExp: "เริ่มเกมเลย!",
        waitingHost: "กำลังรอหัวหน้าห้องเริ่มเกม...",
        you: "(ตัวคุณ)",
        round: "รอบที่",
        phase: "เฟส",
        programmingPhase: "วางแผนการกระทำ",
        resolutionPhase: "ดำเนินแอ็กชัน",
        myControls: "คำสั่งของคุณ",
        action1: "แอ็กชัน 1",
        action2: "แอ็กชัน 2",
        clearAction1: "ล้างแอ็กชัน 1",
        clearAction2: "ล้างแอ็กชัน 2",
        selectSlotToReplace: "เลือกช่องแอ็กชันก่อนเปลี่ยนคำสั่งที่วางไว้",
        lockInBtn: "ล็อคคำสั่งลับทั้ง 2 อย่าง",
        actionsLocked: "ล็อคคำสั่งแล้ว! กำลังรอผู้เล่นอื่น...",
        submittingActions: "กำลังส่งคำสั่ง รอเซิร์ฟเวอร์ยืนยัน...",
        invalidProgramming: "เซิร์ฟเวอร์ปฏิเสธคำสั่งนี้ กรุณาเลือกคำสั่งที่ถูกต้อง 2 อย่างใหม่",
        programmingPhaseEnded: "ช่วงวางแผนจบก่อนที่เซิร์ฟเวอร์จะยืนยันคำสั่ง",
        playerUnavailable: "ผู้เล่นของคุณไม่อยู่ในห้องนี้แล้ว",
        programmingTimeout: "ไม่ได้รับการยืนยันจากเซิร์ฟเวอร์ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง",
        connectionLost: "การเชื่อมต่อขาดหาย ระบบกำลังลองเชื่อมต่อใหม่...",
        reconnecting: "กำลังลองเชื่อมต่อใหม่...",
        rejoiningRoom: "กำลังกลับเข้าสู่ห้อง...",
        syncingGameState: "พบห้องแล้ว กำลังซิงก์สถานะเกม...",
        connectionRecovered: "เชื่อมต่อแล้ว และได้รับสถานะห้องล่าสุด",
        reconnectFailed: "เชื่อมต่อใหม่ไม่สำเร็จ ตรวจเครือข่ายแล้วโหลดหน้าอีกครั้ง",
        sessionUnavailable: "เซสชันห้องนี้ใช้ต่อไม่ได้ กรุณาเข้าห้องด้วยรหัสหรือลิงก์เชิญใหม่",
        resolvingAction: "กำลังดำเนินการคำสั่ง",
        selectShift: "เลือกแถว (แนวนอน) หรือคอลัมน์ (แนวตั้ง) ที่ต้องการเลื่อน",
        rows: "แถวนอน",
        cols: "แถวตั้ง",
        direction: "ทิศทาง",
        left: "◀ ซ้าย",
        right: "▶ ขวา",
        up: "▲ บน",
        down: "▼ ล่าง",
        selectPushTarget: "เลือกคนที่ต้องการผลัก",
        roomIntel: "ข้อมูลห้อง",
        hoverIntel: "เลื่อนเมาส์/แตะดูห้องที่เปิดแล้วเพื่ออ่านข้อมูล",
        complexLogs: "บันทึกเหตุการณ์",
        returnToLobby: "กลับไปหน้าล็อบบี้",
        rematchButton: "เล่นใหม่อีกครั้ง",
        escaped: "หนีรอดสำเร็จ!",
        gameOver: "จบเกม / ล้มเหลว",
        survivors: "ผู้รอดชีวิต",
        casualties: "ผู้เสียชีวิต",
        role: "บทบาท",
        prisoner: "นักโทษ (PRISONER)",
        guard: "การ์ดทรยศ (GUARD)",
        lookAction: "แอบดู (LOOK)",
        moveAction: "เคลื่อนที่ (MOVE)",
        pushAction: "ผลักคนอื่น (PUSH)",
        controlAction: "เลื่อนห้อง (CONTROL)",
        chooseTwoActions: "เฟสวางแผน: เลือกคำสั่งลับ 2 อย่างของคุณ!",
        waitingOthers: "คุณวางแผนเสร็จแล้ว กำลังรอผู้เล่นคนอื่น...",
        yourTurn: "⚡ ถึงตาคุณแล้ว: กำลังดำเนินคำสั่ง",
        turnOf: "ตากำลังเล่นของ",
        clickMovePrompt: "👉 คลิกห้องที่อยู่ติดกันเพื่อ เดินเข้าไป",
        clickPeekPrompt: "👁 คลิกห้องที่คว่ำอยู่ติดกันเพื่อ แอบดูอย่างลับๆ",
        clickPushPrompt: "👉 คลิกห้องข้างเคียงเพื่อผลักเป้าหมายเข้าไป",
        clickControlPrompt: "⚙ เลื่อนห้อง (CONTROL): เลือกแถวนอนหรือแถวตั้งเพื่อเลื่อน",
        clickVisionPrompt: "🔮 ห้องนิมิต (Vision): คลิกห้องใดก็ได้ที่คว่ำอยู่ทั้งกระดานเพื่อดูความลับ",
        pushWhoPrompt: "👊 เลือกว่าจะผลักใคร:",
        clickMovingPrompt: "🔄 ห้องเคลื่อนย้าย (Moving): คลิกห้องใดก็ได้ที่ยังคว่ำอยู่เพื่อสลับตำแหน่งกับห้องนี้",
        unexploredRoom: "ห้องปริศนาที่ยังไม่เปิด",
        unexploredDesc: "ใช้คำสั่ง 'แอบดู' เพื่อสำรวจก่อนก้าวเข้าไป ป้องกันกับดักมรณะ!",
        peekedTag: "(แอบดูแล้ว)",
        rulesTitle: "กฎกติกาและวิธีเอาชีวิตรอด",
        back: "← ย้อนกลับ",
        ruleSection1Title: "ระบบแยกจอเล่นออนไลน์",
        ruleSection1Desc: "ผู้เล่นทุกคนเชื่อมต่อผ่านมือถือหรือคอมพิวเตอร์ของตัวเองด้วยรหัสห้อง คุณสามารถวางแผนและแอบดูห้องลับได้โดยที่เพื่อนไม่เห็นหน้าจอของคุณ!",
        ruleSection2Title: "ลำดับการเล่นในแต่ละรอบ",
        ruleSection2Desc: "1. เฟสวางแผน (Programming): ทุกคนแอบเลือกคำสั่งลับ 2 แอ็กชันพร้อมกัน\n2. เฟสดำเนินการ (Resolution): ผู้เล่นผลักกัน เดิน เลื่อนห้อง หรือแอบดูตามลำดับเทิร์น กับดักจะทำงานทันทีที่มีคนก้าวเข้าไป",
        ruleSection3Title: "เงื่อนไขการชนะ",
        ruleSection3Desc: "ตามหา 'ห้อง 25 (Room 25)' ให้เจอ รวมตัวผู้รอดชีวิตในห้องนั้นเมื่อห้องอยู่ตรงขอบกระดาน แล้วใช้คำสั่ง 'เลื่อนห้อง (Control)' ดันห้อง 25 ออกสู่อิสรภาพ!",
        roomGuideBtn: "คู่มือห้อง & ข้อจำกัด",
        languageThai: "เปลี่ยนภาษาเป็นไทย",
        languageEnglish: "เปลี่ยนภาษาเป็นอังกฤษ",
        moreGameControls: "เมนูควบคุมเกม",
        soundLabel: "เสียง",
        languagePicker: "เลือกภาษา",
        gameLogShort: "บันทึก",
        roomGuideShort: "คู่มือ",
        soundMuted: "ปิดเสียงแล้ว; กดเพื่อเปิดเสียง",
        soundEnabled: "เปิดเสียงแล้ว; กดเพื่อปิดเสียง",
        gameLog: "เปิดบันทึกเหตุการณ์",
        invalidPayload: "คำขอไม่ถูกต้อง โปรดลองอีกครั้ง",
        invalidRoomCode: "กรุณากรอกรหัสห้องที่ถูกต้อง 4 ตัวอักษร",
        roomCodeLength: "รหัสห้องต้องมี 4 ตัวอักษร",
        roomNotFound: "ไม่พบห้องนี้ กรุณาตรวจสอบรหัสแล้วลองอีกครั้ง",
        gameAlreadyStarted: "เกมนี้เริ่มไปแล้ว",
        roomFull: "ห้องนี้เต็มแล้ว (สูงสุด 8 คน)",
        hostOnlyRematch: "เฉพาะหัวหน้าห้องเท่านั้นที่เริ่มเล่นใหม่ได้",
        rematchInProgress: "เริ่มเล่นใหม่ได้หลังเกมจบเท่านั้น",
        hostOnlyStart: "เฉพาะหัวหน้าห้องเท่านั้นที่เริ่มเกมได้",
        needOnePlayer: "ต้องมีผู้เล่นที่เชื่อมต่ออย่างน้อย 1 คน",
        roomGuideTitle: "คู่มือเอฟเฟกต์ห้องและข้อจำกัดการเล่น",
        tabActionRules: "📌 ข้อจำกัดแอ็กชัน",
        tabAllRooms: "🌐 ทุกห้อง",
        tabSafeRooms: "🟢 ปลอดภัย",
        tabWarningRooms: "🟡 เตือนภัย",
        tabDangerRooms: "🔴 อันตราย",
        tabSpecialRooms: "🏠🚪 พิเศษ",
        viewRoomEffects: "ดูเอฟเฟกต์ & ข้อจำกัดทุกห้อง",
        closeGuide: "เข้าใจแล้ว (ปิดหน้าต่าง)",
        cannotPushCentral: "ห้ามผลักในห้อง Central Room (Safe Zone)!",
        cannotPeekDark: "ห้ามแอบดูเมื่ออยู่ใน Dark Room!",
        noPushBadge: "ห้ามใน Central",
        noPeekBadge: "ห้ามใน Dark",
        rulePushTitle: "ผลัก (PUSH)",
        rulePush1: "ห้ามผลักในห้องเริ่มต้น (Central Room) เด็ดขาดเนื่องจากเป็น Safe Zone ปลอดภัยสูงสุด (ระบบจะปิดปุ่มผลักทันทีเมื่อคุณอยู่ในห้องนี้)",
        rulePush2: "ต้องมีผู้เล่นอื่นอยู่ในห้องเดียวกัน หากอยู่คนเดียวจะไม่สามารถผลักใครได้",
        rulePush3: "ผลักผู้เล่นเป้าหมายไปยังห้องข้างเคียง 1 ช่อง หากห้องนั้นยังคว่ำอยู่จะถูกเปิดหงายทันที และผู้ถูกผลักจะรับผลของห้องนั้น",
        rulePeekTitle: "แอบดู (PEEK / LOOK)",
        rulePeek1: "ห้ามแอบดูเมื่อยืนอยู่ในห้องมืด (Dark Room) เนื่องจากมืดสนิทจนมองไม่เห็น",
        rulePeek2: "แอบดูได้เฉพาะห้องที่อยู่ติดกัน 4 ทิศ (บน, ล่าง, ซ้าย, ขวา) ที่ยังคว่ำอยู่",
        rulePeek3: "ข้อมูลห้องที่แอบดูจะรู้เฉพาะคุณคนเดียว ผู้เล่นอื่นจะไม่เห็น",
        ruleControlTitle: "เลื่อนห้อง (CONTROL)",
        ruleControl1: "ห้ามเลื่อนแถวที่ 3 (แนวนอน) และคอลัมน์ที่ 3 (แนวตั้ง) เนื่องจากมีห้อง Central Room ตรึงไว้ตรงกลาง",
        ruleControl2: "เลื่อนแถวหรือคอลัมน์อื่นได้อิสระ โดยห้องและคนที่หลุดขอบกระดานจะวนกลับมาฝั่งตรงข้าม",
        ruleMoveTitle: "เคลื่อนที่ (MOVE)",
        ruleMove1: "ก้าวเข้าไปยังห้องข้างเคียง 4 ทิศ",
        ruleMove2: "หากห้องยังไม่เปิด จะถูกหงายทันที และหากมีกับดักมรณะ (เช่น Mortal Chamber) ตัวละครจะตายทันที",
    }
};

const ROOM_TYPES_DATA = {
    en: {
        central:     { name: 'Central Room',    icon: '🏠', category: 'central', desc: 'Starting chamber. No aggression allowed.', restriction: '🚫 No PUSH allowed (Safe Zone)' },
        room25:      { name: 'Room 25',         icon: '🚪', category: 'exit',    desc: 'THE EXIT! Gather survivors and use CONTROL to slide off board!', restriction: '🏁 Escape Room (Must slide from edge)' },
        empty:       { name: 'Empty Room',      icon: '⬜', category: 'safe',    desc: 'Completely safe. Nothing happens.', restriction: '✅ Safe room' },
        vision:      { name: 'Vision Chamber',  icon: '🔮', category: 'safe',    desc: 'Peek at any hidden room on the entire board secretly.', restriction: '🔮 Secretly peek ANY room on board' },
        moving:      { name: 'Moving Chamber',  icon: '🔄', category: 'safe',    desc: 'Swap this room with any hidden room on the board.', restriction: '🔄 Swap with ANY hidden tile' },
        controlRoom: { name: 'Control Chamber', icon: '🎛️', category: 'safe',    desc: 'Perform a free CONTROL shift immediately.', restriction: '⚙ Free Control action' },
        vortex:      { name: 'Vortex Room',     icon: '🌀', category: 'warning', desc: 'Immediately transports occupant back to Central Room!', restriction: '🌀 Teleport to Central' },
        freezer:     { name: 'Freezer Room',    icon: '🧊', category: 'warning', desc: 'Frozen chamber! Disables next planned action.', restriction: '🧊 Lose next action' },
        dark:        { name: 'Dark Room',       icon: '🌑', category: 'warning', desc: 'Vision obscured. LOOK action is impossible from here.', restriction: '🚫 Cannot LOOK while inside' },
        mortal:      { name: 'Mortal Chamber',  icon: '💀', category: 'danger',  desc: 'INSTANT DEATH TRAP! All who enter are incinerated.', restriction: '💀 Instant Death upon entry' },
        trapped:     { name: 'Trapped Room',    icon: '⚠️', category: 'danger',  desc: 'Trapdoor activated! Escape on next turn or die.', restriction: '⚠️ Must leave on next action or die' },
        acid:        { name: 'Acid Bath',       icon: '☣️', category: 'danger',  desc: 'Lethal chemicals! If a second person enters, one is destroyed.', restriction: '☣️ 2+ players: 1 player dies' },
        flooded:     { name: 'Flooded Room',    icon: '🌊', category: 'danger',  desc: 'Drown if you stay here at the end of the round.', restriction: '🌊 Drown after 2 rounds' },
        twins:       { name: 'Twin Room',       icon: '👥', category: 'warning', desc: 'Transports you to the other Twin Room.', restriction: '👥 Teleports to twin chamber' },
        illusion:    { name: 'Illusion Room',   icon: '✨', category: 'warning', desc: 'Secretly shifts its position until revealed.', restriction: '✨ Shifts position after exit' },
        hidden:      { name: 'Unexplored Room', icon: '❓', category: 'hidden',  desc: 'Room unknown. Use LOOK to safely inspect it.', restriction: '❓ Unknown hazard' }
    },
    th: {
        central:     { name: 'ห้องจุดเริ่มต้น (Central)', icon: '🏠', category: 'central', desc: 'ห้องเริ่มเกม ปลอดภัยสูงสุด ห้ามผลักกันในห้องนี้', restriction: '🚫 ห้ามผลักเด็ดขาด (Safe Zone)' },
        room25:      { name: 'ห้อง 25 (ทางออก!)',          icon: '🚪', category: 'exit',    desc: 'ประตูสู่อิสรภาพ! เลื่อนห้องนี้ออกนอกศูนย์วิจัยเพื่อหนี', restriction: '🏁 ต้องอยู่ขอบกระดานและสั่ง Control' },
        empty:       { name: 'ห้องว่างเปล่า (Empty)',      icon: '⬜', category: 'safe',    desc: 'ปลอดภัย ไม่มีอันตรายหรือกับดักใดๆ', restriction: '✅ ปลอดภัย ไม่มีกับดัก' },
        vision:      { name: 'ห้องนิมิต (Vision)',         icon: '🔮', category: 'safe',    desc: 'แอบดูห้องที่ยังคว่ำอยู่ห้องไหนก็ได้ 1 ห้องทั่วกระดาน', restriction: '🔮 ส่องห้องคว่ำที่ใดก็ได้ทั่วกระดาน' },
        moving:      { name: 'ห้องเคลื่อนย้าย (Moving)',    icon: '🔄', category: 'safe',    desc: 'สลับตำแหน่งห้องนี้กับห้องที่ยังไม่เปิดห้องใดก็ได้', restriction: '🔄 สลับห้องนี้กับห้องคว่ำที่ใดก็ได้' },
        controlRoom: { name: 'ห้องควบคุมกลไก (Control)',   icon: '🎛️', category: 'safe',    desc: 'ได้สิทธิ์เลื่อนแถวห้อง (Control) ฟรีทันที 1 ครั้ง', restriction: '⚙ สั่งเลื่อนแถวฟรีทันที 1 ครั้ง' },
        vortex:      { name: 'ห้องพายุหมุน (Vortex)',      icon: '🌀', category: 'warning', desc: 'ถูกดูดพากลับไปที่ห้องจุดเริ่มต้นทันที!', restriction: '🌀 วาร์ปส่งกลับห้อง Central ทันที' },
        freezer:     { name: 'ห้องแช่แข็ง (Freezer)',      icon: '🧊', category: 'warning', desc: 'ตัวแข็งชา! จะสูญเสียแอ็กชันถัดไปทันที 1 ครั้ง', restriction: '🧊 เสียแอ็กชันถัดไปทันที 1 แอ็กชัน' },
        dark:        { name: 'ห้องมืด (Dark Room)',       icon: '🌑', category: 'warning', desc: 'มืดสนิท ไม่สามารถใช้คำสั่งแอบดู (Look) จากห้องนี้ได้', restriction: '🚫 ห้ามแอบดูเมื่ออยู่ในห้องนี้' },
        mortal:      { name: 'ห้องมรณะ (Mortal Chamber)', icon: '💀', category: 'danger',  desc: 'ตายทันที! กับดักสังหารใครที่ก้าวเข้ามาจะถูกกำจัด', restriction: '💀 ตายทันทีที่ก้าวเข้ามา' },
        trapped:     { name: 'ห้องประตูกล (Trapped)',      icon: '⚠️', category: 'danger',  desc: 'กับดักนับถอยหลัง! ต้องหนีในเทิร์นหน้า ไม่เช่นนั้นจะตาย', restriction: '⚠️ ต้องออกจากห้องในเทิร์นถัดไปไม่งั้นตาย' },
        acid:        { name: 'บ่อกรดมรณะ (Acid Bath)',     icon: '☣️', category: 'danger',  desc: 'กรดพิษ! หากมีคนที่สองเข้ามา คนนั้นจะละลายหายไป', restriction: '☣️ หากมี 2 คน คนที่สองจะตาย' },
        flooded:     { name: 'ห้องน้ำท่วม (Flooded)',      icon: '🌊', category: 'danger',  desc: 'ห้องน้ำท่วม หากยังอยู่ที่นี่เมื่อจบตาจะจมน้ำตาย', restriction: '🌊 จมน้ำตายหากอยู่ครบ 2 เทิร์น' },
        twins:       { name: 'ห้องภาพลวงฝาแฝด (Twin)',    icon: '👥', category: 'warning', desc: 'พาคุณไปโผล่ที่ห้องแฝดอีกห้องทันที', restriction: '👥 วาร์ปไปห้องแฝดอีกห้อง' },
        illusion:    { name: 'ห้องภาพหลอน (Illusion)',    icon: '✨', category: 'warning', desc: 'เปลี่ยนตำแหน่งไปเรื่อยๆ จนกว่าจะถูกเปิด', restriction: '✨ สลับตำแหน่งเมื่อผู้เล่นเดินออก' },
        hidden:      { name: 'ห้องปริศนา',                 icon: '❓', category: 'hidden',  desc: 'ยังไม่ได้สำรวจ ใช้คำสั่งแอบดูเพื่อเปิดเผยความลับ', restriction: '❓ ยังไม่ทราบอันตราย' }
    }
};

function t(key) {
    return I18N[currentLang][key] || I18N['en'][key] || key;
}

function getRoomInfo(type) {
    const dict = ROOM_TYPES_DATA[currentLang] || ROOM_TYPES_DATA['en'];
    return dict[type] || dict.empty;
}

function setLanguage(lang) {
    currentLang = lang;
    try { localStorage.setItem('room25_lang', lang); } catch (e) {}
    applyLocalization();
    const guideModal = document.getElementById('modal-room-guide');
    if (guideModal && !guideModal.classList.contains('hidden')) {
        renderRoomGuideContent();
    }
    if (localClient.gameState) {
        renderGame(localClient.gameState);
    }
}

function applyLocalization() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const selected = btn.dataset.lang === currentLang;
        btn.classList.toggle('active', selected);
        btn.setAttribute('aria-pressed', String(selected));
    });

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (I18N[currentLang][key]) el.textContent = I18N[currentLang][key];
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        if (I18N[currentLang][key]) el.setAttribute('aria-label', I18N[currentLang][key]);
    });

    const nameInput = document.getElementById('player-nickname');
    if (nameInput) {
        nameInput.placeholder = currentLang === 'th' ? 'เช่น นักโทษหมายเลข 1' : 'e.g. Prisoner #25';
    }

    if (typeof sfx !== 'undefined') {
        const soundKey = sfx.muted ? 'soundMuted' : 'soundEnabled';
        document.querySelectorAll('.sound-toggle-btn').forEach(button => {
            button.setAttribute('aria-label', I18N[currentLang][soundKey]);
        });
    }
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Local Client State
let localClient = {
    roomCode: null,
    isHost: false,
    selectedActions: [null, null],
    selectedActionSlot: 0,
    hasSubmittedProgramming: false,
    pendingProgrammingSubmission: false,
    programmingLockCuePlayed: false,
    connectionRecoveryPending: false,
    connectionRecoveryInGame: false,
    connectionWasLost: false,
    selectedSlideType: null,
    selectedSlideIndex: null,
    gameState: null,
    lastRound: 1,
    lastActedPlayer: null,
    lastActionIdx: null,
    prevLogsCount: 0,
    prevAliveCount: null
};

// ==================== INSANE MOMENT FX SYSTEM ====================
function triggerInsaneMoment(type, messageText) {
    const banner = document.getElementById('splash-banner');
    const dangerFlash = document.getElementById('danger-flash');
    const victoryFlash = document.getElementById('victory-flash');
    const boardEl = document.getElementById('game-board');

    if (banner) {
        banner.textContent = messageText;
        banner.className = `splash-banner show ${type}`;
        setTimeout(() => {
            banner.classList.remove('show');
        }, 1800);
    }

    if (type === 'danger') {
        if (dangerFlash) {
            dangerFlash.classList.remove('active');
            void dangerFlash.offsetWidth; // Reflow
            dangerFlash.classList.add('active');
        }
        if (boardEl) {
            boardEl.classList.remove('intense-shake');
            void boardEl.offsetWidth;
            boardEl.classList.add('intense-shake');
            setTimeout(() => boardEl.classList.remove('intense-shake'), 650);
        }
        if (typeof sfx !== 'undefined') sfx.death();
    } else if (type === 'success' || type === 'victory') {
        if (victoryFlash) {
            victoryFlash.classList.remove('active');
            void victoryFlash.offsetWidth;
            victoryFlash.classList.add('active');
        }
        if (typeof sfx !== 'undefined') sfx.room25();
    } else if (type === 'slide') {
        if (boardEl) {
            boardEl.querySelectorAll('.room-tile').forEach(t => {
                t.classList.add('sliding-tile');
                setTimeout(() => t.classList.remove('sliding-tile'), 600);
            });
        }
        if (typeof sfx !== 'undefined') sfx.slide();
    }
}

function triggerTileFlip(row, col) {
    const tile = document.querySelector(`.room-tile[data-row="${row}"][data-col="${col}"]`);
    if (tile) {
        tile.classList.remove('revealing-3d');
        void tile.offsetWidth;
        tile.classList.add('revealing-3d');
        setTimeout(() => tile.classList.remove('revealing-3d'), 600);
    }
}

function triggerSlideAnimation(slideType, index, direction) {
    const dir = parseInt(direction);
    const tiles = document.querySelectorAll(slideType === 'row' 
        ? `.room-tile[data-row="${index}"]` 
        : `.room-tile[data-col="${index}"]`
    );
    const animClass = slideType === 'row' 
        ? (dir > 0 ? 'sliding-row-right' : 'sliding-row-left')
        : (dir > 0 ? 'sliding-col-down' : 'sliding-col-up');

    tiles.forEach(t => {
        t.classList.add(animClass);
        setTimeout(() => t.classList.remove(animClass), 500);
    });
    if (typeof sfx !== 'undefined') sfx.slide();
}

function toggleAudio() {
    if (typeof sfx === 'undefined') return;
    setSoundMuted(!sfx.muted);
    applyLocalization();
}

// ==================== SCREEN NAVIGATION ====================
function showScreen(id) {
    const target = document.getElementById(id);
    if (!target) return;

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

    const floatingSwitcher = document.querySelector('.lang-switcher');
    if (floatingSwitcher) {
        floatingSwitcher.style.display = (id === 'screen-menu' || id === 'screen-lobby') ? 'flex' : 'none';
    }
    document.body.classList.toggle('in-game', id === 'screen-game');
    if (id === 'screen-lobby') document.getElementById('online-feedback').classList.add('hidden');

    if (screenChanged) {
        const heading = [...target.querySelectorAll('h1, h2')].find(element => element.getClientRects().length > 0);
        const focusTarget = heading || target;
        if (!focusTarget.hasAttribute('tabindex')) focusTarget.tabIndex = -1;
        focusTarget.focus({ preventScroll: true });
    }
}

function goBack() {
    if (localClient.gameState) {
        showScreen('screen-game');
    } else if (localClient.roomCode) {
        showScreen('screen-lobby');
    } else {
        showScreen('screen-menu');
    }
}

function openCreateRoomModal() {
    const modal = document.getElementById('modal-create-room');
    clearOnlineFeedback();
    Room25UI.openDialog(modal, {
        initialFocus: () => modal.querySelector('.mode-btn'),
        onEscape: closeModals,
    });
}

function openJoinRoomModal() {
    const modal = document.getElementById('modal-join-room');
    clearOnlineFeedback();
    clearJoinRoomFeedback();
    Room25UI.openDialog(modal, {
        initialFocus: () => modal.querySelector('#join-room-code'),
        onEscape: closeModals,
    });
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => Room25UI.closeDialog(modal));
}

// ==================== ROOM EFFECTS & RESTRICTIONS GUIDE MODAL ====================
let currentRoomGuideTab = 'rules';

function openRoomGuideModal(tab = 'rules') {
    if (typeof sfx !== 'undefined') sfx.click();
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
    if (typeof sfx !== 'undefined') sfx.click();
    Room25UI.closeDialog(document.getElementById('modal-room-guide'));
}

function switchRoomGuideTab(tab) {
    if (typeof sfx !== 'undefined') sfx.click();
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
                        <span class="rg-rule-action-title">${t('rulePushTitle')}</span>
                        <span class="rg-rule-badge-prohibited">${currentLang === 'th' ? 'ห้ามใน Central' : 'Restricted in Central'}</span>
                    </div>
                    <ul class="rg-rule-list">
                        <li><strong>${currentLang === 'th' ? 'ข้อห้ามสำคัญ:' : 'Critical Rule:'}</strong> ${t('rulePush1')}</li>
                        <li>${t('rulePush2')}</li>
                        <li>${t('rulePush3')}</li>
                    </ul>
                </div>

                <div class="rg-rule-card">
                    <div class="rg-rule-card-header">
                        <span class="rg-rule-action-icon">👁</span>
                        <span class="rg-rule-action-title">${t('rulePeekTitle')}</span>
                        <span class="rg-rule-badge-prohibited" style="border-color:#ffd700;color:#ffd700;background:rgba(255,215,0,0.15);">${currentLang === 'th' ? 'ห้ามใน Dark' : 'Restricted in Dark'}</span>
                    </div>
                    <ul class="rg-rule-list">
                        <li><strong>${currentLang === 'th' ? 'ข้อห้ามสำคัญ:' : 'Critical Rule:'}</strong> ${t('rulePeek1')}</li>
                        <li>${t('rulePeek2')}</li>
                        <li>${t('rulePeek3')}</li>
                    </ul>
                </div>

                <div class="rg-rule-card">
                    <div class="rg-rule-card-header">
                        <span class="rg-rule-action-icon">⚙</span>
                        <span class="rg-rule-action-title">${t('ruleControlTitle')}</span>
                    </div>
                    <ul class="rg-rule-list">
                        <li><strong>${currentLang === 'th' ? 'ข้อจำกัดแถว:' : 'Row/Column Lock:'}</strong> ${t('ruleControl1')}</li>
                        <li>${t('ruleControl2')}</li>
                    </ul>
                </div>

                <div class="rg-rule-card">
                    <div class="rg-rule-card-header">
                        <span class="rg-rule-action-icon">🏃</span>
                        <span class="rg-rule-action-title">${t('ruleMoveTitle')}</span>
                    </div>
                    <ul class="rg-rule-list">
                        <li>${t('ruleMove1')}</li>
                        <li>${t('ruleMove2')}</li>
                    </ul>
                </div>
            </div>
        `;
        return;
    }

    // Room Cards Tab
    const dict = ROOM_TYPES_DATA[currentLang] || ROOM_TYPES_DATA['en'];
    const keys = Object.keys(dict).filter(k => k !== 'hidden');

    let filteredKeys = keys;
    if (currentRoomGuideTab === 'safe') {
        filteredKeys = keys.filter(k => dict[k].category === 'safe');
    } else if (currentRoomGuideTab === 'warning') {
        filteredKeys = keys.filter(k => dict[k].category === 'warning');
    } else if (currentRoomGuideTab === 'danger') {
        filteredKeys = keys.filter(k => dict[k].category === 'danger');
    } else if (currentRoomGuideTab === 'special') {
        filteredKeys = keys.filter(k => dict[k].category === 'central' || dict[k].category === 'exit');
    }

    let cardsHtml = '<div class="rg-room-grid">';
    filteredKeys.forEach(k => {
        const item = dict[k];
        const cat = item.category;
        const catLabel = cat.toUpperCase();
        const isProhibited = item.restriction && item.restriction.includes('ห้าม');
        cardsHtml += `
            <div class="rg-room-card cat-${cat}">
                <div class="rg-card-top">
                    <div class="rg-card-identity">
                        <span class="rg-card-icon">${item.icon}</span>
                        <span class="rg-card-name">${item.name}</span>
                    </div>
                    <span class="rg-category-badge ${cat}">${catLabel}</span>
                </div>
                ${item.restriction ? `<div class="rg-restriction-callout ${isProhibited ? 'prohibited' : ''}">⚡ ${item.restriction}</div>` : ''}
                <div class="rg-card-desc">${item.desc}</div>
            </div>
        `;
    });
    cardsHtml += '</div>';

    body.innerHTML = cardsHtml;
}


// Modal selectors
let modalSelectedMode = 'cooperative';
let modalSelectedDiff = 8;

function selectModalMode(btn) {
    document.querySelectorAll('.mode-btn').forEach(button => {
        const selected = button === btn;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    modalSelectedMode = btn.dataset.mode;
}

function selectModalDiff(btn) {
    document.querySelectorAll('.diff-btn').forEach(button => {
        const selected = button === btn;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    modalSelectedDiff = parseInt(btn.dataset.diff, 10);
}

// ==================== SOCKET CONNECTION & LOBBY ====================
const SESSION_KEY = 'room25_session';

function getStoredSession() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data && typeof data === 'object' && data.roomCode && data.sessionToken) {
            return data;
        }
    } catch (e) {}
    return null;
}

function saveSession(data) {
    if (!data || typeof data !== 'object') return;
    const token = data.sessionToken || data.token;
    const code = data.roomCode;
    if (token && code) {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                roomCode: code.toUpperCase().trim(),
                sessionToken: token
            }));
        } catch (e) {}
    }
}

function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
}

socket.on('connect', () => {
    const session = getStoredSession();
    if (session && session.roomCode && session.sessionToken) {
        localClient.connectionRecoveryPending = true;
        localClient.connectionRecoveryInGame = false;
        showLocalizedFeedback('rejoiningRoom');
        const nameInput = document.getElementById('player-nickname');
        const name = (nameInput && nameInput.value) ? nameInput.value : 'Player';
        socket.emit('joinRoom', {
            playerName: name,
            roomCode: session.roomCode,
            sessionToken: session.sessionToken
        });
    }
});

socket.on('disconnect', () => {
    if (!localClient.roomCode && !localClient.gameState && !getStoredSession()) return;
    localClient.connectionWasLost = true;
    localClient.connectionRecoveryPending = false;
    localClient.connectionRecoveryInGame = false;
    showLocalizedFeedback('connectionLost', 'error');
});

socket.on('connect_error', () => {
    if (localClient.connectionWasLost || getStoredSession()) {
        showLocalizedFeedback('reconnecting', 'status');
    }
});

socket.io.on('reconnect_attempt', () => {
    if (localClient.connectionWasLost) showLocalizedFeedback('reconnecting', 'status');
});

socket.io.on('reconnect_failed', () => {
    if (localClient.connectionWasLost) showLocalizedFeedback('reconnectFailed', 'error');
});

function submitCreateRoom() {
    const name = document.getElementById('player-nickname').value || (currentLang === 'th' ? 'ผู้เล่น 1' : 'Runner 1');
    closeModals();
    clearSession();
    socket.emit('createRoom', {
        playerName: name,
        mode: modalSelectedMode,
        difficulty: modalSelectedDiff
    });
}

let onlineFeedbackGeneration = 0;
function showOnlineFeedback(message, kind = 'status') {
    const feedback = document.getElementById('online-feedback');
    if (!feedback) return;
    const generation = ++onlineFeedbackGeneration;
    feedback.textContent = message;
    delete feedback.dataset.i18n;
    feedback.dataset.kind = kind;
    feedback.classList.remove('hidden');
    if (kind !== 'error') {
        window.setTimeout(() => {
            if (generation !== onlineFeedbackGeneration) return;
            feedback.classList.add('hidden');
            delete feedback.dataset.kind;
            delete feedback.dataset.i18n;
        }, 4500);
    }
}

function showLocalizedFeedback(key, kind = 'status') {
    showOnlineFeedback(t(key), kind);
    const feedback = document.getElementById('online-feedback');
    if (feedback) feedback.dataset.i18n = key;
}

function clearOnlineFeedback() {
    const feedback = document.getElementById('online-feedback');
    if (!feedback) return;
    onlineFeedbackGeneration++;
    feedback.classList.add('hidden');
    feedback.textContent = '';
    delete feedback.dataset.kind;
    delete feedback.dataset.i18n;
}

function completeRoomRecovery() {
    if (!localClient.connectionRecoveryPending) return;
    localClient.connectionRecoveryPending = false;
    localClient.connectionRecoveryInGame = false;
    localClient.connectionWasLost = false;
    showLocalizedFeedback('connectionRecovered');
}

function localizeServerError(message) {
    const keys = {
        'Invalid request payload': 'invalidPayload',
        'Invalid room code': 'invalidRoomCode',
        'Room code must be 4 characters': 'roomCodeLength',
        'Room not found!': 'roomNotFound',
        'Session unavailable': 'sessionUnavailable',
        'Game already in progress!': 'gameAlreadyStarted',
        'Room is full (max 8 players)!': 'roomFull',
        'Only the room host can trigger a rematch': 'hostOnlyRematch',
        'Cannot rematch while game is in progress': 'rematchInProgress',
        'Only the room host can start the game': 'hostOnlyStart',
        'Need at least 1 player to test/play!': 'needOnePlayer',
    };
    const key = keys[message];
    return key ? t(key) : message;
}

function setJoinRoomFeedback(key) {
    const feedback = document.getElementById('join-room-feedback');
    const input = document.getElementById('join-room-code');
    feedback.textContent = t(key);
    feedback.dataset.i18n = key;
    feedback.classList.remove('hidden');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'join-room-feedback');
    input.focus();
}

function clearJoinRoomFeedback() {
    const feedback = document.getElementById('join-room-feedback');
    const input = document.getElementById('join-room-code');
    if (!feedback || !input) return;
    feedback.classList.add('hidden');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    delete feedback.dataset.i18n;
}

function submitJoinRoom(overrideCode) {
    const name = document.getElementById('player-nickname').value || (currentLang === 'th' ? 'ผู้เล่น' : 'Runner');
    const input = document.getElementById('join-room-code');
    const code = (overrideCode || input.value || '').toUpperCase().trim();
    if (code.length !== 4) {
        setJoinRoomFeedback('roomCodeLength');
        return;
    }

    const feedback = document.getElementById('join-room-feedback');
    feedback.classList.add('hidden');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    document.getElementById('online-feedback').classList.add('hidden');
    closeModals();
    const session = getStoredSession();
    const tokenToSend = (session && session.roomCode === code) ? session.sessionToken : null;
    socket.emit('joinRoom', {
        playerName: name,
        roomCode: code,
        sessionToken: tokenToSend
    });
}

function requestRematch() {
    if (typeof sfx !== 'undefined') sfx.click();
    socket.emit('rematchRoom');
}

socket.on('rematchTriggered', () => {
    localClient.selectedActions = [null, null];
    localClient.selectedActionSlot = 0;
    localClient.hasSubmittedProgramming = false;
    localClient.pendingProgrammingSubmission = false;
    localClient.programmingLockCuePlayed = false;
    localClient.selectedSlideType = null;
    localClient.selectedSlideIndex = null;
    localClient.gameState = null;
    localClient.lastRound = 1;
    updateLockInStatus('actionsLocked', false);
    const overlay = document.getElementById('gameover-overlay');
    if (overlay) {
        Room25UI.closeDialog(overlay, { restoreFocus: false });
        overlay.classList.remove('active-gameover');
    }
    showScreen('screen-lobby');
});

socket.on('errorMsg', (msg) => {
    if (localClient.connectionRecoveryPending) {
        localClient.connectionRecoveryPending = false;
        localClient.connectionRecoveryInGame = false;
        localClient.connectionWasLost = false;
        clearSession();
        showLocalizedFeedback('sessionUnavailable', 'error');
        return;
    }
    if (msg === 'Room not found!' || msg === 'Game already in progress!') {
        clearSession();
    }
    showOnlineFeedback(localizeServerError(msg), 'error');
});

socket.on('gameAlert', (data) => {
    triggerInsaneMoment(data.type || 'danger', data.message);
    if (typeof sfx !== 'undefined' && sfx.error) sfx.error();
});

socket.on('roomJoined', (data) => {
    localClient.roomCode = data.roomCode;
    localClient.isHost = data.isHost;
    localClient.connectionRecoveryInGame = Boolean(data.inGame);
    saveSession({ sessionToken: data.sessionToken, roomCode: data.roomCode });
    document.getElementById('display-room-code').textContent = data.roomCode;
    document.getElementById('lobby-mode-label').textContent = data.mode.toUpperCase();
    document.getElementById('lobby-rounds-label').textContent = data.difficulty;

    if (!data.isHost) {
        document.getElementById('host-controls').classList.add('hidden');
        document.getElementById('guest-waiting-msg').classList.remove('hidden');
    } else {
        document.getElementById('host-controls').classList.remove('hidden');
        document.getElementById('guest-waiting-msg').classList.add('hidden');
    }

    renderLobbyPlayers(data.players);
    showScreen('screen-lobby');
    if (localClient.connectionRecoveryPending) {
        if (localClient.connectionRecoveryInGame) {
            showLocalizedFeedback('syncingGameState');
        } else {
            completeRoomRecovery();
        }
    }
});

// Auto-join check from URL query parameters (e.g. ?room=ABCD)
window.addEventListener('DOMContentLoaded', () => {
    applyLocalization();
    const joinInput = document.getElementById('join-room-code');
    joinInput.addEventListener('input', () => {
        clearJoinRoomFeedback();
        clearOnlineFeedback();
    });
    createParticles();
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.length === 4) {
        const joinInput = document.getElementById('join-room-code');
        if (joinInput) joinInput.value = roomParam.toUpperCase();
        openJoinRoomModal();
    }
});

socket.on('lobbyUpdate', (data) => {
    renderLobbyPlayers(data.players);
    document.getElementById('connected-count').textContent = data.players.length;
    document.getElementById('lobby-mode-label').textContent = data.mode.toUpperCase();
    document.getElementById('lobby-rounds-label').textContent = data.difficulty;

    const me = socket.id;
    localClient.isHost = (data.hostId === me);
    if (localClient.isHost) {
        document.getElementById('host-controls').classList.remove('hidden');
        document.getElementById('guest-waiting-msg').classList.add('hidden');
    } else {
        document.getElementById('host-controls').classList.add('hidden');
        document.getElementById('guest-waiting-msg').classList.remove('hidden');
    }
});

function renderLobbyPlayers(players) {
    const container = document.getElementById('lobby-player-list');
    container.innerHTML = '';
    players.forEach(p => {
        const div = document.createElement('div');
        div.className = 'lobby-player-badge';
        div.setAttribute('role', 'listitem');

        const dot = document.createElement('div');
        dot.className = 'player-color-dot';
        dot.style.background = p.color;
        dot.style.width = '16px';
        dot.style.height = '16px';
        div.appendChild(dot);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = p.name;
        div.appendChild(nameSpan);

        if (p.socketId === socket.id) {
            const youSmall = document.createElement('small');
            youSmall.style.color = 'var(--accent-blue)';
            youSmall.style.marginLeft = 'auto';
            youSmall.textContent = t('you');
            div.appendChild(youSmall);
        }
        container.appendChild(div);
    });
    document.getElementById('connected-count').textContent = players.length;
}

function requestStartGame() {
    socket.emit('startOnlineGame');
}

async function copyRoomLink() {
    const url = `${window.location.origin}/?room=${localClient.roomCode}`;
    try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        showOnlineFeedback(
            currentLang === 'th'
                ? `คัดลอกลิงก์ชวนเพื่อนแล้ว: ${localClient.roomCode}`
                : `Invite link copied for room ${localClient.roomCode}.`
        );
    } catch (error) {
        showOnlineFeedback(
            currentLang === 'th'
                ? 'คัดลอกอัตโนมัติไม่ได้ ลิงก์เชิญยังคัดลอกได้จากหน้าต่างถัดไป'
                : 'Automatic copy failed. Copy the invite link from the next dialog.',
            'error'
        );
        prompt(currentLang === 'th' ? 'คัดลอกลิงก์เชิญ:' : 'Copy invite link:', url);
    }
}


function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const colors = ['#00d4ff', '#ff3e8e', '#00ff88', '#ffd700'];
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (6 + Math.random() * 8) + 's';
        p.style.animationDelay = Math.random() * 5 + 's';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(p);
    }
}
// ==================== REAL-TIME GAMEPLAY ENGINE ====================
socket.on('gameStarted', () => {
    localClient.selectedActions = [null, null];
    localClient.selectedActionSlot = 0;
    localClient.hasSubmittedProgramming = false;
    localClient.pendingProgrammingSubmission = false;
    localClient.programmingLockCuePlayed = false;
    localClient.lastRound = 1;
    updateLockInStatus('actionsLocked', false);
    showScreen('screen-game');
});

socket.on('gameStateUpdate', (state) => {
    if (localClient.gameState) {
        const prevAlive = localClient.gameState.players.filter(p => p.alive).length;
        const currentAlive = state.players.filter(p => p.alive).length;

        // Player Death Moment!
        if (currentAlive < prevAlive) {
            const deadPlayer = state.players.find(p => !p.alive && localClient.gameState.players.find(oldP => oldP.id === p.id && oldP.alive));
            const deadName = deadPlayer ? deadPlayer.name : 'A PRISONER';
            triggerInsaneMoment('danger', `☠ ${deadName} HAS PERISHED!`);
        }

        // Room 25 Discovered Moment!
        const r25Now = state.board.flat().find(c => c.type === 'room25' && c.revealed);
        const r25Before = localClient.gameState.board.flat().find(c => c.type === 'room25' && c.revealed);
        if (r25Now && !r25Before) {
            triggerInsaneMoment('success', currentLang === 'th' ? '🚪 ค้นพบห้อง 25 ทางออกแล้ว!' : '🚪 ROOM 25 THE EXIT HAS BEEN FOUND!');
        }

        // Detect Newly Revealed Tiles & Trigger 3D Flip
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const isNowRev = state.board[r][c].revealed;
                const wasRev = localClient.gameState.board[r][c].revealed;
                if (isNowRev && !wasRev) {
                    setTimeout(() => triggerTileFlip(r, c), 50);
                    if (typeof sfx !== 'undefined') sfx.reveal();
                }
            }
        }

        // Detect Complex Slide
        const latestLog = state.logs && state.logs[state.logs.length - 1];
        if (latestLog && latestLog.message.includes('Complex shifted') && (!localClient.lastLogMsg || localClient.lastLogMsg !== latestLog.message)) {
            localClient.lastLogMsg = latestLog.message;
            triggerInsaneMoment('slide', currentLang === 'th' ? '⚙ ห้องกำลังเลื่อนสลับตำแหน่ง!' : '⚙ THE COMPLEX IS SHIFTING!');
        }
        // Detect Turn Switch to Me
        const myId = getMyPlayerId(state);
        const wasMyTurn = (localClient.gameState.phase === 'resolution' && localClient.gameState.currentPlayerIndex === myId);
        const isMyTurn = (state.phase === 'resolution' && state.currentPlayerIndex === myId);
        if (!wasMyTurn && isMyTurn) {
            if (typeof sfx !== 'undefined') sfx.turnAlert();
        }
    }

    localClient.gameState = state;
    if (localClient.connectionRecoveryPending && localClient.connectionRecoveryInGame) {
        completeRoomRecovery();
    }
    showScreen('screen-game');
    renderGame(state);
});

function renderGame(state) {
    updateHUD(state);
    renderPlayerList(state);
    renderBoard(state);
    renderActionCenter(state);
    renderLogs(state.logs);

    if (state.gameOver) {
        renderGameOver(state);
    }
}

function updateHUD(state) {
    document.getElementById('round-number').textContent = state.currentRound;
    document.getElementById('max-rounds').textContent = state.maxRounds;
    document.getElementById('phase-name').textContent = state.phase === 'programming' ? t('programmingPhase') : t('resolutionPhase');

    // Find myself
    const me = state.players.find(p => p.id === getMyPlayerId(state));
    const roleBadge = document.getElementById('my-role-display');
    if (me) {
        const roleText = me.role === 'guard' ? t('guard') : t('prisoner');
        roleBadge.textContent = `${t('role')}: ${roleText}`;
        roleBadge.className = `my-role-badge ${me.role}`;
    }

    // Status Message
    const msgEl = document.getElementById('game-message');
    if (state.phase === 'programming') {
        msgEl.textContent = localClient.hasSubmittedProgramming
            ? t('waitingOthers')
            : t('chooseTwoActions');
    } else {
        const activeP = state.players[state.currentPlayerIndex];
        if (activeP) {
            const isMe = (activeP.id === getMyPlayerId(state));
            const curAct = activeP.actions ? activeP.actions[state.currentActionIndex] : null;
            const actName = curAct ? (currentLang === 'th' ? getActionThai(curAct) : curAct.toUpperCase()) : '';
            msgEl.textContent = isMe
                ? `${t('yourTurn')} ${actName}`
                : `${t('turnOf')} ${activeP.name} (${t('round')} ${state.currentActionIndex + 1})`;
        }
    }
}

function getActionThai(act) {
    switch (act) {
        case 'peek': return 'แอบดู (LOOK)';
        case 'move': return 'เคลื่อนที่ (MOVE)';
        case 'push': return 'ผลัก (PUSH)';
        case 'control': return 'เลื่อนห้อง (CONTROL)';
        default: return act;
    }
}

function getMyPlayerId(state) {
    if (state.myPlayerId !== undefined && state.myPlayerId !== null) {
        return state.myPlayerId;
    }
    const self = state.players.find(p => p.isSelf);
    if (self) return self.id;
    const fallback = state.players.find(p => p.actions[0] !== null || p.role !== 'hidden');
    return fallback ? fallback.id : 0;
}

function renderPlayerList(state) {
    const list = document.getElementById('player-list');
    list.innerHTML = '';

    const myId = getMyPlayerId(state);

    state.players.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.setAttribute('role', 'listitem');
        card.style.borderLeftColor = p.color;

        const isCurrent = (state.phase === 'resolution' && idx === state.currentPlayerIndex);
        if (isCurrent) card.classList.add('active-player');
        if (!p.alive) card.classList.add('dead');

        let statusText = p.alive ? `${t('roomIntel')} (${p.row + 1}, ${p.col + 1})` : (currentLang === 'th' ? '☠ ถูกกำจัดแล้ว' : '☠ ELIMINATED');
        if (p.frozen) statusText += currentLang === 'th' ? ' ❄ แข็งชา' : ' ❄ FROZEN';
        if (p.trapped) statusText += currentLang === 'th' ? ' ⚠️ ติดกับดัก' : ' ⚠️ TRAPPED';

        let roleText = '';
        if (p.role && p.role !== 'hidden') {
            const roleName = p.role === 'guard' ? t('guard') : t('prisoner');
            roleText = `<div class="pc-role ${p.role}">${roleName}</div>`;
        }

        // Actions status display
        let actionsHtml = '<div class="pc-actions">';
        if (state.phase === 'programming') {
            actionsHtml += `<span class="pc-action-token">${p.actionsCount}/2 ${currentLang === 'th' ? 'เลือกแล้ว' : 'CHOSEN'}</span>`;
        } else {
            for (let a = 0; a < 2; a++) {
                if (p.actions && p.actions[a]) {
                    const cls = p.hasActed[a] ? 'pc-action-token resolved' : 'pc-action-token';
                    const actName = currentLang === 'th' ? getActionThai(p.actions[a]) : p.actions[a].toUpperCase();
                    actionsHtml += `<span class="${cls}">${actName}</span>`;
                }
            }
        }
        actionsHtml += '</div>';

        card.innerHTML = '';
        const nameDiv = document.createElement('div');
        nameDiv.className = 'pc-name';
        nameDiv.style.color = p.color;
        nameDiv.textContent = p.name;
        if (p.id === myId) {
            const youSpan = document.createElement('small');
            youSpan.textContent = ` (${t('you')})`;
            nameDiv.appendChild(youSpan);
        }
        card.appendChild(nameDiv);

        const statusDiv = document.createElement('div');
        statusDiv.className = 'pc-status';
        statusDiv.textContent = statusText;
        card.appendChild(statusDiv);

        if (p.role && p.role !== 'hidden') {
            const roleDiv = document.createElement('div');
            roleDiv.className = `pc-role ${p.role}`;
            roleDiv.textContent = (p.role === 'guard' ? t('guard') : t('prisoner'));
            card.appendChild(roleDiv);
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.innerHTML = actionsHtml;
        if (actionsDiv.firstElementChild) {
            card.appendChild(actionsDiv.firstElementChild);
        }
        list.appendChild(card);
    });
}

function renderBoard(state) {
    const boardEl = document.getElementById('game-board');
    const activeTile = boardEl.contains(document.activeElement)
        ? document.activeElement.closest('.room-tile')
        : null;
    const activeRow = activeTile ? Number(activeTile.dataset.row) : null;
    const activeCol = activeTile ? Number(activeTile.dataset.col) : null;
    const myId = getMyPlayerId(state);
    const me = state.players.find(p => p.id === myId);
    const isMyTurn = state.phase === 'resolution' && state.currentPlayerIndex === myId;
    const waitingInput = state.waitingForInput;
    const focusRow = activeRow ?? (me ? me.row : 2);
    const focusCol = activeCol ?? (me ? me.col : 2);

    boardEl.setAttribute('role', 'group');
    boardEl.setAttribute('aria-label', currentLang === 'th' ? 'กระดานห้อง 5 แถว 5 คอลัมน์' : 'Room board, 5 rows by 5 columns');
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
                event.preventDefault();
                if (next) next.focus();
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                tile.click();
            }
        });
        boardEl.dataset.keyboardNavigation = 'true';
    }

    document.body.classList.remove('is-trapped', 'is-frozen', 'is-drowning');
    if (me && me.alive) {
        if (me.frozen) document.body.classList.add('is-frozen');
        if (me.trapped) document.body.classList.add('is-trapped');
        if (state.board[me.row][me.col].type === 'flooded') document.body.classList.add('is-drowning');
    }

    boardEl.innerHTML = '';
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = state.board[r][c];
            const tile = document.createElement('div');
            tile.className = 'room-tile';
            tile.dataset.row = r;
            tile.dataset.col = c;
            tile.setAttribute('role', 'button');
            tile.tabIndex = (r === focusRow && c === focusCol) ? 0 : -1;

            const svgArt = (typeof Room25Art !== 'undefined') ? Room25Art.getRoomSvg(cell.type) : '';
            const hiddenSvgArt = (typeof Room25Art !== 'undefined') ? Room25Art.getRoomSvg('hidden') : '';

            if (cell.revealed) {
                tile.classList.add('revealed');
                const info = getRoomInfo(cell.type);
                tile.classList.add('room-' + info.category);
                tile.innerHTML = `
                    <div class="room-art-bg" aria-hidden="true">${svgArt}</div>
                    <div class="room-content">
                        <div class="room-name">${info.name}</div>
                    </div>
                `;
            } else if (cell.peekedByMe) {
                const info = getRoomInfo(cell.type);
                tile.classList.add('peeked-by-me', 'room-' + info.category);
                tile.innerHTML = `
                    <div class="room-art-bg" aria-hidden="true" style="opacity:0.8">${svgArt}</div>
                    <div class="room-content" style="opacity:0.95">
                        <div class="room-name">${info.name} ${t('peekedTag')}</div>
                    </div>
                `;
            } else {
                tile.classList.add('face-down');
                tile.innerHTML = `<div class="room-art-bg" aria-hidden="true">${hiddenSvgArt}</div>`;
            }

            if (isMyTurn && waitingInput) {
                const isAdj = me && Math.abs(me.row - r) + Math.abs(me.col - c) === 1;
                if (waitingInput.type === 'move-tile' && isAdj) {
                    tile.classList.add('highlight-move');
                    tile.onclick = () => sendMoveTile(r, c);
                } else if (waitingInput.type === 'peek-tile' && isAdj && !cell.revealed) {
                    tile.classList.add('highlight-peek');
                    tile.onclick = () => sendPeekTile(r, c);
                } else if (waitingInput.type === 'push-dir' && isAdj) {
                    tile.classList.add('highlight-push');
                    tile.onclick = () => sendPushExecute(r, c);
                } else if (waitingInput.type === 'vision-tile' && !cell.revealed) {
                    tile.classList.add('highlight-peek');
                    tile.onclick = () => sendVisionTile(r, c);
                } else if (waitingInput.type === 'moving-tile' && !cell.revealed) {
                    tile.classList.add('highlight-move');
                    tile.onclick = () => sendMovingSwap(r, c);
                }
            }

            const here = state.players.filter(p => p.alive && p.row === r && p.col === c);
            const roomName = cell.revealed || cell.peekedByMe
                ? getRoomInfo(cell.type).name
                : t('unexploredRoom');
            const position = currentLang === 'th'
                ? `แถวที่ ${r + 1} คอลัมน์ที่ ${c + 1}`
                : `row ${r + 1}, column ${c + 1}`;
            const occupants = here.length ? `; ${here.map(p => p.name).join(', ')}` : '';
            tile.setAttribute('aria-label', `${roomName}, ${position}${occupants}`);

            if (here.length > 0) {
                const isCrowded = here.length > 4;
                const activeOccupant = isCrowded
                    ? here.find(p => p.id === state.currentPlayerIndex)
                    : null;
                const visiblePlayers = isCrowded
                    ? [activeOccupant, ...here.filter(p => p !== activeOccupant)].filter(Boolean).slice(0, 3)
                    : here;
                const tokensDiv = document.createElement('div');
                tokensDiv.className = isCrowded ? 'player-tokens player-tokens-crowded' : 'player-tokens';
                tokensDiv.setAttribute('aria-hidden', 'true');
                visiblePlayers.forEach(p => {
                    const token = document.createElement('div');
                    token.className = 'player-token';
                    if (state.phase === 'resolution' && p.id === state.currentPlayerIndex) {
                        token.classList.add('active-token');
                    }
                    token.style.setProperty('--token-color', p.color);
                    const charIndex = p.id % (typeof Room25Art !== 'undefined' ? Room25Art.CHARACTERS.length : 6);
                    const charData = (typeof Room25Art !== 'undefined') ? Room25Art.CHARACTERS[charIndex] : null;
                    if (charData && charData.avatarSvg) {
                        token.innerHTML = `<div class="token-svg-wrap">${charData.avatarSvg}</div>`;
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
                    overflow.textContent = `+${here.length - visiblePlayers.length}`;
                    overflow.setAttribute('aria-hidden', 'true');
                    tokensDiv.appendChild(overflow);
                }
                tile.appendChild(tokensDiv);
            }

            tile.addEventListener('click', () => inspectTile(cell, here));
            tile.onmouseenter = () => inspectTile(cell, here);
            tile.onmouseleave = () => clearTileInfo();
            tile.onfocus = () => inspectTile(cell, here);
            tile.onblur = () => clearTileInfo();
            boardEl.appendChild(tile);
            if (activeTile && r === activeRow && c === activeCol) {
                tile.focus({ preventScroll: true });
            }

        }
    }
}

function inspectTile(cell, playersHere = []) {
    const infoDiv = document.getElementById('room-info');
    if (!cell.revealed && !cell.peekedByMe) {
        infoDiv.innerHTML = `
            <div class="ri-name" style="color:var(--text-dim)">${t('unexploredRoom')}</div>
            <div class="ri-desc">${t('unexploredDesc')}</div>
        `;
        appendRoomOccupants(infoDiv, playersHere);
        return;
    }
    const info = getRoomInfo(cell.type);
    infoDiv.innerHTML = `
        <div class="ri-name">${info.icon} ${info.name}</div>
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
        const label = document.createElement('span');
        label.dataset.i18n = 'viewPlayers';
        label.textContent = t('viewPlayers');
        button.append(label, document.createTextNode(` (${playersHere.length})`));
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
        const label = document.createElement('span');
        label.dataset.i18n = 'playersHere';
        label.textContent = t('playersHere');
        summary.append(label, document.createTextNode(`: ${playersHere.map(player => player.name).join(', ')}`));
        section.appendChild(summary);
    }
    infoDiv.appendChild(section);
}

function clearTileInfo() {
    const infoDiv = document.getElementById('room-info');
    setTimeout(() => {
        if (infoDiv.matches(':hover, :focus-within') || document.querySelector('.room-tile:hover, .room-tile:focus')) {
            return;
        }
        infoDiv.innerHTML = `<p class="room-info-placeholder">${t('hoverIntel')}</p>`;
    }, 400);
}

// ==================== PROGRAMMING PHASE CONTROLS ====================
function selectActionSlot(index) {
    if (localClient.hasSubmittedProgramming || localClient.pendingProgrammingSubmission) return;
    localClient.selectedActionSlot = index;
    document.getElementById('online-feedback').classList.add('hidden');
    if (typeof sfx !== 'undefined') sfx.click();
    updateProgrammingUI();
}

function clearActionSlot(index) {
    if (localClient.hasSubmittedProgramming || localClient.pendingProgrammingSubmission || !localClient.selectedActions[index]) return;
    localClient.selectedActions[index] = null;
    localClient.selectedActionSlot = index;
    if (typeof sfx !== 'undefined') sfx.click();
    updateProgrammingUI();
    document.getElementById(`action-slot-${index + 1}`).focus({ preventScroll: true });
}

function clientSelectAction(actionName) {
    if (localClient.hasSubmittedProgramming || localClient.pendingProgrammingSubmission) return;

    const state = localClient.gameState;
    if (!state || state.phase !== 'programming') return;
    if (state.board) {
        const myId = getMyPlayerId(state);
        const me = state.players ? state.players.find(p => p.id === myId) : null;
        if (me && state.board[me.row]) {
            const curTile = state.board[me.row][me.col];
            if (actionName === 'push' && curTile && curTile.type === 'central') {
                if (typeof sfx !== 'undefined' && sfx.error) sfx.error();
                triggerInsaneMoment('danger', t('cannotPushCentral'));
                return;
            }
            if (actionName === 'peek' && curTile && curTile.type === 'dark') {
                if (typeof sfx !== 'undefined' && sfx.error) sfx.error();
                triggerInsaneMoment('danger', t('cannotPeekDark'));
                return;
            }
        }
    }

    let slotIndex = localClient.selectedActionSlot;
    if (slotIndex === null || slotIndex === undefined) {
        slotIndex = localClient.selectedActions.indexOf(null);
    }
    if (slotIndex < 0) {
        showOnlineFeedback(t('selectSlotToReplace'), 'error');
        return;
    }

    if (typeof sfx !== 'undefined') sfx.click();
    document.getElementById('online-feedback').classList.add('hidden');
    localClient.selectedActions[slotIndex] = actionName;
    localClient.selectedActionSlot = localClient.selectedActions.indexOf(null);
    if (localClient.selectedActionSlot < 0) localClient.selectedActionSlot = null;
    updateProgrammingUI();
}

function updateActionButtonsAvailability() {
    const state = localClient.gameState;
    if (!state || state.phase !== 'programming') return;
    const locked = localClient.hasSubmittedProgramming || localClient.pendingProgrammingSubmission;
    document.querySelectorAll('.action-btn').forEach(button => {
        button.disabled = locked;
    });
    const myId = getMyPlayerId(state);
    const me = state.players ? state.players.find(p => p.id === myId) : null;
    if (!me || !state.board || !state.board[me.row]) return;

    const curTile = state.board[me.row][me.col];
    const inCentral = (curTile && curTile.type === 'central');
    const inDark = (curTile && curTile.type === 'dark');

    const pushBtn = document.getElementById('btn-action-push');
    if (pushBtn) {
        if (inCentral) {
            pushBtn.disabled = true;
            pushBtn.classList.add('disabled-action', 'restricted-central');
            pushBtn.setAttribute('title', t('cannotPushCentral'));
            let badge = pushBtn.querySelector('.action-restriction-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'action-restriction-badge';
                pushBtn.appendChild(badge);
            }
            badge.textContent = t('noPushBadge');
            badge.style.display = 'block';
        } else {
            pushBtn.disabled = locked;
            pushBtn.classList.remove('disabled-action', 'restricted-central');
            pushBtn.removeAttribute('title');
            const badge = pushBtn.querySelector('.action-restriction-badge');
            if (badge) badge.style.display = 'none';
        }
    }

    const peekBtn = document.getElementById('btn-action-peek');
    if (peekBtn) {
        if (inDark) {
            peekBtn.disabled = true;
            peekBtn.classList.add('disabled-action', 'restricted-dark');
            peekBtn.setAttribute('title', t('cannotPeekDark'));
            let badge = peekBtn.querySelector('.action-restriction-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'action-restriction-badge';
                peekBtn.appendChild(badge);
            }
            badge.textContent = t('noPeekBadge');
            badge.style.display = 'block';
        } else {
            peekBtn.disabled = locked;
            peekBtn.classList.remove('disabled-action', 'restricted-dark');
            peekBtn.removeAttribute('title');
            const badge = peekBtn.querySelector('.action-restriction-badge');
            if (badge) badge.style.display = 'none';
        }
    }
}

function updateLockInStatus(key, visible) {
    const status = document.getElementById('lock-in-status');
    status.dataset.i18n = key;
    status.dataset.lockState = key;
    status.textContent = t(key);
    status.classList.toggle('hidden', !visible);
}

function updateProgrammingUI() {
    const slots = [
        document.getElementById('action-slot-1'),
        document.getElementById('action-slot-2'),
    ];
    const btn = document.getElementById('confirm-actions-btn');
    const locked = localClient.hasSubmittedProgramming || localClient.pendingProgrammingSubmission;

    slots.forEach((slot, index) => {
        const action = localClient.selectedActions[index];
        const selected = localClient.selectedActionSlot === index;
        const clearButton = slot.closest('.action-slot-group').querySelector('.slot-clear');
        slot.classList.toggle('selected', selected);
        slot.setAttribute('aria-pressed', String(selected));
        slot.disabled = locked;
        if (action) {
            const name = currentLang === 'th' ? getActionThai(action) : action.toUpperCase();
            slot.querySelector('.slot-value').textContent = name;
            slot.classList.add('filled');
        } else {
            slot.querySelector('.slot-value').textContent = '—';
            slot.classList.remove('filled');
        }
        clearButton.classList.toggle('hidden', !action);
        clearButton.disabled = !action || locked;
        clearButton.setAttribute('aria-label', t(index === 0 ? 'clearAction1' : 'clearAction2'));
    });

    btn.disabled = locked || !(localClient.selectedActions[0] && localClient.selectedActions[1]);
    updateActionButtonsAvailability();
}

function confirmProgrammingSubmission(actions, fromPending = false, refresh = true) {
    if (Array.isArray(actions) && actions.length === 2) {
        localClient.selectedActions = [actions[0], actions[1]];
    }
    const shouldPlayCue = fromPending && !localClient.programmingLockCuePlayed;
    localClient.pendingProgrammingSubmission = false;
    localClient.hasSubmittedProgramming = true;
    localClient.programmingLockCuePlayed = localClient.programmingLockCuePlayed || shouldPlayCue;
    localClient.selectedActionSlot = null;
    updateLockInStatus('actionsLocked', true);
    if (refresh) updateProgrammingUI();
    if (shouldPlayCue && typeof sfx !== 'undefined') sfx.lockIn();
}

function rejectProgrammingSubmission(reasonKey) {
    if (localClient.hasSubmittedProgramming) return;
    localClient.pendingProgrammingSubmission = false;
    updateLockInStatus('actionsLocked', false);
    updateProgrammingUI();
    showOnlineFeedback(t(reasonKey), 'error');
    document.getElementById('confirm-actions-btn').focus({ preventScroll: true });
}

function submitMyProgramming() {
    if (
        localClient.hasSubmittedProgramming ||
        localClient.pendingProgrammingSubmission ||
        !localClient.selectedActions[0] ||
        !localClient.selectedActions[1]
    ) return;

    localClient.pendingProgrammingSubmission = true;
    updateProgrammingUI();
    updateLockInStatus('submittingActions', true);
    document.getElementById('lock-in-status').focus({ preventScroll: true });

    socket.timeout(8000).emit('submitProgramming', {
        actions: localClient.selectedActions
    }, (error, response) => {
        if (!localClient.pendingProgrammingSubmission) return;
        if (error || !response || !response.accepted) {
            rejectProgrammingSubmission(error ? 'programmingTimeout' : (response?.reason || 'invalidProgramming'));
            return;
        }
        confirmProgrammingSubmission(null, true);
    });
}

// ==================== RESOLUTION CONTROLS ====================
function renderActionCenter(state) {
    const progPanel = document.getElementById('programming-panel');
    const resPanel = document.getElementById('resolution-panel');

    if (state.phase === 'programming') {
        progPanel.classList.remove('hidden');
        resPanel.classList.add('hidden');
        if (state.currentRound !== localClient.lastRound) {
            localClient.lastRound = state.currentRound;
            localClient.hasSubmittedProgramming = false;
            localClient.pendingProgrammingSubmission = false;
            localClient.programmingLockCuePlayed = false;
            localClient.selectedActions = [null, null];
            localClient.selectedActionSlot = 0;
            updateLockInStatus('actionsLocked', false);
        }

        const selfPlayer = state.players.find(player => player.isSelf);
        const submittedActions = selfPlayer && selfPlayer.actions;
        if (Array.isArray(submittedActions) && submittedActions.length === 2 && submittedActions.every(Boolean)) {
            confirmProgrammingSubmission(submittedActions, localClient.pendingProgrammingSubmission, false);
        } else if (!localClient.pendingProgrammingSubmission && !localClient.hasSubmittedProgramming) {
            updateLockInStatus('actionsLocked', false);
        }

        updateProgrammingUI();
        return;
    }

    // Resolution phase
    progPanel.classList.add('hidden');
    resPanel.classList.remove('hidden');

    const myId = getMyPlayerId(state);
    const isMyTurn = (state.currentPlayerIndex === myId);
    const waiting = state.waitingForInput;
    const promptEl = document.getElementById('action-prompt');
    const slideSelector = document.getElementById('slide-selector');
    const pushPicker = document.getElementById('push-target-picker');

    slideSelector.classList.add('hidden');
    pushPicker.classList.add('hidden');

    const activeP = state.players[state.currentPlayerIndex];
    const curAction = activeP ? activeP.actions[state.currentActionIndex] : null;
    document.getElementById('current-action-name').textContent = curAction ? (currentLang === 'th' ? getActionThai(curAction) : curAction.toUpperCase()) : '—';

    if (!isMyTurn) {
        promptEl.textContent = `${currentLang === 'th' ? 'กำลังรอ' : 'Awaiting'} ${activeP ? activeP.name : 'player'} ${currentLang === 'th' ? 'ดำเนินคำสั่ง...' : 'to resolve action...'}`;
        return;
    }

    if (!waiting) {
        promptEl.textContent = currentLang === 'th' ? 'กำลังประมวลผล...' : 'Resolving current step...';
        return;
    }

    if (waiting.type === 'move-tile') {
        promptEl.textContent = t('clickMovePrompt');
    } else if (waiting.type === 'peek-tile') {
        promptEl.textContent = t('clickPeekPrompt');
    } else if (waiting.type === 'push-target') {
        promptEl.textContent = t('pushWhoPrompt');
        pushPicker.classList.remove('hidden');
        renderPushTargets(waiting.targets);
    } else if (waiting.type === 'push-dir') {
        promptEl.textContent = t('clickPushPrompt');
    } else if (waiting.type === 'slide') {
        promptEl.textContent = t('clickControlPrompt');
        slideSelector.classList.remove('hidden');
    } else if (waiting.type === 'vision-tile') {
        promptEl.textContent = t('clickVisionPrompt');
    } else if (waiting.type === 'moving-tile') {
        promptEl.textContent = t('clickMovingPrompt');
    }
}

function sendMoveTile(row, col) {
    if (typeof sfx !== 'undefined') sfx.move();
    socket.emit('playerActionInput', { type: 'move', row, col });
}

function sendPeekTile(row, col) {
    if (typeof sfx !== 'undefined') sfx.peek();
    socket.emit('playerActionInput', { type: 'peek', row, col });
}

function sendVisionTile(row, col) {
    if (typeof sfx !== 'undefined') sfx.peek();
    socket.emit('playerActionInput', { type: 'visionPeek', row, col });
}
function sendMovingSwap(row, col) {
    if (typeof sfx !== 'undefined') sfx.move();
    socket.emit('playerActionInput', { type: 'movingSwap', row, col });
}


function renderPushTargets(targets) {
    const container = document.getElementById('push-target-list');
    container.innerHTML = '';
    targets.forEach(tItem => {
        const btn = document.createElement('button');
        btn.className = 'target-btn';
        const dot = document.createElement('span');
        dot.className = 'player-color-dot';
        dot.style.background = tItem.color;
        btn.appendChild(dot);
        btn.appendChild(document.createTextNode(' ' + tItem.name));
        btn.onclick = () => {
            if (typeof sfx !== 'undefined') sfx.click();
            socket.emit('playerActionInput', { type: 'pushSelectTarget', targetId: tItem.id });
        };
        container.appendChild(btn);
    });
}

function sendPushExecute(row, col) {
    if (typeof sfx !== 'undefined') sfx.push();
    socket.emit('playerActionInput', { type: 'pushExecute', row, col });
}

// Slide Handling
function clientChooseSlide(type, index) {
    if (typeof sfx !== 'undefined') sfx.click();
    localClient.selectedSlideType = type;
    localClient.selectedSlideIndex = index;

    document.querySelectorAll('.slide-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    const dirDiv = document.getElementById('slide-direction');
    dirDiv.classList.remove('hidden');

    const b1 = document.getElementById('slide-dir-1');
    const b2 = document.getElementById('slide-dir-2');
    if (type === 'row') {
        b1.textContent = t('left');
        b2.textContent = t('right');
    } else {
        b1.textContent = t('up');
        b2.textContent = t('down');
    }
}

function clientConfirmSlide(direction) {
    if (localClient.selectedSlideType === null) return;
    socket.emit('playerActionInput', {
        type: 'slide',
        slideType: localClient.selectedSlideType,
        index: localClient.selectedSlideIndex,
        direction: direction
    });
    document.getElementById('slide-selector').classList.add('hidden');
}

// Logs & Overlays
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

function renderLogs(logs) {
    const container = document.getElementById('log-entries');
    container.innerHTML = '';
    logs.forEach(log => {
        const d = document.createElement('div');
        d.className = `log-entry log-${log.type}`;
        d.textContent = `[R${log.round}] ${log.message}`;
        container.appendChild(d);
    });
    container.scrollTop = container.scrollHeight;
}

function renderGameOver(state) {
    const modal = document.getElementById('gameover-overlay');
    const res = state.gameResult;
    if (!modal.classList.contains('active-gameover')) {
        modal.classList.add('active-gameover');
        Room25UI.openDialog(modal, {
            initialFocus: () => modal.querySelector('button'),
            focusFallback: () => document.querySelector('#screen-game'),
        });
        if (res.victory) {
            triggerInsaneMoment('victory', currentLang === 'th' ? '🎉 ยินดีด้วย! หนีรอดสู่อิสรภาพสำเร็จ!' : '🎉 VICTORY! ALL SURVIVORS ESCAPED!');
            if (typeof sfx !== 'undefined') sfx.victory();
        } else {
            triggerInsaneMoment('danger', currentLang === 'th' ? '💀 เขาวงกตปิดตายถาวร! เกมโอเวอร์' : '💀 SYSTEM LOCKDOWN! GAME OVER');
            if (typeof sfx !== 'undefined') sfx.death();
        }
    }

    modal.classList.remove('hidden');
    document.getElementById('gameover-title').textContent = res.victory ? t('escaped') : t('gameOver');
    document.getElementById('gameover-title').style.color = res.victory ? 'var(--accent-green)' : 'var(--accent-red)';
    document.getElementById('gameover-text').textContent = res.message;

    const stats = document.getElementById('gameover-stats');
    stats.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${res.survivors.length}</div>
            <div class="stat-label">${t('survivors')}</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${res.casualties.length}</div>
            <div class="stat-label">${t('casualties')}</div>
        </div>
    `;
}
