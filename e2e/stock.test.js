// Stock CRUD through the real UI.
const { BASE, login, assert, run, settle, vselect } = require('./lib')

run('stock-crud', async page => {
  // 6-digit, 100000-999999 (no leading zero -> survives type=number fields)
  const qty = String((Date.now() % 900000) + 100000)
  const qty2 = String(((Date.now() + 137) % 900000) + 100000)

  await login(page, 'admin')
  await page.goto(BASE + '/manage/stock', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่ม Stock' }).waitFor()
  const search = page.locator('.v-card__title').getByRole('textbox')

  // ADD
  await page.getByRole('button', { name: 'เพิ่ม Stock' }).click()
  const dlg = page.locator('.v-dialog--active')
  await vselect(page, 'สินค้า', 'ลาเต้')
  await dlg.getByLabel('จำนวนคงเหลือ (สูงสุด)').fill(qty)
  await dlg.getByLabel('จุดแจ้งเตือน (ต่ำสุด)').fill('5')
  await dlg.getByRole('button', { name: 'เพิ่มข้อมูล' }).click()
  await settle(page)
  await search.fill(qty)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: qty, exact: true }).count() >= 1, 'added stock row visible')

  // EDIT (change qty_max)
  await page.getByRole('button', { name: 'แก้ไข' }).first().click()
  const dlg2 = page.locator('.v-dialog--active')
  await dlg2.getByLabel('จำนวนคงเหลือ (สูงสุด)').fill(qty2)
  await dlg2.getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await search.fill(qty2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: qty2, exact: true }).count() >= 1, 'edited stock qty visible')

  // DELETE
  await page.getByRole('button', { name: 'ลบ' }).first().click()
  await page.locator('.v-dialog--active').getByRole('button', { name: 'ลบ' }).click()
  await settle(page)
  await search.fill(qty2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: qty2, exact: true }).count() === 0, 'deleted stock gone')
}).then(ok => process.exit(ok ? 0 : 1))
