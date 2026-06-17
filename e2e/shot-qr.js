const { login, launch, addProduct } = require('./lib')
const B = 'http://localhost:3000'
;(async () => {
  const { browser, page } = await launch()
  await login(page, 'cashier')
  await page.goto(B + '/seller', { waitUntil: 'domcontentloaded' })
  await page.getByText('ลาเต้', { exact: true }).first().waitFor()
  await addProduct(page, 'ลาเต้')
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /ชำระเงิน \(/ }).click()
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByRole('button', { name: 'QR พร้อมเพย์' }).click()
  await page.waitForTimeout(900) // wait QR render
  await page.screenshot({ path: 'qr-checkout.png' })
  await browser.close()
  console.log('qr-checkout saved')
})()
