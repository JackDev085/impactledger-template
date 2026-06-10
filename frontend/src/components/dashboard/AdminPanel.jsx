import { RefreshCw } from 'lucide-react'

export default function AdminPanel({
  institutions,
  handleApproveInstitution,
  handleDeactivateInstitution,
  onRefresh,
  loading
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Aprovação de Instituições</h2>
            <p className="text-xs text-slate-500 mt-0.5">Aprove organizações educacionais para emitir credenciais.</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 border border-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors bg-white disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Carteira</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
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
                      {inst.isApproved ? 'Aprovada' : 'Pendente'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inst.isApproved ? (
                      <button
                        onClick={() => handleDeactivateInstitution(inst.id, inst.username, inst.walletAddress)}
                        disabled={loading}
                        className="text-xs font-semibold px-2.5 py-1.5 border border-red-100 text-red-600 rounded-lg hover:bg-red-50/50 transition-colors disabled:opacity-50"
                      >
                        Desativar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApproveInstitution(inst.id, inst.username, inst.walletAddress)}
                        disabled={loading}
                        className="text-xs font-semibold px-2.5 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                      >
                        Aprovar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {institutions.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    Nenhuma instituição de ensino cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
