const { login, launch } = require('./lib')
;(async () => {
  const { browser, page } = await launch()
  await login(page, 'admin')
  await page.goto('http://localhost:3000/manage/settings', { waitUntil: 'domcontentloaded' })
  await page.getByText('ตั้งค่าระบบ').first().waitFor()
  await page.waitForTimeout(800)

  const html = await page.evaluate(async () => {
    const s = await window.$nuxt.$axios.$get('/settings')
    const base = window.$nuxt.$axios.defaults.baseURL.replace('/api', '/')
    const receipt = {
      bill_name: 'โต๊ะ 5', queue_no: 12, datetime: Date.now(),
      list_product: [
        { name: 'ลาเต้', qty: 1, options: ['เย็น', 'แก้วใหญ่', 'หวานน้อย'], unit: 80, price: 80 },
        { name: 'อเมริกาโน่', qty: 2, options: ['ร้อน'], unit: 50, price: 100 }
      ]
    }
    return window.$nuxt.$printer.buildStickerHtml(receipt, {
      ...s, logoUrl: s.logo ? base + s.logo : ''
    })
  })
  const p2 = await browser.newPage()
  await p2.setViewportSize({ width: 230, height: 700 })
  await p2.setContent(html)
  await p2.waitForTimeout(300)
  await p2.screenshot({ path: 'sticker-preview.png', fullPage: true })
  await browser.close()
  console.log('sticker-preview saved')
})()
