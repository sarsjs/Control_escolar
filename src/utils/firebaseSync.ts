import {
  collection,
  doc,
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
 * Seed initial students into Firestore if collection is empty
 */
export async function seedInitialDataIfEmpty(
  initialStudents: Student[],
  initialGroups: SchoolGroup[]
) {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    if (studentsSnap.empty) {
      console.log('Seeding initial students to Firestore...');
      for (const st of initialStudents) {
        await setDoc(doc(db, 'students', st.id), st);
      }
      for (const grp of initialGroups) {
        await setDoc(doc(db, 'groups', grp.id), grp);
      }
      console.log('Firestore initialized with master academic data.');
    }
  } catch (error) {
    console.warn('Initial data seeding note:', error);
  }
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
export function subscribeToStudents(onUpdate: (students: Student[]) => void) {
  const path = 'students';
  try {
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Student[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Student);
          });
          onUpdate(list);
        }
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
export function subscribeToSchools(onUpdate: (schools: SchoolInstitution[]) => void) {
  const path = 'schools';
  try {
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SchoolInstitution[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as SchoolInstitution);
          });
          onUpdate(list);
        }
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

