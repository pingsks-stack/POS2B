// Smoke test: can we log in as admin (-> /manage) and cashier (-> /seller)?
const { login, assert, run } = require('./lib')

;(async () => {
  let allPass = true

  allPass &= await run('login-admin', async page => {
    await login(page, 'admin')
    assert(page.url().includes('/manage'), 'admin lands on /manage, got ' + page.url())
  })

  allPass &= await run('login-cashier', async page => {
    await login(page, 'cashier')
    assert(page.url().includes('/seller'), 'cashier lands on /seller, got ' + page.url())
  })

  process.exit(allPass ? 0 : 1)
})()
