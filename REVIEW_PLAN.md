# Room 25: Review และแผนพัฒนารอบถัดไป

## 1. สถานะและขอบเขต

โครงการยังไม่ผ่านเกณฑ์ส่งมอบ แม้การทดสอบเดิมจะผ่าน 7/7 รายการในรอบก่อน การ review รอบนี้พบปัญหาที่ทำซ้ำได้ในระบบจริง ทั้งความปลอดภัย การเชื่อมต่อใหม่ การรับคำสั่ง และเงื่อนไขจบเกม

เอกสารนี้เป็นแผนปฏิบัติงานต่อจากขั้น 8 ไม่ใช่รายงานว่าแก้ไขแล้ว รอบนี้แก้เฉพาะเอกสาร ไม่เปลี่ยน product code และไม่ลดขอบเขตฟีเจอร์ที่ระบุใน [RULES.md](RULES.md)

- **P1:** ต้องแก้ก่อนส่งมอบหรือเปิดให้ผู้เล่นภายนอกผ่าน Cloudflare Tunnel
- **P2:** ต้องแก้ก่อนปิดงานด้านกติกาและประสบการณ์ใช้งาน
- **Runtime proof:** รันผ่าน Socket.IO server หรือ Chromium จริงแล้ว
- **Fixture proof:** เรียกโค้ดจริงด้วยสถานะกระดานที่จัดไว้ ไม่ใช่การเล่นครบเกมตามปกติ
- **Static evidence:** พบจากเส้นทางโค้ดหรือสัญญาในเอกสาร ยังไม่ได้รัน scenario นั้น

อย่าใช้คำว่า “เสร็จ 100%” หรือ “กติกาใช้ engine เดียวทั้งหมด” จนผ่าน release gates ด้านล่าง

## 2. Findings ที่ต้องแก้

