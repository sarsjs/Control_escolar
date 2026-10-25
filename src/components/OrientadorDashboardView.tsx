import React, { useState } from 'react';
import {
  Orientador,
  SchoolGroup,
  Student,
  GroupScheduleItem,
  Teacher,
  AttendanceDispute,
  StudentPresenceStatus,
} from '../types';
import {
  Compass,
  Calendar,
  Users,
  Clock,
  Plus,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  Trash2,
  FileSpreadsheet,
  Upload,
  ShieldAlert,
  FileQuestion,
} from 'lucide-react';
import { CampusMap } from './CampusMap';

interface OrientadorDashboardViewProps {
  orientador: Orientador;
  allGroups: SchoolGroup[];
  allStudents: Student[];
  allTeachers: Teacher[];
  disputes: AttendanceDispute[];
  simulatedTime: string;
  onCreateGroup: (name: string, semester: number, turn: 'Matutino' | 'Vespertino') => void;
  onUpdateGroupSchedule: (groupId: string, newSchedule: GroupScheduleItem[]) => void;
  onAddStudentToGroup: (groupId: string, studentName: string, matricula: string) => void;
  onImportStudentsCsv: (groupId: string, csvData: { name: string; matricula: string }[]) => void;
  onSendAlertToStudent: (studentId: string, studentName: string) => void;
  onResolveDispute: (disputeId: string, approved: boolean, notes: string) => void;
}

