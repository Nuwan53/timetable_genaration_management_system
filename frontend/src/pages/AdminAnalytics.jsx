import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarSearch, LayoutGrid, MapPin, UserRound } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TABS = [
  { key: 'overview', label: 'Overview', icon: <LayoutGrid size={15} /> },
  { key: 'freeslots', label: 'Free Slot Finder', icon: <CalendarSearch size={15} /> },
];

// (Palette generated dynamically using var(--accent-primary) and fillOpacity)

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [semester, setSemester] = useState('S2-2026');

  // ---------- Overview tab state ----------
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      setSummaryLoading(true);
      try {
        const { data } = await api.get('/admin/analytics/summary/', { params: { semester } });
        setSummary(data);
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to load analytics summary');
      } finally {
        setSummaryLoading(false);
      }
    };
    if (activeTab === 'overview') {
      loadSummary();
    }
  }, [activeTab, semester]);

  // ---------- Free Slot Finder tab state (unchanged from before) ----------
  const [mode, setMode] = useState('venue');
  const [venues, setVenues] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

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
    setLoadingSlots(true);
    try {
      const { data } = await api.get('/admin/analytics/free-slots/', {
        params: { type: mode, id: selectedId, semester },
      });
      setSlots(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load availability');
    } finally {
      setLoadingSlots(false);
    }
  };

  const uniqueTimes = useMemo(() => {
    const times = new Map();
    slots.forEach((slot) => times.set(slot.start_time, slot));
    return [...times.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [slots]);

  const findSlot = (day, startTime) => slots.find((slot) => slot.day === day && slot.start_time === startTime);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Analytics</span>
          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="S2-2026" />
          </div>
        </div>

        <div className="dash-tabs" role="tablist" aria-label="Analytics sections" style={{ marginBottom: 20 }}>
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
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ---------------- Overview tab ---------------- */}
        {activeTab === 'overview' && (
          <>
            {summaryLoading && <div className="loading-center"><div className="spinner" /></div>}

            {!summaryLoading && summary && (
              <div style={{ display: 'grid', gap: 24 }}>
                {/* Chart 1: Room utilization */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Room Utilization (%)</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={summary.room_utilization} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="venue_code" fontSize={12} stroke="var(--text-muted)" tick={{ fill: 'var(--text)' }} />
                      <YAxis fontSize={12} unit="%" stroke="var(--text-muted)" tick={{ fill: 'var(--text)' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        itemStyle={{ color: 'var(--primary)' }} 
                        formatter={(value) => [`${value}%`, 'Utilization']} 
                        labelFormatter={(label) => `Venue: ${label}`} 
                      />
                      <Bar dataKey="utilization_pct" radius={[6, 6, 0, 0]}>
                        {summary.room_utilization.map((_, index) => (
                          <Cell key={index} fill="var(--primary)" fillOpacity={Math.max(0.3, 1 - (index * 0.15))} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table: Room utilization detail */}
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Venue</th>
                        <th>Name</th>
                        <th>Booked Slots</th>
                        <th>Total Slots</th>
                        <th>Utilization</th>
                        
                      </tr>
                    </thead>
                    <tbody>
                      {summary.room_utilization.map((row) => (
                        <tr key={row.venue_code}>
                          <td>{row.venue_code}</td>
                          <td>{row.venue_name}</td>
                          <td>{row.booked_slots}</td>
                          <td>{row.total_slots}</td>
                          <td>
                            <span className={row.utilization_pct >= 70 ? 'badge badge-amber' : 'badge badge-green'}>
                              {row.utilization_pct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chart 2: Lecturer workload */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Lecturer Weekly Teaching Hours</div>
                  <ResponsiveContainer width="100%" height={Math.max(280, summary.lecturer_workload.length * 34)}>
                    <BarChart
                      data={summary.lecturer_workload}
                      layout="vertical"
                      margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" fontSize={12} unit="h" stroke="var(--text-muted)" tick={{ fill: 'var(--text)' }} />
                      <YAxis type="category" dataKey="lecturer_name" fontSize={11} width={140} stroke="var(--text-muted)" tick={{ fill: 'var(--text)' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        itemStyle={{ color: 'var(--primary)' }}
                        formatter={(value) => [`${value} hrs`, 'Weekly hours']} 
                      />
                      <Bar dataKey="weekly_hours" radius={[0, 6, 6, 0]}>
                        {summary.lecturer_workload.map((_, index) => (
                          <Cell key={index} fill="var(--primary)" fillOpacity={Math.max(0.3, 1 - (index * 0.1))} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table: Lecturer workload detail */}
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Lecturer</th>
                        <th>Classes</th>
                        <th>Weekly Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.lecturer_workload.map((row) => (
                        <tr key={row.lecturer_name}>
                          <td>{row.lecturer_name}</td>
                          <td>{row.classes_count}</td>
                          <td>{row.weekly_hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chart 3: Classes per day */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Classes Scheduled Per Day</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={summary.day_distribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" fontSize={12} stroke="var(--text-muted)" tick={{ fill: 'var(--text)' }} />
                      <YAxis fontSize={12} allowDecimals={false} stroke="var(--text-muted)" tick={{ fill: 'var(--text)' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        itemStyle={{ color: 'var(--primary)' }}
                      />
                      <Bar dataKey="classes" radius={[6, 6, 0, 0]}>
                        {summary.day_distribution.map((_, index) => (
                          <Cell key={index} fill="var(--primary)" fillOpacity={Math.max(0.3, 1 - (index * 0.15))} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table: Busiest time slots */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Busiest Time Slots</div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Time</th>
                          <th>Concurrent Classes (all venues)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.busiest_times.map((row, index) => (
                          <tr key={`${row.day}-${row.time}-${index}`}>
                            <td>{row.day}</td>
                            <td>{row.time}</td>
                            <td><span className="badge badge-blue">{row.count}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ---------------- Free Slot Finder tab (unchanged logic) ---------------- */}
        {activeTab === 'freeslots' && (
          <>
            <div className="role-tabs" style={{ maxWidth: 320, marginBottom: 20 }}>
              <button type="button" className={`role-tab${mode === 'venue' ? ' active' : ''}`} onClick={() => setMode('venue')}>
                <MapPin size={14} /> Venue
              </button>
              <button type="button" className={`role-tab${mode === 'lecturer' ? ' active' : ''}`} onClick={() => setMode('lecturer')}>
                <UserRound size={14} /> Lecturer
              </button>
            </div>

            <div className="tt-controls">
              <div className="form-group" style={{ margin: 0, minWidth: 240 }}>
                <label>{mode === 'venue' ? 'Select Venue' : 'Select Lecturer'}</label>
                <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={loadingOptions}>
                  <option value="">{loadingOptions ? 'Loading...' : `Choose a ${mode}`}</option>
                  {mode === 'venue'
                    ? venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.code} · {venue.name}</option>)
                    : lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={fetchFreeSlots} disabled={loadingSlots} style={{ alignSelf: 'flex-end', marginBottom: 14 }}>
                {loadingSlots ? 'Checking...' : 'Check Availability'}
              </button>
            </div>

            {slots.length > 0 && (
              <div className="tt-grid-wrap">
                <table className="tt-grid">
                  <thead>
                    <tr>
                      <th>Time</th>
                      {DAYS.map((day) => (
                        <th key={day}>{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueTimes.map((timeSlot) => (
                      <tr key={timeSlot.start_time}>
                        <td>{timeSlot.start_time}</td>
                        {DAYS.map((day) => {
                          const slot = findSlot(day, timeSlot.start_time);
                          if (!slot) {
                            return (
                              <td key={day}>
                                <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>
                              </td>
                            );
                          }
                          return (
                            <td key={day}>
                              {slot.is_free ? (
                                <span className="badge badge-green" style={{ width: '100%', display: 'block', padding: '8px 4px' }}>
                                  Free
                                </span>
                              ) : (
                                <div className="free-slot-wrap">
                                  <span style={{ display: 'block', padding: '8px 4px', background: '#f1f5f9', borderRadius: 6, color: '#94a3b8', fontSize: 11, cursor: 'help' }}>
                                    Booked
                                  </span>
                                  <div className="free-slot-tooltip">
                                    {slot.occupants && slot.occupants.length > 0 ? (
                                      slot.occupants.map((occupant, index) => (
                                        <div className="free-slot-tooltip-row" key={index}>
                                          <div className="free-slot-tooltip-title">
                                            {occupant.course_code} — {occupant.course_name}
                                          </div>
                                          {mode === 'venue' ? (
                                            <div>Lecturer: {occupant.lecturer_name}</div>
                                          ) : (
                                            <div>Venue: {occupant.venue_code}</div>
                                          )}
                                          <div>Group: {occupant.group_display}</div>
                                        </div>
                                      ))
                                    ) : (
                                      <div>No details available</div>
                                    )}
                                  </div>
                                </div>
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

            {!loadingSlots && slots.length === 0 && (
              <div style={{ color: '#64748b', padding: '12px 0' }}>
                Select a {mode} and click "Check Availability" to see free time slots.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
