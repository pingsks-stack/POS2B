// Rebuilt backend for the BrewPos frontend.
// Express + JWT + JSON-file storage. No native build steps required.

const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const multer = require('multer')

const db = require('./db')

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'brewpos-dev-secret-change-me'

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ---- image uploads ---------------------------------------------------------
const UPLOAD_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, db.oid() + ext)
  }
})
const upload = multer({ storage })

// Serve uploaded images from the root, e.g. http://localhost:5000/uploads/xxx.jpg
app.use('/uploads', express.static(UPLOAD_DIR))

// ---- helpers ---------------------------------------------------------------
const { data, save, oid } = db

function findById(coll, id) {
  return data[coll].find(x => x._id === id)
}

function populateRole(emp) {
  if (!emp) return emp
  const role = findById('roles', emp.ref_id_role) || { _id: emp.ref_id_role, position: 'member' }
  const { password, ...rest } = emp
  return { ...rest, ref_id_role: role }
}

function populateProduct(p) {
  // expand attached reusable option groups (by id) + any per-product custom options
  const fromGroups = (p.option_group_ids || [])
    .map(id => findById('option_groups', id))
    .filter(Boolean)
    .map(g => ({ name: g.name, multiple: g.multiple, required: g.required, choices: g.choices }))
  const custom = Array.isArray(p.options) ? p.options : []
  return {
    ...p,
    ref_cate_id: findById('categories', p.ref_cate_id) || p.ref_cate_id,
    ref_uid: findById('units', p.ref_uid) || p.ref_uid,
    option_group_ids: p.option_group_ids || [],
    custom_options: custom, // raw per-product options (for the edit form)
    options: [...fromGroups, ...custom] // resolved options (for the seller)
  }
}

function populateCustomer(c) {
  return {
    ...c,
    ref_level_id: findById('levels', c.ref_level_id) || c.ref_level_id
  }
}

// Auto-upgrade a customer's level based on their points (promote only — never
// demote). Picks the highest level whose min_point <= the customer's points.
function autoLevel(cust) {
  if (!cust) return
  const levels = data.levels || []
  const pts = Number(cust.point) || 0
  let best = null
  for (const l of levels) {
    const mp = Number(l.min_point) || 0
    if (pts >= mp && (!best || mp > (Number(best.min_point) || 0))) best = l
  }
  if (!best) return
  const curId = cust.ref_level_id && cust.ref_level_id._id ? cust.ref_level_id._id : cust.ref_level_id
  const cur = findById('levels', curId)
  const curMin = cur ? (Number(cur.min_point) || 0) : -1
  if ((Number(best.min_point) || 0) > curMin) cust.ref_level_id = best._id
}

// ---- auth middleware -------------------------------------------------------
function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  if (!token) return res.status(401).json({ message: 'No token' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// ===========================================================================
// API router (mounted at /api and /api/api to absorb the frontend's
// double-prefix bug on the employee endpoints).
// ===========================================================================
const api = express.Router()

// ---- AUTHENTICATION --------------------------------------------------------
api.post('/authen/login', (req, res) => {
  // frontend sends { data: { username, password } }
  const body = req.body && req.body.data ? req.body.data : req.body
  const { username, password } = body || {}
  const user = data.employees.find(u => u.username === username)
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
  }
  const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d'
  })
  res.json({ token, status: 200, message: 'ok' })
})

// PIN login: quick numeric login for staff at the counter.
api.post('/authen/pin', (req, res) => {
  const body = req.body && req.body.data ? req.body.data : req.body
  const pin = String((body && body.pin) || '')
  if (!pin) return res.status(401).json({ message: 'กรุณากรอก PIN' })
  const user = data.employees.find(u => u.pin && String(u.pin) === pin)
  if (!user) return res.status(401).json({ message: 'PIN ไม่ถูกต้อง' })
  const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, status: 200, message: 'ok' })
})

