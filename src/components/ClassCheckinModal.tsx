import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { GroupScheduleItem } from '../types';

interface ClassCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass: GroupScheduleItem;
}

/**
 * Attendance must not be recorded by client-side simulations.
 * BLE, PIN and QR need a verifiable server-side/teacher-backed flow before
 * this screen can mark an official attendance record.
 */
export const ClassCheckinModal: React.FC<ClassCheckinModalProps> = ({
  isOpen,
  onClose,
  activeClass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 bg-indigo-600 px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
              Validación de asistencia
            </p>
            <h3 className="text-base font-bold">{activeClass.subjectName}</h3>
            <p className="mt-1 text-xs text-indigo-100">
              {activeClass.classroom} · {activeClass.teacherName}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-1 text-indigo-100 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h4 className="text-sm font-bold">La validación automática aún no está habilitada</h4>
              <p className="mt-2 text-sm leading-relaxed">
                Para evitar registrar asistencias falsas, AulaControl no simulará detecciones Bluetooth ni escaneos QR y no mostrará un PIN interno.
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Por ahora, solicita a tu docente que confirme tu presencia. La validación por BLE, PIN o QR se habilitará cuando esté conectada a una verificación segura.
          </p>
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
