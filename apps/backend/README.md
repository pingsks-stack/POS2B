# BrewPos — Backend API (rebuilt)

เซิร์ฟเวอร์ API ที่สร้างใหม่แทนของเดิม (`api.brewpos.local` ที่ปิดไปแล้ว)
สำหรับใช้กับ frontend `frontend_brewpos`

- **Stack:** Node.js + Express + JWT — ไม่มี dependency ที่ต้อง compile native (ติดตั้งง่ายบน Windows)
- **ฐานข้อมูล:** ไฟล์ JSON (`db.json`) สร้างอัตโนมัติพร้อมข้อมูลตัวอย่างเมื่อรันครั้งแรก
- **รูปภาพ:** อัปโหลดเก็บในโฟลเดอร์ `uploads/` เสิร์ฟที่ `http://localhost:5000/uploads/...`

## วิธีรัน

```bash
cd apps/backend
npm install      # ครั้งแรกครั้งเดียว
npm start        # รันที่ http://localhost:5000
```

ตั้งค่าได้ผ่าน env: `PORT` (พอร์ต), `JWT_SECRET` (กุญแจเซ็น token)

รีเซ็ตข้อมูลกลับเป็นค่าตัวอย่าง: `npm run seed` (หรือลบไฟล์ `db.json` แล้วรันใหม่)

## บัญชีทดสอบ

| username | password | สิทธิ์ | เข้าหน้า |
|---|---|---|---|
| `admin` | `admin123` | admin | `/manage` (จัดการระบบ) |
| `cashier` | `cashier123` | cashier | `/seller` (ขายของ POS) |

## Endpoints

ทุก path มี prefix `/api`

| Method | Path | หมายเหตุ |
|---|---|---|
| POST | `/authen/login` | body: `{ data: { username, password } }` → `{ token }` |
| GET | `/authen/user` | ต้องมี `Authorization: Bearer <token>` → `{ user }` |
| GET/POST/PUT/DELETE | `/product` | POST แบบ multipart (field `file`) = อัปโหลดรูป คืน `{ url }`; POST แบบ JSON = สร้างสินค้า |
| GET/POST/PUT/DELETE | `/category` | |
| GET/POST/PUT/DELETE | `/unit` | |
| GET/POST/PUT/DELETE | `/customer` | |
| GET/POST/PUT/DELETE | `/employee` | hash password ด้วย bcrypt อัตโนมัติ; รองรับ path บั๊ก `/api/api/employee` ด้วย |
| GET/POST/PUT/DELETE | `/coupon` | |
| GET/POST/PUT/DELETE | `/level` | ระดับสมาชิก (level_name, point_rate) |
| GET/POST/PUT/DELETE | `/role` | ตำแหน่งพนักงาน |
| GET/POST/PUT/DELETE | `/stock` | |
| GET/POST/PUT/DELETE | `/order` | POST ตัดสต็อกอัตโนมัติ; status "1"=ชำระแล้ว, "0"=พักบิล |

GET ที่มี reference (product, customer, employee) จะ populate ออบเจ็กต์ย่อยให้
(`ref_cate_id`, `ref_uid`, `ref_level_id`, `ref_id_role`) ตามที่ frontend ต้องการ