api.get('/authen/user', auth, (req, res) => {
  const user = findById('employees', req.user._id)
  // 401 (not 404) so the auth module treats a stale/invalid token as logged-out
  if (!user) return res.status(401).json({ message: 'Session expired, please log in again' })
  res.json({ user: populateRole(user) })
})

// ---- generic CRUD factory --------------------------------------------------
function crud(router, name, coll, opts = {}) {
  const populate = opts.populate || (x => x)

  router.get('/' + name, (req, res) => {
    res.json(data[coll].map(populate))
  })

  router.get('/' + name + '/:id', (req, res) => {
    const item = findById(coll, req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(populate(item))
  })

  router.post('/' + name, (req, res) => {
    const item = { _id: oid(), datetime: new Date().toISOString(), ...req.body }
    data[coll].push(item)
    save()
    res.json({ status: 200, message: 'created', data: populate(item) })
  })

  router.put('/' + name + '/:id', (req, res) => {
    const item = findById(coll, req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    Object.assign(item, req.body, { _id: item._id })
    save()
    res.json({ status: 200, message: 'updated', data: populate(item) })
  })

  router.delete('/' + name + '/:id', (req, res) => {
    const idx = data[coll].findIndex(x => x._id === req.params.id)
    if (idx === -1) return res.status(404).json({ message: 'Not found' })
    data[coll].splice(idx, 1)
    save()
    res.json({ status: 200, message: 'deleted' })
  })
}

// ---- PRODUCT (special POST: handles both image upload and JSON create) ------
api.get('/product', (req, res) => res.json(data.products.map(populateProduct)))
api.get('/product/:id', (req, res) => {
  const p = findById('products', req.params.id)
  if (!p) return res.status(404).json({ message: 'Not found' })
  res.json(populateProduct(p))
})
api.post('/product', upload.any(), (req, res) => {
  // Image upload mode: frontend posts FormData with field "file", expects { url }
  if (req.files && req.files.length) {
    const f = req.files[0]
    return res.json({ url: 'uploads/' + f.filename })
  }
  // Create mode: JSON product payload
  const item = { _id: oid(), datetime: new Date().toISOString(), ...req.body }
  data.products.push(item)
  save()
  res.json({ status: 200, message: 'created', data: populateProduct(item) })
})
api.put('/product/:id', (req, res) => {
  const p = findById('products', req.params.id)
  if (!p) return res.status(404).json({ message: 'Not found' })
  Object.assign(p, req.body, { _id: p._id })
  save()
  res.json({ status: 200, message: 'updated', data: populateProduct(p) })
})
api.delete('/product/:id', (req, res) => {
  const idx = data.products.findIndex(x => x._id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  data.products.splice(idx, 1)
  save()
  res.json({ status: 200, message: 'deleted' })
})

// ---- the rest of the resources --------------------------------------------
crud(api, 'category', 'categories')
crud(api, 'unit', 'units')
crud(api, 'optiongroup', 'option_groups')
// Custom customer PUT: when called with auto_level, recompute the level from
// points (used by the point-management screen). The normal edit form omits the
// flag, so a manually chosen level is respected.
api.put('/customer/:id', (req, res) => {
  const c = findById('customers', req.params.id)
  if (!c) return res.status(404).json({ message: 'Not found' })
  const body = { ...req.body }
  delete body.auto_level
  Object.assign(c, body, { _id: c._id })
  if (req.body.auto_level) autoLevel(c)
  save()
  res.json({ status: 200, message: 'updated', data: populateCustomer(c) })
})
crud(api, 'customer', 'customers', { populate: populateCustomer })
crud(api, 'coupon', 'coupons')
crud(api, 'level', 'levels')
crud(api, 'role', 'roles')
crud(api, 'stock', 'stock')

// ---- EMPLOYEE (custom: hash password, populate role, default role) ---------
api.get('/employee', (req, res) => res.json(data.employees.map(populateRole)))
api.get('/employee/:id', (req, res) => {
  const e = findById('employees', req.params.id)
  if (!e) return res.status(404).json({ message: 'Not found' })
  res.json(populateRole(e))
})
api.post('/employee', (req, res) => {
  const body = { ...req.body }
  if (body.password) body.password = bcrypt.hashSync(body.password, 8)
  if (!body.ref_id_role) body.ref_id_role = db.ROLE_CASHIER_ID
  const emp = { _id: oid(), datetime: new Date().toISOString(), ...body }
  data.employees.push(emp)
  save()
  res.json({ status: 200, message: 'created', data: populateRole(emp) })
})
api.put('/employee/:id', (req, res) => {
  const emp = findById('employees', req.params.id)
  if (!emp) return res.status(404).json({ message: 'Not found' })
  const body = { ...req.body }
  // only change password when a new non-empty one is supplied
  if (body.password) body.password = bcrypt.hashSync(body.password, 8)
  else delete body.password
  Object.assign(emp, body, { _id: emp._id })
  save()
  res.json({ status: 200, message: 'updated', data: populateRole(emp) })
})
api.delete('/employee/:id', (req, res) => {
  const idx = data.employees.findIndex(x => x._id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  data.employees.splice(idx, 1)
  save()
  res.json({ status: 200, message: 'deleted' })
})

// ---- ORDER (create decrements stock; list returned newest first) ----------
api.get('/order', (req, res) => {
  res.json([...data.orders].reverse())
})
api.post('/order', (req, res) => {
  const order = {
    _id: oid(),
    bill_name: req.body.bill_name || '',
    list_product: req.body.list_product || [],
    total_price: req.body.total_price || 0,
    type_order: req.body.type_order || '1',
    status: req.body.status || '1',
    discount: req.body.discount || 0,
    customer_ref: req.body.customer_ref || null,
    coupon_ref: req.body.coupon_ref || null,
    payment_method: req.body.payment_method || 'cash',
    payments: Array.isArray(req.body.payments) ? req.body.payments : [],
    ref_emp_id: req.body.ref_emp_id || null,
    points_used: Number(req.body.points_used) || 0,
    cash_received: Number(req.body.cash_received) || 0,
    change: Number(req.body.change) || 0,
    datetime: new Date().toISOString()
  }

  // running queue number per day
  const todayStr = new Date(order.datetime).toDateString()
  order.queue_no = data.orders.filter(o => new Date(o.datetime).toDateString() === todayStr).length + 1

  const isPaid = String(order.status) === '1'
  // credit/unpaid bills (status 3) still hand over goods -> commit stock & coupon
  const isCommitted = isPaid || String(order.status) === '3'
  let earnedPoints = 0

  if (isCommitted) {
    // aggregate quantity per product (same product may appear on multiple lines
    // with different options)
    const qtyByProduct = {}
    for (const line of order.list_product) {
      qtyByProduct[line.ref_pro_id] = (qtyByProduct[line.ref_pro_id] || 0) + (line.qty || 0)
    }
    // stock check
    for (const pid of Object.keys(qtyByProduct)) {
      const p = findById('products', pid)
      if (p && typeof p.stock === 'number' && qtyByProduct[pid] > p.stock) {
        return res.status(400).json({
          message: `สินค้า "${p.product_name}" มีไม่พอ (เหลือ ${p.stock})`
        })
      }
    }
    // decrement stock
    for (const pid of Object.keys(qtyByProduct)) {
      const p = findById('products', pid)
      if (p && typeof p.stock === 'number') p.stock = Math.max(0, p.stock - qtyByProduct[pid])
    }
    // consume coupon
    if (order.coupon_ref) {
      const c = findById('coupons', order.coupon_ref)
      if (c && Number(c.num_use) > 0) c.num_use = Number(c.num_use) - 1
    }
    // loyalty points: redeem first (1 pt = 1 baht), then earn on amount paid
    // (only for actually-paid bills, not credit/unpaid)
    if (isPaid && order.customer_ref) {
      const cust = findById('customers', order.customer_ref)
      if (cust) {
        const balance = Number(cust.point) || 0
        if (order.points_used > balance) {
          return res.status(400).json({ message: `แต้มไม่พอ (มี ${balance} แต้ม)` })
        }
        const level = findById('levels', cust.ref_level_id)
        const rate = level && level.point_rate ? Number(level.point_rate) : 1
        const perBaht = (data.settings && Number(data.settings.point_per_baht)) || 10
        earnedPoints = Math.floor((Number(order.total_price) || 0) / perBaht) * rate
        cust.point = balance - order.points_used + earnedPoints
        autoLevel(cust)
        order.newBalance = cust.point
        // notify the member on LINE (real push if token set, else simulated)
        const st = data.settings || {}
        if (st.line_enabled && st.line_notify_purchase && cust.line_user_id) {
          const msg =
            `🧾 ${st.shop_name || 'BREW POS'}\n` +
            `ขอบคุณที่อุดหนุนค่ะ\n` +
            `ยอดชำระ ${Number(order.total_price).toFixed(2)} บาท\n` +
            `ได้รับ +${earnedPoints} แต้ม · คงเหลือ ${cust.point} แต้ม`
          sendLine(cust.line_user_id, msg, 'purchase', cust._id)
        }
      }
    } else {
      order.points_used = 0
    }
  }

  order.earnedPoints = earnedPoints
  data.orders.push(order)
  save()
  res.json({ status: 200, message: 'created', earnedPoints, data: order })
})
api.put('/order/:id', (req, res) => {
  const o = findById('orders', req.params.id)
  if (!o) return res.status(404).json({ message: 'Not found' })
  Object.assign(o, req.body, { _id: o._id })
  save()
  res.json({ status: 200, message: 'updated', data: o })
})
api.delete('/order/:id', (req, res) => {
  const idx = data.orders.findIndex(x => x._id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  data.orders.splice(idx, 1)
  save()
  res.json({ status: 200, message: 'deleted' })
})

// Void / refund a paid bill: restore stock, reverse loyalty points, return coupon.
api.post('/order/:id/void', (req, res) => {
  const o = findById('orders', req.params.id)
  if (!o) return res.status(404).json({ message: 'Not found' })
  if (String(o.status) === '2') return res.status(400).json({ message: 'บิลนี้ถูกยกเลิกแล้ว' })
  const wasPaid = String(o.status) === '1'
  if (wasPaid) {
    // restore stock
    const qtyByProduct = {}
    for (const line of o.list_product || []) {
      qtyByProduct[line.ref_pro_id] = (qtyByProduct[line.ref_pro_id] || 0) + (line.qty || 0)
    }
    for (const pid of Object.keys(qtyByProduct)) {
      const p = findById('products', pid)
      if (p && typeof p.stock === 'number') p.stock += qtyByProduct[pid]
    }
    // reverse coupon usage
    if (o.coupon_ref) {
      const c = findById('coupons', o.coupon_ref)
      if (c) c.num_use = (Number(c.num_use) || 0) + 1
    }
    // reverse loyalty points (remove earned, give back redeemed)
    if (o.customer_ref) {
      const cust = findById('customers', o.customer_ref)
      if (cust) {
        cust.point = Math.max(0, (Number(cust.point) || 0) - (o.earnedPoints || 0) + (o.points_used || 0))
      }
    }
  }
  o.status = '2'
  o.void_reason = req.body.reason || ''
  o.voided_at = new Date().toISOString()
  save()
  res.json({ status: 200, message: 'voided', data: o })
})

// Settle a credit/unpaid bill (status 3 -> paid). Stock already committed;
// award loyalty points now.
api.post('/order/:id/settle', (req, res) => {
  const o = findById('orders', req.params.id)
  if (!o) return res.status(404).json({ message: 'Not found' })
  if (String(o.status) !== '3') return res.status(400).json({ message: 'ไม่ใช่บิลเงินเชื่อ' })
  o.status = '1'
  o.payment_method = req.body.payment_method || o.payment_method || 'cash'
  if (Array.isArray(req.body.payments)) o.payments = req.body.payments
  o.cash_received = Number(req.body.cash_received) || Number(o.total_price) || 0
  o.change = Number(req.body.change) || 0
  o.settled_at = new Date().toISOString()
  let earnedPoints = 0
  if (o.customer_ref) {
    const cust = findById('customers', o.customer_ref)
    if (cust) {
      const level = findById('levels', cust.ref_level_id)
      const rate = level && level.point_rate ? Number(level.point_rate) : 1
      const perBaht = (data.settings && Number(data.settings.point_per_baht)) || 10
      earnedPoints = Math.floor((Number(o.total_price) || 0) / perBaht) * rate
      cust.point = (Number(cust.point) || 0) + earnedPoints
      autoLevel(cust)
      o.earnedPoints = earnedPoints
    }
  }
  save()
  res.json({ status: 200, earnedPoints, data: o })
})

// ---- CASH MOVES (money in/out of the drawer beyond sales) ------------------
api.get('/cashmove', (req, res) => res.json([...data.cash_moves].reverse()))
api.post('/cashmove', (req, res) => {
  const m = {
    _id: oid(),
    type: req.body.type === 'out' ? 'out' : 'in',
    amount: Number(req.body.amount) || 0,
    note: req.body.note || '',
    ref_emp_id: req.body.ref_emp_id || null,
    datetime: new Date().toISOString()
  }
  data.cash_moves.push(m)
  save()
  res.json({ status: 200, data: m })
})

// ---- SHIFT (cash drawer open/close + Z-report) -----------------------------
function shiftReport(shift) {
  const from = new Date(shift.open_time).getTime()
  const to = shift.close_time ? new Date(shift.close_time).getTime() : Date.now()
  const movesIn = (data.cash_moves || []).filter(m => {
    const t = new Date(m.datetime).getTime()
    return m.type === 'in' && t >= from && t <= to
  }).reduce((s, m) => s + (Number(m.amount) || 0), 0)
  const movesOut = (data.cash_moves || []).filter(m => {
    const t = new Date(m.datetime).getTime()
    return m.type === 'out' && t >= from && t <= to
  }).reduce((s, m) => s + (Number(m.amount) || 0), 0)
  const inRange = data.orders.filter(o => {
    if (String(o.status) !== '1') return false
    const t = new Date(o.datetime).getTime()
    return t >= from && t <= to
  })
  const sumBy = m => inRange.reduce((s, o) => {
    if (Array.isArray(o.payments) && o.payments.length) {
      return s + o.payments.filter(p => p.method === m).reduce((a, p) => a + (Number(p.amount) || 0), 0)
    }
    return s + ((o.payment_method || 'cash') === m ? Number(o.total_price) || 0 : 0)
  }, 0)
  const cash = sumBy('cash')
  const qr = sumBy('qr')
  const transfer = sumBy('transfer')
  const total = cash + qr + transfer
  const expected_cash = (Number(shift.opening_cash) || 0) + cash + movesIn - movesOut
  return {
    bill_count: inRange.length,
    sales_total: total,
    sales_cash: cash,
    sales_qr: qr,
    sales_transfer: transfer,
    cash_in: movesIn,
    cash_out: movesOut,
    expected_cash,
    counted_cash: shift.closing_cash != null ? Number(shift.closing_cash) : null,
    diff: shift.closing_cash != null ? Number(shift.closing_cash) - expected_cash : null
  }
}

api.get('/shift/current', (req, res) => {
  const open = [...data.shifts].reverse().find(s => s.status === 'open')
  if (!open) return res.json({ shift: null })
  res.json({ shift: { ...open, report: shiftReport(open) } })
})
api.get('/shift', (req, res) => {
  res.json([...data.shifts].reverse().map(s => ({ ...s, report: shiftReport(s) })))
})
api.post('/shift/open', (req, res) => {
  if (data.shifts.find(s => s.status === 'open')) {
    return res.status(400).json({ message: 'มีรอบขายที่เปิดอยู่แล้ว' })
  }
  const shift = {
    _id: oid(),
    opening_cash: Number(req.body.opening_cash) || 0,
    ref_emp_id: req.body.ref_emp_id || null,
    open_time: new Date().toISOString(),
    close_time: null,
    closing_cash: null,
    status: 'open'
  }
  data.shifts.push(shift)
  save()
  res.json({ status: 200, message: 'opened', data: shift })
})
api.post('/shift/close', (req, res) => {
  const shift = data.shifts.find(s => s._id === req.body.shift_id && s.status === 'open') ||
    [...data.shifts].reverse().find(s => s.status === 'open')
  if (!shift) return res.status(400).json({ message: 'ไม่มีรอบขายที่เปิดอยู่' })
  shift.close_time = new Date().toISOString()
  shift.closing_cash = Number(req.body.closing_cash) || 0
  shift.status = 'closed'
  save()
  res.json({ status: 200, message: 'closed', data: { ...shift, report: shiftReport(shift) } })
})

// ---- generic image upload (logo, etc.) -------------------------------------
api.post('/upload', upload.any(), (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ message: 'no file' })
  res.json({ url: 'uploads/' + req.files[0].filename })
})

// ---- LINE CRM --------------------------------------------------------------
// Push a LINE message. Real push if a channel token is set, otherwise simulate
// and log it (so the feature is testable without a live LINE OA).
async function sendLine(lineUserId, text, type, customerRef) {
  const token = data.settings && data.settings.line_channel_token
  const rec = {
    _id: oid(),
    customer_ref: customerRef || null,
    line_user_id: lineUserId || null,
    type: type || 'manual',
    text,
    status: 'simulated',
    datetime: new Date().toISOString()
  }
  data.crm_messages.push(rec)
  if (token && lineUserId && typeof fetch === 'function') {
    try {
      const r = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text }] })
      })
      rec.status = r.ok ? 'sent' : 'failed'
      if (!r.ok) rec.error = 'HTTP ' + r.status
    } catch (e) {
      rec.status = 'failed'
      rec.error = String(e.message || e)
    }
  }
  save()
  return rec
}

