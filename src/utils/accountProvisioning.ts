import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export type ProvisionableRole = 'orientador' | 'teacher' | 'student';

export async function provisionSchoolAccount(input: {
  role: ProvisionableRole;
  schoolId: string;
  linkedEntityId: string;
  email: string;
  name: string;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const token = await currentUser.getIdToken();
  const response = await fetch('/api/admin/provision-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok !== true) {
    throw new Error(typeof result?.error === 'string' ? result.error : 'No se pudo crear la cuenta.');
  }

  try {
    await sendPasswordResetEmail(auth, input.email.trim().toLowerCase());
  } catch {
    throw new Error('La cuenta quedó creada y vinculada, pero Firebase no pudo enviar el correo de configuración. Verifica el dominio autorizado y usa la recuperación de contraseña para reenviarlo.');
  }
}
