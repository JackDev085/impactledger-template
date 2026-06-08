import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Trash2, Award, ShieldCheck, Activity, Wallet, BookOpen, 
  FileSpreadsheet, FilePlus, LogOut, CheckCircle, AlertTriangle, ExternalLink, RefreshCw,
  User, Mail, Lock, Shield, ArrowRight
} from 'lucide-react'
import { blockchainService } from '../services/blockchain'
import { apiService } from '../services/api'

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('')
  const [authTab, setAuthTab] = useState('login') // 'login' or 'register'
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // Lists
  const [institutions, setInstitutions] = useState([])
  const [courses, setCourses] = useState([])
  const [certificates, setCertificates] = useState([])
  
  // Student Specific metrics
  const [studentSummary, setStudentSummary] = useState({ totalCertificates: 0, totalHoursCompleted: 0 })

  // Auth Form States
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
    walletAddress: ''
  })

  const [walletUser, setWalletUser] = useState(null)

  // Panel Form States
  const [courseForm, setCourseForm] = useState({ name: '', description: '', workload: '' })
  const [certForm, setCertForm] = useState({ studentName: '', studentEmail: '', courseId: '', ipfsHash: '' })

  const loadData = async (user) => {
    if (!user) return
    try {
      if (user.role === 'admin') {
        const instList = await apiService.admin.getInstitutions()
        setInstitutions(instList)
      } else if (user.role === 'institution') {
        // Only load if approved
        if (user.isApproved) {
          const courseList = await apiService.institution.getCourses()
          setCourses(courseList)
          const certList = await apiService.institution.getIssuedCertificates()
          setCertificates(certList)
        }
      } else if (user.role === 'student') {
        const dashboardData = await apiService.student.getDashboard()
        setStudentSummary(dashboardData.summary)
        setCertificates(dashboardData.certificates)
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setMessage({ type: 'error', text: err.message || 'Error loading dashboard data' })
    }
  }

  // Parse query parameters for direct CTA links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    const roleParam = params.get('role')
    
    if (tabParam === 'register') {
      setAuthTab('register')
      if (roleParam) {
        setRegisterForm(prev => ({ ...prev, role: roleParam }))
      }
    }

    // Load user session
    const loggedUser = apiService.auth.getCurrentUser()
    if (loggedUser) {
      setCurrentUser(loggedUser)
      // Set default tab based on role
      if (loggedUser.role === 'admin') {
        setActiveTab('institutions')
      } else if (loggedUser.role === 'student') {
        setActiveTab('studentDashboard')
      } else {
        setActiveTab('courses')
      }
      loadData(loggedUser)
    }

    // Load wallet session
    const activeWallet = blockchainService.getCurrentUser()
    if (activeWallet) {
      setWalletUser(activeWallet)
      blockchainService.connectWallet().catch(err => {
        console.warn('Auto wallet connect failed on mount:', err)
      })
    }

    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccounts = async (accounts) => {
        if (accounts.length === 0) {
          handleDisconnectWallet()
        } else {
          try {
            const user = await blockchainService.connectWallet()
            setWalletUser(user)
            setMessage({ type: 'success', text: `Wallet switched to: ${user.address}` })
          } catch (err) {
            console.error('Wallet account switch failed:', err)
          }
        }
      }
      window.ethereum.on('accountsChanged', handleAccounts)
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccounts)
      }
    }
  }, [])

  // Auto connect wallet address to register form
  const handleAutofillWallet = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const user = await blockchainService.connectWallet(true)
      if (user && user.address) {
        setRegisterForm(prev => ({ ...prev, walletAddress: user.address }))
        setWalletUser(user)
        setMessage({ type: 'success', text: `Wallet connected! Address pre-filled.` })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'MetaMask connection failed. Enter address manually.' })
    } finally {
      setLoading(false)
    }
  }

  const handleConnectWallet = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const user = await blockchainService.connectWallet(true)
      setWalletUser(user)
      setMessage({ type: 'success', text: `MetaMask wallet connected successfully: ${user.address}` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'MetaMask connection failed.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnectWallet = () => {
    blockchainService.disconnectWallet()
    setWalletUser(null)
    setMessage({ type: 'success', text: 'MetaMask wallet disconnected.' })
  }

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) return
    setLoading(true)
    setMessage(null)
    try {
      const data = await apiService.auth.login(loginForm.email, loginForm.password)
      setCurrentUser(data.user)
      
      // Set tab based on role
      if (data.user.role === 'admin') {
        setActiveTab('institutions')
      } else if (data.user.role === 'student') {
        setActiveTab('studentDashboard')
      } else {
        setActiveTab('courses')
      }
      
      await loadData(data.user)
      setMessage({ type: 'success', text: `Welcome back, ${data.user.username}!` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Login failed. Check your credentials.' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const { username, email, password, role, walletAddress } = registerForm
    if (!username || !email || !password || !role) return
    if (role === 'institution' && !walletAddress) {
      setMessage({ type: 'error', text: 'Wallet Address is required for Institutions.' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      await apiService.auth.register(username, email, password, role, walletAddress)
      setMessage({ type: 'success', text: 'Registration successful! You can now log in.' })
      setAuthTab('login')
      setLoginForm({ email, password })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Registration failed.' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    apiService.auth.logout()
    blockchainService.disconnectWallet()
    setWalletUser(null)
    setCurrentUser(null)
    setActiveTab('')
    setMessage({ type: 'success', text: 'Successfully logged out.' })
  }

  // Admin Actions
  const handleApproveInstitution = async (id, name, wallet) => {
    setLoading(true)
    setMessage(null)
    try {
      // 1. REST API Approval (registers the institution on-chain via backend wallet)
      await apiService.admin.approveInstitution(id)
      await loadData(currentUser)
      setMessage({ type: 'success', text: `Institution "${name}" approved and registered on-chain.` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to approve institution' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivateInstitution = async (id, name, wallet) => {
    setLoading(true)
    setMessage(null)
    try {
      // 1. REST API Deactivation (deactivates the institution on-chain via backend wallet)
      await apiService.admin.deactivateInstitution(id)
      await loadData(currentUser)
      setMessage({ type: 'success', text: `Institution "${name}" deactivated on-chain and database updated.` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to deactivate institution' })
    } finally {
      setLoading(false)
    }
  }

  // Institution Actions
  const handleRegisterCourse = async (e) => {
    e.preventDefault()
    if (!courseForm.name || !courseForm.workload) return
    setLoading(true)
    setMessage(null)
    try {
      await apiService.institution.createCourse(courseForm.name, courseForm.description, courseForm.workload)
      await loadData(currentUser)
      setCourseForm({ name: '', description: '', workload: '' })
      setMessage({ type: 'success', text: 'Course added to catalog successfully.' })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to add course.' })
    } finally {
      setLoading(false)
    }
  }

  const handleIssueCertificate = async (e) => {
    e.preventDefault()
    const { studentName, studentEmail, courseId, ipfsHash } = certForm
    if (!studentName || !studentEmail || !courseId) return

    // Generate mock IPFS CID if empty
    const finalIpfsHash = ipfsHash.trim() || `Qm${Array.from({length: 44}, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*62)]).join('')}`
    
    setLoading(true)
    setMessage(null)
    
    try {
      let transactionHash = ''
      // Generate random unique 9 digit ID for contract and database
      const mockId = Math.floor(Math.random() * 900000000) + 100000000
      
      // 1. We MUST call the Smart Contract on-chain
      if (!blockchainService.contract) {
        try {
          await blockchainService.connectWallet(false)
        } catch (connErr) {
          throw new Error('Web3 wallet is not connected. Please connect MetaMask to perform on-chain actions.')
        }
      }

      if (!blockchainService.contract) {
        throw new Error('Web3 wallet is not connected. Please connect MetaMask to perform on-chain actions.')
      }

      // Generate a local identifier hash representing the student email
      const encoder = new TextEncoder()
      const data = encoder.encode(studentEmail.toLowerCase().trim())
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const studentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      
      const tx = await blockchainService.contract.issueCertificate(mockId, finalIpfsHash, studentHash)
      const receipt = await tx.wait()
      transactionHash = receipt.hash

      // 2. Post to backend REST API (only if on-chain transaction succeeded!)
      const res = await apiService.institution.issueCertificate(
        mockId.toString(),
        studentEmail,
        studentName,
        courseId,
        finalIpfsHash,
        transactionHash
      )
      
      await loadData(currentUser)
      setCertForm({ studentName: '', studentEmail: '', courseId: '', ipfsHash: '' })
      setMessage({
        type: 'success',
        text: `Certificate issued successfully! ID: #${res.certificate.id}. Logged to blockchain on-chain.`
      })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.reason || err.message || 'Failed to issue certificate' })
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeCert = async (id) => {
    if (!window.confirm(`Are you sure you want to revoke certificate #${id}? This action will stamp it as invalid in both the database and the blockchain registry.`)) return
    setLoading(true)
    setMessage(null)
    try {
      // 1. MUST perform on-chain revocation
      if (!blockchainService.contract) {
        try {
          await blockchainService.connectWallet(false)
        } catch (connErr) {
          throw new Error('Web3 wallet is not connected. Please connect MetaMask to perform on-chain actions.')
        }
      }

      if (!blockchainService.contract) {
        throw new Error('Web3 wallet is not connected. Please connect MetaMask to perform on-chain actions.')
      }

      const tx = await blockchainService.revokeCertificate(id)
      await tx.wait()

      // 2. REST API Revocation
      await apiService.institution.revokeCertificate(id)
      await loadData(currentUser)
      setMessage({ type: 'success', text: `Certificate #${id} successfully revoked on-chain and database.` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.reason || err.message || 'Failed to revoke certificate' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header Banner */}
      <div className="border-b border-slate-200/80 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">SkillChain Workspace</h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage academic institutions, register courses, and issue cryptographically secure certificates.
          </p>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3">
            {(currentUser.role === 'admin' || currentUser.role === 'institution') && (
              <div className="mr-2 flex items-center">
                {walletUser ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono">{walletUser.address.substring(0, 6)}...{walletUser.address.substring(38)}</span>
                    <button 
                      onClick={handleDisconnectWallet}
                      className="ml-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-900 underline uppercase tracking-wider"
                      title="Disconnect Wallet"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 hover:bg-brand-100 hover:border-brand-200 transition-colors rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Connect MetaMask</span>
                  </button>
                )}
              </div>
            )}
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Logged In As</span>
              <span className="font-semibold text-slate-800 text-sm block">{currentUser.username}</span>
              <span className="text-[10px] text-slate-500 block">
                Role: <span className="font-bold text-brand-600 capitalize">{currentUser.role}</span>
                {currentUser.walletAddress && ` | ${currentUser.walletAddress.substring(0, 6)}...${currentUser.walletAddress.substring(38)}`}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-100 transition-colors bg-white text-slate-500"
              title="Log Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>

      {/* Global Status/Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm border flex items-start gap-2.5 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Auth Forms (when disconnected) */}
      {!currentUser ? (
        <div className="max-w-md mx-auto my-6 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex border-b border-slate-100 pb-3">
            <button
              onClick={() => { setAuthTab('login'); setMessage(null); }}
              className={`flex-1 text-center pb-2 text-sm font-bold border-b-2 transition-colors ${
                authTab === 'login' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthTab('register'); setMessage(null); }}
              className={`flex-1 text-center pb-2 text-sm font-bold border-b-2 transition-colors ${
                authTab === 'register' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {authTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name / Institution Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    placeholder="e.g. Stanford University"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="partner@domain.com"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Account Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <select
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white focus:border-brand-500 transition-colors"
                  >
                    <option value="student">Student / Credential Holder</option>
                    <option value="institution">Educational Institution (Issuer)</option>
                  </select>
                </div>
              </div>

              {registerForm.role === 'institution' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 flex justify-between items-center">
                    <span>Ethereum Wallet Address</span>
                    <button
                      type="button"
                      onClick={handleAutofillWallet}
                      className="text-[10px] text-brand-600 hover:text-brand-800 font-semibold"
                    >
                      Autofill from MetaMask
                    </button>
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={registerForm.walletAddress}
                      onChange={(e) => setRegisterForm({ ...registerForm, walletAddress: e.target.value })}
                      placeholder="0x..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    * Institutional profiles starting as pending. Registries must be approved by the smart contract admin.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Register Account'}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Logged In Dashboard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-1 bg-white border border-slate-200 rounded-2xl p-4 h-fit">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Workspace Modules</h3>
            
            {/* Admin Tabs */}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('institutions')}
                className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'institutions' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                Institutions Approval
              </button>
            )}

            {/* Student Tabs */}
            {currentUser.role === 'student' && (
              <button
                onClick={() => setActiveTab('studentDashboard')}
                className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'studentDashboard' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Activity className="h-4.5 w-4.5" />
                My Portfolio
              </button>
            )}

            {/* Institution Tabs */}
            {currentUser.role === 'institution' && (
              <>
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'courses' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="h-4.5 w-4.5" />
                  Course Catalog
                </button>
                <button
                  onClick={() => setActiveTab('issue')}
                  disabled={!currentUser.isApproved}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                    activeTab === 'issue' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FilePlus className="h-4.5 w-4.5" />
                  Issue Certificate
                </button>
                <button
                  onClick={() => setActiveTab('ledger')}
                  disabled={!currentUser.isApproved}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                    activeTab === 'ledger' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                  Verifiable Ledger
                </button>
              </>
            )}
          </div>

          {/* Right Subpanel contents */}
          <div className="lg:col-span-3">
            
            {/* Pending Approval warning for Institutions */}
            {currentUser.role === 'institution' && !currentUser.isApproved && (
              <div className="mb-6 p-5 border border-amber-100 bg-amber-50/50 rounded-2xl flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Institution Verification Pending</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Your institutional account under wallet address <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{currentUser.walletAddress}</code> is currently pending admin approval. You can define courses inside the catalog module, but you cannot issue verified certificates until approved.
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* 1. Admin: Institutions List & Approval */}
              {activeTab === 'institutions' && currentUser.role === 'admin' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Institutions Approvals</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Approve educational organizations to issue credentials.</p>
                      </div>
                      <button
                        onClick={() => loadData(currentUser)}
                        className="p-1 border border-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors bg-white"
                        title="Refresh list"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Wallet</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {institutions.map((inst) => (
                            <tr key={inst.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-3.5 px-4 font-semibold text-slate-800">{inst.username}</td>
                              <td className="py-3.5 px-4">{inst.email}</td>
                              <td className="py-3.5 px-4 font-mono text-xs">{inst.walletAddress}</td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  inst.isApproved 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {inst.isApproved ? 'Approved' : 'Pending'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {inst.isApproved ? (
                                  <button
                                    onClick={() => handleDeactivateInstitution(inst.id, inst.username, inst.walletAddress)}
                                    className="text-xs font-semibold px-2.5 py-1.5 border border-red-100 text-red-600 rounded-lg hover:bg-red-50/50 transition-colors"
                                  >
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleApproveInstitution(inst.id, inst.username, inst.walletAddress)}
                                    className="text-xs font-semibold px-2.5 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                                  >
                                    Approve
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {institutions.length === 0 && (
                            <tr>
                              <td colSpan="5" className="py-8 text-center text-slate-400">
                                No educational institutions registered yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 2. Institution: Course Catalog */}
              {activeTab === 'courses' && currentUser.role === 'institution' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Register New Course</h2>
                    <form onSubmit={handleRegisterCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Course Title</label>
                        <input
                          type="text"
                          required
                          value={courseForm.name}
                          onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                          placeholder="e.g. Master of Business Administration"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Workload (Hours)</label>
                        <input
                          type="number"
                          required
                          value={courseForm.workload}
                          onChange={(e) => setCourseForm({ ...courseForm, workload: e.target.value })}
                          placeholder="e.g. 60"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                        <textarea
                          rows="2"
                          value={courseForm.description}
                          onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                          placeholder="Brief syllabus outline or course requirements..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="h-4.5 w-4.5" />
                          Add Course
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Course Offerings</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {courses.map((course) => (
                        <div key={course.id} className="border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase block w-fit mb-2">
                              {course.workloadHours} Hours
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm leading-snug">{course.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">{course.description || 'No description available.'}</p>
                          </div>
                          <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                            <span>ID: #{course.id}</span>
                          </div>
                        </div>
                      ))}
                      {courses.length === 0 && (
                        <div className="sm:col-span-2 py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-sm">
                          No courses registered yet.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. Institution: Issue Certificate */}
              {activeTab === 'issue' && currentUser.role === 'institution' && currentUser.isApproved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-slate-200 rounded-2xl p-6"
                >
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Issue Verified Certificate</h2>
                  <p className="text-xs text-slate-500 mb-6">
                    Fill in the student details. The registry will record their information in the database and write the transaction proofs directly to the blockchain.
                  </p>

                  <form onSubmit={handleIssueCertificate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Student Full Name</label>
                        <input
                          type="text"
                          required
                          value={certForm.studentName}
                          onChange={(e) => setCertForm({ ...certForm, studentName: e.target.value })}
                          placeholder="e.g. Alice Smith"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Student Email Address</label>
                        <input
                          type="email"
                          required
                          value={certForm.studentEmail}
                          onChange={(e) => setCertForm({ ...certForm, studentEmail: e.target.value })}
                          placeholder="e.g. alice@example.com"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Associated Course</label>
                        <select
                          required
                          value={certForm.courseId}
                          onChange={(e) => setCertForm({ ...certForm, courseId: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white focus:border-brand-500 transition-colors"
                        >
                          <option value="">Select a Course</option>
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>{course.title} ({course.workloadHours}h)</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">IPFS Hash / PDF CID (Optional)</label>
                        <input
                          type="text"
                          value={certForm.ipfsHash}
                          onChange={(e) => setCertForm({ ...certForm, ipfsHash: e.target.value })}
                          placeholder="Autogenerated if left empty"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading || !certForm.courseId}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 w-full md:w-auto"
                      >
                        {loading ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Award className="h-4.5 w-4.5" />
                        )}
                        Issue Credential & Register Hash
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* 4. Institution: Verifiable Ledger */}
              {activeTab === 'ledger' && currentUser.role === 'institution' && currentUser.isApproved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-slate-200 rounded-2xl p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Verifiable Credentials Ledger</h2>
                    <button
                      onClick={() => loadData(currentUser)}
                      className="p-1 border border-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors bg-white"
                      title="Reload Ledger"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                          <th className="py-3 px-4">Certificate ID</th>
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificates.map((cert) => (
                          <tr key={cert.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-semibold text-brand-600">#{cert.id}</td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800 block">{cert.studentName}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{cert.studentEmail}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-slate-800 font-medium block">{cert.courseTitle}</span>
                              <span className="text-[10px] text-slate-400 block">{cert.workloadHours}h workload</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                cert.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                {cert.status === 'active' ? 'Registered' : 'Revoked'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <a
                                href={`/verify/${cert.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-850 px-2 py-1 border border-brand-100 rounded bg-brand-50/30 transition-colors"
                              >
                                Validate
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {cert.status === 'active' && (
                                <button
                                  onClick={() => handleRevokeCert(cert.id)}
                                  className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1 border border-red-100 rounded hover:bg-red-50/30 transition-colors"
                                >
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {certificates.length === 0 && (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-slate-400">
                              No certificates issued under this account.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* 5. Student: Dashboard View */}
              {activeTab === 'studentDashboard' && currentUser.role === 'student' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Certificates Obtained</span>
                        <span className="text-2xl font-bold text-slate-800 mt-0.5 block">{studentSummary.totalCertificates}</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Activity className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Completed Workload</span>
                        <span className="text-2xl font-bold text-slate-800 mt-0.5 block">{studentSummary.totalHoursCompleted} Hours</span>
                      </div>
                    </div>
                  </div>

                  {/* Student Certificates List */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">My Educational Credentials</h2>
                        <p className="text-xs text-slate-500 mt-0.5">List of verifiable achievements registered to your profile email.</p>
                      </div>
                      <button
                        onClick={() => loadData(currentUser)}
                        className="p-1 border border-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors bg-white"
                        title="Reload Portfolio"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                            <th className="py-3 px-4">Credential ID</th>
                            <th className="py-3 px-4">Course</th>
                            <th className="py-3 px-4">Issuing Authority</th>
                            <th className="py-3 px-4">Workload</th>
                            <th className="py-3 px-4">Issued On</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {certificates.map((cert) => (
                            <tr key={cert.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-3.5 px-4 font-mono font-semibold text-brand-600">#{cert.id}</td>
                              <td className="py-3.5 px-4 font-semibold text-slate-850">{cert.courseTitle}</td>
                              <td className="py-3.5 px-4">
                                <span className="font-semibold text-slate-800 block">{cert.issuerName}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{cert.issuerId}</span>
                              </td>
                              <td className="py-3.5 px-4">{cert.workloadHours} hrs</td>
                              <td className="py-3.5 px-4">
                                {new Date(cert.issuedAt).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <a
                                  href={`/verify/${cert.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 px-3 py-1.5 border border-brand-100 rounded-lg bg-brand-50/30 transition-colors"
                                >
                                  Verify Ledger
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </td>
                            </tr>
                          ))}
                          {certificates.length === 0 && (
                            <tr>
                              <td colSpan="6" className="py-8 text-center text-slate-400">
                                No educational certificates registered under this email address yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
