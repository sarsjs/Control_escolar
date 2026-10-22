import React from 'react';
import {
  Play,
  RotateCcw,
  FastForward,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Send,
  Radio,
  Sparkles,
} from 'lucide-react';

interface SimulationControlsProps {
  currentStep: number;
  simulatedTime: string;
  onSetTime: (time: string) => void;
  onRunScenarioStep: (stepNumber: number) => void;
  onResetSimulation: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  currentStep,
  simulatedTime,
  onSetTime,
  onRunScenarioStep,
  onResetSimulation,
}) => {
  const steps = [
    {
      step: 1,
      title: '1. Aviso de Entrada (7:05 AM)',
      desc: 'Sofía está fuera de la escuela. Se dispara la alerta de hora de entrada y pregunta en cuánto tiempo llega.',
      badge: 'Alerta ETA',
    },
    {
      step: 2,
      title: '2. Sofía responde "Llego en 15m"',
      desc: 'La respuesta viaja de inmediato al panel de los profesores: saben que viene demorada y no va a faltar.',
      badge: 'Notifica Docentes',
    },
    {
      step: 3,
      title: '3. Llega a la escuela (GPS)',
      desc: 'Cruza la geocerca. La app le avisa que ya está en el plantel pero AÚN NO en clase (Matemáticas 102).',
      badge: 'En Campus sin Aula',
    },
    {
      step: 4,
      title: '4. Valida presencia en Aula 102',
      desc: 'Ingresa el PIN proyectado por el profesor o se enlaza por Bluetooth. Asistencia oficial acreditada.',
      badge: 'Presente en Clase',
    },
    {
      step: 5,
      title: '5. Siguiente Clase (8:35 AM)',
      desc: 'Avanza el reloj a Física (Lab 2). El sistema exige validar de nuevo en el salón correspondiente.',
      badge: 'Multi-Clase',
    },
  ];

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Simulador Interactivo de Flujos Escolar</h3>
            <p className="text-xs text-slate-400">
              Prueba paso a paso el ciclo completo solicitado en la descripción
            </p>
          </div>
        </div>

        {/* Time Control Bar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-slate-400">Hora Escolar:</span>
            <span className="text-sm font-mono font-bold text-white tabular-nums">{simulatedTime}</span>
          </div>

          <button
            type="button"
            onClick={onResetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            title="Reiniciar todos los estados"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Step Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {steps.map((st) => {
          const isActive = currentStep === st.step;
          const isPassed = currentStep > st.step;

          return (
            <button
              key={st.step}
              type="button"
              onClick={() => onRunScenarioStep(st.step)}
              className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-indigo-600 border-indigo-400 ring-2 ring-indigo-300/40 shadow-lg text-white'
                  : isPassed
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${
                    isActive ? 'bg-indigo-950 text-indigo-200' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {st.badge}
                  </span>
                  {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <h4 className="text-xs font-bold leading-tight">{st.title}</h4>
                <p className={`text-[11px] mt-1 line-clamp-2 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {st.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-semibold">
                <span>{isActive ? 'Paso Actual' : 'Ejecutar Paso'}</span>
                <Play className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
