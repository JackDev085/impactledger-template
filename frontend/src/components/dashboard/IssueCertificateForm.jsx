import { Award } from 'lucide-react'

export default function IssueCertificateForm({
  courses,
  certForm,
  setCertForm,
  handleIssueCertificate,
  loading
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-2">Emitir Certificado Verificado</h2>
      <p className="text-xs text-slate-500 mb-6">
        Preencha os detalhes do estudante. O registro salvará suas informações no banco de dados e gravará as provas de transação diretamente na blockchain.
      </p>

      <form onSubmit={handleIssueCertificate} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome Completo do Estudante</label>
            <input
              type="text"
              required
              value={certForm.studentName}
              onChange={(e) => setCertForm({ ...certForm, studentName: e.target.value })}
              placeholder="ex: Alice Smith"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Endereço de E-mail do Estudante</label>
            <input
              type="email"
              required
              value={certForm.studentEmail}
              onChange={(e) => setCertForm({ ...certForm, studentEmail: e.target.value })}
              placeholder="ex: alice@exemplo.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Curso Associado</label>
            <select
              required
              value={certForm.courseId}
              onChange={(e) => setCertForm({ ...certForm, courseId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white focus:border-brand-500 transition-colors"
            >
              <option value="">Selecione um Curso</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title} ({course.workloadHours}h)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Hash IPFS / CID do PDF (Opcional)</label>
            <input
              type="text"
              value={certForm.ipfsHash}
              onChange={(e) => setCertForm({ ...certForm, ipfsHash: e.target.value })}
              placeholder="Gerado automaticamente se deixado em branco"
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
            Emitir Credencial e Registrar Hash
          </button>
        </div>
      </form>
    </div>
  )
}
