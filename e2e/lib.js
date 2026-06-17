// Shared helpers for Playwright e2e tests against the running POS app.
const { chromium } = require('playwright')

const BASE = process.env.BASE || 'http://localhost:3000'

async function launch() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  return { browser, context, page }
}

// Log in through the real UI. role: 'admin' | 'cashier'
async function login(page, role = 'admin') {
  const creds = role === 'cashier'
    ? { u: 'cashier', p: 'cashier123' }
    : { u: 'admin', p: 'admin123' }
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  const inputs = page.locator('input')
  await inputs.nth(0).waitFor({ state: 'visible' })
  await inputs.nth(0).fill(creds.u)
  await inputs.nth(1).fill(creds.p)
  await page.getByRole('button', { name: 'Login' }).click()
  // wait until we land on a role page (index.vue redirects by role after auth)
  await page.waitForURL(/\/(manage|seller|member)/, { timeout: 20000 })
}

// Tiny assertion helpers
function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT FAILED: ' + msg)
  console.log('  ok: ' + msg)
}

// Wait for any Vuetify dialog + its overlay scrim to finish closing,
// otherwise the lingering overlay intercepts the next click/fill.
async function settle(page) {
  await page.locator('.v-dialog--active').waitFor({ state: 'hidden' }).catch(() => {})
  await page.locator('.v-overlay--active').waitFor({ state: 'hidden' }).catch(() => {})
  await page.waitForTimeout(350)
}

async function run(name, fn) {
  const { browser, page } = await launch()
  const start = Date.now()
  try {
    console.log('▶ ' + name)
    await fn(page)
    console.log(`✅ PASS: ${name} (${Date.now() - start}ms)\n`)
    await browser.close()
    return true
  } catch (e) {
    console.error(`❌ FAIL: ${name}`)
    console.error('   ' + (e && e.message ? e.message : e))
    try { await page.screenshot({ path: `fail-${name.replace(/\W+/g, '_')}.png` }) } catch (_) {}
    await browser.close()
    return false
  }
}

// Pick an option from a Vuetify v-select inside the active dialog.
async function vselect(page, fieldLabel, optionText) {
  const field = page.locator('.v-dialog--active .v-select', { hasText: fieldLabel }).first()
  await field.click()
  const opt = page.locator('.v-menu__content .v-list-item', { hasText: optionText }).first()
  await opt.waitFor({ state: 'visible' })
  await opt.click()
  await page.waitForTimeout(200)
}

// Click a product card; if an options dialog opens, accept defaults (or run pick()).
async function addProduct(page, name, pick) {
  const card = page.locator('.scroll .v-card').filter({ hasText: name }).first()
  await card.scrollIntoViewIfNeeded()
  await card.click()
  await page.waitForTimeout(350)
  const addBtn = page.locator('.v-dialog--active').getByRole('button', { name: 'เพิ่มลงตะกร้า' })
  if (await addBtn.count()) {
    if (pick) await pick(page.locator('.v-dialog--active'))
    await addBtn.first().click()
    await page.waitForTimeout(250)
  }
}

module.exports = { BASE, launch, login, assert, run, settle, vselect, addProduct }
