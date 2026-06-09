import express from 'express'
import crypto from 'crypto'
import db from '../db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication and check institution role
router.use(authenticateToken, requireRole(['institution']))

// Ensure the institution is approved
const checkApproval = async (req, res, next) => {
  try {
    const currentInstitution = await db.findOne('users', u => u.id === req.user.id)
    if (!currentInstitution || !currentInstitution.isApproved) {
      return res.status(403).json({ message: 'Your institution status is not active or approved' })
    }
    next()
  } catch (err) {
    next(err)
  }
}

router.use(checkApproval)

// Get courses created by this institution
router.get('/courses', async (req, res) => {
  try {
    const courses = await db.find('courses', c => c.institutionId === req.user.id)
    res.json(courses)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch courses' })
  }
})

// Create a new course
router.post('/courses', async (req, res) => {
  try {
    const { title, description, workloadHours } = req.body

    if (!title || !workloadHours) {
      return res.status(400).json({ message: 'Title and workload hours are required' })
    }

    const newCourse = await db.create('courses', {
      title,
      description: description || '',
      workloadHours: parseInt(workloadHours),
      institutionId: req.user.id
    })

    res.status(201).json({
      message: 'Course created successfully',
      course: newCourse
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create course' })
  }
})

// Upload certificate metadata to IPFS (via Pinata)
router.post('/upload-ipfs', async (req, res) => {
  try {
    const { id, studentEmail, studentName, courseTitle, workloadHours } = req.body

    if (!id || !studentEmail || !studentName || !courseTitle || !workloadHours) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' })
    }

    const metadata = {
      id: String(id),
      studentName,
      studentEmail: studentEmail.toLowerCase(),
      courseTitle,
      workloadHours: parseInt(workloadHours),
      issuerName: req.user.username,
      issuerWallet: req.user.walletAddress || '',
      issuedAt: new Date().toISOString(),
      description: "Certificado educacional criptograficamente seguro e auditável on-chain.",
      blockchainNetwork: "Ethereum Sepolia Testnet"
    }

    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecretKey = process.env.PINATA_API_SECRET
    const pinataJwt = process.env.PINATA_JWT || process.env.PINATA_SECRET_JWT || process.env.PINATA_SECRET_JTW

    const headers = {
      'Content-Type': 'application/json'
    }

    let canUpload = false
    if (pinataJwt) {
      headers['Authorization'] = `Bearer ${pinataJwt}`
      canUpload = true
    } else if (pinataApiKey && pinataSecretKey) {
      headers['pinata_api_key'] = pinataApiKey
      headers['pinata_secret_api_key'] = pinataSecretKey
      canUpload = true
    }

    if (canUpload) {
      console.log(`📤 Enviando metadados do certificado #${id} para o IPFS via Pinata...`)
      
      const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `Certificate-${id}`
          }
        })
      })

      if (!pinataResponse.ok) {
        const errorText = await pinataResponse.text()
        throw new Error(`Pinata API returned status ${pinataResponse.status}: ${errorText}`)
      }

      const pinataData = await pinataResponse.json()
      console.log(`✅ Certificado #${id} enviado com sucesso. CID IPFS: ${pinataData.IpfsHash}`)
      
      return res.json({
        success: true,
        ipfsHash: pinataData.IpfsHash,
        metadata
      })
    } else {
      console.warn('⚠️ PINATA_API_KEY ou PINATA_API_SECRET não configurados. Gerando CID offline de teste...')
      
      // Generate offline IPFS CID
      const mockHash = crypto.createHash('sha256').update(JSON.stringify(metadata)).digest('hex')
      const mockCid = `Qm${mockHash.substring(0, 44)}`

      return res.json({
        success: true,
        ipfsHash: mockCid,
        metadata,
        offline: true
      })
    }
  } catch (err) {
    console.error('Erro de upload para o IPFS:', err)
    res.status(500).json({ message: 'Falha ao fazer upload dos metadados para o IPFS', error: err.message })
  }
})

// Issue a certificate
router.post('/certificates', async (req, res) => {
  try {
    const { id, studentEmail, studentName, courseId, certificateHash, transactionHash } = req.body

    if (!studentEmail || !studentName || !courseId || !certificateHash) {
      return res.status(400).json({ message: 'studentEmail, studentName, courseId and certificateHash are required' })
    }

    // Check if course exists
    const course = await db.findOne('courses', c => c.id === courseId && c.institutionId === req.user.id)
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' })
    }

    // Check if student is already registered
    const student = await db.findOne('users', u => u.email.toLowerCase() === studentEmail.toLowerCase() && u.role === 'student')

    const newCertificate = await db.create('certificates', {
      id: id ? String(id) : Math.floor(Math.random() * 900000000 + 100000000).toString(),
      studentEmail: studentEmail.toLowerCase(),
      studentName,
      courseId,
      courseTitle: course.title,
      workloadHours: course.workloadHours,
      certificateHash,
      transactionHash: transactionHash || `0x${Math.random().toString(16).substring(2, 18)}...`,
      issuerId: req.user.id,
      issuerName: req.user.username,
      studentId: student ? student.id : null,
      status: 'active',
      issuedAt: new Date().toISOString()
    })

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificate: newCertificate
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to issue certificate' })
  }
})

// Get issued certificates history
router.get('/certificates', async (req, res) => {
  try {
    const certificates = await db.find('certificates', cert => cert.issuerId === req.user.id)
    res.json(certificates)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch certificate log' })
  }
})

// Revoke a certificate
router.post('/certificates/:id/revoke', async (req, res) => {
  try {
    const { id } = req.params
    const cert = await db.findOne('certificates', c => String(c.id) === String(id) && c.issuerId === req.user.id)

    if (!cert) {
      return res.status(404).json({ message: 'Certificate not found or unauthorized' })
    }

    const updated = await db.update('certificates', cert.id, { status: 'revoked' })
    res.json({
      message: 'Certificate revoked successfully',
      certificate: updated
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to revoke certificate' })
  }
})

export default router

