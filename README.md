# BrewPos — ระบบ POS สำหรับร้านกาแฟ/เครื่องดื่ม

ระบบ Point of Sale (POS) สำหรับร้านกาแฟและเครื่องดื่ม พัฒนาด้วย Nuxt 2 + Express + Capacitor  
รองรับ **2 โหมด** — รันเป็นเว็บผ่านเซิร์ฟเวอร์กลาง หรือเป็น **Android APK offline** บนแท็บเล็ต (ไม่ต้องต่อเน็ต)

---

## โครงสร้างโปรเจกต์

```
POS2B/
├── apps/
│   ├── backend/          # REST API (Express + JSON file storage)
│   └── frontend/         # Nuxt 2 SPA + Capacitor Android
├── e2e/                  # Playwright end-to-end tests
├── BrewPos.apk           # APK พร้อมใช้งาน (ก๊อปลงแท็บเล็ตได้เลย)
├── build-apk.ps1         # สคริปต์ build APK อัตโนมัติ
└── package.json          # root workspace (yarn workspaces)
```

---

## ฟีเจอร์หลัก

- **ขายหน้าร้าน (POS)** — เลือกสินค้า, ตัวเลือก (ร้อน/เย็น/ปั่น, ขนาด, ความหวาน ฯลฯ), ชำระเงินหลายช่องทาง (เงินสด, QR PromptPay, โอน, บัตร, แยกชำระ, เงินเชื่อ), ทอนเงิน, void บิล
- **รอบขาย (Shift)** — เปิด/ปิดลิ้นชักเงินสด, Z-report สรุปยอดขายต่อรอบ, cash in/out
- **สมาชิก & แต้มสะสม** — ระดับสมาชิกหลายชั้น (ทั่วไป/Silver/Gold), สะสมและแลกแต้ม, ปรับระดับอัตโนมัติ
- **LINE CRM** — ส่งข้อความแจ้งแต้มอัตโนมัติหลังชำระ, broadcast หาสมาชิกทุกคน
- **จัดการร้าน** — สินค้า+รูป, หมวดหมู่, หน่วย, option groups (ตัวเลือกกลุ่มใช้ร่วมกันได้), สต็อก, คูปอง, พนักงาน
- **รายงาน** — สรุปยอดขาย/กำไร, ประวัติบิล, ดูสลิปย้อนหลัง (58mm/80mm/A4), export CSV, VAT/ใบกำกับภาษี
- **เครื่องพิมพ์** — สลิป Bluetooth thermal (VP58BT) + สติกเกอร์ฉลาก (CLABEL 230B), พิมพ์เป็นรูปภาพ (ภาษาไทยชัด)
- **Standalone APK** — ทุกอย่างทำงานบนแท็บเล็ตเดียวโดยไม่ต้องมีเซิร์ฟเวอร์

---

## บัญชีเริ่มต้น

| Role | Username | Password | PIN | สิทธิ์ |
|---|---|---|---|---|
| admin | `admin` | `admin123` | `1111` | จัดการทุกอย่าง |
| cashier | `cashier` | `cashier123` | `2222` | หน้าขายและฟีเจอร์แคชเชียร์ |

---

## วิธีรันแบบ Web (พัฒนา / หลายเครื่องแชร์ข้อมูล)

### ความต้องการ

- Node.js 16+ และ Yarn
- (ไม่ต้องติดตั้ง database — ใช้ JSON file)

### ติดตั้ง

```bash
# จาก root ของโปรเจกต์
cd apps/backend  && npm install
cd apps/frontend && yarn install
cd e2e           && npm install && npx playwright install chromium
```

### รัน (เปิด 2 เทอร์มินัล)

```bash
# Terminal 1 — Backend API  → http://localhost:5000
yarn dev:backend

# Terminal 2 — Frontend     → http://localhost:3000
yarn dev:frontend
```

### รีเซ็ตข้อมูลตัวอย่าง

```bash
yarn seed
```

---

## วิธีรันแบบ APK บนแท็บเล็ต Android (Offline Standalone)

ไม่ต้องมีเซิร์ฟเวอร์ ข้อมูลทั้งหมดเก็บใน `localStorage` ของแอปบนแท็บเล็ต

