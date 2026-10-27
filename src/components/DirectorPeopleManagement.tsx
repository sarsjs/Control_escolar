import React, { useMemo, useState } from 'react';
import { Orientador, Teacher, Student, SchoolGroup } from '../types';

type PersonTab = 'orientadores' | 'docentes' | 'alumnos';
interface Props {
  orientadores: Orientador[];
  teachers: Teacher[];
  students: Student[];
  groups: SchoolGroup[];
  onSaveOrientador: (input: { id?: string; name: string; email: string; phone: string; cubicle: string }) => Promise<void>;
  onSaveTeacher: (input: { id?: string; name: string; email: string; specialty: string }) => Promise<void>;
  onSaveStudent: (input: { id?: string; name: string; matricula: string; groupId: string }) => Promise<void>;
  onSetRosterActive: (kind: 'orientador' | 'teacher' | 'student', id: string, active: boolean) => Promise<void>;
}

const fieldClass = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
const buttonClass = 'rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50';
const secondaryClass = 'rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50';

export const DirectorPeopleManagement: React.FC<Props> = ({ orientadores, teachers, students, groups, onSaveOrientador, onSaveTeacher, onSaveStudent, onSetRosterActive }) => {
  const [tab, setTab] = useState<PersonTab>('orientadores');
  const [editingId, setEditingId] = useState<string>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [detail, setDetail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const activeGroups = useMemo(() => groups.filter((g) => g.active !== false), [groups]);
  const reset = () => { setEditingId(undefined); setName(''); setEmail(''); setPhone(''); setDetail(''); setMatricula(''); setGroupId(activeGroups[0]?.id || ''); };
  const startEdit = (kind: PersonTab, item: any) => {
    setTab(kind); setEditingId(item.id); setName(item.name || ''); setEmail(item.email || '');
    setPhone(item.phone || ''); setDetail(kind === 'orientadores' ? item.cubicle || '' : kind === 'docentes' ? item.specialty || '' : '');
    setMatricula(item.matricula || ''); setGroupId(item.groupId || activeGroups[0]?.id || ''); setMessage(''); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (!name.trim()) throw new Error('Escribe el nombre completo.');
      if (tab === 'orientadores') await onSaveOrientador({ id: editingId, name, email, phone, cubicle: detail });
      else if (tab === 'docentes') await onSaveTeacher({ id: editingId, name, email, specialty: detail });
      else {
        if (!matricula.trim()) throw new Error('La matrícula es obligatoria.');
        if (!groupId) throw new Error('Primero crea un grupo para inscribir al alumno.');
        await onSaveStudent({ id: editingId, name, matricula, groupId });
      }
      setMessage(editingId ? 'Cambios guardados en la escuela.' : 'Registro guardado en la escuela.');
      reset();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar. Intenta de nuevo.'); }
    finally { setBusy(false); }
  };
  const toggleActive = async (kind: 'orientador' | 'teacher' | 'student', id: string, active: boolean) => {
    setError(''); setMessage('');
    try { await onSetRosterActive(kind, id, active); setMessage(active ? 'Registro reactivado.' : 'Registro desactivado. Se conserva su historial.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.'); }
  };
  const tabButton = (value: PersonTab, label: string, count: number) => (
    <button type="button" onClick={() => { setTab(value); reset(); setError(''); setMessage(''); }}
      className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
      {label} <span className="ml-1 opacity-75">({count})</span>
    </button>
  );
  const roster = tab === 'orientadores' ? orientadores : tab === 'docentes' ? teachers : students;
  return (
    <section className="space-y-5 p-4 sm:p-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">Personal y alumnado</h3>
        <p className="mt-1 text-sm text-slate-500">Altas, edición y baja lógica. Los registros e historiales no se borran físicamente.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabButton('orientadores', 'Orientadores', orientadores.length)}
        {tabButton('docentes', 'Docentes', teachers.length)}
        {tabButton('alumnos', 'Alumnos', students.length)}
      </div>
      {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.4fr)]">
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-slate-800">{editingId ? 'Editar registro' : tab === 'alumnos' ? 'Inscribir alumno' : tab === 'docentes' ? 'Registrar docente' : 'Registrar orientador'}</h4>
            {editingId && <button type="button" className={secondaryClass} onClick={reset}>Cancelar</button>}
          </div>
          <label className="block text-xs font-semibold text-slate-600">Nombre completo<input className={fieldClass + ' mt-1'} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></label>
          {tab !== 'alumnos' && <label className="block text-xs font-semibold text-slate-600">Correo electrónico<input className={fieldClass + ' mt-1'} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} /></label>}
          {tab === 'orientadores' && <><label className="block text-xs font-semibold text-slate-600">Teléfono<input className={fieldClass + ' mt-1'} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} /></label><label className="block text-xs font-semibold text-slate-600">Cubículo / oficina<input className={fieldClass + ' mt-1'} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={80} /></label></>}
          {tab === 'docentes' && <label className="block text-xs font-semibold text-slate-600">Especialidad o materia<input className={fieldClass + ' mt-1'} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={100} /></label>}
          {tab === 'alumnos' && <><label className="block text-xs font-semibold text-slate-600">Matrícula<input className={fieldClass + ' mt-1'} value={matricula} onChange={(e) => setMatricula(e.target.value)} required maxLength={60} /></label><label className="block text-xs font-semibold text-slate-600">Grupo<select className={fieldClass + ' mt-1'} value={groupId} onChange={(e) => setGroupId(e.target.value)} required><option value="">Seleccionar grupo</option>{activeGroups.map((g) => <option key={g.id} value={g.id}>{g.name} · {g.semester}° · {g.turn}</option>)}</select></label></>}
          <button type="submit" className={buttonClass + ' w-full'} disabled={busy}>{busy ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar registro'}</button>
          <p className="text-xs leading-relaxed text-slate-500">Esto registra los datos escolares. No crea por sí solo una cuenta de acceso ni envía contraseñas; ese proceso debe hacerse mediante el servicio seguro de cuentas.</p>
        </form>
        <div className="space-y-2">
          {roster.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Todavía no hay registros en esta sección.</div>}
          {roster.map((raw: any) => {
            const item = raw as Orientador & Teacher & Student;
            const active = item.active !== false;
            const group = groups.find((g) => g.id === item.groupId);
            return <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{item.name}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'ACTIVO' : 'INACTIVO'}</span></div>
                <p className="mt-1 break-words text-xs text-slate-500">{tab === 'alumnos' ? `Matrícula: ${item.matricula || '—'} · Grupo: ${group?.name || 'Sin grupo'}` : [item.email, tab === 'orientadores' ? item.phone : (item as Teacher).specialty].filter(Boolean).join(' · ') || 'Sin datos adicionales'}</p>
              </div>
              <div className="flex shrink-0 gap-2"><button type="button" className={secondaryClass} onClick={() => startEdit(tab, item)}>Editar</button><button type="button" className={secondaryClass} onClick={() => void toggleActive(tab === 'orientadores' ? 'orientador' : tab === 'docentes' ? 'teacher' : 'student', item.id, !active)}>{active ? 'Desactivar' : 'Reactivar'}</button></div>
            </article>;
          })}
        </div>
      </div>
    </section>
  );
};
