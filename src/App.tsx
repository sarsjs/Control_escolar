import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  UserAccount,
  UserRole,
  Orientador,
  Teacher,
  SchoolGroup,
  Student,
  GroupScheduleItem,
  SystemNotification,
  AuditLogEntry,
  AttendanceDispute,
  StudentPresenceStatus,
  SchoolInstitution,
} from './types';
/* Real school records are loaded from Firestore; mock fixtures are intentionally not imported. */
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { StudentAppView } from './components/StudentAppView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { OrientadorDashboardView } from './components/OrientadorDashboardView';
import { DirectorDashboardView } from './components/DirectorDashboardView';
import { SuperAdminDashboardView } from './components/SuperAdminDashboardView';
import { EtaPromptModal } from './components/EtaPromptModal';
import { ClassCheckinModal } from './components/ClassCheckinModal';
import { DisputeModal } from './components/DisputeModal';
import { NotificationToast } from './components/NotificationToast';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Cloud, CloudCheck } from 'lucide-react';
import {
  testFirestoreConnection,
  syncStudentToCloud,
  recordAuditLogToCloud,
  recordDisputeToCloud,
  pushNotificationToCloud,
  subscribeToStudents,
  subscribeToStudentById,
  subscribeToGroupById,
  syncSchoolToCloud,
  subscribeToSchools,
  syncGroupToCloud,
  subscribeToGroups,
} from './utils/firebaseSync';

