# Room 25 — แผน UX/UI และ Visual

> **สถานะ: แผนสำหรับลงมือพัฒนา ยังไม่ใช่รายงานว่าแก้ไขหรือผ่านการตรวจรับแล้ว**
> ครอบคลุม Online Multiplayer และ Offline Hotseat โดยคงธีมไซไฟ กระดาน 5×5 และกติกาเดิม รอบจัดทำเอกสารนี้ไม่เปลี่ยนโค้ดเกม

## 1. วิธีใช้และขอบเขต

ใช้เอกสารสามฉบับร่วมกัน:

- [RULES.md](RULES.md): แหล่งอ้างอิงกติกา ข้อมูลลับ และเงื่อนไขชนะ/แพ้
- [REVIEW_PLAN.md](REVIEW_PLAN.md): ปัญหาระบบ ความปลอดภัย และงานแก้กติกา โดยเฉพาะขั้น 9–12; ห้ามใช้แผน UX/UI นี้แทนงานแก้ระบบ
- **เอกสารนี้:** ขยายรายละเอียดงาน UX/Visual ในขั้น 13 และหลักฐานการตรวจรับที่เชื่อมกับขั้น 14

**สมมติฐานในการวางแผน:** ผู้เล่นส่วนใหญ่เป็นกลุ่มเพื่อน มีทั้งผู้เล่นใหม่และผู้เล่นที่รู้กติกา ออนไลน์ใช้หน้าจอส่วนตัว ส่วนออฟไลน์ส่งเครื่องให้กัน ทิศทางที่เลือกคือปรับของเดิมให้ชัดและมีคุณภาพ ไม่รีแบรนด์หรือเปลี่ยนรูปแบบเกม หากการทดสอบกับผู้เล่นจริงหักล้างสมมติฐาน ให้ปรับงานที่เกี่ยวข้องพร้อมบันทึกเหตุผล

### ผลลัพธ์ที่ต้องการ

1. รู้ทันทีว่า **ฉันอยู่ที่ไหน ตอนนี้คิวใคร ต้องทำอะไร และทำอะไรไม่ได้เพราะอะไร**
2. สร้าง/เข้าห้องและเริ่มเล่นได้โดยไม่ต้องให้คนอื่นอธิบายหน้าจอ
3. อ่านกระดาน ห้อง ผู้เล่น และอันตรายได้บนมือถือ โดยไม่มีปุ่มถูกบังหรือตกขอบ
4. การส่อง เดิน ผลัก และเลื่อนห้องรู้สึกแตกต่างกันผ่านภาพและเสียงที่สัมพันธ์กับผลจริง
5. ข้อมูลลับไม่รั่วจาก HUD, animation, สีห้อง, tooltip, log หรือหน้าจอส่งต่อเครื่อง
6. เล่นได้เมื่อปิดเสียง ลดการเคลื่อนไหว ใช้คีย์บอร์ด หรือโหลดฟอนต์จากอินเทอร์เน็ตไม่ได้

### ไม่อยู่ในขอบเขต

- เปลี่ยนกติกา เพิ่มโหมดใหม่ เพิ่มบัญชีผู้ใช้ หรือสร้างระบบจับคู่ผู้เล่น
- ย้ายไป React/Vue, เพิ่ม bundler, WebGL หรือระบบออกแบบที่ต้องมี build step
- ทำภาพสวยเพื่อกลบ token หาย กติกาผิด reconnect ไม่ทำงาน หรือข้อมูลลับรั่ว
- ทำปุ่มสกิลตัวละครที่กดได้เฉพาะภาพ แต่ยังไม่มี gameplay contract/implementation
- เพิ่มไฟล์เสียงภายนอก; ใช้ procedural SVG และ Web Audio ที่มีอยู่เป็นฐาน

## 2. Baseline และปัญหาที่ต้องจัดลำดับ

หลักฐานด้านล่างเป็นการตรวจเฉพาะหน้าที่ระบุ ไม่ใช่การรับรองทั้งเกม:

| ID | สิ่งที่พบ | ประเภทหลักฐาน | ผลต่องานออกแบบ |
| --- | --- | --- | --- |
| B01 | Online หน้าเมนู 390×844: แถบภาษา/เสียงลอยทับส่วนหัว ROOM 25 | Chromium + screenshot รอบจัดทำแผน | แถบตั้งค่าต้องอยู่ใน flow ของหัวหน้าเมนูบนมือถือ |
| B02 | Online ระหว่างวางแผน 390×844: หน้าเว็บกว้าง 390px แต่ปุ่มคู่มือเริ่มที่ x≈392px และปุ่มกติกาเริ่มที่ x≈434px | Chromium + DOM bounding rectangles | การตรวจ document overflow อย่างเดียวไม่พอ ต้องตรวจทุก control และพื้นที่กด |
| B03 | เปิดคู่มือจากเกมบนมือถือ: HUD อยู่เหนือหัวหน้าต่างคู่มือ; semantic snapshot ยังเห็น controls ของเกมด้านหลัง | Chromium + screenshot + accessibility snapshot | แก้ stacking context พร้อม modal focus/inert ไม่ใช่เพิ่ม z-index แบบสุ่ม |
| B04 | Desktop 1440×900: กระดานวัดได้ 550×550px มีพื้นที่ว่างกลางมาก; mobile อ่านชื่อห้องเต็มจาก tile ได้ยาก | Chromium + screenshot | ให้กระดานเป็นจุดเด่น และมี room details ที่อ่านได้โดยไม่ต้อง hover |
| B05 | Root UI ใช้ข้อความอังกฤษเป็นหลัก; Online มี `I18N`, `data-i18n` และ `setLanguage()` | Static: `index.html`, `public/online-game.js` | จัดภาษา TH/EN ให้ครบทั้งข้อความคงที่และข้อความ runtime โดยไม่สร้าง dictionary ซ้ำอีกแบบ |
| B06 | Stylesheet สองไฟล์มี SHA-256 ตรงกัน แต่มี responsive overrides หลายชั้นและ `!important`; ชื่อห้องบนมือถือถูกกำหนดถึง `0.5rem` | Checksum; `public/styles.css:2324–2403, 2811–2899` | ใช้ชุด breakpoint และ typography ที่เป็นสัญญาเดียว ไม่เติม patch ท้ายไฟล์เรื่อย ๆ |
| B07 | `toggleAudio()` เปลี่ยนไอคอนเฉพาะ `#sound-btn` ไม่อัปเดต `#hud-sound-btn` | Static: `public/online-game.js:416–425`; `public/index.html:211` | สถานะ mute ต้องตรงกันทุกจุด และมีข้อความ/accessible name ไม่อาศัยไอคอนอย่างเดียว |
| B08 | Offline `renderPlayerList()` แสดงบทบาทใน Suspicion และชื่อ programmed actions ในรายการรวม | Static: `game.js:341–385` | ต้องมี public/private presentation แยกกันจริงก่อนพัฒนา handoff และ VFX ข้อมูลลับ |
| B09 | ไม่พบ `prefers-reduced-motion` หรือ `:focus-visible` ใน stylesheet; พบ focus styling ของ input | Static search: `styles.css`, `public/styles.css` | เพิ่ม keyboard focus และ reduced-motion เป็นพื้นฐาน ไม่เลื่อนไป polish ท้ายงาน |
| B10 | Token ออนไลน์, audio offline, session recovery, turn order, private knowledge หลัง slide และ future actions มี findings เดิม | หลักฐานจาก [REVIEW_PLAN.md](REVIEW_PLAN.md): R06, R08–R10, R12, R15 | ใช้ findings เดิมเป็น dependency; รอบนี้ไม่ได้รันซ้ำเพื่อปิด findings เหล่านั้น |

