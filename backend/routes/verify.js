import express from 'express'
import db from '../db.js'

const router = express.Router()

// Public endpoint to verify a certificate by ID or hash
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params

    const cert = db.findOne('certificates', c => c.id === id || c.certificateHash === id)

    if (!cert) {
      return res.status(404).json({
        exists: false,
        isValid: false,
        message: 'Certificate not registered in system'
      })
    }

    res.json({
      exists: true,
      isValid: cert.status === 'active',
      certificate: cert
    })
  } catch (err) {
    console.error('Verification error:', err)
    res.status(500).json({ message: 'Internal server error during verification' })
  }
})

export default router
