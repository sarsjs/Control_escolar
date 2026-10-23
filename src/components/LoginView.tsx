import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserAccount, UserRole, SchoolInstitution } from '../types';
import { INSTITUTION_INFO } from '../data/mockData';
import { auth, db } from '../firebase';
import { SchoolBrandLogo } from './SchoolBrandLogo';
import { AlertCircle, Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  currentSchool?: SchoolInstitution;
}

const allowedRoles: UserRole[] = ['superadmin', 'director', 'orientador', 'teacher', 'student'];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, currentSchool }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const schoolName = currentSchool?.name || INSTITUTION_INFO.name;
  const isEpo = schoolName.toLowerCase().includes('264') || schoolName.toLowerCase().includes('preparatoria');
  const schoolSubtitle = isEpo ? 'Panel Institucional EPO 264' : `Panel Institucional ${schoolName}`;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const profileSnapshot = await getDoc(doc(db, 'users', credential.user.uid));
      if (!profileSnapshot.exists()) {
        await signOut(auth);
        throw new Error('Tu cuenta se autenticó, pero no tiene un perfil autorizado en AulaControl. Contacta al administrador.');
      }

      const profile = profileSnapshot.data();
      if (typeof profile.role !== 'string' || !allowedRoles.includes(profile.role as UserRole)) {
        await auth.signOut();
        throw new Error('El perfil no tiene un rol válido. Contacta al administrador.');
      }

      const role = profile.role as UserRole;
      const user: UserAccount = {
        id: credential.user.uid,
        username: typeof profile.username === 'string' ? profile.username : (credential.user.email || cleanEmail),
        name: typeof profile.name === 'string' && profile.name.trim() ? profile.name : (credential.user.displayName || cleanEmail),
        email: credential.user.email || cleanEmail,
        role,
        avatar: typeof profile.avatar === 'string' ? profile.avatar : '',
        title: typeof profile.title === 'string' ? profile.title : role,
        ...(typeof profile.schoolId === 'string' ? { schoolId: profile.schoolId } : {}),
        ...(typeof profile.linkedEntityId === 'string' ? { linkedEntityId: profile.linkedEntityId } : {}),
      };
      onLoginSuccess(user);
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Correo o contraseña incorrectos.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera un momento e inténtalo de nuevo.');
      } else {
        setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = async () => {
    setError('');
    setNotice('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Escribe tu correo institucional para enviarte el restablecimiento.');
      return;
    }
    setIsRecovering(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setNotice('Si existe una cuenta registrada con ese correo, recibirás instrucciones para restablecer tu contraseña.');
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (code === 'auth/invalid-email') setError('El formato del correo no es válido.');
      else setError('No se pudo enviar el correo de recuperación. Verifica la configuración de Firebase Authentication.');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-red-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="relative w-full max-w-[420px] bg-[#0c0c0f] border border-zinc-900/90 rounded-2xl sm:rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-800/40 to-transparent rounded-t-3xl" />
        <div className="flex justify-center mb-6">
          <SchoolBrandLogo logoUrl={currentSchool?.logo} schoolName={schoolName} size="lg" />
        </div>
        <div className="text-center mb-7 space-y-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase">INICIAR SESIÓN</h1>
          <p className="text-xs text-zinc-400 tracking-wide">{schoolSubtitle}</p>
          <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Acceso protegido con Firebase Authentication
          </div>
        </div>

        {error && <div role="alert" className="mb-4 p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-center gap-2.5"><AlertCircle className="w-4 h-4 shrink-0 text-red-400" /><span>{error}</span></div>}
        {notice && <div role="status" className="mb-4 p-3.5 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-200">{notice}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs text-zinc-300 mb-2">Correo electrónico</label>
            <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@institucion.edu" className="w-full px-4 py-3.5 text-sm bg-[#15151a] border border-zinc-800/90 rounded-xl text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs text-zinc-300 mb-2">Contraseña</label>
            <div className="relative">
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" className="w-full pl-4 pr-11 py-3.5 text-sm bg-[#15151a] border border-zinc-800/90 rounded-xl text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading || isRecovering} className="w-full py-3.5 px-4 bg-[#c21a1a] hover:bg-[#d61f1f] text-white font-black text-sm tracking-widest uppercase rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Validando acceso…</> : 'Entrar a AulaControl'}
          </button>
        </form>
        <button type="button" disabled={isLoading || isRecovering} onClick={handleRecovery} className="w-full mt-4 text-xs text-zinc-400 hover:text-white underline underline-offset-4 disabled:opacity-50">
          {isRecovering ? 'Enviando instrucciones…' : '¿Olvidaste tu contraseña?'}
        </button>
        <p className="mt-6 text-[10px] leading-relaxed text-center text-zinc-600">Solo pueden ingresar cuentas creadas en Firebase Authentication y vinculadas a un perfil autorizado de AulaControl.</p>
      </div>
    </div>
  );
};