**Smoke ที่ทำแล้ว:** เปิดเมนู Online, สร้างและเข้าห้องด้วย Chromium สองแท็บ, เริ่มเกมสองคน, ตรวจ programming desktop/mobile, เปิดคู่มือมือถือ, เปิด root `index.html` และเริ่ม hotseat สองคนทั้ง desktop/mobile ไม่พบ browser errors ในช่วงที่ตรวจ ปิดแท็บและ server ทดสอบหลังตรวจแล้ว

**ยังไม่ได้พิสูจน์:** resolution/hazards ทุกชนิด, เกมจนชนะ/แพ้, ผู้เล่นเต็มห้อง, tablet/landscape, keyboard flow ครบวงจร, contrast, reduced-motion, reconnect, เสียงที่ได้ยินจริง, performance บนอุปกรณ์จริง และความสนุกกับผู้เล่นจริง

## 3. หลักออกแบบและข้อตกลงที่ห้ามละเมิด

### 3.1 ทิศทางภาพ: Prison Control Console

คงโลกไซไฟห้องทดลองเดิม แต่ลดความรู้สึกเป็นชุดกล่องเรืองแสงที่มีน้ำหนักเท่ากันทุกชิ้น:

- **กระดานเป็นพระเอก:** ห้อง ตัวผู้เล่น และเป้าหมายที่เลือกได้ต้องเด่นกว่าเส้นตกแต่งและพื้นหลัง
- **Panel เป็นเครื่องมือ:** ใช้พื้นทึบอ่านง่าย เส้นขอบบาง และ spacing สม่ำเสมอ ไม่ใส่ blur/glow ทุก panel
- **Neon มีหน้าที่:** ใช้กับคิวของตน จุดที่เลือกได้ อันตราย และ Room 25 ไม่ให้ปุ่มรองแย่งความสนใจ
- **ความตื่นเต้นมาจากเหตุการณ์:** reveal, push, slide และการหนีออก มีจังหวะชัด; หน้ารอและหน้าอ่านคู่มือต้องสงบ
- **รายละเอียดบนมือถือใช้ progressive disclosure:** tile แสดงสัญลักษณ์/สถานะสำคัญ ส่วนชื่อเต็มและกติกาอยู่ใน detail sheet ไม่ย่อข้อความทั้งเกมจนอ่านไม่ได้

### 3.2 กติกาและข้อมูลลับ

- Online renderer รับเฉพาะ sanitized state ห้ามขอ raw `room.game` เพื่อทำ preview หรือเอฟเฟกต์
- ห้องคว่ำที่ไม่เคยส่องต้องไม่ต่างกันตามชนิดห้อง ทั้งภาพ สี ชื่อ DOM, accessible name, tooltip และเสียง
- แยกสถานะห้อง **ยังไม่รู้ / ฉันเคยส่อง / เปิดให้ทุกคน** ด้วยสัญลักษณ์และข้อความ ไม่ใช้สีอย่างเดียว
- แสดงคำสั่งของคนอื่นเฉพาะที่ถูกเปิดตามคิวแล้ว; log และ announcement ต้องใช้ข้อมูลระดับเดียวกัน
- Offline ต้องซ่อน private DOM/content เมื่อเปลี่ยนผู้เล่น ไม่ใช้เพียง opacity, blur หรือ overlay โปร่งใส; background public view ต้องไม่มีข้อมูลลับตั้งแต่ต้น
- Handoff ลดการเห็นโดยไม่ตั้งใจ ไม่ใช่ระบบยืนยันตัวตนหรือป้องกันคนอื่นมองจอ ผู้เล่นยังต้องส่งเครื่องและหันหน้าจอให้เหมาะสม
- แอนิเมชันไม่ตัดสินกติกา ไม่เลื่อนคิวจาก `animationend` และไม่เปลี่ยน authoritative timers เพื่อให้ตรงความยาว CSS
- ปุ่ม disabled ฝั่ง client ไม่ใช่การตรวจสิทธิ์; server ต้องปฏิเสธคำสั่งที่ผิดตามแผนระบบเดิม

## 4. Visual และ Interaction Specification

ค่าต่อไปนี้เป็น **เป้าหมายเริ่มต้นสำหรับ implementation** ไม่ใช่ค่าที่พิสูจน์แล้ว ต้องวัดบนคู่สีและอุปกรณ์จริงก่อนตรวจรับ

### 4.1 Tokens และ Typography

ใช้ CSS custom properties ที่มีอยู่ ขยายเท่าที่จำเป็น ไม่ตั้งชื่อ token ชุดใหม่ที่ซ้ำกับของเดิม:

| หมวด | ข้อตกลง |
| --- | --- |
| พื้นผิว | คงฐาน `--bg-dark`, `--bg-panel`, `--bg-card`; เพิ่มความต่างของระดับ panel ด้วยค่าพื้น/เส้นขอบ ไม่ใช้ blur เป็นเงื่อนไขให้อ่านได้ |
| สีเชิงความหมาย | Safe = `--room-safe`; Warning = `--room-warning`; Danger = `--room-danger`; Exit = `--room-exit`; Central = `--room-central` ทั้งกระดาน คู่มือ และ badges ต้องใช้ความหมายเดียวกัน |
| สีผู้เล่น | ใช้ `PLAYER_COLORS` เดิม พร้อมหมายเลข/ชื่อย่อ/สัญลักษณ์; สีผู้เล่นต้องไม่ถูกตีความเป็นชนิดห้องหรือบทบาทลับ |
| ตัวอักษร | Orbitron สำหรับชื่อเกม/หัวข้อสั้น; Kanit สำหรับไทย; Rajdhani ใช้เฉพาะตำแหน่งอังกฤษที่อ่านได้; monospace สำหรับรหัสห้อง/ตัวเลข ไม่ใช้กับคำอธิบายยาว |
| ขนาดเริ่มต้น | เนื้อหา/ปุ่มหลัก 16px, ข้อความประกอบ 14px, heading panel 18–20px; metadata สั้นไม่ต่ำกว่า 12px หากไม่พอให้ย้ายข้อมูลไป details ไม่ย่อทั้งหน้า |
| ภาษาไทย | line-height เริ่มต้น 1.5–1.7, ไม่เพิ่ม letter-spacing ให้ย่อหน้า/ปุ่มไทย; ตรวจวรรณยุกต์และชื่อยาวไม่ถูกตัด |
| Spacing | ใช้สเกล 4, 8, 12, 16, 24, 32px; panel padding 16–24px desktop และ 12–16px mobile |
| รูปทรง | Room tile radius 8px, control 6–8px, modal 12px; player token เป็นวงกลม ไม่ใช้ radius ใหญ่จนทุกอย่างเหมือนกัน |
| Contrast | ข้อความปกติอย่างน้อย 4.5:1; ข้อความใหญ่ตาม WCAG อย่างน้อย 3:1; controls/focus/สัญลักษณ์สำคัญอย่างน้อย 3:1 ไม่ใช้ glow เป็นหลักฐาน contrast |

ฟอนต์ต้องมี system fallback ที่อ่านไทยได้ ทดสอบทั้งการโหลดปกติและปิด network สำหรับ external fonts โหมด offline ต้องเปิดจาก `file://` ได้เหมือนเดิม ถ้าจำเป็นต้อง bundle font ให้ตรวจ license ก่อน ไม่ถือว่าฟอนต์ออนไลน์โหลดได้เสมอ

### 4.2 ข้อตกลงของ Controls

ทุก interactive control ต้องมีสถานะ **default, hover, focus, pressed, selected, disabled, pending และ error/success เมื่อเกี่ยวข้อง**:

