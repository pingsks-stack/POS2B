// Thermal slip printer helper ($printer) for 58mm ESC/POS printers (e.g. VPOS VP58BT).
// - Native app (Capacitor APK): Bluetooth Classic SPP via the capacitor-thermal-printer
//   plugin. The slip is rasterised to an image so Thai always renders correctly.
// - Web Bluetooth (Chrome/Edge desktop): connect directly and print ESC/POS via TIS-620.
// - Fallback: browser window.print() of the 58mm receipt (USB / driver printers).
import Vue from 'vue'

// ---- native (Capacitor) thermal printer plugin, accessed via the global so we
//      don't bundle @capacitor/core through the Nuxt 2 webpack build ----------
function isNative () {
  try {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
  } catch (e) { return false }
}
function ctp () {
  try {
    return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorThermalPrinter) || null
  } catch (e) { return null }
}

const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

// Encode a JS string to TIS-620 bytes (Thai). ASCII passes through; Thai chars
// (U+0E01..U+0E5B) map to 0xA1..0xFB; anything else becomes '?'.
function tis620(str) {
  const out = []
  for (const ch of String(str)) {
    const c = ch.codePointAt(0)
    if (c < 0x80) out.push(c)
    else if (c >= 0x0e01 && c <= 0x0e5b) out.push(c - 0x0e00 + 0xa0)
    else out.push(0x3f) // ?
  }
  return out
}

// Extract VAT from a VAT-inclusive total. Returns null if VAT disabled.
function vatCalc(total, s) {
  if (!s || !s.vat_enabled) return null
  const rate = Number(s.vat_rate) || 7
  total = Number(total) || 0
  const base = (total * 100) / (100 + rate)
  return { base, vat: total - base, rate }
}

// Common BLE services exposed by cheap 58mm thermal printers.
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb'
]

const state = Vue.observable({
  connected: false,
  name: '',
  supported: false
})

let characteristic = null
let device = null

function setSupported() {
  state.supported = isNative() || (typeof navigator !== 'undefined' && !!navigator.bluetooth)
}
setSupported()

// ---- NATIVE Bluetooth Classic (capacitor-thermal-printer) ------------------
let scanHandles = []
let disconnectListener = null

async function stopScan() {
  const P = ctp()
  if (P) { try { await P.stopScan() } catch (e) {} }
  scanHandles.forEach(h => { try { h.remove() } catch (e) {} })
  scanHandles = []
}

// Start scanning for paired/nearby Bluetooth printers. onDevices gets the
// running list [{name, address}]. Returns once scanning has begun.
async function startScan(onDevices) {
  const P = ctp()
  if (!P) throw new Error('ใช้ได้เฉพาะในแอป (ติดตั้ง APK)')
  await stopScan()
  const seen = {}
  const h = await P.addListener('discoverDevices', d => {
    ((d && d.devices) || []).forEach(dev => { if (dev && dev.address) seen[dev.address] = dev })
    onDevices(Object.values(seen))
  })
  scanHandles.push(h)
  await P.startScan()
}

// which Bluetooth address is physically connected right now (single-connection plugin)
let currentAddress = null

async function connectNative(address) {
  const P = ctp()
  if (!P) throw new Error('ใช้ได้เฉพาะในแอป (ติดตั้ง APK)')
  await stopScan()
  if (currentAddress && currentAddress !== address) { try { await P.disconnect() } catch (e) {} }
  const dev = await P.connect({ address })
  let ok = true
  try { const r = await P.isConnected(); ok = !!(r && (r.state === undefined ? r : r.state)) } catch (e) {}
  if (!ok && dev === null) throw new Error('เชื่อมต่อเครื่องพิมพ์ไม่สำเร็จ')
  if (!disconnectListener) {
    disconnectListener = await P.addListener('disconnected', () => { state.connected = false; currentAddress = null })
  }
  currentAddress = address
  state.connected = true
  state.name = (dev && dev.name) || 'เครื่องพิมพ์'
  return state.name
}

