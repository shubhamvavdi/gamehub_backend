const { Pool } = require('pg')

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is required for the Neon PostgreSQL connection')
}

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: Number(process.env.DB_POOL_MAX || 10),
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
})

function postgresQuery (text, values = []) {
	let index = 0
	let sql = text.replace(/\?/g, () => `$${++index}`)
	if (/^\s*INSERT\s+INTO/i.test(sql) && !/\bRETURNING\b/i.test(sql)) sql += ' RETURNING id'
	return { text: sql, values }
}

function wrapClient (client) {
	return {
		async query (text, values) {
			const result = await client.query(postgresQuery(text, values))
			return [result.rows, { affectedRows: result.rowCount, insertId: result.rows[0]?.id }]
		},
		async beginTransaction () { await client.query('BEGIN') },
		async commit () { await client.query('COMMIT') },
		async rollback () { await client.query('ROLLBACK') },
		release () { client.release() }
	}
}

module.exports = {
	async query (text, values) {
		const result = await pool.query(postgresQuery(text, values))
		return [result.rows, { affectedRows: result.rowCount, insertId: result.rows[0]?.id }]
	},
	async getConnection () { return wrapClient(await pool.connect()) },
	async end () { await pool.end() }
}
