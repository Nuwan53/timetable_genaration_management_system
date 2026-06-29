import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, BookOpen, Users, MapPin, Clock, CalendarDays, LayoutGrid, LogOut } from 'lucide-react';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
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
  '/': 'Dashboard', '/timetable': 'Timetable', '/courses': 'Courses',
  '/lecturers': 'Lecturers', '/venues': 'Venues',
  '/groups': 'Student Groups', '/timeslots': 'Time Slots',
};

function AppShell() {
  const { user, logout } = useAuth();
  const visibleNav = nav.filter(n => n.roles.includes(user.role));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>📅</span>
          <div>
            <div>Timetable</div>
            <div style={{fontSize:10,opacity:.5,fontWeight:400}}>Management System</div>
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
          <div style={{marginBottom:8}}>{user.username} · {user.role}</div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={14}/> Logout
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <Routes>
            {Object.entries(pageTitle).map(([path, title]) => (
              <Route key={path} path={path} element={<h1>{title}</h1>}/>
            ))}
          </Routes>
          <span style={{fontSize:12,color:'#94a3b8'}}>S2 · 2026</span>
        </div>
        <div className="content">
          <Routes>
            <Route path="/"           element={<Dashboard/>}/>
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