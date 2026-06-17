// Reusable option groups: managed separately, attached to products by id,
// and resolved into product.options for the seller.
const { BASE, login, assert, run, settle } = require('./lib')

run('option-groups', async page => {
  await login(page, 'admin')

  // 1) management page lists the seeded groups
  await page.goto(BASE + '/manage/optiongroup', { waitUntil: 'domcontentloaded' })
  await page.getByText('เพิ่มชุดตัวเลือก').first().waitFor()
  await page.waitForTimeout(400)
  for (const name of ['ประเภท', 'ขนาด', 'ความหวาน', 'เพิ่มเติม']) {
    assert(await page.getByText(name, { exact: true }).count() > 0, 'group listed: ' + name)
  }

  // 2) create a new group through the UI
  await page.getByRole('button', { name: 'เพิ่มชุดตัวเลือก' }).click()
  await page.waitForTimeout(400)
  const dlg = page.locator('.v-dialog--active')
  await dlg.getByLabel(/ชื่อชุดตัวเลือก/).fill('ทดสอบกลุ่ม')
  // first choice row
  await dlg.getByLabel('ชื่อตัวเลือก').first().fill('พิเศษ')
  await dlg.getByRole('button', { name: 'เพิ่มข้อมูล' }).click()
  await settle(page)
  await page.waitForTimeout(500)
  assert(await page.getByText('ทดสอบกลุ่ม', { exact: true }).count() > 0, 'new group saved + listed')

  // 3) product editor exposes the reusable-group selector
  await page.goto(BASE + '/manage/product', { waitUntil: 'domcontentloaded' })
  await page.getByText('เพิ่มสินค้า').first().waitFor()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'เพิ่มสินค้า' }).click()
  await page.waitForTimeout(400)
  assert(await page.locator('.v-dialog--active').getByText('ชุดตัวเลือก (เลือกจากที่สร้างไว้)').count() > 0,
    'product editor has the reusable option-group selector')

  // 4) API: a product attached to a group resolves that group into options
  const result = await page.evaluate(async () => {
    const groups = await window.$nuxt.$axios.$get('/optiongroup')
    const typ = groups.find(g => g.name === 'ประเภท')
    const res = await window.$nuxt.$axios.$post('/product', {
      product_name: 'เมนูทดสอบ OG', ref_cate_id: '', ref_uid: '',
      price: 40, price_cost: 10, stock: 5,
      option_group_ids: [typ._id], options: []
    })
    const id = res.data._id
    const products = await window.$nuxt.$axios.$get('/product')
    const p = products.find(x => x._id === id)
    return { names: (p.options || []).map(o => o.name), choices: (p.options[0] && p.options[0].choices || []).map(c => c.label) }
  })
  assert(result.names.includes('ประเภท'), 'attached group resolved into product.options')
  assert(result.choices.join(',') === 'ร้อน,เย็น,ปั่น', 'group choices resolved (ร้อน,เย็น,ปั่น)')
}).then(ok => process.exit(ok ? 0 : 1))
