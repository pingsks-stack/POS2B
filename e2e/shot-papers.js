const { login, launch } = require('./lib')
;(async () => {
  const { browser, page } = await launch()
  await login(page, 'admin')
  await page.goto('http://localhost:3000/manage/settings', { waitUntil: 'domcontentloaded' })
  await page.getByText('ตั้งค่าระบบ').first().waitFor()
  await page.waitForTimeout(700)

  const make = async paper => page.evaluate(async paper => {
    const s = await window.$nuxt.$axios.$get('/settings')
    const base = window.$nuxt.$axios.defaults.baseURL.replace('/api', '/')
    const total = 239
    const qrImage = s.promptpay_id ? await window.$nuxt.$pp.qr(s.promptpay_id, total) : ''
    const r = {
      bill_name: 'โต๊ะ 5', queue_no: 7, datetime: Date.now(), memberName: 'สมชาย ใจดี',
      list_product: [
        { name: 'อเมริกาโน่', qty: 1, price: 50, unit: 50, options: ['ร้อน', 'หวานน้อย'] },
        { name: 'ลาเต้', qty: 2, price: 140, unit: 70, options: ['เย็น', 'แก้วใหญ่'] },
        { name: 'เค้กช็อกโกแลต', qty: 1, price: 75, unit: 75, options: [] }
      ],
      subTotal: 265, discount: 26, pointsUsed: 0, total_price: total,
      paymentMethod: 'cash', cash: 500, change: 261, earnedPoints: 23, qrImage
    }
    return window.$nuxt.$printer.buildHtml(r, { ...s, logoUrl: s.logo ? base + s.logo : '' }, { paper })
  }, paper)

  const a4 = await make('A4')
  const p1 = await browser.newPage()
  await p1.setViewportSize({ width: 800, height: 1100 })
  await p1.setContent(a4)
  await p1.waitForTimeout(300)
  await p1.screenshot({ path: 'paper-a4.png', fullPage: true })

  const mm80 = await make('80')
  const p2 = await browser.newPage()
  await p2.setViewportSize({ width: 320, height: 700 })
  await p2.setContent(mm80)
  await p2.waitForTimeout(300)
  await p2.screenshot({ path: 'paper-80.png', fullPage: true })

  await browser.close()
  console.log('saved paper-a4.png + paper-80.png')
})()