### ใช้ APK ที่มีอยู่แล้ว

```
BrewPos.apk  ← ที่ root ของ repo
```

1. ก๊อปไฟล์ `BrewPos.apk` ไปแท็บเล็ต (สาย USB / Google Drive / LINE)
2. แตะไฟล์เพื่อติดตั้ง → กด **"อนุญาตติดตั้งจากแหล่งที่ไม่รู้จัก"** ถ้าระบบถาม
3. เปิดแอป → ล็อกอิน `admin / admin123` → ใช้งานได้เลย ไม่ต้องต่อเน็ต

### Build APK ใหม่

ต้องมี Android Studio ติดตั้งไว้ก่อน

```powershell
.\build-apk.ps1
```

สคริปต์ทำครบอัตโนมัติ: build Nuxt static → sync Capacitor → build APK → ออกเป็น `BrewPos.apk`

ดูรายละเอียดการ build, เครื่องพิมพ์ Bluetooth, และโหมดต่อเซิร์ฟเวอร์กลาง → **[BUILD-APK.md](BUILD-APK.md)**

### ทดสอบโหมด standalone ในเบราว์เซอร์

เปิด frontend ปกติแล้วเพิ่ม `?standalone=1` ใน URL
(หรือตั้ง `localStorage.STANDALONE = '1'` ใน DevTools)
แอปจะใช้ in-app backend โดยไม่ต้องเปิด server.js

---

## โครงสร้างรายละเอียด

### apps/backend

| ไฟล์ | หน้าที่ |
|---|---|
| `server.js` | Express API — auth, CRUD ทุก resource, order lifecycle, shift, LINE CRM |
| `db.js` | JSON file storage (`db.json`) + seed data |
| `seed.js` | รีเซ็ต `db.json` กลับเป็นข้อมูลตัวอย่าง (`npm run seed`) |
| `uploads/` | รูปสินค้า/โลโก้ที่อัปโหลดผ่าน API |

### apps/frontend/pages

| Path | หน้าที่ |
|---|---|
| `/login` | ล็อกอิน username/password และ PIN |
| `/seller` | หน้าขาย (POS หลัก) |
| `/seller/cashdraw` | เปิด/ปิดรอบขาย, cash in/out |
| `/seller/stock` | เช็คสต็อกหน้าแคชเชียร์ |
| `/seller/point` | จัดการแต้มสมาชิกหน้าแคชเชียร์ |
| `/seller/register` | ลงทะเบียนสมาชิกใหม่หน้าแคชเชียร์ |
| `/manage` | แดชบอร์ดผู้จัดการ |
| `/manage/product` | จัดการสินค้า + รูปภาพ |
| `/manage/category` | หมวดหมู่สินค้า |
| `/manage/optiongroup` | กลุ่มตัวเลือก (option groups) |
| `/manage/stock` | สต็อกสินค้า |
| `/manage/employee` | พนักงาน |
| `/manage/customer` | สมาชิก |
| `/manage/levelmember` | ระดับสมาชิก |
| `/manage/coupon` | คูปองส่วนลด |
| `/manage/cash` | สรุปเงินสด, ประวัติ shift |
| `/manage/receipts` | ประวัติบิลทั้งหมด, ดูสลิปย้อนหลัง |
| `/manage/reports` | รายงานยอดขาย/กำไร |
| `/manage/line-crm` | LINE CRM |
| `/manage/settings` | ตั้งค่าร้าน, เครื่องพิมพ์, PromptPay, VAT |
| `/manage/register` | ลงทะเบียนสมาชิก (ฝั่งผู้จัดการ) |
| `/manage/pointmanage` | ปรับแต้มสมาชิก |

### apps/frontend/plugins

| ไฟล์ | หน้าที่ |
|---|---|
| `local-api.js` | **in-app backend** (standalone mode) — พอร์ต `server.js` ทั้งหมดมารันเป็น axios adapter ใน browser/APK |
| `printer.js` | Bluetooth thermal printer — สลิป (VP58BT) + สติกเกอร์ (CLABEL 230B) |
| `promptpay.js` | สร้าง QR code PromptPay |
| `theme.js` | dark/light mode |
| `branding.js` | โหลดชื่อร้าน/โลโก้จาก settings |
| `toast.js` | snackbar notification |
| `img.js` | แสดงรูปจาก URL หรือ data URL (รองรับทั้งสองโหมด) |

