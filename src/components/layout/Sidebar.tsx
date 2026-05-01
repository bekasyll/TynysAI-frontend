import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Upload, FileImage, FlaskConical,
  FileText, User, Users, UserCheck,
  Bell, LogOut, Stethoscope, ClipboardList, Inbox, BookUser, CalendarDays, X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth.store';
import { usersApi } from '../../api/users.api';
import { setLanguage } from '../../i18n';
import logoIcon from '../../assets/TynysAI-logo.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, updateAvatar } = useAuthStore();
  const { t, i18n } = useTranslation();

  // Load avatarPath globally so the sidebar shows the photo on every page,
  // not only after the user opens their profile. Same query key as the
  // profile pages - React Query dedupes the request.
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const r = await usersApi.getMe(); return r.data.data!; },
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (meData !== undefined) {
      updateAvatar(meData.avatarPath ?? null);
    }
  }, [meData?.avatarPath, updateAvatar]);

  const patientNav = [
    { to: '/patient/dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={18} /> },
    { to: '/patient/upload', label: t('nav.upload'), icon: <Upload size={18} /> },
    { to: '/patient/analyses', label: t('nav.analyses'), icon: <FileImage size={18} /> },
    { to: '/patient/reports', label: t('nav.reports'), icon: <FileText size={18} /> },
    { to: '/patient/doctors', label: t('nav.doctors'), icon: <BookUser size={18} /> },
    { to: '/patient/appointments', label: t('nav.appointments'), icon: <CalendarDays size={18} /> },
    { to: '/patient/lab-results', label: t('nav.lab_results'), icon: <FlaskConical size={18} /> },
    { to: '/patient/profile', label: t('nav.profile'), icon: <User size={18} /> },
  ];

  const doctorNav = [
    { to: '/doctor/dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={18} /> },
    { to: '/doctor/ai-analysis', label: t('nav.upload'), icon: <Upload size={18} /> },
    { to: '/doctor/assigned-analyses', label: t('nav.assigned_analyses'), icon: <Inbox size={18} /> },
    { to: '/doctor/reports', label: t('nav.my_reports'), icon: <ClipboardList size={18} /> },
    { to: '/doctor/appointments', label: t('nav.appointments'), icon: <CalendarDays size={18} /> },
    { to: '/doctor/patients', label: t('nav.patients'), icon: <Users size={18} /> },
    { to: '/doctor/profile', label: t('nav.profile'), icon: <Stethoscope size={18} /> },
  ];

  const adminNav = [
    { to: '/admin/dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={18} /> },
    { to: '/admin/users', label: t('nav.users'), icon: <Users size={18} /> },
    { to: '/admin/approvals', label: t('nav.approvals'), icon: <UserCheck size={18} /> },
    { to: '/admin/analyses', label: t('nav.all_analyses'), icon: <FileImage size={18} /> },
    { to: '/admin/reports', label: t('nav.all_reports'), icon: <FileText size={18} /> },
  ];

  const navItems =
    user?.role === 'PATIENT' ? patientNav :
    user?.role === 'DOCTOR' ? doctorNav :
    adminNav;

  const roleLabel = t(`roles.${user?.role ?? 'PATIENT'}`);

  const langs = ['ru', 'kk', 'en'] as const;

  function handleLogout() {
    logout();
  }

  return (
    <>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col z-40 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: 'linear-gradient(180deg, #0C1A2E 0%, #0E2035 60%, #0C2030 100%)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-2">
          <img src={logoIcon} alt="TynysAI" className="h-10 w-10 object-contain shrink-0" />
          <span className="text-white font-bold text-xl tracking-tight">TynysAI</span>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden ml-auto p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <NavLink
          to={user?.role === 'PATIENT' ? '/patient/profile' : user?.role === 'DOCTOR' ? '/doctor/profile' : '/admin/dashboard'}
          onClick={onClose}
          className="px-4 py-4 border-b border-white/10 flex items-center gap-3 hover:bg-white/5 transition-colors"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-brand-teal/40"
            style={{ background: 'linear-gradient(135deg, #4664E0, #1CBEAF)' }}
          >
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-slate-400 text-xs">{roleLabel}</p>
          </div>
        </NavLink>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          <div className="pt-2 mt-2 border-t border-white/10">
            <NavLink
              to="/notifications"
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Bell size={18} />
              {t('nav.notifications')}
            </NavLink>
          </div>
        </nav>

        {/* Language switcher */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex gap-1">
            {langs.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  i18n.language === lang
                    ? 'bg-white/20 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {t(`lang.${lang}`).split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
