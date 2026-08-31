import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { slots, courses, lecturers, venues, groups, timeslots } from '../api';
// eslint-disable-next-line no-unused-vars
import { Download, Plus, X, Upload as UploadIcon, EyeOff, Users } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

// Two AGGREGATED cells count as "the same session" (mergeable across hours)
// if course/lecturer/venue match. Group membership is intentionally NOT
// part of this check — a cell already represents every group attending
// that class, whether it's 1 group or many (a combined lecture).
function sameSession(a, b) {
  return (
    a.course.id === b.course.id &&
    a.lecturer.id === b.lecturer.id &&
    a.venue.id === b.venue.id
  );
}

export default function Timetable() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const loadRequestIdRef = useRef(0);

  const [slotList, setSlotList]   = useState([]);
  const [allTimeslots, setAllTS]  = useState([]);
  const [filterLevel, setFL]      = useState('I');
  const [filterStream, setFS]     = useState('physical');
  const [filterSem, setFSem]      = useState('S2-2026');
  const [loading, setLoading]     = useState(true);
  const [publishing, setPublishing] = useState(false);

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
    const requestId = ++loadRequestIdRef.current;
    slots.list({ level: filterLevel, stream: filterStream, semester: filterSem })
      .then(r => {
        // If a NEWER load has started since this one fired, this response
        // is stale — ignore it so it can't overwrite fresher data.
        if (requestId !== loadRequestIdRef.current) return;
        setSlotList(r.data);
        setLoading(false);
      });
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

  // ---- Aggregated grid: grid[day][start_time] = { course, lecturer,
  // venue, timeslot, ids: [...all ScheduleSlot ids sharing this class],
  // groups: [...all group display names attending] }
  // Every ScheduleSlot row for the same day+time+course+lecturer+venue
  // gets folded into ONE cell, instead of one silently overwriting another. ----
  const grid = useMemo(() => {
    const g = {};
    DAYS.forEach(d => { g[d] = {}; });

    slotList.forEach(slot => {
      const day = slot.timeslot.day;
      const time = slot.timeslot.start_time;
      const existing = g[day][time];

      if (!existing) {
        g[day][time] = {
          course: slot.course,
          lecturer: slot.lecturer,
          venue: slot.venue,
          timeslot: slot.timeslot,
          is_published: slot.is_published,
          ids: [slot.id],
          groups: [slot.group.display || String(slot.group)],
        };
      } else {
        // Same course+lecturer+venue+time already recorded (a combined
        // lecture) — fold this group into the existing cell rather than
        // overwriting it.
        existing.ids.push(slot.id);
        existing.groups.push(slot.group.display || String(slot.group));
        if (!slot.is_published) existing.is_published = false;
      }
    });

    return g;
  }, [slotList]);

  // ---- Merge layout: for each day, figure out which cells are the START
  // of a multi-hour run (get a rowSpan + all slot ids across the run) and
  // which cells are CONTINUATIONS (render nothing — covered by the
  // rowSpan above). Relies on uniqueTimes already being sorted hourly
  // with no gaps, so array-adjacency == time-adjacency. ----
  const dayLayouts = useMemo(() => {
    const layouts = {};
    DAYS.forEach((day) => {
      const layout = {};
      let i = 0;
      while (i < uniqueTimes.length) {
        const ts = uniqueTimes[i];
        const cell = grid[day][ts.start_time];

        if (!cell) {
          layout[ts.start_time] = { skip: false, rowSpan: 1, cell: null, allIds: [] };
          i += 1;
          continue;
        }

        let span = 1;
        let j = i + 1;
        while (j < uniqueTimes.length) {
          const nextCell = grid[day][uniqueTimes[j].start_time];
          if (nextCell && sameSession(cell, nextCell)) {
            span += 1;
            j += 1;
          } else {
            break;
          }
        }

        const allIds = [];
        for (let k = i; k < i + span; k++) {
          const c = grid[day][uniqueTimes[k].start_time];
          if (c) allIds.push(...c.ids);
        }

        layout[ts.start_time] = { skip: false, rowSpan: span, cell, allIds };
        for (let k = i + 1; k < i + span; k++) {
          layout[uniqueTimes[k].start_time] = { skip: true };
        }

        i = j;
      }
      layouts[day] = layout;
    });
    return layouts;
  }, [grid, uniqueTimes]);

  const draftCount = useMemo(() => slotList.filter(s => !s.is_published).length, [slotList]);
  const publishedCount = slotList.length - draftCount;

  const openAdd = (tsId, day) => {
    if (!isAdmin) return;
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

  const deleteSlot = async (ids, groupCount, e) => {
    e.stopPropagation();
    if (!isAdmin || !ids || ids.length === 0) return;

    if (groupCount > 1) {
      const confirmed = window.confirm(
        `This class is shared across ${groupCount} student group(s). Deleting it will remove it for all of them. Continue?`
      );
      if (!confirmed) return;
    }

    // Optimistic update — remove it from local state immediately, so the
    // cell disappears the instant you click, with no wait on the network
    // round-trip and no window for a race condition to show stale data.
    const idSet = new Set(ids);
    setSlotList((current) => current.filter((s) => !idSet.has(s.id)));

    try {
      await Promise.all(ids.map(id => slots.remove(id)));
      toast.success(`Removed (${ids.length} record${ids.length > 1 ? 's' : ''})`);
    } catch {
      toast.error('Delete failed — restoring');
    } finally {
      // Resync with the server either way — confirms success, or restores
      // the correct state if the delete actually failed server-side.
      loadSlots();
    }
  };

  const saveSlot = async () => {
    if (!form.selectedGroups || form.selectedGroups.length === 0) {
      toast.error('Please select at least one student group');
      return;
    }

    setSaving(true);
    setConflicts([]);

    const targets = form.selectedGroups;

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

    loadSlots();
    setSaving(false);

    if (failedGroupIds.length === 0) {
      toast.success(`Slot added for ${succeededGroupIds.length} group(s) — still in draft, not visible to students/lecturers yet`);
      setShowForm(false);
      return;
    }

    if (succeededGroupIds.length > 0) {
      toast.success(`Saved for ${succeededGroupIds.length} group(s) — ${failedGroupIds.length} had conflicts`);
    }

    setForm((current) => ({ ...current, selectedGroups: failedGroupIds }));
    setConflicts([...new Set(collectedConflicts)]);
  };

  const handlePublish = async (action) => {
    const isPublish = action === 'publish';
    if (!isPublish && !window.confirm('Unpublish this timetable? Students and lecturers will no longer see it until you publish again.')) {
      return;
    }

    setPublishing(true);
    try {
      const { data } = await api.post('/admin/timetable/publish/', {
        level: filterLevel, stream: filterStream, semester: filterSem, action,
      });
      toast.success(
        isPublish
          ? `${data.updated_count} classes published — now visible to students and lecturers`
          : `${data.updated_count} classes moved back to draft`
      );
      loadSlots();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action}`);
    } finally {
      setPublishing(false);
    }
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

          {isAdmin && (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handlePublish('publish')}
                disabled={publishing || draftCount === 0}
                style={{ marginTop: 16 }}
                title={draftCount === 0 ? 'Nothing in draft to publish' : `Publish ${draftCount} draft classes`}
              >
                <UploadIcon size={14}/> Publish {draftCount > 0 ? `(${draftCount})` : ''}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handlePublish('unpublish')}
                disabled={publishing || publishedCount === 0}
                style={{ marginTop: 16, border: '1px solid var(--border)' }}
                title={publishedCount === 0 ? 'Nothing published to revert' : 'Revert published classes back to draft'}
              >
                <EyeOff size={14}/> Unpublish
              </button>
            </>
          )}

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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isAdmin && draftCount > 0 && (
              <span className="badge badge-amber">{draftCount} draft</span>
            )}
            {isAdmin && publishedCount > 0 && (
              <span className="badge badge-green">{publishedCount} published</span>
            )}
            {isAdmin ? (
              <span style={{fontSize:12,color:'#94a3b8'}}>Click empty cell to add a slot</span>
            ) : (
              <span className="badge badge-green">Read only</span>
            )}
          </div>
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
                    <td className="time-col">{ts.start_time.slice(0,5)}<br/><span style={{ fontSize: 9, opacity: .7 }}>{ts.end_time.slice(0,5)}</span></td>
                    {DAYS.map(day => {
                      const layoutInfo = dayLayouts[day]?.[ts.start_time];
                      if (!layoutInfo || layoutInfo.skip) return null; // covered by a rowSpan above

                      const { rowSpan, cell, allIds } = layoutInfo;
                      const tsForDay = allTimeslots.find(t => t.day === day && t.start_time === ts.start_time);
                      const isDraft = cell && isAdmin && !cell.is_published;
                      const groupCount = cell ? cell.groups.length : 0;

                      return (
                        <td
                          key={day}
                          rowSpan={rowSpan}
                          onClick={() => isAdmin && !cell && tsForDay && openAdd(tsForDay.id, day)}
                        >
                          {cell ? (
                            <div
                              className="slot-cell"
                              title={groupCount > 1 ? `Groups: ${cell.groups.join(', ')}` : undefined}
                              style={{
                                cursor: isAdmin ? 'pointer' : 'default',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                ...(isDraft ? {
                                  background: '#f39c12',
                                  border: '1.5px dashed #b45309',
                                } : {}),
                              }}
                            >
                              {isDraft && (
                                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, opacity: 0.9, marginBottom: 2 }}>
                                  DRAFT
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                                {rowSpan > 1 && (
                                  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.4, opacity: 0.75 }}>
                                    {rowSpan}H
                                  </span>
                                )}
                                {groupCount > 1 && (
                                  <span style={{ fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2, opacity: 0.85 }}>
                                    <Users size={9} /> {groupCount}
                                  </span>
                                )}
                              </div>
                              <div style={{fontWeight:600}}>{cell.course.code}</div>
                              <div style={{opacity:.85}}>{cell.venue.code}</div>
                              <div style={{opacity:.7,fontSize:10}}>{cell.lecturer.name.split(' ').pop()}</div>
                              {isAdmin && (
                                <button className="slot-del btn" style={{background:'transparent',padding:0,color:'#fff',fontSize:12}}
                                  onClick={e => deleteSlot(allIds, groupCount, e)}>
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

          <div className="login-note-box" style={{ marginBottom: 16 }}>
            <div className="login-note" style={{ textAlign: 'left', margin: 0 }}>
              New slots are saved as <strong>draft</strong> — students and lecturers won't see this
              until you click <strong>Publish</strong>. Ticking multiple groups creates one combined
              class (shown with a group-count badge). Adding the same course/lecturer/venue to
              consecutive hours merges them into one taller cell.
            </div>
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

          <div className="form-group">
            <label>Course</label>
            <select value={form.course} onChange={e=>setForm({...form,course:e.target.value})}>
              <option value="">— Select course —</option>
              {allCourses.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Lecturer</label>
            <select value={form.lecturer} onChange={e=>setForm({...form,lecturer:e.target.value})}>
              <option value="">— Select lecturer —</option>
              {Object.entries(
                allLecturers.reduce((groupsByDept, l) => {
                  const dept = l.department?.trim() || 'No Department Set';
                  if (!groupsByDept[dept]) groupsByDept[dept] = [];
                  groupsByDept[dept].push(l);
                  return groupsByDept;
                }, {})
              )
                .sort(([deptA], [deptB]) => deptA.localeCompare(deptB))
                .map(([dept, lecturersInDept]) => (
                  <optgroup key={dept} label={dept}>
                    {lecturersInDept
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                  </optgroup>
                ))}
            </select>
          </div>
          <div className="form-group"><label>Venue</label>
            <select value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}>
              <option value="">— Select venue —</option>
              {allVenues.map(v=><option key={v.id} value={v.id}>{v.code} — {v.name}</option>)}
            </select>
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
