// Admin must keep the full nav (and a way back to manage) on cashier/seller pages.
const { BASE, login, assert, run } = require('./lib')

run('admin-nav-on-seller', async page => {
  // ADMIN on /seller should see the admin nav (manage links present) -> can go back
  await login(page, 'admin')
  await page.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
  await page.getByText('ลาเต้', { exact: true }).first().waitFor()
  await page.waitForTimeout(800)

  const nav = page.locator('.v-navigation-drawer')
  assert(await nav.getByText('จัดการสินค้า').count() >= 1, 'admin sees จัดการสินค้า link on /seller')
  assert(await nav.getByText('สมาชิก & แต้ม').count() >= 1, 'admin sees the management sections on /seller')

  // click back to a manage page from the seller page
  await nav.getByText('จัดการสินค้า').first().click()
  await page.waitForURL(/\/manage\/product/, { timeout: 15000 })
  assert(page.url().includes('/manage/product'), 'admin navigated back to /manage/product from /seller')

  // CASHIER on /seller should NOT see admin manage links (gets cashier nav)
  const c = await require('./lib').launch()
  try {
    await login(c.page, 'cashier')
    await c.page.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
    await c.page.getByText('ลาเต้', { exact: true }).first().waitFor()
    await c.page.waitForTimeout(600)
    const cnav = c.page.locator('.v-navigation-drawer')
    assert(await cnav.getByText('จัดการสินค้า').count() === 0, 'cashier nav has no admin manage links')
    assert(await cnav.getByText('ขายหน้าร้าน').count() >= 1, 'cashier sees sell menu')
  } finally {
    await c.browser.close()
  }
}).then(ok => process.exit(ok ? 0 : 1))
