// Full POS flow: options + member + coupon + stock + cash/change + receipt + loyalty points.
const { BASE, login, assert, run, settle, addProduct } = require('./lib')

const stockOf = async (page, name) => {
  const card = page.locator('.scroll .v-card').filter({ hasText: name }).first()
  const txt = await card.locator('.v-chip').first().innerText()
  return parseInt(txt.replace(/\D/g, ''), 10) || 0
}

run('seller-pos-full', async page => {
  await login(page, 'cashier')
  await page.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
  await page.getByText('ลาเต้', { exact: true }).first().waitFor()

  const stockBefore = await stockOf(page, 'ลาเต้')

  // --- OPTIONS: add ลาเต้ เย็น(+10) แก้วใหญ่(+10) เพิ่มช็อต(+15) = 95 ---
  await addProduct(page, 'ลาเต้', async dlg => {
    await dlg.getByText('เย็น', { exact: false }).first().click()
    await dlg.getByText('แก้วใหญ่', { exact: false }).first().click()
    await dlg.getByText('เพิ่มช็อต', { exact: false }).first().click()
  })
  assert(await page.getByText('95').count() >= 1, 'option add-ons computed unit price 95')
  assert(await page.getByText('เย็น · แก้วใหญ่ · เพิ่มช็อต').count() === 1, 'cart shows chosen options')

  // clear and start a clean ลาเต้ (defaults = 60) for the rest of the flow
  await page.getByRole('button', { name: /ยกเลิกบิล/ }).click()
  await page.waitForTimeout(300)
  await addProduct(page, 'ลาเต้') // defaults -> 60
  assert(await page.getByText('60.00').count() >= 1, 'subtotal 60.00 after default add')

  // attach member สมชาย (Silver x2 points)
  await page.getByRole('button', { name: /ลูกค้าทั่วไป/ }).click()
  const mdlg = page.locator('.v-dialog--active')
  await mdlg.getByLabel('ค้นหาชื่อ / เบอร์โทร').fill('สมชาย')
  await page.waitForTimeout(300)
  await mdlg.getByText('สมชาย', { exact: false }).first().click()
  await settle(page)
  assert(await page.getByRole('button', { name: /สมชาย/ }).count() >= 1, 'member attached')

  // coupon WELCOME10 (10%) -> net 54
  await page.getByLabel('โค้ดคูปอง').fill('WELCOME10')
  await page.getByRole('button', { name: 'ใช้', exact: true }).click()
  await page.waitForTimeout(400)
  assert(await page.getByText('54.00').count() >= 1, 'net 54.00 after coupon')

  // checkout cash 100 -> change 46
  await page.getByRole('button', { name: /ชำระเงิน \(/ }).click()
  const cdlg = page.locator('.v-dialog--active')
  await cdlg.getByLabel('รับเงินมา (บาท)').fill('100')
  await page.waitForTimeout(300)
  assert(await cdlg.getByText('46.00').count() >= 1, 'change 46.00')
  await cdlg.getByRole('button', { name: 'ชำระเงิน' }).click()
  await page.waitForTimeout(800)

  // receipt: points floor(54/10)*2 = 10
  const rdlg = page.locator('.v-dialog--active')
  assert(await rdlg.getByText('ใบเสร็จรับเงิน').count() === 1, 'receipt shown')
  assert(await rdlg.getByText('+10').count() === 1, 'earned 10 points (Silver x2)')
  await rdlg.getByRole('button', { name: 'ปิด' }).click()
  await settle(page)
  await page.waitForTimeout(500)

  const stockAfter = await stockOf(page, 'ลาเต้')
  assert(stockAfter === stockBefore - 1, `stock ${stockBefore} -> ${stockBefore - 1}, got ${stockAfter}`)
}).then(ok => process.exit(ok ? 0 : 1))
