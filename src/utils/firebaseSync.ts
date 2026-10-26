import {
  collection,
  doc,
  type Query,
  where,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import { Student, SchoolGroup, AuditLogEntry, AttendanceDispute, SystemNotification, SchoolInstitution, EtaReport } from '../types';

export { testFirestoreConnection };

/**
 * Save a real school group to Firestore.
 */
export async function syncGroupToCloud(group: SchoolGroup) {
  await setDoc(doc(db, 'groups', group.id), { ...group, teacherIds: [...new Set(group.schedule.map((slot) => slot.teacherId).filter(Boolean))] }, { merge: true });
}

/**
 * Subscribe to real-time school group updates.
 */
export function subscribeToGroups(
  schoolId: string | undefined,
  isSuperAdmin: boolean,
  onUpdate: (groups: SchoolGroup[]) => void
) {
  // Non-superadmins must never fall back to an unscoped collection query.
  if (!isSuperAdmin && !schoolId) {
    onUpdate([]);
    return () => {};
  }
  const groupsRef = collection(db, 'groups');
  const scopedQuery = isSuperAdmin ? groupsRef : query(groupsRef, where('schoolId', '==', schoolId));
  return onSnapshot(
    scopedQuery,
    (snapshot) => onUpdate(snapshot.docs.map((item) => item.data() as SchoolGroup)),
    (error) => console.warn('Firestore realtime group subscription error:', error)
  );
}

/** Subscribe a student only to their own enrollment record. */
export function subscribeToStudentById(
  studentId: string | undefined,
  onUpdate: (student: Student | null) => void
) {
  if (!studentId) {
    onUpdate(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'students', studentId),
    (snapshot) => onUpdate(snapshot.exists() ? snapshot.data() as Student : null),
    (error) => console.warn('Firestore own-student subscription error:', error)
  );
}

/** Subscribe a student only to the group referenced by their own enrollment. */
export function subscribeToGroupById(
  groupId: string | undefined,
  onUpdate: (group: SchoolGroup | null) => void
) {
  if (!groupId) {
    onUpdate(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'groups', groupId),
    (snapshot) => onUpdate(snapshot.exists() ? snapshot.data() as SchoolGroup : null),
    (error) => console.warn('Firestore assigned-group subscription error:', error)
  );
}

/**
 * Sync single student update to Firestore
 */
export async function syncStudentToCloud(student: Student) {
  await setDoc(doc(db, 'students', student.id), student, { merge: true });
}

/** Atomically save an attendance correction and its immutable audit record. */
export async function syncAttendanceCorrectionToCloud(student: Student, entry: AuditLogEntry) {
  if (!student.schoolId || entry.schoolId !== student.schoolId || !entry.modifiedById) {
    throw new Error('La corrección requiere escuela y usuario autenticado válidos.');
  }
  const batch = writeBatch(db);
  batch.set(doc(db, 'students', student.id), student, { merge: true });
  batch.set(doc(db, 'audit_logs', entry.id), entry);
  await batch.commit();
}

/**
 * Save dispute to Firestore
 */
export async function recordDisputeToCloud(dispute: AttendanceDispute) {
  await setDoc(doc(db, 'disputes', dispute.id), dispute, { merge: true });
}


/** Save an ETA report separately; it never mutates enrollment or attendance. */
export async function createEtaReport(report: Omit<EtaReport, 'id' | 'createdAt' | 'status'>) {
  const ref = await addDoc(collection(db, 'eta_reports'), {
    ...report,
    createdAt: serverTimestamp(),
    status: 'pending',
  });
  return ref.id;
}

/** Subscribe only to reports the signed-in user is authorized to receive. */
export function subscribeToEtaReports(
  schoolId: string | undefined,
  isSuperAdmin: boolean,
  studentId: string | undefined,
  role: string,
  assignedGroupIds: string[],
  onUpdate: (reports: EtaReport[]) => void
) {
  const reportsRef = collection(db, 'eta_reports');
  const activeUnsubscribes: (() => void)[] = [];
  const reportsByQuery = new Map<string, EtaReport[]>();
  const emit = () => {
    const merged = new Map<string, EtaReport>();
    reportsByQuery.forEach((reports) => reports.forEach((report) => merged.set(report.id, report)));
    onUpdate([...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  };
  const listen = (key: string, q: Query) => {
    activeUnsubscribes.push(onSnapshot(q, (snapshot) => {
      reportsByQuery.set(key, snapshot.docs.map((item) => {
        const data = item.data();
        const createdAt = data.createdAt?.toDate?.();
        return { ...data, id: item.id, createdAt: createdAt instanceof Date ? createdAt.toISOString() : '' } as EtaReport;
      }));
      emit();
    }, (error) => {
      console.warn('Firestore ETA report subscription error:', error);
      reportsByQuery.set(key, []);
      emit();
    }));
  };
  if (role === 'student') {
    if (studentId) listen('student', query(reportsRef, where('studentId', '==', studentId)));
  } else if (isSuperAdmin) {
    listen('superadmin', query(reportsRef));
  } else if (role === 'director' && schoolId) {
    listen('director', query(reportsRef, where('schoolId', '==', schoolId)));
  } else if (schoolId && ['orientador', 'teacher'].includes(role)) {
    [...new Set(assignedGroupIds)].forEach((groupId) => {
      listen(groupId, query(reportsRef, where('schoolId', '==', schoolId), where('groupId', '==', groupId)));
    });
  } else {
    onUpdate([]);
  }
  return () => activeUnsubscribes.forEach((unsubscribe) => unsubscribe());
}

/**
 * Subscribe to real-time student updates across all devices
 */
export function subscribeToStudents(
  schoolId: string | undefined,
  isSuperAdmin: boolean,
  onUpdate: (students: Student[]) => void
) {
  const path = 'students';
  // Non-superadmins must never fall back to an unscoped collection query.
  if (!isSuperAdmin && !schoolId) {
    onUpdate([]);
    return () => {};
  }
  try {
    const studentsRef = collection(db, path);
    const scopedQuery = isSuperAdmin ? studentsRef : query(studentsRef, where('schoolId', '==', schoolId));
    const unsubscribe = onSnapshot(
      scopedQuery,
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Student);
        });
        // An empty collection is meaningful: clear stale or demo attendance rows.
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore realtime student subscription fallback:', error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Realtime listener error:', error);
    return () => {};
  }
}

