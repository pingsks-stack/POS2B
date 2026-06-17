// Coupon CRUD through the real UI.
const { BASE, login, assert, run, settle, vselect } = require('./lib')

run('coupon-crud', async page => {
  const code = 'CODE' + Date.now()
  const code2 = code + 'X'

  await login(page, 'admin')
  await page.goto(BASE + '/manage/coupon', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่มคูปอง' }).waitFor()
  const search = page.locator('.v-card__title').getByRole('textbox')

  // ADD
  await page.getByRole('button', { name: 'เพิ่มคูปอง' }).click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByLabel('ชื่อคูปอง (โค้ด)').fill(code)
  await dlg.getByLabel('ส่วนลด (%)').fill('20')
  await dlg.getByLabel('จำนวนที่ใช้ได้').fill('50')
  // ผู้อนุมัติ/ผู้ออก ถูกตั้งค่าเริ่มต้นเป็นผู้ใช้ปัจจุบัน (admin) อยู่แล้ว
  await dlg.getByRole('button', { name: 'เพิ่มข้อมูล' }).click()
  await settle(page)
  await search.fill(code)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: code, exact: true }).count() === 1, 'added coupon visible')

  // EDIT
  await page.getByRole('button', { name: 'แก้ไข' }).first().click()
  const dlg2 = page.locator('.v-dialog--active')
  await dlg2.getByLabel('ชื่อคูปอง (โค้ด)').fill(code2)
  await dlg2.getByLabel('ส่วนลด (%)').fill('30')
  await dlg2.getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await search.fill(code2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: code2, exact: true }).count() === 1, 'edited coupon visible')
  assert(await page.getByRole('cell', { name: '30', exact: true }).count() >= 1, 'discount updated to 30')

  // DELETE
  await page.getByRole('button', { name: 'ลบ' }).first().click()
  await page.locator('.v-dialog--active').getByRole('button', { name: 'ลบ' }).click()
  await settle(page)
  await search.fill(code2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: code2, exact: true }).count() === 0, 'deleted coupon gone')
}).then(ok => process.exit(ok ? 0 : 1))
