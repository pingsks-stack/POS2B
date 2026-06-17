// PIN login: switch to PIN mode, tap the keypad, land on a role page.
const { BASE, assert, run } = require('./lib')

run('pin-login', async page => {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'PIN' }).click()
  await page.waitForTimeout(300)

  // --- wrong PIN is rejected ---
  for (const d of '0000') await page.getByRole('button', { name: d, exact: true }).first().click()
  await page.getByRole('button', { name: 'เข้าสู่ระบบ PIN' }).click()
  await page.waitForTimeout(900)
  assert(await page.getByText('PIN ไม่ถูกต้อง').count() >= 1, 'wrong PIN rejected')

  // --- admin PIN 1111 -> /manage (pin cleared automatically after the error) ---
  for (const d of '1111') await page.getByRole('button', { name: d, exact: true }).first().click()
  await page.getByRole('button', { name: 'เข้าสู่ระบบ PIN' }).click()
  await page.waitForURL(/\/(manage|seller|member)/, { timeout: 20000 })
  assert(/\/manage/.test(page.url()), 'admin PIN 1111 -> /manage')
}).then(ok => process.exit(ok ? 0 : 1))