// Ensure the given printer (by address) is the one connected; switch if needed.
// Two printers (slip + sticker) share one Bluetooth connection, so we reconnect
// on demand when a print job needs the other device.
async function ensureConnected(address) {
  const P = ctp()
  if (!P) throw new Error('ไม่พบเครื่องพิมพ์ในแอป')
  if (!address) throw new Error('ยังไม่ได้เลือกเครื่องพิมพ์ (ไปที่ ตั้งค่า → เครื่องพิมพ์)')
  if (currentAddress === address) {
    try { const r = await P.isConnected(); if (r && (r.state === undefined ? r : r.state)) return } catch (e) {}
  }
  if (currentAddress) { try { await P.disconnect() } catch (e) {} }
  await P.connect({ address })
  currentAddress = address
}

async function connectBluetooth() {
  if (!navigator.bluetooth) {
    throw new Error('เบราว์เซอร์นี้ไม่รองรับ Web Bluetooth (โปรดใช้ Chrome หรือ Edge บนเดสก์ท็อป/Android)')
  }
  device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICES
  })
  device.addEventListener('gattserverdisconnected', () => {
    state.connected = false
  })
  const server = await device.gatt.connect()

  // find a writable characteristic across the known services
  let services = []
  try {
    services = await server.getPrimaryServices()
  } catch (e) {
    services = []
  }
  for (const svc of services) {
    let chars = []
    try {
      chars = await svc.getCharacteristics()
    } catch (e) {
      continue
    }
    for (const c of chars) {
      if (c.properties && (c.properties.write || c.properties.writeWithoutResponse)) {
        characteristic = c
        break
      }
    }
    if (characteristic) break
  }
  if (!characteristic) {
    throw new Error('เชื่อมต่อได้แต่ไม่พบช่องส่งข้อมูลของเครื่องพิมพ์')
  }
  state.connected = true
  state.name = device.name || 'เครื่องพิมพ์'
  return state.name
}

async function disconnect() {
  if (isNative()) {
    const P = ctp()
    if (P) { try { await P.disconnect() } catch (e) {} }
    state.connected = false
    return
  }
  try {
    if (device && device.gatt && device.gatt.connected) device.gatt.disconnect()
  } catch (e) {}
  state.connected = false
  characteristic = null
}

// ---- rasterise a slip/sticker to a PNG data URL (Thai-safe printing) --------
function loadImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null)
    const im = new Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => resolve(im)
    im.onerror = () => resolve(null)
    im.src = src
  })
}

