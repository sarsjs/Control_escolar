import fs from "node:fs";
import {
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
import test, { after, before, beforeEach } from "node:test";
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
    await setDoc(doc(db, "notifications", "notification-a"), {
      schoolId: "school-a", targetUserId: "student-user",
      message: "Emulator fixture only", createdAt: "2026-10-26T12:00:00Z",
    });
  });
});

const asUser = (uid) => testEnv.authenticatedContext(uid).firestore();

test("unauthenticated users cannot read protected records", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "students", "student-a")));
  await assertFails(getDoc(doc(db, "groups", "group-a")));
});

test("users cannot promote their own profile or change their school role", async () => {
  const db = asUser("student-user");
  await assertFails(updateDoc(doc(db, "users", "student-user"), { role: "superadmin" }));
  await assertFails(updateDoc(doc(db, "users", "student-user"), { schoolId: "school-b" }));
});

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

test("student cannot submit or alter ETA fields directly on their enrollment", async () => {
  const db = asUser("student-user");
  await assertFails(updateDoc(doc(db, "students", "student-a"), {
    etaMinutes: 15, etaReason: "Late bus", currentStatus: "en_route_delayed",
  }));
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

test("director cannot move an existing group into another school", async () => {
  const db = asUser("director-a");
  await assertFails(updateDoc(doc(db, "groups", "group-a"), { schoolId: "school-b" }));
  await assertFails(updateDoc(doc(db, "groups", "group-b"), { name: "Renamed by school A" }));
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

test("director cannot resolve a dispute belonging to another school", async () => {
  const db = asUser("director-b");
  await assertFails(updateDoc(doc(db, "disputes", "dispute-a"), {
    status: "rejected", resolvedBy: "director-b", resolvedAt: "2026-10-26T12:00:00Z",
    resolutionNotes: "Not authorized",
  }));
});

test("students and teachers cannot read or create notifications directly", async () => {
  const studentDb = asUser("student-user");
  const teacherDb = asUser("teacher-a");
  await assertFails(getDoc(doc(studentDb, "notifications", "notification-a")));
  await assertFails(getDoc(doc(teacherDb, "notifications", "notification-a")));
  await assertFails(setDoc(doc(studentDb, "notifications", "student-notification"), {
    schoolId: "school-a", targetUserId: "student-user", message: "Spoofed",
  }));
  await assertFails(setDoc(doc(teacherDb, "notifications", "teacher-notification"), {
    schoolId: "school-a", targetUserId: "student-user", message: "Spoofed",
  }));
});

test("director cannot create an audit record attributed to another user", async () => {
  const db = asUser("director-a");
  await assertFails(setDoc(doc(db, "audit_logs", "spoofed-audit"), {
    schoolId: "school-a", studentId: "student-a", groupId: "group-a",
    reason: "Spoofed identity", modifiedById: "director-b", modifiedByRole: "director",
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


test("student can create an ETA report only for their own enrollment and group", async () => {
  const db = asUser("student-user");
  await assertSucceeds(setDoc(doc(db, "eta_reports", "eta-valid"), {
    schoolId: "school-a", studentId: "student-a", studentName: "Test Student",
    groupId: "group-a", groupName: "1A", etaMinutes: 15,
    reason: "Delayed bus", createdAt: new Date(), status: "pending",
  }));
  await assertFails(setDoc(doc(db, "eta_reports", "eta-spoofed"), {
    schoolId: "school-b", studentId: "student-b", studentName: "Other Student",
    groupId: "group-b", groupName: "1B", etaMinutes: 15,
    reason: "Spoofed", createdAt: new Date(), status: "pending",
  }));
  await assertFails(setDoc(doc(db, "eta_reports", "eta-invalid-minutes"), {
    schoolId: "school-a", studentId: "student-a", studentName: "Test Student",
    groupId: "group-a", groupName: "1A", etaMinutes: 999,
    reason: "Invalid ETA", createdAt: new Date(), status: "pending",
  }));
});

test("ETA reports are readable only by their student or authorized staff in the same school", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "eta_reports", "eta-a"), {
      schoolId: "school-a", studentId: "student-a", studentName: "Test Student",
      groupId: "group-a", groupName: "1A", etaMinutes: 15,
      reason: "Bus", createdAt: new Date(), status: "pending",
    });
  });
  await assertSucceeds(getDoc(doc(asUser("student-user"), "eta_reports", "eta-a")));
  await assertSucceeds(getDoc(doc(asUser("teacher-a"), "eta_reports", "eta-a")));
  await assertFails(getDoc(doc(asUser("director-b"), "eta_reports", "eta-a")));
});

test("ETA reports cannot be edited or deleted by the student", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "eta_reports", "eta-a"), {
      schoolId: "school-a", studentId: "student-a", studentName: "Test Student",
      groupId: "group-a", groupName: "1A", etaMinutes: 15,
      reason: "Bus", createdAt: new Date(), status: "pending",
    });
  });
  const db = asUser("student-user");
  await assertFails(updateDoc(doc(db, "eta_reports", "eta-a"), { etaMinutes: 1 }));
  await assertFails(deleteDoc(doc(db, "eta_reports", "eta-a")));
});