api.get('/crm/messages', (req, res) => res.json([...data.crm_messages].reverse()))

api.post('/crm/send', async (req, res) => {
  let lineId = req.body.line_user_id
  const cust = req.body.customer_ref ? findById('customers', req.body.customer_ref) : null
  if (cust && cust.line_user_id) lineId = cust.line_user_id
  if (!lineId) return res.status(400).json({ message: 'ลูกค้ายังไม่ได้เชื่อม LINE' })
  const rec = await sendLine(lineId, req.body.text || '', 'manual', cust ? cust._id : null)
  res.json({ status: 200, data: rec })
})

api.post('/crm/broadcast', async (req, res) => {
  const text = req.body.text || ''
  const targets = data.customers.filter(c => c.line_user_id)
  const results = []
  for (const c of targets) {
    results.push(await sendLine(c.line_user_id, text, 'broadcast', c._id))
  }
  res.json({ status: 200, sent: results.length, simulated: !data.settings.line_channel_token })
})

// ---- SETTINGS (singleton) --------------------------------------------------
api.get('/settings', (req, res) => res.json(data.settings || {}))
api.put('/settings', (req, res) => {
  data.settings = Object.assign({}, data.settings, req.body)
  save()
  res.json({ status: 200, message: 'updated', data: data.settings })
})

// Mount at both prefixes.
app.use('/api', api)
app.use('/api/api', api) // absorbs employee.vue's "/api/employee" bug

// ---- misc ------------------------------------------------------------------
app.get('/', (req, res) => res.json({ name: 'brewpos backend', status: 'ok' }))

app.use((req, res) => res.status(404).json({ message: 'Route not found: ' + req.originalUrl }))

app.listen(PORT, () => {
  console.log(`BrewPos backend running on http://localhost:${PORT}`)
  console.log(`API base: http://localhost:${PORT}/api`)
  console.log('Test logins:  admin/admin123 (admin)   cashier/cashier123 (cashier)')
})