// Render the receipt as a 384px-wide monochrome-ish image (58mm @ ~200dpi).
async function renderReceiptImage(r, s) {
  s = s || {}; r = r || {}
  const W = 384
  const PAD = 12
  const [logo, qr] = await Promise.all([
    loadImage(s.show_logo !== false ? s.logoUrl : null),
    loadImage(r.qrImage)
  ])
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = 4000
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, 4000)
  ctx.fillStyle = '#000'; ctx.textBaseline = 'top'
  let y = PAD
  const money = v => (Number(v) || 0).toFixed(2)
  const font = (px, bold) => { ctx.font = (bold ? '700 ' : '') + px + "px 'Sarabun', sans-serif" }
  const center = (t, px, bold) => { font(px, bold); ctx.textAlign = 'center'; ctx.fillText(t, W / 2, y); y += px + 5 }
  const left = (t, px, bold) => { font(px, bold); ctx.textAlign = 'left'; ctx.fillText(t, PAD, y); y += px + 5 }
  const rule = () => { ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(PAD, y + 3); ctx.lineTo(W - PAD, y + 3); ctx.stroke(); ctx.setLineDash([]); y += 12 }
  const wrapChars = (t, maxW, px) => {
    font(px); const out = []; let cur = ''
    for (const ch of String(t)) {
      if (ctx.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch } else cur += ch
    }
    if (cur) out.push(cur)
    return out.length ? out : ['']
  }
  const rowLR = (l, rr, px, bold) => {
    font(px, bold)
    ctx.textAlign = 'right'; const rw = ctx.measureText(rr).width
    const lines = wrapChars(l, W - PAD * 2 - rw - 8, px)
    ctx.textAlign = 'left'
    lines.forEach((ln, i) => {
      ctx.fillText(ln, PAD, y)
      if (i === 0) { ctx.textAlign = 'right'; ctx.fillText(rr, W - PAD, y); ctx.textAlign = 'left' }
      y += px + 4
    })
  }

  if (logo) {
    const lw = Math.min(logo.width, 160); const lh = logo.height * (lw / logo.width)
    ctx.drawImage(logo, (W - lw) / 2, y, lw, lh); y += lh + 6
  }
  center(s.shop_name || 'SHIFT CAFE', 30, true)
  if (s.branch) center(s.branch, 20)
  const addr = [s.address, s.subdistrict, s.district, s.province, s.postcode].filter(Boolean).join(' ')
  if (addr) wrapChars(addr, W - PAD * 2, 18).forEach(ln => center(ln, 18))
  if (s.tel) center('โทร ' + s.tel + (s.tax_id ? '  เลขภาษี ' + s.tax_id : ''), 18)
  center('ใบเสร็จรับเงิน', 20, true)
  rule()
  left('บิล: ' + (r.bill_name || '-'), 18)
  if (r.queue_no) left('คิว: ' + r.queue_no, 18)
  if (r.memberName) left('สมาชิก: ' + r.memberName, 18)
  left('เวลา: ' + new Date(r.datetime || Date.now()).toLocaleString('th-TH'), 18)
  rule()
  ;(r.list_product || []).forEach(l => {
    rowLR(l.name + ' x' + l.qty, money(l.price), 19)
    if (l.options && l.options.length) left('  ' + l.options.join(', '), 16)
  })
  rule()
  rowLR('ยอดรวม', money(r.subTotal), 19)
  if (r.discount) rowLR('ส่วนลดคูปอง', '-' + money(r.discount), 19)
  if (r.pointsUsed) rowLR('ใช้แต้ม', '-' + money(r.pointsUsed), 19)
  const v = vatCalc(r.total_price, s)
  if (v) { rowLR('มูลค่าก่อนภาษี', money(v.base), 18); rowLR('VAT ' + v.rate + '%', money(v.vat), 18) }
  rowLR('สุทธิ', money(r.total_price), 26, true)
  const pm = r.paymentMethod === 'qr' ? 'QR พร้อมเพย์' : r.paymentMethod === 'transfer' ? 'โอนเงิน' : r.paymentMethod === 'card' ? 'บัตร' : 'เงินสด'
  rowLR('ชำระโดย', pm, 18)
  if (r.paymentMethod === 'cash') { rowLR('รับเงิน', money(r.cash), 18); rowLR('เงินทอน', money(r.change), 18) }
  if (r.earnedPoints) rowLR('แต้มที่ได้รับ', '+' + r.earnedPoints, 18)
  if (r.newBalance != null) rowLR('แต้มคงเหลือ', String(r.newBalance), 18)
  rule()
  if (qr) {
    center('สแกนชำระผ่าน PromptPay', 18, true)
    const qw = 200; const qh = qr.height * (qw / qr.width)
    ctx.drawImage(qr, (W - qw) / 2, y, qw, qh); y += qh + 4
    center(money(r.total_price) + ' บาท', 18)
    rule()
  }
  center(s.receipt_footer || 'ขอบคุณที่ใช้บริการ', 18)
  y += PAD + 24 // bottom feed

  // crop to used height
  const out = document.createElement('canvas')
  out.width = W; out.height = Math.ceil(y)
  const octx = out.getContext('2d')
  octx.fillStyle = '#fff'; octx.fillRect(0, 0, out.width, out.height)
  octx.drawImage(canvas, 0, 0)
  return out.toDataURL('image/png')
}

// write bytes in small chunks (BLE MTU is tiny)
async function writeRaw(bytes) {
  if (!characteristic) throw new Error('ยังไม่ได้เชื่อมต่อเครื่องพิมพ์')
  const data = Uint8Array.from(bytes)
  const size = 180
  for (let i = 0; i < data.length; i += size) {
    const chunk = data.slice(i, i + size)
    if (characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk)
    } else {
      await characteristic.writeValue(chunk)
    }
    await new Promise(r => setTimeout(r, 16))
  }
}

