// Screenshots at Galaxy Tab S10 Lite viewports (landscape + portrait).
const { chromium } = require('playwright')
const B = 'http://localhost:3000'

async function loginAt(page, role) {
  const c = role === 'cashier' ? ['cashier', 'cashier123'] : ['admin', 'admin123']
  await page.goto(B + '/login', { waitUntil: 'domcontentloaded' })
  const inputs = page.locator('input')
  await inputs.nth(0).waitFor({ state: 'visible' })
  await inputs.nth(0).fill(c[0])
  await inputs.nth(1).fill(c[1])
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL(/\/(manage|seller|member)/, { timeout: 20000 })
}

async function shot(w, h, role, path, file) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  page.setDefaultTimeout(20000)
  await loginAt(page, role)
  await page.goto(B + path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  // report horizontal overflow if any
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  await page.screenshot({ path: file })
  await browser.close()
  console.log(file + '  overflowX=' + overflow + 'px')
}

;(async () => {
  await shot(1340, 800, 'cashier', '/seller', 'tab-seller-land.png')
  await shot(800, 1340, 'cashier', '/seller', 'tab-seller-port.png')
  await shot(1340, 800, 'admin', '/manage', 'tab-dash-land.png')
  await shot(800, 1340, 'admin', '/manage/product', 'tab-manage-port.png')
})()
