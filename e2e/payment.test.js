// Payment methods (QR) + redeem points as discount.
const { BASE, login, assert, run, settle, addProduct } = require('./lib')

run('payment-and-points', async page => {
  await login(page, 'cashier')
  await page.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
  await page.getByText('ลาเต้', { exact: true }).first().waitFor()

  // add ลาเต้ (default 60)
  await addProduct(page, 'ลาเต้')
  assert(await page.getByText('60.00').count() >= 1, 'subtotal 60')

  // attach สมชาย and read starting points
  await page.getByRole('button', { name: /ลูกค้าทั่วไป/ }).click()
  const mdlg = page.locator('.v-dialog--active')
  await mdlg.getByLabel('ค้นหาชื่อ / เบอร์โทร').fill('สมชาย')
  await page.waitForTimeout(300)
  const sub = await mdlg.locator('.v-list-item', { hasText: 'สมชาย' }).first().innerText()
  const startPts = parseInt((sub.match(/(\d+)\s*แต้ม/) || [])[1], 10) || 0
  await mdlg.getByText('สมชาย', { exact: false }).first().click()
  await settle(page)

  // checkout: redeem 20 points -> net 40
  await page.getByRole('button', { name: /ชำระเงิน \(/ }).click()
  const cdlg = page.locator('.v-dialog--active')
  await cdlg.getByLabel('ใช้แต้ม (1 แต้ม = 1฿)').fill('20')
  await page.waitForTimeout(300)
  assert(await cdlg.getByText('40.00').count() >= 1, 'net 40 after redeeming 20 points')

  // pay by QR (no cash needed)
  await cdlg.getByRole('button', { name: 'QR พร้อมเพย์' }).click()
  await page.waitForTimeout(300)
  assert(await cdlg.getByText('สแกน QR พร้อมเพย์เพื่อชำระ').count() === 1, 'QR panel shown')
  await cdlg.getByRole('button', { name: 'ชำระเงิน' }).click()
  await page.waitForTimeout(800)

  // receipt assertions
  const r = page.locator('.v-dialog--active')
  assert(await r.getByText('ใบเสร็จรับเงิน').count() === 1, 'receipt shown')
  assert(await r.getByText('QR พร้อมเพย์').count() >= 1, 'paid by QR')
  // earned = floor(40/10)*2 = 8 ; balance = start - 20 + 8
  assert(await r.getByText('+8').count() === 1, 'earned 8 points')
  const expectBal = startPts - 20 + 8
  assert(await r.getByText(String(expectBal), { exact: false }).count() >= 1,
    `new balance ${expectBal} shown`)
}).then(ok => process.exit(ok ? 0 : 1))
