import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bell, CalendarDays, Clock3, Filter, MapPin, MessageSquarePlus,
  ShieldAlert, UserRoundPen, CheckCircle2, LayoutGrid, ListChecks,
} from 'lucide-react';
import { lecturerApi, groups } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';


const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TABS = [
  { key: 'overview', label: 'Overview', icon: <LayoutGrid size={15} /> },
  { key: 'timetable', label: 'My Timetable', icon: <CalendarDays size={15} /> },
  { key: 'requests', label: 'Requests', icon: <MessageSquarePlus size={15} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { key: 'profile', label: 'Profile', icon: <UserRoundPen size={15} /> },
];

function formatTimeRange(slot) {
  return `${slot.timeslot.start_time.slice(0, 5)} - ${slot.timeslot.end_time.slice(0, 5)}`;
}

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '', department: '' });
  const [filters, setFilters] = useState({ day: '', subject: '', room: '' });
  const [studentGroups, setStudentGroups] = useState([]);
  const [availabilityForm, setAvailabilityForm] = useState({ request_sub_type: 'availability', requested_date: '', requested_start: '', requested_end: '', reason: '', selected_groups: [] });
  const [changeForm, setChangeForm] = useState({ schedule_slot: '', requested_room: '', requested_day: '', requested_start: '', requested_end: '', reason: '' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user?.lecturer_id) return;
    setLoading(true);
    try {
      const [scheduleRes, notificationsRes, requestsRes, profileRes, groupsRes] = await Promise.all([
        lecturerApi.schedule({ semester: 'S2-2026' }),
        lecturerApi.notifications(),
        lecturerApi.requests.list(),
        lecturerApi.me(),
        groups.list(),
      ]);

      setItems(scheduleRes.data);
      setNotifications(notificationsRes.data);
      setRequests(requestsRes.data);
      setProfile(profileRes.data);
      setStudentGroups(groupsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load lecturer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.lecturer_id]);

  const uniqueTimes = useMemo(() => {
    const times = new Map();
    items.forEach((slot) => {
      times.set(slot.timeslot.start_time, slot.timeslot);
    });
    return [...times.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((slot) => {
      const matchesDay = !filters.day || slot.timeslot.day === filters.day;
      const matchesSubject = !filters.subject || slot.course.code.toLowerCase().includes(filters.subject.toLowerCase()) || slot.course.name.toLowerCase().includes(filters.subject.toLowerCase());
      const matchesRoom = !filters.room || slot.venue.code.toLowerCase().includes(filters.room.toLowerCase()) || slot.venue.name.toLowerCase().includes(filters.room.toLowerCase());
      return matchesDay && matchesSubject && matchesRoom;
    });
  }, [items, filters]);

  const todaysRemaining = useMemo(() => {
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const now = new Date();

    return items
      .filter((slot) => {
        if (slot.timeslot.day !== todayName) return false;
        const [hour, minute] = slot.timeslot.end_time.split(':').map(Number);
        const slotEnd = new Date();
        slotEnd.setHours(hour, minute, 0, 0);
        return slotEnd >= now;
      })
      .sort((a, b) => a.timeslot.start_time.localeCompare(b.timeslot.start_time));
  }, [items]);

  // const conflicts = useMemo(() => {
  //   const seen = new Map();
  //   const results = [];

  //   items.forEach((slot) => {
  //     const key = `${slot.timeslot.day}-${slot.timeslot.start_time}`;
  //     const previous = seen.get(key);
  //     if (previous) {
  //       results.push({ key, first: previous, second: slot });
  //     } else {
  //       seen.set(key, slot);
  //     }
  //   });

  //   return results;
  // }, [items]);

  const stats = useMemo(() => {
    const teachingMinutes = items.reduce((total, slot) => {
      const [startHours, startMinutes] = slot.timeslot.start_time.split(':').map(Number);
      const [endHours, endMinutes] = slot.timeslot.end_time.split(':').map(Number);
      return total + ((endHours * 60 + endMinutes) - (startHours * 60 + startMinutes));
    }, 0);

    return {
      classes: items.length,
      hours: (teachingMinutes / 60).toFixed(1),
      rooms: new Set(items.map((slot) => slot.venue.code)).size,
      notifications: notifications.length,
    };
  }, [items, notifications]);

  const submitAvailability = async (event) => {
    event.preventDefault();

    if (!availabilityForm.requested_date || !availabilityForm.requested_start || !availabilityForm.requested_end) {
      toast.error('Please enter date, start time, and end time');
      return;
    }

    if (availabilityForm.request_sub_type === 'availability' && availabilityForm.selected_groups.length === 0) {
      toast.error('Please select at least one student group');
      return;
    }

    try {
      const payload = {
        request_type: 'AVAILABILITY',
        requested_date: availabilityForm.requested_date,
        requested_start: availabilityForm.requested_start,
        requested_end: availabilityForm.requested_end,
        reason: availabilityForm.request_sub_type === 'leave'
          ? `[Leave Request] ${availabilityForm.reason}`
          : availabilityForm.reason,
        student_groups: availabilityForm.request_sub_type === 'availability'
          ? availabilityForm.selected_groups
          : [],
      };

      await lecturerApi.requests.create(payload);
      toast.success(`${availabilityForm.request_sub_type === 'leave' ? 'Leave' : 'Availability'} request sent`);
      setAvailabilityForm({ request_sub_type: 'availability', requested_date: '', requested_start: '', requested_end: '', reason: '', selected_groups: [] });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not submit availability request');
    }
  };

  const submitChangeRequest = async (event) => {
    event.preventDefault();

    if (!changeForm.schedule_slot) {
      toast.error('Please select one of your classes');
      return;
    }

    try {
      const payload = {
        request_type: 'CHANGE',
        schedule_slot: changeForm.schedule_slot,
        requested_room: changeForm.requested_room,
        requested_start: changeForm.requested_start || null,
        requested_end: changeForm.requested_end || null,
        reason: changeForm.requested_day
          ? `[Preferred Day: ${changeForm.requested_day}] ${changeForm.reason}`
          : changeForm.reason,
      };

      await lecturerApi.requests.create(payload);
      toast.success('Change request sent');
      setChangeForm({ schedule_slot: '', requested_room: '', requested_day: '', requested_start: '', requested_end: '', reason: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not submit change request');
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    try {
      const { data } = await lecturerApi.updateMe(profile);
      setProfile(data);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not update profile');
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Stats row stays visible at all times — quick glance regardless of active tab */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}><CalendarDays size={20} /></div>
          <div><div className="stat-val">{stats.classes}</div><div className="stat-lbl">Classes This Week</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}><Clock3 size={20} /></div>
          <div><div className="stat-val">{stats.hours}</div><div className="stat-lbl">Total Teaching Hours</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}><MapPin size={20} /></div>
          <div><div className="stat-val">{stats.rooms}</div><div className="stat-lbl">Rooms Assigned</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><Bell size={20} /></div>
          <div><div className="stat-val">{stats.notifications}</div><div className="stat-lbl">Notifications</div></div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="dash-tabs" role="tablist" aria-label="Dashboard sections">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`dash-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
            {tab.key === 'notifications' && stats.notifications > 0 && (
              <span className="dash-tab-count">{stats.notifications}</span>
            )}
            {tab.key === 'requests' && requests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span className="dash-tab-count">{requests.filter((r) => r.status === 'PENDING').length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ---------------- Overview tab ---------------- */}
      {activeTab === 'overview' && (
        <>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Today's Remaining Classes</span>
              <span className="badge badge-blue">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {todaysRemaining.length === 0 && <div style={{ color: '#64748b' }}>No remaining classes today.</div>}
              {todaysRemaining.map((slot) => (
                <div key={slot.id} className="stat-card" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{slot.course.code} · {slot.course.name}</div>
                    <div className="stat-lbl">{slot.group.display || String(slot.group)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{formatTimeRange(slot)}</div>
                    <div className="stat-lbl">{slot.venue.code}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* {conflicts.length > 0 && (
            <div className="conflict-list">
              <h4>Conflict warning</h4>
              <ul>
                {conflicts.map((conflict) => (
                  <li key={conflict.key}>{conflict.first.timeslot.day} {conflict.first.timeslot.start_time.slice(0, 5)} is double-booked for your account.</li>
                ))}
              </ul>
            </div>
          )} */}
        </>
      )}

      {/* ---------------- Timetable tab ---------------- */}
      {activeTab === 'timetable' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">My Timetable</span>
            <span className="badge badge-green">Read only</span>
          </div>
          <div className="tt-controls">
            <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
              <label><Filter size={12} /> Day</label>
              <select value={filters.day} onChange={(event) => setFilters((current) => ({ ...current, day: event.target.value }))}>
                <option value="">All days</option>
                {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: 220 }}>
              <label>Subject</label>
              <input value={filters.subject} onChange={(event) => setFilters((current) => ({ ...current, subject: event.target.value }))} placeholder="Search by subject" />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: 180 }}>
              <label>Room</label>
              <input value={filters.room} onChange={(event) => setFilters((current) => ({ ...current, room: event.target.value }))} placeholder="Search by room" />
            </div>
          </div>

          <div className="tt-grid-wrap">
            <table className="tt-grid">
              <thead>
                <tr>
                  <th>Time</th>
                  {DAYS.map((day) => <th key={day}>{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {uniqueTimes.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No timetable items found.</td>
                  </tr>
                )}
                {uniqueTimes.map((timeSlot) => (
                  <tr key={timeSlot.id}>
                    <td className="time-col">{timeSlot.start_time.slice(0, 5)}<br /><span style={{ fontSize: 9, opacity: 0.7 }}>{timeSlot.end_time.slice(0, 5)}</span></td>
                    {DAYS.map((day) => {
                      const slot = filteredItems.find((item) => item.timeslot.day === day && item.timeslot.start_time === timeSlot.start_time);
                      return (
                        <td key={day}>
                          {slot ? (
                            <div className="slot-cell" style={{ cursor: 'default' }}>
                              <div style={{ fontWeight: 600 }}>{slot.course.code}</div>
                              <div style={{ opacity: 0.85 }}>{slot.venue.code}</div>
                              <div style={{ opacity: 0.7, fontSize: 10 }}>{slot.group.display || String(slot.group)}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Requests tab ---------------- */}
      {activeTab === 'requests' && (
        <>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Availability / Leave Request</span>
              <MessageSquarePlus size={16} />
            </div>
            <form onSubmit={submitAvailability} className="form-row">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Request Type</label>
                <div style={{ display: 'flex', gap: 20, marginTop: 5 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal' }}>
                    <input
                      type="radio"
                      name="request_sub_type"
                      value="availability"
                      checked={availabilityForm.request_sub_type === 'availability'}
                      onChange={(e) => setAvailabilityForm((current) => ({ ...current, request_sub_type: e.target.value }))}
                    />
                    Availability Request
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal' }}>
                    <input
                      type="radio"
                      name="request_sub_type"
                      value="leave"
                      checked={availabilityForm.request_sub_type === 'leave'}
                      onChange={(e) => setAvailabilityForm((current) => ({ ...current, request_sub_type: e.target.value }))}
                    />
                    Leave Request
                  </label>
                </div>
              </div>

              {availabilityForm.request_sub_type === 'availability' && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Target Student Group(s)</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 10,
                    marginTop: 8,
                    padding: '10px 15px',
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    maxHeight: 150,
                    overflowY: 'auto'
                  }}>
                    {studentGroups.map((group) => {
                      const label = `Level ${group.level} — ${group.stream}${group.subgroup ? ` (${group.subgroup})` : ''}`;
                      const isChecked = availabilityForm.selected_groups.includes(group.id);
                      return (
                        <label key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 'normal' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setAvailabilityForm((current) => {
                                const groups = current.selected_groups.includes(group.id)
                                  ? current.selected_groups.filter((id) => id !== group.id)
                                  : [...current.selected_groups, group.id];
                                return { ...current, selected_groups: groups };
                              });
                            }}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Date</label>
                <input type="date" value={availabilityForm.requested_date} onChange={(event) => setAvailabilityForm((current) => ({ ...current, requested_date: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input type="time" value={availabilityForm.requested_start} onChange={(event) => setAvailabilityForm((current) => ({ ...current, requested_start: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input type="time" value={availabilityForm.requested_end} onChange={(event) => setAvailabilityForm((current) => ({ ...current, requested_end: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea rows={4} value={availabilityForm.reason} onChange={(event) => setAvailabilityForm((current) => ({ ...current, reason: event.target.value }))} />
              </div>
              <div className="modal-footer" style={{ gridColumn: '1 / -1' }}>
                <button className="btn btn-primary" type="submit">
                  Submit {availabilityForm.request_sub_type === 'leave' ? 'Leave' : 'Availability'} Request
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
               <span className="card-title">Change Request</span>
               <UserRoundPen size={16} />
            </div>
            <form onSubmit={submitChangeRequest} className="form-row">
               <div className="form-group">
                 <label>Class</label>
                 <select value={changeForm.schedule_slot} onChange={(event) => setChangeForm((current) => ({ ...current, schedule_slot: event.target.value }))}>
                   <option value="">Select one of your classes</option>
                   {items.map((slot) => <option key={slot.id} value={slot.id}>{slot.course.code} · {slot.timeslot.day} {slot.timeslot.start_time.slice(0, 5)}</option>)}
                 </select>
               </div>
               <div className="form-group">
                 <label>Requested Room</label>
                 <input value={changeForm.requested_room} onChange={(event) => setChangeForm((current) => ({ ...current, requested_room: event.target.value }))} />
               </div>
               <div className="form-group">
                 <label>Preferred Day (Optional)</label>
                 <select value={changeForm.requested_day} onChange={(event) => setChangeForm((current) => ({ ...current, requested_day: event.target.value }))}>
                   <option value="">Select preferred day</option>
                   {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                 </select>
               </div>
               <div className="form-group">
                 <label>Requested Start</label>
                 <input type="time" value={changeForm.requested_start} onChange={(event) => setChangeForm((current) => ({ ...current, requested_start: event.target.value }))} />
               </div>
               <div className="form-group">
                 <label>Requested End</label>
                 <input type="time" value={changeForm.requested_end} onChange={(event) => setChangeForm((current) => ({ ...current, requested_end: event.target.value }))} />
               </div>
               <div className="form-group">
                 <label>Reason</label>
                 <textarea rows={4} value={changeForm.reason} onChange={(event) => setChangeForm((current) => ({ ...current, reason: event.target.value }))} />
               </div>
               <div className="modal-footer" style={{ gridColumn: '1 / -1' }}>
                 <button className="btn btn-primary" type="submit">Submit Change Request</button>
               </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Pending Requests</span>
              <ListChecks size={16} />
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {requests.length === 0 && <div style={{ color: '#64748b' }}>No requests submitted yet.</div>}
              {requests.map((request) => (
                <div key={request.id} className="stat-card" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{request.request_type}</div>
                    <div className="stat-lbl">{request.reason || 'No reason supplied'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={request.status === 'APPROVED' ? 'badge badge-green' : request.status === 'REJECTED' ? 'badge badge-amber' : 'badge badge-blue'}>{request.status}</span>
                    <div className="stat-lbl" style={{ marginTop: 8 }}>{request.created_at?.slice(0, 10)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ---------------- Notifications tab ---------------- */}
      {activeTab === 'notifications' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Notifications</span>
            <Bell size={16} />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {notifications.length === 0 && <div style={{ color: '#64748b' }}>No notifications yet.</div>}
            {notifications.map((notification) => (
              <div key={notification.id} className="stat-card" style={{ alignItems: 'flex-start' }}>
                <div className="stat-icon" style={{ background: notification.is_read ? '#e2e8f0' : '#dbeafe', color: '#1e40af' }}><ShieldAlert size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700 }}>{notification.title}</div>
                  <div className="stat-lbl" style={{ marginTop: 4 }}>{notification.message}</div>
                  <div style={{ marginTop: 8 }} className={notification.is_read ? 'badge badge-green' : 'badge badge-amber'}>{notification.notification_type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Profile tab ---------------- */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Profile</span>
            <CheckCircle2 size={16} />
          </div>
          <form onSubmit={saveProfile} className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input value={profile.department} onChange={(event) => setProfile((current) => ({ ...current, department: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Assigned Subjects</label>
              <input readOnly value={[...new Set(items.map((slot) => slot.course.code))].join(', ')} />
            </div>
            <div className="modal-footer" style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-primary" type="submit">Save Profile</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}