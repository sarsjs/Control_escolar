import React, { useState } from 'react';
import { SchoolInstitution, UserAccount } from '../types';
import {
  Building2,
  Plus,
  MapPin,
  Compass,
  Clock,
  UserCheck,
  ShieldCheck,
  Search,
  Edit3,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  School,
  Lock,
  Globe,
  Radio,
  Users,
  Mail,
} from 'lucide-react';

interface SuperAdminDashboardViewProps {
  currentUser: UserAccount;
  schools: SchoolInstitution[];
  onAddSchool: (school: SchoolInstitution) => void;
  onUpdateSchool: (school: SchoolInstitution) => void;
  onToggleSchoolStatus: (school: SchoolInstitution) => void;
  onProvisionDirector: (school: SchoolInstitution) => Promise<void>;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({
  currentUser,
  schools,
  onAddSchool,
  onUpdateSchool,
  onToggleSchoolStatus,
  onProvisionDirector,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingSchool, setEditingSchool] = useState<SchoolInstitution | null>(null);
  const [invitingSchoolId, setInvitingSchoolId] = useState<string | null>(null);

  // Form state for creating new school
  const [formName, setFormName] = useState<string>('');
  const [formLogo, setFormLogo] = useState<string>('');
  const [formCct, setFormCct] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formEntryTime, setFormEntryTime] = useState<string>('07:00 AM');
  const [formLat, setFormLat] = useState<number>(0);
  const [formLng, setFormLng] = useState<number>(0);
  const [formGeofenceRadius, setFormGeofenceRadius] = useState<number>(120);
  const [formPlan, setFormPlan] = useState<'Piloto' | 'Estándar' | 'Enterprise'>('Estándar');
  const [formMaxStudents, setFormMaxStudents] = useState<number>(800);

  // Director fields for the new school
  const [formDirectorName, setFormDirectorName] = useState<string>('');
  const [formDirectorEmail, setFormDirectorEmail] = useState<string>('');
  const [formDirectorPhone, setFormDirectorPhone] = useState<string>('');

  // Filtered schools
  const filteredSchools = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cct.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.directorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalStudents = schools.reduce((acc, curr) => acc + curr.enrolledStudentsCount, 0);
  const activeSchoolsCount = schools.filter((s) => s.status === 'active').length;

