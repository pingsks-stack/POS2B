// ===========================================================================
// IN-APP "BACKEND" — makes the tablet fully standalone (no central server).
//
// When the app runs in standalone mode (Capacitor APK, a STANDALONE build, or
// an explicit override) this plugin installs a custom axios adapter that serves
// every /api/... request locally from data persisted in localStorage.
// It is a faithful port of apps/backend (db.js seed + server.js routes).
//
// In normal web/dev mode it does nothing, so the app still talks to the real
// Express backend.
// ===========================================================================

const DB_KEY = 'brewpos_db_v1'

// ---- standalone detection --------------------------------------------------
function isStandalone() {
  if (typeof window === 'undefined') return false
  try {
    // 1) baked into the APK / static app build
    if (process.env.STANDALONE === '1') return true
    // 2) running inside the Capacitor native shell
    const cap = window.Capacitor
    if (cap && (cap.isNativePlatform ? cap.isNativePlatform() : cap.isNative)) return true
    // 3) manual override (used by e2e tests and for trying it in a browser)
    if (window.localStorage && window.localStorage.getItem('STANDALONE') === '1') return true
    if (window.location && /[?&]standalone=1/.test(window.location.search)) return true
  } catch (e) {}
  return false
}

// ---- ids / time ------------------------------------------------------------
function oid() {
  let s = ''
  const h = '0123456789abcdef'
  for (let i = 0; i < 24; i++) s += h[Math.floor(Math.random() * 16)]
  return s
}
const nowISO = () => new Date().toISOString()

const ROLE_CASHIER_ID = '60e274847a205d160021ffbe'
const LEVEL_DEFAULT_ID = '60e439b7c7d6ae35548c7b62'

