// LINE CRM: broadcast a promotion to linked members + log shows it.
const { BASE, login, assert, run, settle } = require('./lib')

run('line-crm', async page => {
  const msg = 'โปรทดสอบ-' + Date.now()

  await login(page, 'admin')

  // nav link present
  await page.goto(BASE + '/manage', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  assert(await page.locator('.v-navigation-drawer').getByText('LINE CRM').count() >= 1, 'nav has LINE CRM')

  await page.goto(BASE + '/manage/line-crm', { waitUntil: 'domcontentloaded' })
  await page.getByText('ส่งโปรโมชั่น (Broadcast)').first().waitFor()
  await page.waitForTimeout(400)

  // at least 1 linked member (สมชาย seeded with line)
  assert(await page.getByText('สมาชิกที่เชื่อม LINE').count() >= 1, 'stats card shown')

  // broadcast
  await page.getByRole('textbox', { name: 'ข้อความ' }).fill(msg)
  await page.getByRole('button', { name: 'ส่งบรอดแคสต์' }).click()
  await page.getByText(/ส่งถึง \d+ คน/).waitFor({ timeout: 8000 })
  await page.waitForTimeout(600)

  // the message appears in the log table
  assert(await page.getByText(msg).count() >= 1, 'broadcast message appears in log')

  // customer table shows LINE-linked indicator
  await page.goto(BASE + '/manage/customer', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'เพิ่มสมาชิก' }).waitFor()
  await page.waitForTimeout(400)
  assert(await page.getByText('เชื่อมแล้ว').count() >= 1, 'customer table shows LINE linked chip')
}).then(ok => process.exit(ok ? 0 : 1))
