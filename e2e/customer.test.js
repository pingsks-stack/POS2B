// Customer CRUD through the real UI.
const { BASE, login, assert, run, settle, vselect } = require('./lib')

run('customer-crud', async page => {
  const fname = 'ลูกค้าทดสอบ' + Date.now()
  const fname2 = fname + 'แก้ไข'
  const tel = '09' + String(Date.now()).slice(-8)

  await login(page, 'admin')
  await page.goto(BASE + '/manage/customer', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่มสมาชิก' }).waitFor()
  const search = page.locator('.v-card__title').getByRole('textbox')

  // ADD
  await page.getByRole('button', { name: 'เพิ่มสมาชิก' }).click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByLabel('ชื่อ', { exact: true }).fill(fname)
  await dlg.getByLabel('นามสกุล').fill('สกุลทดสอบ')
  await dlg.getByLabel('เบอร์โทร').fill(tel)
  await vselect(page, 'ระดับสมาชิก', 'ทั่วไป')
  await dlg.getByLabel('แต้มสะสม').fill('10')
  await dlg.getByRole('button', { name: 'เพิ่มข้อมูล' }).click()
  await settle(page)
  await search.fill(fname)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: fname, exact: true }).count() === 1, 'added customer visible')

  // EDIT
  await page.getByRole('button', { name: 'แก้ไข' }).first().click()
  const dlg2 = page.locator('.v-dialog--active')
  await dlg2.getByLabel('ชื่อ', { exact: true }).fill(fname2)
  await dlg2.getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await search.fill(fname2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: fname2, exact: true }).count() === 1, 'edited customer visible')

  // DELETE
  await page.getByRole('button', { name: 'ลบ' }).first().click()
  await page.locator('.v-dialog--active').getByRole('button', { name: 'ลบ' }).click()
  await settle(page)
  await search.fill(fname2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: fname2, exact: true }).count() === 0, 'deleted customer gone')
}).then(ok => process.exit(ok ? 0 : 1))
