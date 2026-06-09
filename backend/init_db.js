import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL

if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL_NON_POOLING or POSTGRES_URL is not set in env variables.')
  process.exit(1)
}

// Strip query parameters to prevent pg driver overriding SSL configs
const cleanUrl = connectionString.split('?')[0]

const client = new pg.Client({
  connectionString: cleanUrl,
  ssl: {
    rejectUnauthorized: false
  }
})

async function init() {
  try {
    console.log('🔄 Connecting to Supabase Postgres database...')
    await client.connect()
    console.log('✅ Connected successfully.')

    // 1. Create skillchain_users table
    console.log('⚡ Creating "skillchain_users" table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS skillchain_users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        "passwordHash" VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        "walletAddress" VARCHAR(100),
        "isApproved" BOOLEAN DEFAULT false,
        "onChainTx" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 2. Create skillchain_courses table
    console.log('⚡ Creating "skillchain_courses" table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS skillchain_courses (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150),
        title VARCHAR(150),
        description TEXT,
        workload VARCHAR(50),
        "workloadHours" INTEGER DEFAULT 0,
        "institutionId" VARCHAR(50),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 3. Create skillchain_certificates table
    console.log('⚡ Creating "skillchain_certificates" table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS skillchain_certificates (
        id VARCHAR(50) PRIMARY KEY,
        "studentName" VARCHAR(100) NOT NULL,
        "studentEmail" VARCHAR(100) NOT NULL,
        "studentHash" VARCHAR(255),
        "courseId" VARCHAR(50),
        "courseTitle" VARCHAR(150) NOT NULL,
        "workloadHours" INTEGER DEFAULT 0,
        "certificateHash" VARCHAR(255),
        "transactionHash" VARCHAR(255),
        "issuerName" VARCHAR(150),
        "issuerId" VARCHAR(50),
        "issuerWallet" VARCHAR(100),
        "studentId" VARCHAR(50),
        "issuedAt" TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'active',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 4. Seed default admin if table is empty
    console.log('🌱 Checking if admin exists in skillchain_users...')
    const userCountRes = await client.query('SELECT COUNT(*) FROM skillchain_users')
    const userCount = parseInt(userCountRes.rows[0].count, 10)
    
    if (userCount === 0) {
      console.log('🌱 Seeding admin user...')
      const adminPasswordHash = bcrypt.hashSync('adminpassword', 10)
      const adminWallet = '0x3302beC705ef21e65566e2E841D7A0204fF1820b'.toLowerCase()
      
      await client.query(`
        INSERT INTO skillchain_users (id, username, email, "passwordHash", role, "walletAddress", "isApproved")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['admin-id', 'Admin Authority', 'admin@skillchain.org', adminPasswordHash, 'admin', adminWallet, true])
      console.log('✅ Admin user seeded successfully.')
    } else {
      console.log('ℹ️ skillchain_users is not empty, skipping admin seed.')
    }

    console.log('🎉 Database initialization complete!')
  } catch (err) {
    console.error('❌ Database initialization failed:', err)
  } finally {
    await client.end()
  }
}

init()
