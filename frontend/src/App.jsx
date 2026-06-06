import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, BookOpen, Users, MapPin, Clock, CalendarDays, LayoutGrid } from 'lucide-react';
import './index.css';

import Dashboard  from './pages/Dashboard';
import Courses    from './pages/Courses';
import Lecturers  from './pages/Lecturers';
import Venues     from './pages/Venues';
import Groups     from './pages/Groups';
import TimeSlots  from './pages/TimeSlots';
import Timetable  from './pages/Timetable';

const nav = [
  { to:'/',           label:'Dashboard',      icon:<LayoutDashboard size={16}/> },
  { to:'/timetable',  label:'Timetable',      icon:<LayoutGrid size={16}/> },
  { to:'/courses',    label:'Courses',        icon:<BookOpen size={16}/> },
  { to:'/lecturers',  label:'Lecturers',      icon:<Users size={16}/> },
  { to:'/venues',     label:'Venues',         icon:<MapPin size={16}/> },
  { to:'/groups',     label:'Student Groups', icon:<CalendarDays size={16}/> },
  { to:'/timeslots',  label:'Time Slots',     icon:<Clock size={16}/> },
];

const pageTitle = {
  '/': 'Dashboard', '/timetable': 'Timetable', '/courses': 'Courses',
  '/lecturers': 'Lecturers', '/venues': 'Venues',
  '/groups': 'Student Groups', '/timeslots': 'Time Slots',
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13 } }}/>
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
            {nav.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to==='/'} className={({isActive})=>`nav-item${isActive?' active':''}`}>
                {n.icon} {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">Faculty of Science · B.Sc.</div>
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
              <Route path="/courses"    element={<Courses/>}/>
              <Route path="/lecturers"  element={<Lecturers/>}/>
              <Route path="/venues"     element={<Venues/>}/>
              <Route path="/groups"     element={<Groups/>}/>
              <Route path="/timeslots"  element={<TimeSlots/>}/>
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