| ID | ระดับ | ตำแหน่ง | ปัญหาและหลักฐาน | แนวทางแก้ |
| --- | --- | --- | --- | --- |
| R01 | P1 | `server.js:498-502, 525-535, 576-586` | ส่ง `room.players` ซึ่งมี `sessionToken` ของทุกคนให้สมาชิกห้อง Runtime proof: guest อ่าน token ของ host แล้ว socket ที่สามยึดที่นั่ง host และเริ่มเกมได้ | แยก public player projection ออกจากข้อมูล session ส่ง token เฉพาะเจ้าของ สร้าง token ฝั่ง server และตรวจสิทธิ์ host จากเจ้าของปัจจุบันเท่านั้น |
| R02 | P1 | `public/online-game.js:735-745, 951-955`; `server.js:487, 566` | นำ nickname ไปใส่ `innerHTML` โดยไม่ escape Runtime proof: nickname `<img src=x onerror="window.__reviewXss=true">` ทำให้ marker ใน browser ของสมาชิกอีกคนเป็น `true` | ใช้ `textContent` สำหรับชื่อและข้อความจากผู้เล่น แยก DOM ของ artwork ที่เชื่อถือได้ออกจากข้อความ ตรวจความยาว/ชนิดข้อมูลที่ server โดยไม่ใช้ validation แทนการป้องกัน HTML injection |
| R03 | P1 | `server.js:475-487, 508-509, 683-701, 718-728, 787-818` | ไม่มี payload validation ครบขอบเขต Runtime proof: socket ส่ง `createRoom` ด้วย `{}` ทำให้ Node exit 1: `Cannot read properties of undefined (reading 'trim')` | ตรวจ object, string, action array, enum, integer coordinate/index และ direction ก่อนอ่าน field หรือ mutate state ส่ง error ที่กำหนดไว้ ไม่กลืน exception แล้วดำเนินเกมต่อ |
| R04 | P1 | `server.js:718-865` | ตรวจเพียงเจ้าของคิว แต่ไม่จับคู่ input กับ `waitingForInput` และไม่กันคำสั่งซ้ำ Runtime proof: คิว `peek-tile` รับ `visionPeek` ไปมุมกระดาน และรับซ้ำอีกครั้งใน action เดิมได้ | อนุญาตเฉพาะ input ที่ตรง pending action/bonus และผู้เล่นที่มีชีวิต consume pending input เพียงครั้งเดียว ปฏิเสธ replay รวมถึงช่วงรอ animation |
| R05 | P1 | `server.js:593-604, 78-80, 182-184, 712, 736` | สมาชิกคนใดก็ส่ง rematch ระหว่างเกมได้และ callback เก่ายังทำงาน Runtime proof: rematch หลัง peek ก่อน timer เสร็จทำให้ Node exit 1: `Cannot read properties of null (reading 'gameOver')` | Rematch ต้องผ่านสิทธิ์และสถานะ game-over ยกเลิก timer หรือ invalidate ด้วย game identity เดิม ห้าม callback เก่าแตะเกมใหม่หรือ room ที่ถูกลบ |
| R06 | P1 | `public/online-game.js:614-631, 644-653, 685-688`; `server.js:516-547, 879-905` | `saveSession` รับ `sessionToken` แต่ caller ส่ง `token`; ไม่เก็บ room identity และไม่มีการ rejoin หลัง transport reconnect Runtime proof: token ที่เก็บไม่ตรง token ที่ server ออก, reconnect ได้ socket แต่มี `roomJoined` 0 ครั้ง, manual rejoin ได้ `Game already in progress!` | เก็บ server-issued session ที่ผูก room และแท็บ ใช้ schema เดียวกัน rejoin หลัง connect ด้วยข้อมูลเดิม ตรวจการเปลี่ยน host/socket โดยใช้ stable player identity ไม่ใช้ชื่อเป็น identity |
| R07 | P1 | `server.js:21-25`; `public/game-engine.js:176-211`; `game.js:1441-1493`; `RULES.md:117-121` | ชนะจาก Room 25 อยู่ขอบโดยไม่ได้ตรวจว่า CONTROL ดันห้องนั้นออกขอบ Fixture proof: เลื่อนแถวอื่นก็ชนะทั้ง online/offline; online เลื่อนห้องเข้าด้านในก็ชนะ | ตรวจแถว/คอลัมน์และทิศทางก่อน slide เทียบตำแหน่งก่อนเลื่อน เงื่อนไขผู้เล่น และสถานะห้องตาม RULES ไม่แก้ RULES เพื่อรองรับพฤติกรรมผิด |
| R08 | P1 | `public/game-engine.js:89-142, 218-227` | private peek ผูกพิกัดเดิม แต่ slide ไม่ย้ายความรู้ตามห้อง Fixture proof: ห้อง vision ที่เคยส่องย้ายจาก col 0 ไป col 1 กลับเห็นเป็น `hidden` แต่ห้อง mortal ที่เข้ามาแทน col 0 รั่วให้ผู้เล่นเห็น | รักษา identity ของห้องหรือ remap peek coordinates สำหรับทุกการย้ายห้อง ให้ผู้เล่นรู้เฉพาะห้องที่เคยส่องและห้องเปิดแล้ว |
| R09 | P2 | `public/online-game.js:1043-1069` | สร้าง `tokensDiv` แต่ไม่ append ลง tile Browser proof: กระดานออนไลน์มี 25 tiles และผู้เล่นมีชีวิต 2 คน แต่ `.player-token` มี 0; offline มี 2 | ติดตั้ง token layer ใน DOM และตรวจตำแหน่งจริงหลัง move/push/slide/swap ทั้ง desktop/mobile |
| R10 | P1 | `game.js:1307-1350`; `server.js:227-259`; `RULES.md:44-53` | Offline ทำ Action 1 และ 2 ของคนเดียวก่อนเปลี่ยนคน แต่ online ทำ Action 1 ครบทุกคนก่อน Action 2; ไม่ตรง contract เดียวกัน Static evidence | ใช้ลำดับ `A1, B1, A2, B2` และหมุน first-player ตาม RULES ใช้ transition ร่วมกัน ไม่แยก logic ซ้ำ |
| R11 | P1 | `game.js:1313-1314, 1382-1387, 1425-1436`; `RULES.md:106` | Offline ล้าง trapped เมื่อออก แต่ลงโทษด้วยรอบ ไม่ใช่เมื่อจบ action ถัดไป ทำให้ LOOK/CONTROL ในห้องกับดักอยู่รอดนานกว่ากติกา Static evidence | เก็บจุดเริ่ม trap และตรวจหลัง action ถัดไป รวม boundary ข้ามรอบ และกรณีถูกผลัก |
| R12 | P1 | `public/game-engine.js:255-256`; `RULES.md:42, 46-49` | พอเข้า resolution จะส่ง actions ทั้งสองของผู้เล่นอื่นทันที แทนการเปิดเฉพาะ action เมื่อถึงคิว Static evidence | ส่งเฉพาะ action ที่ถูกเปิดแล้วและข้อมูลของตนเอง ห้าม future action รั่วใน snapshot, pending input หรือ log |
| R13 | P2 | `RULES.md:20-30, 69-84`; `index.html:102-104`; `public/index.html:97-99`; `server.js:651-659`; `public/game-engine.js:281-290` | จำนวนรอบใน UI คือ 8/10/7 แต่ RULES คือ 10/8/6; character abilities ยังไม่มีเส้นทาง gameplay; engine แชร์เฉพาะ helper บางส่วน ไม่ใช่ turn/hazard ทั้งหมด Static evidence | ล็อก contract ที่ยังคลุมเครือก่อนลงมือ แล้วนำค่ารอบ, role assignment, abilities, turn และ hazards มาใช้ร่วมกัน |
| R14 | P2 | `tests/rules.test.js:46-92`; `RULES.md:125-137`; `package.json:7` | TEST-03 จำลอง movingSwap โดยคัดลอก implementation ไม่เรียก production path; IDs ใน suite 7 รายการไม่ตรง matrix 9 รายการ และ npm test ระบุไฟล์เดียว Static evidence | แทน copied simulation ด้วย regression ของ production action/transition ให้ matrix ชี้ชื่อ test จริงและเก็บ coverage gaps; เมื่อเพิ่มไฟล์ tests ต้องปรับ discovery ด้วย |
| R15 | P2 | `index.html:476-478`; `game.js` จุดเรียก `sfx` | Offline ไม่โหลด `public/sfx.js` Browser proof: `Room25Engine` มีอยู่ แต่ `typeof sfx` เป็น `undefined` จึงไม่มี SoundFxManager ตามคำกล่าวส่งมอบเดิม | ใช้ audio module เดิมใน offline และปลดล็อก AudioContext จาก user gesture ตรวจ mute/unmute และเสียงของ action/hazard จริง |

