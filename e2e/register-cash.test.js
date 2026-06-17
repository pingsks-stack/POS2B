// Register (member signup) + Cash summary pages.
const { BASE, login, assert, run, settle } = require('./lib')

run('register-and-cash', async page => {
  const fname = 'สมัครทดสอบ' + Date.now()

  await login(page, 'admin')

  // --- REGISTER a member, then confirm it persisted in the customer list ---
  await page.goto(BASE + '/manage/register', { waitUntil: 'domcontentloaded' })
  await page.getByText('ลงทะเบียนสมาชิกใหม่').first().waitFor()
  await page.getByLabel('ชื่อ', { exact: true }).fill(fname)
  await page.getByLabel('เบอร์โทร').fill('09' + String(Date.now()).slice(-8))
  await page.getByRole('button', { name: 'ลงทะเบียน' }).click()
  await page.getByText('ลงทะเบียนสมาชิกสำเร็จ').waitFor()
  assert(true, 'register success snackbar shown')

  await page.goto(BASE + '/manage/customer', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่มสมาชิก' }).waitFor()
  const search = page.locator('.v-card__title').getByRole('textbox')
  await search.fill(fname)
  await page.waitForTimeout(500)
  assert(await page.getByRole('cell', { name: fname, exact: true }).count() === 1, 'registered member persisted')

  // --- CASH summary page is wired to real data ---
  await page.goto(BASE + '/manage/cash', { waitUntil: 'domcontentloaded' })
  await page.getByText('เงินสด / รอบขาย').first().waitFor()
  await page.waitForTimeout(500)
  assert(await page.getByText('ยอดขายรวม (ชำระแล้ว)').count() === 1, 'cash summary card rendered')
  assert(await page.getByText('บิลล่าสุด').count() === 1, 'recent bills table rendered')
}).then(ok => process.exit(ok ? 0 : 1))
