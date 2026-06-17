// Member-facing display pages now show real API data (not hardcoded).
const { BASE, login, assert, run } = require('./lib')

run('display-pages', async page => {
  await login(page, 'admin')

  // coupon page shows the seeded coupon WELCOME10, and not the old fake "โคตรรวย"
  await page.goto(BASE + '/coupon', { waitUntil: 'domcontentloaded' })
  await page.getByText('คูปอง').first().waitFor()
  await page.waitForTimeout(800)
  assert(await page.getByText('WELCOME10').count() >= 1, 'coupon page shows real coupon WELCOME10')
  assert(await page.getByText('โคตรรวย').count() === 0, 'no hardcoded coupon left')

  // member profile shows the logged-in user's real name, not "Santi Chooprayoon"
  await page.goto(BASE + '/member', { waitUntil: 'domcontentloaded' })
  await page.getByText('ข้อมูลส่วนตัว').first().waitFor()
  await page.waitForTimeout(500)
  assert(await page.getByText('ผู้ดูแล').count() >= 1, 'member page shows real user name')
  assert(await page.getByText('Santi Chooprayoon').count() === 0, 'no hardcoded profile left')

  // history page renders without the hardcoded "214001" bill id
  await page.goto(BASE + '/history_buy', { waitUntil: 'domcontentloaded' })
  await page.getByText('รายการประวัติการสั่งซื้อ').first().waitFor()
  await page.waitForTimeout(500)
  assert(await page.getByText('214001').count() === 0, 'no hardcoded order history left')

  // point page renders without hardcoded fake rows
  await page.goto(BASE + '/point', { waitUntil: 'domcontentloaded' })
  await page.getByText('รายการประวัติพอยท์ของฉัน').first().waitFor()
  await page.waitForTimeout(500)
  assert(await page.getByText('215055').count() === 0, 'no hardcoded point history left')
}).then(ok => process.exit(ok ? 0 : 1))
