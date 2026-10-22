import React, { useState } from 'react';
import { Student, SchoolGroup, GroupScheduleItem, Orientador } from '../types';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Calendar,
  School,
  FileQuestion,
  Info,
} from 'lucide-react';

interface StudentAppViewProps {
  student: Student;
  studentGroup: SchoolGroup;
  orientador?: Orientador;
  activeClass: GroupScheduleItem;
  simulatedTime: string;
  onOpenEtaModal: () => void;
  onOpenCheckinModal: () => void;
  onOpenDisputeModal: () => void;
  onSimulateCrossGate: () => void;
}

export const StudentAppView: React.FC<StudentAppViewProps> = ({
  student,
  studentGroup,
  orientador,
  activeClass,
  simulatedTime,
  onOpenEtaModal,
  onOpenCheckinModal,
  onOpenDisputeModal,
  onSimulateCrossGate,
}) => {
  const [showIdCard, setShowIdCard] = useState<boolean>(false);

  const isOutside = student.currentStatus === 'outside_school';
  const isEnRoute = student.currentStatus === 'en_route_delayed';
  const isOnCampusOutside = student.currentStatus === 'on_campus_not_in_class';
  const isInClass = student.currentStatus === 'in_class';
  const isAbsent = student.currentStatus === 'absent';

  const schedule = studentGroup.schedule || [];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Student Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isInClass
                  ? 'bg-emerald-500'
                  : isOnCampusOutside
                  ? 'bg-amber-500 animate-pulse'
                  : isEnRoute
                  ? 'bg-blue-500'
                  : 'bg-rose-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{student.name}</h2>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {studentGroup.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Matrícula: <span className="font-mono">{student.matricula}</span> · Turno {studentGroup.turn}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowIdCard(!showIdCard)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shrink-0"
        >
          {showIdCard ? 'Ocultar Credencial' : 'Ver Credencial'}
        </button>
      </div>

      {/* Resumen Principal del Alumno: Asistencias, Faltas y Horario (Requisito Clave) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Asistencias */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Tus Asistencias</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-600">94.1%</span>
              <span className="text-xs text-slate-500 font-medium">(32/34)</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">Asistencias validadas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Faltas */}
        <div className="bg-white rounded-2xl border border-rose-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Tus Faltas</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-rose-600">2</span>
              <span className="text-xs text-slate-500 font-medium">acumuladas</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">1 justificada · 1 por revisar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Horario Escolar Hoy */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">Horario de Hoy</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-bold text-slate-900 truncate max-w-[130px] block">
                {activeClass?.subjectName || 'Matemáticas'}
              </span>
            </div>
            <span className="text-[10px] text-indigo-700 font-mono block mt-0.5">
              {activeClass?.classroom} · {activeClass?.startTime} - {activeClass?.endTime}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Orientador Asignado */}
      {orientador && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <img
              src={orientador.avatar}
              alt={orientador.name}
              className="w-10 h-10 rounded-xl object-cover border border-amber-300 shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Orientador Responsable:
              </span>
              <h4 className="font-bold text-slate-900 text-xs">{orientador.name}</h4>
              <p className="text-[11px] text-slate-500">{orientador.cubicle}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md font-mono">
              Recibe tus reportes y revisiones
            </span>
          </div>
        </div>
      )}

      {/* Credencial Digital */}
      {showIdCard && (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-300">
                Colegio Preparatorio Central
              </span>
              <h3 className="text-sm font-bold tracking-tight">Credencial Digital del Alumno</h3>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-mono text-indigo-200">
              Ciclo 2026-2027
            </div>
          </div>

          <div className="mt-5 flex gap-4 items-center">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
            />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">{student.name}</h4>
              <p className="text-xs text-indigo-200">{studentGroup.name}</p>
              <p className="text-xs font-mono text-indigo-300">ID: {student.matricula}</p>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Orientador: {orientador?.name}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col items-center justify-center">
            <div className="h-10 w-48 flex items-center justify-between opacity-80">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white h-full"
                  style={{
                    width: i % 3 === 0 ? '4px' : i % 2 === 0 ? '2px' : '1px',
                    opacity: i % 5 === 0 ? 0.3 : 1,
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] text-indigo-300 mt-1 tracking-widest">
              *{student.matricula}*
            </span>
          </div>
        </div>
      )}

      {/* CASO A: Aún no llega al plantel (Alerta de hora de entrada) */}
      {isOutside && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-xs shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Control de Acceso Escolar
                </span>
                <span className="text-xs font-mono tabular-nums text-rose-500">
                  {simulatedTime}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Aún no registramos tu llegada al plantel
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Hora de entrada oficial: <strong className="text-slate-800">07:00 AM</strong>. Tu clase en curso para {studentGroup.name} es <strong className="text-slate-800">{activeClass?.subjectName}</strong> con <strong className="text-slate-800">{activeClass?.teacherName}</strong> en <strong className="text-slate-800">{activeClass?.classroom}</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white/90 rounded-2xl p-4 border border-rose-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-700">
              <strong className="block text-slate-900 font-semibold">¿En cuánto tiempo estimas llegar?</strong>
              <span className="text-slate-500 text-[11px]">
                Tu reporte se enviará de inmediato a tu Orientador y al Profesor de tu materia activa.
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenEtaModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl shadow-md transition-all shrink-0"
            >
              <Clock className="w-4 h-4" />
              <span>Reportar Tiempo Estimado (ETA)</span>
            </button>
          </div>
        </div>
      )}

      {/* CASO B: En camino con reporte de retraso */}
      {isEnRoute && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xs shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Reporte de Demora Registrado
                </span>
                <span className="text-xs font-mono tabular-nums text-blue-600">
                  {student.etaSentAt || 'Reciente'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                En camino · Tiempo estimado: ~{student.etaMinutes || 15} min
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tu Orientador <strong className="text-slate-800">{orientador?.name}</strong> y tu docente <strong className="text-slate-800">{activeClass?.teacherName}</strong> están informados de que vienes demorado por <strong className="text-slate-800">{student.etaReason || 'tráfico'}</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white/90 rounded-2xl p-4 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Estado informado: <strong>En tránsito reportado</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenEtaModal}
                className="px-3.5 py-2 text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
              >
                Actualizar Minutos
              </button>
              <button
                type="button"
                onClick={onSimulateCrossGate}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs"
              >
                Registrar Llegada al Perímetro Escolar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASO C: En el plantel pero no en clase (REQUISITO FUNDAMENTAL) */}
      {isOnCampusOutside && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-xs shrink-0">
              <School className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Llegada al Plantel Detectada
                </span>
                <span className="text-[11px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                  En Perímetro Escolar
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Has llegado al plantel. Recuerda que todavía necesitas confirmar tu presencia en tu salón de clase
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                El perímetro escolar confirma tu presencia física en las instalaciones. Sin embargo, tu clase de <strong className="text-slate-800">{activeClass?.subjectName}</strong> en <strong className="text-slate-800">{activeClass?.classroom}</strong> ya inició. La llegada al plantel no te marca automáticamente como asistente.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Tu ubicación actual:</span>
              <span className="font-semibold text-slate-900">{student.currentZone}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Salón que debes ingresar:</span>
              <span className="font-semibold text-indigo-700">{activeClass?.classroom} · {activeClass?.building}</span>
            </div>

            <button
              type="button"
              onClick={onOpenCheckinModal}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-md transition-all"
            >
              <Radio className="w-4 h-4" />
              <span>Confirmar Presencia en {activeClass?.classroom} (BLE Automático)</span>
            </button>
          </div>
        </div>
      )}

      {/* CASO D: En Clase Activa */}
      {isInClass && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xs shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Presencia en Clase Confirmada
                </span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Validado por {student.validatedVia?.toUpperCase() || 'BLE_AUTO'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Presente en {activeClass?.subjectName}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Asistencia validada en {activeClass?.classroom} con {activeClass?.teacherName} a las {student.validatedAt || '07:08 AM'}.
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-3 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <span>Hora fin de clase: {activeClass?.endTime}</span>
            <span className="text-slate-500">Tolerancia oficial: {activeClass?.toleranceMinutes} min</span>
          </div>
        </div>
      )}

      {/* CASO E: Ausente Declarado */}
      {isAbsent && (
        <div className="bg-slate-100 border-2 border-slate-300 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-slate-700 text-white rounded-2xl shadow-xs shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Estado Registrado: Ausencia
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                No se registró presencia en {activeClass?.subjectName}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                El tiempo de tolerancia ({activeClass?.toleranceMinutes} min) ha concluido sin confirmación de asistencia en el aula.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botón de Solicitud de Revisión de Asistencia */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900">¿Asistencia incorrecta o falla de sensor?</h4>
          <p className="text-[11px] text-slate-500">
            Si estuviste en el aula y no se acreditó tu presencia, solicita una revisión con tu justificación.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDisputeModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
        >
          <FileQuestion className="w-4 h-4 text-slate-600" />
          <span>Solicitar Revisión</span>
        </button>
      </div>

      {/* Horario de Clases Oficial */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Horario Oficial de {studentGroup.name}</h3>
              <p className="text-xs text-slate-500">Configurado por tu Orientador {orientador?.name}</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {schedule.map((cls) => {
            const isCurrent = cls.id === activeClass?.id;

            let statusLabel = 'Pendiente';
            let statusBadge = 'text-slate-500 bg-slate-100';

            if (isCurrent) {
              if (isInClass) {
                statusLabel = 'Asistencia Validada';
                statusBadge = 'text-emerald-700 bg-emerald-100 font-bold';
              } else if (isOnCampusOutside) {
                statusLabel = 'En Plantel - Falta Salón';
                statusBadge = 'text-amber-700 bg-amber-100 font-bold';
              } else if (isEnRoute) {
                statusLabel = 'Retraso Notificado (ETA)';
                statusBadge = 'text-blue-700 bg-blue-100 font-semibold';
              } else if (isAbsent) {
                statusLabel = 'Ausencia Registrada';
                statusBadge = 'text-rose-700 bg-rose-100 font-bold';
              } else {
                statusLabel = 'Sin Asistir';
                statusBadge = 'text-slate-600 bg-slate-100';
              }
            }

            return (
              <div
                key={cls.id}
                className={`py-3.5 flex items-center justify-between gap-3 ${
                  isCurrent ? 'bg-indigo-50/40 -mx-3 px-3 rounded-xl' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-center font-mono text-xs shrink-0 w-14">
                    <span className="font-bold text-slate-900 block">{cls.startTime}</span>
                    <span className="text-[10px] text-slate-400">{cls.endTime}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{cls.subjectName}</h4>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-sm shrink-0">
                          En Curso
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {cls.classroom} · {cls.teacherName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] px-2.5 py-1 rounded-lg ${statusBadge}`}>
                    {statusLabel}
                  </span>

                  {isCurrent && isOnCampusOutside && (
                    <button
                      type="button"
                      onClick={onOpenCheckinModal}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      title="Confirmar presencia"
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
