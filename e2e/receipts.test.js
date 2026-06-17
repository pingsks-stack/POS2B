// View past receipts + reprint in 58/80/A4.
const { BASE, login, assert, run } = require('./lib')

run('receipts-history', async page => {
  await login(page, 'admin')
  await page.goto(BASE + '/manage', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  assert(await page.locator('.v-navigation-drawer').getByText('ดูสลิปย้อนหลัง').count() >= 1, 'nav has ดูสลิปย้อนหลัง')

  await page.goto(BASE + '/manage/receipts', { waitUntil: 'domcontentloaded' })
  await page.getByText('ดูสลิปย้อนหลัง').first().waitFor()
  await page.waitForTimeout(500)
  assert(await page.getByRole('button', { name: 'ดูสลิป' }).count() >= 1, 'past orders listed')

  // open a slip
  await page.getByRole('button', { name: 'ดูสลิป' }).first().click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.locator('iframe').waitFor()
  await page.waitForTimeout(600)
  // iframe has content
  const frame = page.frameLocator('.v-dialog--active iframe')
  assert(await frame.getByText('ใบเสร็จรับเงิน').count() >= 1, '80mm slip preview rendered')

  // switch to A4
  await dlg.getByRole('button', { name: 'A4' }).click()
  await page.waitForTimeout(600)
  assert(await frame.getByText('รายการ').count() >= 1, 'A4 invoice preview rendered (table)')

  // print button present for A4
  assert(await dlg.getByRole('button', { name: /พิมพ์ A4/ }).count() === 1, 'print A4 button shown')
}).then(ok => process.exit(ok ? 0 : 1))