- พื้นที่กดอย่างน้อย 44×44 CSS px สำหรับปุ่มและ tile ที่ใช้งาน; hit area ต้องไม่ทับเป้าหมายข้างเคียง
- ปุ่มไอคอนต้องมี accessible name แปลตามภาษา ไม่พึ่ง `title` หรือ emoji เพื่อสื่อความหมายทั้งหมด
- Disabled ต้องบอกเหตุผลในข้อความที่อ่านได้บน touch/keyboard เช่น “ผลักไม่ได้: อยู่ใน Central”
- แยก selected ออกจาก focused; ผู้ใช้ต้องรู้ว่าคีย์บอร์ดอยู่ที่ไหนและเลือกอะไรไว้แล้ว
- หลัง re-render ให้คืน focus ตาม logical target ไม่ให้กระโดดไป body; ถ้า target หายให้ย้ายไปหัวข้อสถานะ/ตัวเลือกถัดไปที่เหมาะสม
- ข้อความจากผู้เล่นใช้ `textContent` ไม่ประกอบเข้า HTML; SVG จากคลังที่เชื่อถือได้แยกจากข้อความผู้เล่น

### 4.3 Layout และ Responsive

| พื้นที่ | รูปแบบเป้าหมาย |
| --- | --- |
| Desktop กว้างพอ | HUD ด้านบน; รายการผู้เล่นซ้ายประมาณ 216–240px; กระดานกลาง; commands/details ขวาประมาณ 280–320px กระดานโตตามพื้นที่ เริ่มลอง 620–680px ที่ 1440×900 แต่ไม่เบียดปุ่ม |
| Tablet/หน้าต่างแคบ | ลดคอลัมน์ตามพื้นที่จริง; ใช้ player summary และ details แบบเปิดเพิ่ม ไม่คงสามคอลัมน์ด้วยการย่อข้อความ |
| Mobile portrait | HUD สองส่วน: รอบ/คิว/คำแนะนำ และเมนูรอง; player summary สั้นก่อนกระดาน; กระดาน 5×5 เต็มความกว้าง; action slots และ controls ตามมาใน vertical flow เดียว |
| Mobile landscape/ความสูงน้อย | อนุญาต vertical scroll; ลดส่วนตกแต่งก่อนลด hit area ไม่บังคับให้กระดาน+ทุก panel อยู่ในจอเดียว |
| Action confirm | เห็นได้ในบริบทของ action slots; หากใช้ sticky footer ต้องสำรองพื้นที่ใต้ content และ safe-area ไม่บังแถวล่าง/ปุ่มท้าย modal |
| Modal/guide | ใช้ overlay layer เหนือ HUD และ toast; header/close และ footer อยู่ในกรอบจอ ส่วนเนื้อหา scroll ได้โดยไม่ scroll background |
| Menu/lobby | ภาษาและเสียงอยู่ใน header flow บนมือถือ ไม่ลอยทับ logo, title หรือ field |

ใช้ breakpoint ตามพื้นที่ที่องค์ประกอบเริ่มชน ไม่ตามชื่ออุปกรณ์เพียงอย่างเดียว รวมกฎเดิม 1024/900/800/600px ให้มี ownership ชัดเจน ห้ามแก้ด้วย `overflow:hidden` ที่ซ่อนปุ่มหรือเพิ่ม `!important` ท้ายไฟล์อีกชุด คำนึงถึง `dvh`, safe-area, browser toolbar และ keyboard ของมือถือ โดยมี fallback ที่ใช้ได้

### 4.4 Board, Room Art และ Player Tokens

- ใช้ `Room25Art.getRoomSvg()` และคลังห้องเดิม ไม่เปลี่ยน SVG ทั้งชุดโดยไม่มีเหตุผล
- ตรวจ silhouette/สัญลักษณ์ของทุก room type ใน `ROOM_DECK` ที่ขนาดเล็กและแบบ grayscale แยกชนิดห้องได้โดยไม่พึ่งสี
- แยกพื้นที่ art, room label, selection ring, hazard/status และ token layer; ห้าม token กลบชื่อห้องหรือ selection target
- แสดงตำแหน่งตนด้วยวงแหวน/หมายเลขที่ต่างจาก “เป้าหมายที่เลือกได้” และ “คิวปัจจุบัน”
- ห้องที่มีผู้เล่น 1–4 คนใช้ token layout ที่ไม่ชนกัน; มากกว่านั้นใช้ summary จำนวนพร้อมปุ่มดูรายชื่อ ห้ามซ่อนว่ามีผู้เล่นอื่นอยู่ร่วม เพราะมีผลกับ PUSH/Acid
- ทุก tile มีพิกัดแถว/คอลัมน์ที่อ่านผ่าน accessible name ได้; การเลือกเพื่ออ่านรายละเอียดต้องไม่ส่ง MOVE/LOOK โดยไม่ตั้งใจ
- ตรวจ token travel หลัง move, push, control wrap-around, Moving Chamber, Illusion และ Twins รวมถึงผู้เล่นที่ถูกกำจัด

### 4.5 Motion และ Sound Budget

ใช้ transition ที่ยืนยันจาก state/event จริง ไม่เล่นซ้ำเพราะมี render, reload หรือ reconnect snapshot:

| เหตุการณ์ | ภาพเป้าหมาย | เวลาเริ่มต้น | เสียง/ทางเลือกเมื่อปิด motion |
| --- | --- | --- | --- |
| กดปุ่ม/เลือก action | pressed state และช่องคำสั่งเปลี่ยนทันที | 80–140ms | click เบา; selected state ยังชัดเมื่อไม่มีเสียง |
| Lock-in | ช่องคำสั่งเป็น locked; สถานะส่งและยืนยันแยกกัน | 150–220ms | `lockIn` หลังรับผลสำเร็จ ไม่ทำให้เข้าใจว่าส่งผ่านทั้งที่ server ปฏิเสธ |
| Public reveal | flip เฉพาะห้องที่เปิดจริง ไม่ flash ทั้งกระดาน | 350–500ms | reveal; reduced-motion เปลี่ยนหน้าและแสดงข้อความ |
| Private look | เปิดเฉพาะมุมมองผู้ส่องพร้อมป้ายส่วนตัว | 180–300ms | peek เฉพาะเครื่อง/คนที่มีสิทธิ์; ไม่เล่น global reveal |
| Move / Push | token เคลื่อนตามต้นทางและปลายทาง; push มีแรงส่งสั้น | 180–300ms | เสียงแยกสอง action; reduced-motion แสดงตำแหน่งใหม่และข้อความเส้นทาง |
| Control | highlight แถว/คอลัมน์ก่อนยืนยัน และเลื่อนทิศเดียวกันพร้อม token; wrap อ่านออก | 350–500ms | slide ครั้งเดียวต่อ transition; reduced-motion เปลี่ยนตำแหน่งพร้อมลูกศร/ข้อความ |
| Hazard | cue เฉพาะ tile + badge + ข้อความผลและเวลาที่เหลือจากกติกาจริง | 200–400ms | procedural hazard เดิม; ไม่ใช้การสั่นจอหรือไฟกระพริบเป็นเงื่อนไขให้เข้าใจ |
| Win / Lose | หยุด feedback เก่า แล้วแสดงผล ฝ่ายชนะ และเหตุผล | 400–700ms | victory/ผลแพ้; ไม่มีเอฟเฟกต์วนบังปุ่มเล่นต่อ |

- `prefers-reduced-motion: reduce` ต้องปิด shake, flip 3D, zoom เคลื่อนแรง, particles และ flashing overlays โดยคงข้อความ/สถานะครบ
- ไม่สร้าง strobe หรือเอฟเฟกต์กระพริบถี่; ค่าเริ่มต้นหลีกเลี่ยง full-screen flash และ camera shake รุนแรง
- Ambient เบากว่า action feedback; หนึ่งเหตุการณ์มีจุดเด่นหลักเดียว ไม่ให้ banner, flash, shake และเสียงเตือนซ้ำแย่งกัน
- AudioContext เริ่มจาก user gesture; mute และ accessible state ต้องตรงกันทั้งหน้าเมนู/HUD/โหมดออฟไลน์ และจำ preference ได้เมื่อ storage ใช้งานได้
- ไม่มี Web Audio หรือผู้ใช้ mute ต้องเล่นได้ครบ ไม่เปลี่ยนเงื่อนไขเกมหรือซ่อนคำเตือน
- นาฬิกา/จำนวน action ที่เหลือใช้ contract กติกาจริง ไม่เติม timer นับถอยหลังที่ engine ไม่มี

