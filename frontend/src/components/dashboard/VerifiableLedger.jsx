import { RefreshCw, ExternalLink } from 'lucide-react'

export default function VerifiableLedger({
  certificates,
  handleRevokeCert,
  onRefresh,
  loading
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900">Livro de Registro de Credenciais Verificáveis</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 border border-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors bg-white disabled:opacity-50"
          title="Recarregar Registro"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
              <th className="py-3 px-4">ID do Certificado</th>
              <th className="py-3 px-4">Estudante</th>
              <th className="py-3 px-4">Curso</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
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
                  <span className="text-[10px] text-slate-400 block">{cert.workloadHours}h de carga horária</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    cert.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {cert.status === 'active' ? 'Registrado' : 'Revogado'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <a
                    href={`/verify/${cert.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-850 px-2 py-1 border border-brand-100 rounded bg-brand-50/30 transition-colors"
                  >
                    Validar
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {cert.status === 'active' && (
                    <button
                      onClick={() => handleRevokeCert(cert.id)}
                      disabled={loading}
                      className="text-xs font-semibold text-red-600 hover:text-red-850 px-2 py-1 border border-red-100 rounded hover:bg-red-50/30 transition-colors disabled:opacity-50"
                    >
                      Revogar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {certificates.length === 0 && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">
                  Nenhum certificado emitido por esta conta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
