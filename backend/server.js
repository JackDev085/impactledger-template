import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import institutionRoutes from './routes/institution.js'
import studentRoutes from './routes/student.js'
import verifyRoutes from './routes/verify.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Configure CORS to accept requests from our local React application (port 5173 / 5174 / etc)
app.use(cors({
  origin: '*', // Allow any client origin for local development hackathon
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Bind routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/institution', institutionRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/verify', verifyRoutes)

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal Server Error' })
})

// Only listen when running locally
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 SkillChain API Server running on port ${PORT}`)
  })
}

export default app

