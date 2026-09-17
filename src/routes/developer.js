const express = require('express')
const crypto = require('crypto')
const { z } = require('zod')
const pool = require('../config/db')
const { asyncHandler } = require('../utils/http')
const { hash } = require('../utils/security')

const router = express.Router()
const idSchema = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/)
const urlSchema = z.string().trim().url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'URL must use http or https')

const gameSchema = z.object({
  id: idSchema,
  developerId: idSchema,
  name: z.string().trim().min(1).max(160),
  slug: idSchema.optional(),
  category: z.string().trim().min(1).max(80),
  thumbnailUrl: urlSchema,
  description: z.string().trim().min(1).max(5000),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  gameUrl: urlSchema,
  badge: z.string().trim().max(40).optional()
})

router.get('/games', asyncHandler(async (req, res) => {
  const developerId = typeof req.query.developerId === 'string' ? req.query.developerId.trim() : ''
  if (!idSchema.safeParse(developerId).success) return res.status(400).json({ ok: false, error: 'developerId is required' })
  const [rows] = await pool.query('SELECT game_id, slug, name, category, rating, thumbnail_url, description, tags, badge, game_url, plays, featured, status, developer_id, created_at FROM games WHERE developer_id=? ORDER BY created_at DESC', [developerId])
  res.json({ ok: true, games: rows })
}))

router.post('/games', asyncHandler(async (req, res) => {
  const body = gameSchema.safeParse(req.body)
  if (!body.success) return res.status(400).json({ ok: false, error: 'Invalid game payload', details: body.error.flatten() })
  const game = body.data
  const apiKey = `ghpk_${crypto.randomBytes(24).toString('hex')}`
  try {
    await pool.query('INSERT INTO games (game_id, slug, name, category, thumbnail_url, description, tags, badge, game_url, developer_id, public_key_hash, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [game.id, game.slug || game.id, game.name, game.category, game.thumbnailUrl, game.description, JSON.stringify(game.tags), game.badge || null, game.gameUrl, game.developerId, hash(apiKey), 'disabled'])
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ ok: false, error: 'Game ID or slug already exists' })
    throw error
  }
  res.status(201).json({ ok: true, status: 'under_review', game: { id: game.id, slug: game.slug || game.id, name: game.name, developerId: game.developerId }, apiKey })
}))

module.exports = router