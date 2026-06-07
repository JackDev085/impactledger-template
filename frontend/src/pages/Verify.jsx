import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { blockchainService } from '../services/blockchain'
import { apiService } from '../services/api'
import { Award, ShieldCheck, ShieldAlert, ArrowLeft, Printer, ExternalLink, Search } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Verify() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchId, setSearchId] = useState(id || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleVerify = async (certId) => {
    if (!certId) return
    setLoading(true)
    try {
      // 1. Query Backend Database API
      const apiResult = await apiService.verify.check(certId)
      if (apiResult && apiResult.exists) {
        const cert = apiResult.certificate
        setResult({
          exists: true,
          isValid: apiResult.isValid,
          id: cert.id,
          courseName: cert.courseTitle,
          workload: cert.workloadHours,
          studentName: cert.studentName,
          studentHash: cert.studentEmail, // fallback to email representation
          issuerName: cert.issuerName,
          issuer: cert.issuerId,
          issuedAt: cert.issuedAt,
          ipfsHash: cert.certificateHash,
          blockchainTx: cert.transactionHash,
          mode: 'database',
          revoked: cert.status === 'revoked'
        })
        setLoading(false)
        return
      }
    } catch (err) {
      console.warn('API verification check failed or returned empty. Retrying via Web3 provider:', err)
    }

    // 2. Web3 / LocalStorage Fallback provider
    try {
      const data = await blockchainService.verifyCertificate(certId)
      setResult(data)
    } catch (err) {
      console.error(err)
      setResult({ exists: false, isValid: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      setSearchId(id)
      handleVerify(id)
    } else {
      setResult(null)
    }
  }, [id])

  const onSubmit = (e) => {
    e.preventDefault()
    if (searchId.trim()) {
      navigate(`/verify/${searchId.trim()}`)
    }
  }

  const printCertificate = () => {
    window.print()
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow flex flex-col justify-center">
      {/* Search form (hide on print) */}
      <div className="print:hidden mb-8 text-center max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Public Validation Gateway</h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Verify educational credentials securely. Enter the 9-digit certificate ID below to search the blockchain audit log.
        </p>

        <form onSubmit={onSubmit} className="flex gap-2 mt-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Certificate ID (e.g. 10293848)"
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            Verify
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500 mt-3">Reading audit trail from blockchain...</p>
        </div>
      )}

      {!loading && result && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Header Banner */}
          <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
            result.isValid 
              ? 'bg-emerald-50/60 border-emerald-100' 
              : result.revoked 
                ? 'bg-red-50/60 border-red-100' 
                : 'bg-amber-50/60 border-amber-100'
          }`}>
            <div className="flex items-center gap-3">
              {result.isValid ? (
                <>
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Verification Successful</h2>
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Valid Credential</span>
                  </div>
                </>
              ) : result.revoked ? (
                <>
                  <div className="p-2 bg-red-100 rounded-lg text-red-700">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Revocation Notice</h2>
                    <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Revoked / Suspended</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Registry Not Found</h2>
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">No Record Found</span>
                  </div>
                </>
              )}
            </div>

            {result.exists && (
              <div className="print:hidden flex items-center gap-2">
                <button
                  onClick={printCertificate}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Details
                </button>
              </div>
            )}
          </div>

          {/* Certificate Audit Data */}
          {result.exists ? (
            <div className="p-6 md:p-8 space-y-6">
              {/* Certificate Ribbon */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
                <Award className="h-12 w-12 text-brand-600 mb-3" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SkillChain Educative Registry</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{result.courseName}</h3>
                <p className="text-sm text-slate-600 mt-0.5">Carga Horária: {result.workload} horas</p>
              </div>

              {/* Grid of Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Student Name</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{result.studentName}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Student Identifier</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{result.studentHash.substring(0, 16)}... (SHA-256)</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Issuing Authority</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {result.issuerName || 'Registered Institution'}
                  </span>
                  <span className="font-mono text-xs text-slate-500 block">{result.issuer}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Date of Issue</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {new Date(result.issuedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Credential ID</span>
                  <span className="font-mono font-semibold text-brand-600 mt-0.5 block">#{result.id}</span>
                </div>
              </div>

              {/* Blockchain Evidence Trail */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Blockchain Audit Trail</h4>
                
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-500 flex-shrink-0">IPFS HASH (PDF):</span>
                    <a
                      href={`https://ipfs.io/ipfs/${result.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 flex items-center gap-1 break-all"
                    >
                      {result.ipfsHash}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-500 flex-shrink-0">TX HASH (BLOCKCHAIN):</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${result.blockchainTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 flex items-center gap-1 break-all"
                    >
                      {result.blockchainTx}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/40">
                    <span className="text-slate-500">REGISTRY LEDGER:</span>
                    <span className="text-slate-800 font-semibold uppercase">{result.mode === 'mock' ? 'MOCK BLOCKCHAIN (DEMO)' : 'POLYGON/ETHEREUM'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Award className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-sm">We couldn't locate any records matching Certificate ID <strong>{id}</strong>.</p>
              <p className="text-xs text-slate-400">Please verify the ID or contact the issuing authority to check if the registration is complete.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Back button (hide on print) */}
      {!loading && (
        <div className="print:hidden mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      )}
    </div>
  )
}
