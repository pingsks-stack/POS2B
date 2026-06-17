// Product CRUD through the real UI (incl. category/unit selects + image upload).
const fs = require('fs')
const path = require('path')
const { BASE, login, assert, run, settle, vselect } = require('./lib')

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

run('product-crud', async page => {
  const name = 'สินค้าทดสอบ-' + Date.now()
  const name2 = name + '-แก้ไข'
  const tmpImg = path.join(__dirname, 'tmp-test.png')
  fs.writeFileSync(tmpImg, PNG)

  await login(page, 'admin')
  await page.goto(BASE + '/manage/product', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่มสินค้า' }).waitFor()
  const search = page.locator('.v-card__title').getByRole('textbox')

  // --- ADD (with image) ---
  await page.getByRole('button', { name: 'เพิ่มสินค้า' }).click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByLabel('ชื่อสินค้า').fill(name)
  await vselect(page, 'ประเภท', 'กาแฟ')
  await vselect(page, 'หน่วย', 'แก้ว')
  await dlg.getByLabel('ราคาต้นทุน').fill('15')
  await dlg.getByLabel('ราคาขาย').fill('45')
  await dlg.getByLabel('จำนวน Stock').fill('25')
  await dlg.locator('input[type=file]').setInputFiles(tmpImg)
  await page.waitForTimeout(800) // wait for image upload
  await dlg.getByRole('button', { name: 'เพิ่มข้อมูล' }).click()
  await settle(page)
  await search.fill(name)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name, exact: true }).count() === 1, 'added product visible')
  assert(await page.locator('tbody img').count() >= 1, 'product image rendered')

  // --- EDIT (rename + change price) ---
  await page.getByRole('button', { name: 'แก้ไข' }).first().click()
  const dlg2 = page.locator('.v-dialog--active')
  await dlg2.getByLabel('ชื่อสินค้า').fill(name2)
  await dlg2.getByLabel('ราคาขาย').fill('55')
  await dlg2.getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await search.fill(name2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: name2, exact: true }).count() === 1, 'edited product visible')
  assert(await page.getByRole('cell', { name: '55', exact: true }).count() >= 1, 'price updated to 55')

  // --- DELETE ---
  await page.getByRole('button', { name: 'ลบ' }).first().click()
  await page.locator('.v-dialog--active').getByRole('button', { name: 'ลบ' }).click()
  await settle(page)
  await search.fill(name2)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: name2, exact: true }).count() === 0, 'deleted product gone')

  fs.unlinkSync(tmpImg)
}).then(ok => process.exit(ok ? 0 : 1))
