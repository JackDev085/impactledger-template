import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Trash2, Award, ShieldCheck, Activity, Wallet, BookOpen, 
  FileSpreadsheet, FilePlus, LogOut, CheckCircle, AlertTriangle, ExternalLink, RefreshCw,
  User, Mail, Lock, Shield, ArrowRight
} from 'lucide-react'
import { blockchainService } from '../services/blockchain'
import { apiService } from '../services/api'
import AuthCard from '../components/dashboard/AuthCard'
import AdminPanel from '../components/dashboard/AdminPanel'
import CourseCatalog from '../components/dashboard/CourseCatalog'
import IssueCertificateForm from '../components/dashboard/IssueCertificateForm'
import VerifiableLedger from '../components/dashboard/VerifiableLedger'
import StudentDashboard from '../components/dashboard/StudentDashboard'

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
            setMessage({ type: 'success', text: `Carteira alterada para: ${user.address}` })
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
        setMessage({ type: 'success', text: `Carteira conectada! Endereço preenchido automaticamente.` })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Falha na conexão com a MetaMask. Insira o endereço manualmente.' })
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
      setMessage({ type: 'success', text: `Carteira MetaMask conectada com sucesso: ${user.address}` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Falha na conexão com a MetaMask.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnectWallet = () => {
    blockchainService.disconnectWallet()
    setWalletUser(null)
    setMessage({ type: 'success', text: 'Carteira MetaMask desconectada.' })
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
      setMessage({ type: 'success', text: `Bem-vindo(a) de volta, ${data.user.username}!` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Falha no login. Verifique suas credenciais.' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const { username, email, password, role, walletAddress } = registerForm
    if (!username || !email || !password || !role) return
    if (role === 'institution' && !walletAddress) {
      setMessage({ type: 'error', text: 'O endereço da carteira é obrigatório para Instituições.' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      await apiService.auth.register(username, email, password, role, walletAddress)
      setMessage({ type: 'success', text: 'Cadastro realizado com sucesso! Agora você pode entrar.' })
      setAuthTab('login')
      setLoginForm({ email, password })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Falha no cadastro.' })
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
    setMessage({ type: 'success', text: 'Sessão encerrada com sucesso.' })
  }

  // Admin Actions
  const handleApproveInstitution = async (id, name, wallet) => {
    setLoading(true)
    setMessage(null)
    try {
      // 1. REST API Approval (registers the institution on-chain via backend wallet)
      await apiService.admin.approveInstitution(id)
      await loadData(currentUser)
      setMessage({ type: 'success', text: `Instituição "${name}" aprovada e registrada na blockchain (on-chain).` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Falha ao aprovar instituição' })
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
      setMessage({ type: 'success', text: `Instituição "${name}" desativada na blockchain (on-chain) e banco de dados atualizado.` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Falha ao desativar instituição' })
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
      setMessage({ type: 'success', text: 'Curso adicionado ao catálogo com sucesso.' })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Falha ao adicionar curso.' })
    } finally {
      setLoading(false)
    }
  }

  const handleIssueCertificate = async (e) => {
    e.preventDefault()
    const { studentName, studentEmail, courseId, ipfsHash } = certForm
    if (!studentName || !studentEmail || !courseId) return

    setLoading(true)
    setMessage(null)
    
    try {
      let transactionHash = ''
      // Generate random unique 9 digit ID for contract and database
      const mockId = Math.floor(Math.random() * 900000000) + 100000000
      
      // Find selected course info
      const course = courses.find(c => c.id === courseId)
      if (!course) {
        throw new Error('Curso selecionado não encontrado.')
      }

      let finalIpfsHash = ipfsHash.trim()

      // 1. Upload metadata to IPFS automatically if no manual hash is provided
      if (!finalIpfsHash) {
        setMessage({
          type: 'info',
          text: 'Gerando metadados e enviando ao IPFS descentralizado...'
        })
        const ipfsResult = await apiService.institution.uploadIPFS(
          mockId.toString(),
          studentEmail,
          studentName,
          course.title,
          course.workloadHours
        )
        finalIpfsHash = ipfsResult.ipfsHash
        console.log('IPFS Upload Result:', ipfsResult)
      }
      
      // 2. We MUST call the Smart Contract on-chain
      if (!blockchainService.contract) {
        try {
          await blockchainService.connectWallet(false)
        } catch (connErr) {
          throw new Error('A carteira Web3 não está conectada. Por favor, conecte a MetaMask para realizar ações na blockchain.')
        }
      }

      if (!blockchainService.contract) {
        throw new Error('A carteira Web3 não está conectada. Por favor, conecte a MetaMask para realizar ações na blockchain.')
      }

      // Generate a local identifier hash representing the student email
      const encoder = new TextEncoder()
      const data = encoder.encode(studentEmail.toLowerCase().trim())
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const studentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      
      setMessage({
        type: 'info',
        text: 'Aguardando confirmação de assinatura na MetaMask para registrar na blockchain...'
      })
      const tx = await blockchainService.contract.issueCertificate(mockId, finalIpfsHash, studentHash)
      
      setMessage({
        type: 'info',
        text: 'Processando transação on-chain na rede Sepolia...'
      })
      const receipt = await tx.wait()
      transactionHash = receipt.hash

      // 3. Post to backend REST API (only if on-chain transaction succeeded!)
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
        text: `Certificado emitido com sucesso! ID: #${res.certificate.id}. Salvo no IPFS e registrado na blockchain Sepolia.`
      })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.reason || err.message || 'Falha ao emitir certificado' })
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeCert = async (id) => {
    if (!window.confirm(`Tem certeza de que deseja revogar o certificado #${id}? Esta ação irá marcá-lo como inválido no banco de dados e no registro da blockchain.`)) return
    setLoading(true)
    setMessage(null)
    try {
      // 1. MUST perform on-chain revocation
      if (!blockchainService.contract) {
        try {
          await blockchainService.connectWallet(false)
        } catch (connErr) {
          throw new Error('A carteira Web3 não está conectada. Por favor, conecte a MetaMask para realizar ações na blockchain.')
        }
      }

      if (!blockchainService.contract) {
        throw new Error('A carteira Web3 não está conectada. Por favor, conecte a MetaMask para realizar ações na blockchain.')
      }

      const tx = await blockchainService.revokeCertificate(id)

      // 2. REST API Revocation
      await apiService.institution.revokeCertificate(id)
      await loadData(currentUser)
      setMessage({ type: 'success', text: `Certificado #${id} revogado com sucesso na blockchain e no banco de dados.` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.reason || err.message || 'Falha ao revogar certificado' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header Banner */}
      <div className="border-b border-slate-200/80 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Workspace SkillChain</h1>
          <p className="text-slate-600 text-sm mt-1">
            Gerencie instituições de ensino, registre cursos e emita certificados criptograficamente seguros.
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
                      title="Desconectar Carteira"
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 hover:bg-brand-100 hover:border-brand-200 transition-colors rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Conectar MetaMask</span>
                  </button>
                )}
              </div>
            )}
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Conectado como</span>
              <span className="font-semibold text-slate-800 text-sm block">{currentUser.username}</span>
              <span className="text-[10px] text-slate-500 block">
                Função: <span className="font-bold text-brand-600 capitalize">
                  {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'student' ? 'Estudante' : 'Instituição'}
                </span>
                {currentUser.walletAddress && ` | ${currentUser.walletAddress.substring(0, 6)}...${currentUser.walletAddress.substring(38)}`}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-100 transition-colors bg-white text-slate-500"
              title="Sair"
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
            : message.type === 'info'
              ? 'bg-blue-50 border-blue-100 text-blue-800'
              : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : message.type === 'info' ? (
            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Auth Forms (when disconnected) */}
      {!currentUser ? (
        <AuthCard
          authTab={authTab}
          setAuthTab={setAuthTab}
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          registerForm={registerForm}
          setRegisterForm={setRegisterForm}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          handleAutofillWallet={handleAutofillWallet}
          loading={loading}
          setMessage={setMessage}
        />
      ) : (
        /* Logged In Dashboard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-1 bg-white border border-slate-200 rounded-2xl p-4 h-fit">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Módulos do Workspace</h3>
            
            {/* Admin Tabs */}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('institutions')}
                className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'institutions' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                Aprovação de Instituições
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
                Meu Portfólio
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
                  Catálogo de Cursos
                </button>
                <button
                  onClick={() => setActiveTab('issue')}
                  disabled={!currentUser.isApproved}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                    activeTab === 'issue' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FilePlus className="h-4.5 w-4.5" />
                  Emitir Certificado
                </button>
                <button
                  onClick={() => setActiveTab('ledger')}
                  disabled={!currentUser.isApproved}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                    activeTab === 'ledger' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                  Livro de Registro Verificável
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
                  <h3 className="text-sm font-bold text-slate-900">Verificação de Instituição Pendente</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Sua conta institucional vinculada ao endereço de carteira <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{currentUser.walletAddress}</code> está atualmente pendente de aprovação do administrador. Você pode definir cursos no módulo do catálogo, mas não poderá emitir certificados verificados até que seja aprovado.
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* 1. Admin: Institutions List & Approval */}
              {activeTab === 'institutions' && currentUser.role === 'admin' && (
                <motion.div
                  key="institutions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <AdminPanel
                    institutions={institutions}
                    handleApproveInstitution={handleApproveInstitution}
                    handleDeactivateInstitution={handleDeactivateInstitution}
                    onRefresh={() => loadData(currentUser)}
                    loading={loading}
                  />
                </motion.div>
              )}

              {/* 2. Institution: Course Catalog */}
              {activeTab === 'courses' && currentUser.role === 'institution' && (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <CourseCatalog
                    courses={courses}
                    courseForm={courseForm}
                    setCourseForm={setCourseForm}
                    handleRegisterCourse={handleRegisterCourse}
                    loading={loading}
                  />
                </motion.div>
              )}

              {/* 3. Institution: Issue Certificate */}
              {activeTab === 'issue' && currentUser.role === 'institution' && currentUser.isApproved && (
                <motion.div
                  key="issue"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <IssueCertificateForm
                    courses={courses}
                    certForm={certForm}
                    setCertForm={setCertForm}
                    handleIssueCertificate={handleIssueCertificate}
                    loading={loading}
                  />
                </motion.div>
              )}

              {/* 4. Institution: Verifiable Ledger */}
              {activeTab === 'ledger' && currentUser.role === 'institution' && currentUser.isApproved && (
                <motion.div
                  key="ledger"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <VerifiableLedger
                    certificates={certificates}
                    handleRevokeCert={handleRevokeCert}
                    onRefresh={() => loadData(currentUser)}
                    loading={loading}
                  />
                </motion.div>
              )}
 
              {/* 5. Student: Dashboard View */}
              {activeTab === 'studentDashboard' && currentUser.role === 'student' && (
                <motion.div
                  key="studentDashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <StudentDashboard
                    studentSummary={studentSummary}
                    certificates={certificates}
                    onRefresh={() => loadData(currentUser)}
                    loading={loading}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
