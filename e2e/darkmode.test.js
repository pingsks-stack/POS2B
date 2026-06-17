// Dark mode: toggle from the navbar, verify it applies + persists across reload.
const { BASE, login, assert, run } = require('./lib')

run('dark-mode-toggle', async page => {
  await login(page, 'admin')
  await page.waitForTimeout(500)

  // starts light
  assert(await page.locator('.v-application.theme--light').count() > 0, 'starts in light theme')

  // click the dark toggle (icon button, title = โหมดมืด)
  await page.locator('button[title="โหมดมืด"]').first().click()
  await page.waitForTimeout(400)
  assert(await page.locator('.v-application.theme--dark').count() > 0, 'switched to dark theme')

  // persists across a full reload
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  assert(await page.locator('.v-application.theme--dark').count() > 0, 'dark theme persisted after reload')

  // toggle back to light
  await page.locator('button[title="โหมดสว่าง"]').first().click()
  await page.waitForTimeout(400)
  assert(await page.locator('.v-application.theme--light').count() > 0, 'switched back to light')
}).then(ok => process.exit(ok ? 0 : 1))