ตำแหน่งบรรทัดข้างต้นอ้างอิง baseline รอบ review นี้ เมื่อแก้โค้ดแล้วให้ค้นจากชื่อ symbol และบันทึกตำแหน่งใหม่ในรายงานตรวจรับ

## 3. หลักฐานที่มี และสิ่งที่ยังไม่ผ่าน

### รันแล้วในรอบ review นี้

- Node.js `v22.23.2`; server ทดสอบ bind เฉพาะ `127.0.0.1` และใช้ ephemeral port ไม่รบกวน server เดิม
- Real Socket.IO clients: ยืนยัน R01, R03, R04, R05; crash scenarios ใช้ process แยกและได้ exit code 1
- Chromium สองแท็บ: invite URL และเริ่มเกมสองคนใช้งานได้ แต่ session recovery ไม่ผ่าน R06
- Chromium: ยืนยัน HTML injection R02 และ token rendering R09
- Fixture-assisted production calls: ยืนยัน R07 ทั้ง server และ offline และ R08 ที่ shared engine
- Offline เปิด `index.html` จริง: 25 tiles, 2 player tokens, shared engine โหลดได้ แต่ sound manager ไม่โหลด
- Mobile viewport 390×844: document width 390 ไม่มี horizontal document overflow ในหน้าที่ตรวจ แต่ยังไม่ได้ตรวจครบทุก modal และช่วงเล่น

### ไม่ให้นับเป็นหลักฐานส่งมอบ

- `npm test` ผ่าน 7/7 เป็นผลใน HISTORY รอบก่อน ไม่ได้รันซ้ำใน review นี้ และไม่พิสูจน์ scenarios ข้างต้น
- การจัด fixture แล้วเรียก win helper ไม่ใช่การเล่นครบเกมผ่าน UI
- ยังไม่มีหลักฐานเล่นจนชนะ/แพ้ครบ Cooperative, Suspicion, Competition ทั้ง online/offline
- ยังไม่มีหลักฐาน session recovery ผ่าน reload, host migration และการกลับจาก network offline
- ยังไม่ได้ตรวจ Cloudflare Tunnel, browser engine อื่น, เสียงที่ได้ยินจริง หรือความสนุกกับผู้เล่นจริงในรอบนี้

## 4. ลำดับงานต่อจากขั้น 8

ทำตามลำดับ 9–14 อย่าทำ engine refactor ก้อนใหญ่ก่อนปิดช่องทางยึด session, crash และคำสั่งข้าม action เพิ่ม regression ของ bug ไปพร้อมงานแต่ละขั้น ไม่เลื่อนงานทดสอบทั้งหมดไปท้ายโครงการ

### ขั้น 9 — ปิดช่องโหว่ที่ขอบเขตเครือข่าย

**Findings:** R01, R02, R03, R04, R12

