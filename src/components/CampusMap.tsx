import React, { useState } from 'react';
import { Student, CampusZoneLocation } from '../types';
import { CAMPUS_AERIAL_IMAGE, CAMPUS_ZONES } from '../data/mockData';
import { MapPin, AlertCircle, CheckCircle2, Clock, ShieldCheck, Compass, Eye } from 'lucide-react';

interface CampusMapProps {
  students: Student[];
  currentStudentId: string;
  onSelectStudent?: (student: Student) => void;
  onSimulateMoveStudent?: (zoneName: string) => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  students,
  currentStudentId,
  onSelectStudent,
  onSimulateMoveStudent,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeZoneHover, setActiveZoneHover] = useState<string | null>(null);

  // Group students by presence status for summary badges
  const inClassCount = students.filter((s) => s.currentStatus === 'in_class').length;
  const onCampusOutsideClassCount = students.filter((s) => s.currentStatus === 'on_campus_not_in_class').length;
  const enRouteCount = students.filter((s) => s.currentStatus === 'en_route_delayed').length;
  const outsideCount = students.filter((s) => s.currentStatus === 'outside_school' || s.currentStatus === 'absent').length;

  // Coordinate mapper for students
  const getStudentCoordinates = (student: Student, index: number) => {
    if (student.currentStatus === 'outside_school') {
      return { x: 8 + (index * 6), y: 92 };
    }
    if (student.currentStatus === 'en_route_delayed') {
      return { x: 30 + (index * 4), y: 90 };
    }
    if (student.currentStatus === 'on_campus_not_in_class') {
      if (student.currentZone.includes('Cafetería')) {
        return { x: 58, y: 28 };
      }
      return { x: 74, y: 44 };
    }
    // In class (Aula 102 is in Edificio A)
    return { x: 20 + (index * 3.5), y: 48 };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
      {/* Map Control Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-900 text-white rounded-lg">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Mapa Georreferenciado del Plantel</h3>
            <p className="text-xs text-slate-500">Geocerca perimetral activa (Radio 250m) · Colegio Preparatorio Central</p>
          </div>
        </div>

        {/* Legend stats */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>En Aula ({inClassCount})</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold">En Campus sin Aula ({onCampusOutsideClassCount})</span>
          </div>

          <div className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>En Camino / ETA ({enRouteCount})</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Fuera ({outsideCount})</span>
          </div>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="relative aspect-16/9 w-full bg-slate-900 overflow-hidden select-none">
        {/* Background Campus Satellite Photo */}
        <img
          src={CAMPUS_AERIAL_IMAGE}
          alt="Vista aérea del campus escolar"
          className="w-full h-full object-cover opacity-75 contrast-105"
        />

        {/* Geofence Perimeter visual circle */}
        <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-emerald-400/60 pointer-events-none shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-start justify-end p-3">
          <div className="bg-slate-950/80 backdrop-blur-xs text-emerald-300 text-[10px] font-mono px-2 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Perímetro Geocerca Escolar (250m)</span>
          </div>
        </div>

        {/* Campus Zone Overlays */}
        {CAMPUS_ZONES.map((zone) => {
          const isHovered = activeZoneHover === zone.id;
          return (
            <div
              key={zone.id}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
              }}
              onMouseEnter={() => setActiveZoneHover(zone.id)}
              onMouseLeave={() => setActiveZoneHover(null)}
              onClick={() => onSimulateMoveStudent && onSimulateMoveStudent(zone.name)}
              className={`absolute rounded-xl border transition-all cursor-pointer flex flex-col justify-between p-2 ${
                isHovered
                  ? 'bg-indigo-600/30 border-indigo-400 shadow-lg ring-2 ring-indigo-400/50'
                  : 'bg-slate-900/40 border-white/20 hover:border-white/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white tracking-wide bg-slate-950/70 px-1.5 py-0.5 rounded-sm backdrop-blur-xs">
                  {zone.name}
                </span>
              </div>
              {onSimulateMoveStudent && isHovered && (
                <span className="text-[9px] text-indigo-200 bg-indigo-950/90 px-1.5 py-0.5 rounded-sm self-start">
                  Clic para mover alumno aquí
                </span>
              )}
            </div>
          );
        })}

        {/* Students Markers on the map */}
        {students.map((student, idx) => {
          const coords = getStudentCoordinates(student, idx);
          const isCurrent = student.id === currentStudentId;
          const isInClass = student.currentStatus === 'in_class';
          const isOnCampusOutside = student.currentStatus === 'on_campus_not_in_class';
          const isEnRoute = student.currentStatus === 'en_route_delayed';

          let pinBg = 'bg-slate-600 ring-slate-400 text-white';
          if (isInClass) pinBg = 'bg-emerald-600 ring-emerald-300 text-white';
          else if (isOnCampusOutside) pinBg = 'bg-amber-500 ring-amber-300 text-white animate-bounce';
          else if (isEnRoute) pinBg = 'bg-blue-600 ring-blue-300 text-white';

          return (
            <div
              key={student.id}
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => {
                setSelectedStudent(student);
                if (onSelectStudent) onSelectStudent(student);
              }}
              className="absolute z-20 cursor-pointer group"
            >
              <div
                className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ring-2 transition-transform group-hover:scale-125 overflow-hidden ${pinBg}`}
              >
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Pin Tag */}
              <div
                className={`absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-tight shadow-md transition-opacity pointer-events-none ${
                  isCurrent
                    ? 'bg-indigo-900 text-white ring-1 ring-indigo-400'
                    : 'bg-slate-900/90 text-white opacity-0 group-hover:opacity-100'
                }`}
              >
                {student.name.split(' ')[0]}
                {isOnCampusOutside && ' ⚠️'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Student Detail Drawer / Card */}
      {selectedStudent && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={selectedStudent.avatar}
              alt={selectedStudent.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{selectedStudent.name}</h4>
                <span className="text-[11px] font-mono text-slate-500">
                  {selectedStudent.matricula} · {selectedStudent.groupId.replace('grp-', '').toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Ubicación actual: <span className="font-semibold text-slate-800">{selectedStudent.currentZone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedStudent.currentStatus === 'in_class' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Presente en Aula (Validado {selectedStudent.validatedVia?.toUpperCase()})</span>
              </div>
            )}

            {selectedStudent.currentStatus === 'on_campus_not_in_class' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>En Plantel · Fuera de Salón (Deambulando)</span>
              </div>
            )}

            {selectedStudent.currentStatus === 'en_route_delayed' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-900 text-xs font-semibold">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>En Camino · ETA {selectedStudent.etaMinutes}m ({selectedStudent.etaReason})</span>
              </div>
            )}

            {selectedStudent.currentStatus === 'outside_school' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-800 text-xs font-semibold">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Fuera del Plantel (Sin reporte)</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
