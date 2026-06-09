import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isVercel = process.env.VERCEL || process.env.NOW_BUILD_TRIGGER;
const DB_FILE = isVercel
  ? path.join('/tmp', 'database.json')
  : path.join(__dirname, 'database.json');

class JSONDatabase {
  constructor() {
    this.data = {
      users: [],
      courses: [],
      enrollments: [],
      certificates: []
    }
    this.init()
  }

  init() {
    // On Vercel, if the tmp database doesn't exist, copy the pre-seeded bundled database
    if (isVercel && !fs.existsSync(DB_FILE)) {
      const bundledDbPath = path.join(__dirname, 'database.json')
      if (fs.existsSync(bundledDbPath)) {
        try {
          fs.copyFileSync(bundledDbPath, DB_FILE)
          console.log('📋 Copied pre-seeded database to Vercel /tmp directory.')
        } catch (err) {
          console.error('Failed to copy bundled database to /tmp:', err)
        }
      }
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8')
        this.data = JSON.parse(fileContent)
      } catch (err) {
        console.error('Failed to parse database.json, initializing empty db:', err)
        this.save()
      }
    } else {
      this.save()
    }

    // Self-healing patch: Ensure seeded certificate has status: 'active'
    if (this.data.certificates) {
      const seedCert = this.data.certificates.find(c => c.id === '2jwr91084')
      if (seedCert && !seedCert.status) {
        seedCert.status = 'active'
        this.save()
        console.log('🩹 Patched seeded certificate status to active.')
      }
    }

    // Seed database if empty of users
    if (!this.data.users || this.data.users.length === 0) {
      this.seed()
    }
  }

  seed() {
    console.log('🌱 Seeding database with initial admin data...')
    
    const adminPasswordHash = bcrypt.hashSync('adminpassword', 10)

    this.data.users = [
      {
        id: 'admin-id',
        username: 'Admin Authority',
        email: 'admin@skillchain.org',
        passwordHash: adminPasswordHash,
        role: 'admin',
        walletAddress: '0x3302beC705ef21e65566e2E841D7A0204fF1820b'.toLowerCase(),
        isApproved: true,
        createdAt: new Date().toISOString()
      }
    ]

    this.data.courses = []
    this.data.certificates = []

    this.save()
    console.log('✅ Database seeded with admin user.')
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8')
    } catch (err) {
      console.error('Failed to write to database.json:', err)
    }
  }

  // Generic helper methods
  find(collection, predicate) {
    return this.data[collection].filter(predicate)
  }

  findOne(collection, predicate) {
    return this.data[collection].find(predicate)
  }

  create(collection, item) {
    const newItem = {
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      ...item
    }
    this.data[collection].push(newItem)
    this.save()
    return newItem;
  }

  update(collection, id, updates) {
    const index = this.data[collection].findIndex(item => item.id === id)
    if (index !== -1) {
      this.data[collection][index] = {
        ...this.data[collection][index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      this.save()
      return this.data[collection][index]
    }
    return null
  }

  delete(collection, id) {
    const index = this.data[collection].findIndex(item => item.id === id)
    if (index !== -1) {
      const deleted = this.data[collection].splice(index, 1)
      this.save()
      return deleted[0]
    }
    return null
  }
}

const db = new JSONDatabase()

export default db
