# BrewPos — E2E tests (Playwright)

เทสต์ขับเบราว์เซอร์จริง (Chromium) ครอบคลุมทุกฟีเจอร์ POS: login, CRUD ทุกหน้าใน manage,
การขายหน้าร้าน (พักบิล/เรียกคืน/ชำระเงิน), หน้าสมาชิก และสรุปยอดขาย

## ต้องเปิดทั้ง backend และ frontend ก่อน
```bash
# terminal 1
cd apps/backend && npm start          # http://localhost:5000

# terminal 2
cd apps/frontend && yarn dev          # http://localhost:3000
```

## รันเทสต์
```bash
cd e2e
npm install                # ครั้งแรก
npx playwright install chromium   # ครั้งแรก
npm test                   # รันทุกชุด (run-all.js)
node category.test.js      # รันทีละไฟล์ได้
```

แต่ละไฟล์ `*.test.js` คือหนึ่งฟีเจอร์ ทดสอบ เพิ่ม→แก้→ลบ ผ่าน UI จริง แล้วตรวจผลในตาราง
ถ้าล้มเหลวจะบันทึกภาพหน้าจอ `fail-*.png` ไว้ในโฟลเดอร์นี้