---

## API Endpoints (สรุป)

Base URL: `http://localhost:5000/api`

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| POST | `/authen/login` | ล็อกอิน username/password |
| POST | `/authen/pin` | ล็อกอิน PIN |
| GET | `/authen/user` | ข้อมูล user ปัจจุบัน |
| CRUD | `/product` | สินค้า (POST รองรับ multipart สำหรับอัปโหลดรูป) |
| CRUD | `/category` | หมวดหมู่ |
| CRUD | `/unit` | หน่วยนับ |
| CRUD | `/optiongroup` | กลุ่มตัวเลือก |
| CRUD | `/employee` | พนักงาน (hash password อัตโนมัติ) |
| CRUD | `/customer` | สมาชิก (PUT รองรับ `auto_level`) |
| CRUD | `/coupon` | คูปอง |
| CRUD | `/level` | ระดับสมาชิก |
| CRUD | `/stock` | สต็อก |
| GET/POST | `/order` | ออเดอร์ |
| POST | `/order/:id/void` | ยกเลิกบิล (คืนสต็อก + แต้ม) |
| POST | `/order/:id/settle` | ชำระบิลเงินเชื่อ |
| GET/POST | `/cashmove` | เงินเข้า/ออกลิ้นชัก |
| GET | `/shift/current` | รอบขายที่เปิดอยู่ |
| GET | `/shift` | ประวัติรอบขายทั้งหมด |
| POST | `/shift/open` | เปิดรอบขาย |
| POST | `/shift/close` | ปิดรอบขาย + Z-report |
| GET/PUT | `/settings` | ตั้งค่าร้าน (singleton) |
| GET | `/crm/messages` | ประวัติ LINE message |
| POST | `/crm/send` | ส่ง LINE ให้สมาชิกคนเดียว |
| POST | `/crm/broadcast` | broadcast LINE ทุกคน |
| POST | `/upload` | อัปโหลดรูปภาพทั่วไป (โลโก้ ฯลฯ) |

---

## Environment Variables

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|
| `PORT` | `5000` | port ของ backend |
| `JWT_SECRET` | `brewpos-dev-secret-change-me` | **เปลี่ยนใน production** |
| `API_BASE` | `http://localhost:5000/api` | URL backend (ใช้ตอน build frontend) |
| `STANDALONE` | `` | ตั้งเป็น `1` เพื่อ force standalone mode |

---

## รัน E2E Tests

```bash
# ต้องมี backend + frontend รันอยู่ก่อน
yarn test:e2e

# หรือ smoke test เดี่ยว
cd e2e && node smoke.test.js
```

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Nuxt 2, Vuetify 1, Axios, @nuxtjs/auth, Moment.js |
| Backend | Node.js, Express 4, JWT (jsonwebtoken), bcryptjs, Multer |
| Database | JSON file (`db.json`) — ไม่ต้องติดตั้งอะไรเพิ่ม |
| Mobile | Capacitor 8 (Android) |
| Printing | capacitor-thermal-printer (Bluetooth ESC/POS, พิมพ์เป็น canvas image) |
| QR Payment | qrcode (PromptPay EMVCo standard) |
| Tests | Playwright |

---

## หมายเหตุ

- Backend เก็บข้อมูลเป็นไฟล์ `apps/backend/db.json` สร้างอัตโนมัติจาก seed — ไม่ต้องติดตั้ง database
- Nuxt 2 + Node 22+ ใช้ `--openssl-legacy-provider` (ฝังในสคริปต์ package.json แล้ว)
- โหมด standalone: `local-api.js` พอร์ต logic ทั้งหมดของ backend มารันใน browser เป็น axios adapter — ทำให้ APK ทำงานได้โดยไม่ต้องต่อเน็ต
- แต่ละแท็บเล็ตมีข้อมูลของตัวเอง ถ้าต้องการหลายเครื่องแชร์ข้อมูลกันต้องใช้โหมด web ที่ต่อ backend กลาง (ดู [BUILD-APK.md](BUILD-APK.md))
