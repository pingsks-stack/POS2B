// Level member CRUD through the real UI.
const { BASE, login, assert, run, settle } = require('./lib')

run('levelmember-crud', async page => {
  const name = 'ระดับทดสอบ-' + Date.now()
  const name2 = name + '-แก้ไข'

  await login(page, 'admin')
  await page.goto(BASE + '/manage/levelmember', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่มระดับสมาชิก' }).waitFor()
  const search = page.locator('.v-card__title').getByRole('textbox')

  // ADD
  await page.getByRole('button', { name: 'เพิ่มระดับสมาชิก' }).click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByLabel('ชื่อระดับ').fill(name)
  await dlg.getByLabel('อัตราแต้ม (เท่า)').fill('2')
  await dlg.getByRole('button', { name: 'เพิ่มข้อมูล' }).click()
  await settle(page)
  await search.fill(name)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name, exact: true }).count() === 1, 'added level visible')

  // EDIT
  await page.getByRole('button', { name: 'แก้ไข' }).first().click()
  const dlg2 = page.locator('.v-dialog--active')
  await dlg2.getByLabel('ชื่อระดับ').fill(name2)
  await dlg2.getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await search.fill(name2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: name2, exact: true }).count() === 1, 'edited level visible')

  // DELETE
  await page.getByRole('button', { name: 'ลบ' }).first().click()
  await page.locator('.v-dialog--active').getByRole('button', { name: 'ลบ' }).click()
  await settle(page)
  await search.fill(name2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: name2, exact: true }).count() === 0, 'deleted level gone')
}).then(ok => process.exit(ok ? 0 : 1))
