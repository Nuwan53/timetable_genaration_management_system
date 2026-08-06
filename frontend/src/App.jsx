import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, BookOpen, Users, MapPin, Clock, CalendarDays, LayoutGrid, LogOut, Search, Bell, ChevronRight, GraduationCap, CalendarSearch, UploadCloud, Wand2 , ShieldPlus, BookMarked, Sun, Moon, Menu} from 'lucide-react';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login      from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard  from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import Courses    from './pages/Courses';
import Lecturers  from './pages/Lecturers';
import Students   from './pages/Students';
import Venues     from './pages/Venues';
import Groups     from './pages/Groups';
import TimeSlots  from './pages/TimeSlots';
import Timetable  from './pages/Timetable';
import AdminAnalytics from './pages/AdminAnalytics';
import BulkUpload from './pages/BulkUpload';
import AutoScheduler from './pages/AutoScheduler';
import Admins from './pages/Admins';
import AdminProfile from './pages/AdminProfile';
import Curriculum from './pages/Curriculum';

const nav = [
  { to:'/',           label:'Dashboard',      icon:<LayoutDashboard size={16}/>, roles:['ADMIN','LECTURER','STUDENT'] },
  { to:'/timetable', label:'Timetable', icon:<LayoutGrid size={16}/>, roles:['ADMIN','LECTURER','STUDENT'] },  { to:'/courses',    label:'Courses',        icon:<BookOpen size={16}/>,        roles:['ADMIN'] },
  { to:'/lecturers',  label:'Lecturers',      icon:<Users size={16}/>,           roles:['ADMIN'] },
  { to:'/students',   label:'Students',       icon:<GraduationCap size={16}/>,   roles:['ADMIN'] },
  { to:'/venues',     label:'Venues',         icon:<MapPin size={16}/>,          roles:['ADMIN'] },
  { to:'/groups',     label:'Student Groups', icon:<CalendarDays size={16}/>,    roles:['ADMIN'] },
  { to:'/timeslots',  label:'Time Slots',     icon:<Clock size={16}/>,           roles:['ADMIN'] },
  { to:'/analytics',  label:'Availability',   icon:<CalendarSearch size={16}/>,  roles:['ADMIN'] },
  { to:'/bulk-upload', label:'Bulk Registration', icon:<UploadCloud size={16}/>, roles:['ADMIN'] },
  { to:'/auto-scheduler', label:'Auto Scheduler', icon:<Wand2 size={16}/>, roles:['ADMIN'] },
  { to:'/curriculum', label:'Curriculum', icon:<BookMarked size={16}/>, roles:['ADMIN'] },
  { to:'/admins', label:'Admins', icon:<ShieldPlus size={16}/>, roles:['ADMIN'] },


];

const pageTitle = {
  '/': 'Dashboard', '/student': 'Dashboard', '/lecturer': 'Dashboard', '/timetable': 'Timetable', '/courses': 'Courses',
  '/lecturers': 'Lecturers', '/venues': 'Venues',
  '/students': 'Students', '/groups': 'Student Groups', '/timeslots': 'Time Slots',
  '/analytics': 'Availability', '/bulk-upload': 'Bulk Registration', '/auto-scheduler': 'Auto Scheduler', '/admins': 'Admins', '/profile': 'My Profile', '/curriculum': 'Curriculum',


};

function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth > 860) setIsSidebarOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const visibleNav = nav.filter(n => n.roles.includes(user.role));
  const HomePage = user.role === 'ADMIN' ? Dashboard : user.role === 'LECTURER' ? LecturerDashboard : StudentDashboard;
  const currentTitle = pageTitle[pathname] || 'Dashboard';
  const avatarFallback = String(user.username || 'U').slice(0, 1).toUpperCase();

  return (
    <div className="app-shell">
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside id="main-sidebar" className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
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
            <NavLink className="sidebar-footer-link" to="/profile">Settings</NavLink>

            <NavLink to="/profile" className="sidebar-userchip" style={{ textDecoration: 'none' }}>
              <div className="sidebar-user-avatar" style={{ overflow: 'hidden' }}>
                {user.avatar_url ? <img src={user.avatar_url} alt="Profile avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarFallback}
              </div>
              <div>
                <div className="sidebar-user-name">{user.username}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
            </NavLink>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={14}/> Logout
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn mobile-menu-btn"
              type="button"
              onClick={() => setIsSidebarOpen((open) => !open)}
              aria-expanded={isSidebarOpen}
              aria-controls="main-sidebar"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
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
            <button 
              className="icon-btn theme-toggle-btn" 
              type="button" 
              onClick={toggleTheme} 
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="icon-btn" type="button" aria-label="Notifications"><Bell size={16} /></button>
            <div className="topbar-avatar" style={{ overflow: 'hidden' }}>
              {user.avatar_url ? <img src={user.avatar_url} alt="Profile avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarFallback}
            </div>
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
            <Route path="/timetable" element={<Timetable/>}/>            
            <Route path="/courses"    element={<ProtectedRoute allow={['ADMIN']}><Courses/></ProtectedRoute>}/>
            <Route path="/lecturers"  element={<ProtectedRoute allow={['ADMIN']}><Lecturers/></ProtectedRoute>}/>
            <Route path="/students"   element={<ProtectedRoute allow={['ADMIN']}><Students/></ProtectedRoute>}/>
            <Route path="/venues"     element={<ProtectedRoute allow={['ADMIN']}><Venues/></ProtectedRoute>}/>
            <Route path="/groups"     element={<ProtectedRoute allow={['ADMIN']}><Groups/></ProtectedRoute>}/>
            <Route path="/timeslots"  element={<ProtectedRoute allow={['ADMIN']}><TimeSlots/></ProtectedRoute>}/>
            <Route path="/analytics"  element={<ProtectedRoute allow={['ADMIN']}><AdminAnalytics/></ProtectedRoute>}/>
            <Route path="/bulk-upload" element={<ProtectedRoute allow={['ADMIN']}><BulkUpload/></ProtectedRoute>}/>
            <Route path="/auto-scheduler" element={<ProtectedRoute allow={['ADMIN']}><AutoScheduler/></ProtectedRoute>}/>
            <Route path="/admins" element={<ProtectedRoute allow={['ADMIN']}><Admins/></ProtectedRoute>}/>
            <Route path="/profile" element={<AdminProfile/>}/>
            <Route path="/curriculum" element={<ProtectedRoute allow={['ADMIN']}><Curriculum/></ProtectedRoute>}/>
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
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ style: { fontSize: 13, background: 'var(--surface)', color: 'var(--text)' } }}/>
          <Routes>
            <Route path="/login" element={<Login/>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword/></ProtectedRoute>} />
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
      </ThemeProvider>
    </BrowserRouter>
  );
}