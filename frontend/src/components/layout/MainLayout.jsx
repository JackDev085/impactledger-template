import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Menu, X, Layers, Home, LayoutDashboard, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="p-1.5 bg-brand-50 rounded-lg group-hover:bg-brand-100 transition-colors duration-200">
                  <Layers className="h-5 w-5 text-brand-600" />
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Skill<span className="text-brand-600 font-semibold">Chain</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? 'bg-brand-50/80 text-brand-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>
                )
              })}
            </nav>

            {/* Right Action Button */}
            <div className="hidden md:flex items-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 active:bg-brand-800 transition-colors duration-200"
              >
                Acessar App
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={toggleMobileMenu}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none transition-colors duration-200"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Abrir menu principal</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu container (Framer Motion) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="md:hidden border-b border-slate-200 bg-white overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-medium transition-colors duration-150 ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5 text-slate-500" />
                      {link.label}
                    </NavLink>
                  )
                })}
                <div className="pt-4 pb-2 px-4 border-t border-slate-100">
                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-base font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors duration-150"
                  >
                    Acessar App
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-600" />
            <span className="font-semibold text-sm text-slate-800">SkillChain</span>
            <span className="text-slate-400 text-xs">|</span>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} SkillChain. Desenvolvido para o Hackathon.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-800 transition-colors duration-150">Início</Link>
            <Link to="/dashboard" className="hover:text-slate-800 transition-colors duration-150">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
