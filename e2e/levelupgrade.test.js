// Auto level-up: a member is promoted when points reach a level's min_point.
const { BASE, login, assert, run } = require('./lib')

run('level-auto-upgrade', async page => {
  await login(page, 'admin')
  await page.waitForTimeout(300)

  const result = await page.evaluate(async () => {
    const ax = window.$nuxt.$axios
    // new member: 0 points, default level
    const created = await ax.$post('/customer', { fname: 'เลเวลเทส', lname: '', tel: '', point: 0, ref_level_id: '60e439b7c7d6ae35548c7b62' })
    const id = (created.data ? created.data : created)._id
    // give points past the Silver threshold (100) via the point screen path
    await ax.$put('/customer/' + id, { point: 150, auto_level: true })
    let list = await ax.$get('/customer')
    const silver = list.find(c => c._id === id)
    const silverLevel = silver.ref_level_id && silver.ref_level_id.level_name
    // push past Gold (300)
    await ax.$put('/customer/' + id, { point: 350, auto_level: true })
    list = await ax.$get('/customer')
    const gold = list.find(c => c._id === id)
    const goldLevel = gold.ref_level_id && gold.ref_level_id.level_name
    // cleanup
    await ax.$delete('/customer/' + id)
    return { silverLevel, goldLevel }
  })

  assert(result.silverLevel === 'Silver', 'reached 150 pts -> Silver (got ' + result.silverLevel + ')')
  assert(result.goldLevel === 'Gold', 'reached 350 pts -> Gold (got ' + result.goldLevel + ')')
}).then(ok => process.exit(ok ? 0 : 1))
