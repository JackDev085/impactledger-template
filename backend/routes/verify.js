import express from 'express'
import db from '../db.js'
import { contract } from '../blockchain.js'

const router = express.Router()

// Public endpoint to verify a certificate by ID or hash
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    let certId = null
    let certDb = null

    // Try finding in local DB first to support searching by certificateHash / IPFS hash
    certDb = db.findOne('certificates', c => String(c.id) === String(id) || c.certificateHash === id || c.transactionHash === id)
    if (certDb) {
      certId = Number(certDb.id)
    } else if (!isNaN(Number(id))) {
      certId = Number(id)
    }

    if (certId && contract) {
      try {
        const [isValid, certificateHash, studentHash, issuer, issuedAt, revoked] = await contract.verifyCertificate(certId)
        
        if (issuer !== '0x0000000000000000000000000000000000000000') {
          return res.json({
            exists: true,
            isValid: isValid && !revoked,
            blockchainVerified: true,
            certificate: {
              id: certId.toString(),
              studentName: certDb ? certDb.studentName : 'Blockchain Verified Student',
              studentEmail: certDb ? certDb.studentEmail : '',
              studentHash: studentHash,
              courseTitle: certDb ? certDb.courseTitle : 'Blockchain Verified Course',
              workloadHours: certDb ? certDb.workloadHours : 0,
              certificateHash: certificateHash,
              transactionHash: certDb ? certDb.transactionHash : 'Recorded on Chain',
              issuerName: certDb ? certDb.issuerName : 'Approved Institution',
              issuerId: certDb ? certDb.issuerId : '',
              issuerWallet: issuer,
              status: (revoked || !isValid) ? 'revoked' : 'active',
              issuedAt: new Date(Number(issuedAt) * 1000).toISOString()
            }
          })
        }
      } catch (chainErr) {
        console.error('Failed to verify on blockchain, falling back to database:', chainErr)
      }
    }

    // Fallback to database verification
    if (certDb) {
      return res.json({
        exists: true,
        isValid: certDb.status === 'active',
        blockchainVerified: false,
        certificate: certDb
      })
    }

    return res.status(404).json({
      exists: false,
      isValid: false,
      message: 'Certificate not registered in system'
    })
  } catch (err) {
    console.error('Verification error:', err)
    res.status(500).json({ message: 'Internal server error during verification' })
  }
})

export default router