## 5. แผนลงมือทำตามลำดับ

ใช้รหัส UX-00 ถึง UX-07 เป็นหน่วยงาน แต่ละหน่วยส่งมอบได้เมื่อผ่านเกณฑ์ของตัวเอง ผู้พัฒนาบันทึกไฟล์ที่เปลี่ยน scenario และหลักฐานจริงก่อนติ๊ก ห้ามเริ่ม VFX ก้อนใหญ่ก่อน public/private state และ turn transitions เชื่อถือได้

### UX-00 — ล็อก Baseline และ Dependencies

**ความสำคัญ:** ต้องทำก่อนแก้หน้าจอ • **ไฟล์:** `RULES.md`, `REVIEW_PLAN.md`, HTML/JS ของทั้งสองโหมด

- [ ] บันทึกหน้าจอ Menu, Setup/Create/Join, Lobby, Programming, Resolution, Private Peek/Handoff, Guide, Reconnect และ Game-over พร้อม state/viewport/ภาษา
- [ ] ทำบัญชี public/private information ว่าใครเห็น role, room type, programmed action และ log ได้เมื่อใด
- [ ] ยืนยันค่ารอบตาม RULES: ง่าย 10 / ปกติ 8 / ยาก 6 และข้อจำกัดแต่ละโหมด ไม่ปล่อยให้ label กับ server config ต่างกัน
- [ ] ใช้จำนวนผู้เล่นปัจจุบันเป็น test boundary: offline UI 2–6 (`index.html:82–89`), online server รับสูงสุด 8 (`server.js:556–558`) ไม่ลดหรือเพิ่มจำนวนเงียบ ๆ; ถ้าจะเปลี่ยน contract ต้องแก้ทั้งระบบ/เอกสาร
- [ ] ระบุเจ้าของ dependencies จาก REVIEW_PLAN: R09 token/R15 audio สำหรับภาพและเสียง; R06/R05 สำหรับ reconnect/rematch; R08/R10/R12/R13 สำหรับ private knowledge, turn, action reveal และ abilities

**ส่งมอบ:** inventory หน้าจอ/สถานะ + baseline screenshots + รายการ blocker ที่ผูก finding เดิม

**ตรวจรับ:** ไม่มีค่ากติกาที่ผู้ทำ UI ต้องเดา งาน layout/token/typography ทำบน local ได้ระหว่างแก้ระบบ แต่ reconnect/secret animation/abilities ห้ามประกาศเสร็จก่อน dependency ผ่าน และห้ามเปิดทดสอบภายนอกก่อน security gates เดิม

### UX-01 — วางฐาน Visual System และ Accessibility

**ขึ้นกับ:** UX-00 • **ไฟล์:** `public/styles.css` (canonical), `index.html`, `public/index.html`

- [ ] จัด tokens, typography, spacing, semantic colors และ control states ตามข้อ 4 รวมถึงคู่สีที่อ่านได้จริง
- [x] ใช้ `public/styles.css` เป็น canonical stylesheet; root `index.html` โหลดแบบ relative path และ online โหลดผ่าน Express static route เดิม ตรวจแล้วด้วย Chromium บน `file://` และ HTTP loopback
- [x] รวม responsive/visual overrides ที่ขัดกันเป็นส่วนเดียวตาม component; ลบ declarations ที่ถูกแทนแล้ว ไม่เก็บชุดเก่าแล้ว append ชุดใหม่
- [ ] เพิ่ม visible keyboard focus, accessible names/labels, `aria-pressed` สำหรับ toggles และ semantic buttons สำหรับ controls
- [ ] วาง reduced-motion และ overlay layer contract รวม HUD, log, toast, modal, handoff และ game-over; ของตกแต่งไม่ขวาง pointer หรือ focus

**ส่งมอบ:** styles เดียวที่สองโหมดใช้ได้ + ตัวอย่าง component states จาก DOM ของเกมจริง ไม่เพิ่มหน้า showcase ถาวร

**ตรวจรับ:** โหลด online และ `file://` offline ได้; ปิด external fonts แล้วยังอ่านได้; focus ชัด; controls สำคัญผ่าน contrast; reduced-motion ไม่ทำข้อมูลหาย

### UX-02 — แก้ Shell, HUD และ Responsive ก่อนเพิ่มรายละเอียด

**ขึ้นกับ:** UX-01 • **ไฟล์:** canonical CSS, HTML สองโหมด, `showScreen()` ใน controllers ตามจำเป็น

- [ ] ย้ายภาษา/เสียงหน้าเมนูเข้าสู่ header flow บนมือถือ; คงการซ่อน floating switcher ตอนเข้าเกมที่มีอยู่แล้ว
- [ ] จัด HUD แยกข้อมูลหลักจากเมนูรอง โดยมือถือใช้ปุ่มเมนูสำหรับภาษา/คู่มือ/กติกา/ออกเกม ไม่ปล่อยให้ `.hud-right` ต้องเลื่อนเพื่อหาปุ่มที่ตกขอบ
- [x] เปลี่ยนลำดับ mobile ให้เห็น player/turn summary ก่อนกระดาน และเข้าถึง action confirm ด้วย vertical scroll ที่ชัดเจน
- [x] ปรับ desktop ให้กระดานใหญ่ขึ้นอย่างสมดุล โดยไม่บีบข้อความใน panels หรือบังคับความสูง viewport แบบตายตัว
- [ ] แก้ modal stacking, scroll container, safe-area และพื้นที่ใต้ sticky controls รวม mobile keyboard และ browser zoom

**ส่งมอบ:** shell ทุกขนาด + B01/B02/B03 มี before/after evidence

**ตรวจรับ:** control ทุกตัวอยู่ใน viewport หรือเข้าถึงด้วย vertical scroll/เมนูที่เห็นชัด; ไม่ถูก overlay บัง; modal header/close เห็นครบ ไม่มี horizontal document overflow และไม่มี hidden control overflow ภายใน HUD

### UX-03 — ทำ Entry, Lobby และ Hotseat Privacy ให้เข้าใจง่าย

**ขึ้นกับ:** UX-02; session/host contract ที่เกี่ยวข้องต้องผ่านแผนระบบ • **ไฟล์:** HTML/JS สองโหมด, canonical CSS

- [ ] หน้าเข้าเกมมี primary action ชัด: สร้างห้องหรือเข้าร่วมจาก invite; label ชื่อผู้เล่นและรหัสห้องผูก input จริง
- [ ] Create/setup แสดงเป้าหมายโหมด ระยะเกม/จำนวนรอบ และข้อจำกัดจำนวนผู้เล่นที่ตรง contract ไม่บอกเพียงชื่อโหมดอังกฤษ
- [ ] Join รองรับรหัสที่มี/ไม่มีช่องว่างตาม validation contract, invalid/not found/full/in progress และส่งค้างด้วย inline feedback โดยคงชื่อ/รหัสที่กรอก
- [ ] Lobby แสดงรหัสห้อง invite สมาชิกที่เชื่อมต่อ host และเหตุผลที่ยังเริ่มไม่ได้; copy success แสดงหลัง copy สำเร็จ ไม่สั่งเริ่มเกมแทน host
- [ ] Offline ใช้ public player list ที่ไม่แสดง role/future actions; handoff เป็นหน้าทึบ “ส่งเครื่องให้ [ชื่อ]” แล้วกด “พร้อมแล้ว” ก่อนเปิดข้อมูลส่วนตัว และปิดข้อมูลให้หมดก่อนส่งต่อ
- [ ] Private look/role เปิดเฉพาะช่วงของผู้เล่นนั้น มีปุ่มซ่อน/ส่งต่อที่กดและใช้ keyboard ได้ ไม่บังคับกดค้างอย่างเดียว

