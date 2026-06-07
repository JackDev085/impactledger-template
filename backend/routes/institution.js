import express from 'express'
import db from '../db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication and check institution role
router.use(authenticateToken, requireRole(['institution']))

// Ensure the institution is approved
const checkApproval = (req, res, next) => {
  const currentInstitution = db.findOne('users', u => u.id === req.user.id)
  if (!currentInstitution || !currentInstitution.isApproved) {
    return res.status(403).json({ message: 'Your institution status is not active or approved' })
  }
  next()
}

router.use(checkApproval)

// Get courses created by this institution
router.get('/courses', (req, res) => {
  try {
    const courses = db.find('courses', c => c.institutionId === req.user.id)
    res.json(courses)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch courses' })
  }
})

// Create a new course
router.post('/courses', (req, res) => {
  try {
    const { title, description, workloadHours } = req.body

    if (!title || !workloadHours) {
      return res.status(400).json({ message: 'Title and workload hours are required' })
    }

    const newCourse = db.create('courses', {
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

// Issue a certificate
router.post('/certificates', (req, res) => {
  try {
    const { studentEmail, studentName, courseId, certificateHash, transactionHash } = req.body

    if (!studentEmail || !studentName || !courseId || !certificateHash) {
      return res.status(400).json({ message: 'studentEmail, studentName, courseId and certificateHash are required' })
    }

    // Check if course exists
    const course = db.findOne('courses', c => c.id === courseId && c.institutionId === req.user.id)
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' })
    }

    // Check if student is already registered
    const student = db.findOne('users', u => u.email.toLowerCase() === studentEmail.toLowerCase() && u.role === 'student')

    const newCertificate = db.create('certificates', {
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
router.get('/certificates', (req, res) => {
  try {
    const certificates = db.find('certificates', cert => cert.issuerId === req.user.id)
    res.json(certificates)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch certificate log' })
  }
})

// Revoke a certificate
router.post('/certificates/:id/revoke', (req, res) => {
  try {
    const { id } = req.params
    const cert = db.findOne('certificates', c => c.id === id && c.issuerId === req.user.id)

    if (!cert) {
      return res.status(404).json({ message: 'Certificate not found or unauthorized' })
    }

    const updated = db.update('certificates', id, { status: 'revoked' })
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
