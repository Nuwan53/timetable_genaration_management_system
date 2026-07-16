import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarSearch, MapPin, UserRound } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}); // NOTE: adjust this import to match whatever your api.js
                              // exports as the shared axios instance (see note below)

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function AdminAnalytics() {
  const [mode, setMode] = useState('venue'); // 'venue' | 'lecturer'
  const [venues, setVenues] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [semester, setSemester] = useState('S2-2026');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load venue + lecturer dropdown options once
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [venuesRes, lecturersRes] = await Promise.all([
          api.get('/venues/'),
          api.get('/lecturers/'),
        ]);
        setVenues(venuesRes.data);
        setLecturers(lecturersRes.data);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error('Failed to load venues/lecturers list');
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  // Reset selection when switching mode
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId('');
    setSlots([]);
  }, [mode]);

  const fetchFreeSlots = async () => {
    if (!selectedId) {
      toast.error(`Please select a ${mode}`);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/admin/analytics/free-slots/', {
        params: { type: mode, id: selectedId, semester },
      });
      setSlots(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const uniqueTimes = useMemo(() => {
    const times = new Map();
    slots.forEach((slot) => {
      times.set(slot.start_time, slot);
    });
    return [...times.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [slots]);

  const findSlot = (day, startTime) =>
    slots.find((slot) => slot.day === day && slot.start_time === startTime);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Venue & Lecturer Availability</span>
          <CalendarSearch size={16} />
        </div>

        {/* mode toggle — reuses the same visual language as your role-tabs */}
        <div className="role-tabs" style={{ maxWidth: 320, marginBottom: 20 }}>
          <button
            type="button"
            className={`role-tab${mode === 'venue' ? ' active' : ''}`}
            onClick={() => setMode('venue')}
          >
            <MapPin size={14} /> Venue
          </button>
          <button
            type="button"
            className={`role-tab${mode === 'lecturer' ? ' active' : ''}`}
            onClick={() => setMode('lecturer')}
          >
            <UserRound size={14} /> Lecturer
          </button>
        </div>

        <div className="tt-controls">
          <div className="form-group" style={{ margin: 0, minWidth: 240 }}>
            <label>{mode === 'venue' ? 'Select Venue' : 'Select Lecturer'}</label>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={loadingOptions}
            >
              <option value="">
                {loadingOptions ? 'Loading...' : `Choose a ${mode}`}
              </option>
              {mode === 'venue'
                ? venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.code} · {venue.name}
                    </option>
                  ))
                : lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name}
                    </option>
                  ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <label>Semester</label>
            <input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="S2-2026" />
          </div>

          <button className="btn btn-primary" onClick={fetchFreeSlots} disabled={loading} style={{ alignSelf: 'flex-end', marginBottom: 14 }}>
            {loading ? 'Checking...' : 'Check Availability'}
          </button>
        </div>

        {slots.length > 0 && (
          <div className="tt-grid-wrap">
            <table className="tt-grid">
              <thead>
                <tr>
                  <th>Time</th>
                  {DAYS.map((day) => <th key={day}>{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {uniqueTimes.map((timeSlot) => (
                  <tr key={timeSlot.id}>
                    <td className="time-col">
                      {timeSlot.start_time}
                      <br />
                      <span style={{ fontSize: 9, opacity: 0.7 }}>{timeSlot.end_time}</span>
                    </td>
                    {DAYS.map((day) => {
                      const slot = findSlot(day, timeSlot.start_time);
                      if (!slot) {
                        return <td key={day}><span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span></td>;
                      }
                      return (
                        <td key={day}>
                          {slot.is_free ? (
                            <span className="badge badge-green" style={{ width: '100%', display: 'block', padding: '8px 4px' }}>
                              Free
                            </span>
                          ) : (
                            <span style={{ display: 'block', padding: '8px 4px', background: '#f1f5f9', borderRadius: 6, color: '#94a3b8', fontSize: 11 }}>
                              Booked
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && slots.length === 0 && (
          <div style={{ color: '#64748b', padding: '12px 0' }}>
            Select a {mode} and click "Check Availability" to see free time slots.
          </div>
        )}
      </div>
    </div>
  );
}