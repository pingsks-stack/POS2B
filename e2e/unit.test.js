// Unit CRUD through the real UI.
const { BASE, login, assert, run, settle } = require('./lib')

run('unit-crud', async page => {
  const name = 'หน่วยทดสอบ-' + Date.now()
  const name2 = name + '-แก้ไข'

  await login(page, 'admin')
  await page.goto(BASE + '/manage/unit', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่มหน่วยนับ' }).waitFor()
  const search = page.locator('.v-card__title').getByRole('textbox')

  // ADD
  await page.getByRole('button', { name: 'เพิ่มหน่วยนับ' }).click()
  const input = page.locator('.v-dialog--active').getByLabel('ชื่อหน่วยนับ')
  await input.waitFor({ state: 'visible' })
  await input.fill(name)
  await page.locator('.v-dialog--active').getByRole('button', { name: 'เพิ่มข้อมูล' }).click()
  await settle(page)
  await search.fill(name)
  await page.waitForTimeout(400)
  assert(await page.getByRole('cell', { name, exact: true }).count() === 1, 'added row visible')

  // EDIT
  await page.getByRole('button', { name: 'แก้ไข' }).first().click()
  const editInput = page.locator('.v-dialog--active').getByLabel('ชื่อหน่วยนับ')
  await editInput.waitFor({ state: 'visible' })
  await editInput.fill(name2)
  await page.locator('.v-dialog--active').getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await search.fill(name2)
  await page.waitForTimeout(400)
  assert(await page.getByRole('cell', { name: name2, exact: true }).count() === 1, 'edited name visible')

  // DELETE
  await page.getByRole('button', { name: 'ลบ' }).first().click()
  await page.locator('.v-dialog--active').getByRole('button', { name: 'ลบ' }).click()
  await settle(page)
  await search.fill(name2)
  await page.waitForTimeout(400)
  assert(await page.getByRole('cell', { name: name2, exact: true }).count() === 0, 'deleted row gone')
}).then(ok => process.exit(ok ? 0 : 1))
