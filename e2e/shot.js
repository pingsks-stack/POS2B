// Ad-hoc screenshot helper: node shot.js <path> <outfile>
const { login, launch } = require('./lib')
;(async () => {
  const path = process.argv[2] || '/seller'
  const out = process.argv[3] || 'shot.png'
  const role = process.argv[4] || 'cashier'
  const { browser, page } = await launch()
  await login(page, role)
  await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: out, fullPage: true })
  await browser.close()
  console.log('saved ' + out)
})()
