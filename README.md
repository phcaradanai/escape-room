# Room 25 Ultimate - Digital Edition (ห้องมรณะ 25)

เกมกระดานแนวไซไฟระทึกขวัญ **Room 25** ในรูปแบบเว็บดิจิทัล รองรับทั้งการเล่นแบบ **Online Multiplayer แบบเรียลไทม์** ผ่าน Socket.IO และโหมด **Offline Standalone (เล่นบนเครื่องเดียว)**

---

## สารบัญ (Table of Contents)
1. [ภาพรวมระบบ (System Overview)](#ภาพรวมระบบ-system-overview)
2. [ข้อกำหนดเบื้องต้น (Prerequisites)](#ข้อกำหนดเบื้องต้น-prerequisites)
3. [วิธีรันแบบ Local (Local Execution)](#วิธีรันแบบ-local-local-execution)
4. [วิธีรันและเปิดโฮสต์ด้วย Cloudflare Tunnel](#วิธีรันและเปิดโฮสต์ด้วย-cloudflare-tunnel-cloudflared)
5. [ระบบและการทำงานของเกม (Game System & Mechanics)](#ระบบและการทำงานของเกม-game-system--mechanics)
6. [โครงสร้างโปรเจกต์ (Project Structure)](#โครงสร้างโปรเจกต์-project-structure)

---

## ภาพรวมระบบ (System Overview)

ระบบถูกออกแบบให้เล่นง่ายโดยไม่ต้องตั้งค่าฐานข้อมูล โดยแบ่งออกเป็น 2 โหมด:

1. **โหมดออนไลน์มัลติเพลเยอร์ (Online Multiplayer)**
   - ใช้ **Node.js + Express + Socket.IO**
   - สถาปัตยกรรมแบบ **Server-Authoritative**: เซิร์ฟเวอร์เก็บข้อมูลจริงทั้งหมด (ตำแหน่งห้อง 25, บทบาทลับ, กับดัก)
   - มีระบบ **Fog of War & State Sanitization**: ป้องกันการโกงโดยเซิร์ฟเวอร์จะกรองข้อมูลห้องที่ยังไม่เปิดและการ์ดบทบาทลับก่อนส่งให้ผู้เล่นแต่ละคน
   - สร้างห้องด้วยรหัส 4 หลัก (Room Code)
   - ระบบเสียงแบบ **Procedural Web Audio API** ในตัว ไม่ต้องโหลดไฟล์เสียง MP3/WAV แยก
   - รองรับ 2 ภาษา: **ไทย (TH)** และ **อังกฤษ (EN)**

2. **โหมดเล่นคนเดียว / ออฟไลน์ (Offline Standalone Hotseat)**
   - ทำงานบนเบราว์เซอร์ 100% ผ่านไฟล์ `index.html` และ `game.js`
   - เล่นผลัดกันเดินในเครื่องเดียวกัน (Pass-and-play) ไม่ต้องต่ออินเทอร์เน็ต

---

## ข้อกำหนดเบื้องต้น (Prerequisites)

- [Node.js](https://nodejs.org/) เวอร์ชัน 18+ หรือ 20+ LTS
- เว็บบราวเซอร์สมัยใหม่ (Chrome, Edge, Firefox, Safari)

ติดตั้ง Dependencies ก่อนใช้งานครั้งแรก:
```bash
npm install
```

---

## วิธีรันแบบ Local (Local Execution)

### 1. รันเซิร์ฟเวอร์ออนไลน์ (Online Multiplayer)
เปิด Terminal หรือ Command Prompt ในโฟลเดอร์โปรเจกต์:

```bash
node server.js
```

เมื่อเซิร์ฟเวอร์เริ่มทำงาน จะแสดงข้อความ:
```text
Room 25 Online Server running at http://localhost:3000
```

- เข้าเล่นผ่านเบราว์เซอร์: `http://localhost:3000`
- หากต้องการให้เครื่องอื่นในเครือข่าย Wi-Fi / LAN เดียวกันเข้าเล่น ให้ใช้ IP ของเครื่องโฮสต์ เช่น `http://192.168.1.XX:3000`
- สามารถเปลี่ยนพอร์ตได้ผ่าน Environment Variable:
  ```bash
  # Linux / macOS
  PORT=8080 node server.js

  # Windows PowerShell
  $env:PORT=8080; node server.js
  ```

### 2. รันโหมดออฟไลน์ (Standalone)
- ดับเบิลคลิกเปิดไฟล์ `index.html` (ที่โฟลเดอร์ root) บนบราวเซอร์ได้ทันที หรือรันผ่าน static server:
  ```bash
  npx serve .
  ```

---

## วิธีรันและเปิดโฮสต์ด้วย Cloudflare Tunnel (cloudflared)

โปรเจกต์นี้มีไฟล์ `cloudflared.exe` สำหรับสร้าง Quick Tunnel โดยไม่ต้องสมัครบัญชี Cloudflare, ไม่ต้องเปิด Port Forwarding และไม่ต้องมี Public IP จริง

### วิธีที่ 1: รันอัตโนมัติด้วยไฟล์ Batch (Windows - แนะนำ)
ดับเบิลคลิกไฟล์:
```cmd
start-tunnel.bat
```

สคริปต์จะดำเนินการอัตโนมัติ:
1. เปิดหน้าต่าง Command Prompt ใหม่เพื่อรัน `node server.js`
2. รอ 2 วินาทีให้เซิร์ฟเวอร์พร้อม
3. รัน `cloudflared.exe tunnel --url http://localhost:3000` ในหน้าต่างหลัก
4. คัดลอก URL ชั่วคราว (เช่น `https://xxxx-xxxx-xxxx.trycloudflare.com`) ส่งให้เพื่อนเข้าเล่นได้ทันที

> **หมายเหตุการปิดใช้งาน**: เมื่อต้องการหยุดเล่น ให้ปิดหน้าต่างคอนโซล Cloudflare และปิดหน้าต่าง `Room 25 Server` ด้วย

### วิธีที่ 2: รันคำสั่งด้วยตนเอง (Manual Run)
1. รันเซิร์ฟเวอร์หลักก่อนใน Terminal ที่ 1:
   ```bash
   node server.js
   ```
2. รัน Cloudflare Tunnel ใน Terminal ที่ 2:
   ```cmd
   cloudflared.exe tunnel --url http://localhost:3000
   ```
   *(หรือใช้คำสั่ง `cloudflared` หากติดตั้งไว้ใน PATH)*
3. มองหาบรรทัดใน log ที่แสดงลิงก์:
   ```text
   +--------------------------------------------------------------------------------------------+
   |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
   |  https://xxxxxxxxxxxxxxxx.trycloudflare.com                                                |
   +--------------------------------------------------------------------------------------------+
   ```
4. นำลิงก์ HTTPS ดังกล่าวส่งให้ผู้เล่นภายนอกเข้าใช้งานได้ทันที

---

## ระบบและการทำงานของเกม (Game System & Mechanics)

### 1. กระดานและการจัดวาง (5x5 Grid)
- กระดานขนาด 5x5 ช่อง (25 ห้อง)
- **Central Room (ห้องกลาง)**: อยู่ตรงพิกัดกลาง (แถว 2, คอลัมน์ 2) เป็นจุดเริ่มต้น ปลอดภัย ห้ามผลักกันในห้องนี้
- **Room 25 (ห้องทางออก)**: ซ่อนแบบสุ่มอยู่ในการ์ด 24 ใบ การันตีว่ามีอยู่ในกระดานเสมอ
- **ห้องปลอดภัย (Safe)**: ห้องว่าง (Empty), ห้องญาณทิพย์ (Vision Chamber - ส่องห้องลับได้ทุกจุด), ห้องสลับ (Moving Chamber - สลับห้องคว่ำ), ห้องควบคุม (Control Chamber - เลื่อนแถวฟรี)
- **ห้องเตือนภัย (Warning)**: วังวน (Vortex - วาร์ปกลับห้องกลาง), ห้องเยือกแข็ง (Freezer - เสียแอ็กชันถัดไป), ห้องมืด (Dark Room - ห้ามส่อง), ห้องฝาแฝด (Twins), ห้องภาพลวงตา (Illusion)
- **ห้องอันตรายมรณะ (Danger)**: ห้องมรณะ (Mortal - ตายทันที), ห้องกับดัก (Trapped - ต้องออกจากห้องในแอ็กชันถัดไปไม่งั้นตาย), บ่อกรด (Acid - หากมี 2 คน คนหนึ่งต้องตาย), ห้องน้ำท่วม (Flooded - จมน้ำหากอยู่ 2 เทิร์น)

### 2. ลูปการเล่น (Game Loop & Phases)
แต่ละรอบ (Round) ประกอบด้วย 2 เฟสหลัก:
1. **เฟสวางแผน (Programming Phase)**:
   - ผู้เล่นทุกคนต้องเลือกวางแผน 2 แอ็กชันลับๆ จาก 4 แอ็กชัน
   - ฝั่งตรงข้ามจะไม่เห็นว่าเราวางแผนแอ็กชันอะไรไว้
2. **เฟสประมวลผล (Resolution Phase)**:
   - ดำเนินการแอ็กชันที่ 1 ของผู้เล่นทุกคนตามลำดับเทิร์น
   - ดำเนินการแอ็กชันที่ 2 ของผู้เล่นทุกคนตามลำดับเทิร์น

### 3. แอ็กชันหลัก 4 ชนิด (4 Actions)
- **ส่อง (LOOK/PEEK)**: แอบดูห้องที่อยู่ติดกัน 1 ห้อง โดยรู้ข้อมูลเพียงคนเดียว
- **เดิน (MOVE)**: ก้าวไปยังห้องที่อยู่ติดกัน (หากห้องยังคว่ำอยู่จะถูกเปิดหงายทันที)
- **ผลัก (PUSH)**: ผลักผู้เล่นอื่นที่อยู่ในห้องเดียวกันไปยังห้องข้างเคียง
- **ควบคุม/เลื่อนแถว (CONTROL/SLIDE)**: เลื่อนแถวแนวนอนหรือแนวตั้ง (ยกเว้นแถวกลางและคอลัมน์กลางที่มี Central Room) ไปในทิศทาง บน/ล่าง/ซ้าย/ขวา ห้องที่หลุดขอบจะวนกลับมาอีกด้านพร้อมตัวละครในห้องนั้น

### 4. โหมดการเล่น (Game Modes)
- **โหมดร่วมมือ (Cooperative)**: ผู้เล่นทุกคนช่วยกันหา Room 25 เลื่อนไปที่ขอบกระดาน และหลบหนีออกไปพร้อมกันก่อนหมดรอบ
- **โหมดสงสัย (Suspicion)**: มีผู้คุม (Guards) ปลอมตัวเข้ามาปะปนกับนักโทษ (Prisoners) ผู้คุมชนะถ้านักโทษตาย 2 คนหรือหนีไม่ทันเวลาก่อนจบรอบ
- **โหมดแข่งขัน (Competition)**: แข่งขันกันเอาชีวิตรอดและหาทางออกเป็นคนแรก

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
room25/
├── server.js              # เซิร์ฟเวอร์หลัก Node.js / Express / Socket.IO
├── start-tunnel.bat       # สคริปต์เปิดเซิร์ฟเวอร์ + Cloudflare Tunnel
├── cloudflared.exe        # ไบนารี Cloudflare Tunnel สำหรับ Windows
├── package.json           # การตั้งค่า dependencies และ metadata
├── AGENTS.md              # แนวทางการพัฒนาและโครงสร้างโค้ดสำหรับ AI Agent
├── README.md              # เอกสารคู่มือการใช้งานและรายละเอียดระบบ
├── index.html             # โหมดออฟไลน์ Standalone Hotseat
├── game.js                # Game Engine โหมดออฟไลน์
├── styles.css             # สไตล์ชีทโหมดออฟไลน์
└── public/                # Static assets สำหรับโหมด Online Multiplayer
    ├── index.html         # หน้าต่างเกมออนไลน์และล็อบบี้
    ├── online-game.js     # โค้ด Client สำหรับคุยผ่าน Socket.IO และแสดงผล
    ├── styles.css         # สไตล์ชีทโหมดออนไลน์
    └── sfx.js             # ตัวสร้างเสียงสังเคราะห์ Web Audio API
```
