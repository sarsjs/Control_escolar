import React, { useState } from 'react';
import {
  Orientador,
  SchoolGroup,
  Student,
  UserAccount,
  AuditLogEntry,
  AttendanceDispute,
  StudentPresenceStatus,
  Teacher,
} from '../types';
import {
  Building2,
  Users,
  Compass,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Plus,
  FileText,
  History,
  Edit3,
  UserCheck,
} from 'lucide-react';

interface DirectorDashboardViewProps {
  director: UserAccount;
  orientadores: Orientador[];
  teachers: Teacher[];
  groups: SchoolGroup[];
  students: Student[];
  auditLogs: AuditLogEntry[];
  disputes: AttendanceDispute[];
  simulatedTime: string;
  onReassignGroupToOrientador: (groupId: string, newOrientadorId: string) => void;
  onAssignTemporarySubstitute: (groupId: string, substituteOrientadorId?: string) => void;
  onCreateNewGroup?: (name: string, semester: number, orientadorId: string) => Promise<void>;
  onDirectorCorrectAttendance: (
    studentId: string,
    newStatus: StudentPresenceStatus,
    reason: string
  ) => void;
  onResolveDispute: (disputeId: string, approved: boolean, notes: string) => void;
}

export const DirectorDashboardView: React.FC<DirectorDashboardViewProps> = ({
  director,
  orientadores,
  teachers,
  groups,
  students,
  auditLogs,
  disputes,
  simulatedTime,
  onReassignGroupToOrientador,
  onAssignTemporarySubstitute,
  onCreateNewGroup,
  onDirectorCorrectAttendance,
  onResolveDispute,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'audit' | 'groups' | 'disputes'>('matrix');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [groupCreateError, setGroupCreateError] = useState<string>('');

  // Modals
  const [isAddGroupOpen, setIsAddGroupOpen] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupSemester, setNewGroupSemester] = useState<number>(1);
  const [newGroupOrientador, setNewGroupOrientador] = useState<string>(orientadores[0]?.id || '');

  // Correction modal
  const [correctingStudent, setCorrectingStudent] = useState<Student | null>(null);
  const [newCorrectedStatus, setNewCorrectedStatus] = useState<StudentPresenceStatus>('in_class');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  const totalStudents = students.length;
  const inClassCount = students.filter((s) => s.currentStatus === 'in_class').length;
  const onCampusOutsideCount = students.filter((s) => s.currentStatus === 'on_campus_not_in_class').length;
  const enRouteCount = students.filter((s) => s.currentStatus === 'en_route_delayed').length;
  const absentCount = students.filter((s) => s.currentStatus === 'outside_school' || s.currentStatus === 'absent').length;

  const handleReassign = (groupId: string, orientadorId: string) => {
    onReassignGroupToOrientador(groupId, orientadorId);
    const grp = groups.find((g) => g.id === groupId);
    const ori = orientadores.find((o) => o.id === orientadorId);
    setSuccessMessage(`Se ha asignado ${grp?.name} permanentemente a ${ori?.name}.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleSubstitute = (groupId: string, substituteId: string) => {
    onAssignTemporarySubstitute(groupId, substituteId === 'none' ? undefined : substituteId);
    const grp = groups.find((g) => g.id === groupId);
    const sub = orientadores.find((o) => o.id === substituteId);
    setSuccessMessage(
      sub
        ? `Sustitución temporal asignada para ${grp?.name} a cargo de ${sub.name}.`
        : `Sustitución temporal finalizada para ${grp?.name}. Retorna al Orientador titular.`
    );
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !onCreateNewGroup) return;
    setGroupCreateError('');
    try {
      await onCreateNewGroup(newGroupName.trim(), newGroupSemester, newGroupOrientador);
      setNewGroupName('');
      setIsAddGroupOpen(false);
      setSuccessMessage('Nuevo grupo guardado correctamente.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error('No se pudo guardar el grupo:', error);
      setGroupCreateError('No se pudo guardar el grupo. Verifica tu conexión y permisos; no se registró como creado.');
    }
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingStudent || !correctionReason.trim()) return;

    onDirectorCorrectAttendance(correctingStudent.id, newCorrectedStatus, correctionReason);
    setSuccessMessage(`Asistencia corregida para ${correctingStudent.name}. Registrado en auditoría.`);
    setCorrectingStudent(null);
    setCorrectionReason('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Director Authority */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={director.avatar}
            alt={director.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                Máxima Autoridad Escolar
              </span>
              <span className="text-xs font-mono text-slate-400 tabular-nums">· Hora {simulatedTime}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{director.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dirección General · Supervisión de {orientadores.length} Orientadores, {teachers.length} Docentes y {groups.length} Grupos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCreateNewGroup && (
            <button
              type="button"
              onClick={() => setIsAddGroupOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Grupo</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {groupCreateError && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 font-medium">
          {groupCreateError}
        </div>
      )}

      {/* KPI Stats of School */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Población Total</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500">estudiantes</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{groups.length} grupos registrados</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
          <span className="text-xs font-semibold text-emerald-800">Presentes en Salón</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-700">{inClassCount}</span>
            <span className="text-xs text-emerald-600">acreditados</span>
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">Validaron BLE / PIN</span>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
          <span className="text-xs font-semibold text-amber-900">En Campus Fuera de Aula</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-amber-600">{onCampusOutsideCount}</span>
            <span className="text-xs text-amber-800 font-semibold">deambulando</span>
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block">En pasillos durante clase</span>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
          <span className="text-xs font-semibold text-blue-900">En Camino (Con Aviso ETA)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-blue-700">{enRouteCount}</span>
            <span className="text-xs text-blue-800">demorados</span>
          </div>
          <span className="text-[11px] text-blue-700 mt-1 block">No faltarán · Vienen demorados</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 px-6 flex items-center justify-between gap-4 overflow-x-auto bg-slate-50/70">
          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriz de Asignación y Sustituciones
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'groups' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Supervisión y Corrección de Asistencias
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bitácora de Auditoría Inmutable ({auditLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('disputes')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'disputes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revisiones Cuestionadas ({disputes.length})
            </button>
          </div>
        </div>

        {/* TAB 1: MATRIZ DE REPARTO Y SUSTITUCIONES */}
        {activeTab === 'matrix' && (
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Reparto Institucional de Grupos y Sustituciones Temporales
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                El Director es la máxima autoridad y decide qué orientador tutela cada grupo, así como la asignación temporal de sustitutos cuando un orientador se encuentre indispuesto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {orientadores.map((ori) => {
                const assigned = groups.filter((g) => g.orientadorId === ori.id);
                const substitutes = groups.filter((g) => g.temporarySubstituteOrientadorId === ori.id);

                return (
                  <div
                    key={ori.id}
                    className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={ori.avatar}
                            alt={ori.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{ori.name}</h4>
                            <p className="text-[11px] text-slate-500">{ori.cubicle}</p>
                            <p className="text-[10px] font-mono text-indigo-600">{ori.email}</p>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800">
                          {assigned.length} Titulares
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Grupos Titulares:
                        </span>
                        {assigned.map((g) => (
                          <div
                            key={g.id}
                            className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{g.name}</span>
                              <span className="text-[10px] text-slate-500">
                                {g.studentIds.length} alumnos
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                              <div>
                                <label className="text-[10px] text-slate-400 block">Titular:</label>
                                <select
                                  value={g.orientadorId}
                                  onChange={(e) => handleReassign(g.id, e.target.value)}
                                  className="w-full text-[11px] font-semibold bg-slate-100 border border-slate-300 rounded-lg px-2 py-1"
                                >
                                  {orientadores.map((o) => (
                                    <option key={o.id} value={o.id}>
                                      {o.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] text-amber-700 block font-semibold">
                                  Sustituto Temporal:
                                </label>
                                <select
                                  value={g.temporarySubstituteOrientadorId || 'none'}
                                  onChange={(e) => handleSubstitute(g.id, e.target.value)}
                                  className="w-full text-[11px] font-semibold bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-amber-900"
                                >
                                  <option value="none">Sin sustituto (Titular activo)</option>
                                  {orientadores
                                    .filter((o) => o.id !== g.orientadorId)
                                    .map((o) => (
                                      <option key={o.id} value={o.id}>
                                        {o.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}

                        {substitutes.length > 0 && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                            <span className="font-bold block">Sustituciones Activas:</span>
                            {substitutes.map((s) => s.name).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SUPERVISIÓN Y CORRECCIÓN DE ASISTENCIAS */}
        {activeTab === 'groups' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Supervisión y Corrección de Asistencias Institucionales
                </h3>
                <p className="text-xs text-slate-500">
                  El Director puede auditar y corregir la asistencia de cualquier alumno. Toda modificación genera un registro inmutable.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Alumno</th>
                    <th className="py-3 px-4">Grupo</th>
                    <th className="py-3 px-4">Orientador Responsable</th>
                    <th className="py-3 px-4">Estado Actual</th>
                    <th className="py-3 px-4">Ubicación / Validado</th>
                    <th className="py-3 px-4 text-right">Acción de Director</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => {
                    const grp = groups.find((g) => g.id === st.groupId);
                    const ori = orientadores.find((o) => o.id === grp?.orientadorId);

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={st.avatar}
                              alt={st.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{st.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{st.matricula}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{grp?.name}</td>
                        <td className="py-3 px-4 text-slate-600">{ori?.name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.currentStatus === 'in_class'
                                ? 'bg-emerald-100 text-emerald-800'
                                : st.currentStatus === 'on_campus_not_in_class'
                                ? 'bg-amber-100 text-amber-900'
                                : st.currentStatus === 'en_route_delayed'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {st.currentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {st.currentZone}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setCorrectingStudent(st);
                              setNewCorrectedStatus(st.currentStatus === 'in_class' ? 'absent' : 'in_class');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Corregir</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BITÁCORA DE AUDITORÍA INMUTABLE */}
        {activeTab === 'audit' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Registro Inmutable de Auditoría de Asistencias
                </h3>
                <p className="text-xs text-slate-500">
                  Historial de todas las correcciones y modificaciones realizadas por profesores, orientadores o dirección.
                </p>
              </div>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No hay correcciones de asistencia registradas hoy.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Fecha y Hora</th>
                      <th className="py-3 px-4">Alumno</th>
                      <th className="py-3 px-4">Materia / Grupo</th>
                      <th className="py-3 px-4">Cambio de Estado</th>
                      <th className="py-3 px-4">Autor de Modificación</th>
                      <th className="py-3 px-4">Motivo / Justificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{log.studentName}</td>
                        <td className="py-3 px-4 text-slate-700">{log.subjectName}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] text-slate-500">{log.previousStatus}</span>
                          <span className="mx-1 text-slate-400">→</span>
                          <span className="font-mono text-[11px] font-bold text-emerald-700">{log.newStatus}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{log.modifiedBy}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">({log.modifiedByRole.toUpperCase()})</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 italic max-w-xs">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REVISIONES CUESTIONADAS */}
        {activeTab === 'disputes' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Solicitudes de Revisión de Asistencia Cuestionada
            </h3>
            <p className="text-xs text-slate-500">
              Casos donde el alumno reporta haber estado presente pese a fallas técnicas o falta de detección de señal.
            </p>

            {disputes.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No hay solicitudes de revisión pendientes.
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((disp) => (
                  <div
                    key={disp.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{disp.studentName}</span>
                        <span className="text-xs text-slate-500 font-mono">({disp.date})</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            disp.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : disp.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {disp.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 font-semibold">{disp.subjectName}</p>
                      <p className="text-xs text-slate-600 mt-0.5 italic">"{disp.studentReason}"</p>
                    </div>

                    {disp.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onResolveDispute(disp.id, false, 'No se constató evidencia')}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl"
                        >
                          Rechazar
                        </button>
                        <button
                          type="button"
                          onClick={() => onResolveDispute(disp.id, true, 'Aprobado por Dirección tras revisión')}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                        >
                          Aprobar y Corregir
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Corrección de Asistencia */}
      {correctingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Corrección Oficial de Asistencia
            </h3>
            <p className="text-xs text-slate-500">
              Alumno: <strong className="text-slate-800">{correctingStudent.name}</strong> ({correctingStudent.matricula})
            </p>

            <form onSubmit={handleSaveCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nuevo Estado de Asistencia
                </label>
                <select
                  value={newCorrectedStatus}
                  onChange={(e) => setNewCorrectedStatus(e.target.value as StudentPresenceStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  <option value="in_class">in_class (Presente en Aula)</option>
                  <option value="on_campus_not_in_class">on_campus_not_in_class (En Campus sin Salón)</option>
                  <option value="en_route_delayed">en_route_delayed (En Camino con ETA)</option>
                  <option value="absent">absent (Ausencia Justificada/Definitiva)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo de la Corrección (Obligatorio para Auditoría)
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Ej. Se constató presencia física mediante lista firmada..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectingStudent(null)}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!correctionReason.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  Guardar Corrección en Auditoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nuevo Grupo */}
      {isAddGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Crear y Asignar Nuevo Grupo</h3>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Grupo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 5º Semestre · Grupo A"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Semestre</label>
                <select
                  value={newGroupSemester}
                  onChange={(e) => setNewGroupSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <option key={s} value={s}>
                      {s}º Semestre
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Orientador Responsable</label>
                <select
                  value={newGroupOrientador}
                  onChange={(e) => setNewGroupOrientador(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {orientadores.map((ori) => (
                    <option key={ori.id} value={ori.id}>
                      {ori.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGroupOpen(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                >
                  Crear Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
