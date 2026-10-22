import React from 'react';
import {
  School,
  Smartphone,
  Users,
  Compass,
  Clock,
  Bell,
  Sparkles,
  LogOut,
  Building2,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

export type ActiveNavTab = 'dashboard' | 'groups' | 'schedule' | 'map' | 'simulator';

interface NavbarProps {
  currentUser: UserAccount;
  simulatedTime: string;
  unreadCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  simulatedTime,
  unreadCount,
  onOpenNotifications,
  onLogout,
}) => {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return { label: 'Dueño de la App', bg: 'bg-slate-900 text-white border border-indigo-400/40' };
      case 'director':
        return { label: 'Director', bg: 'bg-indigo-600 text-white' };
      case 'orientador':
        return { label: 'Orientación', bg: 'bg-amber-600 text-white' };
      case 'teacher':
        return { label: 'Docente', bg: 'bg-blue-600 text-white' };
      case 'student':
        return { label: 'Alumno', bg: 'bg-emerald-600 text-white' };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <School className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
              AulaControl
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-tight block">
              Portal Institucional
            </span>
          </div>
        </div>

        {/* Zone 3: Clock, User Avatar & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Simulated clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl font-mono text-xs text-slate-700 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold">{simulatedTime}</span>
          </div>

          {/* Notifications bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Ver Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* User Profile Lockup */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-slate-900 block truncate max-w-[130px]">
                {currentUser.name}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm ${badge.bg}`}>
                {badge.label}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </header>
  );
};
