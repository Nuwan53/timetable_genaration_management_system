import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Search,
  Send,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { StudentTabProvider, useStudentTab } from './context/StudentTabContext';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import Courses from './pages/Courses';
import Lecturers from './pages/Lecturers';
import Students from './pages/Students';
import Venues from './pages/Venues';
import Groups from './pages/Groups';
import TimeSlots from './pages/TimeSlots';
import Timetable from './pages/Timetable';
import PublicationManager from './pages/PublicationManager';
import ReportsAnalytics from './pages/ReportsAnalytics';
import SystemSettings from './pages/SystemSettings';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'LECTURER', 'STUDENT'], type: 'link' },
  { to: '/timetable', label: 'Timetable', icon: LayoutGrid, roles: ['ADMIN', 'LECTURER', 'STUDENT'], type: 'link' },
  { to: '/courses', label: 'Courses', icon: BookOpen, roles: ['ADMIN'], type: 'link' },
  { to: '/lecturers', label: 'Lecturers', icon: Users, roles: ['ADMIN'], type: 'link' },
  { to: '/students', label: 'Students', icon: GraduationCap, roles: ['ADMIN'], type: 'link' },
  { to: '/venues', label: 'Venues', icon: MapPin, roles: ['ADMIN'], type: 'link' },
  { to: '/groups', label: 'Student Groups', icon: CalendarDays, roles: ['ADMIN'], type: 'link' },
  { to: '/timeslots', label: 'Time Slots', icon: Clock3, roles: ['ADMIN'], type: 'link' },
  { to: '/publication', label: 'Publication', icon: Send, roles: ['ADMIN'], type: 'link' },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN'], type: 'link' },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'], type: 'link' },
];

// Extra sidebar tab items shown only for STUDENT role (controls StudentDashboard tabs)
const studentTabItems = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'subjects', label: 'Enrolled Subjects', icon: BookOpen },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
];

const pageTitle = {
  '/': 'Dashboard',
  '/student': 'Dashboard',
  '/lecturer': 'Dashboard',
  '/timetable': 'Timetable',
  '/courses': 'Courses',
  '/lecturers': 'Lecturers',
  '/venues': 'Venue Management',
  '/students': 'Students',
  '/groups': 'Student Groups',
  '/timeslots': 'Time Slots',
  '/publication': 'Publication Manager',
  '/reports': 'Reports & Analytics',
  '/settings': 'System Settings',
};

function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));
  const HomePage = user.role === 'ADMIN' ? Dashboard : user.role === 'LECTURER' ? LecturerDashboard : StudentDashboard;
  const currentTitle = pageTitle[pathname] || 'Dashboard';
  const avatarFallback = String(user.username || 'U').slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-800/80 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/20">
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold tracking-wide text-white shadow-lg shadow-sky-500/20">
            FS
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold text-white">Faculty of Science</div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Timetable System</div>
          </div>
        </div>

        <StudentSidebarNav visibleNav={visibleNav} userRole={user.role} />

        <div className="border-t border-white/10 p-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white">
                {avatarFallback}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{user.username}</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{user.role}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 hover:text-white"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="ml-[260px] min-h-screen bg-slate-50">
        <header className="fixed left-[260px] right-0 top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>

            <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
              <span>Faculty of Science</span>
              <ChevronRight size={14} />
              <span className="font-medium text-slate-700">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="hidden h-11 w-[320px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-400 lg:flex">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search timetable data..."
                aria-label="Search timetable data"
                className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-sm font-semibold text-white">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile avatar" className="h-full w-full object-cover" />
                ) : (
                  avatarFallback
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">{user.username}</div>
                <div className="text-xs text-slate-500">{user.role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-screen pt-[72px]">
          <div className="px-6 py-6 lg:px-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">Admin Console</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-950">{currentTitle}</h1>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm md:inline-flex">
                Live system status
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/lecturer" element={<LecturerDashboard />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/courses" element={<ProtectedRoute allow={['ADMIN']}><Courses /></ProtectedRoute>} />
              <Route path="/lecturers" element={<ProtectedRoute allow={['ADMIN']}><Lecturers /></ProtectedRoute>} />
              <Route path="/students" element={<ProtectedRoute allow={['ADMIN']}><Students /></ProtectedRoute>} />
              <Route path="/venues" element={<ProtectedRoute allow={['ADMIN']}><Venues /></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute allow={['ADMIN']}><Groups /></ProtectedRoute>} />
              <Route path="/timeslots" element={<ProtectedRoute allow={['ADMIN']}><TimeSlots /></ProtectedRoute>} />
              <Route path="/publication" element={<ProtectedRoute allow={['ADMIN']}><PublicationManager /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute allow={['ADMIN']}><ReportsAnalytics /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute allow={['ADMIN']}><SystemSettings /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

// Extracted nav component so it can consume StudentTabContext
function StudentSidebarNav({ visibleNav, userRole }) {
  const { activeTab, setActiveTab } = useStudentTab();
  const { pathname } = useLocation();
  const isStudentHome = pathname === '/';

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <div className="space-y-1">
        {visibleNav.map((item) => {
          const Icon = item.icon;

          if (item.type === 'action') {
            return (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          }

          // For STUDENT: Dashboard and Timetable links control activeTab (both stay on / route)
          if (userRole === 'STUDENT') {
            const tabKey = item.to === '/' ? 'dashboard' : item.to === '/timetable' ? 'timetable' : null;
            if (tabKey) {
              const isActive = isStudentHome && activeTab === tabKey;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => {
                    setActiveTab(tabKey);
                    if (!isStudentHome) window.history.pushState({}, '', '/');
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-500/15 text-white ring-1 ring-sky-400/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            }
          } else {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-500/15 text-white ring-1 ring-sky-400/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          }

          return null;
        })}

        {/* Student-only extra sidebar tabs */}
        {userRole === 'STUDENT' && (
          <>
            <div className="my-2 mx-2 border-t border-white/10" />
            {studentTabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = isStudentHome && activeTab === tab.key;
              return (
                <NavLink
                  key={tab.key}
                  to="/"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(tab.key);
                    // navigate to home if not already there
                    if (!isStudentHome) window.history.pushState({}, '', '/');
                  }}
                  className={() =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-sky-500/15 text-white ring-1 ring-sky-400/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudentTabProvider>
          <Toaster position="top-right" toastOptions={{ style: { fontSize: 13 } }} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            />
          </Routes>
        </StudentTabProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}