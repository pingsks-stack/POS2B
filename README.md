# BrewPos ☕

ระบบขายหน้าร้าน (POS) ร้านกาแฟ — โครงสร้างแบบ monorepo

## โครงสร้างโปรเจค

```
pos/
├── apps/
│   ├── backend/    REST API (Express + JWT + JSON-file store)  → :5000
│   └── frontend/   Nuxt 2 + Vuetify (Modern Light UI)          → :3000
├── e2e/            Playwright end-to-end tests (25 suites)
├── package.json    workspace + convenience scripts
└── README.md
```

## เริ่มใช้งาน

ครั้งแรก ติดตั้ง dependencies ของแต่ละส่วน:

```bash
cd apps/backend   && npm install
cd apps/frontend  && yarn install
cd e2e            && npm install && npx playwright install chromium
```

รัน (เปิด 2 เทอร์มินัล):

```bash
# Terminal 1 — Backend API (http://localhost:5000)
cd apps/backend && npm start

# Terminal 2 — Frontend (http://localhost:3000)
cd apps/frontend && yarn dev
```

หรือจากรากด้วยสคริปต์ workspace:

```bash
npm run dev:backend     # = apps/backend npm start
npm run dev:frontend    # = apps/frontend yarn dev
npm run seed            # รีเซ็ตข้อมูลตัวอย่าง (apps/backend/seed.js)
npm run test:e2e        # รัน Playwright ทั้งหมด (ต้องเปิด backend+frontend ก่อน)
```

## บัญชีทดสอบ

| Username | Password | สิทธิ์ | หน้าแรก |
|---|---|---|---|
| `admin` | `admin123` | ผู้ดูแล | `/manage` (แดชบอร์ด) |
| `cashier` | `cashier123` | แคชเชียร์ | `/seller` (ขายหน้าร้าน) |

## ฟีเจอร์หลัก

- **ขายหน้าร้าน (POS):** ตัวเลือกสินค้า, สมาชิก+สะสมแต้ม, คูปอง, **PromptPay QR**, เงินสด/QR/โอน/บัตร/**แยกชำระ**/**เงินเชื่อ**, เงินทอน, ใบเสร็จ+พิมพ์ (58/80mm), **สติกเกอร์ออเดอร์**
- **จัดการ:** สินค้า(+ออปชั่น), หมวดหมู่, หน่วยนับ, สต็อก, สมาชิก, ระดับสมาชิก, แต้ม, คูปอง, พนักงาน
- **การเงิน:** แดชบอร์ด, **รายงานยอดขาย/กำไร + Export CSV**, เปิด-ปิดรอบขาย + Z-report, **เงินเข้า-ออกลิ้นชัก**, **ยกเลิก/คืนเงินบิล**, **VAT/ใบกำกับภาษี**, **ดูสลิปย้อนหลัง (58/80/A4)**
- **CRM:** LINE CRM (แจ้งแต้ม/บรอดแคสต์), QR เพิ่มเพื่อน
- **ตั้งค่า:** ข้อมูลร้าน+โลโก้, ใบเสร็จ, แต้ม, VAT, **วิธีชำระเงิน (เปิด/ปิด/เพิ่มเอง)**, เครื่องพิมพ์, PromptPay

## 📱 แอป Android (.apk) — offline standalone
ห่อด้วย **Capacitor** และทำเป็น **offline standalone**: API + ฐานข้อมูลอยู่ในตัวแอปบนแท็บเล็ตเอง
**ไม่ต้องมีเซิร์ฟเวอร์กลาง ไม่ต้องต่อเน็ต** — ข้อมูลเก็บในเครื่อง

- ไฟล์พร้อมใช้: **`BrewPos.apk`** (ก๊อปไปลงแท็บเล็ตได้เลย)
- สร้างใหม่ด้วยคำสั่งเดียว: `./build-apk.ps1` (ต้องมี Android Studio ติดตั้ง)
- รายละเอียด + โหมดต่อเซิร์ฟเวอร์กลาง (หลายเครื่องแชร์ข้อมูล) 👉 **[BUILD-APK.md](BUILD-APK.md)**

## หมายเหตุ
- Backend เก็บข้อมูลเป็นไฟล์ `apps/backend/db.json` (สร้างอัตโนมัติจาก seed) — ไม่ต้องลงฐานข้อมูล
- Nuxt 2 + Node 22 ใช้ `--openssl-legacy-provider` (ฝังในสคริปต์ frontend แล้ว)
