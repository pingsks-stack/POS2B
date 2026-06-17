// Render the actual slip HTML produced by the printer plugin and screenshot it.
const { login, launch } = require('./lib')
;(async () => {
  const { browser, page } = await launch()
  await login(page, 'admin')
  await page.goto('http://localhost:3000/manage/settings', { waitUntil: 'domcontentloaded' })
  await page.getByText('ตั้งค่าระบบ').first().waitFor()
  await page.waitForTimeout(800)

  const html = await page.evaluate(async () => {
    const qrImage = await window.$nuxt.$pp.qr('0812345678', 239)
    return window.$nuxt.$printer.buildHtml(
      {
        bill_name: 'โต๊ะ 5',
        datetime: Date.now(),
        list_product: [
          { name: 'อเมริกาโน่', qty: 1, price: 50, options: ['ร้อน', 'หวานน้อย'] },
          { name: 'ลาเต้', qty: 2, price: 140, options: ['เย็น', 'แก้วใหญ่'] },
          { name: 'เค้กช็อกโกแลต', qty: 1, price: 75, options: [] }
        ],
        subTotal: 265, discount: 26, pointsUsed: 0, total_price: 239,
        paymentMethod: 'cash', cash: 500, change: 261, earnedPoints: 23, newBalance: 143,
        memberName: 'สมชาย ใจดี', qrImage
      },
      {
        shop_name: 'SHIFT CAFÉ', branch: 'สาขาสำนักงานใหญ่',
        address: '123 ถนนกาแฟ', subdistrict: 'แขวงลาเต้', district: 'เขตอเมริกาโน่',
        province: 'กรุงเทพฯ', postcode: '10110', tel: '02-000-0000', tax_id: '0105500000000',
        receipt_footer: 'ขอบคุณที่ใช้บริการ แล้วพบกันใหม่'
      }
    )
  })

  const p2 = await browser.newPage()
  await p2.setViewportSize({ width: 240, height: 700 })
  await p2.setContent(html)
  await p2.waitForTimeout(400)
  await p2.screenshot({ path: 'slip-preview.png', fullPage: true })
  await browser.close()
  console.log('slip-preview saved')
})()
