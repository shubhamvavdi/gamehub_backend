require('dotenv').config()
const pool = require('../config/db')

pool.query('SELECT version()')
  .then(([rows]) => {
    console.log('Neon PostgreSQL connection OK')
    console.log(rows[0].version)
  })
  .catch(error => {
    console.error('Database connection failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())