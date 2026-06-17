// Quick member registration from the POS: nickname or phone only.
const { BASE, login, assert, run } = require('./lib')

run('quick-member-register', async page => {
  await login(page, 'cashier')
  await page.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
  await page.getByText('ลาเต้', { exact: true }).first().waitFor()

  // open the member picker
  await page.getByRole('button', { name: 'ลูกค้าทั่วไป' }).click()
  await page.waitForTimeout(400)
  const dlg = page.locator('.v-dialog--active')

  // open quick-register form
  await dlg.getByRole('button', { name: 'สมัครเร็ว' }).click()
  await page.waitForTimeout(300)

  const nick = 'เร็ว' + (Date.now() % 100000)
  await dlg.getByLabel('ชื่อ / ชื่อเล่น').fill(nick)
  await dlg.getByLabel('เบอร์โทร', { exact: true }).fill('09' + (Date.now() % 100000000))
  await dlg.getByRole('button', { name: /สมัคร & เลือก/ }).click()
  await page.waitForTimeout(900)

  // dialog closed + the new member is now selected on the POS header
  assert(await page.getByRole('button', { name: new RegExp(nick) }).count() >= 1,
    'new member registered + auto-selected on POS')

  // and it persists: reopen picker, search the nick -> found
  await page.getByRole('button', { name: new RegExp(nick) }).first().click()
  await page.waitForTimeout(400)
  const dlg2 = page.locator('.v-dialog--active')
  await dlg2.getByLabel('ค้นหาชื่อ / เบอร์โทร').fill(nick)
  await page.waitForTimeout(300)
  assert(await dlg2.getByText(nick, { exact: false }).count() >= 1, 'new member saved + searchable')
}).then(ok => process.exit(ok ? 0 : 1))
