// Screenshot the redesigned seller page, empty and with items.
const { login, launch } = require('./lib')
;(async () => {
  const { browser, page } = await launch()
  await login(page, 'cashier')
  await page.goto('http://localhost:3000/seller', { waitUntil: 'domcontentloaded' })
  await page.getByText('ลาเต้', { exact: true }).first().waitFor()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'seller-after-empty.png', fullPage: true })

  // add a few items + member + coupon for a populated view
  await page.getByText('ลาเต้', { exact: true }).first().click()
  await page.getByText('อเมริกาโน่', { exact: true }).first().click()
  await page.getByText('อเมริกาโน่', { exact: true }).first().click()
  await page.getByText('เค้กช็อกโกแลต', { exact: true }).first().click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /ลูกค้าทั่วไป/ }).click()
  const mdlg = page.locator('.v-dialog--active')
  await mdlg.getByText('สมชาย', { exact: false }).first().click()
  await page.waitForTimeout(400)
  await page.getByLabel('โค้ดคูปอง').fill('WELCOME10')
  await page.getByRole('button', { name: 'ใช้', exact: true }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'seller-after-full.png', fullPage: true })

  await browser.close()
  console.log('screenshots saved')
})()