**ไฟล์:** `server.js`, `public/online-game.js`, `public/game-engine.js`, `tests/rules.test.js`; เสนอเพิ่ม `tests/network.test.js` สำหรับ real Socket.IO scenarios

- [ ] สร้าง public lobby projection ที่ไม่มี `sessionToken` และใช้กับ `roomJoined`, `lobbyUpdate`, reconnect และ rematch ทุกจุด
- [ ] ส่ง server-issued token เฉพาะ socket เจ้าของ และไม่ใช้ชื่อผู้เล่นหรือ `players[0]` แทน host authorization
- [ ] ตรวจ payload ก่อน destructuring/อ่านข้อมูลและก่อน mutate state รวม unknown events/actions, array shape, mode/difficulty, numeric bounds และ direction `-1`/`1`
- [ ] จับคู่ `playerActionInput` กับ pending input, actor, game และ action ปัจจุบัน consume เพียงครั้งเดียว ปิดช่อง forged bonus/move/push/slide
- [ ] เปลี่ยน nickname/log/target labels ที่รับข้อมูลผู้เล่นให้เป็น text nodes รวมถึง game-over และ player list
- [ ] แยก programmed actions ออกจาก revealed actions ใน sanitized state
- [ ] เพิ่ม regression ของการขโมย token, HTML injection, malformed payload, wrong input และ replay ด้วย production path

**ตรวจรับ:** guest ไม่เห็น token ของผู้อื่น, token คนอื่น/เก่าทำให้ยึดที่นั่งไม่ได้, HTML nickname แสดงเป็นข้อความ, malformed payload ไม่ทำให้ process จบหรือ state เปลี่ยน, bonus ปลอมถูกปฏิเสธ, duplicate packet ไม่ข้ามคิว และ future actions ไม่รั่ว

### ขั้น 10 — ทำ session recovery และ lifecycle ให้ถูกต้อง

**Findings:** R05, R06

**ไฟล์:** `server.js`, `public/online-game.js`, network regressions จากขั้น 9

- [ ] กำหนด session schema เดียว: room identity, server token และ stable player identity เก็บแยกตามแท็บ/ห้อง และล้างเมื่อเปลี่ยนห้องตาม contract
- [ ] Rejoin หลัง transport connect และ reload โดยส่ง session เดิม เมื่อ server ยืนยันแล้วจึงเปิด input ใหม่
- [ ] อัปเดต host identity และ game player จาก stable identity; ชื่อซ้ำต้องไม่คืนตัวละครผิดคน
- [ ] กำหนดเจ้าของที่นั่งเมื่อ token ถูกเปิดพร้อมกันสอง socket ให้มี controller เดียว
- [ ] ใช้ host ปัจจุบันเป็นผู้สั่ง rematch และอนุญาตหลังเกมจบเท่านั้น หากต้องการ voting ให้แยกเป็นการตัดสินใจ ไม่เพิ่มเองในงานนี้
- [ ] Cancel/invalidate callbacks เมื่อ rematch, เริ่มเกมใหม่ หรือ room ถูกลบ callback ต้องผูก game instance เดิม
- [ ] แสดง connected/recovering/disconnected อย่างตรงกับ server และกำหนดพฤติกรรมของเกมขณะรอผู้เล่นหลุด ไม่เปลี่ยนให้ตายอัตโนมัติโดยไม่มี contract

**ตรวจรับ:** ผู้เล่นสองคนกลับตำแหน่ง/บทบาท/คำสั่งเดิมได้หลัง socket reconnect และ reload; host ย้ายถูกต้อง; expired room แสดง error ชัดเจน; rematch หนึ่งครั้งไม่ crash และ callback เก่าไม่ข้าม action หรือ mutate เกมใหม่

### ขั้น 11 — ล็อกกติกาและแก้ transition ที่ผิด

**Findings:** R07, R08, R10, R11, R13

**ไฟล์:** `RULES.md`, `public/game-engine.js`, `server.js`, `game.js`, `index.html`, `public/index.html`, localization dictionaries

