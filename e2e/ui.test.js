// Sidebar collapse toggle + fullscreen button on seller page.
const { BASE, login, assert, run } = require('./lib')

run('ui-sidebar-fullscreen', async page => {
  // --- sidebar collapse (admin) ---
  await login(page, 'admin')
  await page.goto(BASE + '/manage', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  assert(await page.getByText('ระบบจัดการร้าน').count() === 1, 'sidebar shows brand subtitle (expanded)')
  await page.locator('.v-app-bar__nav-icon').first().click() // collapse
  await page.waitForTimeout(500)
  assert(await page.getByText('ระบบจัดการร้าน').count() === 0, 'sidebar collapsed (mini) -> subtitle hidden')
  await page.locator('.v-app-bar__nav-icon').first().click() // expand
  await page.waitForTimeout(500)
  assert(await page.getByText('ระบบจัดการร้าน').count() === 1, 'sidebar expanded again')

  // --- fullscreen button on seller (cashier) ---
  const { launch } = require('./lib')
  const c = await launch()
  try {
    await login(c.page, 'cashier')
    await c.page.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
    await c.page.getByText('ลาเต้', { exact: true }).first().waitFor()
    await c.page.waitForTimeout(400)
    assert(await c.page.locator('.mdi-fullscreen').count() >= 1, 'fullscreen button present on seller')
  } finally {
    await c.browser.close()
  }
}).then(ok => process.exit(ok ? 0 : 1))