export const OrientadorDashboardView: React.FC<OrientadorDashboardViewProps> = ({
  orientador,
  allGroups,
  allStudents,
  allTeachers,
  disputes,
  simulatedTime,
  onCreateGroup,
  onUpdateGroupSchedule,
  onAddStudentToGroup,
  onImportStudentsCsv,
  onSendAlertToStudent,
  onResolveDispute,
}) => {
  // Only groups assigned to this orientador (or where they are substitute)
  const myGroups = allGroups.filter(
    (g) => g.orientadorId === orientador.id || g.temporarySubstituteOrientadorId === orientador.id
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    myGroups[0]?.id || allGroups[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'attendance' | 'schedule' | 'students' | 'disputes' | 'map'>('attendance');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupSemester, setNewGroupSemester] = useState('1');
  const [newGroupLetter, setNewGroupLetter] = useState('A');
  const [newGroupTurn, setNewGroupTurn] = useState<'Matutino' | 'Vespertino'>('Matutino');

  // Modals
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState<boolean>(false);
  const [subjectName, setSubjectName] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [toleranceMinutes, setToleranceMinutes] = useState<number>(10);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(allTeachers[0]?.id || '');
  const [classroom, setClassroom] = useState<string>('');

  // Add student
  const [isAddStudentOpen, setIsAddStudentOpen] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentMatricula, setNewStudentMatricula] = useState<string>('');

  // CSV import
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [csvSuccessMessage, setCsvSuccessMessage] = useState<string>('');

  const currentGroup = myGroups.find((g) => g.id === selectedGroupId) || myGroups[0];

  const handleCreateGroup = (event: React.FormEvent) => {
    event.preventDefault();
    const semester = Number(newGroupSemester);
    if (!Number.isInteger(semester) || semester < 1 || semester > 12 || !newGroupLetter.trim()) return;
    onCreateGroup(`${semester}º Semestre · Grupo ${newGroupLetter.trim().toUpperCase()}`, semester, newGroupTurn);
    setIsCreateGroupOpen(false);
    setNewGroupLetter('A');
  };
  const groupStudents = allStudents.filter((s) => s.groupId === currentGroup?.id);

  const myStudents = allStudents.filter((s) =>
    myGroups.some((g) => g.id === s.groupId)
  );
  const delayedStudents = myStudents.filter((s) => s.currentStatus === 'en_route_delayed');
  const roamingStudents = myStudents.filter((s) => s.currentStatus === 'on_campus_not_in_class');
  const inClassStudents = myStudents.filter((s) => s.currentStatus === 'in_class');

  // Filter disputes belonging to my groups
  const myDisputes = disputes.filter((d) =>
    myGroups.some((g) => g.id === d.groupId)
  );

  const handleAddSchedulePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup || !subjectName.trim()) return;

    const teacher = allTeachers.find((t) => t.id === selectedTeacherId) || allTeachers[0];
    const newPeriod: GroupScheduleItem = {
      id: `sch-${Date.now()}`,
      dayOfWeek: 'Lunes a Viernes',
      startTime,
      endTime,
      toleranceMinutes,
      subjectName,
      subjectCode: subjectName.slice(0, 3).toUpperCase() + '-101',
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherAvatar: teacher.avatar,
      classroom,
      building: classroom.includes('Lab') ? 'Edificio Ciencias' : 'Edificio A',
      currentPin: Math.floor(1000 + Math.random() * 9000).toString(),
      beaconUuid: `e2c56db5-dffb-48d2-b060-${Math.random().toString(36).slice(2, 10)}`,
      color: '#4f46e5',
    };

    const updated = [...currentGroup.schedule, newPeriod];
    onUpdateGroupSchedule(currentGroup.id, updated);
    setIsAddPeriodOpen(false);
    setSubjectName('');
  };

  const handleDeleteSchedulePeriod = (periodId: string) => {
    if (!currentGroup) return;
    const updated = currentGroup.schedule.filter((p) => p.id !== periodId);
    onUpdateGroupSchedule(currentGroup.id, updated);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup || !newStudentName.trim() || !newStudentMatricula.trim()) return;
    onAddStudentToGroup(currentGroup.id, newStudentName, newStudentMatricula);
    setNewStudentName('');
    setNewStudentMatricula('');
    setIsAddStudentOpen(false);
  };

  const handleProcessCsvImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup || !csvRawText.trim()) return;

    const lines = csvRawText.trim().split('\n');
    const parsed: { name: string; matricula: string }[] = [];

    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        parsed.push({
          name: parts[0].trim(),
          matricula: parts[1].trim(),
        });
      }
    }

    if (parsed.length > 0) {
      onImportStudentsCsv(currentGroup.id, parsed);
      setCsvSuccessMessage(`Se importaron ${parsed.length} alumnos con éxito.`);
      setTimeout(() => {
        setCsvSuccessMessage('');
        setIsCsvModalOpen(false);
      }, 1500);
    }
  };

  return (
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={handleCreateGroup} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Crear grupo escolar</h2>
              <p className="mt-1 text-sm text-slate-600">El grupo se guardará sin alumnos ni horario; esos datos se agregan después.</p>
            </div>
            <label className="block text-sm font-medium text-slate-700">Semestre
              <select required value={newGroupSemester} onChange={(e) => setNewGroupSemester(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((semester) => <option key={semester} value={semester}>{semester}º semestre</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">Letra del grupo
              <input required maxLength={5} value={newGroupLetter} onChange={(e) => setNewGroupLetter(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" placeholder="A" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Turno
              <select value={newGroupTurn} onChange={(e) => setNewGroupTurn(e.target.value as 'Matutino' | 'Vespertino')} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5">
                <option value="Matutino">Matutino</option><option value="Vespertino">Vespertino</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsCreateGroupOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Crear grupo</button>
            </div>
          </form>
        </div>
      )}
    <div className="space-y-6">
      {/* Top Banner: Orientador Identity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={orientador.avatar}
            alt={orientador.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-100 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md">
                Orientación Educativa
              </span>
              <span className="text-xs font-mono text-slate-400 tabular-nums">· Hora {simulatedTime}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{orientador.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {orientador.cubicle} · A cargo de {myGroups.length} grupos ({myGroups.map((g) => g.name).join(', ')})
            </p>
          </div>
        </div>

        {/* Group Selector Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-semibold">Grupo activo:</span>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setIsCreateGroupOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              <Plus size={16} /> Crear grupo
            </button>
            <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden"
          >
            {myGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.studentIds.length} alumnos)
              </option>
            ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scoped Alerts Bar for this Orientador */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-900">Avisos de Demora (ETA)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-blue-700">{delayedStudents.length}</span>
              <span className="text-xs text-blue-800">alumnos en camino</span>
            </div>
            <span className="text-[11px] text-blue-600 mt-0.5 block">Notificados a tu orientación</span>
          </div>
          <Clock className="w-8 h-8 text-blue-400" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-900">En Campus Fuera de Aula</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-amber-600">{roamingStudents.length}</span>
              <span className="text-xs text-amber-800 font-semibold">deambulando</span>
            </div>
            <span className="text-[11px] text-amber-700 mt-0.5 block">En tus grupos asignados</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-900">En Aula Activa</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-700">{inClassStudents.length}</span>
              <span className="text-xs text-emerald-800">asistencias</span>
            </div>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">BLE / PIN validado</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 px-6 flex items-center justify-between gap-4 overflow-x-auto bg-slate-50/70">
          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Control de Asistencia del Grupo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'schedule' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diseñador de Horario Escolar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'students' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Padrón de Alumnos ({groupStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('disputes')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'disputes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revisiones Cuestionadas ({myDisputes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mapa Georreferenciado
            </button>
          </div>
        </div>

        {/* TAB 1: ASISTENCIA */}
        {activeTab === 'attendance' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Monitoreo de Asistencia y Alertas: {currentGroup?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Los reportes de llegada en camino (ETA) y deambulación en pasillos se canalizan exclusivamente aquí.
                </p>
              </div>
            </div>

            {/* Roaming Alert Banner */}
            {roamingStudents.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Alumnos en el plantel pero fuera del aula en horario lectivo:</span>
                </div>
                <div className="space-y-1">
                  {roamingStudents.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between bg-white/80 p-2.5 rounded-lg border border-amber-200"
                    >
                      <span className="font-semibold text-slate-900">
                        {st.name} — Ubicación detectada: {st.currentZone}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSendAlertToStudent(st.id, st.name)}
                        className="text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-md transition-colors"
                      >
                        Enviar Alerta al Teléfono
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Alumno</th>
                    <th className="py-3 px-4">Matrícula</th>
                    <th className="py-3 px-4">Estado Actual</th>
                    <th className="py-3 px-4">Ubicación GPS</th>
                    <th className="py-3 px-4">Reporte ETA a Orientación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupStudents.map((st) => {
                    const isInClass = st.currentStatus === 'in_class';
                    const isOnCampus = st.currentStatus === 'on_campus_not_in_class';
                    const isDelayed = st.currentStatus === 'en_route_delayed';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={st.avatar}
                              alt={st.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <span className="font-bold text-slate-900">{st.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{st.matricula}</td>
                        <td className="py-3 px-4">
                          {isInClass && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" /> En Aula ({st.validatedVia?.toUpperCase()})
                            </span>
                          )}
                          {isOnCampus && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> En Campus (Sin Entrar)
                            </span>
                          )}
                          {isDelayed && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-900">
                              <Clock className="w-3.5 h-3.5" /> En Camino (~{st.etaMinutes}m)
                            </span>
                          )}
                          {!isInClass && !isOnCampus && !isDelayed && (
                            <span className="text-slate-400">Fuera del plantel</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{st.currentZone}</td>
                        <td className="py-3 px-4">
                          {isDelayed ? (
                            <div className="text-[11px]">
                              <strong className="text-blue-900 font-mono">
                                ETA ~{st.etaMinutes}m ({st.etaSentAt || 'Reciente'})
                              </strong>
                              <span className="text-slate-500 block">{st.etaReason || 'Tráfico'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Sin reporte</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DISEÑADOR DE HORARIO */}
        {activeTab === 'schedule' && (
          <div className="p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Horario Escolar Oficial: {currentGroup?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Como Orientador, configuras las materias, docentes, salones y tiempo de tolerancia oficial.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddPeriodOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Materia al Horario</span>
              </button>
            </div>

            {isAddPeriodOpen && (
              <div className="p-5 bg-slate-50 border border-slate-300 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Programar Nueva Materia en el Horario
                </h4>
                <form onSubmit={handleAddSchedulePeriod} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Nombre de la Materia</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Biología I"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Docente Asignado</label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    >
                      {allTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Salón / Laboratorio</label>
                    <input
                      type="text"
                      required
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <label className="block text-slate-700 font-semibold mb-1">Inicio</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-slate-700 font-semibold mb-1">Fin</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tolerancia (min)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={toleranceMinutes}
                      onChange={(e) => setToleranceMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddPeriodOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                    >
                      Guardar en el Horario
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {currentGroup?.schedule.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-center font-mono text-xs">
                      <span className="font-bold text-slate-900 block">{item.startTime}</span>
                      <span className="text-[10px] text-slate-400">{item.endTime}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{item.subjectName}</h4>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                          {item.subjectCode}
                        </span>
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-sm font-mono">
                          Tol: {item.toleranceMinutes || 10}m
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Docente: <strong className="text-slate-800">{item.teacherName}</strong> · Aula: <strong className="text-indigo-700">{item.classroom}</strong> ({item.building})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">PIN: {item.currentPin}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedulePeriod(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Eliminar materia del horario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PADRÓN DE ALUMNOS E IMPORTACIÓN CSV */}
        {activeTab === 'students' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Padrón de Alumnos Matriculados: {currentGroup?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Registra alumnos individualmente o importa masivamente mediante archivo CSV / Excel.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Importar CSV / Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Inscribir Individual</span>
                </button>
              </div>
            </div>

            {/* Modal: Importar CSV */}
            {isCsvModalOpen && (
              <div className="p-5 bg-slate-50 border border-slate-300 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    Importación Masiva de Alumnos (CSV / Excel)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cerrar
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Pega o escribe las líneas en formato: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Nombre Completo,Matricula</code> (una fila por alumno):
                </p>

                <form onSubmit={handleProcessCsvImport} className="space-y-3">
                  <textarea
                    rows={4}
                    value={csvRawText}
                    onChange={(e) => setCsvRawText(e.target.value)}
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-white"
                  />
                  {csvSuccessMessage && (
                    <span className="text-xs text-emerald-600 font-bold block">{csvSuccessMessage}</span>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCsvModalOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                    >
                      Procesar e Inscribir Alumnos
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal: Agregar Alumno Individual */}
            {isAddStudentOpen && (
              <div className="p-5 bg-slate-50 border border-slate-300 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Matricular Alumno en {currentGroup?.name}
                </h4>
                <form onSubmit={handleCreateStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Nombre Completo del Alumno</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Emiliano Vargas Sánchez"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Matrícula Escolar</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. 2026-B-0910"
                      value={newStudentMatricula}
                      onChange={(e) => setNewStudentMatricula(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddStudentOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                    >
                      Guardar Alumno
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Students List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupStudents.map((st) => (
                <div
                  key={st.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3 shadow-2xs"
                >
                  <img
                    src={st.avatar}
                    alt={st.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{st.name}</h5>
                    <span className="text-[11px] font-mono text-slate-500 block">{st.matricula}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{st.currentZone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REVISIONES CUESTIONADAS */}
        {activeTab === 'disputes' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Solicitudes de Revisión de tus Alumnos ({myDisputes.length})
            </h3>
            <p className="text-xs text-slate-500">
              Casos donde un estudiante de tus grupos solicita corrección de falta con justificación.
            </p>

            {myDisputes.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No hay solicitudes de revisión pendientes en tus grupos.
              </div>
            ) : (
              <div className="space-y-3">
                {myDisputes.map((disp) => (
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
                          onClick={() => onResolveDispute(disp.id, false, 'Rechazada por Orientación')}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl"
                        >
                          Rechazar
                        </button>
                        <button
                          type="button"
                          onClick={() => onResolveDispute(disp.id, true, 'Justificación aceptada por Orientación')}
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

        {/* TAB 5: MAPA */}
        {activeTab === 'map' && (
          <div className="p-6">
            <CampusMap
              students={groupStudents}
              currentStudentId={groupStudents[0]?.id || ''}
            />
          </div>
        )}
      </div>
    </div>
  );
};
