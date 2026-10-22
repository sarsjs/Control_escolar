import React, { useState } from 'react';
import { UserAccount } from '../types';
import { MOCK_USERS, INSTITUTION_INFO } from '../data/mockData';
import {
  School,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  User,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('sofia@colegio.edu');
  const [password, setPassword] = useState<string>('alumno123');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = MOCK_USERS.find(
        (u) =>
          (u.email.toLowerCase() === username.trim().toLowerCase() ||
            u.username.toLowerCase() === username.trim().toLowerCase()) &&
          (u.password === password || password === 'demo' || password.length >= 3)
      );

      if (user) {
        setIsLoading(false);
        onLoginSuccess(user);
      } else {
        setIsLoading(false);
        setError('Credenciales inválidas. Verifica tu correo y contraseña o utiliza un acceso rápido.');
      }
    }, 400);
  };

  const handleQuickLogin = (quickUser: UserAccount) => {
    setUsername(quickUser.email);
    setPassword(quickUser.password || 'demo123');
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(quickUser);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md sm:max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-2">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            AulaControl Institucional
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {INSTITUTION_INFO.name} · Portal Único de Acceso
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Iniciar Sesión</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              El sistema identificará automáticamente si eres Alumno, Docente, Orientador o Director.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Institucional o Usuario
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. director@colegio.edu o alumno..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Autenticando...' : 'Acceder al Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Demo Buttons (Solución ágil para pruebas) */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Accesos de Demostración con 1 Clic:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Director */}
              <button
                type="button"
                onClick={() => handleQuickLogin(MOCK_USERS[0])}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-left transition-all flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  DIR
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-indigo-950 block truncate">Dr. Morales</span>
                  <span className="text-[10px] text-indigo-700 block truncate">Director General</span>
                </div>
              </button>

              {/* Orientador 1 */}
              <button
                type="button"
                onClick={() => handleQuickLogin(MOCK_USERS[1])}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left transition-all flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ORI 1
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-amber-950 block truncate">Lic. Fernando</span>
                  <span className="text-[10px] text-amber-800 block truncate">Orientador (1º y 2º)</span>
                </div>
              </button>

              {/* Orientador 2 */}
              <button
                type="button"
                onClick={() => handleQuickLogin(MOCK_USERS[2])}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left transition-all flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ORI 2
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-amber-950 block truncate">Mtra. Patricia</span>
                  <span className="text-[10px] text-amber-800 block truncate">Orientadora (3º y 4º)</span>
                </div>
              </button>

              {/* Profesor */}
              <button
                type="button"
                onClick={() => handleQuickLogin(MOCK_USERS[3])}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left transition-all flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  DOC
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-blue-950 block truncate">Prof. Roberto</span>
                  <span className="text-[10px] text-blue-700 block truncate">Docente Matemáticas</span>
                </div>
              </button>

              {/* Alumna */}
              <button
                type="button"
                onClick={() => handleQuickLogin(MOCK_USERS[4])}
                className="sm:col-span-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition-all flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ALU
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-emerald-950 block truncate">Sofía Morales (Alumna 2º B)</span>
                  <span className="text-[10px] text-emerald-700 block truncate">Prueba de ETA y Geocerca</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          Acceso seguro encriptado · Soporte técnico escolar: <span className="font-mono text-slate-400">soporte@colegio.edu</span>
        </p>
      </div>
    </div>
  );
};
