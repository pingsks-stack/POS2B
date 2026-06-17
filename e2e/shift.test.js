// Shift: open drawer -> make a cash sale -> close -> Z-report reconciles.
const { BASE, login, assert, run, settle, addProduct } = require('./lib')

run('shift-zreport', async page => {
  await login(page, 'admin')
  await page.goto(BASE + '/manage/cash', { waitUntil: 'domcontentloaded' })
  await page.getByText('เงินสด / รอบขาย').first().waitFor()
  await page.waitForTimeout(500)

  // open shift with 1000 starting cash
  await page.getByRole('button', { name: 'เปิดรอบขาย' }).click()
  const odlg = page.locator('.v-dialog--active')
  await odlg.getByLabel('เงินตั้งต้นในลิ้นชัก (บาท)').fill('1000')
  await odlg.getByRole('button', { name: 'เปิดรอบ' }).click()
  await settle(page)
  await page.waitForTimeout(400)
  assert(await page.getByText('รอบขายเปิดอยู่').count() === 1, 'shift opened')

  // make a cash sale of เค้กช็อกโกแลต (75, no options)
  await page.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
  await page.getByText('เค้กช็อกโกแลต', { exact: true }).first().waitFor()
  await addProduct(page, 'เค้กช็อกโกแลต')
  await page.getByRole('button', { name: /ชำระเงิน \(/ }).click()
  const cdlg = page.locator('.v-dialog--active')
  await cdlg.getByLabel('รับเงินมา (บาท)').fill('75')
  await page.waitForTimeout(200)
  await cdlg.getByRole('button', { name: 'ชำระเงิน' }).click()
  await page.waitForTimeout(800)
  // close receipt if shown
  const rclose = page.locator('.v-dialog--active').getByRole('button', { name: 'ปิด' })
  if (await rclose.count()) await rclose.first().click()
  await settle(page)

  // back to cash page -> shift shows the 75 sale
  await page.goto(BASE + '/manage/cash', { waitUntil: 'domcontentloaded' })
  await page.getByText('รอบขายเปิดอยู่').first().waitFor()
  await page.waitForTimeout(500)
  assert(await page.getByText('1,075.00').count() >= 1, 'expected drawer = 1000 + 75 cash sale')

  // close shift, count exactly 1075 -> diff 0
  await page.getByRole('button', { name: 'ปิดรอบขาย' }).click()
  const xdlg = page.locator('.v-dialog--active')
  await xdlg.getByLabel('นับเงินสดจริงในลิ้นชัก (บาท)').fill('1075')
  await xdlg.getByRole('button', { name: 'ปิดรอบ' }).click()
  await page.waitForTimeout(600)

  // Z-report
  const z = page.locator('.v-dialog--active')
  assert(await z.getByText('Z-Report').count() === 1, 'Z-report shown')
  assert(await z.getByText('+0.00').count() + await z.getByText('0.00', { exact: false }).count() >= 1, 'has figures')
  // diff row should be exactly 0.00 and success colored
  assert(await z.locator('.success--text', { hasText: '0.00' }).count() >= 1, 'cash reconciles (diff 0.00)')
  await z.getByRole('button', { name: 'ปิด' }).click()
  await settle(page)
  assert(await page.getByText('ยังไม่ได้เปิดรอบขาย').count() === 1, 'shift closed')
}).then(ok => process.exit(ok ? 0 : 1))