- [ ] คงเงื่อนไข CONTROL ดัน Room 25 ออกขอบตาม RULES ตรวจแกน/ทิศทางก่อนเลื่อน รวม prisoners ที่ยังอยู่นอกห้อง และ mode-specific result
- [ ] รักษาความรู้ private peek ตามห้องเมื่อ slide/swap/illusion shift โดยไม่เผยห้องที่เข้ามาแทนพิกัดเก่า
- [ ] ใช้ turn order Action 1 ครบทุกคน แล้ว Action 2 ครบทุกคน และหมุน first-player ในรอบถัดไป
- [ ] ทำ trapped expiry หลัง action ถัดไป รวมข้ามรอบ, frozen skip, push และกรณีไม่มีผู้เล่นมีชีวิต
- [ ] ใช้ difficulty 10/8/6 ตาม RULES และตรวจ role count/player count ใน Suspicion ทั้งสองโหมด
- [ ] ปรับ README เรื่อง guard win ให้ตรง contract จริง ไม่คงข้อความ “นักโทษตาย 2 คน” โดยไม่มี rule รองรับ
- [ ] ล็อกคำอธิบาย abilities ที่มีคำว่า “หรือ” ใน RULES §4 กับผู้ใช้ก่อน implementation กำหนด input, range, timing, cost, cooldown, target และ interaction กับ hazards ให้ชัดเจน
- [ ] เพิ่ม regression ของ outward/inward/unrelated slide, private knowledge และลำดับ action โดยทดสอบผลต่อผู้เล่น ไม่ทดสอบข้อความ source

**Decision gate:** กฎที่ชัดเจนใน RULES ใช้ตามนั้น ไม่เปลี่ยนตาม test ที่ผิด ส่วนทางเลือก abilities และนโยบายเมื่อผู้เล่นหลุดต้องขอข้อสรุปก่อน implement ไม่ถือว่าฟีเจอร์เหล่านั้นเสร็จแล้วหรือยกเลิกโดยปริยาย

**ตรวจรับ:** online/offline ให้ action order และผลชนะ/แพ้ตรงกัน; CONTROL ที่ไม่ eject Room 25 ไม่ชนะ; ห้องที่ไม่เคยส่องยังเป็น hidden หลัง slide; trap ตัดสินที่ action boundary ไม่ใช่สองรอบ

### ขั้น 12 — รวมกติกาจริงและทำ Ultimate abilities ให้ครบ

**Findings:** R13, R14 และ parity gaps จากขั้น 11

**ไฟล์:** `public/game-engine.js`, `server.js`, `game.js`, `public/online-game.js`, `public/index.html`, `index.html`, tests

- [ ] ย้าย programming, turn transitions, hazards, deaths, bonus actions และ win/loss ไป shared engine หลังมี regression จากขั้น 11
- [ ] คง Express/Socket.IO, DOM, localization, animation และ timers ที่ adapter ไม่เพิ่ม framework หรือ bundler
- [ ] ลบ fallback implementations ที่ซ้ำหลัง caller ทุกจุดใช้ engine เดียว ไม่เหลือ path เดิมที่ทำงานต่างกัน
- [ ] เพิ่ม character identity และเลือกตัวละครใน setup/lobby ตาม contract ที่ล็อกไว้ ไม่ใช้ artwork index แทน gameplay identity
- [ ] Implement Alice, Frank, Kevin, Jennifer, Emmy และ Bruce ตาม ability contract รวม UI และ server validation
- [ ] ให้ production Moving Chamber transition เป็นจุดที่ test เรียกจริง แทน copied simulation ใน TEST-03
- [ ] เสนอเพิ่ม `tests/engine-parity.test.js` เพื่อ replay สถานะ/action sequence เดียวกันผ่าน online/offline adapters แล้วตรวจผลที่ผู้เล่นเห็น
- [ ] ปรับ `package.json` ให้ `npm test` discover ไฟล์ test ทั้งหมดเมื่อมี test files เพิ่ม และอัปเดต matrix ให้ชี้ test จริง ไม่อาศัยเลข TEST ที่ไม่ตรงกัน

**ตรวจรับ:** ไม่มี rule implementation สำรองใน adapters; deterministic scenarios ให้ผลและสถานะตรงกัน; abilities ทั้งหกใช้งานได้จริงและผิดเงื่อนไขแล้วถูกปฏิเสธ; regression จับบั๊กเดิมได้เมื่อใส่พฤติกรรมเดิมกลับ

### ขั้น 13 — แก้ UX, token และเสียง พร้อม responsive proof

**Findings:** R09, R15

**ไฟล์:** `public/online-game.js`, `index.html`, `game.js`, `public/sfx.js`, `public/styles.css`, `styles.css` ตามความจำเป็น

**แผนรายละเอียด:** ใช้ [UX_VISUAL_PLAN.md](UX_VISUAL_PLAN.md) สำหรับงาน UX-00 ถึง UX-07, visual/interaction specification และ device/scenario matrix โดยไม่ใช้แทนการปิด findings ด้านระบบในขั้น 9–12 เอกสารแผนใหม่ยังไม่ใช่หลักฐานว่างานขั้นนี้ผ่านแล้ว

