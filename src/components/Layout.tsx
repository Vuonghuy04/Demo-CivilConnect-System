import {
  Bell,
  CalendarDays,
  ClipboardList,
  Home,
  Menu,
  MessageSquareText,
  Search,
  X,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { useAppData } from '../context/AppDataContext';
import type { Role } from '../types';
import { Toast } from './Toast';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
}

const roles: Role[] = ['Citizen', 'Officer', 'Specialist Team Member', 'Manager'];

function getNavItems(role: Role): NavItem[] {
  const base: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: role === 'Specialist Team Member' ? 'Assigned Requests' : 'Service Requests', path: '/requests', icon: ClipboardList },
    { label: 'Appointments', path: '/appointments', icon: CalendarDays },
  ];

  if (role === 'Citizen') {
    return [...base, { label: 'Feedback', path: '/reports', icon: MessageSquareText }];
  }

  if (role === 'Manager') {
    return [...base, { label: 'Reports', path: '/reports', icon: MessageSquareText }];
  }

  return [...base, { label: 'Team Reports', path: '/reports', icon: MessageSquareText }];
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role, visibleRequests, visibleAppointments } = useAppData();
  const navItems = getNavItems(role);

  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">ABC City Council</p>
          <p className="text-base font-bold text-slate-950">CivicConnect</p>
        </div>
        <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close navigation">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current view</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{role}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <dt className="font-medium">Requests</dt>
              <dd className="text-lg font-semibold text-slate-950">{visibleRequests.length}</dd>
            </div>
            <div>
              <dt className="font-medium">Bookings</dt>
              <dd className="text-lg font-semibold text-slate-950">{visibleAppointments.length}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">{content}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" onClick={onClose} aria-label="Close navigation overlay" />
          <aside className="relative h-full w-72 shadow-soft">{content}</aside>
        </div>
      ) : null}
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { currentUser, role, setRole, visibleRequests, visibleAppointments } = useAppData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/requests/')) {
      return 'Request Detail';
    }
    if (location.pathname === '/requests') {
      return role === 'Specialist Team Member' ? 'Assigned Requests' : 'Service Requests';
    }
    if (location.pathname === '/appointments') {
      return 'Appointments';
    }
    if (location.pathname === '/reports') {
      if (role === 'Citizen') return 'Feedback';
      return 'Reports';
    }
    return 'Dashboard';
  }, [location.pathname, role]);

  const urgentCount = visibleRequests.filter((request) => request.status === 'Escalated' || request.priority === 'Critical').length;
  const bookingCount = visibleAppointments.filter((appointment) => appointment.status === 'Invitation Sent' || appointment.status === 'Recommended').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Toast />
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold text-slate-950">{pageTitle}</h1>
                  <p className="hidden text-sm text-slate-500 sm:block">{currentUser.name} · {currentUser.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
                  <Search className="mr-2 h-4 w-4" />
                  Case, address, citizen
                </div>

                <div className="relative">
                  <button
                    className="relative rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                    onClick={() => setNotificationsOpen((value) => !value)}
                    aria-label="Open notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {urgentCount + bookingCount}
                    </span>
                  </button>
                  {notificationsOpen ? (
                    <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
                      <p className="text-sm font-semibold text-slate-950">Notifications</p>
                      <div className="mt-3 space-y-2">
                        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{urgentCount} urgent or escalated cases need review.</div>
                        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">{bookingCount} appointment invitations need action.</div>
                        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">AI triage suggestions refreshed for new portal submissions.</div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <label className="sr-only" htmlFor="role-switcher">Switch role</label>
                <select id="role-switcher" className="form-input mt-0 w-32 sm:w-52" value={role} onChange={(event) => setRole(event.target.value as Role)}>
                  {roles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
