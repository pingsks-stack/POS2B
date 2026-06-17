// Changing shop name updates the sidebar brand + browser tab title live.
const { BASE, login, assert, run, settle } = require('./lib')

run('branding-name', async page => {
  const name = 'ร้านของฉัน-' + Date.now()

  await login(page, 'admin')
  await page.goto(BASE + '/manage/settings', { waitUntil: 'domcontentloaded' })
  await page.getByText('ตั้งค่าระบบ').first().waitFor()
  await page.waitForTimeout(500)

  // change shop name + save (ข้อมูลร้าน card)
  await page.getByLabel('ชื่อร้าน').fill(name)
  await page.getByRole('button', { name: 'บันทึกข้อมูลร้าน' }).click()
  await page.getByText(/บันทึก.*สำเร็จ/).first().waitFor({ timeout: 8000 })
  await page.waitForTimeout(500)

  // sidebar brand updates live (store)
  assert(await page.locator('.v-navigation-drawer').getByText(name).count() >= 1, 'sidebar brand shows new shop name')
  // browser tab title updates
  const title = await page.title()
  assert(title.includes(name), `document.title = "${title}" includes new name`)

  // revert
  await page.getByLabel('ชื่อร้าน').fill('SHIFT CAFÉ')
  await page.getByRole('button', { name: 'บันทึกข้อมูลร้าน' }).click()
  await settle(page)
}).then(ok => process.exit(ok ? 0 : 1))
