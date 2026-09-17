require('dotenv').config()
const pool = require('../config/db')

pool.query('SELECT 1')
  .then(() => {
    console.log('Neon PostgreSQL connection OK')
  })
  .catch(error => {
    console.error('Database connection failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())