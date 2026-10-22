import React, { useState } from 'react';
import { UserAccount, SchoolInstitution } from '../types';
import { MOCK_USERS, INSTITUTION_INFO } from '../data/mockData';
import { SchoolBrandLogo } from './SchoolBrandLogo';
import {
  AlertCircle,
  KeyRound,
  X,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  UserCheck,
  Shield,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  currentSchool?: SchoolInstitution;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, currentSchool }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Discreet recovery and demo modals
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [recoverySent, setRecoverySent] = useState<boolean>(false);
  const [isAccountsDrawerOpen, setIsAccountsDrawerOpen] = useState<boolean>(false);

  const schoolName = currentSchool?.name || INSTITUTION_INFO.name;
  const isEpo = schoolName.toLowerCase().includes('264') || schoolName.toLowerCase().includes('preparatoria');
  const schoolSubtitle = isEpo ? 'Panel Institucional EPO 264' : `Panel Institucional ${schoolName}`;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Por favor introduce tu usuario o correo institucional y tu contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user by email or username
      const matched = MOCK_USERS.find(
        (u) =>
          u.email.toLowerCase() === cleanUser ||
          u.username.toLowerCase() === cleanUser
      );

      if (matched) {
        // Verify password
        const passwordMatches =
          matched.password === cleanPass ||
          cleanPass === 'demo' ||
          (matched.password && matched.password.toLowerCase() === cleanPass.toLowerCase());

        if (passwordMatches) {
          setIsLoading(false);
          onLoginSuccess(matched);
          return;
        }
      }

      setIsLoading(false);
      setError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
    }, 450);
  };

  const handleQuickSelect = (user: UserAccount) => {
    setUsername(user.email);
    setPassword(user.password || 'demo123');
    setIsAccountsDrawerOpen(false);
    setError('');
  };

  const handleDirectDemoLogin = (user: UserAccount) => {
    setIsAccountsDrawerOpen(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(user);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background radial crimson aura (subtle, exactly like reference screenshot) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-red-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-950/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card - Exact Match to Reference Screenshot */}
      <div className="relative w-full max-w-[420px] bg-[#0c0c0f] border border-zinc-900/90 rounded-2xl sm:rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80">
        {/* Subtle top edge crimson highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-red-800/40 to-transparent rounded-t-3xl" />

        {/* School Logo Emblem */}
        <div className="flex justify-center mb-6">
          <SchoolBrandLogo
            logoUrl={currentSchool?.logo}
            schoolName={schoolName}
            size="lg"
          />
        </div>

        {/* Title and Subtitle */}
        <div className="text-center mb-7 space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase font-sans">
            INICIAR SESIÓN
          </h1>
          <p className="text-xs text-zinc-400 font-normal tracking-wide">
            {schoolSubtitle}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* User/Email Input */}
          <div>
            <div className="relative">
              <input
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario@school.com"
                className="w-full px-4 py-3.5 text-sm bg-[#15151a] border border-zinc-800/90 rounded-xl text-white placeholder-zinc-500 focus:bg-[#181820] focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full pl-4 pr-11 py-3.5 text-sm bg-[#15151a] border border-zinc-800/90 rounded-xl text-white placeholder-zinc-500 focus:bg-[#181820] focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Button - Exact Crimson Red Button from Screenshot */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 px-4 bg-[#c21a1a] hover:bg-[#d61f1f] active:scale-[0.99] text-white font-black text-sm tracking-widest uppercase rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                VERIFICANDO...
              </span>
            ) : (
              'ACCEDER'
            )}
          </button>
        </form>

        {/* Forgot Password Link - Exactly as in screenshot */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-medium tracking-wide"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>

      {/* Discreet Tester & Credentials Helper Bar (Clean & Unobtrusive) */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-400">
        <button
          type="button"
          onClick={() => setIsAccountsDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer text-[11px]"
        >
          <KeyRound className="w-3.5 h-3.5 text-red-500" />
          <span>Ver cuentas demo y roles</span>
        </button>
      </div>

      {/* MODAL: Forgot Password */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#101014] border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => {
                setIsForgotModalOpen(false);
                setRecoverySent(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Recuperación de Acceso</h3>
                <p className="text-xs text-zinc-400">Portal Institucional AulaControl</p>
              </div>
            </div>

            {recoverySent ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-xl space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-emerald-200 font-medium">
                  Se ha enviado un enlace de restablecimiento a <strong>{recoveryEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setRecoverySent(false);
                  }}
                  className="mt-3 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold"
                >
                  Regresar al Login
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Ingresa tu correo institucional registrado. Si eres alumno, tu Orientador escolar también puede restablecer tu contraseña.
                </p>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="ej. sofia@colegio.edu"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#17171d] border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (recoveryEmail.trim()) {
                      setRecoverySent(true);
                    }
                  }}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Enviar Instrucciones
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Demo Credentials Quick Selector */}
      {isAccountsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#101014] border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cuentas Registradas en el Sistema</h3>
                  <p className="text-[11px] text-zinc-400">Haz clic en cualquier rol para ingresar o copiar datos</p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountsDrawerOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Dueño de la App */}
              <div className="p-3 bg-zinc-900/90 border-2 border-red-900/50 hover:border-red-600/70 rounded-2xl flex items-center justify-between gap-3 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">Dueño de la App (Super Admin)</span>
                    <span className="text-[10px] font-mono text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800/40">SaaS Global</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    sarsjs@gmail.com · <strong className="text-white">Afore#2025</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(MOCK_USERS[0])}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg"
                  >
                    Rellenar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectDemoLogin(MOCK_USERS[0])}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg shadow-xs"
                  >
                    Entrar
                  </button>
                </div>
              </div>

              {/* Director */}
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Director General</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Dr. Morales</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    director@colegio.edu · <strong className="text-white">director123</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(MOCK_USERS[1])}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg"
                  >
                    Rellenar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectDemoLogin(MOCK_USERS[1])}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold rounded-lg"
                  >
                    Entrar
                  </button>
                </div>
              </div>

              {/* Orientador 1 */}
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Orientador 1 (Lic. Fernando)</span>
                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">1º A y 2º B</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    orientador1@colegio.edu · <strong className="text-white">orienta123</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(MOCK_USERS[2])}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg"
                  >
                    Rellenar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectDemoLogin(MOCK_USERS[2])}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold rounded-lg"
                  >
                    Entrar
                  </button>
                </div>
              </div>

              {/* Orientador 2 */}
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Orientadora 2 (Mtra. Patricia)</span>
                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">3º A y 4º B</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    orientador2@colegio.edu · <strong className="text-white">orienta123</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(MOCK_USERS[3])}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg"
                  >
                    Rellenar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectDemoLogin(MOCK_USERS[3])}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold rounded-lg"
                  >
                    Entrar
                  </button>
                </div>
              </div>

              {/* Profesor */}
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Profesor (Prof. Roberto)</span>
                    <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded">Docente Mat.</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    prof.roberto@colegio.edu · <strong className="text-white">profe123</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(MOCK_USERS[4])}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg"
                  >
                    Rellenar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectDemoLogin(MOCK_USERS[4])}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold rounded-lg"
                  >
                    Entrar
                  </button>
                </div>
              </div>

              {/* Alumna */}
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Alumna (Sofía Morales)</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">2º B</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    sofia@colegio.edu · <strong className="text-white">alumno123</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(MOCK_USERS[5])}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg"
                  >
                    Rellenar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectDemoLogin(MOCK_USERS[5])}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold rounded-lg"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsAccountsDrawerOpen(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
