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
  ValidationMethod,
  SchoolInstitution,
} from './types';
import {
  MOCK_USERS,
  MOCK_ORIENTADORES,
  MOCK_TEACHERS,
  INITIAL_GROUPS,
  INITIAL_STUDENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SCHOOLS,
  INSTITUTION_INFO,
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { StudentAppView } from './components/StudentAppView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { OrientadorDashboardView } from './components/OrientadorDashboardView';
import { DirectorDashboardView } from './components/DirectorDashboardView';
import { SuperAdminDashboardView } from './components/SuperAdminDashboardView';
import { SimulationControls } from './components/SimulationControls';
import { EtaPromptModal } from './components/EtaPromptModal';
import { ClassCheckinModal } from './components/ClassCheckinModal';
import { DisputeModal } from './components/DisputeModal';
import { NotificationToast } from './components/NotificationToast';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Sparkles, Cloud, CloudCheck } from 'lucide-react';
import {
  testFirestoreConnection,
  syncStudentToCloud,
  recordAuditLogToCloud,
  recordDisputeToCloud,
  pushNotificationToCloud,
  subscribeToStudents,
  syncSchoolToCloud,
  subscribeToSchools,
} from './utils/firebaseSync';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    attendanceId: 'att-diego-1',
    studentId: 'stu-diego',
    studentName: 'Diego Navarro Gil',
    groupId: 'grp-2b',
    subjectName: 'Matemáticas II',
    previousStatus: 'outside_school',
    newStatus: 'in_class',
    modifiedBy: 'Prof. Roberto Gómez',
    modifiedByRole: 'teacher',
    reason: 'Falla temporal de BLE; validación manual por lista firmada en pizarrón.',
    timestamp: '06:54 AM',
  },
];

const INITIAL_DISPUTES: AttendanceDispute[] = [
  {
    id: 'disp-001',
    attendanceId: 'att-mateo-1',
    studentId: 'stu-mateo',
    studentName: 'Mateo Fernández Solís',
    groupId: 'grp-2b',
    subjectName: 'Matemáticas II',
    date: '2026-10-22',
    studentReason: 'Llegué a tiempo pero mi Bluetooth estuvo desconectado al entrar al aula 102.',
    status: 'pending',
  },
];

