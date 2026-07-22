/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wand2, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const VENUE_TYPES = [
  { value: '', label: 'Any venue type' },
  { value: 'lecture', label: 'Lecture Hall' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'auditorium', label: 'Auditorium' },
];

export default function AutoScheduler() {
  const [groupsList, setGroupsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [lecturersList, setLecturersList] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [groupId, setGroupId] = useState('');
  const [semester, setSemester] = useState('S2-2026');
  const [requirements, setRequirements] = useState([{ course_id: '', lecturer_id: '', venue_type: '' }]);

  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [groupsRes, coursesRes, lecturersRes] = await Promise.all([
          api.get('/groups/'),
          api.get('/courses/'),
          api.get('/lecturers/'),
        ]);
        setGroupsList(groupsRes.data);
        setCoursesList(coursesRes.data);
        setLecturersList(lecturersRes.data);
      } catch (error) {
        toast.error('Failed to load groups/courses/lecturers');
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  const addRequirement = () => {
    setRequirements((current) => [...current, { course_id: '', lecturer_id: '', venue_type: '' }]);
  };

  const removeRequirement = (index) => {
    setRequirements((current) => current.filter((_, i) => i !== index));
  };

  const updateRequirement = (index, field, value) => {
    setRequirements((current) =>
      current.map((req, i) => (i === index ? { ...req, [field]: value } : req))
    );
  };

  const handleGenerate = async () => {
    if (!groupId) {
      toast.error('Please select a student group');
      return;
    }
    const incomplete = requirements.some((r) => !r.course_id || !r.lecturer_id);
    if (incomplete) {
      toast.error('Every row needs a course and a lecturer selected');
      return;
    }

    setGenerating(true);
    setPreview(null);
    try {
      const { data } = await api.post('/admin/scheduling/auto-generate/', {
        group_id: groupId,
        semester,
        requirements: requirements.map((r) => ({
          course_id: r.course_id,
          lecturer_id: r.lecturer_id,
          venue_type: r.venue_type || undefined,
        })),
      });
      setPreview(data);
      if (data.is_complete) {
        toast.success(`All ${data.assigned_count} classes placed with zero conflicts`);
      } else {
        toast.error(`${data.assigned_count} placed, ${data.unassigned_count} could not be fit in — try adjusting`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    const toCreate = preview.results.filter((r) => r.status === 'assigned');
    if (toCreate.length === 0) {
      toast.error('Nothing to apply — no classes were successfully placed');
      return;
    }

    setApplying(true);
    let created = 0;
    let failed = 0;

    for (const item of toCreate) {
      try {
        // NOTE: verify this matches the endpoint your Timetable.jsx page
        // already uses to create a ScheduleSlot — adjust the path/payload
        // shape below if it differs (e.g. different field names).
        await api.post('/schedule-slots/', {
          course: item.course_id,
          lecturer: item.lecturer_id,
          venue: item.venue_id,
          timeslot: item.timeslot_id,
          group: groupId,
          semester,
        });
        created += 1;
      } catch (error) {
        failed += 1;
      }
    }

    setApplying(false);
    if (failed === 0) {
      toast.success(`${created} classes added to the timetable`);
      setPreview(null);
      setRequirements([{ course_id: '', lecturer_id: '', venue_type: '' }]);
    } else {
      toast.error(`${created} created, ${failed} failed — check the Timetable page for conflicts`);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Automated Timetable Generator</span>
          <Wand2 size={16} />
        </div>

        <div className="login-note-box" style={{ marginBottom: 20 }}>
          <div className="login-note-title">How it works</div>
          <div className="login-note" style={{ textAlign: 'left' }}>
            Pick a student group, list the courses (with lecturers) that need scheduling, and the
            system runs a backtracking search to find a conflict-free arrangement — checking
            lecturer availability, venue availability, and the group's own schedule all at once.
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Student Group</label>
            <select value={groupId} onChange={(event) => setGroupId(event.target.value)} disabled={loadingOptions}>
              <option value="">{loadingOptions ? 'Loading...' : 'Select a group'}</option>
              {groupsList.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.level} · {group.stream} {group.subgroup ? `(${group.subgroup})` : ''} · {group.year}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Semester</label>
            <input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="S2-2026" />
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Courses to Schedule</div>
          {requirements.map((req, index) => (
            <div key={index} className="form-row" style={{ alignItems: 'flex-end', marginBottom: 4 }}>
              <div className="form-group">
                <label>Course</label>
                <select value={req.course_id} onChange={(event) => updateRequirement(index, 'course_id', event.target.value)}>
                  <option value="">Select course</option>
                  {coursesList.map((course) => (
                    <option key={course.id} value={course.id}>{course.code} · {course.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Lecturer</label>
                <select value={req.lecturer_id} onChange={(event) => updateRequirement(index, 'lecturer_id', event.target.value)}>
                  <option value="">Select lecturer</option>
                  {lecturersList.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Venue Type</label>
                <select value={req.venue_type} onChange={(event) => updateRequirement(index, 'venue_type', event.target.value)}>
                  {VENUE_TYPES.map((vt) => <option key={vt.value} value={vt.value}>{vt.label}</option>)}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeRequirement(index)}
                disabled={requirements.length === 1}
                style={{ marginBottom: 14 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-ghost btn-sm" onClick={addRequirement} style={{ marginTop: 8 }}>
            <Plus size={14} /> Add Another Course
          </button>
        </div>

        <div className="modal-footer" style={{ marginTop: 20 }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            <Wand2 size={14} /> {generating ? 'Generating...' : 'Generate Conflict-Free Schedule'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Preview</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {preview.is_complete ? (
                <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} /> All {preview.assigned_count} placed
                </span>
              ) : (
                <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> {preview.unassigned_count} could not be placed
                </span>
              )}
            </div>
          </div>

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Lecturer</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.results.map((row, index) => (
                  <tr key={index}>
                    <td>{row.course_code} · {row.course_name}</td>
                    <td>{row.lecturer_name}</td>
                    <td>{row.day || '—'}</td>
                    <td>{row.status === 'assigned' ? `${row.start_time} - ${row.end_time}` : '—'}</td>
                    <td>{row.venue_code || '—'}</td>
                    <td>
                      <span className={row.status === 'assigned' ? 'badge badge-green' : 'badge badge-amber'}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-footer" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleApply} disabled={applying || preview.assigned_count === 0}>
              {applying ? 'Applying...' : `Apply ${preview.assigned_count} Classes to Timetable`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}