- [ ] แสดง token ของผู้เล่นมีชีวิตบนห้องจริง และปรับตำแหน่งหลัง move/push/control/moving/illusion/twins
- [x] โหลด audio module เดิมใน offline และเริ่ม AudioContext หลัง gesture; mute/unmute ต้องมีผลทั้งสองโหมด
- [ ] ตรวจ ambient status และ animation จาก transition จริง ไม่ตัดสินจากชื่อ CSS class อย่างเดียว
- [ ] ตรวจ desktop 1440×900, tablet 768×1024 และ mobile 390×844: board, player list, action buttons, guide, lobby, reconnect และ game-over
- [ ] ตรวจภาษา TH/EN, guide เปิด/ปิด, focus/keyboard และ target controls หลัง re-render

**ตรวจรับ:** screenshot เห็น token ตามพิกัดและจำนวนผู้เล่น, controls กดได้โดยไม่ถูก overlay บัง, ไม่มี horizontal overflow ที่ซ่อนการควบคุม, เสียง action/hazard และ mute/unmute ทำงานจริง ไม่มี browser error ที่เกี่ยวกับเกม

**หลักฐานล่าสุด (ยังไม่ปิด Phase 13):**
- R09: Online shared tokens, `--token-color` rendering and seeded Cooperative Room 25 slides; Offline Suspicion co-location/PUSH/CONTROL; seeded Offline Moving Chamber, Twins, Illusion and dead-token transitions. Representative Chromium UI paths pass; random-board and physical-device coverage remains open, so keep the checkbox unchecked.
- R09 crowded rooms: Offline 6-player and Online 5-/8-client UI starts verified the 1–4 versus 5+ threshold. At 5+, three visible tokens plus `+N` stay within the tile; the current player remains represented, and the accessible tile name plus “View players” inspector expose the full roster. Online 8-player layout passed at 320×568; Offline 6-player at 390×844 and 320×568; Online 5-player at 1280×800 and 390×844. The roster label also changed live from English to Thai. Random movement with 8 co-located players and physical-device rendering remain open.
- R15: Offline `sfx` loads and unlocks after gesture; mute preference survives reload. Online/offline toggles preserve icon, `aria-pressed`, accessible labels and the mobile Sound text. Seeded Offline UI entered a Vortex and returned Player 1 to Central; the event log and live unmuted audio context confirmed the hazard branch. This covers one cue dispatch only; other action/hazard cues and audible output/quality on physical hardware remain unverified.
- Responsive/dialog proof in `UX_VISUAL_PLAN.md` §6.6: Online + Offline Chromium viewport matrix 320×568 through 1440×900 has no document overflow; compact menus stay in bounds with 44×44 targets; create modal is single-column at 390×844. Online host/guest create/join/start and guest reload recovered room state; TH/EN switch, guide Escape focus restore, offline quit-dialog focus trap/inertness and Rules→Back navigation were exercised. A four-client Online Suspicion time-loss exposed game-over overflow at 390×844 (content 449px, document 420px); responsive game-over width/scroll/buttons now fit at 390×844, 320×568, 568×320 and 1280×720 Online, and 390×844 Offline. Physical devices, zoom, full screen/state matrix, user study and random-board R09 coverage remain open.


### ขั้น 14 — ตรวจรับ end-to-end และส่งมอบตามหลักฐาน

**ไฟล์:** tests, `README.md`, `AGENTS.md`, `RULES.md`, `REVIEW_PLAN.md`; launcher เฉพาะเมื่อพบปัญหาจากการรันจริง

- [ ] รัน test discovery ใหม่ครบทุกไฟล์ และตรวจว่า production bugs ใน R01–R15 มี regression หรือ UI proof ที่เหมาะสม
- [ ] เล่น Cooperative จนชนะด้วย outward CONTROL และจนแพ้ด้วยเวลา/ผู้เล่นตาย ทั้ง online/offline
- [ ] เล่น Suspicion และ Competition จนได้ผลจบเกมตาม contract ทั้งสองโหมด ตรวจ role privacy และผู้ชนะ
- [ ] Online: invite, private look, bonus rooms, disconnect/reconnect/reload, host migration, game-over และ rematch ในห้องเดิม
- [ ] Offline: pass-and-play privacy, turn order, hazards, abilities และการกลับเมนูเริ่มเกมใหม่
- [ ] ทดสอบ LAN และ Cloudflare Tunnel หลังผ่าน security gates แล้วเท่านั้น; ปิด server/tunnel ทดสอบเมื่อจบ
- [ ] ให้ผู้เล่นจริงทดสอบความเข้าใจและความสนุก บันทึก observation แยกจาก automated correctness ไม่อ้างว่าทดสอบแทนผู้เล่นได้
- [x] อัปเดตเอกสารเฉพาะฟีเจอร์ที่ผ่านแล้ว เก็บข้อจำกัดที่ยังอยู่ และปิด finding เมื่อมีหลักฐานเท่านั้น

