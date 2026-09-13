import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { courses, lecturers, venues, groups, slots, lecturerApi } from '../api';
import { BookOpen, Users, MapPin, CalendarDays, Clock, LayoutGrid, Download, Check, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [requests, setRequests] = useState([]);

  const loadRequests = () => {
    lecturerApi.requests.list()
      .then((res) => {
        setRequests(res.data);
      })
      .catch((err) => {
        console.error("Failed to load requests", err);
      });
  };

  useEffect(() => {
    Promise.all([
      courses.list(), lecturers.list(), venues.list(), groups.list(), slots.list()
    ]).then(([c, l, v, g, s]) => {
      setCounts({ courses: c.data.length, lecturers: l.data.length,
                  venues: v.data.length, groups: g.data.length, slots: s.data.length });
    });
    loadRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await lecturerApi.requests.approve(id);
      toast.success('Request approved successfully');
      loadRequests();
    } catch (err) {
      toast.error('Unable to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      await lecturerApi.requests.reject(id);
      toast.success('Request rejected successfully');
      loadRequests();
    } catch (err) {
      toast.error('Unable to reject request');
    }
  };

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

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Quick Start Guide */}
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

        {/* Pending Lecturer Requests */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Lecturer Requests</span>
            <span className="badge badge-amber">{pendingRequests.length} pending</span>
          </div>
          <div style={{ display: 'grid', gap: 15, marginTop: 15 }}>
            {pendingRequests.length === 0 ? (
              <div style={{ color: '#64748b', padding: '10px 0' }}>No pending requests from lecturers.</div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 15, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${req.request_type === 'CHANGE' ? 'badge-blue' : 'badge-green'}`}>
                      {req.request_type === 'CHANGE' ? 'Change Request' : 'Availability / Leave'}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {req.created_at ? req.created_at.slice(0, 10) : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: 13 }}>
                    <strong>Lecturer:</strong> {req.lecturer_name || 'Unknown Lecturer'}
                  </div>

                  {req.request_type === 'CHANGE' ? (
                    <div style={{ fontSize: 12, background: '#f8fafc', padding: 8, borderRadius: 6, display: 'grid', gap: 4 }}>
                      <div><strong>Class:</strong> {req.course_code} ({req.old_room} on {req.slot_day} {req.slot_start?.slice(0, 5)}–{req.slot_end?.slice(0, 5)})</div>
                      <div><strong>Requested Room:</strong> {req.requested_room || 'N/A'}</div>
                      {req.requested_start && (
                        <div><strong>Requested Time:</strong> {req.requested_start.slice(0, 5)}–{req.requested_end?.slice(0, 5)}</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, background: '#f8fafc', padding: 8, borderRadius: 6, display: 'grid', gap: 4 }}>
                      <div><strong>Requested Date:</strong> {req.requested_date}</div>
                      <div><strong>Requested Time:</strong> {req.requested_start?.slice(0, 5)}–{req.requested_end?.slice(0, 5)}</div>
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: '#475569', wordBreak: 'break-word' }}>
                    <strong>Reason:</strong> {req.reason || 'No reason specified'}
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 5 }}>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="btn"
                      style={{
                        padding: '5px 10px',
                        fontSize: 12,
                        color: '#dc2626',
                        borderColor: '#fca5a5',
                        background: '#fef2f2',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: '1px solid #fca5a5'
                      }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="btn btn-primary"
                      style={{
                        padding: '5px 10px',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        borderRadius: 4
                      }}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}