import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL

const cleanUrl = connectionString ? connectionString.split('?')[0] : null

class SupabaseDatabase {
  constructor() {
    this.pool = null
    this.isReady = false
    this.init()
  }

  init() {
    if (!cleanUrl) {
      console.warn('⚠️ Warning: POSTGRES_URL is not defined in env variables. Database connection is offline.')
      return
    }

    try {
      this.pool = new pg.Pool({
        connectionString: cleanUrl,
        ssl: {
          rejectUnauthorized: false
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      })
      this.isReady = true
      console.log('🔌 Supabase PostgreSQL connection pool initialized.')
    } catch (err) {
      console.error('❌ Failed to initialize PostgreSQL connection pool:', err)
    }
  }

  getTableName(collection) {
    if (collection === 'users') return 'skillchain_users'
    if (collection === 'courses') return 'skillchain_courses'
    if (collection === 'certificates') return 'skillchain_certificates'
    return collection
  }

  async query(sql, params) {
    if (!this.pool) {
      this.init()
    }
    if (!this.pool) {
      throw new Error('Database pool not initialized.')
    }
    return this.pool.query(sql, params)
  }

  // Fetch all rows from table, then apply JS predicate filter for backward compatibility
  async find(collection, predicate) {
    try {
      const table = this.getTableName(collection)
      const res = await this.query(`SELECT * FROM ${table}`)
      const rows = res.rows
      if (predicate) {
        return rows.filter(predicate)
      }
      return rows
    } catch (err) {
      console.error(`Error in db.find on ${collection}:`, err)
      return []
    }
  }

  // Fetch all rows and find first match using JS predicate filter
  async findOne(collection, predicate) {
    try {
      const table = this.getTableName(collection)
      const res = await this.query(`SELECT * FROM ${table}`)
      const rows = res.rows
      if (predicate) {
        return rows.find(predicate) || null
      }
      return rows[0] || null
    } catch (err) {
      console.error(`Error in db.findOne on ${collection}:`, err)
      return null
    }
  }

  // Create new record and insert into PostgreSQL
  async create(collection, item) {
    try {
      const table = this.getTableName(collection)
      const id = item.id || Math.random().toString(36).substring(2, 11)
      const createdAt = item.createdAt || new Date().toISOString()
      const updatedAt = item.updatedAt || new Date().toISOString()
      
      const fullItem = { ...item, id, createdAt, updatedAt }
      
      const keys = Object.keys(fullItem)
      const columns = keys.map(k => `"${k}"`).join(', ')
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      const values = keys.map(k => fullItem[k])
      
      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`
      const res = await this.query(sql, values)
      return res.rows[0]
    } catch (err) {
      console.error(`Error in db.create on ${collection}:`, err)
      throw err
    }
  }

  // Update existing record
  async update(collection, id, updates) {
    try {
      const table = this.getTableName(collection)
      const updatedAt = new Date().toISOString()
      const fullUpdates = { ...updates, updatedAt }
      
      const keys = Object.keys(fullUpdates)
      const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ')
      const values = [id, ...keys.map(k => fullUpdates[k])]
      
      const sql = `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`
      const res = await this.query(sql, values)
      return res.rows[0] || null
    } catch (err) {
      console.error(`Error in db.update on ${collection}:`, err)
      throw err
    }
  }

  // Delete record
  async delete(collection, id) {
    try {
      const table = this.getTableName(collection)
      const sql = `DELETE FROM ${table} WHERE id = $1 RETURNING *`
      const res = await this.query(sql, [id])
      return res.rows[0] || null
    } catch (err) {
      console.error(`Error in db.delete on ${collection}:`, err)
      throw err
    }
  }
}

const db = new SupabaseDatabase()

export default db
