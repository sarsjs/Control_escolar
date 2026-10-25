export type UserRole = 'superadmin' | 'director' | 'orientador' | 'teacher' | 'student';

export interface SchoolInstitution {
  id: string;
  name: string;
  slug: string;
  logo: string;
  cct: string; // Clave de Centro de Trabajo / Registro oficial
  address: string;
  entryTime: string; // e.g. "07:00 AM"
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number; // e.g. 100 metros
  directorName: string;
  directorEmail: string;
  directorPhone?: string;
  directorUsername: string;
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  subscriptionPlan: 'Piloto' | 'Estándar' | 'Enterprise';
  maxStudents: number;
  enrolledStudentsCount: number;
  groupsCount: number;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  schoolId?: string;
  linkedEntityId?: string; // studentId, teacherId, orientadorId
}

export type StudentPresenceStatus =
  | 'outside_school'           // Fuera del plantel sin evidencia
  | 'en_route_delayed'         // En camino con reporte de tiempo estimado (ETA)
  | 'on_campus_not_in_class'   // Dentro del perímetro escolar pero aún no en salón
  | 'in_class'                 // Presencia confirmada en aula
  | 'absent';                  // Ausencia declarada tras agotar tolerancia

export type ValidationMethod = 'ble_auto' | 'ble_manual' | 'pin_backup' | 'qr_backup' | 'teacher_manual' | 'director_correction';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  groupId: string;
  schedulePeriodId: string;
  date: string; // YYYY-MM-DD
  status: StudentPresenceStatus;
  validationMethod?: ValidationMethod;
  validatedAt?: string;
  validatedBy?: string; // Teacher or Director ID
  notes?: string;
  isCorrected?: boolean;
}

export interface AuditLogEntry {
  id: string;
  attendanceId: string;
  studentId: string;
  studentName: string;
  groupId: string;
  subjectName: string;
  previousStatus: StudentPresenceStatus;
  newStatus: StudentPresenceStatus;
  modifiedBy: string; // User Name
  modifiedByRole: UserRole;
  reason: string;
  timestamp: string;
}

export interface AttendanceDispute {
  id: string;
  attendanceId: string;
  studentId: string;
  studentName: string;
  groupId: string;
  subjectName: string;
  date: string;
  studentReason: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface Student {
  id: string;
  schoolId?: string;
  name: string;
  matricula: string;
  groupId: string;
  avatar: string;
  currentStatus: StudentPresenceStatus;
  currentZone: string;
  distanceToCampusMeters: number;
  lastUpdated: string;
  etaMinutes?: number;
  etaReason?: string;
  etaSentAt?: string;
  validatedVia?: ValidationMethod | null;
  validatedAt?: string;
  bleDeviceId?: string; // Optional registered Bluetooth hardware identifier
}

export interface GroupScheduleItem {
  id: string;
  dayOfWeek: string;
  startTime: string; // "07:00"
  endTime: string;   // "08:30"
  toleranceMinutes: number; // e.g. 10
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  classroom: string;
  building: string;
  currentPin: string;
  beaconUuid: string;
  color: string;
}

export interface SchoolGroup {
  id: string;
  schoolId?: string;
  name: string; // e.g. "1º Semestre · Grupo A"
  semester: number;
  turn: 'Matutino' | 'Vespertino';
  orientadorId: string;
  temporarySubstituteOrientadorId?: string; // Sustitución autorizada por Director
  studentIds: string[];
  schedule: GroupScheduleItem[];
}

export interface Orientador {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  cubicle: string;
  assignedGroupIds: string[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  avatar: string;
  specialty: string;
  assignedGroupIds: string[];
}

export interface SystemNotification {
  id: string;
  type:
    | 'eta_prompt'
    | 'campus_arrival'
    | 'class_unattended'
    | 'teacher_eta_alert'
    | 'orientador_eta_alert'
    | 'class_validated'
    | 'schedule_updated'
    | 'group_reassigned'
    | 'dispute_requested'
    | 'dispute_resolved'
    | 'attendance_corrected'
    | 'info';
  title: string;
  message: string;
  timestamp: string;
  targetRole: 'superadmin' | 'student' | 'teacher' | 'orientador' | 'director' | 'all';
  targetUserId?: string;
  groupId?: string;
  orientadorId?: string;
  teacherId?: string;
  studentId?: string;
  read: boolean;
  actionRequired?: boolean;
}

export interface CampusZoneLocation {
  id: string;
  name: string;
  category: 'gate' | 'classroom' | 'courtyard' | 'cafeteria' | 'sports' | 'lab';
  x: number;
  y: number;
  width: number;
  height: number;
  capacity?: number;
}
