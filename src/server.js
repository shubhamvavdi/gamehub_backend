require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const pool = require('./config/db')
const sdk = require('./routes/sdk')
const admin = require('./routes/admin')
const { notFound, errorHandler } = require('./middleware/errors')
const app = express()
const port = Number(process.env.PORT || 4000)
const origins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean)
const rateWindow = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000)
const corsOrigin = origins.length ? origins : process.env.NODE_ENV === 'production' ? false : true
app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: corsOrigin, credentials: false }))
app.use(express.json({ limit: '200kb' }))
app.use('/ads.txt', express.static('public/ads.txt', { fallthrough: false }))
app.use(
  rateLimit({
    windowMs: rateWindow,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false
  })
)
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({
      ok: true,
      service: 'gamehub-ad-backend',
      version: '2.0.0',
      database: 'connected'
    })
  } catch {
    res.status(503).json({ ok: false, database: 'disconnected' })
  }
})
app.use('/v1/sdk', sdk)
app.use('/v1', sdk) // backward-compatible analytics/tracking paths remain under /v1
app.use(
  '/v1/admin',
  rateLimit({
    windowMs: rateWindow,
    max: Number(process.env.ADMIN_RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false
  }),
  admin
)
app.use(notFound)
app.use(errorHandler)
app.listen(port, () =>
  console.log(
    `GameHub backend listening on ${
      process.env.PUBLIC_BASE_URL || `http://localhost:${port}`
    }`
  )
)
