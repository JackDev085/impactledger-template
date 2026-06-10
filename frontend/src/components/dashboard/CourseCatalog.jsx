import { Plus } from 'lucide-react'

export default function CourseCatalog({
  courses,
  courseForm,
  setCourseForm,
  handleRegisterCourse,
  loading
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Cadastrar Novo Curso</h2>
        <form onSubmit={handleRegisterCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Título do Curso</label>
            <input
              type="text"
              required
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              placeholder="ex: Mestrado em Administração de Empresas"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Carga Horária (Horas)</label>
            <input
              type="number"
              required
              value={courseForm.workload}
              onChange={(e) => setCourseForm({ ...courseForm, workload: e.target.value })}
              placeholder="ex: 60"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Descrição</label>
            <textarea
              rows="2"
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              placeholder="Breve ementa ou requisitos do curso..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="h-4.5 w-4.5" />
              )}
              Adicionar Curso
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Cursos Ofertados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase block w-fit mb-2">
                  {course.workloadHours} Horas
                </span>
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{course.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{course.description || 'Nenhuma descrição disponível.'}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>ID: #{course.id}</span>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="sm:col-span-2 py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-sm">
              Nenhum curso cadastrado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