// ---- ESC/POS receipt builder ----------------------------------------------
function buildReceipt(r, s) {
  s = s || {}
  const b = []
  const push = arr => arr.forEach(x => b.push(x))
  const align = n => push([ESC, 0x61, n]) // 0 left,1 center,2 right
  const bold = on => push([ESC, 0x45, on ? 1 : 0])
  const size = (w, h) => push([GS, 0x21, ((w - 1) << 4) | (h - 1)]) // 1..8
  const feed = n => { for (let i = 0; i < n; i++) b.push(LF) }
  const text = t => push(tis620(t))
  const line = t => { text(t); b.push(LF) }
  const rule = () => line('--------------------------------')
  const money = v => (Number(v) || 0).toFixed(2)
  const row = (l, rr) => {
    const W = 32
    l = String(l); rr = String(rr)
    const space = Math.max(1, W - l.length - rr.length)
    line(l + ' '.repeat(space) + rr)
  }

  push([ESC, 0x40]) // init
  push([ESC, 0x74, 0x15]) // codepage TIS-620 (Thai) — adjust per printer if needed

  align(1)
  bold(1); size(2, 2)
  line(s.shop_name || 'SHIFT CAFE')
  size(1, 1); bold(0)
  if (s.branch) line(s.branch)
  if (s.address) line(s.address)
  if (s.tel) line('โทร ' + s.tel + (s.tax_id ? '  เลขภาษี ' + s.tax_id : ''))
  line('ใบเสร็จรับเงิน')
  align(0)
  rule()
  line('บิล: ' + (r.bill_name || '-'))
  if (r.memberName) line('สมาชิก: ' + r.memberName)
  if (r.datetime) line('เวลา: ' + new Date(r.datetime).toLocaleString('th-TH'))
  rule()
  ;(r.list_product || []).forEach(l => {
    row(l.name + ' x' + l.qty, money(l.price))
    if (l.options && l.options.length) line('  ' + l.options.join(', '))
  })
  rule()
  row('ยอดรวม', money(r.subTotal))
  if (r.discount) row('ส่วนลดคูปอง', '-' + money(r.discount))
  if (r.pointsUsed) row('ใช้แต้ม', '-' + money(r.pointsUsed))
  bold(1); size(1, 2)
  row('สุทธิ', money(r.total_price))
  size(1, 1); bold(0)
  const pm = r.paymentMethod === 'qr' ? 'QR พร้อมเพย์' : r.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เงินสด'
  row('ชำระโดย', pm)
  if (r.paymentMethod === 'cash') {
    row('รับเงิน', money(r.cash))
    row('เงินทอน', money(r.change))
  }
  if (r.earnedPoints) row('แต้มที่ได้รับ', '+' + r.earnedPoints)
  if (r.newBalance != null) row('แต้มคงเหลือ', String(r.newBalance))
  rule()
  align(1)
  line(s.receipt_footer || 'ขอบคุณที่ใช้บริการ')
  feed(4)
  push([GS, 0x56, 0x42, 0x00]) // partial cut
  return b
}

