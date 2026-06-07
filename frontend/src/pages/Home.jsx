import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Award, Lock, Server, CheckCircle } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

export default function Home() {
  const navigate = useNavigate()
  const [certId, setCertId] = useState('')

  const handleQuickVerify = (e) => {
    e.preventDefault()
    if (certId.trim()) {
      navigate(`/verify/${certId.trim()}`)
    }
  }

  const features = [
    {
      title: 'Blockchain Immutability',
      description: 'Certificates are cryptographically registered on smart contracts. No tampering, no falsification.',
      icon: ShieldCheck,
    },
    {
      title: 'Privacy Preserved',
      description: 'Private student data is processed locally and converted into SHA-256 hashes before registry.',
      icon: Lock,
    },
    {
      title: 'Decentralized Metadata (IPFS)',
      description: 'Original PDF certificate layout and evidence assets are pinned securely on IPFS.',
      icon: Server,
    },
    {
      title: 'Instant Validation',
      description: 'Recruiters and verification systems validate student credentials in a single click.',
      icon: Award,
    },
  ]

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl mx-auto"
          >
            {/* Tagline pill */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-xs font-semibold tracking-wide uppercase mb-6">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
              </span>
              Web3 Educational Verifier
            </motion.div>

            {/* Main Title */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]"
            >
              Verifiable educational credentials on <span className="text-brand-600">Blockchain</span>.
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={itemVariants}
              className="mt-5 text-base sm:text-lg text-slate-600 font-normal leading-relaxed"
            >
              SkillChain enables academic institutions, companies, and boot camps to register, issue, and instantly validate digital credentials under decentralized proof.
            </motion.p>

            {/* Quick Validation Form */}
            <motion.form 
              variants={itemVariants}
              onSubmit={handleQuickVerify} 
              className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50"
            >
              <input
                type="text"
                required
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="Enter 9-digit Certificate ID..."
                className="flex-grow px-4 py-2 border-0 bg-transparent text-sm focus:outline-none placeholder-slate-400"
              />
              <button
                type="submit"
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                Validate
              </button>
            </motion.form>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-6 flex justify-center gap-4 text-xs font-medium"
            >
              <Link
                to="/dashboard"
                className="text-brand-600 hover:text-brand-800 flex items-center gap-1.5"
              >
                Go to Issuer Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 bg-slate-50/50 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Cryptographic Trust Architecture
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Standardized off-chain metadata combined with immutable blockchain signatures.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -4, borderColor: 'var(--color-brand-300)' }}
                  className="bg-white border border-slate-200/70 p-6 rounded-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="p-2.5 bg-brand-50 w-fit rounded-lg mb-5 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Checklist Section & CTA */}
      <section className="py-20 bg-white border-t border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Open Auditing Ledger</h2>
              <p className="mt-2 text-slate-600 text-sm">
                SkillChain uses OpenZeppelin compiler specs and standardized event emissions to facilitate automated public API integration for corporate validation.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
              {[
                'Solidity v0.8.20 Smart Contracts',
                'MetaMask Provider Bridge Ready',
                'Failsafe Off-chain Fallbacks',
                'IPFS Asset Panning Logs',
                'SHA-256 local identifier hashing',
                'Instant Admin revocation flags',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <CheckCircle className="h-4.5 w-4.5 text-brand-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Institution Call to Action Banner */}
          <div className="border border-brand-100 bg-brand-50/30 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-fit mb-3">
                For Education Partners
              </span>
              <h3 className="text-xl font-bold text-slate-950">
                Want to start issuing blockchain-backed credentials?
              </h3>
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                Register your institution on SkillChain today. Once approved by the contract administrator, you can configure your course structures, manage faculty access, and publish student records directly to our audit network.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/dashboard?tab=register&role=institution"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                Register Your Institution
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
