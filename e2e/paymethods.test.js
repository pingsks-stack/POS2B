// Payment-method config: the enabled flag drives which methods appear at checkout.
const { BASE, login, assert, run, launch } = require('./lib')

const ALL = [
  { key: 'cash', label: 'เงินสด', icon: 'mdi-cash', kind: 'cash', enabled: true, builtin: true },
  { key: 'qr', label: 'QR พร้อมเพย์', icon: 'mdi-qrcode', kind: 'qr', enabled: true, builtin: true },
  { key: 'transfer', label: 'โอนเงิน', icon: 'mdi-bank', kind: 'transfer', enabled: true, builtin: true },
  { key: 'card', label: 'บัตรเครดิต/เดบิต', icon: 'mdi-credit-card-outline', kind: 'other', enabled: true, builtin: true },
  { key: 'split', label: 'แยกชำระ', icon: 'mdi-call-split', kind: 'split', enabled: true, builtin: true },
  { key: 'credit', label: 'เงินเชื่อ', icon: 'mdi-account-clock', kind: 'credit', enabled: true, builtin: true }
]
const setMethods = list =>
  fetch('http://localhost:5000/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_methods: list })
  })

const { addProduct } = require('./lib')
async function checkoutMethods() {
  const { browser, page } = await launch()
  try {
    await login(page, 'cashier')
    await page.goto(BASE + '/seller', { waitUntil: 'domcontentloaded' })
    await page.getByText('ลาเต้', { exact: true }).first().waitFor()
    await addProduct(page, 'ลาเต้')
    await page.getByRole('button', { name: /ชำระเงิน \(/ }).click()
    await page.waitForTimeout(400)
    const dlg = page.locator('.v-dialog--active')
    return {
      cash: await dlg.getByRole('button', { name: 'เงินสด' }).count(),
      transfer: await dlg.getByRole('button', { name: 'โอนเงิน' }).count()
    }
  } finally {
    await browser.close()
  }
}

run('payment-methods-config', async page => {
  // settings page shows the payment-methods config card with toggles
  await login(page, 'admin')
  await page.goto(BASE + '/manage/settings', { waitUntil: 'domcontentloaded' })
  await page.getByText('ตั้งค่าระบบ').first().waitFor()
  await page.waitForTimeout(400)
  const card = page.locator('.v-card', { hasText: 'วิธีชำระเงิน' }).first()
  assert(await card.locator('.v-input--switch').count() >= 6, 'payment-methods card has on/off switches')
  assert(await card.getByRole('button', { name: 'เพิ่มวิธีชำระเอง' }).count() === 1, 'has add-custom button')

  // disable โอนเงิน -> hidden at checkout
  await setMethods(ALL.map(m => (m.key === 'transfer' ? { ...m, enabled: false } : m)))
  let r = await checkoutMethods()
  assert(r.cash === 1, 'เงินสด available')
  assert(r.transfer === 0, 'โอนเงิน hidden when disabled')

  // enable all -> โอนเงิน back
  await setMethods(ALL)
  r = await checkoutMethods()
  assert(r.transfer === 1, 'โอนเงิน shown when enabled')
}).then(ok => process.exit(ok ? 0 : 1))
