import React from 'react';
import { SystemNotification } from '../types';
import { Bell, Clock, AlertTriangle, CheckCircle2, MapPin, X, Trash2 } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onClearAll: () => void;
  onSelectNotificationAction?: (notif: SystemNotification) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onSelectNotificationAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-sm text-slate-900">Centro de Notificaciones Escolares</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                title="Limpiar todas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
              <span>No hay notificaciones registradas.</span>
            </div>
          ) : (
            notifications.map((n) => {
              const isEta = n.type === 'eta_prompt';
              const isArrival = n.type === 'campus_arrival';
              const isUnattended = n.type === 'class_unattended';
              const isTeacherAlert = n.type === 'teacher_eta_alert';
              const isValidated = n.type === 'class_validated';

              return (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-slate-100 text-slate-700">
                        {isEta && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        {isArrival && <MapPin className="w-3.5 h-3.5 text-blue-600" />}
                        {isUnattended && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                        {isTeacherAlert && <Bell className="w-3.5 h-3.5 text-indigo-600" />}
                        {isValidated && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {!isEta && !isArrival && !isUnattended && !isTeacherAlert && !isValidated && (
                          <Bell className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                      {n.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                  {n.actionRequired && onSelectNotificationAction && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectNotificationAction(n);
                        onClose();
                      }}
                      className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Tomar Acción →
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
