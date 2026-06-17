// Sales reports: KPIs, breakdowns, CSV export button.
const { BASE, login, assert, run } = require('./lib')

run('reports', async page => {
  await login(page, 'admin')
  await page.goto(BASE + '/manage', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  assert(await page.locator('.v-navigation-drawer').getByText('รายงานยอดขาย').count() >= 1, 'nav has รายงานยอดขาย')

  await page.goto(BASE + '/manage/reports', { waitUntil: 'domcontentloaded' })
  await page.getByText('รายงานยอดขาย').first().waitFor()
  await page.waitForTimeout(700)

  assert(await page.getByText('กำไรขั้นต้น').count() === 1, 'profit KPI shown')
  assert(await page.getByText('ตามหมวดหมู่').count() === 1, 'category breakdown shown')
  // seeded orders include กาแฟ items -> category appears
  assert(await page.getByText('กาแฟ').count() >= 1, 'category กาแฟ in report')
  assert(await page.getByRole('button', { name: /Export CSV/ }).count() === 1, 'export button present')

  // export should not throw
  await page.getByRole('button', { name: /Export CSV/ }).click()
  await page.getByText('ส่งออก CSV แล้ว').waitFor({ timeout: 6000 })
  assert(true, 'CSV export works')
}).then(ok => process.exit(ok ? 0 : 1))
