// Split payment + credit (unpaid) bill + settle later.
const { BASE, login, assert, run, settle, addProduct } = require('./lib')

run('split-and-credit', async page => {
  await login(page, 'cashier')
  await page.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
  await page.getByText('ลาเต้', { exact: true }).first().waitFor()

  // --- SPLIT: ลาเต้ 60 = cash 30 + qr 30 ---
  await addProduct(page, 'ลาเต้') // 60
  await page.getByRole('button', { name: /ชำระเงิน \(/ }).click()
  let dlg = page.locator('.v-dialog--active')
  await dlg.getByRole('button', { name: 'แยกชำระ' }).click()
  await dlg.getByLabel('เงินสด').fill('30')
  await dlg.getByLabel('QR พร้อมเพย์').fill('30')
  await page.waitForTimeout(300)
  assert(await dlg.getByText('ครบ').count() >= 1, 'split shows ครบ when sum = net')
  await dlg.getByRole('button', { name: 'ชำระเงิน' }).click()
  await page.getByText('ชำระเงินสำเร็จ').waitFor({ timeout: 8000 })
  await settle(page)
  // close receipt
  const rc = page.locator('.v-dialog--active').getByRole('button', { name: 'ปิด' })
  if (await rc.count()) await rc.first().click()
  await settle(page)

  // --- CREDIT: add product, save as เงินเชื่อ ---
  const bill = 'เชื่อ-' + Date.now()
  await addProduct(page, 'อเมริกาโน่') // 50
  await page.getByRole('button', { name: /ชำระเงิน \(/ }).click()
  dlg = page.locator('.v-dialog--active')
  await dlg.getByLabel('ชื่อบิล / ลูกค้า').fill(bill)
  await dlg.getByRole('button', { name: 'เงินเชื่อ' }).click()
  await page.getByText(/เงินเชื่อ/).first().waitFor({ timeout: 8000 })
  await settle(page)

  // --- settle the credit bill from receipts page ---
  await page.goto(BASE + '/manage/receipts', { waitUntil: 'domcontentloaded' })
  await page.getByText('ดูสลิปย้อนหลัง').first().waitFor()
  await page.waitForTimeout(500)
  await page.locator('.v-card__title').getByRole('textbox').fill(bill)
  await page.waitForTimeout(400)
  assert(await page.getByText('เงินเชื่อ').count() >= 1, 'credit bill shows สถานะ เงินเชื่อ')
  await page.getByRole('button', { name: 'ชำระเงิน' }).first().click()
  await page.getByText('ชำระบิลเงินเชื่อแล้ว').waitFor({ timeout: 8000 })
  await page.waitForTimeout(400)
  assert(await page.getByText('ชำระแล้ว').count() >= 1, 'credit bill settled -> ชำระแล้ว')
}).then(ok => process.exit(ok ? 0 : 1))
