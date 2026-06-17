// Employee CRUD + verify the created employee can actually log in.
const { BASE, login, assert, run, settle, vselect, launch } = require('./lib')

run('employee-crud', async page => {
  const stamp = Date.now()
  const fname = 'พนักงานทดสอบ' + stamp
  const fname2 = fname + 'แก้ไข'
  const username = 'emp' + stamp
  const password = 'pass1234'

  await login(page, 'admin')
  await page.goto(BASE + '/manage/employee', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่มพนักงาน' }).waitFor()
  const search = page.locator('.v-card__title').getByRole('textbox')

  // ADD (cashier role so we can verify the /seller login)
  await page.getByRole('button', { name: 'เพิ่มพนักงาน' }).click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByLabel('ชื่อ', { exact: true }).fill(fname)
  await dlg.getByLabel('นามสกุล').fill('สกุล')
  await dlg.getByLabel('ชื่อผู้ใช้ (username)').fill(username)
  await dlg.getByLabel('รหัสผ่าน').fill(password)
  await vselect(page, 'ตำแหน่ง', 'cashier')
  await dlg.getByRole('button', { name: 'เพิ่มข้อมูล' }).click()
  await settle(page)
  await search.fill(fname)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: fname, exact: true }).count() === 1, 'added employee visible')

  // EDIT
  await page.getByRole('button', { name: 'แก้ไข' }).first().click()
  const dlg2 = page.locator('.v-dialog--active')
  await dlg2.getByLabel('ชื่อ', { exact: true }).fill(fname2)
  await dlg2.getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await search.fill(fname2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: fname2, exact: true }).count() === 1, 'edited employee visible')

  // VERIFY the new employee can log in (fresh browser context)
  const { browser: b2, page: p2 } = await launch()
  try {
    await p2.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
    const inputs = p2.locator('input')
    await inputs.nth(0).waitFor({ state: 'visible' })
    await inputs.nth(0).fill(username)
    await inputs.nth(1).fill(password)
    await p2.getByRole('button', { name: 'Login' }).click()
    await p2.waitForURL(/\/seller/, { timeout: 20000 })
    assert(p2.url().includes('/seller'), 'new cashier logs in -> /seller')
  } finally {
    await b2.close()
  }

  // DELETE
  await page.getByRole('button', { name: 'ลบ' }).first().click()
  await page.locator('.v-dialog--active').getByRole('button', { name: 'ลบ' }).click()
  await settle(page)
  await search.fill(fname2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: fname2, exact: true }).count() === 0, 'deleted employee gone')
}).then(ok => process.exit(ok ? 0 : 1))