**ส่งมอบ:** entry → setup/lobby → programming ทั้งสองโหมด พร้อม error และ privacy states

**ตรวจรับ:** ผู้เล่นใหม่เข้าห้องและเริ่มเล่นได้; Online สองแท็บเห็นข้อมูลตามสิทธิ์; Offline ผ่านการส่งต่อจริงอย่างน้อยสองคนโดยไม่มี role/peek/future action ค้างใน public DOM, accessible tree หรือ log

### UX-04 — ทำ Core Gameplay ให้กดถูกและอ่านผลออก

**ขึ้นกับ:** UX-03; token, turn, private projection และ room-identity findings ที่เกี่ยวข้อง • **ไฟล์:** `public/online-game.js`, `game.js`, `public/game-art.js`, HTML/CSS ตามจำเป็น

- [ ] ช่อง Action 1/2 เป็นลำดับที่ชัด เลือกช่องเพื่อแก้/ล้างก่อนล็อกได้ ไม่ให้การเลือกครั้งที่สามแทนช่องสองโดยผู้เล่นไม่รู้ตัว
- [ ] แยก “กำลังส่งคำสั่ง”, “ล็อกแล้ว” และ “รอผู้เล่นอื่น” ตาม state ที่ยืนยันจาก server; error คืน UI ให้แก้ได้โดยไม่รายงานสำเร็จปลอม
- [ ] Resolution แสดงคิวใคร/action slot ไหนและคำสั่งถัดไปของตนที่เกี่ยวข้อง; คนอื่นเห็นเฉพาะ action ที่เปิดแล้ว
- [ ] LOOK/MOVE highlight เป้าหมายที่ถูกต้อง; PUSH เลือกผู้ถูกผลักก่อนทิศ; CONTROL เลือกแถว/คอลัมน์และทิศพร้อม preview ก่อนยืนยัน โดย preview ไม่ mutate engine
- [ ] ติดตั้ง/จัด token layer และ crowded-room presentation; ตรวจการเดินทางกับตำแหน่งจริงหลังทุก room transition
- [ ] เพิ่ม tap/keyboard room details โดยแยกจากการทำ action; board ใช้ arrow navigation และ Enter/Space เลือกเป้าหมายที่มีสิทธิ์ Focus ต้องไม่หายหลัง snapshot ใหม่
- [ ] Status เช่น frozen/trapped/flooded แสดงผลที่จะเกิดและระยะเวลาตาม contract; สกิลตัวละครขึ้น UI เฉพาะเมื่อ implementation จริงพร้อม ไม่ทำปุ่มหลอก

**ส่งมอบ:** loop เลือกสองคำสั่ง → lock → resolution → รอบใหม่ พร้อม board/token/status/detail

**ตรวจรับ:** เล่น LOOK/MOVE/PUSH/CONTROL จริงทั้งสองโหมด; ปฏิเสธ input ผิดคิว/เป้าหมายด้วย feedback; private look ไม่เปลี่ยนหน้าคนอื่น; slot, focus และ tokens ตรง state หลัง re-render ไม่ใช้ screenshot กระดานเริ่มต้นแทน transition proof

### UX-05 — เติม Room Visual, Game Feel และ Procedural Audio

**ขึ้นกับ:** UX-04; R15 audio และ contract events/state ที่ยืนยันได้ • **ไฟล์:** `public/game-art.js`, `public/sfx.js`, controllers และ canonical CSS

- [ ] ปรับ room art/labels/status ตาม layer contract; ตรวจทุกชนิดจาก deck ไม่ตรวจเฉพาะ Central/Room 25
- [ ] ทำ mapping transition → VFX/SFX ตามตารางข้อ 4.5 ใช้ hooks เดิม เช่น `triggerTileFlip()`, `triggerSlideAnimation()` และ `SoundFxManager` ก่อนเพิ่มกลไกใหม่
- [ ] ตัด feedback ซ้ำจากหลาย handlers และไม่ replay VFX/SFX เมื่อรับ snapshot เดิม/reconnect
- [x] โหลด audio module ใน offline จาก `public/sfx.js`; unlock จาก gesture; menu/HUD mute state และ preference ใช้แหล่งเดียวกัน
- [ ] Reduced-motion และ mute คงข้อมูลทั้งหมด; hazard cue ไม่บังเป้าหมายหรือทำสีของข้อมูลลับรั่ว
- [ ] เก็บ performance trace ของ reveal, slide, crowded tokens และ hazard บนมือถืออ้างอิง; ลด shadow/blur/particles ก่อนเพิ่ม canvas/WebGL

**ส่งมอบ:** visual/audio feedback สำหรับ actions, ห้องพิเศษและผลจบเกม พร้อม safe settings

**ตรวจรับ:** เสียงได้ยินและหยุดตาม mute จริงบนอุปกรณ์; ไม่มี VFX/SFX ซ้ำจาก render; reduced-motion เล่นครบ; ตั้งเป้า feedback แสดงในเฟรมแรกหลังรับ input/state และ frame time p95 ไม่เกิน 32ms ระหว่าง transition บนอุปกรณ์อ้างอิง โดยแยก network latency ออกจาก render time หากไม่ผ่านต้องบันทึกและลดงานภาพ ไม่อ้างผลจาก headless เพียงอย่างเดียว

### UX-06 — เก็บ Guide, Error, Reconnect และ Game-over ให้ครบวงจร

**ขึ้นกับ:** UX-04; ต่อ motion จาก UX-05 ได้ภายหลัง; reconnect/rematch ต้องผ่าน R06/R05 • **ไฟล์:** controllers, HTML สองโหมด, canonical CSS; server เฉพาะ contract งานระบบที่เกี่ยวข้อง

- [ ] คู่มือมีหมวด/รายละเอียดห้องและข้อจำกัด พร้อม context ของห้องที่เลือก; รักษาข้อมูลของชนิดห้องในคู่มือแต่ไม่บอกพิกัดห้องคว่ำที่ผู้เล่นยังไม่รู้
- [ ] ทุก dialog มีชื่อ, `aria-modal`, focus trap/restore และ background inert; ปุ่มปิดชัด Escape/backdrop ใช้กับ dialog ที่ยกเลิกได้เท่านั้น Handoff/pending mandatory input ห้ามปิดจนเปิดข้อมูลลับหรือข้าม action
- [ ] แทน blocking `alert()` ด้วย feedback ที่อ่านต่อ/แก้ต่อได้; error ไม่ถูกกลืนหรือหายก่อนอ่าน ใช้ live region เฉพาะข้อความสำคัญ ไม่อ่าน log ทุกบรรทัดซ้ำ
- [ ] Online แยก disconnected, reconnecting, transport connected-but-rejoining, recovered และ session unavailable; ห้ามบอก “กลับเข้าเกมแล้ว” จนได้ room/state ที่ถูกต้อง
- [ ] Game-over บอกฝ่าย/ผู้ชนะ เหตุผล และคำสั่งต่อที่สิทธิ์อนุญาต; reconnect/reload ไม่ replay victory หรือค้าง modal จากเกมก่อน
- [ ] TH/EN ครอบคลุม room details, status, errors, modal, aria labels, logs ที่แสดงได้ และผลเกม ทั้ง online/offline; ใช้ pattern `I18N`/`data-i18n` เดิมร่วมกันเมื่อเหมาะสม ไม่คัดลอก dictionaries ไปแก้แยกสองชุด