  const handleGetCurrentGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormLat(Number(pos.coords.latitude.toFixed(6)));
          setFormLng(Number(pos.coords.longitude.toFixed(6)));
        },
        (err) => {
          console.warn('Geolocation prompt error:', err);
        }
      );
    }
  };

  const handleSaveNewSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCct || !formDirectorName || !formDirectorEmail) return;

    const newSchoolId = `sch-${Date.now()}`;
    const newSchool: SchoolInstitution = {
      id: newSchoolId,
      name: formName,
      slug: formName.toLowerCase().replace(/\s+/g, '-').slice(0, 20),
      logo: formLogo,
      cct: formCct.toUpperCase(),
      address: formAddress,
      entryTime: formEntryTime,
      latitude: formLat,
      longitude: formLng,
      geofenceRadiusMeters: formGeofenceRadius,
      directorName: formDirectorName,
      directorEmail: formDirectorEmail,
      directorPhone: formDirectorPhone,
      directorUsername: formDirectorEmail,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      subscriptionPlan: formPlan,
      maxStudents: formMaxStudents,
      enrolledStudentsCount: 0,
      groupsCount: 0,
    };



    onAddSchool(newSchool);
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormName('');
    setFormCct('');
    setFormAddress('');
    setFormDirectorName('');
    setFormDirectorEmail('');
    setFormDirectorPhone('');
  };

  const handleSaveEditedSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    onUpdateSchool(editingSchool);
    setEditingSchool(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Master App Owner Identity */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-600 rounded-2xl shadow-lg border border-indigo-400/40 text-white">
              <Globe className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Panel del Dueño de la Plataforma
                </span>
                <span className="text-xs text-indigo-300 font-mono">
                  SaaS Multi-Escuela
                </span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">
                Administración Global de Planteles Escolares
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Como dueño de AulaControl, aquí configuras los parámetros técnicos (coordenadas GPS, geocercas, horarios) y generas a los Directores para distribuir la plataforma en diferentes colegios.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nueva Escuela</span>
          </button>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Escuelas Registradas</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{schools.length}</span>
            <span className="text-xs text-emerald-600 font-bold">{activeSchoolsCount} activas</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Planteles afiliados en la red</span>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Alumnos Monitoreados</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{totalStudents}</span>
            <span className="text-xs text-slate-500">en plataforma</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Sumatoria de todos los planteles</span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Geocercas GPS Activas</span>
            <Radio className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{schools.length}</span>
            <span className="text-xs text-blue-600 font-semibold">100% calibradas</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Perímetros satelitales escolares</span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Directores Asignados</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{schools.length}</span>
            <span className="text-xs text-purple-600 font-semibold">Cuentas creadas</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Autoridades autónomas</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de colegio, CCT, director o ciudad..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({schools.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activas ({schools.filter((s) => s.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'suspended' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suspendidas ({schools.filter((s) => s.status === 'suspended').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('trial')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'trial' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            En Piloto ({schools.filter((s) => s.status === 'trial').length})
          </button>
        </div>
      </div>

      {/* Grid of Registered Schools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            {/* Header: School Logo, Name & Badge */}
            <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={school.logo}
                    alt={school.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-xs shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        CCT: {school.cct}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          school.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : school.status === 'trial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {school.status === 'active' ? '● Activa' : school.status === 'trial' ? '● Piloto' : '● Suspendida'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Plan {school.subscriptionPlan}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{school.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{school.address}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingSchool(school)}
                  title="Configurar Parámetros Técnicos"
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>

              {/* Technical Parameters Box (Owner Only) */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono text-[11px] uppercase font-bold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    Parámetros Técnicos (Configurados por el Dueño):
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Protegido</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-800/80 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Coordenadas GPS</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-400 block mt-0.5 truncate">
                      {school.latitude.toFixed(4)}, {school.longitude.toFixed(4)}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Geocerca Perimetral</span>
                    <span className="font-mono text-[11px] font-bold text-indigo-300 block mt-0.5">
                      {school.geofenceRadiusMeters} metros
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Hora de Entrada</span>
                    <span className="font-mono text-[11px] font-bold text-amber-300 block mt-0.5">
                      {school.entryTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Director Assigned Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold font-mono">
                    {school.directorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                      Director Titular Designado:
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{school.directorName}</h4>
                    <p className="text-[11px] text-slate-500">{school.directorEmail}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md font-mono">
                    Correo del director: {school.directorEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 bg-slate-50/50 flex items-center justify-between gap-3 text-xs">
              <span className="text-[11px] text-slate-500">
                Alumnos: <strong className="text-slate-800">{school.enrolledStudentsCount}</strong> / {school.maxStudents}
              </span>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={invitingSchoolId === school.id}
                  onClick={async () => {
                    setInvitingSchoolId(school.id);
                    try {
                      await onProvisionDirector(school);
                    } finally {
                      setInvitingSchoolId(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Crear o verificar la cuenta y enviar instrucciones de contraseña"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{invitingSchoolId === school.id ? 'Enviando…' : 'Invitar / reenviar director'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingSchool(school)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ajustar Cerca / Datos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const action = school.status === 'suspended' ? 'reactivar' : 'desactivar';
                    const detail = school.status === 'suspended'
                      ? 'El plantel volverá a marcarse como activo.'
                      : 'El plantel quedará suspendido, pero sus registros se conservarán.';
                    if (window.confirm(`¿Confirmas ${action} “${school.name}”? ${detail}`)) {
                      onToggleSchoolStatus(school);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border font-semibold transition-colors flex items-center gap-1.5 ${school.status === 'suspended' ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{school.status === 'suspended' ? 'Reactivar' : 'Desactivar'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: REGISTRAR NUEVA ESCUELA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold">
                  SaaS Multi-Escuela
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Registrar Nueva Institución y Generar Director
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSchool} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Sección 1: Datos Generales */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 text-xs uppercase tracking-wider text-indigo-700">
                  1. Identidad del Plantel Escolar
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nombre de la Escuela *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej. Colegio Preparatorio del Norte"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Clave Escolar / CCT *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCct}
                      onChange={(e) => setFormCct(e.target.value)}
                      placeholder="Ej. 09DEX0199Z"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono uppercase"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Dirección Completa del Campus
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Ej. Av. Universidad 1200, Col. del Valle"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      URL del Logotipo Escolar
                    </label>
                    <input
                      type="text"
                      value={formLogo}
                      onChange={(e) => setFormLogo(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-[11px] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Hora Oficial de Entrada
                    </label>
                    <input
                      type="text"
                      value={formEntryTime}
                      onChange={(e) => setFormEntryTime(e.target.value)}
                      placeholder="Ej. 07:00 AM"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Parámetros Técnicos y Geocerca (Dueño de la App) */}
              <div className="space-y-3 bg-slate-900 text-white p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                    2. Parámetros Técnicos y Geocerca Satelital
                  </h4>
                  <button
                    type="button"
                    onClick={handleGetCurrentGps}
                    className="text-[10px] font-mono text-indigo-300 hover:text-white underline"
                  >
                    Tomar mi GPS actual
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Latitud GPS</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formLat}
                      onChange={(e) => setFormLat(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-emerald-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Longitud GPS</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formLng}
                      onChange={(e) => setFormLng(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-emerald-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Radio Geocerca</label>
                    <select
                      value={formGeofenceRadius}
                      onChange={(e) => setFormGeofenceRadius(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-indigo-300 text-xs"
                    >
                      <option value={80}>80 metros (Campus Pequeño)</option>
                      <option value={120}>120 metros (Campus Mediano)</option>
                      <option value={150}>150 metros (Campus Estándar)</option>
                      <option value={200}>200 metros (Campus Extenso)</option>
                      <option value={300}>300 metros (Macro-Campus)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Plan de Suscripción</label>
                    <select
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-white text-xs"
                    >
                      <option value="Piloto">Piloto (Prueba gratuita)</option>
                      <option value="Estándar">Estándar</option>
                      <option value="Enterprise">Enterprise (Sin límites)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Capacidad Máxima Alumnos</label>
                    <input
                      type="number"
                      value={formMaxStudents}
                      onChange={(e) => setFormMaxStudents(parseInt(e.target.value, 10) || 500)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Generación del Director Titular */}
              <div className="space-y-3 bg-purple-50/70 border border-purple-200 p-4 rounded-2xl">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-purple-900">
                    3. Generación del Director Escolar
                  </h4>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    Al guardar, este Director podrá iniciar sesión para configurar sus grupos, orientadores, materias y pases de lista.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nombre Completo del Director *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDirectorName}
                      onChange={(e) => setFormDirectorName(e.target.value)}
                      placeholder="Ej. Dr. Mario Estrada Lugo"
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Correo Institucional del Director (Usuario) *
                    </label>
                    <input
                      type="email"
                      required
                      value={formDirectorEmail}
                      onChange={(e) => setFormDirectorEmail(e.target.value)}
                      placeholder="director@nuevo-colegio.edu"
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={formDirectorPhone}
                      onChange={(e) => setFormDirectorPhone(e.target.value)}
                      placeholder="Teléfono del plantel o director"
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl font-mono"
                    />
                  </div>


                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Guardar plantel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR PARÁMETROS TÉCNICOS DE LA ESCUELA */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-indigo-400 font-bold">
                  Configuración Técnica
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{editingSchool.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSchool(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedSchool} className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nombre del Plantel
                  </label>
                  <input
                    type="text"
                    value={editingSchool.name}
                    onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    URL del Logotipo
                  </label>
                  <input
                    type="text"
                    value={editingSchool.logo}
                    onChange={(e) => setEditingSchool({ ...editingSchool, logo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Latitud GPS
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingSchool.latitude}
                      onChange={(e) =>
                        setEditingSchool({
                          ...editingSchool,
                          latitude: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Longitud GPS
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingSchool.longitude}
                      onChange={(e) =>
                        setEditingSchool({
                          ...editingSchool,
                          longitude: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Radio de Geocerca (Metros)
                    </label>
                    <input
                      type="number"
                      value={editingSchool.geofenceRadiusMeters}
                      onChange={(e) =>
                        setEditingSchool({
                          ...editingSchool,
                          geofenceRadiusMeters: parseInt(e.target.value, 10) || 100,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Hora Oficial de Entrada
                    </label>
                    <input
                      type="text"
                      value={editingSchool.entryTime}
                      onChange={(e) => setEditingSchool({ ...editingSchool, entryTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Estado de Operación
                    </label>
                    <select
                      value={editingSchool.status}
                      onChange={(e) => setEditingSchool({ ...editingSchool, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="active">Activa</option>
                      <option value="trial">En Piloto</option>
                      <option value="suspended">Suspendida</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Plan de Suscripción
                    </label>
                    <select
                      value={editingSchool.subscriptionPlan}
                      onChange={(e) =>
                        setEditingSchool({ ...editingSchool, subscriptionPlan: e.target.value as any })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Piloto">Piloto</option>
                      <option value="Estándar">Estándar</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Actualizar Parámetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
