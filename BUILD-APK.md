# 📱 สร้างไฟล์ APK (แอป Android) — BREW POS POS

แอปนี้เป็น **offline standalone** เต็มตัว 🎉
ทุกอย่าง (API + ฐานข้อมูล) อยู่ **ในตัวแอปบนแท็บเล็ตเอง** — **ไม่ต้องมีเซิร์ฟเวอร์กลาง ไม่ต้องต่อเน็ต**
ข้อมูล (สินค้า/บิล/สมาชิก/ตั้งค่า) เก็บไว้ในเครื่องแท็บเล็ต

> ✅ มีไฟล์พร้อมใช้อยู่แล้วที่ **`BrewPos.apk`** (ราก repo) — ก๊อปไปลงแท็บเล็ตได้เลย

---

## วิธีสร้างใหม่ (ครั้งเดียวจบ)

ต้องมี **Android Studio** ติดตั้งไว้ (มันมาพร้อม Java + Android SDK ที่ใช้ build)

เปิด PowerShell ที่โฟลเดอร์ `pos` แล้วสั่ง:
```powershell
.\build-apk.ps1
```
สคริปต์จะทำให้อัตโนมัติ: build เว็บแบบ offline → ใส่เข้าโปรเจค Android → build APK → ก๊อปออกมาเป็น `BrewPos.apk`

เสร็จแล้วได้ไฟล์ที่ 👉 `BrewPos.apk`

---

## ติดตั้งลงแท็บเล็ต
1. ก๊อปไฟล์ `BrewPos.apk` ไปลงแท็บเล็ต (สาย USB / Google Drive / LINE ส่งหาตัวเอง ก็ได้)
2. แตะไฟล์เพื่อติดตั้ง → ถ้าเตือน ให้เปิด **"อนุญาตติดตั้งจากแหล่งที่ไม่รู้จัก"**
3. เปิดแอป → ล็อกอิน **admin / admin123** (หรือ cashier / cashier123) → ใช้งานได้เลย ไม่ต้องต่อเน็ต

---

## ❓ คำถามที่พบบ่อย
| คำถาม | คำตอบ |
|---|---|
| ต้องเปิดคอม/เซิร์ฟเวอร์ไหม? | **ไม่ต้อง** ทุกอย่างรันบนแท็บเล็ต |
| ต้องต่อเน็ต/Wi-Fi ไหม? | **ไม่ต้อง** ทำงาน offline 100% |
| ข้อมูลเก็บที่ไหน? | ในเครื่องแท็บเล็ต (localStorage ของแอป) |
| ลงหลายเครื่อง ข้อมูลแชร์กันไหม? | **ไม่แชร์** — แต่ละเครื่องมีข้อมูลของตัวเอง (ดู "หลายสาขา" ด้านล่าง) |
| อยากล้างข้อมูลเริ่มใหม่? | ล้างข้อมูลแอปใน Settings ของ Android (Storage → Clear data) |
| รูปโลโก้/รูปสินค้า | อัปโหลดในแอปได้ เก็บฝังในเครื่อง (เป็น data URL) |

---

## 🏪 ถ้าอยากให้หลายเครื่องแชร์ข้อมูลกัน (หลายสาขา/หลายแคชเชียร์)
โหมด standalone เหมาะกับ **1 เครื่อง = 1 ร้าน**
ถ้าต้องการให้หลายแท็บเล็ตเห็นข้อมูลชุดเดียวกัน (เช่น แคชเชียร์ 3 เครื่องในร้านเดียว) ต้องใช้ **เซิร์ฟเวอร์กลาง** แทน:
ดูวิธี build แบบต่อเซิร์ฟเวอร์ได้ที่ส่วนท้ายไฟล์นี้

---

## 🖨️ เครื่องพิมพ์สลิป Bluetooth (VP58BT) ในแอป
แอป (APK) พิมพ์ผ่าน **Bluetooth Classic** ของ Android โดยตรง (ไม่ใช่ Web Bluetooth ซึ่ง WebView ไม่รองรับ)

วิธีใช้บนแท็บเล็ต:
1. เปิด **Bluetooth** ของแท็บเล็ต แล้ว **จับคู่ (pair) เครื่องพิมพ์ VP58BT** ในหน้า Settings ของ Android ก่อน (รหัสมักเป็น 0000 หรือ 1234)
2. เปิดแอป → **ตั้งค่า → เครื่องพิมพ์สลิป → เชื่อมต่อ** → แอปจะค้นหา แตะเลือกเครื่องพิมพ์
3. ครั้งแรกแอปจะขอสิทธิ์ Bluetooth → กดอนุญาต
4. กด **ทดสอบพิมพ์** เพื่อตรวจสอบ

