const express = require('express')
const pool = require('../config/db')
const { asyncHandler } = require('../utils/http')

const router = express.Router()

function serializeGame(row) {
  let tags = []
  try {
    tags = row.tags ? JSON.parse(row.tags) : []
  } catch {
    tags = []
  }

  return {
    gameId: row.game_id,
    slug: row.slug || row.game_id,
    title: row.name,
    category: row.category || 'Arcade',
    rating: Number(row.rating || 0).toFixed(1),
    thumbnail: row.thumbnail_url || 'https://placehold.co/900x675/17202b/ffffff?text=GameHub',
    description: row.description || 'Play this free browser game on GameHub.',
    tags,
    badge: row.badge || undefined,
    gameUrl: row.game_url || '/games/demo/index.html',
    plays: Number(row.plays || 0),
    featured: Boolean(row.featured),
    createdAt: row.created_at
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const filters = []
  const values = []
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : ''
  const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : ''

  if (search) {
    filters.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)')
    values.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (category) {
    filters.push('LOWER(category)=LOWER(?)')
    values.push(category)
  }
  if (tag) {
    filters.push('JSON_SEARCH(tags, "one", ?) IS NOT NULL')
    values.push(tag)
  }

  const where = filters.length ? `WHERE status='active' AND ${filters.join(' AND ')}` : "WHERE status='active'"
  const order = req.query.sort === 'popular'
    ? 'ORDER BY plays DESC, created_at DESC'
    : req.query.sort === 'recent'
      ? 'ORDER BY created_at DESC'
      : 'ORDER BY featured DESC, created_at DESC'
  const [rows] = await pool.query(`SELECT game_id, slug, name, category, rating, thumbnail_url, description, tags, badge, game_url, plays, featured, created_at FROM games ${where} ${order}`, values)
  res.json({ ok: true, games: rows.map(serializeGame) })
}))

router.get('/:slug', asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT game_id, slug, name, category, rating, thumbnail_url, description, tags, badge, game_url, plays, featured, created_at FROM games WHERE status='active' AND (slug=? OR game_id=?) LIMIT 1", [req.params.slug, req.params.slug])
  if (!rows.length) return res.status(404).json({ ok: false, error: 'Game not found' })
  res.json({ ok: true, game: serializeGame(rows[0]) })
}))

module.exports = router