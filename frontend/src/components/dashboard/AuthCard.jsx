import { Mail, Lock, User, Shield, Wallet } from 'lucide-react'

export default function AuthCard({
  authTab,
  setAuthTab,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  handleLogin,
  handleRegister,
  handleAutofillWallet,
  loading,
  setMessage
}) {
  return (
    <div className="max-w-md mx-auto my-6 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex border-b border-slate-100 pb-3">
        <button
          onClick={() => { setAuthTab('login'); setMessage(null); }}
          className={`flex-1 text-center pb-2 text-sm font-bold border-b-2 transition-colors ${
            authTab === 'login' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Entrar
        </button>
        <button
          onClick={() => { setAuthTab('register'); setMessage(null); }}
          className={`flex-1 text-center pb-2 text-sm font-bold border-b-2 transition-colors ${
            authTab === 'register' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Criar Conta
        </button>
      </div>

      {authTab === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Endereço de E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="voce@dominio.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Senha</label>
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
            {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Entrar'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome Completo / Nome da Instituição</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                required
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                placeholder="ex: Universidade Federal"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Endereço de E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                placeholder="parceiro@dominio.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                placeholder="Mínimo de 6 caracteres"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Função da Conta</label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <select
                value={registerForm.role}
                onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white focus:border-brand-500 transition-colors"
              >
                <option value="student">Estudante / Portador de Credencial</option>
                <option value="institution">Instituição de Ensino (Emissor)</option>
              </select>
            </div>
          </div>

          {registerForm.role === 'institution' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 flex justify-between items-center">
                <span>Endereço de Carteira Ethereum</span>
                <button
                  type="button"
                  onClick={handleAutofillWallet}
                  className="text-[10px] text-brand-600 hover:text-brand-800 font-semibold"
                >
                  Preencher automaticamente via MetaMask
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
                * Perfis institucionais começam com status pendente. Os registros devem ser aprovados pelo administrador do contrato inteligente.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Cadastrar Conta'}
          </button>
        </form>
      )}
    </div>
  )
}
