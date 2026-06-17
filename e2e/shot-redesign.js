const { login, launch } = require('./lib')
const B = 'http://localhost:3000'
;(async () => {
  // login page (no auth)
  let s = await launch()
  await s.page.goto(B + '/login', { waitUntil: 'domcontentloaded' })
  await s.page.locator('input').first().waitFor()
  await s.page.waitForTimeout(1500)
  await s.page.screenshot({ path: 'rd-login.png' })
  await s.browser.close()

  // admin manage page
  s = await launch()
  await login(s.page, 'admin')
  await s.page.goto(B + '/manage/product', { waitUntil: 'domcontentloaded' })
  await s.page.getByText('เพิ่มสินค้า').first().waitFor()
  await s.page.waitForTimeout(1500)
  await s.page.screenshot({ path: 'rd-manage.png' })
  await s.browser.close()

  // member page
  s = await launch()
  await login(s.page, 'admin')
  await s.page.goto(B + '/member', { waitUntil: 'domcontentloaded' })
  await s.page.getByText('ข้อมูลส่วนตัว').first().waitFor()
  await s.page.waitForTimeout(1200)
  await s.page.screenshot({ path: 'rd-member.png', fullPage: true })
  await s.browser.close()

  console.log('redesign screenshots saved')
})()
