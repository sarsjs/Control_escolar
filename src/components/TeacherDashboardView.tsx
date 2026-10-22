import React, { useState } from 'react';
import { Student, SchoolGroup, GroupScheduleItem, UserAccount } from '../types';
import {
  KeyRound,
  Radio,
  QrCode,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  BellRing,
  Maximize2,
  Minimize2,
  Send,
  ShieldAlert,
} from 'lucide-react';

interface TeacherDashboardViewProps {
  teacher: UserAccount;
  activeGroup: SchoolGroup;
  allTeacherGroups: SchoolGroup[];
  students: Student[];
  onSelectGroup: (group: SchoolGroup) => void;
  onRegeneratePin: () => void;
  onSendStudentAlert: (studentId: string, studentName: string) => void;
  onManualValidateStudent: (studentId: string) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  teacher,
  activeGroup,
  allTeacherGroups,
  students,
  onSelectGroup,
  onRegeneratePin,
  onSendStudentAlert,
  onManualValidateStudent,
}) => {
  const [projectorMode, setProjectorMode] = useState<boolean>(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'in_class' | 'on_campus' | 'delayed' | 'absent'>('all');
  const [isBleScannerActive, setIsBleScannerActive] = useState<boolean>(true);
  const [detectedCount, setDetectedCount] = useState<number>(3);

  // Find active subject for this teacher in this group
  const activeClass =
    activeGroup.schedule.find(
      (s) => s.teacherId === teacher.linkedEntityId || s.teacherName.includes('Roberto')
    ) || activeGroup.schedule[0];

  // STRICT REQUIREMENT: Only students belonging to this group!
  const groupStudents = students.filter((s) => s.groupId === activeGroup.id);

  const inClassStudents = groupStudents.filter((s) => s.currentStatus === 'in_class');
  const onCampusOutsideStudents = groupStudents.filter((s) => s.currentStatus === 'on_campus_not_in_class');
  const delayedStudents = groupStudents.filter((s) => s.currentStatus === 'en_route_delayed');
  const outsideStudents = groupStudents.filter((s) => s.currentStatus === 'outside_school' || s.currentStatus === 'absent');

  const filteredStudents = groupStudents.filter((s) => {
    if (activeTabFilter === 'in_class') return s.currentStatus === 'in_class';
    if (activeTabFilter === 'on_campus') return s.currentStatus === 'on_campus_not_in_class';
    if (activeTabFilter === 'delayed') return s.currentStatus === 'en_route_delayed';
    if (activeTabFilter === 'absent') return s.currentStatus === 'outside_school' || s.currentStatus === 'absent';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Teacher & Active Class Context */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={teacher.avatar}
            alt={teacher.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                Sesión Activa con {activeGroup.name}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeClass?.startTime} - {activeClass?.endTime}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{activeClass?.subjectName || 'Matemáticas'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Docente: <strong className="text-slate-800">{teacher.name}</strong> · Salón:{' '}
              <strong className="text-indigo-700">{activeClass?.classroom}</strong> ({activeClass?.building})
            </p>
          </div>
        </div>

        {/* Group Selector (if teacher teaches multiple groups) */}
        <div className="flex items-center gap-4">
          {allTeacherGroups.length > 1 && (
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-semibold">Grupo Actual:</span>
              <select
                value={activeGroup.id}
                onChange={(e) => {
                  const grp = allTeacherGroups.find((g) => g.id === e.target.value);
                  if (grp) onSelectGroup(grp);
                }}
                className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
              >
                {allTeacherGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PIN Projector Box for the Whiteboard */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex items-center gap-4 border border-slate-800">
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block">
                Código PIN de Aula
              </span>
              <span className="text-3xl font-black font-mono tracking-widest text-emerald-400">
                {activeClass?.currentPin || '7392'}
              </span>
            </div>

            <div className="flex flex-col gap-1 border-l border-slate-700 pl-3">
              <button
                type="button"
                onClick={onRegeneratePin}
                title="Generar nuevo PIN aleatorio"
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setProjectorMode(!projectorMode)}
                title="Modo Proyector para Pantalla Completa"
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                {projectorMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notice of Scoped Notifications */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 flex items-center justify-between">
        <span>
          🔒 <strong>Acceso Delimitado por Materia:</strong> Como docente de <strong>{activeGroup.name}</strong>, únicamente recibes notificaciones y avisos de llegada (ETA) de los alumnos de este grupo.
        </span>
        <span className="font-mono text-slate-400 text-[11px]">{groupStudents.length} alumnos en lista</span>
      </div>

      {/* Projector Full-Width Callout */}
      {projectorMode && (
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 shadow-2xl border border-indigo-500/30 text-center space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-300">
            {activeClass?.subjectName} · {activeClass?.classroom} · {activeGroup.name}
          </span>
          <h3 className="text-2xl font-bold">Ingresa este código en tu aplicación para registrar asistencia:</h3>
          <div className="inline-block px-10 py-4 bg-black/60 rounded-3xl border-2 border-emerald-400/50 shadow-inner">
            <span className="text-6xl font-black font-mono tracking-widest text-emerald-400">
              {activeClass?.currentPin}
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            O acércate con el Bluetooth activado para sincronización automática con la baliza de este salón.
          </p>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: En Aula */}
        <div
          onClick={() => setActiveTabFilter('in_class')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTabFilter === 'in_class'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Presentes en Aula</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{inClassStudents.length}</span>
            <span className="text-xs text-slate-500">de {groupStudents.length} alumnos</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Validaron PIN / Bluetooth</span>
        </div>

        {/* KPI 2: En Campus Fuera de Aula */}
        <div
          onClick={() => setActiveTabFilter('on_campus')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTabFilter === 'on_campus'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">En Campus (Sin Entrar)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-600">{onCampusOutsideStudents.length}</span>
            <span className="text-xs text-amber-800 font-semibold">¡En pasillos!</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Están en la escuela pero no en clase</span>
        </div>

        {/* KPI 3: En Camino con ETA */}
        <div
          onClick={() => setActiveTabFilter('delayed')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTabFilter === 'delayed'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">En Camino (Con ETA)</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-blue-600">{delayedStudents.length}</span>
            <span className="text-xs text-slate-500">avisaron retraso</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">No faltarán · Vienen demorados</span>
        </div>

        {/* KPI 4: Sin Reporte */}
        <div
          onClick={() => setActiveTabFilter('absent')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTabFilter === 'absent'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Sin Reporte / Ausente</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-slate-700">{outsideStudents.length}</span>
            <span className="text-xs text-slate-500">sin notificar</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Fuera del radio escolar</span>
        </div>
      </div>

      {/* TEACHER PHONE BLE CAPTATOR / RADAR SYSTEM */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 border-b border-indigo-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-md text-white">
                <Radio className={`w-6 h-6 ${isBleScannerActive ? 'animate-pulse' : ''}`} />
              </div>
              {isBleScannerActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {isBleScannerActive ? 'Receptor BLE Activo' : 'Receptor BLE Pausado'}
                </span>
                <span className="text-xs text-indigo-300 font-mono">
                  Teléfono de {teacher.name.split(' ')[0]} {teacher.name.split(' ')[1]}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Radar de Aula: Tu Teléfono Capta las Señales de los Alumnos
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Al llegar los alumnos al salón ({activeClass?.classroom}), tu dispositivo capta su señal Bluetooth de forma automática sin necesidad de instalar balizas fijas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsBleScannerActive(!isBleScannerActive)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                isBleScannerActive
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold'
              }`}
            >
              {isBleScannerActive ? 'Pausar Captador' : 'Activar Captador BLE'}
            </button>
          </div>
        </div>

        {/* Live Detected Signals Strip */}
        {isBleScannerActive ? (
          <div className="mt-5 space-y-4 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-200 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Alumnos detectados por proximidad en el salón:
              </span>
              <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Radio activo: ~8 metros en {activeClass?.classroom}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Detected Student 1 */}
              <div className="bg-slate-800/80 border border-indigo-500/20 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
                      alt="Carlos"
                      className="w-9 h-9 rounded-xl object-cover border border-emerald-400/50"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Carlos Méndez</p>
                    <p className="text-[10px] font-mono text-emerald-400">Distancia: ~1.4 m (-54 dBm)</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  En Aula
                </span>
              </div>

              {/* Detected Student 2 */}
              <div className="bg-slate-800/80 border border-indigo-500/20 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
                      alt="Valentina"
                      className="w-9 h-9 rounded-xl object-cover border border-emerald-400/50"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Valentina Ríos</p>
                    <p className="text-[10px] font-mono text-emerald-400">Distancia: ~2.1 m (-61 dBm)</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  En Aula
                </span>
              </div>

              {/* Approaching student detected */}
              <div className="bg-indigo-950/60 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                      alt="Mateo"
                      className="w-9 h-9 rounded-xl object-cover border border-amber-400/50"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-slate-900 animate-pulse"></span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Mateo Fernández</p>
                    <p className="text-[10px] font-mono text-amber-300">En la puerta (~4.2 m, -72 dBm)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onManualValidateStudent('stu-mateo')}
                  className="px-2.5 py-1 text-[10px] font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg transition-colors"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400">
            Captador Bluetooth pausado. Los alumnos aún pueden usar el PIN o QR proyectado en el pizarrón.
          </div>
        )}
      </div>

      {/* SPECIAL CALLOUT FOR STUDENTS ON CAMPUS BUT NOT IN CLASS */}
      {onCampusOutsideStudents.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
            <h4 className="text-sm font-bold text-amber-950">
              Atención Docente: {onCampusOutsideStudents.length} alumno(s) de tu grupo {activeGroup.name} detectado(s) dentro de la escuela pero ausente(s) en tu salón ({activeClass?.classroom})
            </h4>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            El sistema confirma que estos estudiantes ya entraron al plantel, pero no han ingresado el código PIN de tu clase ni se detectan con la baliza Bluetooth del salón.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {onCampusOutsideStudents.map((st) => (
              <div
                key={st.id}
                className="bg-white rounded-xl p-3 border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={st.avatar}
                    alt={st.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{st.name}</h5>
                    <p className="text-[11px] text-amber-800 font-medium truncate">
                      Ubicación: {st.currentZone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSendStudentAlert(st.id, st.name)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  >
                    <BellRing className="w-3 h-3" />
                    <span>Llamar al Aula</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onManualValidateStudent(st.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                  >
                    Marcar Presente
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER BUTTONS & LIST OF ROSTER */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Lista de Asistencia en Tiempo Real</h3>
            <span className="text-xs font-mono text-slate-500">· {activeGroup.name}</span>
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTabFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTabFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({groupStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('in_class')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTabFilter === 'in_class'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En Aula ({inClassStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('on_campus')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTabFilter === 'on_campus'
                  ? 'bg-white text-amber-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En Campus / Sin Aula ({onCampusOutsideStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('delayed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTabFilter === 'delayed'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Con Aviso ETA ({delayedStudents.length})
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Alumno</th>
                <th className="py-3 px-4">Matrícula</th>
                <th className="py-3 px-4">Estado de Asistencia</th>
                <th className="py-3 px-4">Ubicación Georreferenciada</th>
                <th className="py-3 px-4">Detalle / Reporte ETA</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => {
                const isInClass = st.currentStatus === 'in_class';
                const isOnCampusOutside = st.currentStatus === 'on_campus_not_in_class';
                const isDelayed = st.currentStatus === 'en_route_delayed';
                const isOutside = st.currentStatus === 'outside_school';

                return (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Alumno */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.avatar}
                          alt={st.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{st.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{activeGroup.name}</span>
                        </div>
                      </div>
                    </td>

                    {/* Matrícula */}
                    <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                      {st.matricula}
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4">
                      {isInClass && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Presente en Aula</span>
                        </span>
                      )}
                      {isOnCampusOutside && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>En Plantel (Fuera de Aula)</span>
                        </span>
                      )}
                      {isDelayed && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>En Camino (ETA Notificado)</span>
                        </span>
                      )}
                      {isOutside && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                          <span>Sin Registro de Llegada</span>
                        </span>
                      )}
                    </td>

                    {/* Ubicación */}
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-medium">{st.currentZone}</span>
                    </td>

                    {/* Reporte ETA */}
                    <td className="py-3 px-4">
                      {isDelayed ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-blue-900 font-mono">
                            Llega en ~{st.etaMinutes} min ({st.etaSentAt || 'Reciente'})
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {st.etaReason || 'Tráfico vehicular'}
                          </div>
                        </div>
                      ) : isInClass ? (
                        <span className="text-slate-500 font-mono text-[11px]">
                          Validado por {st.validatedVia?.toUpperCase()} ({st.validatedAt || '06:55 AM'})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Sin novedades reportadas</span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="py-3 px-4 text-right">
                      {isInClass ? (
                        <span className="text-emerald-600 font-medium text-[11px]">Acreditado</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onManualValidateStudent(st.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium text-[11px] text-slate-700 transition-colors"
                        >
                          Pase Manual
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
