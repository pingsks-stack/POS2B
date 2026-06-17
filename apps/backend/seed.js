// Force re-create db.json with fresh sample data: `npm run seed`
const db = require('./db')
db.reseed()
console.log('Database reseeded -> db.json')
