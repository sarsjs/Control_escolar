import React from 'react';
import { SystemNotification } from '../types';
import { AlertCircle, Clock, CheckCircle2, MapPin, Bell, X } from 'lucide-react';

interface NotificationToastProps {
  notifications: SystemNotification[];
  onDismiss: (id: string) => void;
  onOpenEtaModal?: () => void;
  onOpenCheckinModal?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onOpenEtaModal,
  onOpenCheckinModal,
}) => {
  // Show the most recent unread notification if any
  const activeNotifs = notifications.filter((n) => !n.read).slice(0, 3);

  if (activeNotifs.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md w-full space-y-2 pointer-events-none">
      {activeNotifs.map((notif) => {
        const isEtaPrompt = notif.type === 'eta_prompt';
        const isArrival = notif.type === 'campus_arrival';
        const isClassUnattended = notif.type === 'class_unattended';
        const isTeacherAlert = notif.type === 'teacher_eta_alert';
        const isValidated = notif.type === 'class_validated';

        let borderColor = 'border-slate-200';
        let bgIconColor = 'bg-slate-100 text-slate-700';

        if (isEtaPrompt) {
          borderColor = 'border-amber-300';
          bgIconColor = 'bg-amber-100 text-amber-800';
        } else if (isArrival) {
          borderColor = 'border-blue-300';
          bgIconColor = 'bg-blue-100 text-blue-800';
        } else if (isClassUnattended) {
          borderColor = 'border-rose-300';
          bgIconColor = 'bg-rose-100 text-rose-800';
        } else if (isTeacherAlert) {
          borderColor = 'border-indigo-300';
          bgIconColor = 'bg-indigo-100 text-indigo-800';
        } else if (isValidated) {
          borderColor = 'border-emerald-300';
          bgIconColor = 'bg-emerald-100 text-emerald-800';
        }

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto bg-white rounded-xl shadow-lg border ${borderColor} p-4 transition-all duration-200 flex items-start gap-3`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${bgIconColor}`}>
              {isEtaPrompt && <Clock className="w-5 h-5" />}
              {isArrival && <MapPin className="w-5 h-5" />}
              {isClassUnattended && <AlertCircle className="w-5 h-5" />}
              {isTeacherAlert && <Bell className="w-5 h-5" />}
              {isValidated && <CheckCircle2 className="w-5 h-5" />}
              {!isEtaPrompt && !isArrival && !isClassUnattended && !isTeacherAlert && !isValidated && (
                <Bell className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900 truncate">{notif.title}</h4>
                <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                  {notif.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

              {/* Action button if needed */}
              {isEtaPrompt && onOpenEtaModal && (
                <button
                  type="button"
                  onClick={onOpenEtaModal}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Responder tiempo de llegada
                </button>
              )}

              {isArrival && onOpenCheckinModal && (
                <button
                  type="button"
                  onClick={onOpenCheckinModal}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Validar presencia en salón
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(notif.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
