import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(currentDir, 'dist');
const port = Number(process.env.PORT) || 8080;
app.use(express.json({ limit: '32kb' }));

const firebaseConfig = JSON.parse(
  await readFile(new URL('./firebase-applet-config.json', import.meta.url), 'utf8')
);
const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({ projectId: firebaseConfig.projectId });
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

const validRoles = new Set(['director', 'orientador', 'teacher', 'student']);
const entityCollections = {
  orientador: 'orientadores',
  teacher: 'teachers',
  student: 'students',
};

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, service: 'aulacontrol' });
});

app.post('/api/admin/provision-account', async (req, res) => {
  let createdUid;
  try {
    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'Se requiere una sesión autenticada.' });

    const decoded = await adminAuth.verifyIdToken(match[1]);
    const callerSnap = await adminDb.collection('users').doc(decoded.uid).get();
    if (!callerSnap.exists) return res.status(403).json({ error: 'El perfil del usuario no está autorizado.' });
    const caller = callerSnap.data();
    const callerRole = caller?.role;
    if (!['superadmin', 'director'].includes(callerRole)) {
      return res.status(403).json({ error: 'Solo dirección o superadministración puede crear accesos.' });
    }

    const role = typeof req.body?.role === 'string' ? req.body.role.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const schoolId = typeof req.body?.schoolId === 'string' ? req.body.schoolId.trim() : '';
    const linkedEntityId = typeof req.body?.linkedEntityId === 'string' ? req.body.linkedEntityId.trim() : '';

    if (!validRoles.has(role)) return res.status(400).json({ error: 'Rol de cuenta no válido.' });
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Correo electrónico no válido.' });
    }
    if (!name || name.length > 160 || !/^[A-Za-z0-9_-]{1,128}$/.test(schoolId)) {
      return res.status(400).json({ error: 'Nombre o identificador de plantel no válido.' });
    }
    if (callerRole === 'director' && (caller.schoolId !== schoolId || role === 'director')) {
      return res.status(403).json({ error: 'Dirección solo puede crear accesos de su propio plantel para personal y alumnos.' });
    }

    const schoolSnap = await adminDb.collection('schools').doc(schoolId).get();
    if (!schoolSnap.exists) return res.status(404).json({ error: 'No se encontró el plantel.' });
    if (schoolSnap.data()?.status === 'suspended') {
      return res.status(403).json({ error: 'El plantel está suspendido y no puede recibir nuevas cuentas.' });
    }

    if (role === 'director') {
      const school = schoolSnap.data();
      if (callerRole !== 'superadmin') return res.status(403).json({ error: 'Solo superadministración puede crear una cuenta de dirección.' });
      if (String(school?.directorEmail || '').trim().toLowerCase() !== email ||
          String(school?.directorName || '').trim() !== name) {
        return res.status(400).json({ error: 'El correo y nombre deben coincidir con los datos de dirección registrados en el plantel.' });
      }
    } else {
      if (!linkedEntityId || !/^[A-Za-z0-9_-]{1,128}$/.test(linkedEntityId)) {
        return res.status(400).json({ error: 'Se requiere vincular la cuenta a una ficha escolar válida.' });
      }
      const collection = entityCollections[role];
      const entitySnap = await adminDb.collection(collection).doc(linkedEntityId).get();
      if (!entitySnap.exists) return res.status(404).json({ error: 'No se encontró la ficha escolar que se desea vincular.' });
      const entity = entitySnap.data();
      if (entity?.schoolId !== schoolId || entity?.active === false) {
        return res.status(403).json({ error: 'La ficha debe estar activa y pertenecer al plantel indicado.' });
      }
      const entityEmail = typeof entity?.email === 'string' ? entity.email.trim().toLowerCase() : '';
      const entityName = typeof entity?.name === 'string' ? entity.name.trim() : '';
      if ((entityEmail && entityEmail !== email) || (entityName && entityName !== name)) {
        return res.status(400).json({ error: 'El nombre y correo deben coincidir con la ficha escolar vinculada.' });
      }
    }

    try {
      const existingAuthUser = await adminAuth.getUserByEmail(email);
      const existingProfileSnap = await adminDb.collection('users').doc(existingAuthUser.uid).get();
      const existingProfile = existingProfileSnap.data();
      if (existingProfileSnap.exists
        && existingProfile?.role === role
        && existingProfile?.schoolId === schoolId
        && (existingProfile?.linkedEntityId || '') === linkedEntityId) {
        return res.status(200).json({
          ok: true,
          uid: existingAuthUser.uid,
          email,
          role,
          alreadyProvisioned: true,
          passwordSetupRequired: true,
          message: 'La cuenta ya está vinculada correctamente. Puede reenviarse el correo de configuración de contraseña.',
        });
      }
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo, pero no coincide con esta ficha escolar. No se vinculó ni modificó.' });
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;
    }

    const authUser = await adminAuth.createUser({
      email,
      displayName: name,
      emailVerified: false,
      disabled: false,
    });
    createdUid = authUser.uid;

    try {
      await adminDb.collection('users').doc(authUser.uid).create({
        uid: authUser.uid,
        email,
        username: email,
        name,
        title: role === 'teacher' ? 'Docente' : role === 'student' ? 'Alumno' : role === 'orientador' ? 'Orientador' : 'Director',
        role,
        schoolId,
        ...(linkedEntityId ? { linkedEntityId } : {}),
        status: 'pending_password_setup',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        createdBy: decoded.uid,
      });
    } catch (error) {
      await adminAuth.deleteUser(authUser.uid).catch(() => {});
      createdUid = undefined;
      throw error;
    }

    return res.status(201).json({
      ok: true,
      uid: authUser.uid,
      email,
      role,
      passwordSetupRequired: true,
      message: 'Cuenta creada. Debe enviarse el correo de configuración de contraseña antes de entregar el acceso.',
    });
  } catch (error) {
    console.error('Account provisioning failed:', error);
    if (createdUid) await adminAuth.deleteUser(createdUid).catch(() => {});
    return res.status(500).json({ error: 'No se pudo crear la cuenta. Revisa los registros del servidor.' });
  }
});

app.use(express.static(distDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`AulaControl listening on port ${port}`);
});
