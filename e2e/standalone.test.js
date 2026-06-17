// Verifies the app works FULLY OFFLINE (no central server): the in-app local
// API (plugins/local-api.js) serves every /api request from localStorage.
// Run this with the Express backend STOPPED to prove independence.
const { chromium } = require('playwright')
const { assert } = require('./lib')

const BASE = process.env.BASE || 'http://localhost:3000'

async function launchStandalone() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  // turn on standalone mode before any app script runs (on every navigation)
  await context.addInitScript(() => {
    try { window.localStorage.setItem('STANDALONE', '1') } catch (e) {}
  })
  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  return { browser, page }
}

async function loginStandalone(page, role = 'admin') {
  const creds = role === 'cashier' ? { u: 'cashier', p: 'cashier123' } : { u: 'admin', p: 'admin123' }
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  const inputs = page.locator('input')
  await inputs.nth(0).waitFor({ state: 'visible' })
  await inputs.nth(0).fill(creds.u)
  await inputs.nth(1).fill(creds.p)
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL(/\/(manage|seller|member)/, { timeout: 20000 })
}

const api = (page, fn) => page.evaluate(fn)

async function main() {
  const { browser, page } = await launchStandalone()
  let ok = true
  try {
    console.log('▶ standalone-mode (in-app API, backend stopped)')

    // boot once and reset the local DB to a clean seed
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !!window.__resetDb, null, { timeout: 20000 })
    await page.evaluate(() => window.__resetDb())

    // 1) wrong password is rejected locally
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
    let bad = await page.evaluate(() =>
      window.$nuxt.$axios.post('authen/login', { data: { username: 'admin', password: 'nope' } })
        .then(() => 'ok').catch(e => (e.response && e.response.status) || 'err'))
    assert(bad === 401, 'wrong password rejected locally (401)')

    // 2) login works fully offline
    await loginStandalone(page, 'admin')
    assert(/\/manage/.test(page.url()), 'admin logged in offline -> /manage')

    // 3) settings + products served locally
    const settings = await api(page, () => window.$nuxt.$axios.$get('/settings'))
    assert(settings && settings.shop_name === 'SHIFT CAFÉ', 'settings served locally')
    const products = await api(page, () => window.$nuxt.$axios.$get('/product'))
    assert(products.length === 4, 'four seeded products served locally')
    assert(products[0].ref_cate_id && products[0].ref_cate_id.cate_name, 'product category populated locally')

    // 4) create a paid order locally -> stock decremented
    const latteBefore = products.find(p => p.product_name === 'ลาเต้')
    const res = await page.evaluate((pid) =>
      window.$nuxt.$axios.$post('/order', {
        bill_name: 'OFFLINE-TEST',
        list_product: [{ ref_pro_id: pid, name: 'ลาเต้', qty: 2, price: 120, options: [], unit: 60 }],
        total_price: 120, status: '1', payment_method: 'cash',
        cash_received: 200, change: 80, payments: [{ method: 'cash', amount: 120 }]
      }), latteBefore._id)
    assert(res && res.status === 200, 'order created locally')
    const after = await api(page, () => window.$nuxt.$axios.$get('/product'))
    const latteAfter = after.find(p => p.product_name === 'ลาเต้')
    assert(latteAfter.stock === latteBefore.stock - 2,
      `stock decremented locally (${latteBefore.stock} -> ${latteAfter.stock})`)

    // 5) settings persist across a full reload (localStorage)
    await page.evaluate(() => window.$nuxt.$axios.$put('/settings', { shop_name: 'MY OFFLINE CAFE' }))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !!window.__localDb, null, { timeout: 20000 })
    const persisted = await api(page, () => window.$nuxt.$axios.$get('/settings'))
    assert(persisted.shop_name === 'MY OFFLINE CAFE', 'settings persisted across reload')

    // 6) the order is still there after reload
    const orders = await api(page, () => window.$nuxt.$axios.$get('/order'))
    assert(orders.some(o => o.bill_name === 'OFFLINE-TEST'), 'order persisted in local db')

    console.log('✅ PASS: standalone-mode\n')
  } catch (e) {
    ok = false
    console.error('❌ FAIL: standalone-mode')
    console.error('   ' + (e && e.message ? e.message : e))
    try { await page.screenshot({ path: 'fail-standalone.png' }) } catch (_) {}
  } finally {
    await browser.close()
  }
  process.exit(ok ? 0 : 1)
}
main()
