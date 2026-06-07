import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'skillchain_super_secret_hackathon_key_2026'
const ADMIN_WALLET = '0x3302beC705ef21e65566e2E841D7A0204fF1820b'.toLowerCase()

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, walletAddress } = req.body

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Check duplicate email
    const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Check if wallet address is admin wallet
    let finalRole = role
    let isApproved = false
    const parsedWallet = walletAddress ? walletAddress.trim().toLowerCase() : ''

    if (parsedWallet === ADMIN_WALLET) {
      finalRole = 'admin'
      isApproved = true
    } else if (role === 'admin') {
      return res.status(403).json({ message: 'Unauthorized wallet for admin role' })
    } else if (role === 'student') {
      isApproved = true // Students do not require approval
    } else if (role === 'institution') {
      isApproved = false // Institutions require admin approval
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Save user
    const newUser = db.create('users', {
      username,
      email,
      passwordHash,
      role: finalRole,
      walletAddress: walletAddress || null,
      isApproved
    })

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = newUser

    res.status(201).json({
      message: finalRole === 'institution' 
        ? 'Registration successful. Waiting for admin approval.' 
        : 'Registration successful.',
      user: userResponse
    })

  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check approval status
    if (user.role === 'institution' && !user.isApproved) {
      return res.status(403).json({ message: 'Your institution registration is pending administrator approval.' })
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    const { passwordHash: _, ...userResponse } = user

    res.json({
      token,
      user: userResponse
    })

  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