**ตรวจรับ:** ทุก checklist ผ่านหรือมีข้อยกเว้นที่ผู้ใช้ยอมรับชัดเจน ไม่มี P1 ค้าง ไม่มีฟีเจอร์ชื่อ Ultimate ที่มีเฉพาะภาพหรือคำอธิบาย ไม่มีคำกล่าวว่า full E2E ผ่านจาก fixture-only smoke

**Run record (partial):** `node --check` passed for `game.js`, `public/game-engine.js`, `server.js`, `public/online-game.js`, `public/sfx.js` and `public/ui-accessibility.js`; `npm test` passed 15/15. Normal-play Browser time-limit E2E covered Cooperative in both modes (two players), Suspicion in both modes (four players) and Competition in both modes (two players), all HARD six-round games using LOOK actions only. Suspicion initially hid the Guard win on timeout; shared `getTimeLimitResult()` now reports “Time ran out! The Guards win because no prisoners escaped.” in Offline and Online. Each client’s live Suspicion view showed only its own role. Online game-over responsive overflow was fixed and checked at 390×844, 320×568, 568×320 and 1280×720; Offline at 390×844. The Cooperative guest recovered the finished session after reload, then the host requested a rematch in the same room and launched a new round-1 game with both players present. These are time-loss/role/privacy/layout/rematch proofs, not escape wins, death outcomes, host migration, complete hazard/ability coverage, physical-device checks or user studies.
**Additional seeded win UI evidence:** Offline two-player Cooperative used Park–Miller seed 743 before Start, then completed the three-round outward-CONTROL escape entirely through UI actions. Both players privately LOOKed at Room 25, entered it, and selected row 1 / LEFT; the first slide carried Room 25 and both tokens to the edge, and the second ejected it. Game-over UI reported **ESCAPED!**, 2 survivors, 0 casualties. This establishes only the seeded Offline sequence; the seeded Online loopback win is recorded below; random-board wins remain untested. No gameplay state was manually changed.
**Additional seeded death UI evidence:** Offline two-player Cooperative used Park–Miller seed 3 before Start, which produced two Mortal Chambers adjacent to Central. The UI moved Player 1 into the left Mortal Chamber and Player 2 into the right; both died during round 1. Game-over UI reported 0 survivors and 2 casualties. This establishes only the seeded Offline loss path; Online and random-board results remain untested. No gameplay state was manually changed.
**Additional seeded Competition win UI evidence:** Offline two-player Competition used Park–Miller seed 743 before Start. Player 1 privately LOOKed at and entered Room 25 while Player 2 stayed in Central. The first row 1 / LEFT Control moved Room 25 to the edge but did not end the game; the same outward push in round 4 ejected it. The UI reported **ESCAPED!**, “Player 1 escaped through Room 25! Victory!”, 2 survivors and 0 casualties. This covers only the seeded Offline individual-winner path.
**Additional R09 transition UI evidence:** Seeded Offline UI actions verified Moving Chamber occupant travel (seed 1), Twin Room teleport/reveal (seed 3), last-occupant Illusion shift (seed 5), and removal of dead-player board tokens (seed 3). Online seeded Cooperative UI additionally verified both tokens travel with Room 25 through two CONTROL slides. These supplement existing Online shared-token and Offline sliding-room proofs; only representative Chromium paths are covered, not random-board or physical-device rendering.
**Online R07 regression and seeded escape evidence:** Before the fix, two Online Cooperative players stood in Room 25 at row 1 / column 2; Host’s row 1 / LEFT slide only moved Room 25 to the edge, yet the server log immediately recorded ESCAPED. Root cause: `server.executeSlide()` fell through from a non-ejecting `checkEscapeSlide()` result to `checkWinCondition()`, which awarded a win from edge occupancy alone; old TEST-06 encoded that incorrect condition. Replaced that fallback behavior with the stored outward-ejection result and rewrote TEST-06 against two production `server.executeSlide()` calls. The new test failed before the fix at “Reaching the edge alone must not end the game,” passed after it, and `npm test` passed 15/15. In the rerun through both Online UIs, the first slide left the game active; Guest’s second outward slide ejected Room 25 and both clients showed ESCAPED!, 2 survivors and 0 casualties.