export default function App() {
  // Schools State (Multi-tenant SaaS)
  // School records are loaded from Firestore after authentication; never mix cached demo schools into the real tenant list.
  const [schools, setSchools] = useState<SchoolInstitution[]>([]);
  const [currentSchool, setCurrentSchool] = useState<SchoolInstitution | null>(null);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);

  // Never grant a role from localStorage alone. A session must start at the login screen.
  // The cached profile is not an authentication credential and can be edited by the browser user.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Master Academic State with Local Storage persistence
  const [orientadores, setOrientadores] = useState<Orientador[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<SchoolGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [disputes, setDisputes] = useState<AttendanceDispute[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Use the device's real local time for audit and notification timestamps.
  const [simulatedTime, setSimulatedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  );
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSimulatedTime(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Modals
  const [etaModalOpen, setEtaModalOpen] = useState<boolean>(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState<boolean>(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState<boolean>(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState<boolean>(false);

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Restore the authenticated Firebase session and verify its school profile on every load.
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (active) setCurrentUser(null);
        return;
      }

      try {
        const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
        const profile = profileSnapshot.data();
        const validRoles: UserRole[] = ['superadmin', 'director', 'orientador', 'teacher', 'student'];
        if (!profileSnapshot.exists() || typeof profile?.role !== 'string' || !validRoles.includes(profile.role as UserRole)) {
          await signOut(auth);
          if (active) setCurrentUser(null);
          return;
        }

        const role = profile.role as UserRole;
        const profileName = typeof profile.name === 'string'
          ? profile.name
          : (firebaseUser.displayName || firebaseUser.email || 'Usuario');
        const profileAvatar = typeof profile.avatar === 'string' ? profile.avatar : '';
        const schoolId = typeof profile.schoolId === 'string' ? profile.schoolId : undefined;
        const linkedEntityId = typeof profile.linkedEntityId === 'string' ? profile.linkedEntityId : undefined;

        if (active) {
          setCurrentUser({
            id: firebaseUser.uid,
            username: typeof profile.username === 'string' ? profile.username : (firebaseUser.email || ''),
            name: profileName,
            email: firebaseUser.email || '',
            role,
            avatar: profileAvatar,
            title: typeof profile.title === 'string' ? profile.title : role,
            ...(schoolId ? { schoolId } : {}),
            ...(linkedEntityId ? { linkedEntityId } : {}),
          });

          // Hydrate the signed-in staff member's own operational profile from the
          // authenticated Firestore profile; never fall back to sample staff records.
          if (role === 'orientador' && linkedEntityId) {
            setOrientadores((prev) => {
              const current = {
                id: linkedEntityId,
                name: profileName,
                email: firebaseUser.email || '',
                avatar: profileAvatar,
                phone: typeof profile.phone === 'string' ? profile.phone : '',
                cubicle: typeof profile.cubicle === 'string' ? profile.cubicle : '',
                assignedGroupIds: Array.isArray(profile.assignedGroupIds)
                  ? profile.assignedGroupIds.filter((id: unknown): id is string => typeof id === 'string')
                  : [],
              };
              return [...prev.filter((item) => item.id !== linkedEntityId), current];
            });
          } else if (role === 'teacher' && linkedEntityId) {
            setTeachers((prev) => {
              const current = {
                id: linkedEntityId,
                name: profileName,
                email: firebaseUser.email || '',
                avatar: profileAvatar,
                specialty: typeof profile.specialty === 'string' ? profile.specialty : '',
                assignedGroupIds: Array.isArray(profile.assignedGroupIds)
                  ? profile.assignedGroupIds.filter((id: unknown): id is string => typeof id === 'string')
                  : [],
              };
              return [...prev.filter((item) => item.id !== linkedEntityId), current];
            });
          }
        }
      } catch (error) {
        console.error('No se pudo restaurar el perfil escolar:', error);
        await signOut(auth).catch(() => undefined);
        if (active) setCurrentUser(null);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  // Save session state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aulacontrol_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aulacontrol_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('aulacontrol_schools', JSON.stringify(schools));
  }, [schools]);

  // Firebase data access starts only after Firebase Authentication confirms a profile.
  // Never seed demo students into a real school database automatically.
  useEffect(() => {
    if (!currentUser) {
      setIsCloudConnected(false);
      return;
    }

    testFirestoreConnection().then(setIsCloudConnected);

    // Attendance records must come from Firestore, never from demo fixtures.
    const isSuperAdmin = currentUser.role === 'superadmin';
    let unsubscribeStudents: (() => void) | undefined;
    let unsubscribeGroups: (() => void) | undefined;
    let unsubscribeStudentGroup: (() => void) | undefined;

    if (currentUser.role === 'student') {
      // Students must not query the whole school roster. Read only their own
      // enrollment, then only the group referenced by that enrollment.
      setStudents([]);
      setGroups([]);
      unsubscribeStudents = subscribeToStudentById(currentUser.linkedEntityId, (student) => {
        setStudents(student ? [student] : []);
        if (unsubscribeStudentGroup) {
          unsubscribeStudentGroup();
          unsubscribeStudentGroup = undefined;
        }
        setGroups([]);
        if (student?.groupId) {
          unsubscribeStudentGroup = subscribeToGroupById(student.groupId, (group) => {
            setGroups(group ? [group] : []);
          });
        }
      });
    } else {
      unsubscribeStudents = subscribeToStudents(currentUser.schoolId, isSuperAdmin, (cloudStudents) => {
        setStudents(cloudStudents);
      });
      unsubscribeGroups = subscribeToGroups(currentUser.schoolId, isSuperAdmin, (cloudGroups) => {
        setGroups(cloudGroups);
      });
    }

    // Firestore is the source of truth, including when a school collection is empty.
    const unsubscribeSchools = subscribeToSchools(currentUser.schoolId, isSuperAdmin, (cloudSchools) => {
      setSchools(cloudSchools);
    });

    return () => {
      unsubscribeStudents?.();
      unsubscribeGroups?.();
      unsubscribeStudentGroup?.();
      unsubscribeSchools();
    };
  }, [currentUser?.id]);

  // Helper for notification broadcast
  const pushNotification = (
    type: SystemNotification['type'],
    title: string,
    message: string,
    targetRole: SystemNotification['targetRole'],
    details?: {
      targetUserId?: string;
      groupId?: string;
      orientadorId?: string;
      teacherId?: string;
      studentId?: string;
      actionRequired?: boolean;
    }
  ) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      message,
      timestamp: simulatedTime,
      targetRole,
      read: false,
      ...details,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    pushNotificationToCloud(newNotif);
  };

  // Primary active student (Sofía Morales)
  const currentStudent = currentUser?.role === 'student'
    ? students.find((s) => s.id === currentUser.linkedEntityId)
    : undefined;
  const studentGroup = currentStudent
    ? groups.find((g) => g.id === currentStudent.groupId)
    : undefined;
  const studentOrientador = studentGroup
    ? orientadores.find((o) => o.id === studentGroup.orientadorId || o.id === studentGroup.temporarySubstituteOrientadorId)
    : undefined;
  const studentActiveClass = studentGroup?.schedule?.[0];

  // Primary active teacher
  const currentTeacherUser = currentUser?.role === 'teacher' ? currentUser : undefined;
  const teacherAssignedGroups = currentTeacherUser
    ? groups.filter((g) => g.schedule.some((s) => s.teacherId === currentTeacherUser.linkedEntityId))
    : [];
  const [activeTeacherGroup, setActiveTeacherGroup] = useState<SchoolGroup | null>(null);
  useEffect(() => {
    if (!activeTeacherGroup && teacherAssignedGroups.length > 0) setActiveTeacherGroup(teacherAssignedGroups[0]);
    else if (activeTeacherGroup && !teacherAssignedGroups.some((g) => g.id === activeTeacherGroup.id)) setActiveTeacherGroup(teacherAssignedGroups[0] || null);
  }, [teacherAssignedGroups, activeTeacherGroup]);

  // Primary active orientador (Strict isolation per user)
  const currentOrientadorEntity = orientadores.find((o) => o.id === currentUser?.linkedEntityId);

  // 1. Student ETA submission (routes to Orientador + Teacher)
  const handleStudentSubmitEta = async (minutes: number, reason: string) => {
    if (!currentStudent || !studentGroup) {
      throw new Error('No se encontró una inscripción escolar activa para enviar el aviso.');
    }
    const updatedStudent: Student = {
      ...currentStudent,
      currentStatus: 'en_route_delayed',
      currentZone: 'En camino hacia el plantel',
      etaMinutes: minutes,
      etaReason: reason,
      etaSentAt: simulatedTime,
      lastUpdated: simulatedTime,
    };

    // Do not claim the ETA was sent unless the database accepts it.
    // Current Firestore rules intentionally block direct student writes; a
    // trusted server-side reporting endpoint is required before this is enabled.
    await syncStudentToCloud(updatedStudent);
    setStudents((prev) =>
      prev.map((s) => (s.id === currentStudent.id ? updatedStudent : s))
    );

    if (studentOrientador) {
      pushNotification(
        'orientador_eta_alert',
        `Aviso ETA de ${studentGroup.name}: ${currentStudent.name}`,
        `${currentStudent.name} notificó a Orientación llegada estimada en ~${minutes} min. Motivo: ${reason}. El grupo sabe que no faltará.`,
        'orientador',
        {
          orientadorId: studentOrientador.id,
          groupId: studentGroup.id,
          studentId: currentStudent.id,
        }
      );
    }

    if (studentActiveClass) {
      pushNotification(
        'teacher_eta_alert',
        `Reporte de Demora en tu clase: ${currentStudent.name}`,
        `${currentStudent.name} notificó a ${studentActiveClass.teacherName} llegada estimada en ~${minutes} min (${reason}) para la materia de ${studentActiveClass.subjectName}.`,
        'teacher',
        {
          teacherId: studentActiveClass.teacherId,
          groupId: studentGroup.id,
          studentId: currentStudent.id,
        }
      );
    }

  };

  // GPS arrival and classroom check-in handlers were removed: these events require real verification.

  // 5. Director corrects attendance with immutable audit logging
  const handleDirectorCorrectAttendance = (
    studentId: string,
    newStatus: StudentPresenceStatus,
    reason: string
  ) => {
    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) return;

    const previousStatus = targetStudent.currentStatus;
    const updatedStudent: Student = {
      ...targetStudent,
      currentStatus: newStatus,
      validatedVia: 'director_correction',
      validatedAt: simulatedTime,
      lastUpdated: simulatedTime,
    };

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? updatedStudent : s))
    );
    syncStudentToCloud(updatedStudent);

    // Create immutable audit log entry
    const newAuditLog: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      attendanceId: `att-${studentId}-${Date.now()}`,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      groupId: targetStudent.groupId,
      subjectName: studentActiveClass?.subjectName || 'Matemáticas II',
      previousStatus,
      newStatus,
      modifiedBy: currentUser?.name || 'Dirección General',
      modifiedByRole: currentUser?.role || 'director',
      reason,
      timestamp: simulatedTime,
    };

    setAuditLogs((prev) => [newAuditLog, ...prev]);
    recordAuditLogToCloud(newAuditLog);

    pushNotification(
      'attendance_corrected',
      'Asistencia Corregida por Dirección',
      `La asistencia de ${targetStudent.name} fue modificada de ${previousStatus} a ${newStatus}. Motivo: ${reason}`,
      'orientador',
      { groupId: targetStudent.groupId }
    );
  };

  // 6. Student submits dispute / review request
  const handleStudentSubmitDispute = (reason: string) => {
    if (!currentStudent || !studentGroup) return;
    const newDispute: AttendanceDispute = {
      id: `disp-${Date.now()}`,
      attendanceId: `att-${currentStudent.id}-${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      groupId: currentStudent.groupId,
      subjectName: studentActiveClass?.subjectName || 'Matemáticas II',
      date: '2026-10-22',
      studentReason: reason,
      status: 'pending',
    };

    setDisputes((prev) => [newDispute, ...prev]);
    recordDisputeToCloud(newDispute);

    pushNotification(
      'dispute_requested',
      `Solicitud de Revisión: ${currentStudent.name}`,
      `El alumno ${currentStudent.name} (${studentGroup.name}) solicitó revisión de su asistencia en ${studentActiveClass?.subjectName}. Motivo: "${reason}".`,
      'orientador',
      {
        orientadorId: studentOrientador?.id,
        groupId: studentGroup.id,
      }
    );
  };

  // 7. Resolve dispute by Orientador or Director
  const handleResolveDispute = (disputeId: string, approved: boolean, notes: string) => {
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) return;

    const updatedDispute: AttendanceDispute = {
      ...dispute,
      status: approved ? 'approved' : 'rejected',
      resolvedBy: currentUser?.name,
      resolvedAt: simulatedTime,
      resolutionNotes: notes,
    };

    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? updatedDispute : d))
    );
    recordDisputeToCloud(updatedDispute);

    if (approved) {
      handleDirectorCorrectAttendance(
        dispute.studentId,
        'in_class',
        `Revisión aprobada por ${currentUser?.name}: ${notes}`
      );
    }

    pushNotification(
      'dispute_resolved',
      `Resolución de Revisión de Asistencia`,
      `Tu solicitud para ${dispute.subjectName} fue ${approved ? 'APROBADA' : 'RECHAZADA'} por ${currentUser?.name}. Notas: ${notes}`,
      'student',
      { studentId: dispute.studentId }
    );
  };

  // 8. Director reassigns group
  const handleReassignGroupToOrientador = (groupId: string, newOrientadorId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, orientadorId: newOrientadorId } : g))
    );

    setOrientadores((prev) =>
      prev.map((ori) => {
        if (ori.id === newOrientadorId) {
          return {
            ...ori,
            assignedGroupIds: Array.from(new Set([...ori.assignedGroupIds, groupId])),
          };
        }
        return {
          ...ori,
          assignedGroupIds: ori.assignedGroupIds.filter((id) => id !== groupId),
        };
      })
    );
  };

  // 9. Director assigns temporary substitute orientador
  const handleAssignTemporarySubstitute = (groupId: string, substituteOrientadorId?: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, temporarySubstituteOrientadorId: substituteOrientadorId } : g))
    );
  };

  // 10. Director creates new group
  const handleCreateNewGroup = (name: string, semester: number, orientadorId: string) => {
    const newId = `grp-${Date.now()}`;
    const newGroup: SchoolGroup = {
      id: newId,
      name,
      semester,
      turn: 'Matutino',
      orientadorId,
      ...(currentUser?.schoolId ? { schoolId: currentUser.schoolId } : {}),
      studentIds: [],
      schedule: [],
    };

    setGroups((prev) => [...prev, newGroup]);
    void syncGroupToCloud(newGroup).catch((error) => console.error('No se pudo guardar el grupo en Firestore:', error));
    setOrientadores((prev) =>
      prev.map((o) =>
        o.id === orientadorId ? { ...o, assignedGroupIds: [...o.assignedGroupIds, newId] } : o
      )
    );
  };

  // 11. Orientador updates schedule
  const handleCreateGroupForOrientador = async (name: string, semester: number, turn: 'Matutino' | 'Vespertino') => {
    if (!currentOrientadorEntity || !currentUser?.schoolId) {
      console.error('No se puede crear el grupo: falta vincular al orientador con un plantel real.');
      return;
    }
    const newGroup: SchoolGroup = {
      id: `grp-${Date.now()}`,
      name,
      semester,
      turn,
      orientadorId: currentOrientadorEntity.id,
      schoolId: currentUser.schoolId,
      studentIds: [],
      schedule: [],
    };
    try {
      await syncGroupToCloud(newGroup);
      setGroups((prev) => [...prev, newGroup]);
      setOrientadores((prev) => prev.map((orientador) => orientador.id === currentOrientadorEntity.id
        ? { ...orientador, assignedGroupIds: [...orientador.assignedGroupIds, newGroup.id] }
        : orientador));
    } catch (error) {
      console.error('No se pudo guardar el grupo en Firestore:', error);
    }
  };

  const handleUpdateGroupSchedule = async (groupId: string, newSchedule: GroupScheduleItem[]) => {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;
    const updatedGroup = { ...group, schedule: newSchedule };
    try {
      await syncGroupToCloud(updatedGroup);
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updatedGroup : g)));
    } catch (error) {
      console.error('No se pudo guardar el horario en Firestore:', error);
      return;
    }

    pushNotification(
      'schedule_updated',
      'Horario Escolar Actualizado',
      `Tu Orientador ha actualizado el horario oficial de tu grupo.`,
      'student',
      { groupId }
    );
  };

  // 12. Orientador enrolls individual student
  const handleAddStudentToGroup = async (groupId: string, name: string, matricula: string) => {
    const targetGroup = groups.find((group) => group.id === groupId);
    if (!targetGroup?.schoolId || targetGroup.schoolId !== currentUser?.schoolId) {
      console.error('No se puede inscribir al alumno: el grupo no pertenece al plantel de la sesión.');
      return;
    }
    const newStudentId = `stu-${Date.now()}`;
    const newStudent: Student = {
      id: newStudentId,
      name,
      matricula,
      groupId,
      schoolId: targetGroup.schoolId,
      avatar: '',
      currentStatus: 'outside_school',
      currentZone: 'Sin ubicación registrada',
      distanceToCampusMeters: 0,
      lastUpdated: simulatedTime,
    };
    const updatedGroup = { ...targetGroup, studentIds: [...targetGroup.studentIds, newStudentId] };

    try {
      await syncStudentToCloud(newStudent);
      await syncGroupToCloud(updatedGroup);
      setStudents((prev) => [...prev, newStudent]);
      setGroups((prev) => prev.map((group) => group.id === groupId ? updatedGroup : group));
    } catch (error) {
      console.error('No se pudo completar la inscripción del alumno en Firestore:', error);
    }
  };

  // 13. Import students only after Firestore confirms each write.
  const handleImportStudentsCsv = async (groupId: string, csvData: { name: string; matricula: string }[]) => {
    const targetGroup = groups.find((group) => group.id === groupId);
    if (!targetGroup?.schoolId || targetGroup.schoolId !== currentUser?.schoolId) {
      console.error('Importación cancelada: el grupo no pertenece al plantel de la sesión actual.');
      return;
    }
    if (!csvData.length) return;

    const newStudents: Student[] = csvData.map((row, idx): Student => ({
      id: `stu-csv-${Date.now()}-${idx}`,
      name: row.name.trim(),
      matricula: row.matricula.trim(),
      groupId,
      schoolId: targetGroup.schoolId as string,
      avatar: '',
      currentStatus: 'outside_school',
      currentZone: 'Sin ubicación registrada',
      distanceToCampusMeters: 0,
      lastUpdated: simulatedTime,
    })).filter((student) => student.name && student.matricula);

    if (!newStudents.length) return;
    const updatedGroup = {
      ...targetGroup,
      studentIds: [...targetGroup.studentIds, ...newStudents.map((student) => student.id)],
    };

    try {
      // Save the roster and its group membership before reflecting success in the UI.
      for (const student of newStudents) {
        await syncStudentToCloud(student);
      }
      await syncGroupToCloud(updatedGroup);
      setStudents((prev) => [...prev, ...newStudents]);
      setGroups((prev) => prev.map((group) => group.id === groupId ? updatedGroup : group));
    } catch (error) {
      console.error('La importación no se confirmó en Firestore. Revisa los registros antes de volver a intentarlo:', error);
    }
  };

  // 15. Teacher manual validate with audit
  const handleTeacherManualValidate = (studentId: string) => {
    handleDirectorCorrectAttendance(
      studentId,
      'in_class',
      'Pase de lista presencial por el docente en el aula.'
    );
  };

  // 17. SaaS Multi-School Handlers (Dueño de la App)
  const handleAddSchool = async (newSchool: SchoolInstitution) => {
    try {
      // Do not show a school as registered until Firestore confirms persistence.
      await syncSchoolToCloud(newSchool);
      setCurrentSchool(newSchool);
      setSchools((prev) => [newSchool, ...prev.filter((school) => school.id !== newSchool.id)]);
      pushNotification(
        'info',
        'Nuevo Plantel Escolar Afiliado',
        `Se registró el plantel ${newSchool.name} (CCT: ${newSchool.cct}). El acceso del director deberá aprovisionarse por Firebase Authentication.`,
        'superadmin'
      );
    } catch (error) {
      console.error('No se pudo guardar el plantel en Firestore:', error);
    }
  };

  const handleUpdateSchool = async (updatedSchool: SchoolInstitution) => {
    try {
      // Keep the UI aligned with persisted data if a write is rejected.
      await syncSchoolToCloud(updatedSchool);
      setSchools((prev) => prev.map((school) => (school.id === updatedSchool.id ? updatedSchool : school)));
      if (currentSchool?.id === updatedSchool.id) {
        setCurrentSchool(updatedSchool);
      }
      pushNotification(
        'info',
        'Parámetros Escolares Actualizados',
        `Se actualizaron los parámetros técnicos y geocerca de ${updatedSchool.name}.`,
        'superadmin'
      );
    } catch (error) {
      console.error('No se pudieron guardar los parámetros del plantel en Firestore:', error);
    }
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Filter notifications for current user's role and scoping
  const userNotifications = notifications.filter((n) => {
    if (currentUser.role === 'superadmin' || currentUser.role === 'director') return true;
    if (n.targetRole === 'all') return true;
    if (currentUser.role === 'orientador') {
      return (
        n.targetRole === 'orientador' &&
        (!n.orientadorId || n.orientadorId === currentUser.linkedEntityId)
      );
    }
    if (currentUser.role === 'teacher') {
      return (
        n.targetRole === 'teacher' &&
        (!n.teacherId || n.teacherId === currentUser.linkedEntityId)
      );
    }
    if (currentUser.role === 'student') {
      return (
        n.targetRole === 'student' &&
        (!n.studentId || n.studentId === currentUser.linkedEntityId)
      );
    }
    return false;
  });

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Real-time floating Notification Toasts */}
      <NotificationToast
        notifications={userNotifications}
        onDismiss={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        onOpenEtaModal={() => setEtaModalOpen(true)}
        onOpenCheckinModal={() => setCheckinModalOpen(true)}
      />

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={userNotifications}
        onClearAll={() => setNotifications([])}
        onSelectNotificationAction={(n) => {
          if (n.type === 'eta_prompt') setEtaModalOpen(true);
          if (n.type === 'campus_arrival' || n.type === 'class_unattended') {
            setCheckinModalOpen(true);
          }
        }}
      />

      {/* ETA Prompt Modal */}
      {currentStudent && studentActiveClass && (
      <EtaPromptModal
        isOpen={etaModalOpen}
        onClose={() => setEtaModalOpen(false)}
        onSubmitEta={handleStudentSubmitEta}
        entryTime={currentSchool?.entryTime || ''}
        activeClass={studentActiveClass}
        orientador={studentOrientador}
        studentName={currentStudent?.name || ''}
      />
      )}

      {/* Classroom Check-in Modal */}
      {currentStudent && studentActiveClass && (
      <ClassCheckinModal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        activeClass={studentActiveClass}
      />
      )}

      {/* Student Dispute / Correction Request Modal */}
      {currentStudent && studentGroup && (
      <DisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        studentName={currentStudent?.name || ''}
        studentId={currentStudent?.id || ''}
        groupId={currentStudent?.groupId || ''}
        activeSubjectName={studentActiveClass?.subjectName || ''}
        onSubmitDispute={handleStudentSubmitDispute}
      />
      )}

      {/* Navbar with role switcher and logout */}
      <Navbar
        currentUser={currentUser}
        simulatedTime={simulatedTime}
        unreadCount={unreadCount}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onLogout={() => { void signOut(auth); }}
      />

      {/* Simulation UI removed: the app starts with real school data only. */}

      {/* Main Role-Specific View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ROLE 0: SUPERADMIN (DUEÑO DE LA APP / SAAS MULTI-ESCUELA) */}
        {currentUser.role === 'superadmin' && (
          <SuperAdminDashboardView
            currentUser={currentUser}
            schools={schools}
            onAddSchool={handleAddSchool}
            onUpdateSchool={handleUpdateSchool}
          />
        )}

        {/* ROLE 1: DIRECTOR */}
        {currentUser.role === 'director' && (
          <DirectorDashboardView
            director={currentUser}
            orientadores={orientadores}
            teachers={teachers}
            groups={groups}
            students={students}
            auditLogs={auditLogs}
            disputes={disputes}
            simulatedTime={simulatedTime}
            onReassignGroupToOrientador={handleReassignGroupToOrientador}
            onAssignTemporarySubstitute={handleAssignTemporarySubstitute}
            onCreateNewGroup={handleCreateNewGroup}
            onDirectorCorrectAttendance={handleDirectorCorrectAttendance}
            onResolveDispute={handleResolveDispute}
          />
        )}

        {/* ROLE 2: ORIENTADOR */}
        {currentUser.role === 'orientador' && currentOrientadorEntity && (
          <OrientadorDashboardView
            orientador={currentOrientadorEntity}
            allGroups={groups}
            allStudents={students}
            allTeachers={teachers}
            disputes={disputes}
            simulatedTime={simulatedTime}
            onCreateGroup={handleCreateGroupForOrientador}
            onUpdateGroupSchedule={handleUpdateGroupSchedule}
            onAddStudentToGroup={handleAddStudentToGroup}
            onImportStudentsCsv={handleImportStudentsCsv}
            onSendAlertToStudent={(stId, stName) => {
              pushNotification(
                'class_unattended',
                `Aviso de Orientación a ${stName}`,
                `El Orientador ${currentOrientadorEntity.name} solicita tu presencia inmediata en el salón de clase.`,
                'student',
                { studentId: stId, actionRequired: true }
              );
            }}
            onResolveDispute={handleResolveDispute}
          />
        )}

        {/* ROLE 3: DOCENTE */}
        {currentUser.role === 'teacher' && activeTeacherGroup && (
          <TeacherDashboardView
            teacher={currentUser}
            activeGroup={activeTeacherGroup}
            allTeacherGroups={teacherAssignedGroups}
            students={students}
            onSelectGroup={setActiveTeacherGroup}
            onSendStudentAlert={(stId, stName) => {
              pushNotification(
                'class_unattended',
                `Aviso del Docente a ${stName}`,
                `El docente solicita tu presencia inmediata en el aula.`,
                'student',
                { studentId: stId, actionRequired: true }
              );
            }}
            onManualValidateStudent={handleTeacherManualValidate}
          />
        )}

        {/* ROLE 4: ALUMNO */}
        {currentUser.role === 'student' && currentStudent && studentGroup && studentActiveClass && (
          <StudentAppView
            student={currentStudent}
            studentGroup={studentGroup}
            orientador={studentOrientador}
            activeClass={studentActiveClass}
            simulatedTime={simulatedTime}
            onOpenEtaModal={() => setEtaModalOpen(true)}
            onOpenCheckinModal={() => setCheckinModalOpen(true)}
            onOpenDisputeModal={() => setDisputeModalOpen(true)}
          />
        )}
        {currentUser.role === 'student' && (!currentStudent || !studentGroup || !studentActiveClass) && (
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Tu perfil escolar aún no está configurado</h2>
            <p className="mt-2 text-sm text-slate-600">Cuando la escuela te inscriba en un grupo y tenga un horario asignado, aquí aparecerá tu información real.</p>
          </div>
        )}
        {currentUser.role === 'teacher' && !activeTeacherGroup && (
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Todavía no tienes grupos asignados</h2>
            <p className="mt-2 text-sm text-slate-600">Cuando se cree un grupo y se te asigne una clase, aparecerá aquí.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <p>
          AulaControl · Sistema de asistencia escolar · Sesión activa: {currentUser.name} ({currentUser.title})
        </p>
      </footer>
    </div>
  );
}
