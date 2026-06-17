// Point manage: adjust a customer's loyalty points through the UI.
const { BASE, login, assert, run, settle } = require('./lib')

run('pointmanage-adjust', async page => {
  await login(page, 'admin')
  await page.goto(BASE + '/manage/pointmanage', { waitUntil: 'domcontentloaded' })
  await page.getByText('จัดการแต้มสมาชิก').waitFor()
  const search = page.locator('.v-card__title').getByRole('textbox')

  await search.fill('สมชาย')
  await page.waitForTimeout(500)
  const row = page.locator('tbody tr', { hasText: 'สมชาย' }).first()
  const chipText = await row.locator('.v-chip', { hasText: 'แต้ม' }).innerText()
  const before = parseInt(chipText.replace(/\D/g, ''), 10) || 0

  // adjust +7
  await row.getByRole('button', { name: 'ปรับแต้ม' }).click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByLabel('จำนวนแต้ม').fill('7')
  await dlg.getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await search.fill('สมชาย')
  await page.waitForTimeout(500)

  const after = parseInt(
    (await page.locator('tbody tr', { hasText: 'สมชาย' }).first().locator('.v-chip', { hasText: 'แต้ม' }).innerText())
      .replace(/\D/g, ''),
    10
  )
  assert(after === before + 7, `points ${before} + 7 = ${before + 7}, got ${after}`)
}).then(ok => process.exit(ok ? 0 : 1))
