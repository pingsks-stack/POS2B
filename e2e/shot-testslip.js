// Render the test slip using REAL settings fetched from the backend.
const { login, launch } = require('./lib')
;(async () => {
  const { browser, page } = await launch()
  await login(page, 'admin')
  await page.goto('http://localhost:3000/manage/settings', { waitUntil: 'domcontentloaded' })
  await page.getByText('ตั้งค่าระบบ').first().waitFor()
  await page.waitForTimeout(800)

  const html = await page.evaluate(async () => {
    const s = await window.$nuxt.$axios.$get('/settings') // REAL settings
    const base = window.$nuxt.$axios.defaults.baseURL.replace('/api', '/')
    const items = [
      { name: 'อเมริกาโน่ (ร้อน)', qty: 1, price: 50, options: ['ร้อน', 'หวานน้อย'] },
      { name: 'เค้กช็อกโกแลต', qty: 1, price: 75, options: [] }
    ]
    const total = 125
    const qrImage = s.promptpay_id ? await window.$nuxt.$pp.qr(s.promptpay_id, total) : ''
    const receipt = {
      bill_name: 'ทดสอบพิมพ์', datetime: Date.now(), list_product: items,
      subTotal: total, discount: 0, pointsUsed: 0, total_price: total,
      paymentMethod: 'cash', cash: 500, change: 375,
      earnedPoints: Math.floor(total / (Number(s.point_per_baht) || 10)), qrImage
    }
    return window.$nuxt.$printer.buildHtml(receipt, {
      ...s, logoUrl: s.logo ? base + s.logo : ''
    })
  })

  const p2 = await browser.newPage()
  await p2.setViewportSize({ width: 240, height: 760 })
  await p2.setContent(html)
  await p2.waitForTimeout(400)
  await p2.screenshot({ path: 'testslip-real.png', fullPage: true })
  await browser.close()
  console.log('testslip-real saved')
})()
