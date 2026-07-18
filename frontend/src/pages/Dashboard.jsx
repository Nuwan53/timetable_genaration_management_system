import { useEffect, useState } from 'react';
import { courses, lecturers, venues, groups, slots } from '../api';
import { BookOpen, Users, MapPin, CalendarDays, Clock, LayoutGrid, Download, Check } from 'lucide-react';

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

  // Each step is tied to a real count where possible, so its checkmark
  // reflects actual setup progress rather than being purely decorative.
  const steps = [
    {
      key: 'courses', icon: <BookOpen size={16} />,
      title: 'Add Courses', desc: 'Create subject codes like MAT121β with credit hours.',
      done: (counts.courses ?? 0) > 0,
    },
    {
      key: 'lecturers', icon: <Users size={16} />,
      title: 'Add Lecturers', desc: 'Register lecturers with their email and department.',
      done: (counts.lecturers ?? 0) > 0,
    },
    {
      key: 'venues', icon: <MapPin size={16} />,
      title: 'Add Venues', desc: 'Set up lecture halls and labs — CS AUD, PLT, BLT, MLT01, and more.',
      done: (counts.venues ?? 0) > 0,
    },
    {
      key: 'groups', icon: <CalendarDays size={16} />,
      title: 'Add Student Groups', desc: 'Define groups such as Level I Physical Science.',
      done: (counts.groups ?? 0) > 0,
    },
    {
      key: 'slots', icon: <Clock size={16} />,
      title: 'Add Time Slots', desc: 'Create weekly time blocks, e.g. Monday 08:00–08:55.',
      done: (counts.slots ?? 0) > 0,
    },
    {
      key: 'timetable', icon: <LayoutGrid size={16} />,
      title: 'Build the Timetable', desc: 'Assign slots to courses, lecturers, and venues — conflicts are detected automatically.',
      done: false,
    },
    {
      key: 'export', icon: <Download size={16} />,
      title: 'Export PDF', desc: 'Download a printable timetable for any level or stream, ready to distribute.',
      done: false,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="stats-row">
        {stats.map((s, index) => (
          <div className="stat-card qs-fade-in" style={{ animationDelay: `${index * 60}ms` }} key={s.label}>
            <div className="stat-icon" style={{background: s.bg, color: s.color}}>{s.icon}</div>
            <div>
              <div className="stat-val">{s.val ?? '—'}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Quick Start Guide</span>
          <span className="badge badge-blue">{completedCount} / {steps.length} set up</span>
        </div>

        <div className="qs-timeline">
          {steps.map((step, index) => (
            <div
              className={`qs-step qs-fade-in${step.done ? ' qs-step-done' : ''}`}
              style={{ animationDelay: `${150 + index * 90}ms` }}
              key={step.key}
            >
              <div className="qs-step-marker">
                <div className={`qs-badge${step.done ? ' qs-badge-done' : ''}`}>
                  {step.done ? <Check size={14} /> : step.icon}
                </div>
                {index < steps.length - 1 && <div className={`qs-line${step.done ? ' qs-line-done' : ''}`} />}
              </div>
              <div className="qs-step-body">
                <div className="qs-step-title">{step.title}</div>
                <div className="qs-step-desc">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}