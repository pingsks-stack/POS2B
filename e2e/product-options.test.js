// Define a product option in the manage form, then verify it shows up at the POS.
const { BASE, login, assert, run, settle, vselect, launch, addProduct } = require('./lib')

run('product-options-define', async page => {
  const name = 'เครื่องดื่มออปชั่น-' + Date.now()

  // --- admin defines a product with an option group ---
  await login(page, 'admin')
  await page.goto(BASE + '/manage/product', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่มสินค้า' }).click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByLabel('ชื่อสินค้า').fill(name)
  await vselect(page, 'ประเภท', 'กาแฟ')
  await vselect(page, 'หน่วย', 'แก้ว')
  await dlg.getByLabel('ราคาขาย').fill('40')
  await dlg.getByLabel('จำนวน Stock').fill('50')

  // per-product custom option group (reusable groups are tested in optiongroup.test.js)
  await dlg.getByRole('button', { name: 'เพิ่มกลุ่มเฉพาะ' }).click()
  await page.waitForTimeout(200)
  await dlg.getByLabel('ชื่อกลุ่ม').fill('พิเศษ')
  await dlg.getByLabel('ตัวเลือก').first().fill('ใส่วิป')
  await dlg.getByLabel('+ราคา').first().fill('12')
  await dlg.getByRole('button', { name: 'เพิ่มข้อมูล' }).click()
  await settle(page)

  // verify it persisted in the table
  await page.locator('.v-card__title').getByRole('textbox').fill(name)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name, exact: true }).count() === 1, 'product saved')

  // --- cashier sees the option at POS ---
  const { browser: b2, page: p2 } = await launch()
  try {
    await login(p2, 'cashier')
    await p2.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
    await p2.getByText(name, { exact: true }).first().waitFor()
    await addProduct(p2, name, async odlg => {
      assert(await odlg.getByText('พิเศษ').count() >= 1, 'option group shown at POS')
      assert(await odlg.getByText('ใส่วิป', { exact: false }).count() >= 1, 'option choice shown')
      await odlg.getByText('ใส่วิป', { exact: false }).first().click()
    })
    await p2.waitForTimeout(300)
    assert(await p2.getByText('52').count() >= 1, 'price 40 + option 12 = 52 in cart')
  } finally {
    await b2.close()
  }

  // cleanup
  await page.locator('.v-card__title').getByRole('textbox').fill(name)
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'ลบ' }).first().click()
  await page.locator('.v-dialog--active').getByRole('button', { name: 'ลบ' }).click()
  await settle(page)
}).then(ok => process.exit(ok ? 0 : 1))
