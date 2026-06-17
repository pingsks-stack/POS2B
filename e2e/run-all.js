// Runs every *.test.js sequentially and prints a summary.
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const files = fs
  .readdirSync(__dirname)
  .filter(f => f.endsWith('.test.js'))
  .sort()

// smoke first if present
files.sort((a, b) => (a === 'smoke.test.js' ? -1 : b === 'smoke.test.js' ? 1 : 0))

let pass = 0
let fail = 0
const failed = []

for (const f of files) {
  try {
    execSync('node ' + path.join(__dirname, f), { stdio: 'inherit' })
    pass++
  } catch (e) {
    fail++
    failed.push(f)
  }
}

console.log('\n==================================')
console.log(`RESULT: ${pass} passed, ${fail} failed`)
if (failed.length) console.log('Failed: ' + failed.join(', '))
console.log('==================================')
process.exit(fail ? 1 : 0)
