const { login, launch, addProduct } = require('./lib')
;(async () => {
  const { browser, page } = await launch()
  await login(page, 'cashier')
  await page.goto('http://localhost:3000/seller', { waitUntil: 'domcontentloaded' })
  await page.getByText('ลาเต้', { exact: true }).first().waitFor()
  await page.waitForTimeout(800)

  // option dialog
  await page.locator('.scroll .v-card').filter({ hasText: 'ลาเต้' }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'feat-options.png' })
  await page.locator('.v-dialog--active').getByRole('button', { name: 'เพิ่มลงตะกร้า' }).click()
  await page.waitForTimeout(400)

  // attach member + checkout dialog (points + payment methods)
  await page.getByRole('button', { name: /ลูกค้าทั่วไป/ }).click()
  const m = page.locator('.v-dialog--active')
  await m.getByText('สมชาย', { exact: false }).first().click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: /ชำระเงิน \(/ }).click()
  await page.waitForTimeout(500)
  await page.locator('.v-dialog--active').getByRole('button', { name: 'QR พร้อมเพย์' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'feat-checkout.png' })

  await browser.close()

  // cash / shift page
  const s2 = await launch()
  await login(s2.page, 'admin')
  await s2.page.goto('http://localhost:3000/manage/cash', { waitUntil: 'domcontentloaded' })
  await s2.page.getByText('เงินสด / รอบขาย').first().waitFor()
  await s2.page.waitForTimeout(800)
  await s2.page.screenshot({ path: 'feat-cash.png', fullPage: true })
  await s2.browser.close()
  console.log('feature screenshots saved')
})()
