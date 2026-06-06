import { useEffect, useState } from 'react';
import { courses, lecturers, venues, groups, slots } from '../api';
import { BookOpen, Users, MapPin, CalendarDays, LayoutGrid } from 'lucide-react';

export default function Dashboard() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    Promise.all([
      courses.list(), lecturers.list(), venues.list(), groups.list(), slots.list()
    ]).then(([c, l, v, g, s]) => {
      setCounts({ courses: c.data.length, lecturers: l.data.length,
                  venues: v.data.length, groups: g.data.length, slots: s.data.length });
    });
  }, []);

  const stats = [
    { label: 'Courses',       val: counts.courses,   icon: <BookOpen size={20}/>,     bg: '#dbeafe', color: '#1e40af' },
    { label: 'Lecturers',     val: counts.lecturers, icon: <Users size={20}/>,        bg: '#dcfce7', color: '#166534' },
    { label: 'Venues',        val: counts.venues,    icon: <MapPin size={20}/>,        bg: '#fef3c7', color: '#92400e' },
    { label: 'Student Groups',val: counts.groups,    icon: <CalendarDays size={20}/>,  bg: '#f3e8ff', color: '#6b21a8' },
    { label: 'Scheduled Slots',val: counts.slots,    icon: <LayoutGrid size={20}/>,   bg: '#ccfbf1', color: '#065f46' },
  ];

  return (
    <div>
      <div className="stats-row">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{background: s.bg, color: s.color}}>{s.icon}</div>
            <div>
              <div className="stat-val">{s.val ?? '—'}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Quick Start Guide</span></div>
        <ol style={{fontSize:14, lineHeight:2.2, paddingLeft:20, color:'#475569'}}>
          <li>Add <strong>Courses</strong> (subject codes like MAT121β)</li>
          <li>Add <strong>Lecturers</strong> with their email and department</li>
          <li>Add <strong>Venues</strong> (CS AUD, PLT, BLT, MLT01...)</li>
          <li>Add <strong>Student Groups</strong> (Level I Physical Science, etc.)</li>
          <li>Add <strong>Time Slots</strong> (Monday 08:00–08:55, etc.)</li>
          <li>Go to <strong>Timetable</strong> to assign slots — conflicts are detected automatically</li>
          <li>Use <strong>Export PDF</strong> to download the printable timetable</li>
        </ol>
      </div>
    </div>
  );
}
