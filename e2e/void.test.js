// Void/refund a paid bill from the receipts page.
const { BASE, login, assert, run, settle } = require('./lib')

run('void-bill', async page => {
  await login(page, 'admin')
  await page.goto(BASE + '/manage/receipts', { waitUntil: 'domcontentloaded' })
  await page.getByText('ดูสลิปย้อนหลัง').first().waitFor()
  await page.waitForTimeout(600)

  const voidedBefore = await page.getByText('ยกเลิกแล้ว').count()
  assert(await page.getByRole('button', { name: 'ยกเลิก' }).count() >= 1, 'has a paid bill to void')

  await page.getByRole('button', { name: 'ยกเลิก' }).first().click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByText('ยกเลิก/คืนเงินบิล').waitFor()
  await dlg.getByRole('button', { name: 'ยืนยันยกเลิกบิล' }).click()
  await page.getByText(/ยกเลิกบิลแล้ว/).waitFor({ timeout: 8000 })
  await page.waitForTimeout(500)

  const voidedAfter = await page.getByText('ยกเลิกแล้ว').count()
  assert(voidedAfter === voidedBefore + 1, `voided count ${voidedBefore} -> ${voidedBefore + 1}, got ${voidedAfter}`)
}).then(ok => process.exit(ok ? 0 : 1))