**ส่งมอบ:** helper/error/recovery/end-game states พร้อม copy ทั้งสองภาษา

**ตรวจรับ:** เปิด/ปิดคู่มือด้วย touch และ keyboard; เปลี่ยนภาษาขณะ modal เปิดไม่ทำ focus/เนื้อหาพัง; ทดสอบ disconnect/reload/host change/game-over/rematch ผ่าน server จริง; Offline จบเกม→เมนู→เกมใหม่โดยไม่มี secret/audio/effect state เก่าค้าง

### UX-07 — ตรวจรับกับอุปกรณ์และผู้เล่นจริง

**ขึ้นกับ:** UX-01–UX-06 และ release gates ใน REVIEW_PLAN • **ไฟล์:** เอกสารรับผลและ regression tests เฉพาะ consumer-visible bugs ที่พบ

- [ ] รัน matrix ข้อ 6 พร้อมภาพและ trace/log ที่จำเป็น ไม่ใช้ผล unit tests แทน UI proof
- [ ] เล่นจนจบ Cooperative, Suspicion และ Competition ทั้ง online/offline ตาม contract ที่ล็อกแล้ว; ตรวจ state secrecy ระหว่างทาง
- [ ] ให้ผู้เล่นใหม่อย่างน้อย 3 คนและผู้เล่นคุ้นกติกาอย่างน้อย 2 คนทดสอบงานที่ระบุในข้อ 6.3 เก็บ observation ไม่อธิบายวิธีกดให้ก่อน
- [ ] แก้ปัญหาที่ขวางการเล่นก่อน visual polish; ทำ bounded pass: ตรวจหลาย viewport/state เป็นชุด → แก้เป็นชุด → ยืนยันชุดที่เปลี่ยน
- [ ] อัปเดต README และ REVIEW_PLAN เฉพาะสิ่งที่ผ่านจริง เก็บ known limitations และคำสั่งทดสอบที่ใช้ ไม่ติ๊กจากการอ่านโค้ด

**ส่งมอบ:** acceptance record แยก Passed/Failed/Not run พร้อมตำแหน่งหลักฐานและข้อจำกัด

**ตรวจรับ:** ผ่าน release checklist ด้านล่าง ไม่มีข้อขวางการเล่นหรือข้อมูลลับรั่วค้าง ข้อยกเว้นต้องมีขอบเขตและการยอมรับชัดเจน ไม่ใช้คำว่า “เสร็จทั้งหมด” จาก fixture-only proof

## 6. Verification และเกณฑ์ส่งมอบ

### 6.1 Device/Content Matrix

| มิติ | ชุดที่ต้องตรวจ |
| --- | --- |
| Viewport | Desktop 1440×900 และ 1280×720; tablet 768×1024; mobile 390×844 และ 320×568; landscape 844×390; รอบ breakpoint ที่ใช้จริงก่อน/หลัง 1px |
| Browser/device | Chromium/Edge desktop; Chrome Android และ Safari iOS บนอุปกรณ์จริง โดยเฉพาะ gesture/audio/safe-area |
| Content | TH/EN, ชื่อผู้เล่นยาวสุดตามข้อจำกัดจริง, รหัสห้อง, ข้อความ error ยาว, ผู้เล่น 2/6 และ online 8, ทุกคนอยู่ห้องเดียว, มีผู้ถูกกำจัด |
| Preference | Sound on/off, reload แล้ว preference คงอยู่, reduced-motion on/off, โหลด external fonts ไม่ได้, browser zoom 200% |
| Input | Mouse, touch, keyboard-only; Tab/Shift+Tab, arrows บน board, Enter/Space และ Escape ตามสิทธิ์ของ dialog |
| Lifecycle | ครั้งแรก, join error, pending input, lock-in rejection, reconnect/reload, host change, rematch, เริ่มเกมใหม่ใน offline |

Viewport matrix ตรวจทุกหน้า/overlay สำคัญด้วยขนาด content ปกติ ส่วน stress cases ให้ตรวจ desktop และ mobile อย่างน้อยหนึ่งชุด และเส้นทาง keyboard/privacy ต้องตรวจทั้งสองโหมด ไม่ตีความว่าตรวจหน้าเมนูบนมือถือครั้งเดียวเท่ากับผ่าน responsive ทั้งเกม

### 6.2 Scenario Matrix

| ID | Scenario | สิ่งที่ต้องเห็น/ไม่เห็น |
| --- | --- | --- |
| V01 | Menu/Create/Join/Lobby ทั้งสองภาษา | Header ไม่ทับ logo/fields; label ครบ; invalid/full/in-progress อยู่กับฟอร์ม; host/guest เห็นคำสั่งถูกสิทธิ์ |
| V02 | Programming เลือก/เปลี่ยน/ล้าง/ล็อก | ลำดับสองช่องชัด; pending ต่างจาก locked; double click ไม่ทำผลซ้ำ; server rejection ไม่ค้าง success |
| V03 | LOOK ด้วย online สองแท็บ | ผู้ส่องเห็น private tag; อีกคนไม่เห็นชื่อ สี เสียงเฉพาะห้อง หรือรายละเอียดจาก tooltip/log/accessible tree |
| V04 | Offline Suspicion และส่งต่อหลัง private look | public list ไม่มีบทบาท/future actions; ปิด private content ก่อน handoff; กลับจาก guide ไม่เปิดความลับของคนก่อน |
| V05 | MOVE/PUSH และหลาย token ในห้อง | ต้นทาง/ปลายทางและผู้ถูกผลักถูกคน; จำนวน/รายชื่อ occupants ไม่หาย; input และ focus ไม่ถูก token layer บัง |
| V06 | CONTROL และ Moving/Illusion/Twins | ห้องกับ occupants เดินทางตรง state; wrap เข้าใจได้; private knowledge ตามห้อง; center restrictions และ escape direction ถูก contract |
| V07 | Hazard/frozen/trapped/flooded และถูกกำจัด | ผลที่เกิดกับใครและเวลา/action ที่เหลือตรงกติกา; muted/reduced-motion ยังเข้าใจครบ; ผู้ตายไม่มี input ที่ใช้ไม่ได้ |
| V08 | Guide/Peek/Log/Game-over ทุก viewport | Header/close/footer อยู่ในกรอบ; scroll ถูกส่วน; background controls ไม่รับ input เมื่อเป็น modal; focus กลับ logical target |
| V09 | Network offline → reconnect/reload/host change | สถานะไม่กล่าวสำเร็จก่อน rejoin; state ใหม่แทนของเก่า; คำสั่งไม่ซ้ำ; private data ไม่สลับคน |
| V10 | ชนะ/แพ้และ rematch/เกมใหม่ | ผู้ชนะ/เหตุผลตรง engine; ไม่ replay effects; สิทธิ์ถูกต้อง; reset selection/status/modal ครบ |

### 6.3 ทดสอบความเข้าใจและความสนุก

ใช้ build ที่ security/rules gates ผ่านแล้ว ถ้ายังไม่ผ่านให้ทดสอบ local กับผู้พัฒนา ไม่เปิด public tunnel:

- ผู้เล่นใหม่ลองเข้าห้องจาก invite เลือกสองคำสั่ง แก้หนึ่งช่อง และล็อกโดยไม่มีการชี้ปุ่ม เป้าหมายอย่างน้อย 2 ใน 3 คนทำครบโดยไม่ต้องช่วย
- หลังเริ่ม resolution ให้ตอบว่า “คิวใคร”, “ฉันอยู่ห้องไหน”, “ต้องกดอะไรต่อ” และ “ทำไมปุ่มนี้ใช้ไม่ได้” เป้าหมายอย่างน้อย 4 ใน 5 คนตอบถูกใน 5 วินาที
- หลัง slide ให้ระบุตำแหน่งใหม่ของตนและห้องที่สนใจ เป้าหมายอย่างน้อย 4 ใน 5 คนอ่านผลถูกโดยไม่ต้องเปิด log
- ให้กลุ่ม hotseat ส่งเครื่องหลังดูบทบาท/ส่องจริง บันทึกทุกครั้งที่ความลับเห็นโดยไม่ตั้งใจ เกณฑ์ตรวจรับต้องเป็นศูนย์ใน scenarios ที่ทดสอบ
- ให้คะแนนความชัดเจน ความตื่นเต้น และความรบกวนของเอฟเฟกต์ พร้อมถามเหตุการณ์ที่ทำให้สนุก/สับสน ใช้เหตุผลและพฤติกรรมประกอบ ไม่อ้างคะแนนจากกลุ่มเล็กเป็นความพอใจของผู้เล่นทั้งหมด

ตัวเลขข้างต้นเป็นเกณฑ์เป้าหมาย ไม่ใช่ผลวิจัยปัจจุบัน ถ้าไม่ผ่าน ให้แก้ interaction/copy/visual hierarchy ก่อนเพิ่มแอนิเมชัน

### 6.4 คำสั่งและวิธีเก็บหลักฐาน

ใช้วิธีรันเดิม ไม่เพิ่ม toolchain เพื่อทำ UI:

```powershell
npm install
node server.js
# เปิด http://localhost:3000 สำหรับ Online
# เปิด root index.html สำหรับ Offline Hotseat
```

เมื่อ implementation เปลี่ยน behavior/rules ให้รัน `npm test` ตามชุดทดสอบจริงด้วย แต่ผล tests ไม่ยืนยัน layout, focus, privacy presentation, เสียง หรือความสนุก การแก้ UI ต้องเปิด browser กดเส้นทางที่เปลี่ยน และเก็บ screenshot/DOM bounds/accessibility evidence ตาม scenario

Acceptance record อย่างน้อยต้องมี: task/scenario ID, โหมด, browser/device, viewport, ภาษา, จำนวนผู้เล่น, precondition, action, expected/observed, Passed/Failed/Not run และตำแหน่ง screenshot/trace หากใช้จัด fixture ให้ระบุแยกจากการเล่นปกติ ไม่เก็บ session token, raw hidden state หรือข้อมูลส่วนตัวลง public artifacts

### 6.5 Release Checklist

- [ ] ทุกหน้าและสถานะใน inventory มี implementation จริง ไม่มี controls หลอกหรือ placeholder
- [ ] ไม่มี overlap/hidden overflow ที่ขวางการควบคุม ทั้ง HUD, action panel, guide และ keyboard/mobile viewport
- [ ] อ่านตำแหน่ง ผู้เล่น คิว action และข้อห้ามได้โดยไม่อาศัย hover/สี/เสียงอย่างเดียว
- [ ] Online/Offline public/private presentation ผ่าน และ dependencies ใน REVIEW_PLAN ที่เกี่ยวข้องถูกปิดด้วยหลักฐาน
- [ ] TH/EN, focus/keyboard, contrast, reduced-motion, mute และ fallback fonts ผ่านตาม matrix
- [ ] Token/room transitions, hazards, win/lose, reconnect/rematch ผ่านเส้นทางจริง ไม่ใช่แค่ render fixture
- [ ] เสียงและ performance มีหลักฐานจากอุปกรณ์จริง พร้อมระบุรุ่น/ข้อจำกัด
- [ ] ผู้เล่นจริงผ่านเกณฑ์ความเข้าใจ และ observation เรื่องความสนุก/ความรบกวนถูกนำไปแก้หรือบันทึกเหตุผล
- [ ] เอกสารรายงานเฉพาะสิ่งที่ตรวจจริง; ไม่ยกระดับ Not run เป็น Passed

### 6.6 บันทึกหลักฐานรอบ implementation (บางส่วน)

**สภาพแวดล้อม:** Chromium headless; Online ผ่าน loopback และ Offline root assets ผ่าน HTTP loopback. เป็น browser emulation ไม่ใช่หลักฐานจากอุปกรณ์จริงหรือผู้เล่นจริง

