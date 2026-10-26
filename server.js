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

// Use the same named Firestore database as the web client. App Hosting's
// runtime service identity supplies Application Default Credentials.
const firebaseConfig = JSON.parse(
  await readFile(new URL('./firebase-applet-config.json', import.meta.url), 'utf8')
);
const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({ projectId: firebaseConfig.projectId });
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

app.post('/api/admin/provision-director', async (req, res) => {
  let createdUid;
  try {
    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'Se requiere una sesión autenticada.' });

    const decoded = await adminAuth.verifyIdToken(match[1]);
    const adminProfileSnap = await adminDb.collection('users').doc(decoded.uid).get();
    if (!adminProfileSnap.exists || adminProfileSnap.data()?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el superadministrador puede aprovisionar directores.' });
    }

    const schoolId = typeof req.body?.schoolId === 'string' ? req.body.schoolId.trim() : '';
    if (!/^sch-[A-Za-z0-9-]{1,100}$/.test(schoolId)) {
      return res.status(400).json({ error: 'Identificador de plantel no válido.' });
    }
    const schoolSnap = await adminDb.collection('schools').doc(schoolId).get();
    if (!schoolSnap.exists) return res.status(404).json({ error: 'No se encontró el plantel registrado.' });

    const school = schoolSnap.data();
    const email = typeof school?.directorEmail === 'string' ? school.directorEmail.trim().toLowerCase() : '';
    const name = typeof school?.directorName === 'string' ? school.directorName.trim() : '';
    if (!email || !name || email.length > 254 || !email.includes('@')) {
      return res.status(400).json({ error: 'El plantel no tiene un correo y nombre de director válidos.' });
    }

    let authUser;
    let alreadyProvisioned = false;
    try {
      authUser = await adminAuth.getUserByEmail(email);
      const existingProfileSnap = await adminDb.collection('users').doc(authUser.uid).get();
      const existingProfile = existingProfileSnap.data();
      if (!existingProfileSnap.exists
        || existingProfile?.role !== 'director'
        || existingProfile?.schoolId !== schoolId
        || String(existingProfile?.email || '').toLowerCase() !== email) {
        return res.status(409).json({
          error: 'Ese correo ya está asociado a una cuenta. Revisa el usuario existente antes de vincularlo a este plantel.'
        });
      }
      alreadyProvisioned = true;
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;
    }

    if (!authUser) {
      authUser = await adminAuth.createUser({
        email,
        displayName: name,
        emailVerified: false,
        disabled: false
      });
      createdUid = authUser.uid;
    }

    try {
      await adminDb.collection('users').doc(authUser.uid).set({
        uid: authUser.uid,
        email,
        username: email,
        name,
        title: 'Director',
        role: 'director',
        schoolId,
        status: 'pending_password_setup',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        createdBy: decoded.uid
      }, { merge: true });
    } catch (error) {
      if (createdUid) await adminAuth.deleteUser(createdUid).catch(() => {});
      throw error;
    }

    return res.status(200).json({
      ok: true,
      alreadyProvisioned,
      email,
      message: alreadyProvisioned
        ? 'La cuenta del director ya estaba vinculada a este plantel.'
        : 'La cuenta del director fue creada.'
    });
  } catch (error) {
    console.error('Director provisioning failed:', error);
    return res.status(500).json({ error: 'No se pudo aprovisionar al director. Revisa los registros del servidor.' });
  }
});

// Serve the client app after API routes.
app.use(express.static(distDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`AulaControl listening on port ${port}`);
});
