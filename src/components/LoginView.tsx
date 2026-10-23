import React, { useState } from 'react';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserAccount, SchoolInstitution, UserRole } from '../types';
import { INSTITUTION_INFO } from '../data/mockData';
import { auth, db } from '../firebase';
import { SchoolBrandLogo } from './SchoolBrandLogo';
import { AlertCircle, HelpCircle, Eye, EyeOff, X, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  currentSchool?: SchoolInstitution;
}

const validRoles: UserRole[] = ['superadmin', 'director', 'orientador', 'teacher', 'student'];

function authErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-email':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Se bloquearon temporalmente los intentos. Espera un momento y vuelve a intentar.';
    case 'auth/network-request-failed':
      return 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
    case 'auth/operation-not-allowed':
      return 'El acceso por correo y contraseña no está habilitado en Firebase Authentication.';
    default:
      return 'No se pudo iniciar sesión. Verifica la configuración de Firebase o inténtalo más tarde.';
  }
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, currentSchool }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const schoolName = currentSchool?.name || INSTITUTION_INFO.name;
  const isEpo = schoolName.toLowerCase().includes('264') || schoolName.toLowerCase().includes('preparatoria');
  const schoolSubtitle = isEpo ? 'Panel Institucional EPO 264' : `Panel Institucional ${schoolName}`;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Introduce tu correo institucional y contraseña.');
      return;
    }

    setIsLoading(true);
    let loginStage = 'Firebase Authentication';
    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      loginStage = 'lectura del perfil en Firestore';
      const profileSnapshot = await getDoc(doc(db, 'users', credential.user.uid));
      if (!profileSnapshot.exists()) {
        await signOut(auth);
        setError('Tu cuenta inició sesión, pero no tiene un perfil escolar autorizado. Solicita al administrador que registre tu perfil.');
        return;
      }

      const profile = profileSnapshot.data();
      if (typeof profile.role !== 'string' || !validRoles.includes(profile.role as UserRole)) {
        await signOut(auth);
        setError('El perfil no tiene un rol válido. Contacta al administrador escolar.');
        return;
      }

      const role = profile.role as UserRole;
      const user: UserAccount = {
        id: credential.user.uid,
        username: typeof profile.username === 'string' ? profile.username : (credential.user.email || cleanEmail),
        name: typeof profile.name === 'string' ? profile.name : (credential.user.displayName || credential.user.email || 'Usuario'),
        email: credential.user.email || cleanEmail,
        role,
        avatar: typeof profile.avatar === 'string' ? profile.avatar : '',
        title: typeof profile.title === 'string' ? profile.title : role,
        ...(typeof profile.schoolId === 'string' ? { schoolId: profile.schoolId } : {}),
        ...(typeof profile.linkedEntityId === 'string' ? { linkedEntityId: profile.linkedEntityId } : {}),
      };
      onLoginSuccess(user);
    } catch (loginError) {
      const code = typeof loginError === 'object' && loginError !== null && 'code' in loginError
        ? String((loginError as { code?: unknown }).code)
        : 'sin-codigo';
      const message = loginError instanceof Error ? loginError.message : String(loginError);
      console.error(`AulaControl login failed during ${loginStage}:`, { code, message });
      setError(`${authErrorMessage(loginError)} (Etapa: ${loginStage}; código: ${code})`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setRecoveryMessage('');
    const cleanEmail = recoveryEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setRecoveryMessage('Introduce el correo de tu cuenta.');
      return;
    }
    setIsRecovering(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setRecoveryMessage('Si el correo corresponde a una cuenta registrada, Firebase enviará las instrucciones de recuperación. Revisa también la carpeta de spam.');
    } catch (resetError) {
      const code = typeof resetError === 'object' && resetError !== null && 'code' in resetError
        ? String((resetError as { code?: unknown }).code)
        : '';
      setRecoveryMessage(code === 'auth/operation-not-allowed'
        ? 'La recuperación no está habilitada en Firebase Authentication. El administrador debe activarla.'
        : code === 'auth/invalid-email'
          ? 'El formato del correo no es válido.'
          : 'No se pudo solicitar la recuperación. Verifica la conexión y la configuración de Firebase.');
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
        <div className="text-center mb-7 space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase">INICIAR SESIÓN</h1>
          <p className="text-xs text-zinc-400 tracking-wide">{schoolSubtitle}</p>
        </div>

        {error && <div role="alert" className="mb-5 p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-center gap-2.5"><AlertCircle className="w-4 h-4 shrink-0 text-red-400" /><span>{error}</span></div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-xs text-zinc-400">Correo institucional
            <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@escuela.edu.mx" className="mt-2 w-full px-4 py-3.5 text-sm bg-[#15151a] border border-zinc-800/90 rounded-xl text-white placeholder-zinc-500 focus:border-red-600 focus:outline-hidden" />
          </label>
          <label className="block text-xs text-zinc-400">Contraseña
            <span className="relative block mt-2">
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full pl-4 pr-11 py-3.5 text-sm bg-[#15151a] border border-zinc-800/90 rounded-xl text-white placeholder-zinc-500 focus:border-red-600 focus:outline-hidden" />
              <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </span>
          </label>
          <button type="submit" disabled={isLoading} className="w-full mt-3 py-3.5 px-4 bg-[#c21a1a] hover:bg-[#d61f1f] text-white font-black text-sm tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> VERIFICANDO...</> : 'ACCEDER'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button type="button" onClick={() => { setRecoveryEmail(email); setRecoveryMessage(''); setIsForgotModalOpen(true); }} className="text-xs text-zinc-400 hover:text-zinc-200 font-medium">¿Olvidaste tu contraseña?</button>
        </div>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600">Acceso protegido por Firebase Authentication. Si no tienes cuenta, solicita acceso al administrador de tu escuela.</p>
      </div>

      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="recovery-title" className="bg-[#101014] border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button aria-label="Cerrar" onClick={() => setIsForgotModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center"><HelpCircle className="w-5 h-5" /></div><div><h2 id="recovery-title" className="text-base font-bold text-white">Recuperación de acceso</h2><p className="text-xs text-zinc-400">Portal institucional AulaControl</p></div></div>
            <form onSubmit={handlePasswordReset} className="space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">Introduce el correo asociado a tu cuenta. La recuperación requiere que esté habilitada en Firebase Authentication.</p>
              <input type="email" required value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} placeholder="usuario@escuela.edu.mx" className="w-full px-3.5 py-2.5 text-sm bg-[#17171d] border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-600" />
              {recoveryMessage && <div role="status" className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{recoveryMessage}</span></div>}
              <button type="submit" disabled={isRecovering} className="w-full py-2.5 bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50">{isRecovering ? 'ENVIANDO...' : 'Enviar instrucciones'}</button>
              <button type="button" onClick={() => setIsForgotModalOpen(false)} className="w-full py-2 text-xs text-zinc-400 hover:text-white">Regresar al inicio de sesión</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