// ---- seed (ported from apps/backend/db.js; passwords kept in plaintext       )
//      because this is a local, single-device store — no network exposure.    )
function seed() {
  const now = nowISO()

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

  const employees = [
    {
      _id: '60e2700000000000000000b1',
      pname: 'นาย', fname: 'ผู้ดูแล', lname: 'ระบบ',
      username: 'admin', password: 'admin123', pin: '1111',
      idcard: '1100000000001', birthday: '1990-01-01',
      tel: '0800000001', email: 'admin@brewpos.local',
      address: 'สำนักงานใหญ่',
      ref_id_role: roles[0]._id, datetime: now
    },
    {
      _id: '60e2700000000000000000b2',
      pname: 'นางสาว', fname: 'แคชเชียร์', lname: 'หน้าร้าน',
      username: 'cashier', password: 'cashier123', pin: '2222',
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

  // Reusable option groups — created once, attached to products by id.
  const option_groups = [
    { _id: oid(), name: 'ประเภท', multiple: false, required: true, choices: [{ label: 'ร้อน', price: 0 }, { label: 'เย็น', price: 10 }, { label: 'ปั่น', price: 15 }], datetime: now },
    { _id: oid(), name: 'ขนาด', multiple: false, required: true, choices: [{ label: 'ปกติ', price: 0 }, { label: 'แก้วใหญ่', price: 10 }], datetime: now },
    { _id: oid(), name: 'ความหวาน', multiple: false, required: false, choices: [{ label: 'หวานปกติ', price: 0 }, { label: 'หวานน้อย', price: 0 }, { label: 'ไม่หวาน', price: 0 }], datetime: now },
    { _id: oid(), name: 'เพิ่มเติม', multiple: true, required: false, choices: [{ label: 'เพิ่มช็อต', price: 15 }, { label: 'วิปครีม', price: 10 }, { label: 'ไข่มุก', price: 10 }], datetime: now }
  ]
  const drinkGroupIds = option_groups.map(g => g._id)

  const products = [
    { _id: oid(), product_name: 'อเมริกาโน่', price: 50, price_cost: 20, stock: 100, img: '', ref_cate_id: categories[0]._id, ref_uid: units[0]._id, datetime: now, option_group_ids: drinkGroupIds, options: [] },
    { _id: oid(), product_name: 'ลาเต้', price: 60, price_cost: 25, stock: 100, img: '', ref_cate_id: categories[0]._id, ref_uid: units[0]._id, datetime: now, option_group_ids: drinkGroupIds, options: [] },
    { _id: oid(), product_name: 'ชาเขียว', price: 55, price_cost: 22, stock: 80, img: '', ref_cate_id: categories[1]._id, ref_uid: units[0]._id, datetime: now, option_group_ids: drinkGroupIds, options: [] },
    { _id: oid(), product_name: 'เค้กช็อกโกแลต', price: 75, price_cost: 35, stock: 30, img: '', ref_cate_id: categories[2]._id, ref_uid: units[1]._id, datetime: now, option_group_ids: [], options: [] }
  ]

  const customers = [
    { _id: oid(), pname: 'นาย', fname: 'สมชาย', lname: 'ใจดี', birthday: '1992-03-15', tel: '0811111111', email: 'somchai@mail.com', address: 'กรุงเทพฯ', point: 120, ref_level_id: levels[1]._id, datetime: now, line_user_id: 'Udemo000000000000000000000somchai', line_name: 'สมชาย (LINE)' },
    { _id: oid(), pname: 'นางสาว', fname: 'สมหญิง', lname: 'รักดี', birthday: '1998-08-20', tel: '0822222222', email: 'somying@mail.com', address: 'นนทบุรี', point: 40, ref_level_id: levels[0]._id, datetime: now }
  ]

  const coupons = [
    { _id: oid(), codename: 'WELCOME10', discount: 10, num_use: 100, exp: '2027-12-31', ref_emp_id_by: employees[0]._id, ref_emp_id: employees[0]._id, datetime: now }
  ]

  const stock = products.map(p => ({ _id: oid(), ref_pro_id: p._id, qty_max: p.stock, qty_min: 10, datetime: now }))

  const mkOrder = (bill, lines, method, custRef) => {
    const list_product = lines.map(([p, qty]) => ({ ref_pro_id: p._id, name: p.product_name, qty, price: p.price * qty, options: [], unit: p.price }))
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

  const settings = {
    shop_name: 'BREW POS', business_type: 'ร้านกาแฟ / เครื่องดื่ม', branch: 'สาขาสำนักงานใหญ่',
    branch_code: '00000', owner_tel: '0800000000', partner: '', logo: '', show_logo: true,
    tax_id: '0105500000000', email: 'demo01@brewpos.local', tel: '02-000-0000', address: '123 ถนนกาแฟ',
    country: 'ประเทศไทย', province: 'กรุงเทพมหานคร', district: 'เขตอเมริกาโน่', subdistrict: 'แขวงลาเต้',
    postcode: '10110', fax: '', line_id: '', promptpay_id: '0812345678',
    receipt_footer: 'ขอบคุณที่ใช้บริการ แล้วพบกันใหม่ ☕', point_per_baht: 10, currency: '฿', auto_print: true,
    printer_slip_address: '', printer_slip_name: '', printer_sticker_address: '', printer_sticker_name: '', printer_sticker_dpi: 300,
    payment_methods: [
      { key: 'cash', label: 'เงินสด', icon: 'mdi-cash', kind: 'cash', enabled: true, builtin: true },
      { key: 'qr', label: 'QR พร้อมเพย์', icon: 'mdi-qrcode', kind: 'qr', enabled: true, builtin: true },
      { key: 'transfer', label: 'โอนเงิน', icon: 'mdi-bank', kind: 'transfer', enabled: true, builtin: true },
      { key: 'card', label: 'บัตรเครดิต/เดบิต', icon: 'mdi-credit-card-outline', kind: 'other', enabled: true, builtin: true },
      { key: 'split', label: 'แยกชำระ', icon: 'mdi-call-split', kind: 'split', enabled: true, builtin: true },
      { key: 'credit', label: 'เงินเชื่อ', icon: 'mdi-account-clock', kind: 'credit', enabled: true, builtin: true }
    ],
    vat_enabled: false, vat_rate: 7, vat_inclusive: true,
    sticker_enabled: true, sticker_auto: false, sticker_size: '50x40', sticker_per_qty: true,
    sticker_show_logo: true, sticker_show_options: true, sticker_show_price: true, sticker_show_datetime: true,
    line_enabled: false, line_basic_id: '@brewpos', line_oa_name: 'BREW POS', line_channel_token: '',
    line_notify_purchase: true, line_welcome: 'ยินดีต้อนรับสู่ BREW POS 🎉 สะสมแต้มแลกของรางวัลได้เลย!'
  }

  // Production-clean start: keep the catalog (products/options/categories), staff
  // logins and settings, but start with NO sample sales/members/coupons so the
  // shop opens at zero. (Demo orders/customers/coupons above are unused here.)
  void orders; void customers; void coupons
  return {
    roles, levels, employees, units, categories, option_groups, products, stock, settings,
    customers: [], coupons: [], orders: [], shifts: [], crm_messages: [], cash_moves: []
  }
}

// ---- persistence -----------------------------------------------------------
let data = null
function load() {
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  const fresh = seed()
  try { window.localStorage.setItem(DB_KEY, JSON.stringify(fresh)) } catch (e) {}
  return fresh
}
function save() {
  try { window.localStorage.setItem(DB_KEY, JSON.stringify(data)) } catch (e) {}
}
function reseed() {
  data = seed()
  save()
  return data
}

// ---- helpers (ported from server.js) ---------------------------------------
function findById(coll, id) { return data[coll].find(x => x._id === id) }
function populateRole(emp) {
  if (!emp) return emp
  const role = findById('roles', emp.ref_id_role) || { _id: emp.ref_id_role, position: 'member' }
  const { password, ...rest } = emp
  return { ...rest, ref_id_role: role }
}
function populateProduct(p) {
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
    custom_options: custom,
    options: [...fromGroups, ...custom]
  }
}
function populateCustomer(c) {
  return { ...c, ref_level_id: findById('levels', c.ref_level_id) || c.ref_level_id }
}

// Promote-only auto level based on points (highest level with min_point <= points).
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

// fake JWT: base64 of the payload (local only, no verification needed)
function makeToken(user) {
  const payload = JSON.stringify({ _id: user._id, username: user.username })
  try { return 'local.' + window.btoa(unescape(encodeURIComponent(payload))) } catch (e) { return 'local.' + payload }
}
function decodeToken(token) {
  if (!token) return null
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token
  if (!raw.startsWith('local.')) return null
  try { return JSON.parse(decodeURIComponent(escape(window.atob(raw.slice(6))))) } catch (e) { return null }
}

// simulated LINE push (records a message; never makes a network call offline)
function sendLine(lineUserId, text, type, customerRef) {
  data.crm_messages.push({
    _id: oid(), customer_ref: customerRef || null, line_user_id: lineUserId || null,
    type: type || 'manual', text, status: 'simulated', datetime: nowISO()
  })
}

function shiftReport(shift) {
  const from = new Date(shift.open_time).getTime()
  const to = shift.close_time ? new Date(shift.close_time).getTime() : Date.now()
  const sum = (kind) => (data.cash_moves || []).filter(m => {
    const t = new Date(m.datetime).getTime()
    return m.type === kind && t >= from && t <= to
  }).reduce((s, m) => s + (Number(m.amount) || 0), 0)
  const movesIn = sum('in'); const movesOut = sum('out')
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
  const cash = sumBy('cash'); const qr = sumBy('qr'); const transfer = sumBy('transfer')
  const expected_cash = (Number(shift.opening_cash) || 0) + cash + movesIn - movesOut
  return {
    bill_count: inRange.length, sales_total: cash + qr + transfer,
    sales_cash: cash, sales_qr: qr, sales_transfer: transfer,
    cash_in: movesIn, cash_out: movesOut, expected_cash,
    counted_cash: shift.closing_cash != null ? Number(shift.closing_cash) : null,
    diff: shift.closing_cash != null ? Number(shift.closing_cash) - expected_cash : null
  }
}

// ---- response helpers ------------------------------------------------------
function ok(d) { return { status: 200, data: d } }
function err(status, message) { return { status, data: { message } } }

// generic CRUD on a collection
function crud(coll, body, method, id, populate) {
  populate = populate || (x => x)
  if (method === 'get' && !id) return ok(data[coll].map(populate))
  if (method === 'get') { const i = findById(coll, id); return i ? ok(populate(i)) : err(404, 'Not found') }
  if (method === 'post') {
    const item = { _id: oid(), datetime: nowISO(), ...body }
    data[coll].push(item); save(); return ok({ status: 200, message: 'created', data: populate(item) })
  }
  if (method === 'put') {
    const i = findById(coll, id); if (!i) return err(404, 'Not found')
    Object.assign(i, body, { _id: i._id }); save(); return ok({ status: 200, message: 'updated', data: populate(i) })
  }
  if (method === 'delete') {
    const idx = data[coll].findIndex(x => x._id === id); if (idx === -1) return err(404, 'Not found')
    data[coll].splice(idx, 1); save(); return ok({ status: 200, message: 'deleted' })
  }
  return err(405, 'Method not allowed')
}

// ===========================================================================
// ROUTER — maps (method, path) to a handler. `path` has the /api prefix
// already stripped, e.g. "/order", "/order/123/void", "/authen/login".
// ===========================================================================
function route(method, path, body, headers, dataUrl) {
  const seg = path.replace(/^\/+|\/+$/g, '').split('/') // e.g. ['order','123','void']
  const head = seg[0] || ''
  const id = seg[1]
  const action = seg[2]

  // ---- AUTH ----
  if (head === 'authen' && id === 'login' && method === 'post') {
    const b = body && body.data ? body.data : body
    const user = data.employees.find(u => u.username === (b && b.username))
    if (!user || user.password !== (b && b.password)) return err(401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    return ok({ token: makeToken(user), status: 200, message: 'ok' })
  }
  if (head === 'authen' && id === 'pin' && method === 'post') {
    const b = body && body.data ? body.data : body
    const pin = String((b && b.pin) || '')
    if (!pin) return err(401, 'กรุณากรอก PIN')
    const user = data.employees.find(u => u.pin && String(u.pin) === pin)
    if (!user) return err(401, 'PIN ไม่ถูกต้อง')
    return ok({ token: makeToken(user), status: 200, message: 'ok' })
  }
  if (head === 'authen' && id === 'user' && method === 'get') {
    const payload = decodeToken(authHeader(headers))
    const user = payload && findById('employees', payload._id)
    if (!user) return err(401, 'Session expired, please log in again')
    return ok({ user: populateRole(user) })
  }

  // ---- PRODUCT (upload returns a data URL; create/list otherwise) ----
  if (head === 'product') {
    if (method === 'post' && !id && dataUrl) return ok({ url: dataUrl }) // image upload
    return crud('products', body, method, id, populateProduct)
  }

  // ---- ORDER ----
  if (head === 'order') {
    if (method === 'get' && !id) return ok([...data.orders].reverse())
    if (method === 'post' && !id) return createOrder(body)
    if (method === 'post' && action === 'void') return voidOrder(id, body)
    if (method === 'post' && action === 'settle') return settleOrder(id, body)
    return crud('orders', body, method, id)
  }

  // ---- SHIFT ----
  if (head === 'shift') {
    if (method === 'get' && id === 'current') {
      const open = [...data.shifts].reverse().find(s => s.status === 'open')
      return ok({ shift: open ? { ...open, report: shiftReport(open) } : null })
    }
    if (method === 'get' && !id) return ok([...data.shifts].reverse().map(s => ({ ...s, report: shiftReport(s) })))
    if (method === 'post' && id === 'open') {
      if (data.shifts.find(s => s.status === 'open')) return err(400, 'มีรอบขายที่เปิดอยู่แล้ว')
      const shift = { _id: oid(), opening_cash: Number(body.opening_cash) || 0, ref_emp_id: body.ref_emp_id || null, open_time: nowISO(), close_time: null, closing_cash: null, status: 'open' }
      data.shifts.push(shift); save(); return ok({ status: 200, message: 'opened', data: shift })
    }
    if (method === 'post' && id === 'close') {
      const shift = data.shifts.find(s => s._id === body.shift_id && s.status === 'open') || [...data.shifts].reverse().find(s => s.status === 'open')
      if (!shift) return err(400, 'ไม่มีรอบขายที่เปิดอยู่')
      shift.close_time = nowISO(); shift.closing_cash = Number(body.closing_cash) || 0; shift.status = 'closed'
      save(); return ok({ status: 200, message: 'closed', data: { ...shift, report: shiftReport(shift) } })
    }
  }

  // ---- CASH MOVES ----
  if (head === 'cashmove') {
    if (method === 'get') return ok([...data.cash_moves].reverse())
    if (method === 'post') {
      const m = { _id: oid(), type: body.type === 'out' ? 'out' : 'in', amount: Number(body.amount) || 0, note: body.note || '', ref_emp_id: body.ref_emp_id || null, datetime: nowISO() }
      data.cash_moves.push(m); save(); return ok({ status: 200, data: m })
    }
  }

  // ---- CRM ----
  if (head === 'crm') {
    if (id === 'messages' && method === 'get') return ok([...data.crm_messages].reverse())
    if (id === 'send' && method === 'post') {
      let lineId = body.line_user_id
      const cust = body.customer_ref ? findById('customers', body.customer_ref) : null
      if (cust && cust.line_user_id) lineId = cust.line_user_id
      if (!lineId) return err(400, 'ลูกค้ายังไม่ได้เชื่อม LINE')
      sendLine(lineId, body.text || '', 'manual', cust ? cust._id : null); save()
      return ok({ status: 200, data: data.crm_messages[data.crm_messages.length - 1] })
    }
    if (id === 'broadcast' && method === 'post') {
      const targets = data.customers.filter(c => c.line_user_id)
      targets.forEach(c => sendLine(c.line_user_id, body.text || '', 'broadcast', c._id)); save()
      return ok({ status: 200, sent: targets.length, simulated: true })
    }
  }

  // ---- SETTINGS ----
  if (head === 'settings') {
    if (method === 'get') return ok(data.settings || {})
    if (method === 'put') { data.settings = Object.assign({}, data.settings, body); save(); return ok({ status: 200, message: 'updated', data: data.settings }) }
  }

  // ---- generic upload (logo etc.) -> data URL ----
  if (head === 'upload' && method === 'post') {
    if (!dataUrl) return err(400, 'no file')
    return ok({ url: dataUrl })
  }

  // ---- EMPLOYEE (plaintext password locally) ----
  if (head === 'employee') {
    if (method === 'post' && !id) {
      const b = { ...body }; if (!b.ref_id_role) b.ref_id_role = ROLE_CASHIER_ID
      const emp = { _id: oid(), datetime: nowISO(), ...b }
      data.employees.push(emp); save(); return ok({ status: 200, message: 'created', data: populateRole(emp) })
    }
    if (method === 'put' && id) {
      const emp = findById('employees', id); if (!emp) return err(404, 'Not found')
      const b = { ...body }; if (!b.password) delete b.password
      Object.assign(emp, b, { _id: emp._id }); save(); return ok({ status: 200, message: 'updated', data: populateRole(emp) })
    }
    return crud('employees', body, method, id, populateRole)
  }

  // ---- remaining generic resources ----
  const map = {
    category: 'categories', unit: 'units', customer: 'customers',
    coupon: 'coupons', level: 'levels', role: 'roles', stock: 'stock',
    optiongroup: 'option_groups'
  }
  // customer PUT with auto_level -> recompute level from points (point screen)
  if (head === 'customer' && method === 'put' && id) {
    const c = findById('customers', id)
    if (!c) return err(404, 'Not found')
    const b = { ...body }
    delete b.auto_level
    Object.assign(c, b, { _id: c._id })
    if (body && body.auto_level) autoLevel(c)
    save()
    return ok({ status: 200, message: 'updated', data: populateCustomer(c) })
  }

  if (map[head]) {
    const pop = head === 'customer' ? populateCustomer : undefined
    return crud(map[head], body, method, id, pop)
  }

  return err(404, 'Route not found: ' + path)
}

function authHeader(headers) {
  if (!headers) return ''
  return headers.Authorization || headers.authorization ||
    (headers.common && (headers.common.Authorization || headers.common.authorization)) || ''
}

// ---- order create / void / settle (ported faithfully) ----------------------
function createOrder(b) {
  const order = {
    _id: oid(), bill_name: b.bill_name || '', list_product: b.list_product || [],
    total_price: b.total_price || 0, type_order: b.type_order || '1', status: b.status || '1',
    discount: b.discount || 0, customer_ref: b.customer_ref || null, coupon_ref: b.coupon_ref || null,
    payment_method: b.payment_method || 'cash', payments: Array.isArray(b.payments) ? b.payments : [],
    ref_emp_id: b.ref_emp_id || null, points_used: Number(b.points_used) || 0,
    cash_received: Number(b.cash_received) || 0, change: Number(b.change) || 0, datetime: nowISO()
  }
  const todayStr = new Date(order.datetime).toDateString()
  order.queue_no = data.orders.filter(o => new Date(o.datetime).toDateString() === todayStr).length + 1

  const isPaid = String(order.status) === '1'
  const isCommitted = isPaid || String(order.status) === '3'
  let earnedPoints = 0

  if (isCommitted) {
    const qtyByProduct = {}
    for (const line of order.list_product) qtyByProduct[line.ref_pro_id] = (qtyByProduct[line.ref_pro_id] || 0) + (line.qty || 0)
    for (const pid of Object.keys(qtyByProduct)) {
      const p = findById('products', pid)
      if (p && typeof p.stock === 'number' && qtyByProduct[pid] > p.stock) return err(400, `สินค้า "${p.product_name}" มีไม่พอ (เหลือ ${p.stock})`)
    }
    for (const pid of Object.keys(qtyByProduct)) {
      const p = findById('products', pid)
      if (p && typeof p.stock === 'number') p.stock = Math.max(0, p.stock - qtyByProduct[pid])
    }
    if (order.coupon_ref) {
      const c = findById('coupons', order.coupon_ref)
      if (c && Number(c.num_use) > 0) c.num_use = Number(c.num_use) - 1
    }
    if (isPaid && order.customer_ref) {
      const cust = findById('customers', order.customer_ref)
      if (cust) {
        const balance = Number(cust.point) || 0
        if (order.points_used > balance) return err(400, `แต้มไม่พอ (มี ${balance} แต้ม)`)
        const level = findById('levels', cust.ref_level_id)
        const rate = level && level.point_rate ? Number(level.point_rate) : 1
        const perBaht = (data.settings && Number(data.settings.point_per_baht)) || 10
        earnedPoints = Math.floor((Number(order.total_price) || 0) / perBaht) * rate
        cust.point = balance - order.points_used + earnedPoints
        autoLevel(cust)
        order.newBalance = cust.point
        const st = data.settings || {}
        if (st.line_enabled && st.line_notify_purchase && cust.line_user_id) {
          sendLine(cust.line_user_id, `🧾 ${st.shop_name || 'BREW POS'}\nขอบคุณที่อุดหนุนค่ะ\nยอดชำระ ${Number(order.total_price).toFixed(2)} บาท\nได้รับ +${earnedPoints} แต้ม · คงเหลือ ${cust.point} แต้ม`, 'purchase', cust._id)
        }
      }
    } else {
      order.points_used = 0
    }
  }
  order.earnedPoints = earnedPoints
  data.orders.push(order); save()
  return ok({ status: 200, message: 'created', earnedPoints, data: order })
}

function voidOrder(id, b) {
  const o = findById('orders', id); if (!o) return err(404, 'Not found')
  if (String(o.status) === '2') return err(400, 'บิลนี้ถูกยกเลิกแล้ว')
  if (String(o.status) === '1') {
    const qtyByProduct = {}
    for (const line of o.list_product || []) qtyByProduct[line.ref_pro_id] = (qtyByProduct[line.ref_pro_id] || 0) + (line.qty || 0)
    for (const pid of Object.keys(qtyByProduct)) {
      const p = findById('products', pid)
      if (p && typeof p.stock === 'number') p.stock += qtyByProduct[pid]
    }
    if (o.coupon_ref) { const c = findById('coupons', o.coupon_ref); if (c) c.num_use = (Number(c.num_use) || 0) + 1 }
    if (o.customer_ref) {
      const cust = findById('customers', o.customer_ref)
      if (cust) cust.point = Math.max(0, (Number(cust.point) || 0) - (o.earnedPoints || 0) + (o.points_used || 0))
    }
  }
  o.status = '2'; o.void_reason = (b && b.reason) || ''; o.voided_at = nowISO(); save()
  return ok({ status: 200, message: 'voided', data: o })
}

function settleOrder(id, b) {
  const o = findById('orders', id); if (!o) return err(404, 'Not found')
  if (String(o.status) !== '3') return err(400, 'ไม่ใช่บิลเงินเชื่อ')
  o.status = '1'; o.payment_method = (b && b.payment_method) || o.payment_method || 'cash'
  if (b && Array.isArray(b.payments)) o.payments = b.payments
  o.cash_received = (b && Number(b.cash_received)) || Number(o.total_price) || 0
  o.change = (b && Number(b.change)) || 0; o.settled_at = nowISO()
  let earnedPoints = 0
  if (o.customer_ref) {
    const cust = findById('customers', o.customer_ref)
    if (cust) {
      const level = findById('levels', cust.ref_level_id)
      const rate = level && level.point_rate ? Number(level.point_rate) : 1
      const perBaht = (data.settings && Number(data.settings.point_per_baht)) || 10
      earnedPoints = Math.floor((Number(o.total_price) || 0) / perBaht) * rate
      cust.point = (Number(cust.point) || 0) + earnedPoints; autoLevel(cust); o.earnedPoints = earnedPoints
    }
  }
  save(); return ok({ status: 200, earnedPoints, data: o })
}

// ---- request body / path parsing -------------------------------------------
function parsePath(config) {
  let url = config.url || ''
  if (!/^https?:\/\//i.test(url)) {
    const base = config.baseURL || ''
    url = base.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '')
  }
  let p = url.replace(/^https?:\/\/[^/]+/i, '') // strip origin
  p = p.split('?')[0].split('#')[0]
  p = p.replace(/^\/api\/api/, '').replace(/^\/api/, '') // strip double/single prefix
  if (!p.startsWith('/')) p = '/' + p
  return p
}

// returns { body, dataUrl } — dataUrl set for multipart file uploads
function parseBody(config) {
  return new Promise(resolve => {
    const d = config.data
    if (d == null) return resolve({ body: {} })
    // FormData (image upload)
    if (typeof FormData !== 'undefined' && d instanceof FormData) {
      let file = null
      for (const pair of d.entries()) { if (pair[1] instanceof Blob) { file = pair[1]; break } }
      if (!file) return resolve({ body: {} })
      const reader = new FileReader()
      reader.onload = () => resolve({ body: {}, dataUrl: reader.result })
      reader.onerror = () => resolve({ body: {} })
      reader.readAsDataURL(file)
      return
    }
    if (typeof d === 'string') { try { return resolve({ body: JSON.parse(d) }) } catch (e) { return resolve({ body: {} }) } }
    return resolve({ body: d })
  })
}

// ---- the axios adapter -----------------------------------------------------
function localAdapter(config) {
  return parseBody(config).then(({ body, dataUrl }) => {
    const method = (config.method || 'get').toLowerCase()
    const path = parsePath(config)
    let result
    try {
      result = route(method, path, body || {}, config.headers || {}, dataUrl)
    } catch (e) {
      result = err(500, String((e && e.message) || e))
    }
    const response = {
      data: result.data, status: result.status, statusText: result.status === 200 ? 'OK' : 'Error',
      headers: {}, config, request: { responseURL: path }
    }
    return new Promise((resolve, reject) => {
      const validate = config.validateStatus
      if (!validate || validate(response.status)) {
        resolve(response)
      } else {
        const e = new Error('Request failed with status code ' + response.status)
        e.config = config; e.request = response.request; e.response = response; e.isAxiosError = true
        reject(e)
      }
    })
  })
}

// ===========================================================================
export default function ({ $axios }) {
  if (!isStandalone()) return // normal web/dev: keep talking to the real backend

  data = load()

  // expose dev/test helpers
  if (typeof window !== 'undefined') {
    window.__localDb = () => data
    window.__resetDb = () => reseed()
  }

  // install the adapter on the nuxt axios instance (covers $auth too)
  $axios.defaults.adapter = localAdapter
  if ($axios.setBaseURL) $axios.setBaseURL('/api') // value is irrelevant; adapter ignores host
}
