import express from 'express'
import db from '../db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication and check admin role for all routes in this router
router.use(authenticateToken, requireRole(['admin']))

// Get all institutions (pending and approved)
router.get('/institutions', (req, res) => {
  try {
    const institutions = db.find('users', u => u.role === 'institution')
    // Remove password hashes from response
    const sanitized = institutions.map(({ passwordHash, ...rest }) => rest)
    res.json(sanitized)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch institutions' })
  }
})

// Approve an institution
router.post('/institutions/:id/approve', (req, res) => {
  try {
    const { id } = req.params
    const institution = db.findOne('users', u => u.id === id && u.role === 'institution')

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' })
    }

    const updated = db.update('users', id, { isApproved: true })
    const { passwordHash, ...sanitized } = updated

    res.json({
      message: 'Institution approved successfully',
      institution: sanitized
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to approve institution' })
  }
})

// Deactivate/Reject an institution
router.post('/institutions/:id/deactivate', (req, res) => {
  try {
    const { id } = req.params
    const institution = db.findOne('users', u => u.id === id && u.role === 'institution')

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' })
    }

    const updated = db.update('users', id, { isApproved: false })
    const { passwordHash, ...sanitized } = updated

    res.json({
      message: 'Institution deactivated successfully',
      institution: sanitized
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to deactivate institution' })
  }
})

export default router
