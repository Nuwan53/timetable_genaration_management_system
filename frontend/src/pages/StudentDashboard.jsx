import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BadgeInfo,
  BookOpen,
  CalendarDays,
  Clock3,
  Bell,
  Filter,
  Mail,
  Megaphone,
  Phone,
  Search,
  Upload,
  UserRound,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { studentApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useStudentTab } from '../context/StudentTabContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;


function formatTimeRange(slot) {
  return `${slot.timeslot.start_time.slice(0, 5)} - ${slot.timeslot.end_time.slice(0, 5)}`;
}

function getNotificationTone(type) {
  switch (type) {
    case 'CANCEL':
      return { background: '#fee2e2', color: '#991b1b' };
    case 'ROOM_CHANGE':
      return { background: '#dbeafe', color: '#1e3a8a' };
    case 'RESCHEDULE':
      return { background: '#fef3c7', color: '#92400e' };
    default:
      return { background: '#e2e8f0', color: '#334155' };
  }
}

export default function StudentDashboard() {
  const { user, updateUser } = useAuth();
  const { activeTab } = useStudentTab();
  const [dashboard, setDashboard] = useState(null);
  const [filters, setFilters] = useState({ day: '', subject: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', contact_number: '', registration_number: '', avatar_url: '', enrolled_subjects: [], student_group: null });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [fileMessage, setFileMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      if (user?.role !== 'STUDENT') return;

      if (active) {
        setLoading(true);
      }

      try {
        const { data } = await studentApi.dashboard({ semester: 'S2-2026' });
        if (!active) return;
        setDashboard(data);
        setProfileForm(data.profile);
        updateUser((current) => ({ ...current, ...data.profile }));
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.detail || 'Failed to load student dashboard');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [user?.role, user?.student_group_id, updateUser]);

  const avatarPreview = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    return profileForm.avatar_url || '';
  }, [avatarFile, profileForm.avatar_url]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const timetable = useMemo(() => dashboard?.timetable || [], [dashboard?.timetable]);
  const notifications = useMemo(() => dashboard?.notifications || [], [dashboard?.notifications]);
  const announcements = useMemo(() => dashboard?.announcements || [], [dashboard?.announcements]);
  const todaysRemaining = useMemo(() => dashboard?.todays_remaining || [], [dashboard?.todays_remaining]);
  const stats = dashboard?.stats || { classes_today: 0, weekly_hours: 0, subjects_enrolled: 0 };

  const uniqueTimes = useMemo(() => {
    const times = new Map();
    timetable.forEach((slot) => {
      times.set(slot.timeslot.start_time, slot.timeslot);
    });
    return [...times.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timetable]);

  const visibleSlots = useMemo(() => {
    return timetable.filter((slot) => {
      const matchesDay = !filters.day || slot.timeslot.day === filters.day;
      const subjectText = `${slot.course.code} ${slot.course.name}`.toLowerCase();
      const matchesSubject = !filters.subject || subjectText.includes(filters.subject.toLowerCase());
      return matchesDay && matchesSubject;
    });
  }, [timetable, filters]);

  const enrolledSubjects = profileForm.enrolled_subjects || [];
  const todayLabel = dashboard?.today_name || new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setFileMessage('');
      return;
    }

    const isAllowedType = ['image/jpeg', 'image/png'].includes(file.type);
    const isAllowedSize = file.size <= MAX_AVATAR_BYTES;

    if (!isAllowedType || !isAllowedSize) {
      const message = 'Avatar must be a JPG or PNG image up to 2 MB.';
      setFileMessage(message);
      setAvatarFile(null);
      event.target.value = '';
      toast.error(message);
      return;
    }

    setFileMessage('');
    setAvatarFile(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append('name', profileForm.name || '');
      payload.append('email', profileForm.email || '');
      payload.append('contact_number', profileForm.contact_number || '');
      if (passwordForm.current_password || passwordForm.new_password || passwordForm.confirm_password) {
        payload.append('current_password', passwordForm.current_password || '');
        payload.append('new_password', passwordForm.new_password || '');
        payload.append('confirm_password', passwordForm.confirm_password || '');
      }
      if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      const { data } = await studentApi.profile.updateMe(payload);
      setProfileForm(data);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setAvatarFile(null);
      updateUser((current) => ({ ...current, ...data }));
      toast.success('Profile updated');
    } catch (error) {
      const detail = error.response?.data?.detail;
      const avatarError = error.response?.data?.avatar?.[0];
      toast.error(detail || avatarError || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };


  const renderDashboardTab = () => (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}><CalendarDays size={20} /></div>
          <div><div className="stat-val">{stats.classes_today}</div><div className="stat-lbl">Classes Today</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}><Clock3 size={20} /></div>
          <div><div className="stat-val">{stats.weekly_hours}</div><div className="stat-lbl">Total Weekly Hours</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}><BookOpen size={20} /></div>
          <div><div className="stat-val">{stats.subjects_enrolled}</div><div className="stat-lbl">Subjects Enrolled</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Today&apos;s Remaining Classes</span>
          <span className="badge badge-blue">{todayLabel}</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {todaysRemaining.length === 0 && <div style={{ color: '#64748b' }}>No remaining classes today.</div>}
          {todaysRemaining.map((slot) => (
            <div key={slot.id} className="stat-card" style={{ justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{slot.course.code} · {slot.course.name}</div>
                <div className="stat-lbl">{slot.venue.code} · {slot.lecturer.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{formatTimeRange(slot)}</div>
                <div className="stat-lbl">{slot.timeslot.day}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimetableTab = () => (
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
        <div className="form-group" style={{ margin: 0, minWidth: 240 }}>
          <label><Search size={12} /> Subject</label>
          <input value={filters.subject} onChange={(event) => setFilters((current) => ({ ...current, subject: event.target.value }))} placeholder="Search by course code or name" />
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
                  const slot = visibleSlots.find((item) => item.timeslot.day === day && item.timeslot.start_time === timeSlot.start_time);
                  return (
                    <td key={day}>
                      {slot ? (
                        <div className="slot-cell" style={{ cursor: 'default' }}>
                          <div style={{ fontWeight: 600 }}>{slot.course.code}</div>
                          <div style={{ opacity: 0.85 }}>{slot.course.name}</div>
                          <div style={{ opacity: 0.7, fontSize: 10 }}>{slot.venue.code}</div>
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
  );

  const renderProfileTab = () => (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Profile</span>
        <span className="badge badge-blue">Editable</span>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)' }}>
          {avatarPreview ? (
            <img src={avatarPreview} alt="Student avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <UserRound size={28} color="#64748b" />
          )}
        </div>
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{profileForm.name || 'Student profile'}</div>
          <div className="stat-lbl">{profileForm.student_group?.display || 'No group assigned'}</div>
          <label className="btn btn-ghost" style={{ marginTop: 12 }}>
            <Upload size={14} /> Change photo
            <input type="file" accept="image/png,image/jpeg" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </label>
          <div className="stat-lbl" style={{ marginTop: 6 }}>JPG or PNG, max 2 MB.</div>
          {fileMessage && <div style={{ marginTop: 8, color: '#b45309', fontSize: 12 }}>{fileMessage}</div>}
        </div>
      </div>

      <form onSubmit={saveProfile}>
        <div className="form-group">
          <label><UserRound size={12} /> Name</label>
          <input value={profileForm.name || ''} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your full name" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><Mail size={12} /> Email</label>
            <input type="email" value={profileForm.email || ''} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label><Phone size={12} /> Contact Number</label>
            <input value={profileForm.contact_number || ''} onChange={(event) => setProfileForm((current) => ({ ...current, contact_number: event.target.value }))} placeholder="07xxxxxxxx" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><BadgeInfo size={12} /> Registration Number</label>
            <input value={profileForm.registration_number || ''} readOnly />
          </div>
          <div className="form-group">
            <label><CalendarDays size={12} /> Student Group</label>
            <input value={profileForm.student_group?.display || ''} readOnly />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} placeholder="Enter current password" />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} placeholder="Enter new password" />
          </div>
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input type="password" value={passwordForm.confirm_password} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))} placeholder="Confirm new password" />
        </div>
        <div className="modal-footer" style={{ paddingTop: 4 }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderSubjectsTab = () => (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Enrolled Subjects</span>
        <span className="badge badge-green">{enrolledSubjects.length}</span>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {enrolledSubjects.length === 0 && <div style={{ color: '#64748b' }}>No enrolled subjects found.</div>}
        {enrolledSubjects.map((subject) => (
          <div key={subject.id} className="stat-card" style={{ padding: 14, justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{subject.code}</div>
              <div className="stat-lbl">{subject.name}</div>
            </div>
            <div className="badge badge-blue">{subject.credits} credits</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Notifications</span>
        <span className="badge badge-amber">{notifications.length}</span>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {notifications.length === 0 && <div style={{ color: '#64748b' }}>No class change notifications yet.</div>}
        {notifications.map((notification) => (
          <div key={notification.id} className="stat-card" style={{ alignItems: 'flex-start', padding: 14 }}>
            <div className="stat-icon" style={{ background: notification.is_read ? '#e2e8f0' : '#dbeafe', color: '#1e40af' }}>
              {notification.is_read ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{notification.title}</div>
              <div className="stat-lbl" style={{ marginTop: 4 }}>{notification.message}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge" style={getNotificationTone(notification.notification_type)}>{notification.notification_type}</span>
                <span className="badge badge-blue">{new Date(notification.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnnouncementsTab = () => (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Announcements</span>
        <span className="badge badge-blue">Faculty feed</span>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {announcements.length === 0 && <div style={{ color: '#64748b' }}>No announcements published yet.</div>}
        {announcements.map((announcement) => (
          <div key={announcement.id} className="stat-card" style={{ alignItems: 'flex-start', padding: 14 }}>
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}><Megaphone size={18} /></div>
            <div>
              <div style={{ fontWeight: 700 }}>{announcement.title}</div>
              <div className="stat-lbl" style={{ marginTop: 4 }}>{announcement.message}</div>
              <div style={{ marginTop: 8 }} className="badge badge-green">{announcement.audience.replace('_', ' ').toLowerCase()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'timetable':
        return renderTimetableTab();
      case 'profile':
        return renderProfileTab();
      case 'subjects':
        return renderSubjectsTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'announcements':
        return renderAnnouncementsTab();
      case 'dashboard':
      default:
        return renderDashboardTab();
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      {renderActiveTab()}
    </div>
  );
}