export default function App() {
  // Schools State (Multi-tenant SaaS)
  const [schools, setSchools] = useState<SchoolInstitution[]>(() => {
    const saved = localStorage.getItem('aulacontrol_schools');
    return saved ? JSON.parse(saved) : INITIAL_SCHOOLS;
  });
  const [currentSchool, setCurrentSchool] = useState<SchoolInstitution>(schools[0] || INITIAL_SCHOOLS[0]);
  const [usersList, setUsersList] = useState<UserAccount[]>(MOCK_USERS);

  // Never grant a role from localStorage alone. A session must start at the login screen.
  // The cached profile is not an authentication credential and can be edited by the browser user.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Master Academic State with Local Storage persistence
  const [orientadores, setOrientadores] = useState<Orientador[]>(MOCK_ORIENTADORES);
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [groups, setGroups] = useState<SchoolGroup[]>(INITIAL_GROUPS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [disputes, setDisputes] = useState<AttendanceDispute[]>(INITIAL_DISPUTES);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  // Time & Simulation
  const [simulatedTime, setSimulatedTime] = useState<string>('07:05 AM');
  const [simulationStep, setSimulationStep] = useState<number>(1);

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
        if (active) setCurrentUser({
          id: firebaseUser.uid,
          username: typeof profile.username === 'string' ? profile.username : (firebaseUser.email || ''),
          name: typeof profile.name === 'string' ? profile.name : (firebaseUser.displayName || firebaseUser.email || 'Usuario'),
          email: firebaseUser.email || '',
          role,
          avatar: typeof profile.avatar === 'string' ? profile.avatar : '',
          title: typeof profile.title === 'string' ? profile.title : role,
          ...(typeof profile.schoolId === 'string' ? { schoolId: profile.schoolId } : {}),
          ...(typeof profile.linkedEntityId === 'string' ? { linkedEntityId: profile.linkedEntityId } : {}),
        });
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

    const unsubscribeStudents = subscribeToStudents((cloudStudents) => {
      if (cloudStudents && cloudStudents.length > 0) {
        setStudents((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          cloudStudents.forEach((cs) => {
            map.set(cs.id, { ...map.get(cs.id), ...cs });
          });
          return Array.from(map.values());
        });
      }
    });

    const unsubscribeSchools = subscribeToSchools((cloudSchools) => {
      if (cloudSchools && cloudSchools.length > 0) {
        setSchools((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          cloudSchools.forEach((cs) => {
            map.set(cs.id, { ...map.get(cs.id), ...cs });
          });
          return Array.from(map.values());
        });
      }
    });

    return () => {
      if (typeof unsubscribeStudents === 'function') unsubscribeStudents();
      if (typeof unsubscribeSchools === 'function') unsubscribeSchools();
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
  const currentStudent = students.find((s) => s.id === 'stu-sofia') || students[0];
  const studentGroup = groups.find((g) => g.id === currentStudent?.groupId) || groups[0];
  const studentOrientador = orientadores.find(
    (o) =>
      o.id === studentGroup.orientadorId ||
      o.id === studentGroup.temporarySubstituteOrientadorId
  );
  const studentActiveClass = studentGroup.schedule[0];

  // Primary active teacher
  const currentTeacherUser = currentUser?.role === 'teacher' ? currentUser : MOCK_USERS[4];
  const teacherAssignedGroups = groups.filter((g) =>
    g.schedule.some((s) => s.teacherId === currentTeacherUser.linkedEntityId || s.teacherName.includes('Roberto'))
  );
  const [activeTeacherGroup, setActiveTeacherGroup] = useState<SchoolGroup>(
    teacherAssignedGroups[0] || groups[0]
  );

  // Primary active orientador (Strict isolation per user)
  const currentOrientadorEntity =
    orientadores.find((o) => o.id === currentUser?.linkedEntityId) || orientadores[0];

  // 1. Student ETA submission (routes to Orientador + Teacher)
  const handleStudentSubmitEta = (minutes: number, reason: string) => {
    const updatedStudent: Student = {
      ...currentStudent,
      currentStatus: 'en_route_delayed',
      currentZone: 'En camino hacia el plantel',
      etaMinutes: minutes,
      etaReason: reason,
      etaSentAt: simulatedTime,
      lastUpdated: simulatedTime,
    };

    setStudents((prev) =>
      prev.map((s) => (s.id === currentStudent.id ? updatedStudent : s))
    );
    syncStudentToCloud(updatedStudent);

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

    setSimulationStep(2);
  };

  // 2. Student crosses school gate (GPS triggers presence in campus)
  const handleCrossGate = () => {
    const updatedStudent: Student = {
      ...currentStudent,
      currentStatus: 'on_campus_not_in_class',
      currentZone: 'Plaza Cívica / Patios Centrales',
      distanceToCampusMeters: 0,
      lastUpdated: simulatedTime,
    };

    setStudents((prev) =>
      prev.map((s) => (s.id === currentStudent.id ? updatedStudent : s))
    );
    syncStudentToCloud(updatedStudent);

    pushNotification(
      'campus_arrival',
      'Llegada al Plantel Detectada (GPS)',
      `Has llegado al plantel. Recuerda que todavía necesitas confirmar tu presencia en tu salón de clase (${studentActiveClass?.classroom}).`,
      'student',
      {
        studentId: currentStudent.id,
        actionRequired: true,
      }
    );

    if (studentOrientador) {
      pushNotification(
        'class_unattended',
        `Alumno en Campus sin ingresar a aula (${studentGroup.name})`,
        `${currentStudent.name} ingresó a las instalaciones pero aún no se registra en su aula de ${studentActiveClass?.subjectName} (${studentActiveClass?.classroom}).`,
        'orientador',
        {
          orientadorId: studentOrientador.id,
          groupId: studentGroup.id,
          studentId: currentStudent.id,
        }
      );
    }

    setSimulationStep(3);
  };

  // 3. Student leaves campus
  const handleLeaveCampus = () => {
    const updatedStudent: Student = {
      ...currentStudent,
      currentStatus: 'outside_school',
      currentZone: 'Fuera del Plantel (A 1.8 km)',
      distanceToCampusMeters: 1800,
      validatedVia: null,
      validatedAt: undefined,
      lastUpdated: simulatedTime,
    };

    setStudents((prev) =>
      prev.map((s) => (s.id === currentStudent.id ? updatedStudent : s))
    );
    syncStudentToCloud(updatedStudent);
  };

  // 4. Confirm classroom attendance via BLE, PIN, or QR
  const handleConfirmAttendance = (method: ValidationMethod, validatedCode?: string) => {
    const updatedStudent: Student = {
      ...currentStudent,
      currentStatus: 'in_class',
      currentZone: `${studentActiveClass?.classroom} (${studentActiveClass?.subjectName.split(' ')[0]})`,
      validatedVia: method,
      validatedAt: simulatedTime,
      lastUpdated: simulatedTime,
    };

    setStudents((prev) =>
      prev.map((s) => (s.id === currentStudent.id ? updatedStudent : s))
    );
    syncStudentToCloud(updatedStudent);

    pushNotification(
      'class_validated',
      'Asistencia Oficial en Aula Acreditada',
      `${currentStudent.name} confirmó presencia en ${studentActiveClass?.classroom} mediante ${method.toUpperCase()} a las ${simulatedTime}.`,
      'all'
    );

    setSimulationStep(4);
  };

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
      studentIds: [],
      schedule: [
        {
          id: `sch-${Date.now()}-1`,
          dayOfWeek: 'Lunes a Viernes',
          startTime: '07:00',
          endTime: '08:30',
          toleranceMinutes: 10,
          subjectName: 'Matemáticas Generales',
          subjectCode: 'MAT-100',
          teacherId: teachers[0].id,
          teacherName: teachers[0].name,
          teacherAvatar: teachers[0].avatar,
          classroom: 'Aula 104',
          building: 'Edificio A',
          currentPin: '5812',
          beaconUuid: 'e2c56db5-dffb-48d2-b060-d0f5a71096a9',
          color: '#2563eb',
        },
      ],
    };

    setGroups((prev) => [...prev, newGroup]);
    setOrientadores((prev) =>
      prev.map((o) =>
        o.id === orientadorId ? { ...o, assignedGroupIds: [...o.assignedGroupIds, newId] } : o
      )
    );
  };

  // 11. Orientador updates schedule
  const handleUpdateGroupSchedule = (groupId: string, newSchedule: GroupScheduleItem[]) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, schedule: newSchedule } : g))
    );

    pushNotification(
      'schedule_updated',
      'Horario Escolar Actualizado',
      `Tu Orientador ha actualizado el horario oficial de tu grupo.`,
      'student',
      { groupId }
    );
  };

  // 12. Orientador enrolls individual student
  const handleAddStudentToGroup = (groupId: string, name: string, matricula: string) => {
    const newStudentId = `stu-${Date.now()}`;
    const newStudent: Student = {
      id: newStudentId,
      name,
      matricula,
      groupId,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      currentStatus: 'outside_school',
      currentZone: 'Fuera del Plantel (A 2.5 km)',
      distanceToCampusMeters: 2500,
      lastUpdated: simulatedTime,
    };

    setStudents((prev) => [...prev, newStudent]);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, studentIds: [...g.studentIds, newStudentId] } : g
      )
    );
  };

  // 13. Orientador imports students via CSV
  const handleImportStudentsCsv = (groupId: string, csvData: { name: string; matricula: string }[]) => {
    const newStudents: Student[] = csvData.map((row, idx) => ({
      id: `stu-csv-${Date.now()}-${idx}`,
      name: row.name,
      matricula: row.matricula,
      groupId,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      currentStatus: 'outside_school',
      currentZone: 'Fuera del Plantel (A 2.5 km)',
      distanceToCampusMeters: 2500,
      lastUpdated: simulatedTime,
    }));

    setStudents((prev) => [...prev, ...newStudents]);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, studentIds: [...g.studentIds, ...newStudents.map((s) => s.id)] }
          : g
      )
    );
  };

  // 14. Teacher regenerates PIN
  const handleRegeneratePin = () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === activeTeacherGroup.id) {
          return {
            ...g,
            schedule: g.schedule.map((s, idx) => (idx === 0 ? { ...s, currentPin: newCode } : s)),
          };
        }
        return g;
      })
    );
  };

  // 15. Teacher manual validate with audit
  const handleTeacherManualValidate = (studentId: string) => {
    handleDirectorCorrectAttendance(
      studentId,
      'in_class',
      'Pase de lista presencial por el docente en el aula.'
    );
  };

  // 16. Step-by-Step Simulation Scenario
  const handleRunScenarioStep = (stepNumber: number) => {
    setSimulationStep(stepNumber);

    if (stepNumber === 1) {
      setSimulatedTime('07:05 AM');
      setStudents((prev) =>
        prev.map((s) =>
          s.id === currentStudent.id
            ? {
                ...s,
                currentStatus: 'outside_school',
                currentZone: 'Fuera del Plantel (A 2.1 km)',
                distanceToCampusMeters: 2100,
                etaMinutes: undefined,
                etaReason: undefined,
                validatedVia: null,
                validatedAt: undefined,
              }
            : s
        )
      );
      setEtaModalOpen(true);
      pushNotification(
        'eta_prompt',
        'Control de Entrada Escolar',
        'Aún no registramos tu llegada al plantel. ¿En cuánto tiempo estimas llegar?',
        'student',
        { studentId: currentStudent.id, actionRequired: true }
      );
    } else if (stepNumber === 2) {
      setSimulatedTime('07:06 AM');
      handleStudentSubmitEta(15, 'Tráfico pesado en ruta');
      setEtaModalOpen(false);
    } else if (stepNumber === 3) {
      setSimulatedTime('07:18 AM');
      handleCrossGate();
    } else if (stepNumber === 4) {
      setSimulatedTime('07:20 AM');
      handleConfirmAttendance('ble_auto', studentActiveClass.beaconUuid);
    } else if (stepNumber === 5) {
      setSimulatedTime('08:35 AM');
      setStudents((prev) =>
        prev.map((s) =>
          s.id === currentStudent.id
            ? {
                ...s,
                currentStatus: 'on_campus_not_in_class',
                currentZone: 'Pasillos Edificio Ciencias',
                validatedVia: null,
                validatedAt: undefined,
              }
            : s
        )
      );
      pushNotification(
        'class_unattended',
        'Inicio de Materia: Física Elemental',
        'Inicia la clase en Laboratorio 2. Estás dentro de la escuela, pero debes validar presencia en este nuevo salón.',
        'student',
        { studentId: currentStudent.id, actionRequired: true }
      );
    }
  };

  const handleResetSimulation = () => {
    setStudents(INITIAL_STUDENTS);
    setGroups(INITIAL_GROUPS);
    setOrientadores(MOCK_ORIENTADORES);
    setSimulatedTime('07:05 AM');
    setSimulationStep(1);
    setNotifications(INITIAL_NOTIFICATIONS);
    setEtaModalOpen(false);
    setCheckinModalOpen(false);
    setDisputeModalOpen(false);
  };

  // 17. SaaS Multi-School Handlers (Dueño de la App)
  const handleAddSchool = (newSchool: SchoolInstitution, directorUser: UserAccount) => {
    setSchools((prev) => [newSchool, ...prev]);
    setUsersList((prev) => [directorUser, ...prev]);
    syncSchoolToCloud(newSchool);
    pushNotification(
      'info',
      'Nuevo Plantel Escolar Afiliado',
      `Se registró la escuela ${newSchool.name} (CCT: ${newSchool.cct}) y se generó el Director ${directorUser.name}.`,
      'superadmin'
    );
  };

  const handleUpdateSchool = (updatedSchool: SchoolInstitution) => {
    setSchools((prev) => prev.map((s) => (s.id === updatedSchool.id ? updatedSchool : s)));
    if (currentSchool.id === updatedSchool.id) {
      setCurrentSchool(updatedSchool);
    }
    syncSchoolToCloud(updatedSchool);
    pushNotification(
      'info',
      'Parámetros Escolares Actualizados',
      `Se actualizaron los parámetros técnicos y geocerca de ${updatedSchool.name}.`,
      'superadmin'
    );
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
      <EtaPromptModal
        isOpen={etaModalOpen}
        onClose={() => setEtaModalOpen(false)}
        onSubmitEta={handleStudentSubmitEta}
        entryTime={INSTITUTION_INFO.entryTime}
        activeClass={studentActiveClass}
        orientador={studentOrientador}
        studentName={currentStudent.name}
      />

      {/* Classroom Check-in Modal */}
      <ClassCheckinModal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        activeClass={studentActiveClass}
        onConfirmAttendance={handleConfirmAttendance}
      />

      {/* Student Dispute / Correction Request Modal */}
      <DisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        studentName={currentStudent.name}
        studentId={currentStudent.id}
        groupId={currentStudent.groupId}
        activeSubjectName={studentActiveClass?.subjectName || 'Matemáticas II'}
        onSubmitDispute={handleStudentSubmitDispute}
      />

      {/* Navbar with role switcher and logout */}
      <Navbar
        currentUser={currentUser}
        simulatedTime={simulatedTime}
        unreadCount={unreadCount}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onLogout={() => { void signOut(auth); }}
      />

      {/* Test / Simulation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-white">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
              Ciclo de Asistencia:
            </span>
            <span className="text-slate-300 hidden sm:inline">Paso {simulationStep} de 5:</span>
            <span className="font-semibold text-white">
              {simulationStep === 1 && 'Alumno fuera de escuela · Alerta de entrada'}
              {simulationStep === 2 && 'Alumno reportó ETA de 15m · Orientador y Profesor notificados'}
              {simulationStep === 3 && 'Llegada al plantel por GPS · No en clase aún'}
              {simulationStep === 4 && 'Confirmación en aula por BLE · Asistencia oficial'}
              {simulationStep === 5 && 'Cambio de materia a Física · Nueva validación requerida'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isCloudConnected ? (
              <span
                title="Sincronizado en tiempo real con Firebase Firestore"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-2xs"
              >
                <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nube: Firestore Activo</span>
              </span>
            ) : (
              <span
                title="Modo local con sincronización diferida"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
              >
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span>Nube: Conectando...</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => handleRunScenarioStep(simulationStep < 5 ? simulationStep + 1 : 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Avanzar Paso ({simulationStep < 5 ? simulationStep + 1 : 1})</span>
            </button>
            <button
              type="button"
              onClick={handleResetSimulation}
              className="text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Reiniciar
            </button>
          </div>
        </div>
      </div>

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
        {currentUser.role === 'orientador' && (
          <OrientadorDashboardView
            orientador={currentOrientadorEntity}
            allGroups={groups}
            allStudents={students}
            allTeachers={teachers}
            disputes={disputes}
            simulatedTime={simulatedTime}
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
        {currentUser.role === 'teacher' && (
          <TeacherDashboardView
            teacher={currentUser}
            activeGroup={activeTeacherGroup}
            allTeacherGroups={teacherAssignedGroups}
            students={students}
            onSelectGroup={setActiveTeacherGroup}
            onRegeneratePin={handleRegeneratePin}
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
        {currentUser.role === 'student' && (
          <StudentAppView
            student={currentStudent}
            studentGroup={studentGroup}
            orientador={studentOrientador}
            activeClass={studentActiveClass}
            simulatedTime={simulatedTime}
            onOpenEtaModal={() => setEtaModalOpen(true)}
            onOpenCheckinModal={() => setCheckinModalOpen(true)}
            onOpenDisputeModal={() => setDisputeModalOpen(true)}
            onSimulateCrossGate={handleCrossGate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <p>
          {INSTITUTION_INFO.name} · {INSTITUTION_INFO.tagline} · Sesión activa: {currentUser.name} ({currentUser.title})
        </p>
      </footer>
    </div>
  );
}
