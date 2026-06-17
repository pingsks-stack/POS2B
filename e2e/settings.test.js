// Settings page: edit shop info and confirm it persists + nav link present.
const { BASE, login, assert, run, settle } = require('./lib')

run('settings-save', async page => {
  const shop = 'ร้านทดสอบ-' + Date.now()

  await login(page, 'admin')
  await page.goto(BASE + '/manage', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  // nav has the settings link
  assert(await page.locator('.v-navigation-drawer').getByText('ตั้งค่า').count() >= 1, 'nav has ตั้งค่า link')

  await page.goto(BASE + '/manage/settings', { waitUntil: 'domcontentloaded' })
  await page.getByText('ตั้งค่าระบบ').first().waitFor()
  await page.waitForTimeout(400)

  // change shop name + point rate, save
  await page.getByLabel('ชื่อร้าน').fill(shop)
  await page.getByLabel('ใช้จ่ายกี่บาท ได้ 1 แต้ม').fill('20')
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).click()
  await page.getByText('บันทึกการตั้งค่าสำเร็จ').waitFor()
  assert(true, 'save success snackbar')

  // reload -> persisted
  await page.goto(BASE + '/manage/settings', { waitUntil: 'domcontentloaded' })
  await page.getByText('ตั้งค่าระบบ').first().waitFor()
  await page.waitForTimeout(500)
  assert((await page.getByLabel('ชื่อร้าน').inputValue()) === shop, 'shop name persisted after reload')

  // test-print the sample slip (browser/iframe path) -> should not error
  await page.getByRole('button', { name: 'ทดสอบพิมพ์', exact: true }).click()
  await page.getByText('ส่งไปยังหน้าต่างพิมพ์แล้ว').waitFor({ timeout: 10000 })
  assert(true, 'sample slip test-print works (browser path)')

  // revert to keep demo clean
  await page.getByLabel('ชื่อร้าน').fill('SHIFT CAFÉ')
  await page.getByLabel('ใช้จ่ายกี่บาท ได้ 1 แต้ม').fill('10')
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).click()
  await settle(page)
}).then(ok => process.exit(ok ? 0 : 1))