> สลิปถูกพิมพ์เป็น **รูปภาพ** ทำให้ภาษาไทยคมชัดเสมอ (ไม่ติดปัญหา codepage) · รองรับโลโก้ + QR PromptPay บนสลิป
> ถ้าเครื่องพิมพ์ของคุณเป็น BLE ไม่ใช่ Classic SPP แจ้งได้ จะปรับให้

### เครื่องพิมพ์สติกเกอร์/ฉลาก แยกต่างหาก (เช่น CLABEL 230B)
รองรับเครื่องพิมพ์ฉลากแยกอีกตัว (นอกจากเครื่องพิมพ์สลิป) — ตั้งค่าที่ **ตั้งค่า → เครื่องพิมพ์สติกเกอร์ (ฉลาก)**
1. จับคู่ CLABEL 230B ใน Bluetooth ของ Android ก่อน
2. ในแอป กด **เลือกเครื่องพิมพ์** ใต้การ์ด "เครื่องพิมพ์สติกเกอร์" → เลือก CLABEL
3. ตั้ง **ขนาดฉลาก** (เช่น 50x40) และ **DPI = 300** (ค่าเริ่มต้นของ 230B) → **ทดสอบพิมพ์สติกเกอร์**

> มีเครื่องพิมพ์ 1 การเชื่อมต่อต่อครั้ง — แอปจะสลับเชื่อมต่อระหว่างเครื่องพิมพ์สลิปกับสติกเกอร์ให้อัตโนมัติตอนสั่งพิมพ์
> ถ้าเว้นช่องเครื่องพิมพ์สติกเกอร์ไว้ว่าง สติกเกอร์จะออกที่เครื่องพิมพ์สลิปแทน
> CLABEL 230B รองรับ ESC/POS จึงพิมพ์เป็นรูปภาพได้ · ถ้ารุ่นของคุณเป็น BLE/โปรโตคอลเฉพาะ (ต้องใช้แอป Clabel) แจ้งได้

## หมายเหตุสำหรับนักพัฒนา

**สถาปัตยกรรม standalone ทำงานยังไง**
- `apps/frontend/plugins/local-api.js` — พอร์ต `apps/backend` (db.js seed + server.js routes) มารันฝั่ง client เป็น **axios adapter** เสิร์ฟทุก `/api/...` จาก `localStorage`
- เปิดใช้เมื่อ: รันใน Capacitor (native), หรือ build ที่ตั้ง `STANDALONE=1`, หรือ override ด้วย `localStorage.STANDALONE='1'` / `?standalone=1` (ใช้ตอนเทส)
- `yarn build:app` = `NUXT_APP=1 STANDALONE=1 nuxt generate` → SPA offline ที่ `dist/`
- เทส offline: `e2e/standalone.test.js` (รันโดยปิด backend เพื่อพิสูจน์ว่าไม่ต้องมีเซิร์ฟเวอร์)

**ถ้าจะ build แบบต่อเซิร์ฟเวอร์กลาง (หลายเครื่องแชร์ข้อมูล)**
```powershell
cd apps\frontend
# ปิด standalone, ชี้ไป IP ของเครื่องเซิร์ฟเวอร์
$env:API_BASE = "http://192.168.1.181:5000/api"
yarn build:app:server     # NUXT_APP=1 (ไม่มี STANDALONE)
npx cap sync android
npx cap open android       # แล้ว Build APK ใน Android Studio
```
แล้วต้องเปิด backend ที่เครื่องคอม (`yarn dev:backend`) + เปิด firewall port 5000 + แท็บเล็ตอยู่ Wi-Fi วงเดียวกัน

**เครื่องพิมพ์ native (Bluetooth Classic)**
- plugin: `capacitor-thermal-printer` (compile ผ่านบน Capacitor 8) — เข้าถึงผ่าน global `window.Capacitor.Plugins.CapacitorThermalPrinter` ใน [plugins/printer.js](apps/frontend/plugins/printer.js) เพื่อเลี่ยงการ bundle @capacitor/core เข้า webpack
- โหมด native: `renderReceiptImage()`/`renderStickerImage()` วาดสลิปลง `<canvas>` → PNG dataURL → `image()` (ภาษาไทยเป็นรูป) · โหมดเว็บยังใช้ Web Bluetooth (ESC/POS TIS-620) หรือ browserPrint เหมือนเดิม
- permission Bluetooth Android 12+ plugin ขอเอง; manifest ของแอปประกาศ BLUETOOTH_SCAN/CONNECT + legacy ที่ [AndroidManifest.xml](apps/frontend/android/app/src/main/AndroidManifest.xml)

**Release APK (เซ็น signing ขึ้น Play Store)**
ทำ keystore แล้ว build variant `release` ใน Android Studio (Build → Generate Signed Bundle/APK)