## 5. คำสั่งและวิธีตรวจรับ

รันจาก project root ใช้ Node.js และ npm ตามโครงการเดิม ไม่ต้อง build และไม่มี lint script ใน baseline นี้

```powershell
# Runtime ที่ใช้ review นี้
node --version

# ติดตั้ง dependencies จาก lockfile เมื่อจำเป็น
npm ci

# Suite ปัจจุบัน: tests/rules.test.js เท่านั้น
npm test

# Focused case ปัจจุบัน ตัวเลือกต้องอยู่ก่อนชื่อไฟล์
node --test --test-name-pattern="TEST-06" tests/rules.test.js

# เมื่อเพิ่มไฟล์ *.test.js แล้ว ใช้ discovery และแก้ npm test ให้ตรงกัน
node --test

# Server ทดสอบแยกจาก server ที่ใช้งานอยู่
$env:PORT=3100; node server.js
```

Online UI: `http://localhost:3100/` และ invite `http://localhost:3100/?room=CODE` โดยใช้ CODE ที่สร้างจริง Offline UI: เปิด root `index.html`; online server เสิร์ฟ `public/` ไม่ได้เสิร์ฟ offline root

Crash repro ให้ใช้ process/port แยกเสมอ ห้ามยิง malformed payload หรือ rematch-race ไป server ที่มีผู้เล่นจริง ใน DevTools ของ client ทดสอบเท่านั้น:

```javascript
// R03: ก่อนแก้ baseline จะทำให้ server process จบ
socket.emit('createRoom', {});

// R04: ใช้เมื่อ test game รอ peek-tile ที่ Central
// ก่อนแก้ baseline จะยอมเปิดข้อมูลมุมกระดานโดยไม่มี Vision bonus
socket.emit('playerActionInput', { type: 'visionPeek', row: 0, col: 0 });
```

หลังแก้ ต้องเปลี่ยน repro ให้เป็น regression ที่เรียก production path และตรวจ state/packet/result จริง ไม่เพียง assert ว่า function ไม่ throw

## 6. วิธีส่งต่องานให้ผู้พัฒนาหรือ AI

เริ่มจากขั้นแรกที่ยังไม่ผ่าน แล้วทำทีละ slice ไม่เริ่มทุกขั้นพร้อมกัน หากแบ่งงาน parallel ให้แยก file ownership และมี integration owner เดียวสำหรับ shared engine/server

ใช้ข้อความนี้เริ่มงานรอบถัดไป:

> อ่าน AGENTS.md, RULES.md และ REVIEW_PLAN.md ก่อน เริ่มขั้น 9 เฉพาะ R01–R04 และ R12 อ่าน production paths แล้วทำ regression ที่ fail กับ baseline ก่อนแก้ รักษา Node.js/CommonJS/vanilla UI เดิม ห้ามเพิ่ม framework หรือแก้กติกาเพื่อให้ test ผ่าน ตรวจจริงด้วย Socket.IO clients และ browser สำหรับ HTML injection แล้วอัปเดต checklist เฉพาะรายการที่มี proof อย่าเปิด public tunnel ก่อน security gate ผ่าน

แต่ละ slice ให้รายงาน:

1. Finding IDs และพฤติกรรมก่อนแก้ที่ทำซ้ำได้
2. ไฟล์/symbol ที่แก้ และ invariant ที่รักษาไว้
3. คำสั่งตรวจ, exit code, outcome และ browser/packet evidence
4. สถานะ checklist และ coverage gap ที่ยังอยู่

## 7. Release gates

- [ ] **Security:** session ownership, HTML text safety, valid payloads, pending-action authorization และ private information ผ่าน
- [ ] **Lifecycle:** reconnect/reload, host migration, rematch และ stale callbacks ผ่าน
- [ ] **Rules:** Room 25 eject, turn order, traps, difficulty, role policy และ abilities ตรง contract
- [ ] **Parity:** online/offline ใช้กติกาเดียวและ replay ให้ผลตรงกัน
- [ ] **UI/Audio:** token placement, responsive controls, localization และเสียงมีหลักฐานจาก surface จริง
- [ ] **Delivery:** full-game wins/losses, public-tunnel smoke, playtest และเอกสารอัปเดตตามผลจริง

ทุก gate ยังไม่ผ่าน ณ baseline ของเอกสารนี้ อย่าติ๊กจากคำกล่าวในบทสนทนาเดิมหรือจากการอ่านโค้ดเพียงอย่างเดียว
