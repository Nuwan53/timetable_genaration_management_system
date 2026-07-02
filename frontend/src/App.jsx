import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, BookOpen, Users, MapPin, Clock, CalendarDays, LayoutGrid, LogOut, Search, Bell, ChevronRight } from 'lucide-react';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import Courses    from './pages/Courses';
import Lecturers  from './pages/Lecturers';
import Venues     from './pages/Venues';
import Groups     from './pages/Groups';
import TimeSlots  from './pages/TimeSlots';
import Timetable  from './pages/Timetable';

const nav = [
  { to:'/',           label:'Dashboard',      icon:<LayoutDashboard size={16}/>, roles:['ADMIN','LECTURER','STUDENT'] },
  { to:'/timetable',  label:'Timetable',      icon:<LayoutGrid size={16}/>,      roles:['ADMIN','LECTURER','STUDENT'] },
  { to:'/courses',    label:'Courses',        icon:<BookOpen size={16}/>,        roles:['ADMIN'] },
  { to:'/lecturers',  label:'Lecturers',      icon:<Users size={16}/>,           roles:['ADMIN'] },
  { to:'/venues',     label:'Venues',         icon:<MapPin size={16}/>,          roles:['ADMIN'] },
  { to:'/groups',     label:'Student Groups', icon:<CalendarDays size={16}/>,    roles:['ADMIN'] },
  { to:'/timeslots',  label:'Time Slots',     icon:<Clock size={16}/>,           roles:['ADMIN'] },
];

const pageTitle = {
  '/': 'Dashboard', '/student': 'Dashboard', '/lecturer': 'Dashboard', '/timetable': 'Timetable', '/courses': 'Courses',
  '/lecturers': 'Lecturers', '/venues': 'Venues',
  '/groups': 'Student Groups', '/timeslots': 'Time Slots',
};

function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const visibleNav = nav.filter(n => n.roles.includes(user.role));
  const HomePage = user.role === 'ADMIN' ? Dashboard : user.role === 'LECTURER' ? LecturerDashboard : StudentDashboard;
  const currentTitle = pageTitle[pathname] || 'Dashboard';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">FS</div>
          <div>
            <div className="sidebar-brand-title">Faculty of Science</div>
            <div className="sidebar-brand-subtitle">Timetable System</div>
          </div>
        </div>
        <nav>
          {visibleNav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==='/'} className={({isActive})=>`nav-item${isActive?' active':''}`}>
              {n.icon} {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a className="sidebar-footer-link" href="#">Help Center</a>
          <a className="sidebar-footer-link" href="#">Settings</a>
          <div className="sidebar-userchip">
            <div className="sidebar-user-avatar">{String(user.username || 'U').slice(0, 1).toUpperCase()}</div>
            <div>
              <div className="sidebar-user-name">{user.username}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={14}/> Logout
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Timetable Manager</div>
            <div className="topbar-search">
              <Search size={16} />
              <input type="text" placeholder="Search sessions..." aria-label="Search sessions" />
            </div>
          </div>
          <div className="topbar-right">
            <button className="topbar-link" type="button">Current Semester</button>
            <button className="topbar-link" type="button">Exam Period</button>
            <button className="topbar-link" type="button">Archives</button>
            <span className="topbar-divider" />
            <button className="icon-btn" type="button" aria-label="Notifications"><Bell size={16} /></button>
            <div className="topbar-avatar">{String(user.username || 'U').slice(0, 1).toUpperCase()}</div>
          </div>
        </div>
        <div className="content">
          <div className="page-header">
            <div className="page-header-title">{currentTitle}</div>
            <div className="page-header-breadcrumb">
              <span>Faculty of Science</span>
              <ChevronRight size={12} />
              <span>{currentTitle}</span>
            </div>
          </div>
          <Routes>
            <Route path="/"           element={<HomePage/>}/>
            <Route path="/student"    element={<StudentDashboard/>}/>
            <Route path="/lecturer"   element={<LecturerDashboard/>}/>
            <Route path="/timetable"  element={<Timetable/>}/>
            <Route path="/courses"    element={<ProtectedRoute allow={['ADMIN']}><Courses/></ProtectedRoute>}/>
            <Route path="/lecturers"  element={<ProtectedRoute allow={['ADMIN']}><Lecturers/></ProtectedRoute>}/>
            <Route path="/venues"     element={<ProtectedRoute allow={['ADMIN']}><Venues/></ProtectedRoute>}/>
            <Route path="/groups"     element={<ProtectedRoute allow={['ADMIN']}><Groups/></ProtectedRoute>}/>
            <Route path="/timeslots"  element={<ProtectedRoute allow={['ADMIN']}><TimeSlots/></ProtectedRoute>}/>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { fontSize: 13 } }}/>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell/>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}