| Scenario | สิ่งที่ตรวจและผลที่สังเกต | สถานะ |
| --- | --- | --- |
| UX-02 responsive shell | Chromium emulation, Online + Offline gameplay at 320×568, 390×844, 568×320, 768×1024, 844×390 and 1440×900: document/body widths matched each viewport; board widths 300/370/282/460/343/630px respectively. Compact HUD trigger is 44×44px; menu targets are at least 44×44px; the panel stays inside the viewport and scrolls at 568×320. Online menu exposes TH/EN, sound, log, guide and rules; Offline exposes sound, guide, rules, log and quit. Create-room modal at 390×844 uses single-column mode cards with no document overflow. | Partial — browser viewport emulation only; remaining screens, zoom and physical-device checks stay open. |
| UX-02 game-over layout | Four-player Online Suspicion reached normal HARD time-loss; at 390×844 the original `.gameover-content` measured 449px and document width reached 420px. After responsive width/padding, stacked mobile actions and bounded scroll: Online game-over fit at 390×844, 320×568, 568×320 and 1280×720; Offline Cooperative game-over fit at 390×844. At 568×320, the secondary action remained reachable by scrolling inside the dialog. | Passed for these Chromium game-over viewport states only; physical devices and other screens remain partial. |
| R09 token render/transition (Online + Offline) | Online 2-client UI shows shared tokens in the same room and matching `--token-color` border/glow; seeded Online Cooperative carries both tokens with Room 25 through two CONTROL slides and ejection. Offline Suspicion covers co-location, PUSH to Central and CONTROL room travel. Seeded Offline UI: seed 1 Moving Chamber carries Player 1 to (0,0); seed 3 Twin entry (3,2) teleports to revealed pair (0,1); seed 5 last-occupant Illusion exit leaves hidden Empty at (1,2) and hidden Illusion at (2,1); seed 3 Mortal deaths remove dead-player tokens. | Passed for representative Chromium UI paths; random-board and physical-device rendering remain unverified. |
| R09 crowded co-location | Normal Offline six-player and Online five-/eight-client starts put all players in Central. Before the fix at 390×844, six 22px tokens made a 74px strip in a 71.6px tile and obscured its art. After the fix, 5+ occupants render three tokens plus `+N`; the start-of-game current player remains visible. Offline 6-player bounds fit at 390×844 and 320×568; Online 5-player at 1280×800 and 390×844; Online 8-player at 320×568 had a 52.4px tile and 11.3px token strip entirely inside the tile, with no document horizontal overflow. Tile accessible names listed all occupants. The room inspector’s “View players” button expanded/collapsed the full roster with `aria-expanded`; mouse activation and keyboard Enter were exercised. Its label changed from English to Thai in place when language changed. Four-player Offline retained four individual tokens and no overflow badge. Screenshots were inspected in session temp storage, not retained. | Passed for these Chromium co-location/UI bounds and roster controls; random movement at 8 players and physical-device rendering remain unverified. |
| UX-04 action-target highlights | Offline 2-player live resolution: the four adjacent LOOK/MOVE/PUSH direction targets remain highlighted after board re-render; closing LOOK returns to the next player’s highlighted targets. Seed 1 Moving Chamber bonus presents hidden-tile targets and selecting (0,0) moves/reveals the chamber with its occupant. | Partial — Vision bonus targeting and server-rejection recovery remain untested. |
| R15 audio | Offline loads `sfx`; after gesture, `AudioContext` is `running`; mute preference persists after reload. Online/offline mute toggles update `aria-pressed`, icon and accessible label without removing the mobile Sound label. Seeded Offline UI (Park–Miller 3) moved Player 1 into a revealed Vortex; the event log reported the Vortex return to Central while `sfx.muted` was false, the `vortex` cue method existed and the audio context was running. | Passed for load/unlock/toggle and one seeded Offline hazard dispatch; audible quality on hardware and the wider hazard/action matrix remain unverified. |
| UX-03 offline role/peek privacy | Offline 2-player Suspicion: Space hides/shows only the active player’s role; hidden role content is removed from the DOM, `aria-pressed` updates and focus stays on the toggle. Handoff has zero visible role nodes. Closing a private LOOK clears modal text, description and category class before advancing. | Partial — only this Chromium scenario; other player counts, dialog-return paths and full accessibility-tree/log audit remain untested. |
| UX-06 dialogs and navigation | Online + Offline mobile guide dialogs expose `aria-modal`, close with Escape and restore focus to the opener. Offline guide was verified with inert background and focus trap; offline quit confirmation also inerts HUD/game content and wraps focus with Shift+Tab, then Escape restores the Quit control. Rules opens as a visible sibling screen and Back returns to gameplay. | Partial — other dialogs, full screen-reader audit, host migration and network-offline recovery remain. |
| UX-01 accessibility fallback | emulated `prefers-reduced-motion: reduce` ย่อ animation เป็น 0.01ms/1 iteration โดย board ยังอยู่. บล็อก Google Fonts stylesheet แล้ว menu ยัง render ได้และ document ไม่ overflow; `--text-dim` ปรับเป็น `#a8a8c8` (contrast คำนวณได้ 8.27:1 บน `#0f0f16`, 5.16:1 บน `#0c3f2d`, 7.39:1 บน `#1a1a2e`). | Partial — ไม่ใช่ full color-pair audit |
| Phase 14 Cooperative time-loss | Offline at 390×844 and two-client Online at 1280×800; English, two players, Cooperative HARD (six rounds). Each player programmed two LOOK actions per round and resolved all 24 highlighted targets through the UI. Offline and Online both reached round 6 with 2 survivors and 0 casualties. The online guest reloaded and recovered the finished session. The host then requested a same-room rematch and launched a new round-1 game with both players still present. Game-over labels rendered in EN/TH after the localization fix; locale output was checked through the app localization function. Screenshots were inspected in session temp storage, not retained. | Passed for Cooperative time-loss, finished-session reload and Online same-room rematch; does not cover win/player-death. |
| Phase 14 Suspicion/Competition time-loss | Normal-play Offline and Online UI, English, HARD (six rounds): four-player Suspicion and two-player Competition. Each player programmed two LOOK actions per round; all 48 Suspicion and 24 Competition targets were resolved per game. Both Suspicion games ended with 4 survivors and 0 casualties; both Competition games ended with 2 survivors and 0 casualties. Live Suspicion player lists showed only each client’s own role. The initial Suspicion timeout omitted the Guard victory; after the shared-engine fix, Offline and Online explicitly report “Time ran out! The Guards win because no prisoners escaped.” Online ran at 1280×720 with two 390×844 clients; Offline ran at 390×844. | Passed for time-limit and live role privacy only; escape, elimination and individual Competition winner paths remain untested. |
| Phase 14 Cooperative outward-CONTROL win (Offline, seeded UI) | Two-player Offline Cooperative; Park–Miller seed 743 was applied before Start to generate a reproducible board. All gameplay was through the UI: both players moved from Central, privately LOOKed at Room 25, entered it, then each selected row 1 / LEFT with CONTROL. First slide carried the exit and both tokens to the edge; second slide ejected Room 25. Game-over UI reported ESCAPED!, 3 rounds, 2 survivors, 0 casualties. | Passed for this seeded Offline UI sequence only; the seeded Online loopback result is recorded separately; random-board wins remain untested. |
| Phase 14 Cooperative player-death loss (Offline, seeded UI) | Two-player Offline Cooperative; Park–Miller seed 3 was applied before Start to generate two Mortal Chambers adjacent to Central. Through the UI, Player 1 moved into the left Mortal Chamber and died; Player 2 then moved into the right Mortal Chamber and died. Game-over UI reported GAME OVER, 1 round, 0 survivors, 2 casualties. | Passed for this seeded Offline UI sequence only; Online and random-board outcomes remain untested. |
| Phase 14 Competition individual escape (Offline, seeded UI) | Two-player Offline Competition; Park–Miller seed 743 before Start placed Room 25 at (0,1) with an empty route from Central. Player 1 privately LOOKed at and entered Room 25 while Player 2 stayed in Central. Row 1 / LEFT moved the exit to the edge without ending; the next round’s same outward CONTROL ejected it. UI reported ESCAPED!, “Player 1 escaped through Room 25! Victory!”, 4 rounds, 2 survivors, 0 casualties. | Passed for this seeded Offline UI sequence only; Online and random-board outcomes remain untested. |
| Phase 14 Cooperative outward-CONTROL win (Online, seeded UI) | Two-client loopback Online Cooperative; Park–Miller seed 19 before room creation, 10 rounds. Host and guest moved through UI to the exit approach, privately LOOKed at Room 25 and entered. After the fix, the first row 1 / LEFT slide moved Room 25 to the edge without ending the game; the guest’s next row 1 / LEFT ejected it. Both clients showed “All surviving prisoners successfully pushed Room 25 out of the Complex and escaped!”, 3 rounds, 2 survivors, 0 casualties. The same pre-fix UI sequence incorrectly reported victory after only the first slide. | Passed for this seeded loopback UI path only; unseeded/random-board Online outcomes remain untested. |
| Test suite | `node --check` passed for `game.js`, `public/game-engine.js`, `server.js`, `public/online-game.js`, `public/sfx.js` and `public/ui-accessibility.js`; `npm test`: 15/15 passed. |

**Not run:** Cooperative player-death loss Online; unseeded/random-board Cooperative win/loss; Suspicion prisoner-escape/Guard-elimination wins and player-death outcomes in both modes; Online and random-board Competition Room 25 escape/individual-winner; hazard/ability matrix plus Vision bonus targeting and server-rejection recovery; host migration and network-offline reconnection; 200% zoom/virtual keyboard, physical tablet/Android/iOS, LAN/Cloudflare Tunnel, performance trace, audible SFX on hardware and user study 3+2 people. Keep Release Checklist items 336–343 unchecked until remaining evidence exists.
## 7. กติกาการส่งต่องานให้ผู้พัฒนาหรือ AI

เริ่มที่ **UX-00 → UX-01 → UX-02** ก่อน แล้วเดินตาม dependencies ของแต่ละหน่วย ไม่สั่ง “ปรับ UI ทั้งหมดให้สวย” ในงานเดียว

แต่ละงานต้องแนบ:

1. รหัสงานและ scenario ที่ต้องผ่านจากเอกสารนี้
2. Target files/symbols และขอบเขตที่ห้ามเปลี่ยน
3. Baseline screenshot พร้อม state/viewport; ถ้าเป็นข้อมูลลับให้แยกมุมมองของแต่ละคน
4. Dependencies ที่ผ่านแล้ว/ยังค้าง และ contract ที่ต้องใช้
5. Acceptance criteria ที่สังเกตได้ ไม่ใช้ “ดู premium ขึ้น” เป็นเกณฑ์เดียว
6. หลักฐานหลังแก้และข้อจำกัด ก่อนส่งงานต่อหน่วยถัดไป

**จุดเริ่มต้นที่แนะนำ:** เก็บ baseline ให้ครบและล็อก private-state contract จากนั้นแก้ canonical CSS, modal layers และ mobile HUD ก่อน งานสามส่วนนี้ลดความเสี่ยงที่จะต้องรื้อภาพและเอฟเฟกต์เมื่อเข้าสู่ gameplay polish
