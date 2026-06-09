import express from 'express'
import db from '../db.js'
import { contract } from '../blockchain.js'

const router = express.Router()

// Helper to fetch JSON metadata from public IPFS gateways
const fetchIpfsMetadata = async (cid) => {
  if (!cid || !cid.startsWith('Qm')) return null
  
  // Try multiple gateways for reliability
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`
  ]
  
  for (const url of gateways) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000) // 4 seconds timeout
      
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data && (data.studentName || data.courseTitle)) {
          return data
        }
      }
    } catch (e) {
      console.warn(`[IPFS Verify] Gateway failed for ${url}:`, e.message)
    }
  }
  return null
}

// Public endpoint to verify a certificate by ID or hash
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    let certId = null
    let certDb = null

    // Try finding in local DB first to support searching by certificateHash / IPFS hash
    certDb = await db.findOne('certificates', c => String(c.id) === String(id) || c.certificateHash === id || c.transactionHash === id)
    if (certDb) {
      certId = Number(certDb.id)
    } else if (!isNaN(Number(id))) {
      certId = Number(id)
    }

    if (certId && contract) {
      try {
        const [isValid, certificateHash, studentHash, issuer, issuedAt, revoked] = await contract.verifyCertificate(certId)
        
        if (issuer !== '0x0000000000000000000000000000000000000000') {
          let ipfsData = null
          if (!certDb && certificateHash) {
            console.log(`🔍 Resolvendo metadados do IPFS para CID: ${certificateHash}...`)
            ipfsData = await fetchIpfsMetadata(certificateHash)
          }

          const studentName = certDb ? certDb.studentName : (ipfsData ? ipfsData.studentName : 'Estudante Verificado On-Chain')
          const studentEmail = certDb ? certDb.studentEmail : (ipfsData ? ipfsData.studentEmail : '')
          const courseTitle = certDb ? certDb.courseTitle : (ipfsData ? ipfsData.courseTitle : 'Curso Verificado On-Chain')
          const workloadHours = certDb ? certDb.workloadHours : (ipfsData ? ipfsData.workloadHours : 0)
          const issuerName = certDb ? certDb.issuerName : (ipfsData ? ipfsData.issuerName : 'Instituição Homologada')

          return res.json({
            exists: true,
            isValid: isValid && !revoked,
            blockchainVerified: true,
            certificate: {
              id: certId.toString(),
              studentName,
              studentEmail,
              studentHash: studentHash,
              courseTitle,
              workloadHours: Number(workloadHours),
              certificateHash: certificateHash,
              transactionHash: certDb ? certDb.transactionHash : 'Registrado em Bloco',
              issuerName,
              issuerId: certDb ? certDb.issuerId : '',
              issuerWallet: issuer,
              status: (revoked || !isValid) ? 'revoked' : 'active',
              issuedAt: new Date(Number(issuedAt) * 1000).toISOString()
            }
          })
        } else {
          if (certDb) {
            return res.json({
              exists: true,
              isValid: certDb.status === 'active',
              blockchainVerified: false,
              certificate: {
                id: certDb.id,
                studentName: certDb.studentName,
                studentEmail: certDb.studentEmail,
                studentHash: certDb.studentHash || '',
                courseTitle: certDb.courseTitle,
                workloadHours: Number(certDb.workloadHours),
                certificateHash: certDb.certificateHash,
                transactionHash: certDb.transactionHash || 'Pendente / Offline',
                issuerName: certDb.issuerName,
                issuerId: certDb.issuerId,
                issuerWallet: certDb.issuerWallet || '',
                status: certDb.status,
                issuedAt: certDb.issuedAt || certDb.createdAt
              }
            })
          }
          return res.status(404).json({
            exists: false,
            isValid: false,
            message: 'Certificado não registrado na blockchain'
          })
        }
      } catch (chainErr) {
        console.error('Failed to verify on blockchain:', chainErr)
      }
    }

    if (certDb) {
      return res.json({
        exists: true,
        isValid: certDb.status === 'active',
        blockchainVerified: false,
        certificate: {
          id: certDb.id,
          studentName: certDb.studentName,
          studentEmail: certDb.studentEmail,
          studentHash: certDb.studentHash || '',
          courseTitle: certDb.courseTitle,
          workloadHours: Number(certDb.workloadHours),
          certificateHash: certDb.certificateHash,
          transactionHash: certDb.transactionHash || 'Pendente / Offline',
          issuerName: certDb.issuerName,
          issuerId: certDb.issuerId,
          issuerWallet: certDb.issuerWallet || '',
          status: certDb.status,
          issuedAt: certDb.issuedAt || certDb.createdAt
        }
      })
    }

    return res.status(404).json({
      exists: false,
      isValid: false,
      message: 'Certificado não registrado no sistema'
    })
  } catch (err) {
    console.error('Verification error:', err)
    res.status(500).json({ message: 'Erro interno durante a verificação' })
  }
})

export default router