// Build a self-contained slip as HTML. opts.paper = '58' (default) | '80' | 'A4'.
function buildHtml(r, s, opts) {
  s = s || {}
  opts = opts || {}
  const paper = opts.paper || '58'
  if (paper === 'A4') return buildA4(r, s)
  const W = paper === '80' ? '80mm' : '58mm'
  const FS = paper === '80' ? 13 : 12
  const esc = t =>
    String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const money = v => (Number(v) || 0).toFixed(2)
  const rowsHtml = (r.list_product || [])
    .map(l => {
      const opt = l.options && l.options.length
        ? `<div class="opt">${esc(l.options.join(', '))}</div>` : ''
      return `<div class="row"><span>${esc(l.name)} x${l.qty}</span><span>${money(l.price)}</span></div>${opt}`
    })
    .join('')
  const pm = r.paymentMethod === 'qr' ? 'QR พร้อมเพย์' : r.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เงินสด'
  const addr = [s.address, s.subdistrict, s.district, s.province, s.postcode].filter(Boolean).join(' ')
  const logo = s.show_logo && s.logoUrl ? `<img src="${s.logoUrl}" />` : ''
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
@page { size: ${W} auto; margin: 0; }
* { box-sizing: border-box; }
body { font-family: 'Sarabun', sans-serif; width: ${W}; margin: 0; padding: 6px 8px; color: #000; font-size: ${FS}px; line-height: 1.35; }
.c { text-align: center; } .b { font-weight: 700; }
.big { font-size: 16px; font-weight: 700; }
.row { display: flex; justify-content: space-between; gap: 6px; }
.opt { color: #444; font-size: 11px; padding-left: 6px; }
hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
img { max-height: 60px; max-width: 100%; }
</style></head><body>
<div class="c">${logo}<div class="big">${esc(s.shop_name || 'SHIFT CAFE')}</div>
${s.branch ? `<div>${esc(s.branch)}</div>` : ''}
${addr ? `<div>${esc(addr)}</div>` : ''}
${s.tel ? `<div>โทร ${esc(s.tel)}${s.tax_id ? ' · เลขภาษี ' + esc(s.tax_id) : ''}</div>` : ''}
<div class="b">ใบเสร็จรับเงิน</div></div>
<hr>
<div>บิล: ${esc(r.bill_name || '-')}</div>
${r.memberName ? `<div>สมาชิก: ${esc(r.memberName)}</div>` : ''}
<div>เวลา: ${esc(new Date(r.datetime || Date.now()).toLocaleString('th-TH'))}</div>
<hr>
${rowsHtml}
<hr>
<div class="row"><span>ยอดรวม</span><span>${money(r.subTotal)}</span></div>
${r.discount ? `<div class="row"><span>ส่วนลดคูปอง</span><span>-${money(r.discount)}</span></div>` : ''}
${r.pointsUsed ? `<div class="row"><span>ใช้แต้ม</span><span>-${money(r.pointsUsed)}</span></div>` : ''}
<div class="row b"><span>สุทธิ</span><span>${money(r.total_price)}</span></div>
${(() => { const v = vatCalc(r.total_price, s); return v ? `<div class="row"><span>มูลค่าก่อนภาษี</span><span>${money(v.base)}</span></div><div class="row"><span>VAT ${v.rate}%</span><span>${money(v.vat)}</span></div>` : '' })()}
<div class="row"><span>ชำระโดย</span><span>${pm}</span></div>
${r.paymentMethod === 'cash' ? `<div class="row"><span>รับเงิน</span><span>${money(r.cash)}</span></div><div class="row"><span>เงินทอน</span><span>${money(r.change)}</span></div>` : ''}
${r.earnedPoints ? `<div class="row"><span>แต้มที่ได้รับ</span><span>+${r.earnedPoints}</span></div>` : ''}
${r.newBalance != null ? `<div class="row"><span>แต้มคงเหลือ</span><span>${r.newBalance}</span></div>` : ''}
${r.qrImage ? `<hr><div class="c"><div class="b">สแกนชำระผ่าน PromptPay</div><img src="${r.qrImage}" style="width:150px;max-height:none" /><div>${money(r.total_price)} บาท</div></div>` : ''}
<hr>
<div class="c">${esc(s.receipt_footer || 'ขอบคุณที่ใช้บริการ')}</div>
</body></html>`
}

// Full-page A4 invoice layout.
function buildA4(r, s) {
  s = s || {}
  const esc = t =>
    String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const money = v => (Number(v) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const pm = r.paymentMethod === 'qr' ? 'QR พร้อมเพย์' : r.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เงินสด'
  const addr = [s.address, s.subdistrict, s.district, s.province, s.postcode].filter(Boolean).join(' ')
  const logo = s.logoUrl ? `<img class="logo" src="${s.logoUrl}" />` : ''
  const rows = (r.list_product || [])
    .map((l, i) => {
      const opt = l.options && l.options.length ? `<div class="opt">${esc(l.options.join(', '))}</div>` : ''
      const unit = l.unit != null ? l.unit : (l.qty ? l.price / l.qty : l.price)
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(l.name)}${opt}</td>
        <td class="c">${l.qty}</td>
        <td class="r">${money(unit)}</td>
        <td class="r">${money(l.price)}</td>
      </tr>`
    })
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; }
body { font-family: 'Sarabun', sans-serif; color: #1d1d1d; font-size: 14px; }
.head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2e9c3f; padding-bottom: 12px; }
.logo { max-height: 60px; margin-bottom: 6px; }
.shop { font-size: 22px; font-weight: 700; }
.muted { color: #666; font-size: 13px; }
.doc { text-align: right; }
.doc h2 { margin: 0; color: #2e9c3f; }
table { width: 100%; border-collapse: collapse; margin-top: 18px; }
th { background: #f4f6f8; text-align: left; padding: 8px; font-size: 13px; color: #555; }
td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
.c { text-align: center; } .r { text-align: right; }
.opt { color: #777; font-size: 12px; }
.totals { width: 320px; margin-left: auto; margin-top: 14px; }
.totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
.totals .net { border-top: 2px solid #1d1d1d; margin-top: 6px; padding-top: 8px; font-size: 18px; font-weight: 700; }
.foot { margin-top: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
.qr { text-align: center; } .qr img { width: 120px; }
.thanks { color: #2e9c3f; font-weight: 600; }
</style></head><body>
<div class="head">
  <div>${logo}<div class="shop">${esc(s.shop_name || 'SHIFT CAFE')}</div>
    ${s.branch ? `<div class="muted">${esc(s.branch)}</div>` : ''}
    ${addr ? `<div class="muted">${esc(addr)}</div>` : ''}
    ${s.tel ? `<div class="muted">โทร ${esc(s.tel)}</div>` : ''}
    ${s.tax_id ? `<div class="muted">เลขผู้เสียภาษี ${esc(s.tax_id)}</div>` : ''}
  </div>
  <div class="doc">
    <h2>${s.vat_enabled ? 'ใบกำกับภาษีอย่างย่อ' : 'ใบเสร็จรับเงิน'}</h2>
    <div class="muted">เลขที่บิล: ${esc(r.bill_name || '-')}</div>
    ${r.queue_no ? `<div class="muted">คิว: ${r.queue_no}</div>` : ''}
    <div class="muted">วันที่: ${esc(new Date(r.datetime || Date.now()).toLocaleString('th-TH'))}</div>
    ${r.memberName ? `<div class="muted">สมาชิก: ${esc(r.memberName)}</div>` : ''}
  </div>
</div>
<table>
  <thead><tr><th class="c">#</th><th>รายการ</th><th class="c">จำนวน</th><th class="r">ราคา/หน่วย</th><th class="r">รวม</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals">
  <div class="row"><span>ยอดรวม</span><span>${money(r.subTotal)}</span></div>
  ${r.discount ? `<div class="row"><span>ส่วนลดคูปอง</span><span>-${money(r.discount)}</span></div>` : ''}
  ${r.pointsUsed ? `<div class="row"><span>ใช้แต้ม</span><span>-${money(r.pointsUsed)}</span></div>` : ''}
  ${(() => { const v = vatCalc(r.total_price, s); return v ? `<div class="row"><span>มูลค่าก่อนภาษี</span><span>${money(v.base)}</span></div><div class="row"><span>ภาษีมูลค่าเพิ่ม ${v.rate}%</span><span>${money(v.vat)}</span></div>` : '' })()}
  <div class="row net"><span>ยอดสุทธิ</span><span>${money(r.total_price)} บาท</span></div>
  <div class="row"><span>ชำระโดย</span><span>${pm}</span></div>
  ${r.paymentMethod === 'cash' ? `<div class="row"><span>รับเงิน</span><span>${money(r.cash)}</span></div><div class="row"><span>เงินทอน</span><span>${money(r.change)}</span></div>` : ''}
  ${r.earnedPoints ? `<div class="row"><span>แต้มที่ได้รับ</span><span>+${r.earnedPoints}</span></div>` : ''}
</div>
<div class="foot">
  <div class="thanks">${esc(s.receipt_footer || 'ขอบคุณที่ใช้บริการ')}</div>
  ${r.qrImage ? `<div class="qr"><div class="muted">สแกนชำระผ่าน PromptPay</div><img src="${r.qrImage}" /></div>` : ''}
</div>
</body></html>`
}

// Print the slip HTML via a hidden iframe (reliable across pages/browsers).
function browserPrint(html) {
  return new Promise(resolve => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()
    const done = () => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      } catch (e) {}
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
        resolve('browser')
      }, 1000)
    }
    // give images/fonts a moment to load
    setTimeout(done, 400)
  })
}

// Send a rasterised image to the currently-connected native printer.
async function nativePrintImage(dataUrl, widthMm, dpi) {
  const P = ctp()
  if (!P) throw new Error('ไม่พบเครื่องพิมพ์ในแอป')
  const base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl
  await P.begin({})
  await P.align({ alignment: 'center' })
  await P.dpi({ dpi: dpi || 200 })
  await P.limitWidth({ width: widthMm || 48 })
  await P.image({ image: base64 })
  await P.write()
}

async function print(receipt, settings, opts) {
  opts = opts || {}
  settings = settings || {}
  const paper = opts.paper || '58'
  // thermal Bluetooth only makes sense for the narrow slip
  if (paper === '58' && !opts.forceBrowser) {
    if (isNative()) {
      // assigned slip printer (falls back to any single configured printer)
      const addr = settings.printer_slip_address || settings.printer_sticker_address
      if (addr) {
        await ensureConnected(addr)
        await nativePrintImage(await renderReceiptImage(receipt, settings), 48, 200)
        return 'bluetooth'
      }
      // no printer assigned -> fall through to the Android print dialog
    } else if (state.connected && characteristic) {
      await writeRaw(buildReceipt(receipt, settings))
      return 'bluetooth'
    }
  }
  if (typeof window !== 'undefined') {
    return browserPrint(buildHtml(receipt, settings, opts))
  }
  return 'none'
}

// ---- ORDER STICKERS (label per cup/item) -----------------------------------
function stickerDims(size) {
  const map = { '40x30': [40, 30], '50x30': [50, 30], '50x40': [50, 40], '80x40': [80, 40] }
  return map[size] || [50, 40]
}

// Expand a receipt into a flat list of stickers (1 per cup or 1 per line).
function stickerList(receipt, settings) {
  const perQty = settings.sticker_per_qty !== false
  const items = []
  ;(receipt.list_product || []).forEach(l => {
    const reps = perQty ? Math.max(1, l.qty || 1) : 1
    for (let k = 0; k < reps; k++) {
      items.push({ name: l.name, qty: perQty ? 1 : l.qty, options: l.options || [], unit: l.unit || l.price })
    }
  })
  return items.map((it, i) => ({ ...it, idx: i + 1, total: items.length }))
}

function buildStickerHtml(receipt, settings) {
  const s = settings || {}
  const [w, h] = stickerDims(s.sticker_size)
  const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const money = v => (Number(v) || 0).toFixed(0)
  const when = new Date(receipt.datetime || Date.now()).toLocaleString('th-TH', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
  const head = s.sticker_show_logo && s.logoUrl
    ? `<img class="logo" src="${s.logoUrl}" />`
    : `<span class="shop">${esc(s.shop_name || 'SHIFT CAFE')}</span>`
  const stickers = stickerList(receipt, s)
  const body = stickers
    .map(st => `
    <div class="st">
      <div class="top"><span>${head}</span><span class="q">คิว ${receipt.queue_no || '-'}</span></div>
      <div class="bill">${esc(receipt.bill_name || '')}</div>
      <div class="name">${esc(st.name)}</div>
      ${s.sticker_show_options !== false && st.options.length ? `<div class="opt">${esc(st.options.join(' · '))}</div>` : ''}
      <div class="foot">
        <span>${st.idx}/${st.total}</span>
        ${s.sticker_show_price !== false ? `<span>${money(st.unit)}฿</span>` : '<span></span>'}
        ${s.sticker_show_datetime !== false ? `<span>${esc(when)}</span>` : '<span></span>'}
      </div>
    </div>`)
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: ${w}mm ${h}mm; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Sarabun', sans-serif; color: #000; }
.st { width: ${w}mm; height: ${h}mm; padding: 2mm 2.5mm; page-break-after: always; overflow: hidden; display: flex; flex-direction: column; }
.top { display: flex; justify-content: space-between; align-items: center; font-size: 9px; }
.shop { font-weight: 700; } .logo { max-height: 7mm; max-width: 22mm; }
.q { font-weight: 700; background: #000; color: #fff; padding: 0 4px; border-radius: 3px; }
.bill { font-size: 10px; border-bottom: 1px dashed #000; padding-bottom: 1px; margin: 1px 0; }
.name { font-size: 15px; font-weight: 700; line-height: 1.1; margin-top: 1px; }
.opt { font-size: 10px; color: #222; line-height: 1.15; }
.foot { margin-top: auto; display: flex; justify-content: space-between; font-size: 9px; }
</style></head><body>${body}</body></html>`
}

// Render stacked order stickers to a 384px-wide image for native printing.
async function renderStickerImage(receipt, settings) {
  const s = settings || {}
  const W = 384
  const logo = s.sticker_show_logo !== false ? await loadImage(s.logoUrl) : null
  const stickers = stickerList(receipt, s)
  const when = new Date(receipt.datetime || Date.now()).toLocaleString('th-TH', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = 4000
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, 4000)
  ctx.fillStyle = '#000'; ctx.textBaseline = 'top'
  const font = (px, bold) => { ctx.font = (bold ? '700 ' : '') + px + "px 'Sarabun', sans-serif" }
  let y = 8
  stickers.forEach((st, i) => {
    if (i > 0) { ctx.strokeStyle = '#000'; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(W - 8, y); ctx.stroke(); ctx.setLineDash([]); y += 10 }
    font(16, false); ctx.textAlign = 'left'
    if (logo) { const lw = 60, lh = logo.height * (lw / logo.width); ctx.drawImage(logo, 8, y, lw, lh) }
    ctx.fillText(s.shop_name || 'SHIFT CAFE', logo ? 76 : 8, y)
    font(16, true); ctx.textAlign = 'right'; ctx.fillText('คิว ' + (receipt.queue_no || '-'), W - 8, y)
    y += 24
    font(14, false); ctx.textAlign = 'left'; ctx.fillText(receipt.bill_name || '', 8, y); y += 20
    font(26, true); ctx.fillText(st.name, 8, y); y += 32
    if (s.sticker_show_options !== false && st.options.length) { font(15, false); ctx.fillText(st.options.join(' · '), 8, y); y += 20 }
    font(14, false); ctx.textAlign = 'left'; ctx.fillText(st.idx + '/' + st.total, 8, y)
    if (s.sticker_show_price !== false) { ctx.textAlign = 'center'; ctx.fillText((Number(st.unit) || 0).toFixed(0) + '฿', W / 2, y) }
    if (s.sticker_show_datetime !== false) { ctx.textAlign = 'right'; ctx.fillText(when, W - 8, y) }
    y += 30
  })
  const out = document.createElement('canvas')
  out.width = W; out.height = Math.ceil(y + 8)
  const octx = out.getContext('2d')
  octx.fillStyle = '#fff'; octx.fillRect(0, 0, out.width, out.height)
  octx.drawImage(canvas, 0, 0)
  return out.toDataURL('image/png')
}

async function printStickers(receipt, settings) {
  settings = settings || {}
  if (!receipt || !(receipt.list_product || []).length) return 'none'
  if (isNative()) {
    // prefer the dedicated sticker/label printer (e.g. CLABEL 230B), else the slip printer
    const addr = settings.printer_sticker_address || settings.printer_slip_address
    if (addr) {
      await ensureConnected(addr)
      const [w] = stickerDims(settings.sticker_size)
      const dpi = Number(settings.printer_sticker_dpi) || 300 // CLABEL 230B = 300dpi
      await nativePrintImage(await renderStickerImage(receipt, settings), w, dpi)
      return 'bluetooth'
    }
  }
  if (typeof window !== 'undefined') {
    return browserPrint(buildStickerHtml(receipt, settings))
  }
  return 'none'
}

export default (ctx, inject) => {
  setSupported() // re-evaluate now that Capacitor may be available
  inject('printer', {
    state,
    isNative,
    connectBluetooth,
    startScan,
    stopScan,
    connectNative,
    disconnect,
    print,
    printStickers,
    printHtml: html => browserPrint(html),
    buildHtml,
    buildStickerHtml,
    testPrint: settings =>
      print(
        {
          bill_name: 'ทดสอบพิมพ์',
          datetime: new Date().toISOString(),
          list_product: [
            { name: 'อเมริกาโน่ (ร้อน)', qty: 1, price: 50, options: ['ร้อน', 'หวานน้อย'] },
            { name: 'เค้กช็อกโกแลต', qty: 2, price: 150, options: [] }
          ],
          subTotal: 200, discount: 0, pointsUsed: 0, total_price: 200,
          paymentMethod: 'cash', cash: 500, change: 300, earnedPoints: 20
        },
        settings
      )
  })
}
