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
    console.log('🌱 Seeding database with initial demo data for the hackathon...')
    
    const adminPasswordHash = bcrypt.hashSync('adminpassword', 10)
    const mitPasswordHash = bcrypt.hashSync('mitpassword', 10)
    const johnPasswordHash = bcrypt.hashSync('johnpassword', 10)

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
      },
      {
        id: 'mit-id',
        username: 'MIT University',
        email: 'mit@edu.org',
        passwordHash: mitPasswordHash,
        role: 'institution',
        walletAddress: '0x1111222233334444555566667777888899990000'.toLowerCase(),
        isApproved: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'john-id',
        username: 'John Doe',
        email: 'john@doe.com',
        passwordHash: johnPasswordHash,
        role: 'student',
        walletAddress: null,
        isApproved: true,
        createdAt: new Date().toISOString()
      }
    ]

    this.data.courses = [
      {
        id: 'yfq532t0w',
        title: 'Solidity Development Masterclass',
        description: 'Complete hands-on Ethereum development course.',
        workloadHours: 40,
        institutionId: 'mit-id',
        createdAt: new Date().toISOString()
      }
    ]

    this.data.certificates = [
      {
        id: '2jwr91084',
        studentEmail: 'john@doe.com',
        studentName: 'John Doe',
        courseId: 'yfq532t0w',
        courseTitle: 'Solidity Development Masterclass',
        workloadHours: 40,
        certificateHash: 'QmXoypizjW3WknFixtdKLw6yS47n3kX488C9Z235bX798f',
        transactionHash: '0x3219aa2e537e2ab77112009ef327e5c70ba9db32192138eb12ab34d7ef8109bf',
        issuerName: 'MIT University',
        issuerWallet: '0x1111222233334444555566667777888899990000'.toLowerCase(),
        status: 'active',
        issuedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ]

    this.save()
    console.log('✅ Demo database seeded successfully.')
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
