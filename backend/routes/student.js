import express from 'express'
import db from '../db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication and check student role
router.use(authenticateToken, requireRole(['student']))

// Get student certificates list
router.get('/certificates', async (req, res) => {
  try {
    const studentEmail = req.user.email.toLowerCase()
    const studentId = req.user.id

    // Find certificates matching email or user ID
    const certificates = await db.find('certificates', cert => 
      cert.studentEmail === studentEmail || cert.studentId === studentId
    )

    res.json(certificates)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch certificates' })
  }
})

// Get student dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const studentEmail = req.user.email.toLowerCase()
    const studentId = req.user.id

    const certificates = await db.find('certificates', cert => 
      (cert.studentEmail === studentEmail || cert.studentId === studentId) && cert.status === 'active'
    )

    const totalHours = certificates.reduce((sum, cert) => sum + (cert.workloadHours || 0), 0)

    res.json({
      summary: {
        totalCertificates: certificates.length,
        totalHoursCompleted: totalHours
      },
      certificates
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load dashboard metrics' })
  }
})

export default router
