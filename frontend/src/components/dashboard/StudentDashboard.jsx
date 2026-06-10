import { Award, Activity, RefreshCw, ExternalLink } from 'lucide-react'

export default function StudentDashboard({
  studentSummary,
  certificates,
  onRefresh,
  loading
}) {
  return (
    <div className="space-y-6">
      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Certificados Obtidos</span>
            <span className="text-2xl font-bold text-slate-800 mt-0.5 block">{studentSummary.totalCertificates}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Carga Horária Concluída</span>
            <span className="text-2xl font-bold text-slate-800 mt-0.5 block">{studentSummary.totalHoursCompleted} Horas</span>
          </div>
        </div>
      </div>

      {/* Student Certificates List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Minhas Credenciais Educacionais</h2>
            <p className="text-xs text-slate-500 mt-0.5">Lista de conquistas verificáveis registradas para o e-mail do seu perfil.</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 border border-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors bg-white disabled:opacity-50"
            title="Recarregar Portfólio"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                <th className="py-3 px-4">ID da Credencial</th>
                <th className="py-3 px-4">Curso</th>
                <th className="py-3 px-4">Autoridade Emissora</th>
                <th className="py-3 px-4">Carga Horária</th>
                <th className="py-3 px-4">Emitido Em</th>
                <th className="py-3 px-4 text-right">Ações</th>
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
                  <td className="py-3.5 px-4">{cert.workloadHours} h</td>
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
                      Verificar Registro
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
              {certificates.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Nenhum certificado educacional registrado sob este endereço de e-mail ainda.
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
