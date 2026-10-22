import React, { useState } from 'react';
import { Student, GroupScheduleItem } from '../types';
import { CampusMap } from './CampusMap';
import {
  ShieldAlert,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  Download,
  AlertTriangle,
  Megaphone,
  Radio,
  Building,
} from 'lucide-react';

interface PrefectureMonitorViewProps {
  students: Student[];
  currentStudentId: string;
  activeClass: GroupScheduleItem;
  simulatedTime: string;
  onSendGeneralBroadcast: (msg: string) => void;
  onMoveStudent: (zoneName: string) => void;
}

export const PrefectureMonitorView: React.FC<PrefectureMonitorViewProps> = ({
  students,
  currentStudentId,
  activeClass,
  simulatedTime,
  onSendGeneralBroadcast,
  onMoveStudent,
}) => {
  const [broadcastText, setBroadcastText] = useState<string>('');
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);

  const inClassStudents = students.filter((s) => s.currentStatus === 'in_class');
  const onCampusOutside = students.filter((s) => s.currentStatus === 'on_campus_not_in_class');
  const enRoute = students.filter((s) => s.currentStatus === 'en_route_delayed');
  const outsideSchool = students.filter((s) => s.currentStatus === 'outside_school');

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    onSendGeneralBroadcast(broadcastText);
    setBroadcastSent(true);
    setBroadcastText('');
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const exportCsv = () => {
    const headers = 'Matricula,Nombre,Grupo,Estado,Zona,RetrasoMinutos,Motivo,MetodoValidacion\n';
    const rows = students
      .map(
        (s) =>
          `"${s.matricula}","${s.name}","${s.groupId}","${s.currentStatus}","${s.currentZone}","${s.etaMinutes || ''}","${s.etaReason || ''}","${s.validatedVia || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_asistencia_colegio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-500">
                Prefectura General & Supervisión
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-400">· Reloj {simulatedTime}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Centro de Monitoreo Georreferenciado del Plantel
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de acceso perimetral, detección de deambulación en pasillos y recepción de avisos de demora.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shadow-2xs"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Descargar Bitácora CSV</span>
        </button>
      </div>

      {/* Campus Map Visualization */}
      <CampusMap
        students={students}
        currentStudentId={currentStudentId}
        onSimulateMoveStudent={onMoveStudent}
      />

      {/* Two Column Layout: Roaming Alerts & Intercom Voceo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roaming Alert List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Alumnos Dentro del Plantel Fuera de Salón ({onCampusOutside.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full font-semibold">
              Supervisión Activa
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Estos alumnos ya cruzaron el acceso vehicular/peatonal de la institución, pero permanecen en áreas comunes durante el horario lectivo.
          </p>

          <div className="space-y-2.5">
            {onCampusOutside.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <span>No hay alumnos deambulando. Todos los estudiantes dentro del plantel están en sus aulas.</span>
              </div>
            ) : (
              onCampusOutside.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-10 h-10 rounded-full object-cover border border-amber-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{st.name}</h4>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Ubicación: {st.currentZone}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Clase que debería tomar: {activeClass.subjectName} ({activeClass.classroom})
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSendGeneralBroadcast(`Aviso a ${st.name}: Favor de presentarse de inmediato en ${activeClass.classroom}.`);
                    }}
                    className="px-3 py-1.5 text-[11px] font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-300 rounded-lg transition-colors shrink-0"
                  >
                    Mandar Alerta
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ETA Demoras Reportadas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Retrasos Justificados Notificados ({enRoute.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full font-semibold">
              Canal de Entrada
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Respuestas recibidas al aviso automático de hora de entrada. Los docentes ya tienen constancia para no marcar falta.
          </p>

          <div className="space-y-2.5">
            {enRoute.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                <span>No hay alumnos con reporte de retraso activo en este momento.</span>
              </div>
            ) : (
              enRoute.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-10 h-10 rounded-full object-cover border border-blue-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{st.name}</h4>
                        <span className="text-[10px] font-mono font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-sm">
                          ETA: ~{st.etaMinutes} min
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                        Motivo: <strong className="text-slate-800">{st.etaReason || 'Tráfico vehicular'}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Notificado a las {st.etaSentAt || '07:01 AM'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-blue-700 px-2.5 py-1 bg-blue-100 rounded-lg shrink-0">
                    Justificado
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick Intercom / Broadcast Form */}
          <form onSubmit={handleSendBroadcast} className="pt-4 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Voceo o Notificación Masiva a Alumnos en Campus:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Favor de ingresar a sus aulas correspondientes..."
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Emitir</span>
              </button>
            </div>
            {broadcastSent && (
              <span className="text-xs text-emerald-600 font-semibold block">
                ¡Voceo transmitido a las pantallas y celulares en campus!
              </span>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
