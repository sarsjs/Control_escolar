import React, { useState } from 'react';
import { Clock, Send, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { GroupScheduleItem, Orientador } from '../types';

interface EtaPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitEta: (minutes: number, reason: string) => void;
  entryTime: string;
  activeClass?: GroupScheduleItem;
  orientador?: Orientador;
  studentName: string;
}

export const EtaPromptModal: React.FC<EtaPromptModalProps> = ({
  isOpen,
  onClose,
  onSubmitEta,
  entryTime,
  activeClass,
  orientador,
  studentName,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [reason, setReason] = useState<string>('Tráfico denso en la ruta');
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickTimes = [
    { mins: 5, label: '5 min', desc: 'Ya muy cerca' },
    { mins: 10, label: '10 min', desc: 'A pocas calles' },
    { mins: 15, label: '15 min', desc: 'Tráfico vehicular' },
    { mins: 25, label: '25 min', desc: 'Transporte demorado' },
    { mins: 35, label: '35 min', desc: 'Imprevisto mayor' },
  ];

  const commonReasons = [
    'Tráfico denso en la ruta',
    'Falla o retraso en transporte público',
    'Lluvia o condiciones climáticas',
    'Cita médica o situación de salud',
    'Imprevisto familiar / doméstico',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalMinutes = customMinutes ? parseInt(customMinutes, 10) || selectedMinutes : selectedMinutes;
    setTimeout(() => {
      onSubmitEta(finalMinutes, reason);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600/60 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Aviso de Hora de Entrada</h3>
              <p className="text-xs text-amber-100">Horario de ingreso institucional: {entryTime} AM</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-100 hover:text-white p-1 rounded-md transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Main prompt message */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-950">
                Aún no estás presente en tu institución
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Hola, <span className="font-semibold">{studentName}</span>. El sistema detecta que aún no cruzas el acceso escolar. Indica en cuánto tiempo llegas para que tu Orientador y tus profesores sepan que no vas a faltar, sino que vienes en camino.
              </p>
            </div>
          </div>

          {/* Quick ETA selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              ¿En cuánto tiempo estimas llegar?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {quickTimes.map((item) => {
                const isSelected = selectedMinutes === item.mins && !customMinutes;
                return (
                  <button
                    key={item.mins}
                    type="button"
                    onClick={() => {
                      setSelectedMinutes(item.mins);
                      setCustomMinutes('');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-center border transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-sm font-bold font-mono">{item.label}</span>
                    <span
                      className={`block text-[10px] truncate mt-0.5 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Minutes option */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-slate-500">O especifica minutos exactos:</span>
              <input
                type="number"
                min="1"
                max="120"
                placeholder="Ej. 18"
                value={customMinutes}
                onChange={(e) => {
                  setCustomMinutes(e.target.value);
                  if (e.target.value) {
                    setSelectedMinutes(parseInt(e.target.value, 10) || 15);
                  }
                }}
                className="w-20 px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
              />
              <span className="text-slate-500">minutos</span>
            </div>
          </div>

          {/* Reason selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Motivo del retraso
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              {commonReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Notice of who receives it */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Transmisión en tiempo real a tus autoridades:</span>
            </div>
            <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
              • Tu Orientador a cargo: <strong>{orientador?.name || 'Orientación Educativa'}</strong><br />
              • Tu Docente en curso: <strong>{activeClass?.teacherName || 'Prof. Roberto Gómez'}</strong> ({activeClass?.subjectName || 'Matemáticas'})
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Transmitiendo...' : 'Enviar Reporte a Orientador y Docente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
