import express from 'express'
import db from '../db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { contract } from '../blockchain.js'

const router = express.Router()

// Apply authentication and check admin role for all routes in this router
router.use(authenticateToken, requireRole(['admin']))

// Get all institutions (pending and approved)
router.get('/institutions', async (req, res) => {
  try {
    const institutions = await db.find('users', u => u.role === 'institution')
    // Remove password hashes from response
    const sanitized = institutions.map(({ passwordHash, ...rest }) => rest)
    res.json(sanitized)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch institutions' })
  }
})

// Approve an institution (and register on-chain)
router.post('/institutions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    const institution = await db.findOne('users', u => u.id === id && u.role === 'institution')

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' })
    }

    let txHash = null
    if (!contract) {
      return res.status(500).json({ message: 'Smart contract connection is not active on backend server.' })
    }
    if (!institution.walletAddress) {
      return res.status(400).json({ message: 'Institution does not have a wallet address registered.' })
    }

    try {
      console.log(`Approving institution ${institution.username} on Sepolia...`)
      const tx = await contract.registerInstitution(institution.walletAddress, institution.username)
      const receipt = await tx.wait()
      txHash = receipt.hash
      console.log(`Approved on-chain! Tx: ${txHash}`)
    } catch (err) {
      console.error('Failed to approve institution on-chain:', err)
      return res.status(500).json({ message: `Failed to approve institution on-chain: ${err.reason || err.message}` })
    }

    const updated = await db.update('users', id, { isApproved: true, onChainTx: txHash })
    const { passwordHash, ...sanitized } = updated

    res.json({
      message: 'Institution approved successfully and registered on-chain',
      institution: sanitized,
      txHash
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to approve institution' })
  }
})

// Deactivate/Reject an institution (and disable on-chain)
router.post('/institutions/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params
    const institution = await db.findOne('users', u => u.id === id && u.role === 'institution')

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' })
    }

    let txHash = null
    if (!contract) {
      return res.status(500).json({ message: 'Smart contract connection is not active on backend server.' })
    }
    if (!institution.walletAddress) {
      return res.status(400).json({ message: 'Institution does not have a wallet address registered.' })
    }

    try {
      console.log(`Deactivating institution ${institution.username} on Sepolia...`)
      const tx = await contract.setInstitutionStatus(institution.walletAddress, false)
      const receipt = await tx.wait()
      txHash = receipt.hash
      console.log(`Deactivated on-chain! Tx: ${txHash}`)
    } catch (err) {
      console.error('Failed to deactivate institution on-chain:', err)
      return res.status(500).json({ message: `Failed to deactivate institution on-chain: ${err.reason || err.message}` })
    }

    const updated = await db.update('users', id, { isApproved: false, onChainTx: txHash })
    const { passwordHash, ...sanitized } = updated

    res.json({
      message: 'Institution deactivated successfully and deactivated on-chain',
      institution: sanitized,
      txHash
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to deactivate institution' })
  }
})

export default router

