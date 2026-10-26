import fs from "node:fs";
import {
  after,
  before,
  beforeEach,
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import test from "node:test";
import assert from "node:assert/strict";

const PROJECT_ID = "demo-aulacontrol-rules-test";
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "director-a"), {
      role: "director", schoolId: "school-a", email: "director-a@example.test",
    });
    await setDoc(doc(db, "users", "teacher-a"), {
      role: "teacher", schoolId: "school-a", email: "teacher-a@example.test",
    });
    await setDoc(doc(db, "users", "director-b"), {
      role: "director", schoolId: "school-b", email: "director-b@example.test",
    });
    await setDoc(doc(db, "users", "student-user"), {
      role: "student", schoolId: "school-a", linkedEntityId: "student-a",
      email: "student@example.test",
    });
    await setDoc(doc(db, "students", "student-a"), {
      schoolId: "school-a", groupId: "group-a", name: "Test Student",
    });
    await setDoc(doc(db, "students", "student-b"), {
      schoolId: "school-b", groupId: "group-b", name: "Other Student",
    });
    await setDoc(doc(db, "groups", "group-a"), {
      schoolId: "school-a", name: "1A",
    });
    await setDoc(doc(db, "groups", "group-b"), {
      schoolId: "school-b", name: "1B",
    });
    await setDoc(doc(db, "disputes", "dispute-a"), {
      schoolId: "school-a", studentId: "student-a", groupId: "group-a",
      studentReason: "Attendance needs review", attendanceId: "attendance-1",
      date: "2026-10-26", status: "pending",
    });
    await setDoc(doc(db, "audit_logs", "audit-a"), {
      schoolId: "school-a", studentId: "student-a", groupId: "group-a",
      reason: "Correction", modifiedById: "director-a",
      modifiedByRole: "director",
    });
  });
});

const asUser = (uid) => testEnv.authenticatedContext(uid).firestore();

test("student can read their own enrollment but not another student's enrollment", async () => {
  const db = asUser("student-user");
  await assertSucceeds(getDoc(doc(db, "students", "student-a")));
  await assertFails(getDoc(doc(db, "students", "student-b")));
});

test("school staff cannot read student records from another school", async () => {
  const db = asUser("teacher-a");
  await assertFails(getDoc(doc(db, "students", "student-b")));
});

test("student cannot write attendance or enrollment fields directly", async () => {
  const db = asUser("student-user");
  await assertFails(updateDoc(doc(db, "students", "student-a"), { attendance: {} }));
});

test("director can create a group only for their own school", async () => {
  const db = asUser("director-a");
  await assertSucceeds(setDoc(doc(db, "groups", "new-group-a"), {
    schoolId: "school-a", name: "2A",
  }));
  await assertFails(setDoc(doc(db, "groups", "new-group-b"), {
    schoolId: "school-b", name: "2A",
  }));
});

test("student can submit an attendance dispute only for their linked enrollment", async () => {
  const db = asUser("student-user");
  await assertSucceeds(setDoc(doc(db, "disputes", "new-dispute"), {
    schoolId: "school-a", studentId: "student-a", groupId: "group-a",
    studentReason: "Please review my attendance", attendanceId: "attendance-2",
    date: "2026-10-26", status: "pending",
  }));
  await assertFails(setDoc(doc(db, "disputes", "for-another-student"), {
    schoolId: "school-b", studentId: "student-b", groupId: "group-b",
    studentReason: "Please review", attendanceId: "attendance-3",
    date: "2026-10-26", status: "pending",
  }));
});

test("school director may resolve a dispute without changing submitted evidence", async () => {
  const db = asUser("director-a");
  await assertSucceeds(updateDoc(doc(db, "disputes", "dispute-a"), {
    status: "approved", resolvedBy: "director-a", resolvedAt: "2026-10-26T12:00:00Z",
    resolutionNotes: "Reviewed",
  }));
  await assertFails(updateDoc(doc(db, "disputes", "dispute-a"), {
    studentReason: "Changed evidence",
  }));
});

test("audit records cannot be edited or deleted, even by school director", async () => {
  const db = asUser("director-a");
  await assertFails(updateDoc(doc(db, "audit_logs", "audit-a"), { reason: "Tampered" }));
  await assertFails(deleteDoc(doc(db, "audit_logs", "audit-a")));
});

test("ordinary school staff cannot create unrestricted notifications", async () => {
  const db = asUser("teacher-a");
  await assertFails(setDoc(doc(db, "notifications", "notification-a"), {
    message: "Test", schoolId: "school-a",
  }));
});
