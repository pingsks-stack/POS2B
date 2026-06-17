// Tiny JSON-file "database" — no native dependencies, works anywhere Node runs.
// Data is kept in memory and flushed to db.json on every write.

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

const DB_FILE = path.join(__dirname, 'db.json')

// Mongo-style 24-char hex id so the frontend's `_id` expectations keep working.
function oid() {
  return crypto.randomBytes(12).toString('hex')
}

// ---- Fixed ids the frontend hard-codes as defaults -------------------------
const ROLE_CASHIER_ID = '60e274847a205d160021ffbe' // default role for new employees (employee.vue)
const LEVEL_DEFAULT_ID = '60e439b7c7d6ae35548c7b62' // default customer level (confirmOrder.vue)

function seed() {
  const now = new Date().toISOString()

  const roles = [
    { _id: '60e2700000000000000000a1', position: 'admin' },
    { _id: ROLE_CASHIER_ID, position: 'cashier' },
    { _id: '60e2700000000000000000a3', position: 'member' }
  ]

  const levels = [
    { _id: LEVEL_DEFAULT_ID, level_name: 'ทั่วไป', point_rate: 1, min_point: 0 },
    { _id: oid(), level_name: 'Silver', point_rate: 2, min_point: 100 },
    { _id: oid(), level_name: 'Gold', point_rate: 3, min_point: 300 }
  ]

  const hash = pw => bcrypt.hashSync(pw, 8)

  const employees = [
    {
      _id: '60e2700000000000000000b1', // fixed so login tokens survive reseeds
      pname: 'นาย', fname: 'ผู้ดูแล', lname: 'ระบบ',
      username: 'admin', password: hash('admin123'), pin: '1111',
      idcard: '1100000000001', birthday: '1990-01-01',
      tel: '0800000001', email: 'admin@brewpos.local',
      address: 'สำนักงานใหญ่',
      ref_id_role: roles[0]._id, datetime: now
    },
    {
      _id: '60e2700000000000000000b2', // fixed so login tokens survive reseeds
      pname: 'นางสาว', fname: 'แคชเชียร์', lname: 'หน้าร้าน',
      username: 'cashier', password: hash('cashier123'), pin: '2222',
      idcard: '1100000000002', birthday: '1995-05-05',
      tel: '0800000002', email: 'cashier@brewpos.local',
      address: 'หน้าร้าน',
      ref_id_role: roles[1]._id, datetime: now
    }
  ]

  const units = [
    { _id: oid(), u_name: 'แก้ว', datetime: now },
    { _id: oid(), u_name: 'ชิ้น', datetime: now },
    { _id: oid(), u_name: 'ขวด', datetime: now }
  ]

  const categories = [
    { _id: oid(), cate_name: 'กาแฟ', datetime: now },
    { _id: oid(), cate_name: 'ชา', datetime: now },
    { _id: oid(), cate_name: 'ขนม', datetime: now }
  ]

  // Reusable option groups — created once, then attached to products by id.
  const option_groups = [
    {
      _id: oid(), name: 'ประเภท', multiple: false, required: true,
      choices: [{ label: 'ร้อน', price: 0 }, { label: 'เย็น', price: 10 }, { label: 'ปั่น', price: 15 }],
      datetime: now
    },
    {
      _id: oid(), name: 'ขนาด', multiple: false, required: true,
      choices: [{ label: 'ปกติ', price: 0 }, { label: 'แก้วใหญ่', price: 10 }],
      datetime: now
    },
    {
      _id: oid(), name: 'ความหวาน', multiple: false, required: false,
      choices: [{ label: 'หวานปกติ', price: 0 }, { label: 'หวานน้อย', price: 0 }, { label: 'ไม่หวาน', price: 0 }],
      datetime: now
    },
    {
      _id: oid(), name: 'เพิ่มเติม', multiple: true, required: false,
      choices: [{ label: 'เพิ่มช็อต', price: 15 }, { label: 'วิปครีม', price: 10 }, { label: 'ไข่มุก', price: 10 }],
      datetime: now
    }
  ]
  const drinkGroupIds = option_groups.map(g => g._id)

  const products = [
    {
      _id: oid(), product_name: 'อเมริกาโน่', price: 50, price_cost: 20, stock: 100,
      img: '', ref_cate_id: categories[0]._id, ref_uid: units[0]._id, datetime: now,
      option_group_ids: drinkGroupIds, options: []
    },
    {
      _id: oid(), product_name: 'ลาเต้', price: 60, price_cost: 25, stock: 100,
      img: '', ref_cate_id: categories[0]._id, ref_uid: units[0]._id, datetime: now,
      option_group_ids: drinkGroupIds, options: []
    },
    {
      _id: oid(), product_name: 'ชาเขียว', price: 55, price_cost: 22, stock: 80,
      img: '', ref_cate_id: categories[1]._id, ref_uid: units[0]._id, datetime: now,
      option_group_ids: drinkGroupIds, options: []
    },
    {
      _id: oid(), product_name: 'เค้กช็อกโกแลต', price: 75, price_cost: 35, stock: 30,
      img: '', ref_cate_id: categories[2]._id, ref_uid: units[1]._id, datetime: now,
      option_group_ids: [], options: []
    }
  ]

  const customers = [
    {
      _id: oid(), pname: 'นาย', fname: 'สมชาย', lname: 'ใจดี',
      birthday: '1992-03-15', tel: '0811111111', email: 'somchai@mail.com',
      address: 'กรุงเทพฯ', point: 120, ref_level_id: levels[1]._id, datetime: now,
      line_user_id: 'Udemo000000000000000000000somchai', line_name: 'สมชาย (LINE)'
    },
    {
      _id: oid(), pname: 'นางสาว', fname: 'สมหญิง', lname: 'รักดี',
      birthday: '1998-08-20', tel: '0822222222', email: 'somying@mail.com',
      address: 'นนทบุรี', point: 40, ref_level_id: levels[0]._id, datetime: now
    }
  ]

  const coupons = [
    {
      _id: oid(), codename: 'WELCOME10', discount: 10, num_use: 100,
      exp: '2027-12-31', ref_emp_id_by: employees[0]._id, ref_emp_id: employees[0]._id,
      datetime: now
    }
  ]

  const stock = products.map(p => ({
    _id: oid(), ref_pro_id: p._id, qty_max: p.stock, qty_min: 10, datetime: now
  }))

  // sample paid orders so the dashboard has data on a fresh seed
  const mkOrder = (bill, lines, method, custRef) => {
    const list_product = lines.map(([p, qty]) => ({
      ref_pro_id: p._id, name: p.product_name, qty, price: p.price * qty, options: [], unit: p.price
    }))
    const total = list_product.reduce((s, l) => s + l.price, 0)
    return {
      _id: oid(), bill_name: bill, list_product, total_price: total,
      type_order: '1', status: '1', discount: 0,
      customer_ref: custRef || null, coupon_ref: null,
      payment_method: method, points_used: 0, cash_received: total, change: 0,
      earnedPoints: 0, datetime: now
    }
  }
  const orders = [
    mkOrder('โต๊ะ 1', [[products[1], 2], [products[3], 1]], 'cash', customers[0]._id),
    mkOrder('กลับบ้าน', [[products[0], 1]], 'qr'),
    mkOrder('โต๊ะ 3', [[products[2], 2], [products[1], 1]], 'cash'),
    mkOrder('คุณสมหญิง', [[products[1], 1], [products[0], 2]], 'transfer', customers[1]._id),
    mkOrder('โต๊ะ 2', [[products[0], 3]], 'qr'),
    mkOrder('โต๊ะ 5', [[products[3], 2], [products[2], 1]], 'cash')
  ]
  const shifts = []
  const crm_messages = []
  const cash_moves = []

  const settings = {
    // รายละเอียดร้าน
    shop_name: 'BREW POS',
    business_type: 'ร้านกาแฟ / เครื่องดื่ม',
    branch: 'สาขาสำนักงานใหญ่',
    branch_code: '00000', // 00000 = สำนักงานใหญ่
    owner_tel: '0800000000',
    partner: '',
    logo: '', // path รูปโลโก้ (uploads/xxx)
    show_logo: true, // แสดงรูปในหน้าขาย/ใบเสร็จ
    tax_id: '0105500000000',
    // ข้อมูลติดต่อ
    email: 'demo01@brewpos.local',
    tel: '02-000-0000',
    address: '123 ถนนกาแฟ',
    country: 'ประเทศไทย',
    province: 'กรุงเทพมหานคร',
    district: 'เขตอเมริกาโน่',
    subdistrict: 'แขวงลาเต้',
    postcode: '10110',
    fax: '',
    line_id: '',
    promptpay_id: '0812345678', // เบอร์/บัตรปชช. สำหรับรับเงิน PromptPay
    // ใบเสร็จ & แต้ม
    receipt_footer: 'ขอบคุณที่ใช้บริการ แล้วพบกันใหม่ ☕',
    point_per_baht: 10, // ใช้จ่ายกี่บาทได้ 1 แต้ม
    currency: '฿',
    auto_print: true, // พิมพ์ใบเสร็จอัตโนมัติหลังชำระเงิน
    // ---- เครื่องพิมพ์ (ในแอป APK: จับคู่ Bluetooth Classic แล้วเลือกใน ตั้งค่า) ----
    printer_slip_address: '', // เครื่องพิมพ์สลิป (เช่น VPOS VP58BT)
    printer_slip_name: '',
    printer_sticker_address: '', // เครื่องพิมพ์สติกเกอร์/ฉลาก (เช่น CLABEL 230B)
    printer_sticker_name: '',
    printer_sticker_dpi: 300, // CLABEL 230B = 300dpi
    // ---- วิธีชำระเงิน (เปิด/ปิด/แก้ชื่อ/เพิ่มเองได้) ----
    payment_methods: [
      { key: 'cash', label: 'เงินสด', icon: 'mdi-cash', kind: 'cash', enabled: true, builtin: true },
      { key: 'qr', label: 'QR พร้อมเพย์', icon: 'mdi-qrcode', kind: 'qr', enabled: true, builtin: true },
      { key: 'transfer', label: 'โอนเงิน', icon: 'mdi-bank', kind: 'transfer', enabled: true, builtin: true },
      { key: 'card', label: 'บัตรเครดิต/เดบิต', icon: 'mdi-credit-card-outline', kind: 'other', enabled: true, builtin: true },
      { key: 'split', label: 'แยกชำระ', icon: 'mdi-call-split', kind: 'split', enabled: true, builtin: true },
      { key: 'credit', label: 'เงินเชื่อ', icon: 'mdi-account-clock', kind: 'credit', enabled: true, builtin: true }
    ],
    // ---- VAT / ภาษี ----
    vat_enabled: false,
    vat_rate: 7,
    vat_inclusive: true, // ราคารวม VAT แล้ว (ถอด VAT ออกมาแสดง) หรือบวกเพิ่ม
    // ---- สติกเกอร์ออเดอร์ (ฉลากติดแก้ว/ถุง) ----
    sticker_enabled: true,
    sticker_auto: false, // พิมพ์สติกเกอร์อัตโนมัติหลังชำระเงิน
    sticker_size: '50x40', // ขนาดฉลาก (มม.) 40x30 / 50x30 / 50x40
    sticker_per_qty: true, // 1 ดวง/แก้ว (ตามจำนวน) หรือ 1 ดวง/รายการ
    sticker_show_logo: true,
    sticker_show_options: true,
    sticker_show_price: true,
    sticker_show_datetime: true,
    // ---- LINE CRM ----
    line_enabled: false,
    line_basic_id: '@brewpos', // LINE OA Basic ID (ขึ้นต้น @)
    line_oa_name: 'BREW POS',
    line_channel_token: '', // LINE Messaging API channel access token (ว่าง = โหมดจำลอง)
    line_notify_purchase: true, // แจ้งแต้ม/ใบเสร็จเข้า LINE หลังซื้อ
    line_welcome: 'ยินดีต้อนรับสู่ BREW POS 🎉 สะสมแต้มแลกของรางวัลได้เลย!'
  }

  return { roles, levels, employees, units, categories, option_groups, products, customers, coupons, stock, orders, shifts, crm_messages, cash_moves, settings }
}

function load() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
    } catch (e) {
      console.error('db.json is corrupt, reseeding:', e.message)
    }
  }
  const data = seed()
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
  return data
}

let data = load()

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

function reseed() {
  const fresh = seed()
  Object.keys(data).forEach(k => delete data[k])
  Object.assign(data, fresh)
  save()
  return data
}

module.exports = {
  data,
  save,
  reseed,
  oid,
  ROLE_CASHIER_ID,
  LEVEL_DEFAULT_ID
}
