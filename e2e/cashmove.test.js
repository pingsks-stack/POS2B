// Cash in/out (income-expense) affects the expected drawer + Z-report.
const { BASE, login, assert, run, settle } = require('./lib')

run('cash-in-out', async page => {
  await login(page, 'admin')
  await page.goto(BASE + '/manage/cash', { waitUntil: 'domcontentloaded' })
  await page.getByText('เงินสด / รอบขาย').first().waitFor()
  await page.waitForTimeout(500)

  // open shift 1000
  await page.getByRole('button', { name: 'เปิดรอบขาย' }).click()
  let d = page.locator('.v-dialog--active')
  await d.getByLabel('เงินตั้งต้นในลิ้นชัก (บาท)').fill('1000')
  await d.getByRole('button', { name: 'เปิดรอบ' }).click()
  await settle(page)
  await page.getByText('รอบขายเปิดอยู่').first().waitFor()

  // cash in 200
  await page.getByRole('button', { name: 'เงินเข้า' }).click()
  d = page.locator('.v-dialog--active')
  await d.getByLabel('จำนวนเงิน (บาท)').fill('200')
  await d.getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await page.waitForTimeout(400)

  // cash out 50
  await page.getByRole('button', { name: 'เงินออก' }).click()
  d = page.locator('.v-dialog--active')
  await d.getByLabel('จำนวนเงิน (บาท)').fill('50')
  await d.getByRole('button', { name: 'บันทึก' }).click()
  await settle(page)
  await page.waitForTimeout(500)

  // expected drawer = 1000 + 200 - 50 = 1150 (no cash sales yet)
  assert(await page.getByText('1,150.00').count() >= 1, 'expected drawer reflects cash in/out (1,150.00)')

  // close -> Z-report shows it, then clean up
  await page.getByRole('button', { name: 'ปิดรอบขาย' }).click()
  d = page.locator('.v-dialog--active')
  await d.getByLabel('นับเงินสดจริงในลิ้นชัก (บาท)').fill('1150')
  await d.getByRole('button', { name: 'ปิดรอบ' }).click()
  await page.waitForTimeout(600)
  const z = page.locator('.v-dialog--active')
  assert(await z.getByText('เงินเข้าเพิ่ม').count() === 1, 'Z-report shows cash-in line')
  assert(await z.locator('.success--text', { hasText: '0.00' }).count() >= 1, 'reconciles (diff 0.00)')
}).then(ok => process.exit(ok ? 0 : 1))
