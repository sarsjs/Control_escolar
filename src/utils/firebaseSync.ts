import {
  collection,
  doc,
  where,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import { Student, SchoolGroup, AuditLogEntry, AttendanceDispute, SystemNotification, SchoolInstitution } from '../types';

export { testFirestoreConnection };

/**
 * Save a real school group to Firestore.
 */
export async function syncGroupToCloud(group: SchoolGroup) {
  await setDoc(doc(db, 'groups', group.id), group, { merge: true });
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

/**
 * Sync single student update to Firestore
 */
export async function syncStudentToCloud(student: Student) {
  const path = `students/${student.id}`;
  try {
    await setDoc(doc(db, 'students', student.id), student, { merge: true });
  } catch (error) {
    console.warn(`Cloud sync for student ${student.id} deferred:`, error);
  }
}

/**
 * Record immutable audit log entry in Firestore
 */
export async function recordAuditLogToCloud(entry: AuditLogEntry) {
  const path = `audit_logs/${entry.id}`;
  try {
    await setDoc(doc(db, 'audit_logs', entry.id), entry);
  } catch (error) {
    console.warn('Audit log cloud recording deferred:', error);
  }
}

/**
 * Save dispute to Firestore
 */
export async function recordDisputeToCloud(dispute: AttendanceDispute) {
  const path = `disputes/${dispute.id}`;
  try {
    await setDoc(doc(db, 'disputes', dispute.id), dispute, { merge: true });
  } catch (error) {
    console.warn('Dispute cloud recording deferred:', error);
  }
}

/**
 * Broadcast notification to Firestore
 */
export async function pushNotificationToCloud(notification: SystemNotification) {
  const path = `notifications/${notification.id}`;
  try {
    await setDoc(doc(db, 'notifications', notification.id), notification);
  } catch (error) {
    console.warn('Notification cloud broadcast deferred:', error);
  }
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
  const path = `schools/${school.id}`;
  try {
    await setDoc(doc(db, 'schools', school.id), school, { merge: true });
  } catch (error) {
    console.warn(`Cloud sync for school ${school.id} deferred:`, error);
  }
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

