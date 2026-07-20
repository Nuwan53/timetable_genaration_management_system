import { useEffect, useState, useCallback } from 'react';
import { slots, courses, lecturers, venues, groups, timeslots } from '../api';
// eslint-disable-next-line no-unused-vars
import { Download, Plus, X } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

export default function Timetable() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [slotList, setSlotList]   = useState([]);
  const [allTimeslots, setAllTS]  = useState([]);
  const [filterLevel, setFL]      = useState('I');
  const [filterStream, setFS]     = useState('physical');
  const [filterSem, setFSem]      = useState('S2-2026');
  const [loading, setLoading]     = useState(true);

  // Form data
  const [showForm, setShowForm]   = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [clickedSlot, setClicked] = useState(null); // {timeslot_id, day}
  const [form, setForm]           = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [allCourses, setAllCourses]   = useState([]);
  const [allLecturers, setAllLect]    = useState([]);
  const [allVenues, setAllVenues]     = useState([]);
  const [allGroups, setAllGroups]     = useState([]);
  const [saving, setSaving]           = useState(false);

  const loadSlots = useCallback(() => {
    setLoading(true);
    slots.list({ level: filterLevel, stream: filterStream, semester: filterSem })
      .then(r => { setSlotList(r.data); setLoading(false); });
  }, [filterLevel, filterStream, filterSem]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadSlots(); }, [loadSlots]);

  useEffect(() => {
    timeslots.list().then(r => setAllTS(r.data));
    courses.list().then(r => setAllCourses(r.data));
    lecturers.list().then(r => setAllLect(r.data));
    venues.list().then(r => setAllVenues(r.data));
    groups.list().then(r => setAllGroups(r.data));
  }, []);

  // Unique times from timeslots
  const uniqueTimes = [...new Map(
    allTimeslots.map(ts => [ts.start_time, ts])
  ).values()].sort((a,b) => a.start_time.localeCompare(b.start_time));

  // Build grid: grid[day][start_time] = slot
  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; });
  slotList.forEach(slot => {
    const day   = slot.timeslot.day;
    const time  = slot.timeslot.start_time;
    grid[day][time] = slot;
  });

  const openAdd = (tsId, day) => {
    if (!isAdmin) return; // safety net — should never be reachable by non-admins anyway
    // eslint-disable-next-line no-unused-vars
    const ts = allTimeslots.find(t => t.id === tsId);
    const matchedGroups = allGroups.filter(g => g.level === filterLevel && g.stream === filterStream);
    setClicked({ timeslot_id: tsId, day });
    setConflicts([]);
    setForm({
      timeslot: tsId,
      semester: filterSem,
      selectedGroups: matchedGroups.map(g => g.id),
      course: '',
      lecturer: '',
      venue: '',
      notes: '',
    });
    setShowForm(true);
  };

  const deleteSlot = async (id, e) => {
    e.stopPropagation();
    if (!isAdmin) return;
    await slots.remove(id);
    toast.success('Slot removed');
    loadSlots();
  };

  const saveSlot = async () => {
    if (!form.selectedGroups || form.selectedGroups.length === 0) {
      toast.error('Please select at least one student group');
      return;
    }

    setSaving(true);
    setConflicts([]);

    const targets = form.selectedGroups;

    // allSettled — unlike Promise.all, this lets every group's create
    // attempt run independently. A conflict on one group no longer hides
    // the fact that the others already succeeded.
    const outcomes = await Promise.allSettled(
      targets.map(groupId =>
        slots.create({ ...form, group: groupId, selectedGroups: undefined })
      )
    );

    const succeededGroupIds = [];
    const failedGroupIds = [];
    const collectedConflicts = [];

    outcomes.forEach((outcome, index) => {
      const groupId = targets[index];
      if (outcome.status === 'fulfilled') {
        succeededGroupIds.push(groupId);
      } else {
        failedGroupIds.push(groupId);
        const data = outcome.reason?.response?.data;
        if (data?.conflicts?.length) {
          collectedConflicts.push(...data.conflicts);
        } else {
          const groupLabel = allGroups.find(g => g.id === groupId)?.display || `Group #${groupId}`;
          collectedConflicts.push(`${groupLabel}: could not be saved (${data?.detail || 'unknown error'})`);
        }
      }
    });

    // Always refresh — whatever DID save is now visible immediately,
    // instead of silently sitting in the DB until the next page load.
    loadSlots();
    setSaving(false);

    if (failedGroupIds.length === 0) {
      toast.success(`Slot added for ${succeededGroupIds.length} group(s)!`);
      setShowForm(false);
      return;
    }

    if (succeededGroupIds.length > 0) {
      toast.success(`Saved for ${succeededGroupIds.length} group(s) — ${failedGroupIds.length} had conflicts`);
    }

    // Re-target the form to ONLY the groups that actually failed, so a
    // retry can't recreate duplicates for groups that already succeeded —
    // this is what was causing the "conflicts never end" loop.
    setForm((current) => ({ ...current, selectedGroups: failedGroupIds }));
    setConflicts([...new Set(collectedConflicts)]);
  };

  const handlePdf = async () => {
    try {
      const res = await slots.exportPdf({ level: filterLevel, stream: filterStream, semester: filterSem });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable_${filterLevel}_${filterStream}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch { toast.error('Export failed'); }
  };

  const streamLabel = filterStream === 'physical' ? 'Physical Science' : 'Bio Science';

  return (
    <div>
      {/* Controls */}
      <div className="card">
        <div className="tt-controls">
          <div className="form-group" style={{margin:0}}>
            <label>Level</label>
            <select value={filterLevel} onChange={e=>setFL(e.target.value)}>
              <option value="I">Level I</option>
              <option value="II">Level II</option>
              <option value="III">Level III</option>
            </select>
          </div>
          <div className="form-group" style={{margin:0}}>
            <label>Stream</label>
            <select value={filterStream} onChange={e=>setFS(e.target.value)}>
              <option value="physical">Physical Science</option>
              <option value="bio">Bio Science</option>
            </select>
          </div>
          <div className="form-group" style={{margin:0}}>
            <label>Semester</label>
            <input value={filterSem} onChange={e=>setFSem(e.target.value)} style={{width:110}}/>
          </div>
          <button className="btn btn-green btn-sm" onClick={handlePdf} style={{marginTop:16}}>
            <Download size={14}/> Export PDF
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Level {filterLevel} — {streamLabel} — {filterSem}
          </span>
          {isAdmin ? (
            <span style={{fontSize:12,color:'#94a3b8'}}>Click empty cell to add a slot</span>
          ) : (
            <span className="badge badge-green">Read only</span>
          )}
        </div>
        {loading ? <div className="loading-center"><div className="spinner"/></div> : (
          <div className="tt-grid-wrap">
            <table className="tt-grid">
              <thead>
                <tr>
                  <th>Time</th>
                  {DAYS.map(d => <th key={d}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {uniqueTimes.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign:'center',color:'#94a3b8',padding:30}}>
                    No time slots defined yet. {isAdmin && <>Go to <strong>Time Slots</strong> to add them first.</>}
                  </td></tr>
                )}
                {uniqueTimes.map(ts => (
                  <tr key={ts.id}>
                    <td className="time-col">{ts.start_time.slice(0,5)}<br/><span style={{fontSize:9,opacity:.7}}>{ts.end_time.slice(0,5)}</span></td>
                    {DAYS.map(day => {
                      const tsForDay = allTimeslots.find(t => t.day === day && t.start_time === ts.start_time);
                      const slot = tsForDay ? grid[day][tsForDay.start_time] : null;
                      return (
                        <td
                          key={day}
                          onClick={() => isAdmin && !slot && tsForDay && openAdd(tsForDay.id, day)}
                        >
                          {slot ? (
                            <div className="slot-cell" style={{ cursor: isAdmin ? 'pointer' : 'default' }}>
                              <div style={{fontWeight:600}}>{slot.course.code}</div>
                              <div style={{opacity:.85}}>{slot.venue.code}</div>
                              <div style={{opacity:.7,fontSize:10}}>{slot.lecturer.name.split(' ').pop()}</div>
                              {isAdmin && (
                                <button className="slot-del btn" style={{background:'transparent',padding:0,color:'#fff',fontSize:12}}
                                  onClick={e => deleteSlot(slot.id, e)}>
                                  <X size={12}/>
                                </button>
                              )}
                            </div>
                          ) : (
                            tsForDay
                              ? (isAdmin
                                  ? <div className="empty-cell" title="Click to add"/>
                                  : <span style={{color:'#e2e8f0',fontSize:11}}>—</span>)
                              : <span style={{color:'#e2e8f0',fontSize:11}}>—</span>
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
      </div>

      {/* Add slot modal — Admin only, gated at both the trigger (openAdd) and here */}
      {showForm && isAdmin && (
        <Modal title="Add Timetable Slot" onClose={() => setShowForm(false)}>
          {conflicts.length > 0 && (
            <div className="conflict-list">
              <h4>⚠ Conflicts detected — please resolve before saving:</h4>
              <ul>{conflicts.map((c,i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
          <div className="form-group"><label>Course</label>
            <select value={form.course} onChange={e=>setForm({...form,course:e.target.value})}>
              <option value="">— Select course —</option>
              {allCourses.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Lecturer</label>
            <select value={form.lecturer} onChange={e=>setForm({...form,lecturer:e.target.value})}>
              <option value="">— Select lecturer —</option>
              {allLecturers.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Venue</label>
            <select value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}>
              <option value="">— Select venue —</option>
              {allVenues.map(v=><option key={v.id} value={v.id}>{v.code} — {v.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Student Groups (Select Multiple)</label>
            <div style={{border:'1px solid #e2e8f0',borderRadius:'6px',padding:'10px',maxHeight:'200px',overflowY:'auto'}}>
              {allGroups
                .filter(g => g.level === filterLevel && g.stream === filterStream)
                .map(g => (
                  <label key={g.id} style={{display:'block',marginBottom:'8px',cursor:'pointer',userSelect:'none'}}>
                    <input
                      type="checkbox"
                      checked={form.selectedGroups?.includes(g.id) || false}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm({...form, selectedGroups: [...(form.selectedGroups || []), g.id]});
                        } else {
                          setForm({...form, selectedGroups: form.selectedGroups.filter(id => id !== g.id)});
                        }
                      }}
                      style={{marginRight:'8px'}}
                    />
                    {g.display || String(g)}
                  </label>
                ))}
              {allGroups.filter(g => g.level === filterLevel && g.stream === filterStream).length === 0 && (
                <p style={{color:'#94a3b8',fontSize:'12px'}}>No groups available for this level/stream</p>
              )}
            </div>
          </div>
          <div className="form-group"><label>Notes (optional)</label>
            <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="e.g. W01–W06 only"/>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveSlot} disabled={saving}>
              {saving ? 'Checking conflicts...' : 'Save Slot'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}