/**
 * Sync school institution configuration to Firestore
 */
export async function syncSchoolToCloud(school: SchoolInstitution) {
  await setDoc(doc(db, 'schools', school.id), school, { merge: true });
}

/**
 * Subscribe to real-time schools list
 */
export function subscribeToSchools(
  schoolId: string | undefined,
  isSuperAdmin: boolean,
  onUpdate: (schools: SchoolInstitution[]) => void
) {
  const path = 'schools';
  // A school user listens only to their own school document.
  if (!isSuperAdmin) {
    if (!schoolId) {
      onUpdate([]);
      return () => {};
    }
    return onSnapshot(
      doc(db, path, schoolId),
      (snapshot) => onUpdate(snapshot.exists() ? [snapshot.data() as SchoolInstitution] : []),
      (error) => console.warn('Firestore realtime school subscription error:', error)
    );
  }
  try {
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: SchoolInstitution[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as SchoolInstitution);
        });
        // An empty collection must clear stale local state; never preserve old schools.
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore realtime schools subscription fallback:', error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Realtime schools listener error:', error);
    return () => {};
  }
}


/** Subscribe to disputes within one school or one student's own records. */
export function subscribeToDisputes(
  schoolId: string | undefined,
  isSuperAdmin: boolean,
  studentId: string | undefined,
  isStudent: boolean,
  onUpdate: (disputes: AttendanceDispute[]) => void
) {
  if (isStudent && !studentId) {
    onUpdate([]);
    return () => {};
  }
  if (!isSuperAdmin && !isStudent && !schoolId) {
    onUpdate([]);
    return () => {};
  }
  const disputesRef = collection(db, 'disputes');
  const scopedQuery = isSuperAdmin
    ? disputesRef
    : query(disputesRef, where(isStudent ? 'studentId' : 'schoolId', '==', isStudent ? studentId : schoolId));
  return onSnapshot(
    scopedQuery,
    (snapshot) => onUpdate(snapshot.docs.map((item) => item.data() as AttendanceDispute)),
    (error) => console.warn('Firestore dispute subscription error:', error)
  );
}

/** Persist a dispute decision and optional attendance correction as one Firestore batch. */
export async function resolveDisputeToCloud(dispute: AttendanceDispute, student?: Student, auditEntry?: AuditLogEntry) {
  if (!dispute.schoolId) throw new Error('La solicitud no tiene escuela asignada.');
  if ((student && !auditEntry) || (!student && auditEntry)) throw new Error('La corrección requiere alumno y auditoría juntos.');
  if (student && (student.schoolId !== dispute.schoolId || student.id !== dispute.studentId || auditEntry?.schoolId !== dispute.schoolId || auditEntry?.studentId !== dispute.studentId || !auditEntry.modifiedById)) {
    throw new Error('La solicitud, el alumno y la auditoría no corresponden.');
  }
  const batch = writeBatch(db);
  batch.set(doc(db, 'disputes', dispute.id), dispute, { merge: true });
  if (student && auditEntry) {
    batch.set(doc(db, 'students', student.id), student, { merge: true });
    batch.set(doc(db, 'audit_logs', auditEntry.id), auditEntry);
  }
  await batch.commit();
}
