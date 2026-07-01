import { useEffect, useState } from 'react';
import { slots } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user?.lecturer_id) return;
    slots.list({ lecturer: user.lecturer_id, semester: 'S2-2026' }).then((r) => setItems(r.data));
  }, [user]);

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card"><div><div className="stat-val">{items.length}</div><div className="stat-lbl">Assigned Sessions</div></div></div>
        <div className="stat-card"><div><div className="stat-val">{user?.lecturer_id ?? '—'}</div><div className="stat-lbl">Lecturer Profile</div></div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Lecturer Timetable</span></div>
        <div style={{ display: 'grid', gap: 12 }}>
          {items.length === 0 && <div style={{ color: '#64748b' }}>No sessions assigned yet.</div>}
          {items.map((slot) => (
            <div key={slot.id} className="stat-card" style={{ justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{slot.course.code}</div>
                <div className="stat-lbl">{slot.group.display || String(slot.group)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{slot.timeslot.day} {slot.timeslot.start_time.slice(0, 5)} - {slot.timeslot.end_time.slice(0, 5)}</div>
                <div className="stat-lbl">{slot.venue.code}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}