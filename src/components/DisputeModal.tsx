import React, { useState } from 'react';
import { AlertCircle, Send, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AttendanceDispute } from '../types';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
  groupId: string;
  activeSubjectName: string;
  onSubmitDispute: (reason: string) => void | Promise<void>;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  studentName,
  activeSubjectName,
  onSubmitDispute,
}) => {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmitDispute(reason.trim());
      setSuccess(true);
      window.setTimeout(() => {
        setSuccess(false);
        setReason('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('No se pudo guardar la solicitud de revisión:', error);
      setErrorMessage('No se pudo guardar la solicitud. No se ha confirmado el envío; inténtalo más tarde o informa a Orientación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Solicitud de Revisión de Asistencia</h3>
              <p className="text-[11px] text-slate-400">{activeSubjectName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-900 text-base">Solicitud Enviada a Revisión</h4>
            <p className="text-xs text-slate-600">
              Tu Orientador y el Docente han recibido tu justificación. Recibirás una notificación cuando sea resuelta.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">{errorMessage}</div>}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              Si estuviste presente y el sistema no detectó tu dispositivo BLE o hubo una falla de red, describe la situación para que tu Orientador y Profesor auditen y corrijan el registro.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Motivo o Evidencia de la Presencia en Aula
              </label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Estuve presente en el salón 102 desde las 7:02 AM pero mi teléfono no enlazó la señal Bluetooth con el proyector..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
